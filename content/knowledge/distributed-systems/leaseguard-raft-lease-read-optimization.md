---
title: LeaseGuard (로그가 곧 리스인 Raft 리더 리스와 두 가지 가용성 최적화)
aka: [LeaseGuard, Raft Leases Done Right, Log-based Lease, Deferred Commit Writes, Inherited Lease Reads, Limbo Region, 로그 기반 리스, 림보 영역]
category: distributed-systems
level: advanced
summary: Raft 의 Leader Completeness 를 이용해 "로그 항목의 시각이 리스"가 되게 한 리더 리스. 선거 규칙은 그대로 두고, 새 리더가 쓰기를 미리 받아 두고(deferred commit) 일부 읽기를 바로 처리(inherited lease reads)한다.
tags: [raft, lease-read, leaseguard, linearizability, bounded-uncertainty-clock, tla-plus, mongodb, logcabin, sigmod]
related: [distributed-systems/raft-consensus, distributed-systems/raft-read-index, distributed-systems/raft-lease-read-monotonic-clock, distributed-systems/leader-lease-clock-assumptions, distributed-systems/raft-prevote-checkquorum-lease-interplay, distributed-systems/cockroachdb-leader-leases-liveness-fabric, distributed-systems/cockroachdb-lease-types, distributed-systems/hybrid-logical-clock, distributed-systems/clock-boottime-vs-monotonic, distributed-systems/spanner-truetime, distributed-systems/consistency-models, distributed-systems/paxos-vs-raft]
sources:
  - https://arxiv.org/abs/2512.15659
  - https://arxiv.org/pdf/2512.15659
  - https://doi.org/10.1145/3786663
  - https://github.com/muratdem/RaftLeaderLeases
  - https://github.com/mongodb-labs/logcabin/tree/leaseguard
  - https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf
updatedAt: 2026-11-24
---

[리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)은 "하트비트로 얻은 시간 약속"에 기대는 전통 리스를, [Raft 리스 읽기와 단조 시계](/develop-wiki/knowledge/distributed-systems/raft-lease-read-monotonic-clock/)는 그 구현을 다뤘다. 이 노트는 같은 문제를 다르게 푸는 논문 한 편이다. 리스를 하트비트가 아니라 **로그 항목의 타임스탬프**로 표현한다.

## 논문 정체

| 항목 | 내용 (arXiv 초록 페이지·PDF 에서 확인) |
| --- | --- |
| 제목 | LeaseGuard: Raft Leases Done Right |
| 저자 | A. Jesse Jiryu Davis, Murat Demirbas (MongoDB Research), Lingzhi Deng (MongoDB) |
| arXiv | 2512.15659 [cs.DC], v1 2025-12-17, v2 2025-12-19 (이 노트는 v2 를 읽음) |
| 게재 | 첫 쪽 각주: ACM SIGMOD 2026 채택, 저자 채택본. arXiv 가 관련 DOI 10.1145/3786663 을 표기하고, Crossref 는 이를 Proceedings of the ACM on Management of Data 4권 1호(2026-04-02), 1~25쪽으로 등록. |
| 구현·명세 | TLA+ 와 Python 시뮬레이터는 `muratdem/RaftLeaderLeases`(MIT), C++ 구현은 `mongodb-labs/logcabin` 의 `leaseguard` 브랜치 |

LogCabin 저장소는 라이선스 메타데이터가 확정되지 않아(API 상 NOASSERTION) 코드를 인용하지 않았다.

## 문제

선형화 가능한 읽기를 Raft 리더가 처리할 때 위험은 "내가 이미 폐위된 리더인데 모르는 것"이다. 논문이 정리한 선택지는 둘이다.

- **읽기마다 쿼럼 확인.** 안전하지만 읽기마다 과반과 메시지를 주고받는다. 논문은 지연·I/O 경합·클라우드 비용을 든다. MongoDB 는 읽기마다 빈 로그 항목을 쓰고 과반 복제를 기다리는 방식을 쓴다고 적는다. 같은 계열의 [ReadIndex](/develop-wiki/knowledge/distributed-systems/raft-read-index/)도 하트비트 확인을 쓴다.
- **리더 리스.** 박사논문(Ongaro, 6.4.1절)의 방식이 원형이다. 리더가 하트비트로 과반 응답을 받으면 팔로워들은 일정 시간 투표하지 않기로 약속하고, 그동안 리더는 로컬로 읽는다.

논문은 기존 리스의 약점을 이렇게 든다(논문 서술, 주장의 귀속은 논문).

1. 명세가 모호해서 구현이 틀린다. HashiCorp Raft(2016 보고)와 etcd raft(2024 보고)의 이슈를 근거로 들고, 작성 시점에 모두 열려 있었다고 쓴다.
2. 선거를 늦추기 때문에 **새 리더는 옛 리더의 리스가 끝날 때까지 읽기와 쓰기를 못 한다.** TiDB Placement Driver 의 10초 리더 리스(선거 후 10초 불가용)를 예로 든다.
3. 대기 중 쌓인 요청이 리스 획득 직후 몰려(thundering herd) 준안정 장애를 부를 수 있다.
4. 하트비트만 보내고 쓰기는 못 하는 "가짜 리더"(gray failure)가 리스를 계속 갱신할 수 있다.

## 핵심 아이디어: 로그가 리스다

논문의 설계 선언은 "Raft 메시지·자료구조·선거 프로토콜을 바꾸지 않는다, 로그가 곧 리스"다. 근거는 Raft 의 **Leader Completeness**(과반에 복제돼 커밋된 항목은 이후 모든 임기의 리더 로그에 있다)다. 논문은 Paxos·Viewstamped Replication 에는 이 보장이 없어 같은 단순화를 쓸 수 없다고 쓴다([Paxos 와 Raft](/develop-wiki/knowledge/distributed-systems/paxos-vs-raft/) 비교와 연결된다).

### 알고리즘 규칙 (논문 3절, 그림 2)

설정: 모든 노드가 같은 리스 길이 Δ 를 쓴다.

| 동작 | 규칙 |
| --- | --- |
| 쓰기 | 리더는 항상 받는다. 항목에 `(term, command, intervalNow())` 를 담아 평소처럼 복제한다. |
| commitIndex 전진 | 평소처럼 과반 복제가 필요하다. **추가 제약:** 이전 임기(term 이 더 작은) 항목 중 Δ 보다 어린 것이 로그에 있으면 전진하지 않는다. |
| 읽기 | 가장 최근에 커밋된 항목이 Δ 보다 어리면 로컬로 응답한다. 이 리더가 자기 임기에서 아직 커밋한 항목이 없으면 "림보 영역"을 검사한다. |
| 팔로워 | vanilla Raft 와 같다. 리스 정보가 쓰이는 건 팔로워가 리더로 뽑힌 뒤뿐이다. |
| 선거 | 바꾸지 않는다. 리스가 살아 있다는 걸 알아도 투표·출마·당선이 가능하다. |

리스는 이렇게 만들어지고 연장된다. 리더가 항목 하나를 만들어 복제하고 과반 응답으로 커밋하면, 그 항목이 Δ 보다 어린 동안 리더는 로컬 읽기를 할 수 있다. 이후 일반 쓰기가 자동으로 리스를 연장한다. 쓰기가 뜸하면 no-op 항목으로 연장하고, 계획된 리더 교체에서는 "end-lease" 항목으로 리스를 자발적으로 포기한다(5.1절).

규칙의 의미를 필자 말로 풀면 이렇다. 옛 리더 L0 의 마지막 커밋 항목 e0 가 Δ 안이면 L0 는 읽을 수 있다. 새 리더 L1 은 Leader Completeness 로 e0 를 가지고 있고, e0 가 Δ 보다 오래될 때까지 **커밋하지 않으므로** L0 가 읽는 동안 L1 이 쓰기를 확정하는 일이 없다. 안전의 열쇠는 "읽는 쪽은 리스가 살아 있어야 읽고, 새 리더는 그 리스가 죽기 전에 커밋하지 않는다"는 쌍이다.

```ts
// 필자가 쓴 요약 의사코드(논문 그림 2 의 규칙만 옮김, Raft 전체 구현이 아님)
const olderThan = (t1: {latest: number}, now: {earliest: number}, delta: number) =>
  t1.latest + delta < now.earliest;          // 논문 2.2절의 "Δ 보다 오래됨" 판정

function canAdvanceCommit(log: Entry[], myTerm: number, now: Interval, delta: number) {
  return log.every(e => e.term >= myTerm || olderThan(e.ts, now, delta));
}
function canReadLocally(lastCommitted: Entry, now: Interval, delta: number) {
  return !olderThan(lastCommitted.ts, now, delta);   // 리스가 살아 있음
}
```

## 두 가지 최적화

논문은 두 최적화가 모두 TLA+ 모델을 탐색하다가 발견됐다고 적는다(5.4절).

### 1. Deferred commit writes (3.2절)

새 리더는 선출 직후부터 쓰기를 받아 로그에 추가하고 복제까지 한다. 다만 이전 임기의 최신 항목(= 옛 리더의 리스)이 Δ 보다 오래되기 전에는 commitIndex 를 올리지도, 적용하지도, 클라이언트에 응답하지도 않는다. 오래되는 순간 가장 최근의 과반 복제 항목까지 commitIndex 를 한 번에 올려 대기 중이던 쓰기를 모두 확인 응답한다. 복제만 되어 있어도 내구성은 확보되므로, 그 사이 리더가 죽어도 다음 리더가 이어서 커밋한다. 효과로 논문이 드는 것은 리스 획득 순간 쓰기 폭주를 피하는 것이다.

### 2. Inherited lease reads (3.3절)

새 리더 L1 도 옛 리더 L0 에게서 물려받은 리스로 읽을 수 있다. 근거는 두 가지다. L1 은 L0 가 커밋한 모든 항목을 갖고 있고, L1 이 이긴 선거가 과반의 term 을 올려 L0 가 더는 커밋하지 못하게 했다. 따라서 L0 와 L1 이 동시에 읽어도 같은 최신 상태를 본다.

걸림돌이 **림보 영역**이다. L1 은 자기 임기에서 아직 아무것도 커밋하지 못했으므로, 자기 commitIndex 부터 당선 시점 로그 끝까지의 항목이 L0 에서 커밋됐는지 모른다. commitIndex 까지만 읽으면 L0 보다 오래된 값을 줄 수 있고, 로그 끝까지 적용해 읽으면 L0 가 아직 확정하지 않은 값을 줄 수 있다. 둘 다 선형화 위반이다. 해법은 **림보 영역의 쓰기가 결과에 영향을 주는 읽기만 거절**하는 것이다. 키-값 저장소에서는 대상 키가 림보 영역 항목에 있는지만 보면 된다. MVCC 같은 복잡한 질의는 림보 항목마다 결과를 비교하는 식의 알고리즘이 필요하며 논문은 "향후 연구"로 남겨 둔다.

## 정확성 (4절)과 TLA+

- 논문은 Raft 의 네 속성(Leader Append-Only, Log Matching, Leader Completeness, State Machine Safety)을 가정하고, 완벽한 시계를 가정해 **Read-Your-Writes**(정리 1)를 사례 분석(쓴 리더에게 읽기 / 옛 리더 / 새 임기의 리더, 림보 영역 유무)으로 보이고, 정리 2 로 "모든 읽기는 리더들 중 가장 큰 commitIndex 의 상태를 반영한다"를 이끌어 선형화를 주장한다. 본문은 이를 "증명 스케치"라고 부른다.
- 구성 변경(joint consensus·단일 노드 변경)에서도 Raft 속성이 유지되므로 정확성이 보존된다는 논증이 4.4절에 있다.
- **TLA+**: 저장소의 `TLA/` 에 `leaseGuard.tla`, `mcLeaseGuard.tla`, `mcLeaseGuard.cfg` 등이 있다. 설정 파일(저장소 최신 상태 기준, 논문 본문이 밝힌 범위가 아님)은 서버 3대, 키 2개, MaxTerm 3, MaxLogLen 4, MaxClock 8, Δ=3 이고 검사 불변식에 `LeaderCompleteness`, `StateMachineSafety`, `LinearizableReads` 등이 들어 있다. 즉 모델 검사는 **아주 작은 범위**다. 논문 본문에서 모델 검사의 상태 수·소요 시간은 확인하지 못했다.
- 논문이 스스로 적은 교훈: 첫 명세가 큰 원자 단계로 모델링되어 림보 영역 읽기 버그를 놓쳤다. "성공을 의심하라"는 취지다(5.4절).

## 시계 가정

| 구분 | 내용 (논문 2.2, 4.3, 5.3절) |
| --- | --- |
| 기본 가정 | 각 노드가 `intervalNow()` 로 `[earliest, latest]` 구간을 얻고 진짜 시각이 구간 안에 있음을 보장하는 **경계 불확실성(bounded-uncertainty) 시계**. 항목 t1 이 Δ 보다 오래됐다는 판정은 `t1.latest + Δ < t2.earliest`. |
| 구간이 틀리면 | 옛 리더가 읽는 동안 새 리더가 커밋해 Read-Your-Writes 가 깨질 수 있다. 논문은 "inherited lease reads 는 올바른 시계 경계가 필요하다"고 강조한다. |
| 타이머 대안 | 노드들이 Δ 동안 시계가 ε 이상 벗어나지 않는다는 상한만 알면, 커밋은 이전 임기 마지막 항목이 `Δ + ε` 보다 오래됐을 때, 읽기는 자기 임기 마지막 커밋 항목이 `Δ − ε` 보다 어릴 때 허용하는 식으로 규칙을 바꿀 수 있다. |
| 타이머로 안 되는 것 | deferred commit 은 타이머로 가능하지만 **inherited lease reads 는 불가**하다. 논문의 반례: L1 이 폐위되고 L2 가 커밋 없이 L3 에 폐위됐으나 분할로 이를 모를 때, L2 와 L3 가 L1 의 마지막 항목을 각자 다른 시점에 받았다면 만료 시각 판단이 달라져 L3 는 커밋하고 L2 는 옛 값을 읽는다. 항목에 구간을 직접 기록해야 모호성이 사라진다. |
| 실제 시계 | 논문은 TrueTime 의 평균 오차 4ms(2012), AWS TimeSync·clock-bound(2023~)를 소개한다. 실험 서버는 평균 시계 오차 50μs 미만이었다. |

[Spanner 와 TrueTime](/develop-wiki/knowledge/distributed-systems/spanner-truetime/), [하이브리드 논리 시계](/develop-wiki/knowledge/distributed-systems/hybrid-logical-clock/)와 달리 여기서 필요한 것은(필자 정리, 논문에는 이 대비가 없다) "순서"가 아니라 "다른 노드가 남긴 시각이 Δ 보다 오래됐는가"라는 **간격 판정**이다. 필자 정리: 벽시계와 단조 시계의 선택 문제([CLOCK_BOOTTIME 대 MONOTONIC](/develop-wiki/knowledge/distributed-systems/clock-boottime-vs-monotonic/))는 타이머 변형에서 그대로 남고, 구간 변형에서는 구간을 주는 데몬의 정확성 검증이 새 신뢰 대상이 된다.

## 실험 (논문 6~7절)

### 조건

- **시뮬레이션**(Python, 약 1000줄, 결정적 이벤트 루프, 선형화 검사기 포함): 3노드, 선거 타임아웃 ET=500ms, Δ=1초(ET 의 2배, 전환 효과를 보려는 설정). 쓰기 1/3(1KB), 읽기 2/3, 키 1000개, 지연은 AWS 같은 서브넷 통계 기반. 시작 500ms 에 리더 사망, 500ms 뒤 새 리더 당선, 다시 500ms 뒤 옛 리스 만료.
- **LogCabin**(C++, 서버 코드 약 1600줄 추가·변경, 비동기 클라이언트 약 650줄): EC2 m7g.xlarge 4대(서버 3 + 클라이언트 1, 같은 placement group, ping 평균 155μs), PTP 커널 모듈과 clock-bound 데몬 사용, 구간 폭 100μs 미만. 비교 대상은 inconsistent(일관성 장치 없음), quorum(LogCabin 기본), "Ongaro lease"(박사논문의 방식을 저자들이 추정해 구현한 것, 드리프트 보정 안전 점검은 미구현), 최적화 없는 log-based lease, deferred commit 만, LeaseGuard(두 최적화 모두).

### 결과 (논문이 보고한 것)

| 항목 | 보고 내용 |
| --- | --- |
| 읽기 지연(시뮬, 그림 6) | 서버 간 단방향 지연 1~10ms 범위. quorum 은 읽기가 쓰기만큼 느려지고, LeaseGuard 읽기는 inconsistent 와 같이 로컬. 10ms 에서 quorum 의 p90 쓰기 지연이 6% 높다. |
| 읽기 지연(LogCabin, 그림 10) | LeaseGuard 와 Ongaro lease 의 읽기 p90 은 수백 μs. quorum 은 작은 지연 증가에도 큐잉으로 읽기·쓰기 모두 크게 악화. "쿼럼 한 왕복 → 0" 은 이 맥락이다. |
| 장애 후 가용성(LogCabin, 그림 9) | Ongaro lease 와 최적화 없는 log-based lease 의 가용성은 같다고 보고. deferred commit 은 리스 획득 시점에 쓰기가 90건/ms 까지 치솟는 스파이크(그래프 범위 밖). LeaseGuard 는 새 리더에 림보 영역 37개 항목이 생겼고, 리스를 기다리는 반 초 동안 읽기 10,000건 시도 중 9,930건 성공. |
| 처리량 확장성(그림 11) | 쓰기 비율 10·25·50%, 5,000→60,000 ops/s 부하를 올리며 지연 100ms 초과 시 중단. 텍스트는 "LeaseGuard 처리량이 Ongaro lease 와 같거나 높고, inconsistent 에 근접"이라고만 쓴다. |
| 편향(시뮬, 그림 8) | Zipf a 0~2(a=2 에서 가장 인기 있는 키가 연산의 61%), 림보 항목 100개로 고정. 편향이 클수록 상속 읽기가 더 많이 거절된다. |

초록의 "쓰기 처리량 약 1000 → 약 10,000/s" 는 논문이 서론에서 같은 문장으로 반복하며 원인을 "쓰기와 쿼럼 읽기의 경합 제거"라고 설명한다. 이 수치에 대응하는 구체적 부하 조건을 본문 문장에서 찾지 못했고, 그림에서 숫자를 판독하지도 않았다. 이 노트는 그 두 수치를 **논문 초록의 주장**으로만 인용한다. "99% 즉시 성공"은 위 LogCabin 표의 9,930/10,000 에 해당하며, 림보 항목 37개·Zipf a=0.5·반 초라는 조건에서 나온 수치다. 키 분포가 더 치우치면 비율이 내려간다(그림 8, 시뮬레이션).

## 직접 계산: 리스 대기 구간

논문 규칙(`t1.latest + Δ < t2.earliest`)만 따라가는 작은 계산을 직접 실행했다. Raft 구현이 아니며, 옛 리더의 마지막 항목이 시각 0 에 만들어지고(`latest = ε`) 리더 사망 후 ET=500ms 에 새 리더가 당선된다는 가정이다. ε 는 시계 구간 반폭이다.

| Δ | ε | 새 리더가 커밋 가능해지는 시각 | 전통 리스라면 읽기 금지 | LeaseGuard 에서 달라지는 점 |
| --- | --- | --- | --- | --- |
| 250ms | 0 / 50ms | 500ms (당선 즉시) | 0ms | 대기 없음 |
| 500ms | 0 | 501ms | 1ms | 거의 없음 |
| 500ms | 50ms | 601ms | 101ms | 이 구간에 림보 안전한 읽기 허용, 쓰기는 보관 |
| 1000ms | 0 | 1001ms | 501ms | 같음 |
| 1000ms | 50ms | 1101ms | 601ms | 같음 |

해석: Δ ≤ ET 이면 새 리더가 뽑힐 때쯤 옛 리스가 거의 끝나 있다. Δ 를 ET 보다 길게 잡을수록 대기가 그만큼 늘고, 이 모형에서는 시계 구간 반폭 ε 가 대기를 2ε 만큼 늘린다(기록된 latest 가 ε 만큼 늦고, 판정 시 earliest 가 ε 만큼 이르기 때문). 논문의 "Δ = ET 가 보통 최적"(5.2절)과 같은 방향이다. 실제 시스템의 측정이 아니라 규칙을 따라간 산술이다.

## 비교

| 방식 | 읽기 비용 | 새 리더 대기 | 시계 가정 | 선거 변경 |
| --- | --- | --- | --- | --- |
| 쿼럼 확인 / [ReadIndex](/develop-wiki/knowledge/distributed-systems/raft-read-index/) | 읽기마다(또는 묶음마다) 과반 왕복 | 없음 | 없음 | 없음 |
| 하트비트 리스(박사논문 6.4.1) | 로컬 | 옛 리스 만료까지 선거·읽기·쓰기 지연 | 드리프트 상한 | 팔로워가 투표 보류 |
| LeaseGuard | 로컬 | 읽기는 일부 즉시, 쓰기는 복제하되 커밋 지연 | 경계 시계(상속 읽기), 또는 타이머(상속 읽기 제외) | 없음 |
| [CockroachDB 리더 리스](/develop-wiki/knowledge/distributed-systems/cockroachdb-leader-leases-liveness-fabric/) | 로컬 | 지지 만료(LSU)까지 | 단조 시계 기반 지지 | 리더 강화로 투표 보류 |

필자 정리(논문 서술이 아님): CockroachDB 의 새 리더 리스는 저장소 쌍 하트비트(Liveness Fabric)가 만드는 "지지 만료 시각"이 리스 끝이고, 지지를 받은 팔로워는 선거를 열지 않는다. 신호의 원천이 별도 하트비트 계층이다. LeaseGuard 는 신호의 원천이 **일반 쓰기 항목 자체**이고 팔로워의 행동을 건드리지 않는다. 대신 그 신호를 읽는 쪽(새 리더)이 시각 비교를 정확히 해야 하므로 시계 정확도 요구가 높다. 둘은 "많은 Raft 그룹이 있을 때 그룹별 하트비트 비용을 어떻게 줄이는가" 관점에서는 다른 문제를 푼다. LeaseGuard 논문은 Multi-Raft 규모의 하트비트 비용을 다루지 않는다. 논문이 CockroachDB 를 언급하는 8.1절은 참고문헌 [49](2020년 CockroachDB 논문) 기준의 "범위별 리스홀더가 리스 항목을 기록하는" 방식이어서, 위 새 리더 리스 설계와는 시점이 다르다. [리스 3종](/develop-wiki/knowledge/distributed-systems/cockroachdb-lease-types/) 노트의 만료 기반·에포크 기반 리스에 해당하는 시기의 설계다(2020 논문은 사용자 범위 리스를 노드 생존에 묶고 시스템 범위는 만료 리스를 쓴다고 서술한다).

[PreVote·CheckQuorum 과 리스](/develop-wiki/knowledge/distributed-systems/raft-prevote-checkquorum-lease-interplay/)와의 관계도 다르다. 전통 리스는 팔로워의 투표 보류를 의존해 PreVote·CheckQuorum 과 맞물려야 했다. (필자 정리, 논문은 PreVote·CheckQuorum 을 다루지 않는다) LeaseGuard 는 선거를 바꾸지 않으므로 그 상호작용 문제를 피하지만, 대신 "옛 리더가 폐위 후에도 한동안 읽을 수 있다"는 상황을 설계에 포함시킨다.

## 언제 쓰나

- Raft 계열 저장소에서 읽기가 많고, 선거 직후 읽기·쓰기 공백이 문제인 설계를 평가할 때.
- 하트비트 리스의 명세 모호함 때문에 생긴 버그(만료 계산, 이전 리더의 리스를 새 리더가 모름)를 피하고 싶을 때. 논문은 이전 리스 설계보다 단순하다고 쓴다. (필자 정리) 규칙이 로그 항목의 나이 비교로 표현되어 점검 대상이 분명하다.
- 클라우드에서 경계 시계 데몬(clock-bound 등)을 쓸 수 있고, 선거 때 가용성을 아주 중요하게 볼 때.

## 주의와 한계

- **상속 읽기는 경계 시계가 전제다.** 구간 경계가 틀리면 선형화가 깨진다. 타이머만 쓰는 변형은 deferred commit 까지만 안전하다(논문 5.3절).
- **림보 영역 판정은 상태 기계 의존적이다.** 키-값은 쉽지만 MVCC·복합 질의는 논문이 미해결로 남겼다. 림보 항목이 많으면(쓰기 많은 부하, 지연이 큰 환경, 편향된 키) 상속 읽기가 많이 거절된다.
- **리스는 쓰기가 갱신한다.** 쓰기가 뜸하면 no-op 이 필요하다. Δ 를 동적으로 바꾸는 것은 범위 밖이다.
- **정확성 증거는 제한적이다.** 본문의 증명은 스케치이고, 공개된 TLA+ 모델 설정은 서버 3·로그 길이 4 수준이다. 논문은 수백 연산 이력의 선형화 검사가 보통 수 초 걸린다고만 적는다.
- **평가는 저자들의 구현 간 비교다.** Ongaro lease 는 저자들이 상세를 추정해 구현했고 드리프트 보정은 빠졌다. 단일 AZ 안의 EC2 와 μs 급 시계에서 측정했다. 지리 분산 환경의 결과는 단방향 지연을 tc 로 더한 모의다.
- 한 리더가 폐위되었는데 모르고 읽는 상황이 **의도된 것**이므로, 읽기 응답에 쓰이는 시각 비교를 하는 코드(시계 구간, 정지 후 재확인)가 틀리면 바로 오래된 읽기가 된다. [VM 일시 정지](/develop-wiki/knowledge/distributed-systems/vm-pause-live-migration-guest-clock/)처럼 프로세스 정지 후 시계 상태가 바뀌는 환경을 이 논문이 다루지는 않는다(필자 정리).
- 프로덕션 채택 여부: 논문은 MongoDB 의 현재 방식을 읽기마다 빈 항목 쓰기라고 적을 뿐, LeaseGuard 배포 사실은 이 논문에서 확인하지 못했다.

## 검증 범위

- arXiv PDF v2(15쪽, 본문 13쪽 + 참고문헌)를 macOS PDFKit 로 텍스트 추출해 초록, 1~9절(서론, 배경, 알고리즘, 정확성, 확장, 시뮬레이션, LogCabin 평가, 관련 연구, 결론)을 읽었다. 그림은 본문 캡션과 그림 안 텍스트만 읽었고 **그래프의 수치는 판독하지 않았다.** 참고문헌 목록은 [34]·[41]·[44]·[49] 등 필요한 항목만 대조했다.
- 게재 정보는 논문 각주, arXiv 메타데이터, Crossref 레코드로 확인했다. ACM DL 페이지는 열지 않았다.
- TLA+ 저장소는 README, `mcLeaseGuard.cfg`, `mcLeaseGuard.tla` 앞부분만 확인했다. TLC 를 실행하지 않았고, `leaseGuard.tla` 본문이 논문 그림 2 와 일치하는지는 검증하지 않았다. 논문의 증명도 검증하지 않았다.
- LogCabin 코드와 Python 시뮬레이터는 읽거나 실행하지 않았다. "직접 계산" 표는 논문의 시각 비교 규칙을 산술로 따라간 것이며 논문의 실험을 재현한 것이 아니다.
- 초록의 "쓰기 ~1000 → ~10,000/s"에 대응하는 본문 조건은 확인하지 못했다(미확인).

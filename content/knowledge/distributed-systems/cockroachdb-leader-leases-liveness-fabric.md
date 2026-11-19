---
title: CockroachDB 리더 리스 논문 (Liveness Fabric · 리더 강화 · LSU)
aka: [Scalable Leader Leases For Multi Consensus Groups in CockroachDB, Leader Leases, Liveness Fabric, Store Liveness, Leader Fortification, LeadSupportUntil, LSU, Support Disjointness, 리더 강화, 저장소 생존, SIGMOD 2026]
category: distributed-systems
level: advanced
summary: SIGMOD 2026 산업 논문이 설명하는 CockroachDB 리더 리스의 내부. 저장소 쌍마다 에포크로 지지를 주고받는 Liveness Fabric 위에서, Raft 리더가 과반의 "선거 불참 약속"을 받아 그 만료 시각(LSU)을 리스 끝으로 쓰는 구조와 그 비용을 정리한다.
tags: [cockroachdb, leader-lease, store-liveness, raft, leader-fortification, failure-detector, lease, sigmod]
related: [distributed-systems/cockroachdb-lease-types, distributed-systems/leader-lease-clock-assumptions, distributed-systems/raft-prevote-checkquorum-lease-interplay, distributed-systems/raft-lease-read-monotonic-clock, distributed-systems/raft-membership-change, distributed-systems/gossip-failure-detection, distributed-systems/hybrid-logical-clock, distributed-systems/cockroachdb-range-split-timestamp-cache]
sources:
  - https://doi.org/10.1145/3788853.3803081
  - https://assets.ctfassets.net/00voh0j35590/2EHUM3hbvPrvrYle4IAB5c/f5ad2be3b27726d04715e40785dd086c/leader-leases-paper-2.pdf
  - https://www.cockroachlabs.com/blog/distributed-database-leader-leases/
  - https://github.com/cockroachdb/cockroach/tree/master/docs/tla-plus/StoreLiveness
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/util/hlc/doc.go
  - https://github.com/cockroachdb/cockroach/blob/release-25.2/pkg/kv/kvserver/replica_store_liveness.go
updatedAt: 2026-11-19
---

[리스 3종](/develop-wiki/knowledge/distributed-systems/cockroachdb-lease-types/) 노트는 만료 기반·에포크 기반·리더 리스를 나란히 놓았다. 이 노트는 그중 리더 리스를 설계자들이 직접 쓴 논문(Kettaneh 외, *Scalable Leader Leases For Multi Consensus Groups in CockroachDB*, SIGMOD Companion '26, pp.373–385, CC BY 4.0)으로 한 단계 더 들어간다. 논문은 이 실패 감지 층을 **Liveness Fabric** 이라 부르고, 소스와 TLA+ 모델은 같은 것을 **Store Liveness** 라 부른다.

## 문제

- 범위(Raft 그룹)가 노드당 수만 개다. 논문은 큰 운영 클러스터에서 Raft 그룹의 60% 넘게가 오랫동안 읽기만 받는다고 적는다. 이런 그룹에서 리스 갱신만을 위한 Raft 작업은 낭비다.
- 기존 두 방식의 약점(논문 2.3·2.4절 요약):
  - 만료 리스: 범위마다 Raft 쓰기로 갱신 → CPU 가 범위 수에 비례.
  - 중앙 리스(에포크 리스): 생존 범위(liveness range)라는 중앙 의존. 리스홀더가 생존 범위와는 통하지만 팔로워 과반과 끊긴 **부분 분할**에서는 리스를 계속 연장하면서 쓰기는 못 해 범위가 멈춘다.
- 이상적인 리스의 조건으로 논문은 정확성(같은 데이터의 리스가 시간상 겹치지 않음), 빠른 장애 대응, 그룹 수에 무관한 확장성을 든다.

## 해법: 세 층

| 층 | 하는 일 | 핵심 상태 |
| --- | --- | --- |
| Liveness Fabric | 저장소 쌍(방향 있는 간선)마다 "언제까지 지지하는가"를 하트비트로 주고받음 | 요청자 에포크, 지지 만료 시각 |
| Raft + 리더 강화 | 리더가 팔로워들에게서 "이 term 동안 선거를 열지도, 투표하지도 않겠다"는 약속을 받음 | `MsgFortifyLeader`, LeadEpoch, LSU |
| 리더 리스 | 강화된 리더만 리스를 가짐. 리스 끝 = LSU | 리스는 Raft term 에 묶임 |

### 1. Liveness Fabric (3.4절)

- 노드 A 가 B 에게 "타임스탬프 X 까지 나를 지지해 달라"고 하트비트를 보낸다. B 가 응답하면 **B 의 시계가 X 를 넘을 때까지** A 를 지지한다고 약속한 것이다. 기본 주기는 1초, 요청 만료는 지금+3초(Algorithm 1).
- 지지는 **에포크** 단위다. 지지를 받는 쪽이 재시작하거나 지지가 끊기면 에포크가 올라간다. 한 번 철회된 에포크의 지지는 다시 살아나지 않는다(Support Durability).
- 지지하는 쪽은 만료가 지나면 조용히 철회한다(에포크+1, 만료 0). 요청자는 다음 하트비트 응답에서 알게 된다.
- **Support Disjointness**: 요청자는 이전 에포크의 지지가 자기 시계로 끝나기 전에는 새 에포크 지지를 요청하지 않는다. 그래서 서로 다른 에포크의 지지 구간이 겹치지 않는다. 메시지에 HLC 타임스탬프를 실어 수신자 시계를 앞으로 당기는 것이 이 성질의 근거다(`hlc/doc.go` 의 Store Liveness 항목도 같은 설명). 두 성질은 TLA+ 로 검증했고 모델은 저장소 `docs/tla-plus/StoreLiveness` 에 있다.
- 영속 상태: 내가 남에게 준 지지(`support_for`), 요청한 최대 만료(`max_requested`), 철회한 최대 시각(`max_withdrawn`)은 디스크에 남긴다. 받은 지지(`support_from`)는 남기지 않는다. 재시작하면 에포크를 올리고, 시계가 `max_requested`·`max_withdrawn` 을 넘을 때까지 기다린다.
- 단위는 노드가 아니라 **저장소(디스크)** 다(7.3절). 디스크 하나가 고장 나면 그 디스크의 범위만 영향을 받게 하려는 선택이다. 같은 노드의 저장소로 가는 하트비트는 묶어서 보낸다.

### 2. 리더 강화와 LSU (3.3절)

- 리더는 `MsgFortifyLeader`(현재 term 포함)를 보낸다. 팔로워는 term 이 같고, 다른 리더를 강화하고 있지 않고, Fabric 에서 리더의 저장소를 지지하고 있으면 수락하고 그 지지 에포크(LeadEpoch)를 돌려준다.
- 과반(자신 포함)이 수락하면 리더는 **강화됨**. 이제 Raft 하트비트를 보내지 않아도 된다(3.3.7절). 장애 감지를 Fabric 이 맡는다.
- **LeadSupportUntil(LSU)** = 모든 과반 집합 Q 에 대해 (Q 안 복제본 지지 만료의 최솟값) 중 최댓값. 과반이 이 시각까지 다른 후보에게 투표하지 않으므로 그 전에는 새 리더가 나올 수 없다. Raft 틱(기본 500ms)마다 다시 계산한다.
- 팔로워 지지가 만료되거나 그 팔로워의 에포크가 기록보다 커지면 그 팔로워를 LSU 계산에서 빼고 다시 강화를 요청한다.
- **해제(de-fortification)**: 팔로워가 더 높은 term 메시지를 받으면 암묵적으로, 리더가 물러날 때는 `MsgDefortify` 로 명시적으로 약속을 푼다. 풀지 않으면 팔로워들이 옛 리더를 지지하느라 선거에 참여하지 않아 범위가 멈춘다.
- **리더십 이전**: 리더가 지시한 선거라는 표시를 투표 요청에 붙이면 강화 약속과 무관하게 투표할 수 있다. 이전은 리스를 먼저 넘긴 뒤에만 하므로 해제가 안전하다.
- **영속 필드 추가**: 표준 Raft 팔로워는 현재 리더를 저장하지 않아도 되지만, 강화 약속을 한 팔로워가 재시작 후 약속을 잊고 선거를 열면 안 된다. 그래서 `Lead` 와 `LeadEpoch` 를 저장한다.

LSU 는 정렬로 쉽게 구할 수 있다. 지지 만료를 내림차순으로 놓고 과반 번째 값이다.

```ts
// LSU = max over quorums Q of min_{r in Q} tau_r  ==  내림차순 정렬 후 floor(n/2) 번째
export function leadSupportUntil(tau: number[]): number {
  const v = [...tau].sort((a, b) => b - a);
  return v[Math.floor(v.length / 2)];
}
// leadSupportUntil([20, 20, 10]) === 20, 미강화 복제본 1개 추가 후 [20, 20, 10, 0] === 10
```

### 3. 구성 변경 제약 (3.3.5절, 그림 3)

복제본을 추가하면 과반 크기가 커져 LSU 가 내려갈 수 있다. 리더는 지금까지 계산한 최대 LSU(MaxLSU)까지는 리스를 썼을 수 있으므로, LSU 가 떨어진 상태에서 구성 변경을 연달아 하면 위험하다. 논문은 **LSU = MaxLSU 일 때만 다음 구성 변경을 제안**하도록 막는다.

직접 실행(`lsu.mjs`, 논문 그림 3 수치): {리더 20, F1 20, F2 10} 에서 LSU=20. 강화 전인 F3 을 넣으면 LSU=10(MaxLSU 는 20). 여기서 바로 F4 까지 넣으면 5개 중 F2·F3·F4 가 t=10 부터 투표할 수 있어, 리더가 이미 t=20 까지 리스를 썼는데도 새 리더가 나온다.

### 4. 리스 (3.2절, 4.3절)

- 비협조 획득: 리더 리스는 선거에서 이긴 리더만 제안한다. 강화된 term 들은 시간상 겹치지 않으므로 이전 리더 리스는 이미 끝났다(정리 4.7). 새 리더의 HLC 는 투표 응답의 타임스탬프로 앞당겨져 이전 MaxLSU 보다 크다(보조정리 4.5).
- 협조 이전: 리더는 리스를 넘겨도 여전히 Raft 리더라서, 받는 쪽에는 **만료 기반 리스**를 준다. 그 뒤 리더십도 넘기고, 새 리더가 Raft 명령으로 리더 리스로 바꾼다.

## 디스크 정지 처리 (5.1절, 7.2절)

쓰기가 성공도 실패도 아닌 채 멈추는 디스크는 "하트비트는 오는데 쓰기는 못 하는" 상태를 만든다. Liveness Fabric 은 하트비트 요청과 응답 모두 **보내기 전에 디스크에 동기 쓰기**를 하도록 했다. 디스크가 멈추면 하트비트가 끊겨 지지가 철회되고, 리더십과 리스가 함께 다른 복제본으로 넘어간다. 일시적 정지로 리더가 바뀌지 않도록 리스 3초·하트비트 1초로 두어 최소 두 번 실패해야 바뀌게 했다.

## 실험 결과 (논문 5절, 재현하지 않음)

| 항목 | 설정 | 결과 |
| --- | --- | --- |
| 장애 복구(노드 크래시·전체 분할) | GCP n2-standard-8 6노드, 300회, 세 방식 모두 리스 3초 | 만료·중앙 리스 중앙값 3.0~3.9초, P99 3.7~4.5초. 리더 리스 중앙값 4.0~4.7초, P99 6.5초 |
| 부분 분할 | 같은 클러스터 | 만료 리스 중앙값 3.65초·P99 4.3초, 리더 리스 4.3초·5.8초, **중앙 리스는 분할이 풀릴 때까지 복구 안 됨** |
| 디스크 정지 | 같은 클러스터 | 만료·중앙 리스는 정지가 풀리거나 20초 넘게 지속돼 노드가 스스로 죽을 때까지 불가용. 리더 리스는 수 초 안 복구(그림 5d, 정확한 값은 본문에 없음) |
| 유휴 CPU | 3노드, 범위 1만~10만 | 만료 리스 10K 에서 15% → 80K 에서 90% 초과. 중앙 리스 약 5% 이하. 리더 리스 15% 미만 |
| TPC-C | 5노드 n2-standard-16, 창고 2.5만~10만 | 만료 리스는 10만 창고에서 약 20% 처리량 감소. 중앙 리스 최고치 대비 5% 이내, 리더 리스는 중앙 리스에 가까움 |
| Fabric 자체 비용 | 노드당 저장소 12개, 60~1800 저장소 | 1800 저장소에서 약 0.225 코어(8 vCPU 의 약 2.8%), 저장소 수에 선형 |

- 리더 리스는 **장애 복구가 1~2초 느리다.** 다른 방식은 리더 선거와 리스 만료가 동시에 진행되지만, 리더 리스는 지지 만료를 기다린 뒤에야 선거가 시작되고(선거 전 최대 2초 무작위 대기) 순서대로 진행되기 때문이다. 논문은 Raft 틱을 짧게 해 줄일 수 있다고 적는다.
- 논문이 앞에서 내세우는 "리스 관리 CPU 최대 85% 감소"는 기여 목록의 요약 수치이며, 실험 절에서는 위 그래프 값으로 나온다. 85% 가 어느 지점의 비교인지는 본문에서 따로 계산돼 있지 않다.
- 리더 복제본은 유휴여도 틱을 계속한다(리더 정지 quiescence 는 향후 과제). 그래서 유휴 CPU 는 중앙 리스보다 약간 높다.
- 실험은 v25.4.0 출시 전 빌드로 했다. 리더 리스의 운영 기본 지속 시간은 3초로 맞췄고, 만료·중앙 리스는 운영 기본 6초다.

## 언제 쓰나

- 범위·샤드가 매우 많은 Multi-Raft 저장소를 설계할 때, "그룹별 하트비트를 노드(저장소) 간 하트비트 하나로 접고, 그 위에서 리더 안정성을 보장"하는 설계 참고.
- CockroachDB 25.2 이후 클러스터의 장애 분석에서 "왜 리더가 바뀌는 데 4~6초가 걸렸나", "디스크 정지가 왜 리더 이동으로 이어졌나"를 설명할 때.
- 부분 네트워크 분할이 운영 사고의 원인이었던 시스템에서 리스와 리더를 한 실패 감지기로 묶을지 판단할 때.

## 주의 (비용)

- **시계 가정은 여전히 있다.** Fabric 은 각 노드의 단조 시계와 HLC 전파에 기대고, "지지 만료"는 시간 약속이다. 논문은 시계 동기화를 범위 밖으로 둔다(2.3.1절). 시계가 멈추는 환경(VM 일시 정지 등)의 영향은 [VM 일시 정지와 게스트 시계](/develop-wiki/knowledge/distributed-systems/vm-pause-live-migration-guest-clock/)를 본다.
- **복구가 약간 느려진다.** 확장성과 부분 분할 내성의 대가로 단순 장애 복구 P99 가 만료 리스보다 길다.
- **새 영속 상태와 메시지.** Raft 에 메시지 3종과 영속 필드 2개가 늘고, 재시작·구성 변경·리더십 이전에 각각 별도 규칙이 붙는다. 구현 난이도가 올라간다.
- **비용은 O(N²).** 저장소 쌍마다 하트비트를 주고받는다. 논문은 저장소당 범위가 수만 개면 대략 20만 저장소 규모까지는 그룹별 하트비트보다 싸다고 계산한다(6절).
- 분할 직후의 오른쪽 범위처럼 새 Raft 그룹이 생기면 리더 리스를 그대로 쓸 수 없어 만료 리스로 바꾼다([분할과 타임스탬프 캐시](/develop-wiki/knowledge/distributed-systems/cockroachdb-range-split-timestamp-cache/)).

## 버전

- 25.1 출시 노트는 리더 리스를 Preview 로 소개한다.
- 기본 활성 여부는 `kv.raft.leader_fortification.fraction_enabled` 기본값으로 판단했다. `release-25.1` 브랜치 소스는 기본 0.0, `release-25.2`·`release-25.3` 은 기본 1.0 이다. 즉 **25.2 부터 기본으로 켜진 것으로 보인다.** 다만 이 변화를 명시한 릴리스 노트 문장은 찾지 못했다.

> 검증 범위: 논문 PDF(Cockroach Labs 배포본, 13쪽, CC BY 4.0) 전문을 텍스트로 추출해 1~8절을 읽었다. DOI·쪽수는 Crossref 메타데이터로 확인했다. 저자는 Crossref(7명, A. Shraer 포함)와 배포 PDF(6명)가 다르다. TLA+ 디렉터리에 `StoreLiveness.tla`·`.cfg` 가 있는 것만 GitHub API 로 확인했고 모델 내용은 읽지 않았다. `hlc/doc.go`(Store Liveness Support Disjointness 항목)와 `replica_store_liveness.go` 의 release-24.3/25.1/25.2/25.3 브랜치 기본값을 읽었다(2026-11-19). 25.1~25.4 릴리스 노트에서 "leader lease" 언급을 검색했으나 기본값 변경 문장은 없었다. LSU 계산과 그림 3 위험은 Node 로 직접 실행한 모형이다(스크래치 `dist/lsu.mjs`). 미확인: 그림 5·6·7 의 막대·곡선 세부 값(본문 서술만 옮김), "85%" 의 산출 지점, 실제 클러스터에서의 재현.

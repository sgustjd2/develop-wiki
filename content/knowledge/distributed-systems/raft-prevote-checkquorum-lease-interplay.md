---
title: Raft 의 Pre-Vote·CheckQuorum·리더 리스 조합
aka: [Pre-Vote with CheckQuorum, Leader Stickiness, Election Lease, ReadOnlyLeaseBased, Stale Leader Window, etcd raft CheckQuorum, 리더 고착]
category: distributed-systems
level: advanced
summary: Pre-Vote 는 임기 부풀림, CheckQuorum 은 고립된 옛 리더, 리스 읽기는 읽기 왕복을 줄인다. 서로의 빈틈을 메우는 조합과, etcd/raft 코드·논문·장난감 모형으로 본 한계를 정리한다.
tags: [raft, pre-vote, check-quorum, leader-lease, etcd, availability, linearizable-reads]
related: [distributed-systems/raft-prevote-leadership-transfer, distributed-systems/leader-lease-clock-assumptions, distributed-systems/raft-consensus, distributed-systems/raft-read-index, distributed-systems/raft-membership-change, distributed-systems/gossip-failure-detection, distributed-systems/distributed-lock-fencing-token]
sources:
  - https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf
  - https://github.com/etcd-io/raft/blob/main/raft.go
  - https://github.com/etcd-io/raft/blob/main/raft_test.go
updatedAt: 2026-11-19
---

[Pre-Vote 와 리더 이양](/develop-wiki/knowledge/distributed-systems/raft-prevote-leadership-transfer/)은 사전 투표 한 장치를, [리더 리스](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)는 시간 약속으로 읽기를 처리하는 방식을 다룬다. 이 노트는 그 둘이 **CheckQuorum 과 어떻게 맞물리는지**를 다룬다. 앞 노트가 "CheckQuorum 류의 세부는 확인하지 못했다"고 남긴 빈칸을 채운다.

## 문제

세 장치는 서로 다른 고장을 막는다.

| 장치 | 막는 것 |
| --- | --- |
| Pre-Vote | 고립됐던 노드가 임기 번호만 키우다 돌아와 멀쩡한 리더를 끌어내리는 일 |
| CheckQuorum | 과반과 끊긴 옛 리더가 계속 리더로 남아 요청을 붙잡는 일 |
| 리더 리스 읽기 | 읽기마다 과반 확인 왕복을 하는 비용 |

하나씩만 켜면 빈틈이 생긴다. 어느 설정이 어느 고장을 막는지, 서로 의존하는지가 문서마다 흩어져 있어 헷갈린다.

## 해법: 논문과 etcd/raft 에서 확인한 역할 분담

### 논문이 말하는 것

Ongaro 박사 논문은 두 규칙을 따로 설명한다.

- 6.2절: 리더는 **선거 타임아웃 동안 과반에게 성공적인 하트비트 라운드를 못 얻으면 스스로 물러난다.** 분리된 리더가 클라이언트 요청을 영원히 붙잡는 것을 막기 위해서다. 이것이 CheckQuorum 에 해당한다(논문은 이 이름을 쓰지 않는다).
- 9.6절: Pre-Vote 는 후보가 임기를 올리기 전에 과반에게 "표를 주겠는가"를 묻는다. 응답자는 **후보 로그가 충분히 최신**이고 **최근 기본 선거 타임아웃 동안 유효한 리더의 하트비트를 못 받았을 때만** 긍정한다.

논문에서는 "최근 리더 하트비트 없음" 조건이 Pre-Vote 규칙 안에 들어 있다.

### etcd/raft 코드에서 달라지는 점

`etcd-io/raft` 의 `raft.go`(내가 읽은 시점의 main, 커밋 99f9ffb, 2026-11-11)를 읽으면 이 조건이 **CheckQuorum 플래그 아래**에 있다.

```ts
// Step() 맨 앞: 더 큰 임기의 투표·사전투표 요청을 받았을 때
const inLease = cfg.checkQuorum && me.lead !== NONE && me.electionElapsed < cfg.electionTimeout;
if (msg.term > me.term && (msg.type === 'Vote' || msg.type === 'PreVote') && !msg.forceTransfer && inLease) {
  return; // 임기도 올리지 않고 표도 주지 않고 무시
}
```

- 이 무시 규칙은 `MsgVote` 와 `MsgPreVote` 둘 다에 적용되고, 리더 이양용 `campaignTransfer` 컨텍스트가 붙은 요청은 예외다.
- 사전 투표의 승인 조건 자체(`canVote`)는 "미래 임기에 대한 사전 투표면 가능, 단 후보 로그가 최신이어야 함"이다. 리더 하트비트 신선도는 여기서 보지 않는다.
- 따라서 **PreVote 만 켜고 CheckQuorum 을 끄면**, 로그가 최신인 노드가 리더와 단절된 채 다른 노드에는 닿는 상황에서 사전 투표가 승인될 수 있다. 논문의 "하트비트 신선도" 조건은 etcd 에서 CheckQuorum 이 켜져 있을 때만 작동한다(코드 해석).
- 리더가 `MsgTimeoutNow` 로 이양할 때는 Pre-Vote 를 건너뛴다. 주석이 이유를 밝힌다. 분리에서 복귀하는 상황이 아니므로 왕복이 낭비다.
- 낮은 임기의 하트비트·복제 메시지를 받은 노드는 `MsgAppResp` 로 자기 임기를 알려 준다. 임기를 부풀린 노드가 돌아왔을 때 이 응답이 리더를 물러나게 해 노드를 풀어 준다. 주석은 이 방해가 갇힌 노드를 풀어 주려면 피할 수 없고, Pre-Vote 단계를 두면 막을 수 있다고 적는다.
- 설정 검증은 `ReadOnlyLeaseBased` 를 쓰려면 CheckQuorum 이 켜져 있어야 한다고 강제한다(`CheckQuorum must be enabled when ReadOnlyOption is ReadOnlyLeaseBased`). 리스 읽기 모드에서는 `MsgForgetLeader` 도 무시한다.
- CheckQuorum 검사는 리더 틱 `electionElapsed` 가 선거 타임아웃에 도달할 때마다 `MsgCheckQuorum` 을 내부로 보내 수행한다. 마지막 검사 이후 응답한 투표자가 과반이 아니면 팔로워로 내려가고, 매 검사 뒤 모든 팔로워의 `RecentActive` 를 지운다.

저장소 테스트에도 같은 의도가 있다. `TestPreVoteWithCheckQuorum`, `TestFreeStuckCandidateWithCheckQuorum`, `TestDisruptiveFollowerPreVote` 가 그 조합을 시험한다.

### 장난감 모형으로 본 효과

위 규칙(`inLease` 무시, 사전 투표 승인, 낮은 임기 메시지에 대한 응답, 리더의 CheckQuorum 사임)만 옮긴 틱 단위 3노드 모델을 만들었다. 선거 타임아웃 10틱, 임의 타임아웃 [10, 20) 틱, 하트비트 매 틱, 메시지는 즉시 도착한다. 이것은 etcd 구현이 아니라 읽은 규칙의 모형이다.

**시험 1: 팔로워 하나를 완전 격리했다 복귀** (200 시드). 복귀 시 고립 노드의 임기(정상은 2)와 리더 강제 사임 횟수.

| 설정 | 고립 노드 평균 임기 | 리더 강제 사임 |
| --- | --- | --- |
| 둘 다 끔 | 7.1 | 200/200 |
| PreVote 만 | 2.0 | 0/200 |
| CheckQuorum 만 | 7.1 | 200/200 |
| 둘 다 켬 | 2.0 | 0/200 |

CheckQuorum 만으로는 부풀린 임기가 낮은 임기 하트비트 응답 경로로 리더를 내리는 일을 못 막는다. 복귀 순간 한 번의 방해는 "불가피하다"는 주석과 같은 결과다. 이 시험에서는 복귀하자마자 하트비트가 도착해서 PreVote 만으로도 방해가 안 생겼다.

**시험 2: 리더→노드2 한 방향 링크만 끊김**(노드2→다른 노드는 정상, 로그 동일, 100틱, 200 시드).

| 설정 | 리더 교체·강제 사임 |
| --- | --- |
| 둘 다 끔 | 200/200 |
| PreVote 만 | 200/200 |
| CheckQuorum 만 | 0/200 (노드2 임기만 평균 8.5 까지 오름) |
| 둘 다 켬 | 0/200 (노드2 임기 2.0 유지) |

PreVote 만으로는 하트비트 신선도를 안 보는 etcd 규칙 때문에 사전 투표가 승인되고 이어 진짜 선거가 리더를 내린다. CheckQuorum 이 켜지면 팔로워가 요청을 무시하지만 노드2 는 임기를 계속 올린다. **둘을 같이 켜야** 임기도 안 오르고 리더도 안 흔들린다.

**시험 3: 리더 격리**(400 시드, 격리 시점을 타임아웃 주기 안에서 바꿈).

| 설정 | 옛 리더가 60틱 안에 사임 못함 | 새 리더 선출까지 평균 | 새 리더가 선 뒤에도 옛 리더로 남은 시간 |
| --- | --- | --- | --- |
| CheckQuorum 끔 | 400/400 | 12.1틱 | 사임하지 않음 |
| CheckQuorum 켬 | 0/400 | 13.5틱 | 평균 3.3틱, 최대 10틱 |

CheckQuorum 은 옛 리더를 결국 내리지만, 검사가 **선거 타임아웃 주기마다** 일어나서 새 리더가 서고 난 뒤에도 최대 한 타임아웃 정도 옛 리더가 리더로 남는 창이 모형에서 나왔다. 격리 직전에 응답한 팔로워가 있으면 그 검사 주기를 통과하기 때문이다(코드의 `RecentActive` 지우기 구조에서 나온 해석).

### 리스 읽기와 어떻게 이어지나

- etcd 는 `ReadOnlyLeaseBased` 에 CheckQuorum 을 **전제 조건**으로 둔다. 하지만 위 시험 3 의 창이 실제 구현에도 있다면, CheckQuorum 은 리스 읽기의 충분조건이 아니다. 팔로워의 표 거부 시간(타임아웃)과 리더의 사임 시각이 같은 시간 가정 위에 있고, 둘 다 틱 기반이라는 점이 [리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)에서 말한 속도 가정과 만난다.
- etcd 주석은 리스 읽기가 시계 드리프트의 영향을 받는다고 직접 경고하고, 기본값은 과반과 통신하는 안전 옵션(`ReadOnlySafe`)이다. 박사 논문도 필요한 경우가 아니면 시계 기반 읽기를 권하지 않는다(6.4.1절).
- 이 노트의 "창"은 코드 읽기와 모형의 해석이다. 실제 etcd 를 띄워 재현하지 않았으므로 리스 읽기를 쓰기 전에 대상 버전에서 직접 검증한다.

## 언제 쓰나

- 여러 AZ·불안정한 링크가 있는 클러스터: Pre-Vote **와** CheckQuorum 을 함께 켠다. 한쪽만 켜면 시험 2 처럼 빈틈이 남는다.
- 선호 리더(주 리전 고정), 롤링 업그레이드: 리더 이양과 함께 쓴다. 이양은 Pre-Vote 를 건너뛴다.
- 읽기 대부분이고 시계를 운영으로 통제하는 환경에서만 리스 읽기를 검토한다. 기본은 ReadIndex 류 확인 읽기다.

## 주의

- CheckQuorum 이 켜지면 팔로워가 리더 접촉 후 타임아웃 안에는 정당한 선거도 무시한다. 리더가 정말 죽었을 때 선거가 그만큼 늦는다(고착의 비용).
- 시험 1·2·3 은 로그가 단순하고 시계가 정확한 3노드 모형이다. 시계 속도 차이, 메시지 지연, 구성 변경은 반영하지 않았다.
- 구성 변경으로 제거된 서버의 방해는 CheckQuorum·Pre-Vote 가 다 못 막는다는 박사 논문 4.2.3절의 결론은 그대로다. 이 경우 하트비트 시간 기반 무시 규칙이 핵심이며, etcd 코드의 `inLease` 규칙이 그 구현에 해당한다(해석).
- 세 장치 모두 **가용성** 장치다. 안전성(리더 둘 금지)은 합의 알고리즘이 지킨다. 다만 리스 읽기는 선형화 가능성이 시간 가정에 걸린다.
- 외부 자원에 쓰는 리더는 여전히 [펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/)이 필요하다.

> 출처 확인 범위: Ongaro 박사 논문 PDF 에서 6.2절(분리된 리더의 사임), 6.4.1절(리스 읽기), 4.2.3절(방해 서버), 9.6절(Pre-Vote)을 본문 텍스트로 직접 읽었다. etcd-io/raft 의 `raft.go` 는 `Config`, `Step` 의 임기 처리부, `MsgVote`·`MsgPreVote` 승인부, `tickHeartbeat`·`stepLeader` 의 CheckQuorum 처리, `MsgTimeoutNow` 처리를 직접 읽었고, `raft_test.go` 는 관련 테스트 이름과 `TestPreVoteWithCheckQuorum` 등의 본문을 읽었다. Go 환경이 없어 etcd 테스트를 실행하지는 못했다. 장난감 모형은 직접 작성해 실행했다. 미확인: 다른 구현(TiKV raft-rs, hashicorp/raft, CockroachDB)이 같은 방식으로 조건을 나눴는지, 시험 3 의 창이 실제 etcd 에서도 관측되는지.

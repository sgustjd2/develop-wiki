---
title: Raft 읽기 경로와 ReadIndex
aka: [ReadIndex, Linearizable Read, Read-only Query, Follower Read, Stale Read, 선형화 가능한 읽기]
category: distributed-systems
level: advanced
summary: 읽기를 로그에 쓰지 않고도 선형화 가능성을 지키는 Raft 의 읽기 절차. 리더가 커밋 인덱스를 적어 두고 하트비트로 과반 확인을 받은 뒤 그 인덱스까지 적용된 상태에서 답한다.
tags: [distributed-systems, raft, linearizability, read-path, readindex, etcd, stale-read]
related: [distributed-systems/raft-consensus, distributed-systems/leader-lease-clock-assumptions, distributed-systems/consistency-models, distributed-systems/paxos-vs-raft, distributed-systems/replication-quorum, distributed-systems/raft-membership-change]
sources:
  - https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf
  - https://raft.github.io/raft.pdf
  - https://etcd.io/docs/v3.5/learning/api_guarantees/
  - https://github.com/etcd-io/raft/blob/main/raft.go
updatedAt: 2026-11-19
---

## 문제

Raft 로 복제한 상태 기계에서 **쓰기**는 로그를 거치면 안전하다. **읽기**는 상태를 바꾸지 않으니 로그를 거칠 이유가 없어 보이지만, 리더가 자기 상태로 곧장 답하면 낡은 값이 나갈 수 있다. 리더가 네트워크에서 떨어져 나간 사이 다른 쪽에서 새 리더가 뽑히고 새 쓰기가 커밋됐는데, 옛 리더는 그 사실을 모르기 때문이다. 이런 읽기는 선형화 가능(linearizable)하지 않다. 박사논문(Ongaro, 6.4절)은 서드파티 Raft 구현 두 곳에서 이미 이 문제가 발견됐다고 짚는다.

읽기를 로그 항목으로 커밋하면 안전하지만, 디스크 동기 쓰기와 복제 왕복이 읽기마다 든다. 읽기가 대부분인 서비스에서는 이 비용을 줄이고 싶다.

## 해법: ReadIndex

리더가 읽기를 받으면 다음 순서를 밟는다(논문 6.4절의 5단계를 자기 말로 정리).

| 단계 | 하는 일 | 왜 필요한가 |
| --- | --- | --- |
| 1 | 자기 임기의 항목이 하나라도 커밋될 때까지 기다린다 | 새 리더는 어디까지 커밋됐는지 아직 모를 수 있다. 임기 시작 no-op 이 커밋되면 자기 commit index 가 다른 서버들 것 이상이 된다 |
| 2 | 현재 commit index 를 `readIndex` 로 저장한다 | 읽기가 반영해야 할 상태의 하한선 |
| 3 | 하트비트를 돌려 과반의 응답을 받는다 | 더 큰 임기의 리더가 이미 있었다면 이 단계에서 걸러진다. 응답이 오면 그 시점에 `readIndex` 가 클러스터 전체에서 가장 큰 commit index 였다고 말할 수 있다 |
| 4 | 상태 머신이 `readIndex` 까지 적용되길 기다린다 | 적용이 덜 된 상태로 읽으면 낡은 값이다 |
| 5 | 로컬 상태 머신에 질의하고 응답한다 | 로그에 쓰지 않으므로 디스크 쓰기가 없다 |

```ts
// 설명용 스케치 (실제 구현은 etcd/raft 의 Step 로직 참고)
async function linearizableRead(leader: Leader, query: Query) {
  await leader.committedEntryInCurrentTerm(); // 1
  const readIndex = leader.commitIndex;       // 2
  await leader.confirmLeadership();           // 3: 하트비트 과반 확인 (여러 읽기를 한 번에 묶을 수 있다)
  await leader.waitApplied(readIndex);        // 4
  return leader.stateMachine.read(query);     // 5
}
```

**배치**: 3단계의 하트비트는 쌓여 있는 읽기 여러 개가 한 번에 쓴다. 5노드에서 하트비트 한 라운드는 메시지 8개(보내기 4 + 응답 4)다. 읽기 1개면 읽기당 8개, 100개를 묶으면 읽기당 0.08개다(아래 모의에서 계산).

**팔로워 읽기**: 팔로워가 리더에게 "현재 readIndex 를 알려 달라"고 요청하면 리더가 1~3단계를 대신 수행한다. 팔로워는 받은 인덱스까지 적용한 뒤 4~5단계를 자기 상태 머신에서 처리한다. 읽기 부하를 리더에서 덜어내되 선형화 가능성은 유지한다. 논문의 LogCabin 은 리더 쪽만 구현했고 팔로워 읽기는 하지 않는다고 적혀 있다.

## 구현에서 보이는 모습 (etcd/raft)

- 읽기 옵션이 둘이다. `ReadOnlySafe` 는 과반과 통신해 선형화 가능성을 보장하는 기본값이고, `ReadOnlyLeaseBased` 는 리더 리스에 기대며 시계 드리프트의 영향을 받는다. 리스 방식은 `CheckQuorum` 을 켜지 않으면 설정 검증에서 오류가 난다(소스 확인).
- `MsgReadIndex` 를 받은 리더는 **자기 임기에 커밋된 항목이 없으면 요청을 보류**한다. 위 1단계를 코드로 지키는 부분이다.
- 클라이언트 쪽에서 etcd 문서는 요청이 기본적으로 선형화 가능하고 Raft 합의를 거치므로 지연이 든다고 설명한다. 요청마다 **serializable** 로 바꾸면 지연과 처리량이 나아지지만 쿼럼 기준으로 낡은 데이터를 돌려줄 수 있다.

## 모의 실험으로 본 것

5노드 Raft 를 단순 모의했다(A 가 임기 1 리더, `{A,B}` 와 `{C,D,E}` 로 분할, C 가 임기 2 에 `x=2` 커밋). 이 모의는 메시지 계층 없이 역할만 흉내 낸 것이라 지연·처리량 수치는 아니다.

- 옛 리더 A 가 로컬로 읽으면 `x = 1` 을 돌려준다(최신은 2). 낡은 읽기다.
- ReadIndex 로 하면 A 가 받을 수 있는 하트비트 응답은 자신과 B 둘뿐(2/5)이라 과반이 안 되고, 읽기는 낡은 값을 내지 않고 대기하거나 거절된다.
- 하트비트 한 라운드 8메시지를 읽기 1·10·100개가 나눠 쓰면 읽기당 8.00·0.80·0.08 메시지다.

## 읽기 방식 비교

| 방식 | 통신 | 시간 가정 | 낡은 읽기 | 비고 |
| --- | --- | --- | --- | --- |
| 읽기를 로그에 커밋 | 로그 복제 1회 + 디스크 쓰기 | 없음 | 없음 | 가장 단순, 가장 비쌈 |
| ReadIndex | 하트비트 확인 1회(배치 가능) | 없음 | 없음 | 디스크 쓰기 없음, 기본 선택지 |
| 리더 리스 | 없음 | 시계 속도 오차 상한 | 가정이 깨지면 가능 | [리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/) |
| 팔로워 + ReadIndex | 팔로워→리더 1회 + 1~3단계 | 없음 | 없음 | 리더 CPU 를 덜지만 왕복이 하나 늘어남 |
| 로컬 읽기(serializable) | 없음 | 없음 | 가능 | 낡아도 되는 조회(대시보드 등)에만 |

## 언제 쓰나

- 선형화 가능한 읽기가 필요한데 읽기가 쓰기보다 훨씬 많은 합의 기반 저장소.
- 시계 가정을 운영으로 보장할 자신이 없을 때. ReadIndex 는 비동기 모델에서도 안전하다.
- 직접 만들기보다 etcd/raft 같은 구현의 읽기 옵션을 쓴다. 이 절차를 건너뛴 구현에서 낡은 읽기 버그가 보고돼 왔다.

## 주의 (비용)

- **읽기마다 최소 한 번의 과반 왕복**이 든다(배치로 나눠 낼 뿐). 리더 한 대가 모든 확인을 처리하므로 확인 트래픽은 리더에 몰린다.
- 임기 시작 직후에는 no-op 커밋이 끝날 때까지 읽기가 지연된다. 리더 교체 직후 읽기 지연이 튀는 이유다.
- 팔로워 읽기는 리더 부하를 덜어도 지연은 오히려 늘 수 있다. 낡아도 되는 읽기를 구분해 serializable 로 보내는 쪽이 대개 더 큰 이득이다.
- ReadIndex 가 보장하는 것은 "읽기 시작 이후의 상태를 본다"까지다. 같은 클라이언트의 연속 읽기가 뒤로 가지 않게 하려면(단조성) 응답에 로그 인덱스를 실어 보내는 등의 보강이 필요하다. 논문이 리스 방식에서 제안하는 방법이다.
- 이 노트는 etcd/raft 의 `raft.go` 소스에서 옵션과 보류 로직을 확인했고, 성능 수치(처리량·지연)는 확인한 자료가 없어 적지 않았다.

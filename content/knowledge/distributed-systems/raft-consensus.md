---
title: Raft 합의 (리더 선출·로그 복제·쿼럼)
aka: [Raft, Consensus, Replicated Log, Replicated State Machine, Leader Election, Log Replication, Majority Quorum, Joint Consensus]
category: distributed-systems
level: advanced
summary: 여러 서버가 같은 순서의 명령 로그에 합의하게 만드는 알고리즘. 리더 하나가 로그를 복제하고 과반이 저장하면 커밋한다. 과반이 살아 있는 한 안전하게 동작한다.
tags: [distributed-systems, raft, consensus, replication, leader-election, quorum, etcd]
related: [distributed-systems/replication-quorum, distributed-systems/logical-clocks, distributed-systems/cap-pacelc, distributed-systems/consistency-models, distributed-systems/two-phase-commit-vs-saga, distributed-systems/idempotency, distributed-systems/gossip-failure-detection]
sources:
  - https://raft.github.io/raft.pdf
updatedAt: 2026-11-19
---

## 문제

설정 저장소, 락 서비스, 분산 DB 의 메타데이터처럼 **틀리면 안 되는 상태**를 여러 서버에 복제하고 싶다. 서버 한 대가 죽어도 계속 동작해야 하지만, 네트워크가 끊겨 양쪽이 각자 "내가 주인"이라고 생각하면(스플릿 브레인) 데이터가 갈라진다.

해법의 틀은 **복제된 상태 기계(replicated state machine)** 다. 모든 서버가 같은 명령 로그를 같은 순서로 적용하면 같은 상태가 된다. 문제는 "같은 순서의 로그"에 합의하는 일이고, 그게 합의 알고리즘의 몫이다. Raft(Ongaro·Ousterhout, 2014)는 Paxos 와 같은 결과를 내면서 이해하기 쉽게 문제를 **리더 선출 / 로그 복제 / 안전성** 으로 쪼갰다.

## 해법 1: 역할과 임기(term)

| 역할 | 하는 일 |
| --- | --- |
| 팔로워 | 수동적. 리더·후보의 RPC 에 응답만 한다 |
| 후보 | 선거 타임아웃이 지나도록 리더 소식이 없으면 스스로 후보가 된다 |
| 리더 | 클라이언트 요청을 받아 로그에 넣고 복제한다. 임기당 최대 1명 |

- **임기(term)** 는 단조 증가하는 번호로, 논리 시계 역할을 한다. 더 큰 term 을 본 서버는 즉시 그 term 으로 올라가고 팔로워가 된다. 옛 term 의 메시지는 거절한다.
- RPC 는 두 종류뿐이다: `RequestVote`(선거), `AppendEntries`(로그 복제 + 하트비트 겸용). 스냅숏 전송용 `InstallSnapshot` 이 더 있다.

## 해법 2: 리더 선출

1. 팔로워가 **무작위 선거 타임아웃**(논문 예: 150~300ms) 동안 하트비트를 못 받으면 term 을 1 올리고 후보가 된다.
2. 자기에게 투표하고 다른 서버에 `RequestVote` 를 보낸다. 각 서버는 term 당 **한 표만** 준다.
3. **과반**의 표를 받으면 리더. 즉시 하트비트를 보내 다른 선거를 막는다.
4. 표가 갈리면(split vote) 타임아웃 후 다시. 타임아웃이 무작위라 대개 한 서버가 먼저 깨어나 이긴다.

**투표 제한(선거 안전성의 핵심)**: 투표자는 후보의 로그가 자기 것보다 **최소한 같은 만큼 최신**일 때만 표를 준다. 비교 순서는 "마지막 항목의 term 이 큰 쪽, 같으면 로그가 긴 쪽". 커밋된 항목은 과반에 있으므로, 과반의 표를 얻은 후보는 반드시 모든 커밋된 항목을 갖고 있다.

## 해법 3: 로그 복제와 커밋

```
index:   1    2    3    4    5
리더   [1:x][1:y][2:z][3:w][3:v]      ← [term:명령]
팔로워A[1:x][1:y][2:z][3:w][3:v]
팔로워B[1:x][1:y][2:z]                 ← 뒤처짐: nextIndex 를 줄여 가며 맞춘다
팔로워C[1:x][1:y][2:q]                 ← 충돌: 리더 것으로 덮어쓴다
```

- 리더는 `AppendEntries` 에 **직전 항목의 (index, term)** 을 같이 보낸다. 팔로워는 그 위치에 같은 term 항목이 없으면 거절한다(일관성 검사).
- 거절당하면 리더는 그 팔로워의 `nextIndex` 를 줄여 다시 보낸다. 일치 지점을 찾으면 팔로워의 그 뒤 충돌 항목을 지우고 리더 것을 붙인다. **리더는 자기 로그를 절대 지우거나 고치지 않는다.**
- 이 귀납 덕분에 **로그 일치 속성**이 유지된다: 두 로그의 같은 index 에 같은 term 이 있으면 그 지점까지 전부 같다.
- **커밋 규칙**: 리더는 **자기 현재 term 의 항목**이 과반에 저장되면 커밋한다. 그러면 앞의 항목도 함께 커밋된다. 이전 term 의 항목을 "과반에 있다"는 이유만으로 커밋하면, 나중에 다른 리더가 덮어쓸 수 있는 시나리오가 있다(논문 Figure 8). 그래서 새 리더는 임기 시작 시 **빈 no-op 항목**을 하나 커밋한다.

```ts
// 리더의 commitIndex 갱신 (단순화)
function advanceCommit(matchIndex: number[], log: { term: number }[], currentTerm: number, commitIndex: number) {
  const sorted = [...matchIndex].sort((a, b) => b - a);   // 리더 자신 포함
  const majorityIdx = sorted[Math.floor(sorted.length / 2)]; // 과반이 가진 최대 index
  if (majorityIdx > commitIndex && log[majorityIdx].term === currentTerm) return majorityIdx;
  return commitIndex; // 이전 term 항목은 직접 커밋하지 않는다
}
```

## 쿼럼 산수

| 서버 수 N | 과반 | 견딜 수 있는 장애 |
| --- | --- | --- |
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 3 | 2 |
| 7 | 4 | 3 |

- 짝수는 이득이 없다(4대는 3대와 같은 1대 장애만 견디면서 쿼럼만 커진다).
- 서버를 늘리면 장애 내성은 커지지만 **커밋마다 더 많은 응답**을 기다려 쓰기 지연이 는다. 보통 3 또는 5.

## 클라이언트와 읽기

- 쓰기는 리더로 보낸다. 리더가 응답 전에 죽으면 클라이언트는 재시도하는데, 이때 같은 명령이 두 번 적용될 수 있다. 논문은 클라이언트별 **일련번호**를 상태 기계가 기억해 중복을 걸러내라고 한다([멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/)).
- **선형화 가능한 읽기**: 리더가 그냥 자기 상태로 답하면, 이미 새 리더가 뽑힌 줄 모르는 옛 리더가 낡은 값을 줄 수 있다. 논문 방식은 (1) 임기 시작 no-op 커밋, (2) 읽기 전에 과반과 하트비트를 주고받아 아직 리더인지 확인. etcd 등은 이를 ReadIndex 라 부른다.
- 하트비트를 **리스(lease)** 로 써서 확인을 생략할 수도 있지만, 논문도 지적하듯 시계 오차가 한정돼 있다는 **시간 가정**에 안전성을 거는 셈이다.

## 운영에 필요한 나머지

- **타이밍 조건**: `broadcastTime ≪ electionTimeout ≪ MTBF`. 논문은 디스크 영속화 때문에 broadcast 가 0.5~20ms 일 수 있어 선거 타임아웃을 10~500ms 범위로 잡을 수 있다고 한다. 리더가 죽으면 대략 선거 타임아웃만큼 쓰기가 멈춘다.
- **영속화**: `currentTerm`, `votedFor`, 로그는 RPC 응답 전에 디스크에 써야 한다(fsync). 커밋 지연의 큰 몫이다.
- **멤버십 변경**: 구성을 한 번에 바꾸면 옛/새 구성에서 과반이 각각 생길 수 있다. 논문은 두 구성의 과반을 모두 요구하는 **공동 합의(joint consensus)** 단계를 거친다. 실무 구현은 한 번에 한 대씩 바꾸는 방식도 많이 쓴다.
- **로그 압축**: 로그가 무한히 커지므로 상태 스냅숏을 찍고 앞부분을 버린다. 많이 뒤처진 팔로워에게는 스냅숏을 통째로 보낸다.
- 제거된 서버가 하트비트를 못 받아 계속 높은 term 으로 선거를 걸어 클러스터를 흔들 수 있다. 논문은 "최소 선거 타임아웃 안에 리더 소식을 들었으면 투표 요청을 무시"하는 규칙으로 막는다.

## 언제 쓰나

- 강한 일관성이 필요한 **작은 핵심 상태**: 설정·서비스 디스커버리(etcd, Consul), 리더 선출·분산 락, 분산 DB 의 범위(range)별 복제(CockroachDB, TiKV 등이 Raft 계열을 쓴다).
- 직접 구현하기보다 검증된 라이브러리(etcd/raft, hashicorp/raft 등)나 그 위의 시스템을 쓴다.

## 주의 (비용)

- **과반이 없으면 멈춘다.** 3대 중 2대가 끊기면 남은 1대는 읽기·쓰기 모두 못 한다(CAP 의 일관성 쪽 선택). [CAP·PACELC](/develop-wiki/knowledge/distributed-systems/cap-pacelc/) 참고.
- 모든 쓰기가 **리더 한 대**를 거친다. 처리량이 리더에 묶이므로 큰 시스템은 데이터를 범위로 쪼개 범위마다 별도 Raft 그룹을 둔다(Multi-Raft).
- 리전을 가로지르는 배치는 커밋마다 리전 간 왕복이 든다.
- 비잔틴 장애(거짓말하는 노드)는 다루지 않는다. 노드는 멈추거나 느릴 뿐 정직하다고 가정한다.
- 직접 구현 시 버그가 매우 흔하다(커밋 규칙, 영속화 순서, 스냅숏 경계). 논문의 TLA+ 명세와 Jepsen 류 테스트로 검증된 구현을 쓴다.

## 비교

| | Raft / Multi-Paxos | 2PC | 리더리스 쿼럼(Dynamo) |
| --- | --- | --- | --- |
| 목적 | 같은 로그 순서에 합의 | 여러 참여자의 커밋/중단 합의 | 가용성 우선 복제 |
| 장애 시 | 과반 살아 있으면 진행 | 코디네이터 장애 시 차단 | 대부분 계속 쓰기 가능 |
| 일관성 | 선형화 가능(읽기 경로 주의) | 원자성 | 최종 일관(설정에 따라) |

[2PC vs 사가](/develop-wiki/knowledge/distributed-systems/two-phase-commit-vs-saga/), [복제와 쿼럼](/develop-wiki/knowledge/distributed-systems/replication-quorum/) 참고.

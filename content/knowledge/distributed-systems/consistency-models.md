---
title: 일관성 모델 (강한·인과·최종)
aka: [Consistency Models, Linearizability, Strong Consistency, Sequential Consistency, Causal Consistency, Eventual Consistency, Session Guarantees, Read Your Writes, Monotonic Reads]
category: distributed-systems
level: advanced
summary: 복제된 데이터를 읽을 때 "무엇을 볼 수 있는가"에 대한 약속들. 선형화 가능성부터 인과·세션 보장·최종 일관성까지, 각 모델이 막는 이상 현상과 가용성 비용.
tags: [distributed-systems, consistency, linearizability, causal, eventual-consistency, replication]
related: [distributed-systems/cap-pacelc, data-modeling/transaction-isolation, cs-fundamentals/memory-model-atomics, distributed-systems/two-phase-commit-vs-saga, architecture/cqrs, performance/caching-strategies]
sources:
  - https://jepsen.io/consistency/models
  - https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html
  - https://www.microsoft.com/en-us/research/publication/replicated-data-consistency-explained-through-baseball/
updatedAt: 2026-11-18
---

## 문제

```
사용자가 프로필 사진을 바꾼다 → 저장 완료
새로고침 → 옛 사진이 보인다        (복제본 A 에 쓰고, 지연된 복제본 B 에서 읽음)
다시 새로고침 → 새 사진
또 새로고침 → 다시 옛 사진         (매번 다른 복제본)
```

복제·캐시가 있는 시스템에서 "최신 값을 읽는다"는 당연하지 않다. **일관성 모델**은 동시 실행되는 읽기·쓰기에서 어떤 결과가 허용되는지에 대한 약속이다. 강할수록 프로그래밍이 쉽고, 약할수록 빠르고 장애에 강하다.

## 모델들 (강한 것 → 약한 것)

단일 객체(키) 기준 모델이다. 여러 객체에 걸친 트랜잭션의 모델(직렬화 가능, 스냅숏 격리 등)은 [트랜잭션 격리](/develop-wiki/knowledge/data-modeling/transaction-isolation/)에서 다룬다. 둘을 합친 것이 **엄격한 직렬화 가능성(strict serializability)** 이다.

| 모델 | 약속 | 막아 주는 것 | 분할 시 가용성 (Jepsen 분류) |
| --- | --- | --- | --- |
| **선형화 가능(linearizable)** | 모든 작업이 호출~응답 사이 어느 한 순간에 원자적으로 일어난 것처럼 보이고, 그 순서가 **실제 시간**을 따른다 | 완료된 쓰기 이후 옛 값 읽기 | 불가 |
| **순차(sequential)** | 모든 노드가 같은 전체 순서를 보고, 각 프로세스의 순서는 지켜짐. 실시간 순서는 아님 | 노드마다 다른 순서 | 불가 |
| **인과(causal)** | 원인 관계(내가 읽은 것 → 그 뒤에 쓴 것)가 있는 작업은 모두가 같은 순서로 본다. 무관한 동시 쓰기는 순서가 달라도 됨 | 답글이 원글보다 먼저 보이는 것 | 고정(sticky) 가용 — 클라이언트가 같은 복제본에 붙어 있으면 가능 |
| **세션 보장** | 아래 네 가지. 한 클라이언트 세션 관점의 약속 | 아래 표 | 일부는 고정 가용, 일부는 완전 가용 |
| **최종(eventual)** | 새 쓰기가 멈추면 언젠가 모든 복제본이 같은 값이 된다. 그 전엔 아무거나 | 영구적 불일치만 | 완전 가용 |

### 세션 보장 (Terry 등, 1994)

| 보장 | 의미 | 위 예시에서 |
| --- | --- | --- |
| Read Your Writes | 내가 쓴 것은 내가 이후에 반드시 본다 | 사진 바꾼 뒤 옛 사진이 안 보임 |
| Monotonic Reads | 한 번 본 것보다 과거로 돌아가지 않는다 | 새 사진 → 옛 사진 왕복이 없음 |
| Monotonic Writes | 내 쓰기들은 내가 쓴 순서대로 적용된다 | "비공개로 변경 → 사진 업로드" 순서가 뒤집히지 않음 |
| Writes Follow Reads | 내가 읽고 나서 쓴 것은, 읽은 것 뒤에 적용된다 | 읽은 글에 단 답글이 원글보다 앞서지 않음 |

인과 일관성은 이 세션 보장들을 포함한다(인과 관계를 지키면 내 쓰기·내 읽기 순서도 지켜진다). Jepsen 분류에서 Read Your Writes 부터는 클라이언트가 같은 서버에 붙어 있어야(sticky) 분할 중에도 가용하고, Monotonic Reads·Monotonic Writes·Writes Follow Reads 는 완전 가용이다.

## 해법: 필요한 곳에만 강하게

```ts
// Read Your Writes 를 앱 수준에서: 쓰기 직후 잠깐은 리더(주 DB)에서 읽기
async function getProfile(userId: string, session: Session) {
  const recentlyWrote = Date.now() - (session.lastWriteAt ?? 0) < 5_000;
  const db = recentlyWrote ? primary : replica;      // 복제 지연 상한보다 길게
  return db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
}
```

다른 방법:

- 쓰기 응답에 **버전·LSN·토큰**을 돌려주고, 읽을 때 "최소 이 버전 이상"을 요구(복제본이 따라올 때까지 대기하거나 리더로).
- 사용자를 같은 복제본에 고정(sticky session)해 Monotonic Reads 확보.
- DB 기능 사용: MongoDB 인과 일관 세션, Cosmos DB 의 세션 일관성 수준, DynamoDB `ConsistentRead`.

## 언제 무엇을

| 필요 | 모델 |
| --- | --- |
| 유일성 제약, 리더 선출, 분산 락, 재고·잔액의 정확한 차감 | 선형화 가능 (합의 기반: etcd, ZooKeeper 쓰기, Spanner 등) |
| 댓글·채팅·협업 편집에서 순서가 뒤집혀 보이면 안 됨 | 인과 |
| 사용자 자신의 화면이 이상하지 않으면 됨 (대부분의 웹 앱) | 세션 보장 (특히 Read Your Writes + Monotonic Reads) |
| 조회수, 좋아요 수, 추천 목록, 검색 인덱스, CQRS 읽기 모델 | 최종 |

## 주의

- "eventual" 에는 **얼마나 걸리는지**가 없다. 복제 지연을 메트릭으로 보고, 앱이 감당할 상한을 정한다.
- 최종 일관 시스템에서 동시 쓰기 충돌은 누군가 해소해야 한다. "마지막 쓰기 승리(LWW)"는 시계 차이로 쓰기를 **조용히 잃는다**. 업무상 합칠 수 있으면 CRDT 나 병합 로직을 쓴다.
- 캐시도 복제본이다. DB 가 선형화 가능해도 앞단 캐시가 있으면 앱이 보는 일관성은 캐시 수준으로 떨어진다. [캐싱 전략](/develop-wiki/knowledge/performance/caching-strategies/) 참고.
- 같은 단어가 분야마다 다르다. DB 격리의 "serializable" 은 실시간 순서를 보장하지 않고, CPU 메모리 모델의 "sequential consistency" 와 분산 시스템의 그것은 맥락이 다르다. [메모리 모델](/develop-wiki/knowledge/cs-fundamentals/memory-model-atomics/) 참고.
- 문서의 주장은 검증된 것이 아닐 수 있다. Jepsen 같은 독립 테스트에서 광고된 보장을 지키지 못한 사례가 많다.

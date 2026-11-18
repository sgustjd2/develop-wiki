---
title: CAP 정리와 PACELC
aka: [CAP Theorem, Brewer's Theorem, PACELC, Network Partition, Consistency vs Availability, Consistency vs Latency]
category: distributed-systems
level: intermediate
summary: 네트워크 분할 중에는 선형화 가능성과 가용성을 동시에 가질 수 없다는 CAP 의 정확한 의미와 한계, 평상시의 지연-일관성 트레이드오프까지 더한 PACELC.
tags: [distributed-systems, cap, pacelc, replication, consistency, availability]
related: [distributed-systems/consistency-models, distributed-systems/two-phase-commit-vs-saga, data-modeling/sharding-partitioning, data-modeling/transaction-isolation, distributed-systems/idempotency]
sources:
  - https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html
  - https://cs.umd.edu/~abadi/papers/abadi-pacelc.pdf
  - https://jepsen.io/consistency/models
updatedAt: 2026-11-18
---

## 문제

데이터를 여러 노드에 복제하면 장애를 견디고 가까운 곳에서 읽을 수 있다. 하지만 노드 사이 네트워크가 끊기면(분할), 끊긴 양쪽이 각자 요청을 받을 때 어떻게 해야 하나? "CP 냐 AP 냐"라는 말이 흔히 쓰이지만, 정확한 뜻을 모르면 DB 선택을 잘못 이해하게 된다.

## CAP 정리: 정확히 무엇을 말하나

Brewer 의 추측(2000)을 Gilbert·Lynch 가 2002년에 증명했다. 증명에서 세 글자의 뜻은 일상어보다 훨씬 좁다.

| 글자 | 증명에서의 정의 | 흔한 오해 |
| --- | --- | --- |
| C (Consistency) | **선형화 가능성**: 작업 B 가 A 완료 후 시작했다면, B 는 A 의 결과(또는 그보다 최신)를 본다 | ACID 의 C(제약 조건 만족)와 다른 것 |
| A (Availability) | **장애 나지 않은 모든 노드**가 모든 요청에 (오류 아닌) 응답 | "대부분 살아 있음", "SLA 99.9%" 와 다른 것 |
| P (Partition tolerance) | 네트워크가 메시지를 지연·유실해도 동작 | 선택 항목이 아님 |

결론: **분할이 일어나면** 선형화 가능성과 (위 정의의) 가용성 중 하나를 포기해야 한다.

```
   [노드 1] ──X── [노드 2]        클라이언트가 노드 2 에 write(x=2)
                                   다른 클라이언트가 노드 1 에 read(x)
   선택 C: 노드 1 은 답을 거부(또는 대기) → 가용성 포기
   선택 A: 노드 1 이 옛 값 x=1 을 응답    → 선형화 포기
```

### "CA 를 고른다"는 없다

네트워크 분할은 고를 수 있는 것이 아니라 **일어나는 일**이다(스위치 장애, GC 정지로 인한 응답 없음도 다른 노드 입장에선 분할과 같다). 그래서 실제 선택은 "분할이 났을 때 C 와 A 중 무엇을 내주나"뿐이다.

### CP/AP 딱지의 한계 (Kleppmann)

- 단일 리더 복제 + 비동기 팔로워 읽기: 분할 시 소수 쪽은 쓰기 불가(A 아님), 팔로워 읽기는 옛 값 가능(C 아님) → **둘 다 아님**.
- 스냅숏 격리·MVCC 는 의도적으로 선형화 가능하지 않다.
- Dynamo 계열은 설정(R, W)에 따라 성질이 바뀐다.
- CAP 는 레지스터 하나, 분할 장애만 다루고 **지연을 전혀 다루지 않는다.** 2분 걸려 응답해도 CAP 상으로는 "가용"이다.

그래서 시스템을 설명할 때는 "CP/AP" 대신 **어떤 일관성 모델을 보장하는지**와 **장애 시 무엇이 되고 안 되는지**를 구체적으로 말하는 편이 낫다. [일관성 모델](/develop-wiki/knowledge/distributed-systems/consistency-models/) 참고.

## PACELC: 평상시의 트레이드오프까지

Daniel Abadi(2012)는 CAP 보다 **평상시 지연과 일관성의 트레이드오프**가 실제 설계에 더 큰 영향을 준다고 지적했다. 복제를 하는 순간, 분할이 없어도 "쓰기를 모든 복제본에 확인받고 응답(느리지만 일관)"과 "하나만 쓰고 응답(빠르지만 복제본마다 다를 수 있음)" 사이에서 골라야 한다.

> **P**artition 이면 **A** 와 **C** 중 하나, **E**lse(평상시)면 **L**atency 와 **C** 중 하나.

| 분류 | 의미 | 논문에서의 예 (기본 설정 기준) |
| --- | --- | --- |
| PA/EL | 분할 시 가용성, 평상시 지연 우선 | Dynamo, Cassandra, Riak |
| PC/EC | 언제나 일관성 우선, 대가로 지연·가용성 지불 | VoltDB/H-Store, Megastore, BigTable/HBase |
| PA/EC | 평상시 일관, 분할 시 가용성 쪽으로 | MongoDB (2012년 당시 분석) |
| PC/EL | 평상시 지연 우선, 분할 시 일관성 기준을 더 낮추지 않고 가용성을 포기 | PNUTS |

이 분류는 2012년 시점의 기본 설정 기준이다. 오늘날 제품은 버전과 설정(쓰기 확인 수, 읽기 일관성 옵션)에 따라 달라지므로 직접 문서를 확인한다.

## 실무에서 어떻게 쓰나

- 질문을 바꾼다: "이 DB 는 CP 인가?" 대신
  - 리더 장애·분할 때 **쓰기**가 되나? 얼마나 멈추나?
  - 내가 방금 쓴 것을 **바로 읽을 수** 있나? 다른 사용자는?
  - 일관된 읽기를 요청하면 지연이 얼마나 늘어나나?
- 기능별로 다르게 고른다. 잔액·재고·유일성 제약은 일관성(PC/EC 쪽 설정), 피드·조회수·추천은 지연·가용성(PA/EL 쪽 설정).
- Cassandra·DynamoDB·Cosmos DB 처럼 요청 단위로 일관성 수준을 고를 수 있는 시스템은 쿼리마다 이 결정을 한다.

```ts
// 예: DynamoDB 는 읽기마다 선택 (기본은 최종 일관 읽기)
await ddb.send(new GetItemCommand({ TableName: 'accounts', Key: key, ConsistentRead: true }));
```

## 주의

- CAP 를 "셋 중 둘을 고른다"로 외우면 틀린다. 분할이 없을 때는 셋 다 가질 수 있고, 분할 시의 선택만 강제된다.
- CAP 의 A 를 포기한 시스템도 실제로는 매우 높은 가용성을 낼 수 있다(대부분의 클라이언트가 다수파 쪽에 붙어 있으면). 반대로 CAP-가용 시스템도 운영 실수로 얼마든지 멈춘다.
- 쿼럼 설정 `R + W > N` 만으로 선형화가 보장되지는 않는다(Abadi 도 지적). 동시 쓰기·읽기 복구·시계 문제 때문이다.
- 제품 문서의 "strong consistency" 가 무엇을 뜻하는지 확인한다. 단일 키 선형화인지, 트랜잭션 직렬화인지, 리전 내에서만인지. Jepsen 분석 보고서가 있으면 읽는다.

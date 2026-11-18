---
title: 사가 패턴
aka: [Saga Pattern, Saga, 보상 트랜잭션]
category: distributed-systems
level: advanced
summary: 여러 서비스에 걸친 업무 트랜잭션을 서비스별 로컬 트랜잭션의 연속으로 나누고, 중간에 실패하면 보상 트랜잭션으로 앞선 단계를 되돌리는 패턴.
tags: [microservices, transaction, compensation, orchestration, choreography]
related: [distributed-systems/transactional-outbox, distributed-systems/idempotency, architecture/event-driven, design-patterns/command]
sources:
  - https://microservices.io/patterns/data/saga.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/saga
  - https://www.cs.princeton.edu/research/techreps/598
updatedAt: 2026-11-18
---

이름은 Hector Garcia-Molina 와 Kenneth Salem 의 1987년 논문 *Sagas* 에서 왔다(원래는 단일 DB 의 긴 트랜잭션을 쪼개는 기법). 지금은 주로 마이크로서비스의 데이터 일관성 문제에 쓰인다.

## 문제

서비스마다 DB 를 따로 가지면(database per service) "주문 생성 + 재고 차감 + 결제"를 하나의 ACID 트랜잭션으로 묶을 수 없다. 2단계 커밋(2PC)은 브로커·NoSQL 이 지원하지 않거나, 참여자 하나만 느려도 전체가 잠겨 가용성이 떨어진다.

## 해법

업무 트랜잭션을 **로컬 트랜잭션의 순서**로 나눈다. 각 단계는 자기 DB 에 커밋하고 다음 단계를 이벤트·메시지로 일으킨다. 실패하면 이미 끝난 단계를 **보상 트랜잭션**(반대 효과를 내는 별도 작업)으로 거꾸로 되돌린다.

| 단계 종류 | 의미 | 예 |
| --- | --- | --- |
| 보상 가능(compensable) | 실패 시 반대 작업으로 되돌릴 수 있음 | 주문 생성 ↔ 주문 취소, 재고 예약 ↔ 예약 해제 |
| 피벗(pivot) | 되돌릴 수 없는 분기점. 성공하면 사가는 끝까지 가야 함 | 결제 승인 |
| 재시도 가능(retryable) | 피벗 이후 단계. 멱등하게 만들어 성공할 때까지 재시도 | 배송 요청, 알림 발송 |

```ts
// 오케스트레이션 사가 (단순화)
const steps = [
  { run: orders.create,     compensate: orders.cancel },
  { run: inventory.reserve, compensate: inventory.release },
  { run: payments.charge,   compensate: null },  // 피벗: 이후는 재시도만
];

async function placeOrder(ctx: OrderCtx) {
  const done: typeof steps = [];
  for (const s of steps) {
    try { await s.run(ctx); done.push(s); }
    catch (e) {
      for (const d of done.reverse()) await d.compensate?.(ctx); // 역순 보상
      throw e;
    }
  }
  await retryUntilOk(() => shipping.request(ctx)); // 재시도 가능 단계
}
```

실제로는 각 단계의 진행 상태를 DB 에 저장해, 오케스트레이터가 재시작해도 이어서 진행할 수 있어야 한다.

## 코레오그래피 vs 오케스트레이션

| | 코레오그래피 | 오케스트레이션 |
| --- | --- | --- |
| 조정 방식 | 각 서비스가 이벤트를 발행·구독해 다음 단계를 일으킴 | 중앙 오케스트레이터가 참여자에게 무엇을 할지 명령 |
| 장점 | 별도 조정 서비스 불필요, 단일 장애점 없음 | 흐름이 한곳에 보임, 순환 의존 방지, 복잡한 흐름에 적합 |
| 단점 | 단계가 늘면 흐름 파악 어려움, 순환 의존 위험, 통합 테스트 어려움 | 조정 로직 구현 필요, 오케스트레이터가 장애점 |
| 맞는 곳 | 참여자 2~3개의 단순 흐름 | 참여자가 많거나 분기·타임아웃이 있는 흐름 |

Temporal, AWS Step Functions 같은 워크플로 엔진이 오케스트레이터의 상태 저장·재시도를 대신해 준다.

## 언제 쓰나

- 서비스별 DB 를 가진 구조에서 여러 서비스에 걸친 업무를 일관되게 끝내야 할 때
- 실패 시 "되돌리기"를 업무적으로 정의할 수 있을 때 (취소, 환불, 예약 해제)

## 주의 (비용)

- **자동 롤백이 없다.** 보상 로직은 직접 설계해야 하고, 보상 자체가 실패할 수도 있다.
- **격리가 없다.** 다른 사가가 중간 상태를 읽을 수 있다(dirty read, lost update). 대응책: 의미적 잠금(`PENDING` 상태 표시), 순서 무관한 교환 가능 갱신, 위험한 갱신을 재시도 단계로 옮기기, 갱신 전 값 다시 읽기.
- 각 단계의 "DB 갱신 + 메시지 발행"은 원자적이어야 한다 → [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/).
- 메시지는 중복 전달되므로 모든 단계와 보상은 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)해야 한다.
- 동기 요청으로 사가를 시작한 클라이언트에게 결과를 알릴 방법(대기, 상태 폴링, 푸시)이 필요하다.
- 참여자가 늘수록 디버깅·모니터링 비용이 커진다. 사가 ID 로 전 과정을 추적한다.
- 단계들이 강하게 얽혀 있거나 순환 의존이 있다면, 서비스 경계를 다시 보는 편이 낫다.

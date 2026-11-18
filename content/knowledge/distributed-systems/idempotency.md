---
title: 멱등성
aka: [Idempotency, Idempotent Consumer, Idempotency Key]
category: distributed-systems
level: intermediate
summary: 같은 요청·메시지를 여러 번 처리해도 한 번 처리한 것과 결과가 같도록 만드는 성질. 재시도와 중복 전달을 안전하게 만든다.
tags: [retry, messaging, http, reliability, at-least-once]
related: [distributed-systems/transactional-outbox, distributed-systems/saga, architecture/event-driven, architecture/cqrs]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/idempotent-consumer
  - https://developer.mozilla.org/en-US/docs/Glossary/Idempotent
  - https://docs.stripe.com/api/idempotent_requests
updatedAt: 2026-11-18
---

## 문제

네트워크에서는 "요청이 실패했는지, 응답만 잃어버렸는지" 구분할 수 없다.

- 결제 API 호출이 타임아웃 → 재시도 → 실제로는 첫 요청도 성공해 **이중 결제**.
- 대부분의 메시지 브로커(Kafka, RabbitMQ, SQS, Service Bus)는 **최소 한 번(at-least-once)** 전달이다. 소비자가 처리 후 ack 전에 죽으면 같은 메시지가 다시 온다.

분산 시스템 전체에서 "정확히 한 번 전달"은 현실적으로 보장할 수 없다. 대신 **최소 한 번 전달 + 멱등 처리 = 사실상 한 번(effectively-once)** 을 목표로 한다.

## 해법

### 1. 자연 멱등 연산으로 설계 (우선)

| 멱등 아님 | 멱등 |
| --- | --- |
| `balance += 100` | `balance = 1100` (절댓값 설정) |
| `INSERT` | 업무 키 기준 `UPSERT` |
| `POST /orders` | `PUT /orders/{clientGeneratedId}` |
| "상태를 다음 단계로" | "상태를 `SHIPPED` 로" (+ 버전 검사) |

HTTP 에서 GET·HEAD·OPTIONS·TRACE(안전한 메서드)와 PUT·DELETE 는 의미상 멱등이고, POST·PATCH 는 보장되지 않는다. 멱등이라도 응답은 다를 수 있다(두 번째 DELETE 가 404).

### 2. 멱등 키로 중복 제거

요청·메시지마다 안정적인 키를 두고, "처리한 키"를 저장해 두 번째부터는 건너뛰거나 저장된 결과를 돌려준다.

```ts
async function handlePayment(msg: { id: string; orderId: string; amount: number }) {
  await db.transaction(async (tx) => {
    // 고유 제약이 동시 중복까지 막는다 (check-then-insert 경쟁 방지)
    const inserted = await tx.query(
      `insert into processed_messages (consumer, message_id) values ('payment', $1)
       on conflict do nothing returning 1`, [msg.id]);
    if (inserted.rowCount === 0) return;      // 이미 처리됨 → 건너뜀
    await tx.query('insert into payments(order_id, amount) values ($1, $2)',
      [msg.orderId, msg.amount]);              // 업무 처리와 키 기록을 같은 트랜잭션에
  });
  // 커밋 후 ack
}
```

API 쪽에서는 클라이언트가 `Idempotency-Key` 헤더(UUID v4 등)를 보내고, 서버는 첫 응답(상태 코드·본문)을 저장해 같은 키의 재시도에 그대로 돌려준다. Stripe(API v1 기준)는 같은 키로 다른 파라미터가 오면 오류를 내고, 24시간 이상 지난 키는 정리될 수 있다. API v2 는 저장된 응답을 그대로 돌려주는 대신 실패한 작업을 끝까지 재시도하는 방식으로 동작이 다르다.

## 언제 쓰나

- 재시도가 있는 모든 곳: 클라이언트 재시도, 메시지 재전달, 배치 재실행, 웹훅 수신, 스트림 체크포인트 재개
- 중복 처리 결과가 해로운 연산: 결제, 재고 차감, 리소스 생성, 알림 발송

## 주의 (비용)

- **키 선택**: 재전달 때도 바뀌지 않는 값이어야 한다. 브로커가 재전달마다 새로 붙이는 전송 ID, 수신 시각은 안 된다. 상관관계 ID(여러 메시지가 공유)도 안 된다.
- **원자성**: "처리"와 "키 기록"이 따로 커밋되면 그 사이 장애로 중복이 생긴다. 같은 트랜잭션으로 묶는다(Inbox 패턴, [아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)의 소비자 쪽 짝).
- **트랜잭션에 못 넣는 외부 호출**: `진행 중` 상태로 키를 먼저 기록 → 외부 호출 → `완료`로 갱신. `진행 중`으로 남은 건은 따로 조정한다. 하위 서비스에도 멱등 키를 전파한다.
- **보관 기간**: 키 기록은 브로커가 재전달할 수 있는 기간보다 오래 둬야 한다. DLQ 에서 늦게 재투입되는 메시지도 고려한다.
- **같은 키, 다른 내용**: 키가 같은데 본문이 다르면 조용히 무시하지 말고 오류·알림으로 처리한다.
- 멱등성은 중복만 막고 **순서는 보장하지 않는다.** 순서가 중요하면 버전·시퀀스 번호로 오래된 메시지를 거른다.
- 브로커의 중복 감지 기능은 보내는 쪽 재시도만 일정 시간 안에서 줄여 줄 뿐, 소비자 멱등 처리를 대신하지 못한다.

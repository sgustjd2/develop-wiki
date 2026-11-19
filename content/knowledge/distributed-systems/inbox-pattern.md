---
title: 인박스 패턴 (소비자 측 중복 제거)
aka: [Inbox Pattern, Transactional Inbox, Idempotent Consumer, Processed Messages Table, Message Deduplication, 멱등 소비자]
category: distributed-systems
level: intermediate
summary: 소비자가 받은 메시지의 ID 를 업무 데이터와 같은 DB 트랜잭션에 기록해, 최소 한 번 전달되는 메시지가 여러 번 와도 효과는 한 번만 나게 하는 패턴. 아웃박스(발행 측)의 짝이다.
tags: [messaging, microservices, idempotency, deduplication, at-least-once, outbox]
related: [distributed-systems/idempotency, distributed-systems/transactional-outbox, distributed-systems/outbox-cdc-operations, distributed-systems/change-data-capture, distributed-systems/saga, architecture/event-driven]
sources:
  - https://microservices.io/patterns/communication-style/idempotent-consumer.html
  - https://microservices.io/post/microservices/patterns/2020/10/16/idempotent-consumer.html
  - https://learn.microsoft.com/en-us/azure/service-bus-messaging/duplicate-detection
updatedAt: 2026-11-19
---

## 문제

브로커는 대개 **최소 한 번(at-least-once)** 전달이다. 소비자가 DB 를 갱신하고 ack 를 보내기 전에 죽으면 브로커가 같은 메시지를 다시 보낸다. 소비자가 "잔액에서 10 을 뺀다" 같은 비멱등 처리를 하면 재전달마다 효과가 중복된다. microservices.io 도 Kafka 의 정확히-한-번 기능은 Kafka 가 만든 메시지끼리의 중복만 걸러 주며, 소비자가 DB 에 하는 일이 다시 실행되는 것은 막지 못한다고 짚는다.

[아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)가 **보내는 쪽**의 "DB 갱신과 발행의 원자성"을 해결한다면, 인박스는 **받는 쪽**의 "처리와 중복 기록의 원자성"을 해결한다. 일반 원칙은 [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) 노트에 있고, 이 노트는 그중 메시지 ID 를 DB 에 남기는 방식을 패턴으로 떼어 자세히 다룬다.

## 해법

소비자 DB 에 인박스(처리한 메시지) 테이블을 두고, **메시지를 처리하는 트랜잭션 안에서** `(소비자, 메시지 ID)` 를 삽입한다. 기본키(또는 유니크 제약)가 중복을 막는다. 삽입이 실패하면 이미 처리한 메시지이므로 롤백하고 ack 만 보낸다.

```sql
create table inbox (
  consumer   text not null,
  message_id text not null,
  primary key (consumer, message_id)
);
```

```ts
async function handle(msg: { id: string; amount: number }) {
  await db.transaction(async (tx) => {
    const inserted = await tx.inbox.insertIfAbsent({ consumer: 'payment', messageId: msg.id });
    if (!inserted) return;                    // 이미 처리됨: 아무 효과 없이 ack
    await tx.accounts.add(msg.amount);        // 업무 갱신은 같은 트랜잭션
  });
  await broker.ack(msg);                      // 커밋 뒤에 ack. 여기서 죽으면 재전달되지만 위에서 걸러진다
}
```

microservices.io 는 이 방식을 Idempotent Consumer 라는 이름으로 설명하고 두 가지 변형을 든다.

1. **처리한 메시지 테이블**: 위 방식. 구독자 ID 와 메시지 ID 의 복합키가 유니크 제약이다.
2. **업무 엔티티에 ID 기록**: 갱신하는 엔티티 안에 처리한 메시지 ID(또는 그 집합)를 두고 조건부 갱신으로 중복을 거절한다. 다중 테이블 트랜잭션이 없는 NoSQL(그 글의 예는 DynamoDB)에 맞다. 애그리거트 이벤트 ID 가 단조 증가하면 "본 것 중 가장 큰 ID" 하나만 저장하는 가벼운 변형도 가능하다.

### 설계 선택: 저장 후 처리

위 패턴은 "받으면서 처리"한다. 다른 선택지는 **메시지 본문까지 인박스에 저장하고 바로 ack, 처리는 별도 워커가 인박스에서 꺼내 수행**하는 것이다. 브로커 소비 속도와 처리 속도를 분리하고 재처리·모니터링이 쉬워지지만, 워커의 중복 실행을 막는 잠금(`FOR UPDATE SKIP LOCKED` 등)과 상태 컬럼, 재시도 정책을 직접 설계해야 한다. 이 변형은 위 출처에서 정의를 확인하지 못했고 설계 선택지로만 적는다.

## 순서가 전부다: 모의 실험

1000개 메시지(각 +10), 처리 후 ack 전에 죽을 확률 20%, 커밋 전에 죽을 확률 5% 로 재전달을 흉내 냈다(SQLite 메모리 DB, 단일 스레드). 기대 잔액은 10000 이다.

| 구성 | 전달 횟수 | 최종 잔액 |
| --- | --- | --- |
| 방어 없음 | 1334 | 12550 (중복 반영) |
| 인박스 ID 삽입과 업무 갱신을 **한 트랜잭션** | 1286 (중복 차단 239건) | **10000** |
| 업무 갱신 커밋 뒤 **별도 트랜잭션**으로 ID 기록 | 1257 | 12570 (중복 반영) |

세 번째처럼 "처리 → ID 기록"을 나누면 그 사이 장애에서 중복이 새어 나간다. 반대로 "ID 기록 → 처리"를 나누면 ID 만 남고 처리는 안 돼 **효과가 유실**된다. 두 기록이 한 트랜잭션이어야 한다는 것이 이 패턴의 핵심이다. 수치는 모의 환경 값이다.

## 인박스 vs 브로커의 중복 감지

| | 소비자 인박스 | Azure Service Bus 중복 감지 |
| --- | --- | --- |
| 막는 중복 | 브로커의 **재전달**(소비자 쪽) | **송신 재시도**로 큐에 같은 메시지가 두 번 들어감 |
| 기준 | 메시지 ID(+소비자) | 애플리케이션이 정한 `MessageId` |
| 범위 | 영구(보존 정책에 따름) | 설정한 시간 창(기본 10분, 최소 20초, 최대 7일) |
| 업무 처리와 원자성 | **같은 DB 트랜잭션** | 없음. 브로커 안에서만 |
| 비용 | 소비자 DB 저장·삽입 | 창이 클수록 처리량 영향 |

Service Bus 문서는 중복 감지가 송신 쪽의 "보냈는지 불확실한" 상황을 풀기 위한 것이며, 보낸 `MessageId` 가 시간 창 안에 기록돼 있으면 새 메시지를 성공으로 응답하고 바로 버린다고 설명한다. 소비자 측 재전달(잠금 만료 후 재배달 등)을 업무 DB 와 원자적으로 막는 일은 별개이므로 둘은 대체 관계가 아니다. [아웃박스 + CDC](/develop-wiki/knowledge/distributed-systems/outbox-cdc-operations/)에서 이벤트 `id` 를 헤더로 보내는 것도 이 인박스에서 쓰라는 뜻이다.

## 언제 쓰나

- 소비 처리가 비멱등(금액 가산, 재고 차감, 이메일 발송 기록 등)이고 브로커가 최소 한 번 전달일 때.
- 소비자가 관계형 DB 를 갖고 있어 업무 갱신과 ID 삽입을 한 트랜잭션에 넣을 수 있을 때.
- 아웃박스로 이벤트를 발행하는 시스템의 소비자 쪽 짝.

## 주의 (비용)

- **메시지 ID 가 안정적이어야 한다.** 재전달·재발행에도 같은 ID 여야 한다. 재시도마다 새 UUID 를 만들면 중복이 아니라 새 메시지가 된다. 비즈니스 컨텍스트에서 재구성 가능한 ID(주문번호+이벤트 종류)가 낫다는 것이 Service Bus 문서의 설명이기도 하다.
- **저장과 정리**: 인박스는 계속 커진다. 보존 기간은 "재전달이 올 수 있는 최대 시간"보다 길어야 하고, 지운 뒤에 늦게 온 중복은 다시 처리된다. 보존 창을 정하는 방법은 위 출처에서 확인하지 못했다.
- **DB 가 업무 데이터와 같아야 한다.** 효과가 외부 시스템(결제 API, 메일)이면 인박스 트랜잭션이 그 호출을 감싸지 못한다. 그 호출 자체에 멱등 키를 보내거나, 호출을 [아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)로 돌려 같은 문제를 한 단계 뒤로 옮겨야 한다.
- 메시지마다 삽입이 하나 더 들어가므로 처리량이 높은 소비자는 쓰기와 인덱스 크기가 늘어난다. 얼마나 늘지는 직접 측정해야 하며, 이 노트는 측정하지 않았다.
- **순서는 보장하지 않는다.** 중복 제거는 순서와 별개다. 순서가 중요하면 키 단위 파티셔닝이나 버전 비교를 따로 둔다.
- 동시에 같은 메시지를 받는 두 소비자 중 하나만 이기는 것은 유니크 제약이 보장하지만, 진 쪽이 오류를 던지는 방식이 아니라 "이미 처리됨"으로 깔끔하게 ack 하도록 처리 코드를 짠다.

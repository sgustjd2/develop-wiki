---
title: 트랜잭셔널 아웃박스
aka: [Transactional Outbox, Outbox Pattern]
category: distributed-systems
level: intermediate
summary: 보낼 메시지를 업무 데이터와 같은 DB 트랜잭션으로 아웃박스 테이블에 저장하고, 별도 프로세스가 이를 브로커로 전달해 DB 갱신과 메시지 발행을 원자적으로 만드는 패턴.
tags: [messaging, microservices, dual-write, reliability]
related: [distributed-systems/idempotency, distributed-systems/saga, architecture/event-driven, architecture/cqrs]
sources:
  - https://microservices.io/patterns/data/transactional-outbox.html
  - https://microservices.io/patterns/data/polling-publisher.html
  - https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-out-box-cosmos
updatedAt: 2026-11-18
---

## 문제

주문을 DB 에 저장하고 `OrderCreated` 이벤트를 브로커에 발행한다. 두 시스템에 따로 쓰는 **이중 쓰기(dual write)** 다.

- 커밋 후 발행 전에 프로세스가 죽거나 브로커가 장애 → 주문은 있는데 이벤트가 없다. 재고·결제 서비스는 영영 모른다.
- 발행을 트랜잭션 안에서 먼저 하면 → 이후 롤백돼도 이벤트는 이미 나갔다.
- DB 와 브로커를 2PC 로 묶는 것은 대개 지원되지 않거나 비싸다.

## 해법

1. 업무 데이터를 바꾸는 **같은 로컬 트랜잭션** 안에서 메시지를 `outbox` 테이블에 INSERT 한다. 커밋되면 둘 다, 롤백되면 둘 다 없다.
2. **메시지 릴레이**가 아웃박스를 읽어 브로커로 발행하고, 발행한 행을 처리됨으로 표시(또는 삭제)한다.

```ts
// 1) 업무 데이터와 메시지를 한 트랜잭션에
await db.transaction(async (tx) => {
  const order = await tx.orders.insert({ customerId, total });
  await tx.outbox.insert({
    id: uuid(), aggregateId: order.id, type: 'OrderCreated',
    payload: JSON.stringify({ orderId: order.id, total }),
  });
});

// 2) 릴레이 (폴링 방식)
setInterval(async () => {
  const rows = await db.outbox.findUnpublished({ limit: 100, orderBy: 'created_at' });
  for (const r of rows) {
    await broker.publish(r.type, r.payload, { messageId: r.id }); // id 를 멱등 키로
    await db.outbox.markPublished(r.id);  // 여기 전에 죽으면 → 다음에 재발행(중복)
  }
}, 1000);
```

### 릴레이 방식

| | 폴링 퍼블리셔 | 트랜잭션 로그 테일링 (CDC) |
| --- | --- | --- |
| 방법 | 주기적으로 아웃박스 테이블을 조회 | DB 커밋 로그(WAL, binlog, change feed)를 읽음 |
| 장점 | 어떤 SQL DB 에서도 단순하게 구현 | DB 부하가 적고 지연이 짧음, 커밋 순서를 따름 |
| 단점 | DB 에 조회 부하, 순서 보장·다중 릴레이 처리가 까다로움 | DB 별 도구 필요(예: Debezium, Cosmos DB change feed), 운영 복잡 |

## 언제 쓰나

- 상태 변경과 이벤트 발행이 반드시 함께 일어나야 할 때 ([사가](/develop-wiki/knowledge/distributed-systems/saga/) 각 단계, [CQRS](/develop-wiki/knowledge/architecture/cqrs/) 읽기 모델 동기화, 도메인 이벤트 발행)
- 이벤트 유실이 데이터 불일치로 이어지는 [이벤트 드리븐](/develop-wiki/knowledge/architecture/event-driven/) 구조

## 주의 (비용)

- **중복 발행은 피할 수 없다.** 릴레이가 발행 후 표시 전에 죽으면 같은 메시지를 다시 보낸다. 메시지 ID 를 담아 보내고 소비자를 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)하게 만든다.
- **순서**: 같은 집합체(aggregate)의 이벤트 순서를 지키려면 생성 순으로 읽고, 브로커 파티션 키를 집합체 ID 로 둔다. 릴레이를 여러 개 띄우면 순서가 깨질 수 있다.
- **빠뜨리기 쉽다.** 개발자가 아웃박스 기록을 잊지 않도록, 리포지토리·작업 단위(Unit of Work)에서 도메인 이벤트를 모아 자동으로 기록하게 한다.
- **정리**: 아웃박스는 계속 쌓인다. 발행된 행을 삭제하거나 TTL 로 지운다.
- 업무 데이터와 아웃박스가 **같은 트랜잭션 범위**에 있어야 한다. 문서 DB 라면 같은 파티션에 두거나 문서 안에 이벤트 목록을 넣는다.
- 직접 구현하기보다 NServiceBus, MassTransit, Eventuate 같은 프레임워크의 아웃박스 기능을 먼저 검토한다.
- 대안: 이벤트 소싱. 이벤트 저장 자체가 상태 변경이라 이중 쓰기가 생기지 않는다.

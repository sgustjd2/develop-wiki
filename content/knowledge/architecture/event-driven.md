---
title: 이벤트 드리븐 아키텍처
aka: [Event-Driven Architecture, EDA]
category: architecture
group: system-style
level: intermediate
summary: 구성 요소가 서로를 직접 호출하지 않고, 상태 변화를 이벤트로 발행·구독해 느슨하게 연결되는 시스템 스타일.
tags: [messaging, pub-sub, async, eventual-consistency]
related: [architecture/cqrs, distributed-systems/saga, distributed-systems/transactional-outbox, distributed-systems/idempotency, design-patterns/observer]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven
  - https://martinfowler.com/articles/201701-event-driven.html
updatedAt: 2026-11-18
---

## 문제

주문 서비스가 주문을 만든 뒤 재고·포인트·알림·분석 서비스를 차례로 동기 호출한다.

- 새 후속 처리가 생길 때마다 주문 서비스를 고쳐야 한다.
- 하나가 느리거나 죽으면 주문 전체가 느려지거나 실패한다.

## 해법

생산자(producer)는 "주문이 생성됐다"는 **사실(이벤트)**만 채널에 발행하고, 누가 듣는지 모른다. 소비자(consumer)는 필요한 이벤트를 구독해 각자 처리한다.

```ts
type OrderPlaced = { type: 'OrderPlaced'; id: string; orderId: string; total: number };

// 생산자: 후속 처리를 모른다
await bus.publish<OrderPlaced>({ type: 'OrderPlaced', id: uuid(), orderId, total });

// 소비자: 각자 독립적으로 구독
bus.subscribe('OrderPlaced', (e) => inventory.reserve(e.orderId));
bus.subscribe('OrderPlaced', (e) => points.accrue(e.orderId, e.total));
```

### 전달 모델

| | 발행-구독 (pub/sub) | 이벤트 스트리밍 (로그) |
| --- | --- | --- |
| 저장 | 전달 후 보관하지 않음 | 파티션별 순서가 보장되는 내구성 있는 로그 |
| 새 소비자 | 과거 이벤트를 못 봄 | 원하는 위치부터 다시 읽기(replay) 가능 |
| 위치 관리 | 브로커가 구독자에게 밀어 줌 | 소비자가 자기 오프셋을 관리 |
| 예 | RabbitMQ 토픽, Azure Event Grid | Kafka, Azure Event Hubs |

### 토폴로지

- **브로커형**: 이벤트를 전체에 뿌리고 각자 반응. 결합도가 가장 낮지만, 여러 단계에 걸친 업무 흐름의 상태를 아무도 모른다 → 오류 복구가 어렵다.
- **중재자형(mediator)**: 중재자가 흐름과 상태를 관리하며 지정된 큐로 명령을 보낸다. 제어·오류 처리가 쉬우나 결합도가 오르고 중재자가 병목이 될 수 있다. ([사가](/develop-wiki/knowledge/distributed-systems/saga/)의 코레오그래피 / 오케스트레이션과 같은 축)

### 이벤트에 무엇을 담나 (Fowler 의 분류 중 세 가지)

| 방식 | 내용 | 장점 | 단점 |
| --- | --- | --- | --- |
| 이벤트 알림 | "바뀌었다" + 키만 | 결합 최소, 단순 | 소비자가 원본을 다시 조회, 전체 흐름이 코드에 안 보임 |
| 이벤트 전달 상태 이전 | 바뀐 데이터 전체 | 원본이 죽어도 동작, 지연 감소 | 데이터 사본이 퍼짐, 소비자가 상태 관리 |
| 이벤트 소싱 | 모든 변경을 이벤트로 저장해 상태의 원천으로 | 감사 이력, 과거 상태 재구성 | 스키마 진화·재생 처리 복잡 |

Fowler 는 여기에 CQRS 를 더해 네 가지 패턴으로 나눈다. CQRS 는 이벤트 자체에 관한 패턴은 아니지만 함께 쓰이는 경우가 많다.

## 언제 쓰나

- 같은 사건을 여러 하위 시스템이 각자 처리해야 할 때
- 생산자와 소비자를 독립적으로 배포·확장하고 장애를 격리하고 싶을 때
- 대량·실시간 데이터(IoT, 클릭스트림), 시간 창 집계 같은 복합 이벤트 처리

## 주의 (비용)

- **최종 일관성**: 이벤트 발행 후 모든 소비자가 반영하기까지 시스템 각 부분의 상태가 다르다. 강한 일관성이 필수인 업무에는 맞지 않는다.
- **중복·순서**: 대부분의 브로커는 최소 한 번(at-least-once) 전달이다. 소비자는 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)해야 하고, 순서가 중요하면 파티션 키·버전으로 보장한다.
- **원자적 발행**: DB 커밋과 이벤트 발행 사이에서 죽으면 이벤트가 사라진다 → [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/).
- **관찰 가능성**: 호출 스택이 없으니 모든 이벤트에 상관관계 ID(correlation id)를 넣고 분산 추적을 처음부터 설계한다.
- **스키마 진화**: 생산자·소비자가 따로 배포되므로 버전 전략이 필요하다.
- **숨은 흐름**: "주문 → 재고 → 배송"이 코드 어디에도 한눈에 안 보인다. 명령이어야 할 것을 이벤트로 위장하지 않는다.
- 단순 요청-응답으로 충분하면 브로커 운영 비용이 정당화되지 않는다.

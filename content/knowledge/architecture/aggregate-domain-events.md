---
title: 집합체(Aggregate)와 도메인 이벤트
aka: [Aggregate, Aggregate Root, Domain Event, DDD Tactical Design, 애그리게이트]
category: architecture
group: app-structure
level: advanced
summary: 함께 일관돼야 하는 객체 묶음을 루트 하나로 지키는 트랜잭션 경계(집합체)와, 그 경계 사이의 후속 처리를 "일어난 사실"로 전달하는 도메인 이벤트.
tags: [ddd, aggregate, domain-event, consistency, transaction, eventual-consistency]
related: [design-patterns/repository-unit-of-work, architecture/cqrs, architecture/event-driven, architecture/event-sourcing, architecture/layered-clean-hexagonal, distributed-systems/transactional-outbox, distributed-systems/idempotency, data-modeling/optimistic-pessimistic-locking]
sources:
  - https://martinfowler.com/bliki/DDD_Aggregate.html
  - https://martinfowler.com/eaaDev/DomainEvent.html
  - https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model
  - https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation
updatedAt: 2026-11-19
---

## 문제

- 주문과 주문 항목처럼 **함께 맞아야 하는 규칙**(총액 = 항목 합, 상한 초과 금지)이 있는데, 항목을 아무 코드에서나 바꾸면 규칙이 깨진다.
- 객체 그래프가 커지면 어디까지 한 트랜잭션으로 잠그고 로드할지 경계가 없어 락 경합과 거대한 로드가 생긴다.
- 주문이 생기면 구매자 등록, 재고 확보, 메일 발송이 따라와야 한다. 한 메서드에 다 넣으면 클래스가 계속 커진다.

## 해법

### 집합체

- Fowler 의 설명: 하나의 단위로 다루는 도메인 객체 묶음이고, 그중 **루트**만 외부에서 참조한다. 루트가 묶음 전체의 무결성을 지킨다. 로드·저장도 집합체 단위이며, **트랜잭션은 집합체 경계를 넘지 않는 것이 원칙**이다.
- Microsoft .NET 가이드는 경계를 잡는 방법으로 "자주 쓰는 트랜잭션에서 함께 일관돼야 하는 엔티티를 보라"고 한다. 클래스 이름이 아니라 불변식(invariant)이 경계를 정한다.
- 집합체 간 참조는 객체 참조가 아니라 **ID**(외래 키)로 한다. 경계가 흐려지는 것을 막는다.

```ts
class Order {                                   // 집합체 루트
  private items: OrderItem[] = [];              // 내부 엔티티: 외부에 노출하지 않음
  private events: DomainEvent[] = [];
  constructor(readonly id: OrderId, readonly buyerId: BuyerId) {}  // 다른 집합체는 ID 로

  addItem(sku: Sku, qty: number, price: Money) {
    if (qty <= 0) throw new Error('qty');
    if (this.items.length >= 50) throw new Error('too many items');   // 불변식은 루트가 지킨다
    this.items.push(new OrderItem(sku, qty, price));
  }
  place() {
    if (this.items.length === 0) throw new Error('empty');
    this.events.push({ type: 'OrderPlaced', orderId: this.id, buyerId: this.buyerId });
  }
  pullEvents() { const e = this.events; this.events = []; return e; }
}
// 저장소는 집합체 단위: orders.save(order)  /  orders.get(id)
```

### 도메인 이벤트

- Fowler: 도메인에서 일어난 의미 있는 일의 기록이다. 원천 데이터는 바꾸지 않고, 오류는 소급 이벤트로 정정한다. (Fowler 는 이 글을 2000년대 중반 이후 갱신하지 않은 초안이라고 밝힌다.)
- 이름은 과거형(`OrderPlaced`), 불변 객체로 만든다. 일어난 일이므로 고칠 수 없다.
- Microsoft 가이드의 권장: 루트가 이벤트를 목록에 쌓기만 하고, 트랜잭션 커밋 **직전 또는 직후**에 디스패치한다. 즉시 호출하는 정적 디스패처는 테스트·디버깅이 어렵다.
  - 커밋 직전: 핸들러의 변경이 같은 트랜잭션에 들어간다(원자적).
  - 커밋 직후: 별도 트랜잭션이라 집합체 간 **결과적 일관성**과 실패 시 보상이 필요하다.
- 한 트랜잭션에 집합체 하나가 원칙이라는 입장(Evans, Vernon)과, 같은 명령의 부수 효과라면 한 트랜잭션에 여러 개를 허용하는 입장(Bogard)이 있다. 둘 다 가능하다고 Microsoft 문서는 정리한다. 도메인 전문가가 원자성을 요구하는지, 확장성이 얼마나 필요한지로 정한다. 항상 원자적으로 같이 바뀌어야 한다면 집합체가 너무 작게 나뉜 것은 아닌지 의심한다.

### 도메인 이벤트 vs 통합 이벤트

| 구분 | 도메인 이벤트 | 통합 이벤트 |
| --- | --- | --- |
| 범위 | 같은 도메인·프로세스 안 | 다른 서비스·컨텍스트 |
| 전달 | 인메모리 디스패처(동기/비동기) | 항상 비동기 메시지 브로커 |
| 시점 | 커밋 전후 선택 | 영속화 성공 후에만 |
| 처리 횟수 | 핸들러 0~n개 | 구독자 0~n, 중복 가능성 |

도메인 이벤트 핸들러에서 통합 이벤트를 발행할 수 있다. 이때 "DB 저장과 발행의 원자성"은 [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)로 푼다. 구독자는 [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/)을 갖춰야 한다.

## 언제 쓰나

- 규칙(불변식)이 많고 계속 바뀌는 도메인(주문, 결제, 예약).
- 한 변경에 후속 작업이 늘어나는 곳. 핸들러만 추가하면 기존 코드를 안 건드린다.

## 주의·비용

- 단순 CRUD 에는 과하다. Microsoft 가이드도 단순한 서비스는 빈약한(anemic) 모델로 충분하다고 본다.
- 집합체를 크게 잡으면 동시 수정 충돌과 로드 비용이 커지고, 너무 작으면 불변식을 못 지킨다. 낙관적 락 버전 필드로 충돌을 다룬다. [낙관적·비관적 락](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/).
- 집합체 간 조회는 ID 로 따로 읽는다. 목록·보고용 조인이 필요하면 읽기 모델을 분리한다. [CQRS](/develop-wiki/knowledge/architecture/cqrs/).
- 이벤트가 많아지면 "무엇이 무엇을 일으키는지" 추적이 어렵다. 이벤트 이름·핸들러 목록을 문서화하고 관측성을 갖춘다.
- 결과적 일관성은 사용자에게 보이는 지연·중간 상태를 만든다. UI 가 이를 견디는지 확인한다.
- 이벤트 소싱과는 다르다. 도메인 이벤트는 알림 수단이고, 이벤트 소싱은 이벤트를 저장 상태의 원천으로 삼는다. [이벤트 소싱](/develop-wiki/knowledge/architecture/event-sourcing/).

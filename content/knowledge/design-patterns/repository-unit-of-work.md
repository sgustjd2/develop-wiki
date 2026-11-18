---
title: 리포지토리와 유닛 오브 워크
aka: [Repository, Unit of Work, UoW, Repository Pattern, Aggregate Repository]
category: design-patterns
group: structural
level: intermediate
summary: 리포지토리는 저장소를 메모리 컬렉션처럼 보이게 해 도메인에서 영속성 세부를 가리고, 유닛 오브 워크는 한 비즈니스 트랜잭션의 변경을 모아 한꺼번에 반영한다.
tags: [repository, unit-of-work, poeaa, ddd, orm, persistence, aggregate]
related: [design-patterns/adapter, design-patterns/service-locator-vs-dependency-injection, architecture/hexagonal, architecture/layered-clean-hexagonal, architecture/cqrs, testing-practice/test-doubles, data-modeling/optimistic-pessimistic-locking, data-modeling/n-plus-one, principles/dependency-inversion-composition-root]
sources:
  - https://martinfowler.com/eaaCatalog/repository.html
  - https://martinfowler.com/eaaCatalog/unitOfWork.html
  - https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design
updatedAt: 2026-11-19
---

> GoF 23 패턴이 아니다. Martin Fowler 의 *Patterns of Enterprise Application Architecture*(PoEAA) 카탈로그에 실린 엔터프라이즈 패턴이며, DDD 에서 널리 쓴다. 구조적 성격이라 구조 그룹에 둔다.

## 문제

비즈니스 로직 곳곳에 SQL, ORM 호출, 쿼리 조립이 흩어진다. 도메인 코드가 DB 세부에 묶여 테스트가 어렵고 같은 쿼리가 중복된다. 또 객체를 바꿀 때마다 DB 에 쓰면 호출이 잦아 느리고, 여러 객체를 바꾸는 작업의 원자성을 지키기 어렵다.

## 해법

### Repository

도메인 모델과 데이터 매핑 사이에 두는 중개자다. 호출자에게는 **메모리 안의 객체 컬렉션**처럼 보인다. 호출자는 원하는 객체를 설명하고, 쿼리 구성과 DB 작업은 리포지토리 안에서 일어난다. Fowler 가 드는 이점은 쿼리 로직 중복 감소, 컬렉션 같은 사용감, 도메인이 리포지토리에 의존하는 한 방향 의존이다.

```ts
// 도메인 계층에 인터페이스, 인프라 계층에 구현
interface OrderRepository {
  byId(id: OrderId): Promise<Order | null>;
  add(order: Order): void;
}
class PgOrderRepository implements OrderRepository { /* SQL/ORM 은 여기에만 */ }
```

### Unit of Work

비즈니스 트랜잭션 동안 **영향받은 객체 목록**(새 객체, 변경된 객체, 삭제된 객체)을 추적하고, 끝나는 시점에 DB 반영과 동시성 문제 해결을 조율한다. 변경마다 즉시 쓰지 않아 호출이 줄고, 여러 요청에 걸친 비즈니스 트랜잭션에서 DB 트랜잭션을 계속 열어 두지 않아도 된다.

```ts
await uow.run(async () => {
  const order = await orders.byId(id);
  order!.confirm();            // 메모리에서만 변경
  await outboxEvents.add(...);
});                             // 끝에서 한 트랜잭션으로 커밋
```

### 함께 쓰는 방식

- ORM 이 둘을 이미 구현한다. Microsoft 문서는 EF Core 의 `DbContext` 가 Repository 와 Unit of Work 를 모두 구현하고 `SaveChanges` 호출 시 반영된다고 설명한다. Hibernate/JPA 의 `EntityManager` 도 같은 역할이지만 이 점은 이 노트에서 별도 출처로 확인하지 않았다.
- DDD 에서는 **애그리게이트 루트당 리포지토리 하나**가 원칙이다. 테이블마다 만들지 않는다. 쓰기는 리포지토리와 애그리게이트를 통해, 읽기(조회용)는 [CQRS](/develop-wiki/knowledge/architecture/cqrs/)식으로 별도 쿼리를 쓸 수 있다.
- 인터페이스는 도메인 쪽에, 구현은 인프라 쪽에 둔다. 이게 [의존성 역전](/develop-wiki/knowledge/principles/dependency-inversion-composition-root/)이며 [헥사고날](/develop-wiki/knowledge/architecture/hexagonal/)의 포트·어댑터와 같은 모양이다.

## 언제 쓰나

- 도메인 규칙이 풍부해서 영속성과 분리하고 싶을 때.
- 저장소를 바꿀 가능성이 있거나(예: 테스트용 인메모리), 여러 저장소를 도메인이 모르게 하고 싶을 때.
- 한 사용자 동작에서 여러 객체를 바꾸고 하나의 트랜잭션으로 묶어야 할 때.

## 주의·비용

- **필수 패턴이 아니다.** Microsoft 문서도 리포지토리는 DDD 에서 필수가 아니라고 말하며, 한 기고자는 리포지토리가 영속성 세부를 가리고 결국 실제 DB 통합 테스트가 필요하며 CQRS 를 쓰면 필요성이 줄었다는 의견을 남겼다. 애그리게이트·풍부한 도메인 모델이 더 본질적이다.
- ORM 위에 얇은 CRUD 래퍼만 얹으면 추상화 비용만 늘고 이득이 없다. "ORM 을 교체할 것이다"라는 가정만으로 도입하지 않는다.
- 범용 `IRepository<T>` 에 `findAll()`, 임의 조건 메서드를 쌓으면 쿼리 누수와 [N+1](/develop-wiki/knowledge/data-modeling/n-plus-one/)이 숨는다. 도메인 언어로 필요한 조회만 노출한다.
- UoW 는 추적 책임이 크다. 변경 감지, 동시성 충돌은 [낙관적·비관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/)과 함께 설계한다.
- 리포지토리를 목(mock)으로 바꾸면 단위 테스트는 빨라지지만 실제 쿼리 동작은 검증하지 못한다. [테스트 더블](/develop-wiki/knowledge/testing-practice/test-doubles/) 참고. 영속성 계층 통합 테스트를 따로 둔다.
- UoW 범위가 요청(웹) 또는 화면(모바일) 단위로 길어지면 오래된 상태를 쓰게 된다. 범위는 짧게 잡는다.

## 비교

| | Repository | Unit of Work | DAO(전통 데이터 접근 클래스) |
| --- | --- | --- | --- |
| 관심사 | 객체를 얻고 보관하는 모양 | 변경을 모아 반영하는 시점 | 테이블·행 단위 CRUD |
| 단위 | 애그리게이트 | 비즈니스 트랜잭션 | 보통 테이블 |
| 서로 | UoW 없이도 사용 가능 | 리포지토리 없이도 사용 가능 | 추상화가 약해 호출자와 결합 |

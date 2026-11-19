---
title: 값 객체(Value Object)와 엔티티(Entity)
aka: [Value Object, Entity, Reference Object, Evans Classification, Primitive Obsession]
category: architecture
group: app-structure
level: intermediate
summary: 객체를 "식별자로 구분하는가(엔티티), 값으로 구분하는가(값 객체)"로 나눠 도메인 모델을 만드는 기준과, 불변 값 객체로 원시 타입 남용을 줄이는 방법.
tags: [ddd, value-object, entity, immutability, domain-model, tactical-design]
related: [architecture/aggregate-domain-events, design-patterns/repository-unit-of-work, principles/parse-dont-validate, principles/coupling-and-cohesion, data-modeling/primary-key-design, architecture/layered-clean-hexagonal]
sources:
  - https://martinfowler.com/bliki/ValueObject.html
  - https://martinfowler.com/bliki/EvansClassification.html
  - https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/implement-value-objects
updatedAt: 2026-11-19
---

집합체 경계와 이벤트는 [집합체·도메인 이벤트](/develop-wiki/knowledge/architecture/aggregate-domain-events/)에 있다. 이 노트는 그 안에 들어가는 **부품을 어떻게 분류하고 만드는가**이다.

## 문제

- `string email`, `number amount`, `string currency` 같은 원시 타입이 도메인 전체를 돌아다닌다. 아무 문자열이나 이메일 자리에 들어가고, 금액과 통화가 따로 놀아 더하기 전에 통화를 맞췄는지 매번 확인해야 한다.
- 같은 주소 객체를 두 주문이 공유하다가 한쪽을 고치면 다른 쪽도 바뀌는 별칭(aliasing) 버그가 생긴다(Fowler).
- 모든 것을 ID 있는 엔티티·테이블로 만들면 불필요한 식별·추적·조인이 늘어난다.

## 해법

### 분류 기준

Fowler 가 정리한 Evans 의 구분이다.

| | 엔티티 | 값 객체 |
| --- | --- | --- |
| 같음의 기준 | 식별자(시간이 지나 속성이 바뀌어도 같은 것) | 속성 값 전부 |
| 예 | 고객, 주문, 배송 계약 | 금액, 날짜 구간, 주소, 좌표 |
| 변경 | 상태가 바뀜 | 불변. 바꾸려면 새 인스턴스로 교체 |
| 동등 비교 | 보통 기본(식별자) 비교 | 값 비교를 직접 정의 |

같은 개념도 문맥에 따라 달라진다. 배송지 주소는 주문 안에서는 값 객체지만, 주소록 서비스에서는 사용자가 관리하는 엔티티일 수 있다(Fowler: 값인지 참조인지는 문맥 의존).

### 값 객체 만들기

```ts
class Money {
  private constructor(readonly amount: bigint /* 최소 단위 */, readonly currency: string) {}
  static of(amount: bigint, currency: string) {
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency');   // 생성 시 불변식 검사
    return new Money(amount, currency);
  }
  add(o: Money) {                                   // 새 객체를 돌려준다
    if (o.currency !== this.currency) throw new Error('currency mismatch');
    return new Money(this.amount + o.amount, this.currency);
  }
  equals(o: Money) { return this.amount === o.amount && this.currency === o.currency; }
}
```

- 생성 시점에 검증해 **잘못된 값 객체가 존재하지 못하게** 한다. [Parse, don't validate](/develop-wiki/knowledge/principles/parse-dont-validate/)와 같은 방향이다.
- setter 가 없고, 변경은 새 객체를 반환한다. 별칭 버그가 사라지고 공유·재사용이 안전하다. Microsoft 가이드는 불변성 덕에 같은 값의 인스턴스를 재사용하는 최적화도 가능하다고 설명한다.
- 동등성·해시를 모든 속성으로 구현한다. 언어가 레코드·data class 를 지원하면 그것을 쓴다.
- 값 객체가 엔티티를 참조해도 된다(Microsoft: 경로 스냅샷이 도시·도로 엔티티를 가리키는 예).

### 엔티티 만들기

- 식별자는 생성 시 정해 변하지 않게 한다. 키 선택은 [기본 키 설계](/develop-wiki/knowledge/data-modeling/primary-key-design/).
- 같은 개념적 엔티티를 가리키는 객체가 두 개 생기지 않게 한다(Fowler). 저장소의 로드 규칙과 맞물린다. [Repository·UoW](/develop-wiki/knowledge/design-patterns/repository-unit-of-work/).
- 동등성은 식별자로 비교하고, 상태 변경은 의미 있는 메서드로만 허용한다(집합체 루트가 불변식을 지킨다).

### 영속화

- 값 객체는 별도 테이블·ID 없이 소유 엔티티 테이블의 칼럼이나 JSON 으로 저장하는 편이 자연스럽다. EF Core 의 owned entity type 이 예이며, Microsoft 가이드는 이것이 DDD 의 값 객체와 완전히 일치하지는 않고 내부적으로는 소유자 정체성을 포함한 키가 생긴다고 밝힌다(`DbSet` 불가, nullable 소유 타입 제약 등 한계도 문서에 나열).
- 이때 DB 쪽 ID 는 인프라 세부이며 도메인 모델에 드러내지 않는다.

## 언제 쓰나

- 값 객체: 금액·수량·기간·주소·이메일처럼 **규칙이 있는 값**, 두 개 이상의 필드가 함께 움직이는 값(금액+통화), 원시 타입 인자가 자주 뒤바뀌는 곳.
- 엔티티: 생명주기가 있고 추적해야 하는 것(주문 상태 전이, 계정).

## 주의·비용

- **과도한 래핑**: 규칙도 의미도 없는 값까지 클래스로 감싸면 보일러플레이트만 는다. 불변식이나 연산이 하나라도 생길 때 만든다.
- 직렬화·ORM 이 불변 객체와 충돌한다. Microsoft 예제도 역직렬화 때문에 `private set` 을 타협으로 쓴다고 설명한다.
- 엔티티를 값처럼 복사해 다루면 같은 개체가 둘로 갈라진다. 반대로 값을 엔티티로 만들면 불필요한 ID·동기화 비용이 든다.
- 분류가 모호하면 업무 문맥(고쳐 쓰는가, 이력이 필요한가)으로 결정한다. Fowler 도 이 분류가 정의보다 연습으로 익히는 것이라 한다.
- 대규모 컬렉션에서 값 객체를 객체로 만들면 메모리 부담이 클 수 있다. 측정 후 최적화한다.

> 출처 확인 범위: Fowler 의 ValueObject·EvansClassification 글과 Microsoft .NET 마이크로서비스 가이드의 값 객체 구현 절을 읽었다. Evans 의 원저(Domain-Driven Design) 본문은 읽지 못했다.

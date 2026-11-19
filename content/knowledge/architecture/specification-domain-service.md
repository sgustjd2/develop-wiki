---
title: 명세(Specification) 패턴과 도메인 서비스
aka: [Specification Pattern, Composite Specification, isSatisfiedBy, Domain Service, Business Rule Object, 명세 패턴]
category: architecture
group: app-structure
level: intermediate
summary: 선택·검증 규칙을 "후보가 조건을 만족하는가"를 답하는 객체로 분리해 조합하는 명세 패턴과, 어느 한 엔티티에 속하지 않는 도메인 규칙을 둘 자리(도메인 서비스)를 구분하는 기준.
tags: [ddd, specification, domain-service, business-rules, composite, tactical-design]
related: [architecture/value-object-entity, architecture/aggregate-domain-events, design-patterns/strategy, design-patterns/composite, design-patterns/interpreter, design-patterns/repository-unit-of-work, architecture/layered-clean-hexagonal, principles/coupling-and-cohesion]
sources:
  - https://martinfowler.com/apsupp/spec.pdf
  - https://martinfowler.com/bliki/AnemicDomainModel.html
updatedAt: 2026-11-19
---

## 문제

- "우수 고객 중 연체가 2건 이하인 사람에게 쿠폰 발급" 같은 규칙이 있다. 처음엔 `if` 한 줄이지만, 곧 **같은 규칙이 세 곳**에 복사된다. 화면의 대상자 목록, 발급 직전 검증, 배치의 대상 조회다.
- 규칙이 `Customer` 엔티티의 메서드로 계속 늘면 엔티티가 요구사항마다 부푼다. 규칙을 서비스 코드에 흩어 두면 어디에 무엇이 있는지 찾을 수 없다.
- 규칙이 바뀔 때 세 곳을 같이 고쳐야 한다. 하나라도 빠지면 "목록에는 뜨는데 발급은 거절"되는 불일치가 난다.

## 해법

### 명세 패턴

Evans 와 Fowler 의 논문 "Specifications"은 핵심을 이렇게 잡는다. **후보가 어떤 조건에 맞는지 가르는 일**을 후보 객체에서 떼어 별도 객체로 만든다. 그 객체는 `isSatisfiedBy(candidate): boolean` 하나를 제공한다. 같은 명세를 세 가지 목적에 쓴다고 논문이 구분한다.

| 용도 | 질문 | 예 |
| --- | --- | --- |
| 검증(validation) | 이 객체가 요구를 만족하나 | 발급 직전에 쿠폰 대상인지 확인 |
| 선택(selection) | 후보 집합에서 조건에 맞는 것은 | 대상자 목록 조회 |
| 주문 제작(building to order) | 이 조건을 만족하는 것을 만들려면 | 조건에 맞는 컨테이너 구성 |

논문이 정리한 구현 전략은 세 가지다.

1. **하드코딩 명세**: `isSatisfiedBy` 안에 코드를 쓴다. [전략 패턴](/develop-wiki/knowledge/design-patterns/strategy/)과 같다. 유연하지만 규칙마다 프로그래밍이 필요하다.
2. **매개변수 명세**: 자주 바뀌는 값을 속성으로 뽑는다. 런타임에 값만 바꿔 쓸 수 있으나, 매개변수가 늘면 쓰기도 유지하기도 어려워진다고 논문이 경고한다.
3. **조합 명세(Composite Specification)**: `and`·`or`·`not` 노드와 한 가지 조건을 검사하는 잎 노드로 트리를 만든다. 논문은 [인터프리터](/develop-wiki/knowledge/design-patterns/interpreter/) 패턴을 쓴 중간 길이라 부르고, 프로그래머는 기본 부품과 조합 수단을 제공하고 사용자가 조립한다고 설명한다. 잎은 가능하면 인자 하나짜리 원자 명세로 쪼갤 때 가장 유연하다.

```ts
interface Spec<T> { isSatisfiedBy(c: T): boolean; }
const and = <T>(...s: Spec<T>[]): Spec<T> => ({ isSatisfiedBy: c => s.every(x => x.isSatisfiedBy(c)) });
const or  = <T>(...s: Spec<T>[]): Spec<T> => ({ isSatisfiedBy: c => s.some(x => x.isSatisfiedBy(c)) });
const not = <T>(s: Spec<T>): Spec<T> => ({ isSatisfiedBy: c => !s.isSatisfiedBy(c) });

const tierIs = (t: string): Spec<Customer> => ({ isSatisfiedBy: c => c.tier === t });
const overdueOver = (n: number): Spec<Customer> => ({ isSatisfiedBy: c => c.overdue > n });

// 규칙의 이름이 곧 도메인 언어
const couponEligible = and(or(tierIs('gold'), tierIs('silver')), not(overdueOver(2)));
if (!couponEligible.isSatisfiedBy(customer)) throw new NotEligible();
```

### 선택에 쓸 때의 한계: 메모리 vs 데이터베이스

`isSatisfiedBy` 는 후보를 이미 메모리에 올려야 한다. 후보가 수백만 건이면 전부 읽어 거를 수 없다. 논문도 데이터베이스에서 많은 후보를 고를 때는 성능이 문제가 되며 색인 방식을 따로 고려해야 한다고만 말하고, 구현은 언어·DB 에 따라 다르다며 다루지 않는다. 실무에서 쓰는 방법은 다음 둘이다.

- 명세 트리를 SQL `WHERE` 로 **번역**하는 방문자를 하나 더 둔다. 같은 규칙을 두 표현(메모리·SQL)으로 갖게 되므로 **둘이 어긋나지 않는지 테스트**한다. 아래 코드는 두 표현을 같은 300 건에 적용해 결과 100 건이 일치함을 SQLite 로 확인했다.
- 규칙 자체를 쿼리 객체로 두고(예: ORM 의 조건 객체), 메모리 검증은 선택 결과에 규칙을 한 번 더 건다.

```ts
type Sql = { where: string; args: (string | number)[] };
const sqlAnd = (...p: Sql[]): Sql => ({ where: p.map(x => `(${x.where})`).join(' AND '), args: p.flatMap(x => x.args) });
const sqlOr  = (...p: Sql[]): Sql => ({ where: p.map(x => `(${x.where})`).join(' OR '),  args: p.flatMap(x => x.args) });
const sqlNot = (p: Sql): Sql => ({ where: `NOT (${p.where})`, args: p.args });
// 위 couponEligible 과 같은 규칙의 SQL 표현
const sqlEligible = sqlAnd(
  sqlOr({ where: 'tier = ?', args: ['gold'] }, { where: 'tier = ?', args: ['silver'] }),
  sqlNot({ where: 'overdue > ?', args: [2] }));
// 검증: db.prepare(`SELECT id FROM c WHERE ${sqlEligible.where}`).all(...sqlEligible.args) 가
//       customers.filter(c => couponEligible.isSatisfiedBy(c)) 와 같은 id 목록을 낸다
```

### 도메인 서비스: 규칙을 둘 다른 자리

명세는 "하나의 객체가 조건을 만족하나"를 다룬다. 반대로 규칙이 **여러 객체에 걸치고 어느 한 엔티티의 책임이라 하기 어려울 때**(예: 두 계좌 사이 이체 가능 여부, 두 집합체를 비교하는 가격 계산)는 상태 없는 연산을 **도메인 서비스**로 둔다. 도메인 서비스는 도메인 언어로 이름 붙인 규칙이고 인프라(DB·메일)를 직접 부르지 않는다.

| 구분 | 하는 일 | 상태 | 예 |
| --- | --- | --- | --- |
| 엔티티·값 객체 메서드 | 자기 데이터로 정해지는 규칙 | 있음 | `order.total()` |
| 명세 | 한 후보가 조건을 만족하는지 판정, 조합 가능 | 없음(조건 값만) | `couponEligible` |
| 도메인 서비스 | 여러 객체에 걸친 도메인 연산 | 없음 | `TransferPolicy.canTransfer(a, b, amount)` |
| 애플리케이션 서비스 | 유스케이스 조율, 트랜잭션, 저장소 호출 | 없음 | `IssueCouponUseCase` |

Fowler 의 빈약한 도메인 모델 글은 이 구분의 반대편 위험을 보여 준다. 규칙을 전부 서비스로 밀어 넣으면 도메인 객체는 데이터 주머니가 되고 설계가 절차적으로 돌아간다고 지적한다. 서비스 계층은 얇게 두고 일을 도메인 객체에 위임해야 한다는 입장이다. 그래서 순서는 이렇다.

1. 한 객체의 데이터로 정해지는 규칙은 그 객체 메서드로.
2. 조건 판정이고 여러 곳에서 재사용·조합되면 명세로.
3. 여러 객체에 걸친 도메인 연산이면 도메인 서비스로.
4. 조율·트랜잭션·I/O 는 애플리케이션 서비스로.

## 언제 쓰나

- 같은 판정 규칙이 검증·목록·배치에 반복되고, 규칙이 자주 바뀌거나 조합되는 도메인(자격 판정, 요금 조건, 배송 가능 조건, 승인 정책).
- 비개발자가 규칙 이름을 읽고 맞는지 확인해야 하는 경우. 이름 붙은 명세는 도메인 언어가 된다.

## 주의·비용

- **규칙 하나뿐이면 과설계**다. `isEligible()` 메서드 하나로 충분한 곳에 명세 트리를 만들지 않는다. 논문은 명세에 `isSatisfiedBy` 이외의 동작이 계속 붙거나, 명세 객체가 제약이 아니라 도메인의 실제 개체를 표현하게 되면 이 패턴을 다시 생각하라고 경고한다(경로와 경로 명세를 한 객체로 합치려는 유혹을 예로 든다).
- 두 표현(메모리·SQL)의 불일치가 가장 흔한 사고다. 동일 입력에 같은 결과를 내는지 속성 기반 테스트로 점검한다. [속성 기반 테스트](/develop-wiki/knowledge/testing-practice/property-based-testing/).
- 클래스·함수가 늘어 흐름 추적이 어려워진다. 이름과 위치 규칙(한 폴더, 명사형 이름)을 정한다.
- 명세를 `Specification<T>` 제네릭 틀로 만들면 표현력이 늘지만 읽기가 어려워진다. 팀이 기본 부품(`and/or/not`)만으로 시작해 필요할 때 늘린다.
- 도메인 서비스를 "아무 코드나 넣는 곳"으로 쓰면 빈약한 도메인 모델이 된다. 위 1~4 순서를 지킨다.
- 데이터베이스 쪽 필터링은 인덱스 설계가 성능을 좌우한다. [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).

> 출처 확인 범위: Evans·Fowler "Specifications" 논문 PDF 는 압축 스트림을 직접 풀어 서론과 구현 전략 절, 조합 명세 절, 포괄(Subsumption) 절 일부를 읽었다. 논문의 포괄(isGeneralizationOf)·부분 만족 명세는 이 노트에서 다루지 않았다. Fowler 의 AnemicDomainModel 글은 읽었다. **Evans 의 DDD 책(도메인 서비스 정의 장)은 읽지 못했다.** 도메인 서비스 표와 1~4 순서는 위 두 자료에서 이끌어 낸 정리이고 책의 문장이 아니다. SQL 번역 방문자 접근은 논문이 규정한 것이 아니라 일반 실무 패턴이다.

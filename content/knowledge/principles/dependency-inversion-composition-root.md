---
title: 의존성 역전과 컴포지션 루트
aka: [Dependency Inversion Principle, DIP, Composition Root, Pure DI, Inversion of Control, Assembler]
category: principles
level: intermediate
summary: 상위 정책이 하위 구현이 아니라 추상에 의존하게 뒤집고(DIP), 실제 구현을 고르고 연결하는 일은 앱 진입점 한 곳에 모으는(컴포지션 루트) 설계.
tags: [dip, solid, dependency-injection, composition-root, ioc, architecture]
related: [principles/solid, principles/coupling-and-cohesion, design-patterns/service-locator-vs-dependency-injection, design-patterns/repository-unit-of-work, architecture/hexagonal, architecture/layered-clean-hexagonal, mobile-dev/dependency-injection-mobile, testing-practice/test-doubles]
sources:
  - https://martinfowler.com/articles/injection.html
  - https://blog.ploeh.dk/2011/07/28/CompositionRoot/
  - https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection-guidelines
updatedAt: 2026-11-19
---

## 문제

`OrderService` 가 `PgOrderRepository`, `SmtpMailer` 를 직접 `new` 하면 도메인 규칙이 DB·메일 라이브러리에 묶인다. 테스트에서 가짜로 바꿀 수 없고, 저장소를 바꾸면 도메인 코드가 바뀐다. 의존 방향이 "정책 → 세부"로 흐른다.

## 해법

### 1. 의존성 역전(DIP)

SOLID 의 D. 상위 모듈이 하위 모듈의 구체에 의존하지 않고 **둘 다 추상에 의존**한다. 핵심은 **추상의 소유권**이다. 인터페이스를 상위(도메인) 쪽에 두고 하위(인프라)가 그것을 구현한다. 그러면 소스 코드 의존 방향이 실행 흐름과 반대로 뒤집힌다.

```ts
// 도메인 패키지: 필요한 것을 도메인 언어로 선언
export interface OrderRepository { byId(id: string): Promise<Order | null>; }
export class ConfirmOrder {
  constructor(private readonly orders: OrderRepository) {}   // 추상에만 의존
}
// 인프라 패키지: 도메인 인터페이스를 구현(의존 방향이 도메인을 향함)
export class PgOrderRepository implements OrderRepository { /* ... */ }
```

헥사고날의 포트/어댑터, 클린 아키텍처의 "의존은 안쪽으로"가 같은 구조다. [헥사고날](/develop-wiki/knowledge/architecture/hexagonal/), [레이어드·클린·헥사고날 비교](/develop-wiki/knowledge/architecture/layered-clean-hexagonal/) 참고.

### 2. 의존성을 건네는 방법: 주입

DIP 는 방향 원칙이고, 구현을 *누가 넘겨주나*는 별개 문제다. Fowler 는 클래스 안에서 구현을 찾는 대신 **별도의 조립자(assembler)** 가 필드를 채우게 하는 방식을 소개하고, 생성자 주입을 기본으로 삼는다. 의존이 생성자 시그니처에 드러나고, 서비스 로케이터와 달리 숨은 의존이 없다. [서비스 로케이터 vs DI](/develop-wiki/knowledge/design-patterns/service-locator-vs-dependency-injection/) 참고.

### 3. 컴포지션 루트: 조립은 한 곳에

Mark Seemann 의 정의로 컴포지션 루트는 **애플리케이션 안에서 모듈들을 조합하는 (가급적) 유일한 위치**다. 진입점에 최대한 가깝게 둔다(콘솔은 `main`, 웹은 시작 코드 등).

```ts
// main.ts = 컴포지션 루트. 구체 클래스를 아는 유일한 곳
const db = new PgPool(process.env.DATABASE_URL!);
const orders = new PgOrderRepository(db);
const mailer = new SmtpMailer(config.smtp);
const confirm = new ConfirmOrder(orders, mailer);
startServer({ confirm });
```

원칙(Seemann 의 글 요지):
- **애플리케이션만** 컴포지션 루트를 가진다. 라이브러리·프레임워크는 가지지 않는다.
- DI 컨테이너는 루트 안에서만 참조한다. 애플리케이션 코드가 컨테이너를 직접 호출하면 서비스 로케이터가 된다.
- 너무 일찍 조합하면 선택지가 줄어든다. 코드는 생성자로 받고 스스로 조립하지 않는다.
- 프로세스(앱)마다 하나. 컨테이너 없이 손으로 조립해도(Pure DI) 규모가 크지 않으면 충분하다.

## 언제 쓰나

- 도메인·유스케이스 코드를 DB·HTTP·SDK 와 분리해 단위 테스트하고 싶을 때.
- 구현을 환경별로 바꿔야 할 때(테스트 가짜, 스테이징, 프로덕션).
- 모바일에서는 OS 가 객체를 만드는 진입점 때문에 루트가 여러 곳이 되곤 한다. [모바일 DI](/develop-wiki/knowledge/mobile-dev/dependency-injection-mobile/) 참고.

## 주의·비용

- **인터페이스를 남발하지 않는다.** 구현이 하나뿐이고 바뀔 이유도 없는 클래스에 인터페이스를 붙이면 간접 계층만 늘어난다. 경계(영속성, 외부 API, 시계, 난수)에 둔다. [DRY·KISS·YAGNI](/develop-wiki/knowledge/principles/dry-kiss-yagni/) 참고.
- 인터페이스를 인프라 쪽에 두고 도메인이 그것을 import 하면 역전이 아니다. 소유권(위치)이 핵심이다.
- 루트가 거대해지면 조립 코드가 부담이 된다. 모듈별 조립 함수로 나누되 호출은 루트에서만 한다. 조립 코드가 중복되는 일부는 감수할 수 있다는 것이 Seemann 의 입장이다.
- DI 컨테이너의 마법(자동 등록, 수명 관리)은 편하지만 오류를 런타임으로 미룬다. 수명(싱글톤·요청 범위) 불일치 버그를 조심한다. 수명 지침은 Microsoft DI 가이드라인을 본다.
- 모든 의존을 주입하는 것과 DIP 는 다르다. 값 객체, 순수 함수, 표준 라이브러리 타입은 주입할 필요가 없다.

## 비교

| | 의존성 역전(DIP) | 의존성 주입(DI) | 컴포지션 루트 |
| --- | --- | --- | --- |
| 종류 | 설계 원칙 | 구현 기법 | 배치 규칙 |
| 답하는 질문 | 어느 쪽이 추상을 소유하나 | 구현이 어떻게 건네지나 | 어디서 조립하나 |
| 빠지면 | 도메인이 세부에 묶임 | 숨은 의존·테스트 곤란 | 조립 코드가 곳곳에 퍼짐 |

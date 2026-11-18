---
title: 서비스 로케이터 vs 의존성 주입
aka: [Service Locator vs Dependency Injection, Service Locator, Dependency Injection, DI, IoC Container, Inversion of Control]
category: design-patterns
group: creational
level: intermediate
summary: 객체가 필요한 협력자를 어떻게 얻는지에 대한 두 방식. 로케이터는 스스로 찾아 오고 DI 는 밖에서 받는다. 로케이터는 의존성을 숨기고 실패를 런타임으로 미뤄 흔히 안티패턴으로 불린다.
tags: [dependency-injection, service-locator, ioc, anti-pattern, testing, composition-root]
related: [design-patterns/singleton, design-patterns/factory-method, design-patterns/abstract-factory, design-patterns/object-pool, principles/solid, principles/coupling-and-cohesion, testing-practice/test-doubles, architecture/hexagonal]
sources:
  - https://martinfowler.com/articles/injection.html
  - https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/
  - https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection-guidelines
updatedAt: 2026-11-19
---

> GoF 23 패턴에는 없다. "객체를 어떻게 얻는가"를 다루므로 생성 그룹에 둔다. 용어와 비교는 Martin Fowler 의 2004년 글 "Inversion of Control Containers and the Dependency Injection pattern"에서 정리됐다.

## 문제

`OrderService` 가 메일 발송기와 시계를 쓴다. 구체 클래스를 `new` 하면 테스트에서 가짜로 바꿀 수 없고 구현에 묶인다. 그래서 인터페이스에 의존하게 하는데, **그 구현을 누가 어떻게 건네주는가**라는 새 질문이 생긴다. 두 가지 답이 있다.

## 해법 두 가지

| | 서비스 로케이터 | 의존성 주입(DI) |
| --- | --- | --- |
| 방향 | 객체가 로케이터에 **요청**(pull) | 외부가 객체에 **건넴**(push) |
| 객체가 아는 것 | 로케이터와 키·타입 | 인터페이스뿐 |
| 의존성이 보이는 곳 | 메서드 본문 안 | 생성자·세터 시그니처 |
| 빠진 의존성 발견 | **런타임**(해석 시점) | 컴파일 또는 조립 시점 |

```ts
interface Mailer { send(to: string, body: string): void }
interface Clock { now(): Date }

// 서비스 로케이터: 정적 레지스트리에서 꺼낸다
class Locator {
  private static map = new Map<string, unknown>();
  static register<T>(key: string, impl: T): void { Locator.map.set(key, impl); }
  static resolve<T>(key: string): T {
    if (!Locator.map.has(key)) throw new Error(`not registered: ${key}`); // 런타임에야 발견
    return Locator.map.get(key) as T;
  }
}
class WelcomeWithLocator {
  send(to: string): void {
    // 시그니처만 봐서는 Mailer 와 Clock 이 필요하다는 사실을 알 수 없다
    Locator.resolve<Mailer>('mailer').send(to, `hi at ${Locator.resolve<Clock>('clock').now().toISOString()}`);
  }
}

// 생성자 주입: 필요한 것이 시그니처에 드러난다
class WelcomeWithDI {
  constructor(private readonly mailer: Mailer, private readonly clock: Clock) {}
  send(to: string): void { this.mailer.send(to, `hi at ${this.clock.now().toISOString()}`); }
}
```

- `new WelcomeWithLocator().send(...)` 는 컴파일되지만 등록 전에 호출하면 `not registered: mailer` 로 **실행 중에** 터진다.
- `new WelcomeWithDI()` 는 인자를 빼먹으면 컴파일이 실패한다.

### 조립 루트

DI 에서 객체 그래프를 짜 맞추는 곳은 애플리케이션 **진입점 근처 한 군데**(composition root)다. 컨테이너(Spring, ASP.NET Core DI, Guice, NestJS 등)는 이 조립을 자동화하는 도구일 뿐, 클래스 내부에서 컨테이너를 호출하면 그 순간 서비스 로케이터가 된다.

```ts
function main(): void {
  const mailer: Mailer = { send: (to) => console.log('mail to', to) };
  const clock: Clock = { now: () => new Date() };
  new WelcomeWithDI(mailer, clock).send('c@x.com'); // 조립은 여기서만
}
```

## 왜 흔히 안티패턴이라 부르나

Mark Seemann(2010)이 정리한 논점이다.

- **숨은 의존성**: 클래스가 무엇을 필요로 하는지 생성자와 시그니처가 말해 주지 않는다. 사용하려면 소스를 읽어야 한다.
- **런타임 실패**: 등록 누락이 컴파일러가 아니라 실행 중 예외(예: 키 없음)로 나타난다.
- **유지보수 부담**: 클래스에 의존성 하나를 추가해도 컴파일은 되지만 호출자가 깨질 수 있다. 영향 범위를 알려면 앱 전체를 알아야 한다.
- **정적 상태**: 구체 로케이터는 전역 상태여서 테스트 간 오염이 생긴다(위 예시의 `Locator.map`). 로케이터 자체를 주입해도 어떤 서비스를 쓰는지는 여전히 숨는다.

Microsoft 의 .NET DI 지침도 `GetService` 로 직접 꺼내는 서비스 로케이터를 피하고, 런타임에 의존성을 풀어 주는 팩토리를 주입하는 변형도 피하라고 한다(제어 역전 전략을 섞기 때문). 정적 접근으로 서비스를 잡아 두는 것도 피하라고 한다.

## 반대편 시각

Fowler 의 원 글은 "로케이터는 나쁘다"고 단정하지 않는다.

- 로케이터도 주입도 **구현에서 분리**한다는 점은 같다. 차이는 구현이 오는 경로다.
- 의존성이 **눈에 보이는** 쪽은 주입이다. 로케이터는 호출 위치를 검색해야 한다.
- 그러나 주입은 제어 역전이라 **이해·디버깅이 더 어렵다**고 그는 인정한다.
- 테스트 용이성은 "주입이 더 낫다"는 주장에 동의하지 않는다. 대체 가능하게 설계한 로케이터라면 둘 다 스텁을 쓸 수 있다고 본다.
- 애플리케이션 코드(자기 통제 하)라면 로케이터도 문제 없지만, **다른 사람이 쓰는 컴포넌트**라면 로케이터 API 를 강요할 수 없으니 주입이 낫다고 한다.
- 주입 안에서는 생성자 주입으로 시작하고(유효한 객체 보장, 불변), 인자가 많아지거나 상속이 꼬이면 세터 주입을 고려하라고 권한다. 가장 중요한 것은 둘 중 무엇이냐보다 **설정과 사용을 분리**하는 것이라고 결론짓는다.

실무에서는 Seemann 쪽 의견이 우세하다. 프레임워크 코드와 라이브러리가 생기면서 "숨은 의존성의 비용"이 더 크게 체감됐기 때문이다.

## 언제 쓰나

- **생성자 주입(기본)**: 서비스·도메인 객체의 필수 협력자. 비즈니스 코드 대부분.
- **세터·메서드 주입**: 선택적 의존성, 순환 의존 해소, 프레임워크가 객체를 직접 만들어 생성자를 못 쓸 때.
- **로케이터가 불가피한 곳**: 프레임워크가 생성하는 객체(서블릿, 일부 UI 컨트롤, 플러그인 진입점)에 주입 경로가 없을 때, 레거시를 점진 이행할 때, 런타임 키로 구현을 고르는 경우(플러그인 레지스트리). 이때도 **조립 루트·어댑터 같은 경계층에 가둔다**.

## 주의

- **컨테이너가 DI 는 아니다.** 컨테이너 없이 손으로 `new` 로 조립해도 DI 다. 작은 프로그램은 수동 조립이 더 단순하다.
- **생성자 인자가 너무 많다**는 신호는 클래스가 책임을 너무 많이 진다는 뜻이다(SRP). 로케이터로 감추면 문제가 사라진 것이 아니라 보이지 않을 뿐이다.
- **수명 불일치(captive dependency)**: 싱글턴이 스코프 서비스를 들고 있으면 의도보다 오래 산다. .NET 은 스코프 검증 옵션을 제공한다.
- DI 는 **정적·전역 접근의 대안**이다. 섞어 쓰면 이점이 사라진다. 싱글턴 클래스를 전역으로 직접 부르는 방식과 같은 문제다 → [싱글턴](/develop-wiki/knowledge/design-patterns/singleton/).
- 과도한 추상화: 구현이 하나뿐이고 바뀔 일도 없는 클래스까지 전부 인터페이스로 분리하면 읽기만 어려워진다 → [DRY·KISS·YAGNI](/develop-wiki/knowledge/principles/dry-kiss-yagni/).

## 비교와 연결

- [팩토리 메서드](/develop-wiki/knowledge/design-patterns/factory-method/)·[추상 팩토리](/develop-wiki/knowledge/design-patterns/abstract-factory/): 클래스 안에서 "만드는 일"만 분리한다. DI 는 만드는 책임 자체를 밖으로 뺀다. 런타임에 인스턴스를 더 만들어야 할 때(요청마다 생성) 팩토리를 **주입**하는 방식이 정석이지만, 팩토리 안에서 컨테이너로 임의 타입을 풀면 로케이터다.
- [헥사고날](/develop-wiki/knowledge/architecture/hexagonal/): 포트(인터페이스)를 어댑터로 채우는 조립이 DI 의 전형적 사용처다.
- [테스트 더블](/develop-wiki/knowledge/testing-practice/test-doubles/): 생성자 주입이면 테스트에서 `new Service(fake, fixedClock)` 한 줄로 끝난다.
- [객체 풀](/develop-wiki/knowledge/design-patterns/object-pool/)도 전역 접근보다 주입으로 넘기는 편이 테스트하기 좋다.

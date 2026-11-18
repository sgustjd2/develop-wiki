---
title: 널 오브젝트 패턴
aka: [Null Object Pattern, Special Case, Void Value, Introduce Null Object]
category: design-patterns
group: behavioral
level: beginner
summary: null 대신 같은 인터페이스를 구현하되 아무 일도 하지 않거나 기본값을 돌려주는 객체를 넘겨, 호출부의 null 검사를 없애는 패턴. 오류를 조용히 삼킬 수 있어 쓸 곳을 가려야 한다.
tags: [oop, null-safety, polymorphism, special-case, defaults]
related: [design-patterns/strategy, design-patterns/state, design-patterns/singleton, design-patterns/proxy, principles/solid, testing-practice/test-doubles]
sources:
  - https://en.wikipedia.org/wiki/Null_object_pattern
  - https://martinfowler.com/eaaCatalog/specialCase.html
  - https://refactoring.com/catalog/introduceSpecialCase.html
updatedAt: 2026-11-19
---

> GoF 23 패턴에는 없다. Bobby Woolf 가 Pattern Languages of Program Design 3(1998)에 "Null Object" 로 실었고, 앞서 Thomas Kühne 가 1996년 "Void Value" 로 소개했다(Wikipedia). 동작을 다형성으로 바꿔 끼운다는 점에서 행위 그룹에 둔다.

## 문제

선택적 협력 객체(로거, 알림 발송기, 할인 정책)가 없을 수 있다. 그러면 호출하는 곳마다 이런 코드가 늘어난다.

```ts
if (logger !== null) logger.info('...');
```

- 검사가 흩어지고, 하나라도 빠지면 런타임에 `Cannot read properties of null` 이 난다.
- "없음일 때 무엇을 할지"라는 정책이 호출부마다 다르게 복제된다.

## 해법

"없음"도 하나의 객체로 만든다. 실제 구현과 **같은 인터페이스**를 구현하고, 메서드는 아무것도 안 하거나 안전한 기본값을 돌려준다. 호출부는 진짜인지 가짜인지 알 필요가 없다.

```ts
interface Logger { info(msg: string): void; error(msg: string, err?: Error): void }

class ConsoleLogger implements Logger {
  info(msg: string): void { console.log(`[info] ${msg}`); }
  error(msg: string, err?: Error): void { console.error(`[error] ${msg}`, err?.message ?? ''); }
}

// 상태가 없으니 하나를 공유해도 된다 (싱글턴과 잘 어울린다)
const NullLogger: Logger = Object.freeze({ info(): void {}, error(): void {} });

class OrderService {
  constructor(private readonly logger: Logger = NullLogger) {}
  place(id: string): void { this.logger.info(`order ${id} placed`); } // null 검사 없음
}

new OrderService().place('a1');                    // 조용히 통과
new OrderService(new ConsoleLogger()).place('a2'); // [info] order a2 placed
```

값을 돌려주는 경우는 "없음"에 해당하는 의미 있는 기본값을 정한다. Fowler 의 **Special Case**(PoEAA)가 이 일반화다. 알 수 없는 고객을 `UnknownCustomer` 로 표현해 이름은 "occupant", 할인율은 0 으로 응답하게 하면, 호출부는 분기 없이 `customer.name` 을 쓴다. Refactoring 카탈로그는 이 리팩터링을 "Introduce Special Case"(옛 이름 Introduce Null Object)로 부른다.

```ts
interface Customer { name: string; discountRate: number; isKnown: boolean }
const guest: Customer = Object.freeze({ name: '손님', discountRate: 0, isKnown: false });
const findCustomer = (id: string): Customer => db.get(id) ?? guest; // 조회 경계에서 한 번만 변환
```

## 언제 쓰나

- "없으면 아무것도 안 함"이 **정상 동작**인 선택적 의존성: 로거, 메트릭, 이벤트 리스너, 캐시(항상 미스).
- "없음"을 도메인 개념으로 다룰 때: 비회원, 무료 요금제, 빈 장바구니. 호출부에서 같은 분기가 여러 곳에 반복될 때.
- 컬렉션 대신 빈 컬렉션(`[]`)을 돌려주기. 가장 흔하고 안전한 널 오브젝트다.
- 테스트에서 협력 객체를 무시하고 싶을 때 → [테스트 더블](/develop-wiki/knowledge/testing-practice/test-doubles/)의 더미와 같은 모양이다.

## 주의

- **오류를 숨긴다.** Wikipedia 도 이 패턴이 버그를 정상 실행처럼 보이게 만들 수 있다고 경고한다. 결제 수단이 없는데 `NullPayment.charge()` 가 조용히 성공하면 큰 사고다. "없으면 안 되는" 값은 널 오브젝트가 아니라 예외나 `Result`/`Option` 타입으로 드러낸다.
- null 검사를 피하려는 목적만으로 쓰면 복잡도가 다른 곳으로 옮겨갈 뿐이다. 호출부가 결국 `isKnown` 으로 분기해야 한다면 설계를 다시 본다.
- 코드베이스 어딘가에서 진짜 `null` 이 여전히 새어 들어올 수 있다. 조회 경계(레포지토리, 파서)에서 한 번만 변환하는 규칙을 둔다.
- 인터페이스가 커질수록 모든 메서드의 "무해한 기본 동작"을 정해야 한다. 메서드가 적은 좁은 인터페이스에 맞다.
- 디버깅 시 "왜 아무 일도 안 일어나지?"가 된다. 필요하면 널 오브젝트에서 디버그 로그를 한 줄 남긴다.

## 비교

| | 널 오브젝트 | `T \| null` + 검사 | `Option`/`Maybe` 타입 | 예외 |
| --- | --- | --- | --- | --- |
| 호출부 분기 | 없음 | 매번 | 매핑·언랩 | try/catch |
| "없음"의 의미 | 객체가 정책을 가짐 | 호출부가 결정 | 타입이 강제로 인식시킴 | 실패로 취급 |
| 오류 은폐 위험 | 높음 | 낮음 | 낮음 | 없음 |
| 맞는 곳 | "없으면 무시/기본값"이 규칙 | 단순·일회성 | 값이 없을 수 있음을 드러내야 할 때 | 없으면 안 되는 값 |

- [전략](/develop-wiki/knowledge/design-patterns/strategy/)·[상태](/develop-wiki/knowledge/design-patterns/state/)의 특수한 경우로 볼 수 있다(Wikipedia). "아무것도 안 하는 전략"이다.
- 상태가 없는 널 오브젝트는 [싱글턴](/develop-wiki/knowledge/design-patterns/singleton/)(또는 동결된 상수)으로 공유한다.
- [프록시](/develop-wiki/knowledge/design-patterns/proxy/)는 진짜 객체로 위임하고, 널 오브젝트는 위임할 대상이 없다.

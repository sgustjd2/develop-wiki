---
title: Result·Option 타입으로 하는 오류 처리
aka: [Result Type, Option Type, Maybe, Either, Railway Oriented Programming, Errors as Values]
category: principles
level: intermediate
summary: 실패와 값 없음을 예외나 null 대신 타입에 담아 반환해, 호출자가 처리를 빠뜨리지 못하게 하고 실패 경로를 값으로 조립하는 방식.
tags: [error-handling, result, option, either, functional, null-safety, rust]
related: [principles/solid, principles/dry-kiss-yagni, design-patterns/null-object, testing-practice/property-based-testing, performance/timeout-retry-circuit-breaker]
sources:
  - https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html
  - https://fsharpforfunandprofit.com/rop/
  - https://kotlinlang.org/docs/exceptions.html
updatedAt: 2026-11-19
---

## 문제

실패를 표현하는 두 전통적 방법이 모두 아프다.

- **null**: 값이 없을 수 있다는 사실이 타입에 안 나오고, 확인을 잊으면 런타임에 터진다.
- **예외**: 함수 시그니처에 실패가 안 보인다. Kotlin 은 모든 예외가 unchecked 라 선언·처리 강제가 없다. 호출 체인이 길어지면 어디서 무엇이 던져지는지 추적이 어렵다.

## 해법

실패 가능성을 **반환 타입에 넣는다.**

- `Option<T>`(Maybe): 값이 있거나(`Some`) 없다(`None`). 실패 이유가 필요 없는 "없음"에 쓴다.
- `Result<T, E>`: 성공(`Ok(T)`) 또는 실패(`Err(E)`). 이유(E)를 함께 전달한다.

Rust 는 이를 표준 enum 으로 제공하고 `match` 로 두 경우를 모두 다루게 한다. `?` 연산자는 `Err` 면 함수에서 즉시 반환하고(오류 타입 변환 포함), `Ok` 면 값을 꺼내 계속 진행한다. `?` 는 반환 타입이 호환되는 함수에서만 쓸 수 있다.

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type PayError = { kind: "insufficient" } | { kind: "card_declined"; code: string };

function pay(balance: number, price: number): Result<number, PayError> {
  return balance >= price
    ? { ok: true, value: balance - price }
    : { ok: false, error: { kind: "insufficient" } };
}

const r = pay(100, 300);
if (!r.ok) {
  switch (r.error.kind) {            // 분기를 빠뜨리면 컴파일러가 알려 줌(exhaustive)
    case "insufficient": /* ... */ break;
    case "card_declined": /* ... */ break;
  }
}
```

### 조립: map 과 bind (Railway Oriented Programming)

Scott Wlaschin 의 비유로 성공 레일과 실패 레일 두 갈래를 그린다. 실패할 수 있는 함수를 이어 붙이는 것이 **bind(flatMap)**, 실패하지 않는 함수를 붙이는 것이 **map** 이다. 한 단계가 실패하면 이후 단계를 건너뛰고 실패 레일로 간다. 검증을 병렬로 모아 여러 오류를 한꺼번에 보고하는 조합도 있다.

### 오류 종류에 따른 구분

- **예상 가능한 실패**(입력 검증, 재고 부족, 네트워크 실패): Result 로 반환하고 호출자가 처리.
- **프로그래머 오류·불변식 위반**: 예외/panic 으로 빠르게 실패. Kotlin 은 `require`(잘못된 인자), `check`(잘못된 상태) 같은 전제 조건 함수를 제공한다.

## 언제 쓰나

- 실패가 정상 흐름의 일부인 도메인 로직(결제, 검증, 파싱, 외부 호출).
- 실패 이유를 호출자가 분기해야 할 때(오류 타입을 열거형으로 모델링).
- Rust, Swift(`Result`), Kotlin, TypeScript 등에서 팀이 일관된 한 가지 방식을 정하고 싶을 때.

## 주의·비용

- **모든 곳에 쓰면 과하다.** Wlaschin 도 극단으로 가지 말라고 경고하며 이것을 "도구가 아니라 레시피"라고 부른다. 언어 관용과 맞지 않으면(예외가 기본인 언어) 코드가 어색해진다.
- 라이브러리와 프레임워크 경계에서는 예외·Result 가 섞인다. 경계에서 한 번 변환하는 층을 둔다.
- 오류 타입 E 를 너무 세분하거나 문자열로 두면 이득이 줄어든다. 호출자가 실제로 구분할 것만 나눈다.
- 단순히 `if (!r.ok) return r` 를 반복하면 보일러플레이트가 된다. 언어가 `?`, 패턴 매칭, 확장 함수를 제공하는지 본다. 표준 라이브러리 Result 를 권장하는 맥락은 언어마다 달라 Kotlin 공식 예외 문서는 Result 를 다루지 않는다.
- 네트워크·저장소 실패의 재시도·타임아웃 정책은 Result 가 대신해 주지 않는다. [타임아웃·재시도·서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/) 참고.

## 비교

| | null | 예외 | Option | Result |
| --- | --- | --- | --- | --- |
| 시그니처에 드러남 | 아니오 | 아니오(언어에 따라) | 예 | 예 |
| 이유 전달 | 없음 | 있음 | 없음 | 있음 |
| 처리 누락 | 런타임 오류 | 상위로 전파 | 컴파일 시 경고·강제 가능 | 컴파일 시 경고·강제 가능 |
| 적합 | 사용 지양 | 예외적 상황 | 값 없음 | 예상 가능한 실패 |

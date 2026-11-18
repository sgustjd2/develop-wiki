---
title: 상속보다 합성
aka: [Composition over Inheritance, Composite Reuse Principle]
category: principles
level: beginner
summary: 코드를 재사용할 때 부모 클래스를 상속하기보다, 기능을 가진 객체를 필드로 갖고 위임하는 쪽을 먼저 고려하라는 객체지향 설계 원칙.
tags: [oop, design, gof, delegation]
related: [principles/solid, design-patterns/strategy, design-patterns/decorator, principles/coupling-and-cohesion]
sources:
  - https://en.wikipedia.org/wiki/Composition_over_inheritance
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

GoF 의 *Design Patterns*(1994)가 "클래스 상속보다 객체 합성을 선호하라"는 형태로 널리 알렸다. 상속을 금지하는 규칙이 아니라 **기본값을 합성 쪽에 두라**는 권고다.

## 문제

알림 기능을 상속으로 늘려 간다.

- `Notifier` → `EmailNotifier`, `SmsNotifier`
- 재시도가 필요해 `RetryingEmailNotifier`, `RetryingSmsNotifier`
- 로깅까지 붙이면 조합마다 하위 클래스가 생긴다.

부모 클래스를 고치면 모든 자식이 영향을 받고(취약한 기반 클래스), 실행 중에 동작을 바꿀 수도 없다.

## 해법

"무엇**이다**(is-a)" 대신 "무엇을 **가진다**(has-a)"로 구성한다. 바뀌는 부분을 인터페이스로 빼고 객체로 주입한다.

```ts
interface Channel { send(to: string, msg: string): Promise<void>; }
interface RetryPolicy { run<T>(fn: () => Promise<T>): Promise<T>; }

class Notifier {
  constructor(private channel: Channel, private retry: RetryPolicy) {}
  notify(to: string, msg: string) {
    return this.retry.run(() => this.channel.send(to, msg));
  }
}

// 조합은 클래스 정의가 아니라 생성 시점에 정한다
const n = new Notifier(new SmsChannel(), new ExponentialBackoff(3));
```

## 언제 쓰나

- 기능 조합이 여러 축(채널 × 재시도 × 로깅)으로 늘어날 때
- 실행 중에 동작을 바꾸거나 테스트에서 가짜 구현을 끼워야 할 때
- 외부 라이브러리 클래스를 확장하고 싶지만 내부 구현에 묶이고 싶지 않을 때

## 주의

- **위임 보일러플레이트**: 감싼 객체의 메서드를 하나씩 전달하는 코드가 생긴다. Kotlin `by` 위임, Go 임베딩, Rust trait 기본 구현, 인터페이스 default 메서드 같은 언어 기능이 이를 줄여 준다.
- **상속이 더 나은 경우도 있다.** 진짜 is-a 관계이고, 부모가 기본 동작을 주고 자식은 몇 개만 재정의하는 경우(프레임워크의 템플릿 메서드 등)는 상속이 코드가 훨씬 적다.
- 합성도 과하면 객체 그래프를 따라가야 동작을 알 수 있다. 축이 하나뿐이면 단순한 함수 인자로 충분하다.

## 비교

| | 상속 | 합성 |
| --- | --- | --- |
| 관계 | is-a, 컴파일 시점에 고정 | has-a, 실행 중 교체 가능 |
| 결합도 | 부모 내부 구현에 강하게 묶임 | 인터페이스에만 의존 |
| 코드 양 | 바뀌는 부분만 재정의 → 적음 | 위임 코드 필요 → 많을 수 있음 |
| 조합 폭발 | 축이 늘면 하위 클래스가 곱으로 늘어남 | 축마다 구현을 하나씩 더하면 됨 |
| 관련 패턴 | 템플릿 메서드, 팩토리 메서드 | 전략, 데코레이터, 상태, 프록시 |

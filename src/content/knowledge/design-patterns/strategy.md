---
title: 전략 패턴
aka: [Strategy Pattern, Policy]
category: design-patterns
group: behavioral
level: beginner
summary: 알고리즘군을 인터페이스 뒤에 캡슐화해 실행 중에 교체할 수 있게 하는 행위 패턴.
tags: [gof, oop, composition]
related: [principles/solid]
sources:
  - https://refactoring.guru/design-patterns/strategy
updatedAt: 2026-11-18
---

## 문제

결제 수단, 정렬 방식, 할인 정책처럼 **같은 일을 하는 여러 방법**이 `if/else`·`switch` 로 한 함수에 몰려 있으면, 방법이 늘 때마다 그 함수를 고쳐야 하고 테스트도 어려워진다.

## 해법

각 방법을 같은 인터페이스를 구현하는 별도 객체(전략)로 분리하고, 사용하는 쪽(컨텍스트)은 인터페이스에만 의존한다.

```ts
interface DiscountPolicy { apply(price: number): number }

const none: DiscountPolicy = { apply: (p) => p };
const tenPercent: DiscountPolicy = { apply: (p) => p * 0.9 };

class Checkout {
  constructor(private policy: DiscountPolicy) {}
  total(price: number) { return this.policy.apply(price); }
}

new Checkout(tenPercent).total(10_000); // 9000
```

함수가 일급 값인 언어에서는 인터페이스 대신 **함수 하나를 넘기는 것**이 가장 단순한 전략 패턴이다.

## 언제 쓰나

- 같은 목적의 알고리즘이 둘 이상이고 런타임에 골라야 할 때
- 조건 분기가 계속 늘어나는 함수를 정리할 때 (개방-폐쇄 원칙)

## 주의

- 방법이 하나뿐이거나 바뀔 일이 없으면 과설계다.
- 클라이언트가 어떤 전략이 있는지 알아야 한다 — 선택 로직은 팩토리나 설정으로 모은다.

---
title: 상태 패턴
aka: [State Pattern, Objects for States]
category: design-patterns
group: behavioral
level: intermediate
summary: 상태별 동작을 별도 객체로 나누고 현재 상태 객체에 위임해, 상태가 바뀌면 객체의 행동도 바뀌게 하는 행위 패턴.
tags: [gof, oop, state-machine]
related: [design-patterns/strategy, design-patterns/command, principles/solid, design-patterns/bridge, design-patterns/memento]
sources:
  - https://refactoring.guru/design-patterns/state
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

주문의 `pay()`, `ship()`, `cancel()` 이 모두 `switch (this.status)` 로 시작한다. 상태가 하나 늘면 모든 메서드의 분기를 고쳐야 하고, "배송 중에는 취소 불가" 같은 전이 규칙이 여러 곳에 흩어져 빠뜨리기 쉽다.

## 해법

상태마다 클래스를 만들어 그 상태에서의 동작과 다음 상태로의 전이를 담는다. 컨텍스트는 현재 상태 객체에 호출을 넘기기만 한다.

```ts
interface OrderState {
  pay(o: Order): void;
  ship(o: Order): void;
}

class Pending implements OrderState {
  pay(o: Order) { o.setState(new Paid()); }
  ship() { throw new Error('결제 전에는 배송할 수 없음'); }
}
class Paid implements OrderState {
  pay() { throw new Error('이미 결제됨'); }
  ship(o: Order) { o.setState(new Shipped()); }
}
class Shipped implements OrderState {
  pay() { throw new Error('이미 결제됨'); }
  ship() { throw new Error('이미 배송됨'); }
}

class Order {
  private state: OrderState = new Pending();
  setState(s: OrderState) { this.state = s; }
  pay() { this.state.pay(this); }
  ship() { this.state.ship(this); }
}
```

## 언제 쓰나

- 상태가 여럿이고, 같은 요청이 상태에 따라 다르게 동작할 때
- 상태 분기가 여러 메서드에 반복되고 상태가 자주 추가·변경될 때

## 주의

- 상태가 2~3개이고 거의 안 바뀌면 `switch` 나 전이 표(`Record<Status, Status[]>`)가 더 읽기 쉽다.
- 전이 규칙이 상태 클래스들에 흩어져 전체 흐름을 한눈에 보기 어렵다. 상태 다이어그램을 함께 남긴다.
- 상태를 DB 에 저장한다면 결국 문자열/enum 으로 직렬화해야 한다. 상태 객체 ↔ 값 매핑을 한곳에 둔다.
- 복잡한 워크플로라면 XState 같은 상태 머신 라이브러리가 대안이다.

## 비교

| | 상태 | 전략 |
| --- | --- | --- |
| 구조 | 컨텍스트가 위임 객체를 가짐 (거의 같음) | 동일 |
| 누가 교체하나 | 주로 상태 객체가 다음 상태로 전이 (컨텍스트가 정할 수도 있음) | 보통 클라이언트가 골라서 주입 |
| 위임 객체끼리 | 서로를 알고 전이를 일으킴 | 서로 모르고 독립적 |
| 질문 | "지금 어떤 상태인가?" | "어떤 방법으로 할까?" |

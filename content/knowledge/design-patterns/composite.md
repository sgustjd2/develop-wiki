---
title: 컴포지트 패턴
aka: [Composite Pattern, Object Tree, Part-Whole Hierarchy]
category: design-patterns
group: structural
level: beginner
summary: 객체를 트리 구조로 구성하고, 개별 객체(잎)와 객체 묶음(복합체)을 같은 인터페이스로 다뤄 클라이언트가 둘을 구분하지 않게 하는 구조 패턴.
tags: [gof, oop, tree, recursion]
related: [design-patterns/decorator, design-patterns/iterator, design-patterns/chain-of-responsibility, principles/solid, design-patterns/visitor, design-patterns/interpreter, design-patterns/flyweight]
sources:
  - https://refactoring.guru/design-patterns/composite
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

주문에 상품도 있고, 상품 묶음(세트)도 있고, 세트 안에 또 세트가 있다. 총액을 구하려면 "상품이면 가격, 세트면 안을 다 돌아서 합산, 그 안에 세트가 있으면 또..." 같은 타입 분기가 클라이언트 곳곳에 생긴다. 파일·폴더, UI 컴포넌트 트리, 조직도도 같은 모양이다.

## 해법

잎과 복합체가 공통 인터페이스를 구현한다. 복합체는 자식들에게 같은 연산을 위임하고 결과를 합친다. 재귀가 트리 순회를 대신한다.

```ts
interface Item { price(): number; name: string }

class Product implements Item {
  constructor(readonly name: string, private amount: number) {}
  price() { return this.amount; }
}

class Bundle implements Item {
  private children: Item[] = [];
  constructor(readonly name: string, private discount = 0) {}
  add(...items: Item[]) { this.children.push(...items); return this; }
  price(): number {
    const sum = this.children.reduce((s, c) => s + c.price(), 0);
    return sum * (1 - this.discount);
  }
}

const desk = new Bundle('홈오피스 세트', 0.1).add(
  new Product('책상', 200),
  new Bundle('주변기기').add(new Product('키보드', 50), new Product('마우스', 30)),
);
desk.price(); // 252 — 클라이언트는 잎인지 묶음인지 모른다
```

### 설계 선택: 자식 관리 메서드를 어디에?

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 공통 인터페이스에 `add`/`remove` 포함 (투명성) | 클라이언트가 모든 노드를 똑같이 다룸 | 잎에서 `add` 를 부르면 예외 → 타입 안전성 손해 |
| 복합체에만 둠 (안전성) | 잘못된 호출을 컴파일 시 차단 | 자식을 추가할 때는 타입 확인 필요 |

TypeScript 에서는 보통 안전성 쪽(위 예시)을 택한다.

## 언제 쓰나

- 모델이 자연스럽게 트리(부분-전체 계층)이고, 클라이언트가 단일 객체와 묶음을 똑같이 다뤄야 할 때
- 메뉴, 파일 시스템, 문서 구조(AST), UI 컴포넌트, 권한 그룹

## 주의

- 서로 성격이 다른 노드에 공통 인터페이스를 억지로 맞추면 인터페이스가 **지나치게 일반화**돼 이해하기 어려워진다.
- "이 묶음에는 상품만 들어갈 수 있다" 같은 제약을 타입으로 표현하기 어렵다. 런타임 검사가 필요하다.
- 순환 참조(자기 자신을 자식으로 추가)를 막지 않으면 무한 재귀가 된다.
- 깊은 트리에서 매번 전체를 재귀 계산하면 느리다. 캐시하거나 변경 시 부모에 알리는 방식을 검토한다.

## 비교

| | 컴포지트 | 데코레이터 |
| --- | --- | --- |
| 구조 | 재귀적 합성 (같아 보임) | 재귀적 합성 |
| 자식 수 | 여럿 | 하나 |
| 목적 | 자식들의 결과를 **합침** | 감싼 객체에 책임을 **추가** |

트리를 순회할 때는 [이터레이터](/develop-wiki/knowledge/design-patterns/iterator/)를, 트리 전체에 새 연산을 추가할 때는 비지터 패턴을 함께 쓴다.

---
title: 이터레이터 패턴
aka: [Iterator Pattern, Cursor]
category: design-patterns
group: behavioral
level: beginner
summary: 컬렉션의 내부 구조를 드러내지 않고 요소를 하나씩 순회하는 방법을 별도 객체로 제공하는 행위 패턴. JavaScript 에서는 이터레이션 프로토콜과 제너레이터로 언어에 내장돼 있다.
tags: [gof, oop, collection, generator, lazy-evaluation]
related: [design-patterns/composite, design-patterns/strategy, principles/solid, design-patterns/visitor, design-patterns/memento]
sources:
  - https://refactoring.guru/design-patterns/iterator
  - https://en.wikipedia.org/wiki/Design_Patterns
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
updatedAt: 2026-11-18
---

## 문제

- 트리·그래프·페이지네이션 API 처럼 내부 구조가 복잡한 컬렉션을 순회하는 코드가 비즈니스 로직 곳곳에 중복된다.
- 순회하려면 내부 구조(배열인지, 연결 리스트인지, 다음 페이지 토큰이 있는지)를 알아야 해서 구조를 바꾸면 클라이언트가 깨진다.
- 깊이 우선·너비 우선처럼 순회 방식을 바꾸고 싶다.

## 해법

순회 상태(현재 위치)를 컬렉션이 아니라 **이터레이터 객체**에 둔다. 클라이언트는 "다음 요소"만 요청한다.

JavaScript/TypeScript 는 이를 언어로 지원한다: `[Symbol.iterator]()` 가 `{ next(): { value, done } }` 객체를 돌려주면 `for...of`, 전개 연산자, 구조 분해가 동작한다. **제너레이터**로 쉽게 만든다.

```ts
type Node = { name: string; children: Node[] };

// 같은 트리, 두 가지 순회 방식 — 클라이언트는 내부 구조를 모른다
function* depthFirst(node: Node): Generator<Node> {
  yield node;
  for (const c of node.children) yield* depthFirst(c);
}
function* breadthFirst(root: Node): Generator<Node> {
  const queue = [root];
  while (queue.length) {
    const n = queue.shift()!;
    yield n;
    queue.push(...n.children);
  }
}

// 페이지네이션 API 를 하나의 연속된 스트림처럼 (비동기 이터레이터)
async function* allOrders(fetchPage: (cursor?: string) => Promise<{ items: string[]; next?: string }>) {
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    yield* page.items;
    cursor = page.next;
  } while (cursor);
}
// for await (const o of allOrders(api.listOrders)) { ... }
```

- 이터레이터는 각자 상태를 가지므로 같은 컬렉션을 **여러 개가 동시에** 순회할 수 있고, 멈췄다 이어갈 수 있다.
- 제너레이터는 **지연 평가**라 필요한 만큼만 계산·요청한다(무한 수열, 대용량 파일 줄 단위 처리).

## 언제 쓰나

- 복잡한 내부 구조를 숨기고 순회만 노출하고 싶을 때 ([컴포지트](/develop-wiki/knowledge/design-patterns/composite/) 트리, 그래프)
- 페이지네이션·스트림·파일처럼 데이터가 한 번에 메모리에 올라오지 않을 때
- 같은 데이터에 여러 순회 방식이 필요할 때

## 주의

- 단순 배열이면 직접 구현할 이유가 없다. 언어 내장 순회로 충분하다(과설계).
- 특수 컬렉션을 직접 인덱싱하는 것보다 느릴 수 있다. 성능이 중요한 내부 루프에서는 측정한다.
- 순회 중 컬렉션을 수정하면 결과가 정의되지 않거나 예외가 난다. 복사본을 순회하거나 수정을 모았다가 반영한다.
- 제너레이터는 한 번 소비하면 끝이다. 두 번 순회하려면 새로 만들어야 한다.
- 비동기 이터레이터를 중간에 `break` 하면 `return()` 이 호출된다. 연결·파일 정리는 `try/finally` 에 둔다.

## 비교

| | 외부 이터레이터 (`next()` 호출) | 내부 이터레이터 (`forEach(fn)`) |
| --- | --- | --- |
| 흐름 제어 | 클라이언트 (중단·재개·두 컬렉션 동시 순회 쉬움) | 컬렉션 |
| 조기 종료 | `break` | 예외나 `some` 같은 별도 API 필요 |
| 지연 평가 | 자연스러움 | 보통 즉시 전체 순회 |

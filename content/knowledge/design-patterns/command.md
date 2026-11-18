---
title: 커맨드 패턴
aka: [Command Pattern, Action, Transaction]
category: design-patterns
group: behavioral
level: intermediate
summary: 요청(실행할 작업과 그 인자)을 객체로 만들어, 큐에 넣거나 기록하거나 되돌릴 수 있게 하는 행위 패턴.
tags: [gof, oop, undo, queue]
related: [design-patterns/strategy, design-patterns/observer, design-patterns/chain-of-responsibility, design-patterns/mediator, design-patterns/memento, design-patterns/visitor]
sources:
  - https://refactoring.guru/design-patterns/command
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

에디터의 버튼, 단축키, 메뉴가 같은 작업을 각자 직접 호출하면 코드가 중복된다. 실행 취소(undo), 작업 기록, 나중에 실행하기 같은 요구가 생기면 "무엇을 했는지"를 남길 곳이 없다.

## 해법

작업 하나를 `execute()`(필요하면 `undo()`)를 가진 객체로 만든다. 호출하는 쪽(invoker)은 커맨드 인터페이스만 알고, 실제 일은 커맨드가 수신자(receiver)에게 시킨다.

```ts
interface Command { execute(): void; undo(): void }

class Doc { text = ''; }

class Append implements Command {
  constructor(private doc: Doc, private s: string) {}
  execute() { this.doc.text += this.s; }
  undo() { this.doc.text = this.doc.text.slice(0, -this.s.length); }
}

class History {
  private done: Command[] = [];
  run(cmd: Command) { cmd.execute(); this.done.push(cmd); }
  undo() { this.done.pop()?.undo(); }
}

const doc = new Doc();
const h = new History();
h.run(new Append(doc, 'Hello'));
h.run(new Append(doc, ' world'));
h.undo(); // doc.text === 'Hello'
```

## 언제 쓰나

- undo/redo 가 필요할 때
- 작업을 큐에 쌓아 지연·예약·재시도하거나 직렬화해 다른 곳에서 실행할 때 (작업 큐, 잡 스케줄러)
- 같은 동작을 버튼·단축키·메뉴 등 여러 트리거에 연결할 때
- 여러 작업을 묶어 하나의 매크로로 실행할 때

## 주의

- 단순 콜백으로 충분하면 클래스를 만들 필요 없다. 함수 하나가 가장 가벼운 커맨드다.
- `undo` 는 생각보다 어렵다. 역연산이 없으면 실행 전 상태를 저장해야 하고(메멘토), 메모리를 쓴다.
- 커맨드 클래스가 작업 수만큼 늘어난다.

## 비교

| | 커맨드 | 전략 |
| --- | --- | --- |
| 객체로 만드는 것 | **무엇을** 할지(작업 + 인자) | **어떻게** 할지(같은 일의 다른 방법) |
| 대표 용도 | 큐, 기록, undo | 알고리즘 교체 |

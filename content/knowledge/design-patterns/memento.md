---
title: 메멘토 패턴
aka: [Memento Pattern, Snapshot, Token]
category: design-patterns
group: behavioral
level: intermediate
summary: 객체 내부를 드러내지 않고 그 상태의 스냅숏을 만들어 두었다가 나중에 그 시점으로 되돌리는 행위 패턴. 실행 취소, 롤백, 체크포인트에 쓴다.
tags: [gof, oop, undo, snapshot, behavioral]
related: [design-patterns/command, design-patterns/iterator, design-patterns/prototype, design-patterns/state, architecture/event-sourcing]
sources:
  - https://refactoring.guru/design-patterns/memento
  - https://en.wikipedia.org/wiki/Memento_pattern
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

편집기에 실행 취소(undo)를 넣으려 한다. 바깥의 "이력 관리자"가 편집기의 텍스트·커서·선택 영역·스타일을 하나하나 읽어 복사해 두면 된다. 하지만:

- 그 필드들이 private 이면 읽을 수 없다. 읽으려고 전부 public 으로 열면 **캡슐화가 깨진다**.
- 편집기에 필드가 하나 추가될 때마다 이력 관리자도 고쳐야 한다. 두 클래스가 내부 구조로 묶인다.

## 해법

스냅숏을 만드는 일을 **상태의 주인에게** 맡긴다. 역할은 셋이다.

| 역할 | 하는 일 | 스냅숏 내용을 볼 수 있나 |
| --- | --- | --- |
| 오리지네이터(Originator) | 자기 상태로 메멘토를 만들고, 메멘토로 자기를 복원 | 예 |
| 메멘토(Memento) | 특정 시점 상태를 담은 불변 객체 | — |
| 케어테이커(Caretaker) | 언제 저장·복원할지 결정하고 메멘토를 보관(이력 스택) | **아니오** (라벨·시각 같은 메타데이터만) |

C++·Java·C# 은 메멘토를 오리지네이터의 중첩 클래스로 만들어 접근을 제한한다. TypeScript 에서는 **모듈 스코프**로 같은 효과를 낸다. 아래는 `WeakMap` 을 모듈 밖으로 내보내지 않아 메멘토를 불투명한 토큰으로 만든 예다.

```ts
type EditorState = { text: string; cursor: number };
// 스냅숏 내용은 이 모듈 안에서만 꺼낼 수 있다 (export 하지 않음)
const states = new WeakMap<Memento, EditorState>();

// 메멘토: 밖에서 보면 라벨과 시각만 있는 불투명한 토큰
class Memento {
  readonly at = new Date();
  constructor(readonly label: string) {}
}

// 오리지네이터: 자기 상태를 스냅숏으로 만들고, 스냅숏에서 복원한다
class Editor {
  text = '';
  cursor = 0;
  type(s: string) {
    this.text = this.text.slice(0, this.cursor) + s + this.text.slice(this.cursor);
    this.cursor += s.length;
  }
  save(label: string): Memento {
    const m = new Memento(label);
    states.set(m, { text: this.text, cursor: this.cursor });
    return m;
  }
  restore(m: Memento) {
    const s = states.get(m);
    if (!s) throw new Error('이 편집기가 만든 메멘토가 아님');
    this.text = s.text;
    this.cursor = s.cursor;
  }
}

// 케어테이커: 언제 저장하고 되돌릴지만 안다. 내용은 모른다.
class History {
  private stack: Memento[] = [];
  constructor(private editor: Editor, private limit = 100) {}
  checkpoint(label: string) {
    this.stack.push(this.editor.save(label));
    if (this.stack.length > this.limit) this.stack.shift(); // 오래된 스냅숏 버림
  }
  undo() {
    const m = this.stack.pop();
    if (m) this.editor.restore(m);
  }
}

const ed = new Editor();
const h = new History(ed);
ed.type('Hello');
h.checkpoint('before-world');
ed.type(', world');
h.undo();
console.log(ed.text, ed.cursor); // "Hello" 5
```

`WeakMap` 이라서 케어테이커가 메멘토를 버리면 스냅숏도 가비지 컬렉션 대상이 된다.

## 언제 쓰나

- **실행 취소/다시 실행**: 편집기, 그림 도구, 폼 입력.
- **트랜잭션 롤백**: 여러 단계 작업 중 실패하면 시작 시점으로 되돌리기.
- **체크포인트**: 게임 세이브, 긴 계산의 중간 상태, 마법사(wizard) UI 의 이전 단계.
- 상태를 외부에 저장해야 하지만 getter/setter 를 열고 싶지 않을 때.

## 주의

- **메모리.** 스냅숏을 자주, 크게 찍으면 RAM 을 많이 쓴다. 이력 길이 상한, 오래된 것 버리기, 변경분(diff)만 저장, 구조 공유하는 불변 자료구조(Immer 같은 라이브러리) 사용을 검토한다.
- **얕은 복사 함정.** 스냅숏에 가변 배열·객체의 참조만 넣으면, 원본이 바뀔 때 스냅숏도 바뀐다. 저장 시점에 복사하거나 불변으로 만든다.
- 케어테이커가 메멘토의 생명 주기를 책임져야 한다. 버리지 않으면 누수다.
- JavaScript·Python 같은 동적 언어에서는 메멘토 내용을 완벽히 숨기기 어렵다. 위의 모듈 스코프 방식 정도가 현실적인 한계다.
- 외부 자원(파일 핸들, 네트워크 연결, 다른 서비스의 상태)은 스냅숏으로 되돌릴 수 없다. 메멘토는 **객체 하나의 메모리 안 상태**만 되돌린다. 오리지네이터가 다른 객체나 자원까지 바꿨다면 따로 처리해야 한다.

## 비교

| | 메멘토 | 커맨드 기반 undo | 프로토타입 | 이벤트 소싱 |
| --- | --- | --- | --- | --- |
| 저장하는 것 | 시점별 **상태** | 실행한 **연산**과 역연산 | 객체 **전체 복제본** | 일어난 **사건**의 영구 로그 |
| 되돌리기 | 스냅숏으로 덮어쓰기 | `undo()` 로 역연산 실행 | 복제본으로 교체 | 이벤트를 원하는 시점까지 재생 |
| 메모리 | 상태 크기 × 횟수 | 작음 | 큼 | 이벤트 누적(영속 저장) |
| 캡슐화 | 지킴 | 커맨드가 수신자 내부를 알아야 할 수 있음 | 지킴 | 상태를 이벤트로 공개 |
| 역연산이 어려운 경우 | 문제 없음 | 구현하기 어려움 | 문제 없음 | 보상 이벤트 필요 |

- [커맨드](/develop-wiki/knowledge/design-patterns/command/)와 함께 쓰는 것이 흔하다. 커맨드를 실행하기 직전에 메멘토를 찍어 두면, 역연산을 짜기 어려운 커맨드도 되돌릴 수 있다.
- [이터레이터](/develop-wiki/knowledge/design-patterns/iterator/)의 현재 위치를 메멘토로 저장해 순회를 되돌릴 수 있다.
- 상태가 단순하고 외부 연결이 없다면 [프로토타입](/develop-wiki/knowledge/design-patterns/prototype/)으로 객체를 통째로 복제해 두는 편이 더 간단하다.
- [이벤트 소싱](/develop-wiki/knowledge/architecture/event-sourcing/)은 스냅숏을 성능 최적화용으로 함께 쓴다. 메멘토는 프로세스 안의 일시적 이력, 이벤트 소싱은 시스템의 영구 기록이라는 점이 다르다.

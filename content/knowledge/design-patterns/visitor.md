---
title: 비지터 패턴
aka: [Visitor Pattern, Double Dispatch, 이중 디스패치]
category: design-patterns
group: behavioral
level: advanced
summary: 객체 구조(트리)의 원소 클래스는 그대로 두고, 그 위에서 수행할 연산을 별도 방문자 클래스로 분리하는 행위 패턴. 이중 디스패치로 원소 타입에 맞는 메서드를 고른다.
tags: [gof, oop, double-dispatch, ast, behavioral]
related: [design-patterns/composite, design-patterns/iterator, design-patterns/command, design-patterns/interpreter, principles/solid]
sources:
  - https://refactoring.guru/design-patterns/visitor
  - https://en.wikipedia.org/wiki/Visitor_pattern
  - https://en.wikipedia.org/wiki/Design_Patterns
  - https://eslint.org/docs/latest/extend/custom-rules
updatedAt: 2026-11-18
---

## 문제

문서가 `Section`, `Paragraph`, `Image` 노드의 트리로 되어 있다. HTML 내보내기, 단어 수 세기, 맞춤법 검사, PDF 내보내기 같은 기능이 계속 추가된다.

- 기능마다 모든 노드 클래스에 메서드를 추가하면, 노드 클래스가 온갖 기능의 잡동사니가 된다. 노드 클래스가 서드파티 라이브러리 것이라면 고칠 수도 없다.
- 기능 함수 하나에서 `if (n instanceof Paragraph) ... else if (n instanceof Image)` 로 분기하면, 새 노드가 생겼을 때 빠뜨린 분기를 컴파일러가 잡아 주지 않는다.

## 해법

- 연산을 **방문자(Visitor)** 클래스로 뺀다. 방문자는 원소 타입마다 메서드를 하나씩 가진다(`paragraph()`, `image()`, `section()`).
- 각 원소는 `accept(visitor)` 하나만 구현한다. 내용은 "**내 타입에 맞는** 방문자 메서드를 나를 인자로 불러라"뿐이다.
- 호출이 두 번 디스패치된다: `node.accept(v)` 에서 원소의 실제 타입이, `v.paragraph(this)` 에서 방문자의 실제 타입이 정해진다 → **이중 디스패치**. 메서드 오버로딩만으로는 안 된다. 오버로딩은 컴파일 시점의 정적 타입으로 메서드를 고르기 때문이다.

```ts
interface DocVisitor<R> {
  paragraph(n: Paragraph): R;
  image(n: ImageNode): R;
  section(n: Section): R;
}
interface DocNode { accept<R>(v: DocVisitor<R>): R }

// 노드는 accept 하나만 안다: "내 타입에 맞는 visit 메서드를 불러 달라" (이중 디스패치)
class Paragraph implements DocNode {
  constructor(readonly text: string) {}
  accept<R>(v: DocVisitor<R>): R { return v.paragraph(this); }
}
class ImageNode implements DocNode {
  constructor(readonly src: string, readonly alt: string) {}
  accept<R>(v: DocVisitor<R>): R { return v.image(this); }
}
class Section implements DocNode {
  constructor(readonly title: string, readonly children: DocNode[]) {}
  accept<R>(v: DocVisitor<R>): R { return v.section(this); }
}

// 새 연산 = 새 방문자 클래스. 노드 클래스는 고치지 않는다.
class HtmlExporter implements DocVisitor<string> {
  paragraph(n: Paragraph) { return `<p>${n.text}</p>`; }
  image(n: ImageNode) { return `<img src="${n.src}" alt="${n.alt}">`; }
  section(n: Section): string {
    return `<section><h2>${n.title}</h2>${n.children.map((c) => c.accept(this)).join('')}</section>`;
  }
}

class WordCounter implements DocVisitor<number> {
  paragraph(n: Paragraph) { return n.text.split(/\s+/).filter(Boolean).length; }
  image() { return 0; }
  section(n: Section): number { return n.children.reduce((s, c) => s + c.accept(this), 0); }
}

const doc = new Section('소개', [new Paragraph('비지터 패턴 예시 문서'), new ImageNode('a.png', '그림')]);
console.log(doc.accept(new HtmlExporter()));
console.log(doc.accept(new WordCounter())); // 4
```

`DocVisitor` 에 메서드가 빠지면 `implements` 에서 컴파일 오류가 난다. "모든 노드 타입을 처리했는가"를 타입 시스템이 검사해 준다.

### TypeScript 다운 대안: 판별 유니온

합 타입과 패턴 매칭이 있는 언어는 이 패턴의 이점을 상당 부분 기본으로 제공한다. 노드가 데이터일 뿐이라면 클래스 계층과 `accept` 없이 판별 유니온과 망라 검사로 같은 안전성을 얻는다. 함수형 언어의 패턴 매칭과 같은 방식이다.

```ts
type Node =
  | { kind: 'p'; text: string }
  | { kind: 'img'; src: string }
  | { kind: 'section'; children: Node[] };

function countImages(n: Node): number {
  switch (n.kind) {
    case 'p': return 0;
    case 'img': return 1;
    case 'section': return n.children.reduce((s, c) => s + countImages(c), 0);
    default: { const never: never = n; return never; } // 새 kind 가 생기면 여기서 컴파일 오류
  }
}
```

## 언제 쓰나

- **원소 클래스는 거의 안 바뀌고, 연산은 자주 추가되는** 구조: 컴파일러·린터의 AST(타입 검사, 최적화, 코드 생성 패스), 문서 모델, 장면 그래프.
- 서로 다른 클래스로 이뤄진 [컴포지트](/develop-wiki/knowledge/design-patterns/composite/) 트리 전체에 한 연산을 적용할 때.
- 핵심 클래스에서 보조 기능(내보내기, 직렬화, 통계)을 떼어 내 클래스를 깔끔하게 유지하고 싶을 때.
- 순회하면서 상태를 누적해야 할 때 — 방문자 객체가 필드에 결과를 모을 수 있다.

실제 예: ESLint 규칙의 `create()` 는 노드 타입(`Identifier`, `"FunctionExpression:exit"` 등)을 키로 한 함수 객체를 돌려주고, ESLint 가 AST 를 내려가며(`:exit` 면 올라오며) 해당 함수를 부른다. 클래스 대신 객체 리터럴을 쓴 방문자다.

## 주의

- **원소 클래스를 추가하기가 비싸다.** 새 노드 타입이 생기면 모든 방문자를 고쳐야 한다. 원소 계층이 자주 바뀌는 곳에는 맞지 않는다(이른바 expression problem 의 한쪽 면).
- 방문자가 원소의 내부를 다뤄야 하므로 원소가 필드를 공개해야 하는 경우가 많다. 캡슐화가 약해진다.
- `accept`/`visit` 의 간접 호출 때문에 흐름을 따라가기 어렵다. 연산이 두세 개뿐이면 그냥 메서드나 `switch` 가 낫다.
- 방문자가 순회를 주도하면 중간에 멈추거나 두 구조를 나란히 순회하기 어렵다.
- 순회 순서(전위·후위, 자식을 방문할지)를 원소의 `accept` 가 정할지 방문자가 정할지 일관되게 정해야 한다. 위 예는 방문자가 정한다.
- 순환 구조(그래프)를 방문하면 무한 재귀가 된다. 방문 집합을 둔다.

## 비교

| | 비지터 | 이터레이터 | 커맨드 | 인터프리터 |
| --- | --- | --- | --- | --- |
| 다루는 것 | 이질적인 원소 위의 **연산** | 원소에 **순서대로 접근** | 요청 하나를 객체로 | 언어 문장의 **의미 평가** |
| 원소 타입별 분기 | 이중 디스패치 | 없음(같은 타입으로 봄) | 없음 | 각 노드 클래스가 `interpret` 구현 |
| 새 연산 추가 | 쉬움(방문자 추가) | — | 커맨드 추가 | 모든 노드 클래스 수정 |
| 새 원소 추가 | 어려움(모든 방문자 수정) | 쉬움 | — | 쉬움(클래스 하나) |

- [인터프리터](/develop-wiki/knowledge/design-patterns/interpreter/)는 연산(해석)을 노드에 넣고, 비지터는 연산을 노드 밖으로 뺀다. 같은 AST 에 대해 연산이 많아지면 인터프리터에서 비지터로 옮겨 가는 경우가 많다.
- [이터레이터](/develop-wiki/knowledge/design-patterns/iterator/)로 순회하고 비지터로 처리하는 조합이 흔하다.
- refactoring.guru 는 비지터를 서로 다른 클래스의 객체들에 연산을 실행할 수 있는 강화된 [커맨드](/develop-wiki/knowledge/design-patterns/command/)로 볼 수 있다고 설명한다.

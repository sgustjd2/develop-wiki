---
title: 인터프리터 패턴
aka: [Interpreter Pattern, AST Interpreter, Little Language]
category: design-patterns
group: behavioral
level: advanced
summary: 작은 언어의 문법 규칙 하나하나를 클래스로 만들고, 문장을 그 객체들의 트리(AST)로 표현해 재귀적으로 평가하는 행위 패턴. 규칙 엔진·필터 식 같은 소형 DSL 에 맞다.
tags: [gof, oop, dsl, ast, behavioral]
related: [design-patterns/composite, design-patterns/visitor, design-patterns/flyweight, design-patterns/state, design-patterns/iterator, cs-fundamentals/interpreter-compiler-jit]
sources:
  - https://en.wikipedia.org/wiki/Interpreter_pattern
  - https://sourcemaking.com/design_patterns/interpreter
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

할인 조건을 운영자가 직접 정하고 싶어 한다: "국가가 KR 이고, 19세 이상이거나 VIP". 조건이 바뀔 때마다 `if` 문을 고치고 배포할 수는 없다. 같은 종류의 문제(검색 필터, 알림 규칙, 권한 정책)가 반복된다. 이 문제 영역을 **작은 언어**로 표현할 수 있다면, 코드를 고치는 대신 문장을 바꾸면 된다.

## 해법

- 문법의 규칙(생성 규칙) 하나 = 클래스 하나. 모두 공통 인터페이스 `interpret(context)` 를 구현한다.
- **종단(terminal) 표현식**: 자식이 없는 잎. 리터럴, 변수.
- **비종단(nonterminal) 표현식**: 자식 표현식을 갖고, 자식을 해석한 결과를 조합한다. `and`, `or`, `==`.
- **컨텍스트**: 해석에 필요한 외부 정보(변수 값, 입력 스트림, 출력 버퍼).
- 문장 하나가 이 객체들의 **추상 구문 트리(AST)**가 되고, 루트의 `interpret` 가 재귀적으로 내려가며 값을 계산한다. 구조는 [컴포지트](/develop-wiki/knowledge/design-patterns/composite/) 그대로다.

```ts
type Value = string | number | boolean;
type Context = Readonly<Record<string, Value>>;

// 문법 규칙 하나 = 클래스 하나. 모두 interpret(context) 를 구현한다.
interface Expr { interpret(ctx: Context): Value }

// 종단(terminal) 표현식
class Lit implements Expr {
  constructor(private v: Value) {}
  interpret() { return this.v; }
}
class Var implements Expr {
  constructor(private name: string) {}
  interpret(ctx: Context) {
    const v = ctx[this.name];
    if (v === undefined) throw new Error(`정의되지 않은 변수: ${this.name}`);
    return v;
  }
}

// 비종단(nonterminal) 표현식: 자식 표현식을 해석해 결과를 조합
class Eq implements Expr {
  constructor(private l: Expr, private r: Expr) {}
  interpret(c: Context) { return this.l.interpret(c) === this.r.interpret(c); }
}
class Gte implements Expr {
  constructor(private l: Expr, private r: Expr) {}
  interpret(c: Context) { return Number(this.l.interpret(c)) >= Number(this.r.interpret(c)); }
}
class And implements Expr {
  constructor(private l: Expr, private r: Expr) {}
  interpret(c: Context) { return Boolean(this.l.interpret(c)) && Boolean(this.r.interpret(c)); }
}
class Or implements Expr {
  constructor(private l: Expr, private r: Expr) {}
  interpret(c: Context) { return Boolean(this.l.interpret(c)) || Boolean(this.r.interpret(c)); }
}

// country == "KR" and (age >= 19 or vip) — 파서가 만들었다고 치고 AST 를 직접 조립
const rule: Expr = new And(
  new Eq(new Var('country'), new Lit('KR')),
  new Or(new Gte(new Var('age'), new Lit(19)), new Var('vip')),
);

console.log(rule.interpret({ country: 'KR', age: 17, vip: true }));  // true
console.log(rule.interpret({ country: 'JP', age: 30, vip: false })); // false
```

**패턴은 파싱을 다루지 않는다.** 문자열 `"country == 'KR' and ..."` 를 AST 로 바꾸는 일은 별도다. 손으로 쓴 재귀 하강 파서, 파서 생성기(ANTLR, PEG), 또는 JSON 으로 AST 를 직접 저장하는 방식(JSONLogic 류) 중에서 고른다.

## 언제 쓰나

- 문법이 **작고 단순하며**, 같은 종류의 문제가 반복돼 언어로 표현하는 비용을 감당할 만할 때.
- 규칙·필터·조건을 데이터로 저장하고 런타임에 평가해야 할 때: 기능 플래그 타깃팅, 알림 조건, 권한 정책, 검색 질의, 스프레드시트 수식.
- 효율이 결정적이지 않을 때. 트리를 매번 걸어 다니는 해석은 느리다.

## 주의

- **문법이 커지면 클래스가 폭발한다.** 규칙마다 클래스가 생기고 유지보수가 어려워진다. sourcemaking 은 문법이 복잡해지면 전용 파서 같은 다른 기법을 쓰라고 권한다.
- **성능**: 노드마다 가상 호출, 매 평가마다 트리 순회. 핫패스라면 AST 를 클로저로 한 번 "컴파일"하거나(트리를 함수 조합으로 변환), 바이트코드로 낮춘다 → [인터프리터·컴파일러·JIT](/develop-wiki/knowledge/cs-fundamentals/interpreter-compiler-jit/).
- **보안**: 사용자가 작성한 식을 평가한다면 무한 루프·과도한 깊이·비싼 연산을 제한해야 한다. `eval` 로 대신하는 것은 금물이다.
- 오류 메시지, 타입 검사, 디버깅 도구까지 만들어야 사람이 쓸 만한 언어가 된다. 이 비용이 숨어 있다. 기존 언어(JSON Schema, CEL, SQL 의 WHERE 부분)를 재사용할 수 있으면 그쪽이 싸다.
- 해석 이외의 연산(출력, 최적화, 검증)이 늘면 노드 클래스가 비대해진다. 그때는 연산을 [비지터](/develop-wiki/knowledge/design-patterns/visitor/)로 빼낸다.

## 비교

| | 인터프리터 | 컴포지트 | 비지터 | 전략 |
| --- | --- | --- | --- | --- |
| 구조 | 문법 규칙 = 클래스, 문장 = 트리 | 부분-전체 트리 | 트리 밖의 연산 객체 | 교체 가능한 알고리즘 객체 |
| 관점 | 트리를 **언어**로 본다 | 트리를 **부분-전체 계층**으로 본다 | 트리 위의 **연산**을 분리 | 트리 없음 |
| 새 규칙(노드) 추가 | 쉬움 | 쉬움 | 어려움 | — |
| 새 연산 추가 | 어려움(모든 노드 수정) | 어려움 | 쉬움 | — |

- sourcemaking 은 연산이 계층 전체에 퍼져 있는 컴포지트는 거의 모두 인터프리터처럼 보인다고 하며, 그 계층을 **의도적으로 언어로 모델링할 때**만 인터프리터라고 부르라고 한다.
- 종단 기호는 [플라이웨이트](/develop-wiki/knowledge/design-patterns/flyweight/)로 공유할 수 있다(예: 같은 `Lit(true)` 를 여러 곳에서).
- 파싱 문맥을 [상태](/develop-wiki/knowledge/design-patterns/state/) 패턴으로 표현하기도 한다.

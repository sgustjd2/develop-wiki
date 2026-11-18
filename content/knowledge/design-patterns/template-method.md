---
title: 템플릿 메서드 패턴
aka: [Template Method Pattern]
category: design-patterns
group: behavioral
level: beginner
summary: 알고리즘의 뼈대를 상위 클래스의 메서드 하나에 고정하고, 단계 중 일부만 하위 클래스가 재정의하게 하는 행위 패턴.
tags: [gof, oop, inheritance, hook]
related: [design-patterns/strategy, design-patterns/factory-method, principles/composition-over-inheritance, principles/solid]
sources:
  - https://refactoring.guru/design-patterns/template-method
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

CSV·JSON·XML 리포트 내보내기 클래스가 각각 "데이터 읽기 → 검증 → 변환 → 파일 쓰기 → 알림"을 거의 똑같이 구현한다. 다른 건 변환 단계뿐인데 나머지가 복붙돼 있어, 검증 규칙을 바꾸려면 세 곳을 고쳐야 한다.

## 해법

상위 클래스에 **순서를 고정한 템플릿 메서드**를 두고, 달라지는 단계만 추상 메서드나 훅으로 뺀다.

- **추상 단계**: 하위 클래스가 반드시 구현
- **기본 구현 단계**: 필요하면 재정의
- **훅(hook)**: 비어 있는 확장 지점. 재정의하지 않아도 됨

```ts
abstract class ReportExporter {
  // 템플릿 메서드: 순서를 고정 (하위 클래스가 바꾸지 않는다는 약속)
  export(rows: Row[]): string {
    const valid = this.validate(rows);
    this.beforeSerialize(valid);           // 훅
    const body = this.serialize(valid);    // 추상 단계
    return this.header() + body;
  }
  protected validate(rows: Row[]) { return rows.filter((r) => r.id); }
  protected header() { return ''; }
  protected beforeSerialize(_rows: Row[]) {}
  protected abstract serialize(rows: Row[]): string;
}

class CsvExporter extends ReportExporter {
  protected header() { return 'id,name\n'; }
  protected serialize(rows: Row[]) { return rows.map((r) => `${r.id},${r.name}`).join('\n'); }
}
class JsonExporter extends ReportExporter {
  protected serialize(rows: Row[]) { return JSON.stringify(rows); }
}
type Row = { id: string; name: string };
```

TypeScript 에는 `final` 이 없어 템플릿 메서드 재정의를 언어로 막을 수 없다. 주석·린트 규칙·코드 리뷰로 지킨다.

## 언제 쓰나

- 여러 클래스가 거의 같은 알고리즘을 갖고 일부 단계만 다를 때
- 프레임워크가 흐름을 쥐고, 사용자는 정해진 지점만 채우게 하고 싶을 때 (테스트 프레임워크의 `setUp`/`tearDown`, UI 컴포넌트 생명주기)

## 주의

- **상속 기반**이라 결합이 강하다. 단계 조합이 다양해지면 하위 클래스가 폭증한다. 이때는 단계를 객체로 주입하는 [전략](/develop-wiki/knowledge/design-patterns/strategy/)이나 함수 인자로 바꾼다 → [상속보다 합성](/develop-wiki/knowledge/principles/composition-over-inheritance/)
- 하위 클래스가 기본 단계를 "아무것도 안 함"으로 덮어 꺼 버리면 리스코프 치환 원칙을 어길 수 있다.
- 단계가 많아질수록 어떤 단계가 어디서 재정의됐는지 추적하기 어렵다. 단계 수를 작게 유지한다.
- 함수형 스타일에서는 고차 함수 하나(`export(rows, serialize)`)로 충분한 경우가 많다.

## 비교

| | 템플릿 메서드 | 전략 | 팩토리 메서드 |
| --- | --- | --- | --- |
| 메커니즘 | 상속 | 합성 | 상속 (주로) |
| 바뀌는 범위 | 알고리즘의 일부 단계 | 알고리즘 전체 | 생성할 객체 |
| 결정 시점 | 컴파일 시 (클래스 선택) | 런타임에 교체 가능 | 컴파일 시 |
| 관계 | — | — | 템플릿 메서드의 한 단계가 팩토리 메서드인 경우가 많음 |

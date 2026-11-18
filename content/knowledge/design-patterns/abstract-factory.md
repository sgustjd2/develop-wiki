---
title: 추상 팩토리 패턴
aka: [Abstract Factory Pattern, Kit]
category: design-patterns
group: creational
level: intermediate
summary: 서로 어울려야 하는 관련 객체들의 묶음(제품군)을 구체 클래스를 지정하지 않고 생성하는 인터페이스를 제공하는 생성 패턴.
tags: [gof, oop, factory, product-family]
related: [design-patterns/factory-method, design-patterns/builder, design-patterns/singleton, principles/solid, design-patterns/prototype, design-patterns/bridge]
sources:
  - https://refactoring.guru/design-patterns/abstract-factory
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

UI 키트가 라이트·다크·고대비 테마를 지원한다. 화면 코드가 `new DarkButton()`, `new LightDialog()` 처럼 구체 클래스를 직접 만들면 두 가지 문제가 생긴다.
- 테마를 바꾸려면 화면 코드 곳곳을 고쳐야 한다.
- 실수로 다크 버튼과 라이트 다이얼로그를 섞어 쓸 수 있다. **같은 계열끼리 맞춰야 한다**는 규칙을 아무도 강제하지 않는다.

## 해법

제품군의 각 제품을 만드는 메서드를 모은 **팩토리 인터페이스**를 정의하고, 계열(변형)마다 구체 팩토리를 둔다. 클라이언트는 팩토리 인터페이스만 안다.

```ts
interface Button { render(): string }
interface Dialog { open(msg: string): string }

interface UiFactory {
  createButton(label: string): Button;
  createDialog(): Dialog;
}

const darkUi: UiFactory = {
  createButton: (label) => ({ render: () => `<button class="dark">${label}</button>` }),
  createDialog: () => ({ open: (m) => `<dialog class="dark">${m}</dialog>` }),
};
const lightUi: UiFactory = {
  createButton: (label) => ({ render: () => `<button class="light">${label}</button>` }),
  createDialog: () => ({ open: (m) => `<dialog class="light">${m}</dialog>` }),
};

// 클라이언트: 어떤 테마인지 모른다. 한 팩토리에서 나온 제품은 서로 어울린다.
function confirmDelete(ui: UiFactory) {
  return ui.createDialog().open('삭제할까요?') + ui.createButton('확인').render();
}
const ui = prefersDark ? darkUi : lightUi;   // 앱 시작 시 한 번 선택
declare const prefersDark: boolean;
```

다른 예: 데이터베이스별(`PostgresFactory`, `SqliteFactory`) 커넥션·쿼리 빌더·마이그레이터 묶음, 클라우드 공급자별 스토리지·큐·비밀 저장소 클라이언트 묶음.

## 언제 쓰나

- 여러 제품군 중 하나를 골라 쓰고, **같은 군의 제품끼리만 함께 써야** 할 때
- 클라이언트가 구체 제품 클래스에 의존하지 않게 하고 싶을 때 (테스트용 가짜 팩토리 주입)
- 팩토리 메서드가 여러 개 생겨 한 클래스가 생성 책임을 너무 많이 떠안을 때

## 주의

- 인터페이스와 클래스 수가 많아진다. 제품군이 하나뿐이거나 변형이 늘어날 계획이 없으면 과설계다.
- **새 제품 종류**(예: `Tooltip`)를 추가하면 팩토리 인터페이스와 **모든 구체 팩토리**를 고쳐야 한다. 새 **변형**(테마 하나 추가)은 쉽지만 새 **제품 종류**는 비싸다. 어느 축이 자주 바뀌는지 보고 고른다.
- 팩토리 선택 로직이 흩어지지 않게 조립 지점 한곳에서 정한다. 팩토리 자체는 보통 하나만 있으면 되므로 [싱글턴](/develop-wiki/knowledge/design-patterns/singleton/) 대신 한 번 만들어 주입한다.

## 비교

| | 추상 팩토리 | 팩토리 메서드 | 빌더 |
| --- | --- | --- | --- |
| 만드는 것 | 관련 객체 **묶음** | 객체 하나 | 복잡한 객체 하나 |
| 메커니즘 | 객체 합성 (팩토리 객체 주입) | 상속 (하위 클래스가 결정) | 단계별 조립 |
| 반환 시점 | 즉시 | 즉시 | 여러 단계 후 `build()` |
| 관계 | 내부를 팩토리 메서드 여러 개로 구현하는 경우가 많음. 설계가 팩토리 메서드에서 시작해 추상 팩토리로 발전하기도 함 | | |

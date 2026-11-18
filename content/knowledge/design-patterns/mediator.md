---
title: 중재자 패턴
aka: [Mediator Pattern, Controller, Intermediary]
category: design-patterns
group: behavioral
level: intermediate
summary: 객체들이 서로 직접 참조하지 않고 중재자 객체를 통해서만 협력하게 해, 다대다 의존을 중재자와의 일대다 의존으로 바꾸는 행위 패턴.
tags: [gof, oop, decoupling, ui]
related: [design-patterns/observer, design-patterns/facade, design-patterns/command, design-patterns/chain-of-responsibility, principles/coupling-and-cohesion]
sources:
  - https://refactoring.guru/design-patterns/mediator
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

회원가입 폼에서 "회사 계정" 체크박스를 켜면 회사명 입력란이 나타나고, 이메일 도메인 검사 규칙이 바뀌고, 제출 버튼 활성 조건이 바뀐다. 각 컴포넌트가 서로를 직접 참조해 갱신하면 의존이 거미줄처럼 얽히고, 체크박스 컴포넌트를 다른 폼에서 재사용할 수 없다.

## 해법

컴포넌트는 "나한테 이런 일이 생겼다"만 중재자에게 알리고, 다른 컴포넌트에 무엇을 할지는 **중재자가 결정**한다. 컴포넌트는 서로를 모른다.

```ts
interface Mediator { notify(sender: string, event: string): void }

class Field {
  value = ''; visible = true;
  constructor(private name: string, private m: Mediator) {}
  change(v: string) { this.value = v; this.m.notify(this.name, 'change'); }
}
class Checkbox {
  checked = false;
  constructor(private name: string, private m: Mediator) {}
  toggle() { this.checked = !this.checked; this.m.notify(this.name, 'toggle'); }
}

class SignupForm implements Mediator {
  isCompany = new Checkbox('isCompany', this);
  company = new Field('company', this);
  email = new Field('email', this);
  canSubmit = false;

  notify(sender: string) {
    if (sender === 'isCompany') this.company.visible = this.isCompany.checked;
    const emailOk = this.isCompany.checked
      ? !/@(gmail|naver)\./.test(this.email.value)
      : this.email.value.includes('@');
    this.canSubmit = emailOk && (!this.isCompany.checked || this.company.value !== '');
  }
}
```

상호작용 규칙이 `SignupForm` 한곳에 모여, 규칙을 바꿀 때 컴포넌트를 건드리지 않는다.

## 언제 쓰나

- 여러 객체가 복잡하게 상호작용해 결합이 강하고 바꾸기 어려울 때 (폼·대화상자 UI, 채팅방, 항공 관제 비유)
- 컴포넌트를 다른 맥락에서 재사용하고 싶은데 다른 컴포넌트에 대한 의존 때문에 못 할 때
- 맥락마다 동작만 조금 다른 하위 클래스를 계속 만들고 있을 때 (대신 중재자를 바꾼다)

## 주의

- 중재자에 모든 로직이 모여 **신 객체(God Object)** 가 되기 쉽다. 중재자가 커지면 기능별로 쪼갠다.
- 결합이 사라진 게 아니라 중재자로 **옮겨진** 것이다. 중재자는 모든 참여자를 안다.
- 상호작용이 단순하면(두세 객체) 직접 호출이 더 읽기 쉽다.
- 시스템 수준에서 같은 생각을 확장한 것이 메시지 브로커·오케스트레이터다. 같은 장단점(중앙 집중, 단일 장애점)이 따라온다.

## 비교

| | 중재자 | 옵저버 | 퍼사드 |
| --- | --- | --- | --- |
| 방향 | 참여자 ↔ 중재자 (양방향) | 발행자 → 구독자 (단방향) | 클라이언트 → 하위 시스템 (단방향) |
| 참여자끼리 아나 | 모름, 중재자만 앎 | 발행자는 구독자 목록만 앎 | 하위 시스템 객체끼리는 직접 통신 가능 |
| 목적 | 상호작용 규칙을 한곳에 | 변경 알림을 느슨하게 | 복잡한 하위 시스템을 단순한 인터페이스로 |
| 관계 | 흔히 옵저버로 구현 (중재자가 구독자 이벤트를 받음) | | |

[커맨드](/develop-wiki/knowledge/design-patterns/command/)는 송신자→수신자 단방향 연결을 만들고, [책임 연쇄](/develop-wiki/knowledge/design-patterns/chain-of-responsibility/)는 요청을 처리기 사슬에 흘려보낸다. 중재자는 직접 연결 자체를 없앤다.

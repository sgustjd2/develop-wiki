---
title: 팩토리 메서드 패턴
aka: [Factory Method Pattern, Virtual Constructor]
category: design-patterns
group: creational
level: beginner
summary: 객체 생성을 별도 메서드로 분리해 어떤 구체 클래스를 생성할지는 하위 클래스나 구현체가 정하게 하는 생성 패턴.
tags: [gof, oop, creation]
related: [design-patterns/builder, design-patterns/strategy, principles/solid, design-patterns/abstract-factory, design-patterns/template-method, design-patterns/prototype, design-patterns/service-locator-vs-dependency-injection]
sources:
  - https://refactoring.guru/design-patterns/factory-method
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

비즈니스 로직 곳곳에 `new EmailSender()` 가 박혀 있으면, SMS·푸시 같은 새 종류가 생길 때마다 그 코드를 모두 찾아 고쳐야 한다. 생성 코드와 사용 코드가 붙어 있어 테스트용 가짜 객체로 바꾸기도 어렵다.

## 해법

생성을 담당하는 메서드(팩토리 메서드)를 두고, 그 메서드가 돌려주는 타입은 인터페이스로 고정한다. 구체 클래스 선택은 하위 클래스가 메서드를 재정의해서 정한다.

```ts
interface Notifier { send(to: string, msg: string): void }

class EmailNotifier implements Notifier {
  send(to: string, msg: string) { console.log(`mail ${to}: ${msg}`); }
}
class SmsNotifier implements Notifier {
  send(to: string, msg: string) { console.log(`sms ${to}: ${msg}`); }
}

abstract class Alerting {
  protected abstract createNotifier(): Notifier; // 팩토리 메서드
  alert(to: string) { this.createNotifier().send(to, '장애 발생'); }
}

class EmailAlerting extends Alerting {
  protected createNotifier() { return new EmailNotifier(); }
}
class SmsAlerting extends Alerting {
  protected createNotifier() { return new SmsNotifier(); }
}
```

TypeScript 에서는 상속 대신 `() => Notifier` 같은 **생성 함수를 주입**하는 형태로 쓰기도 한다.

## 언제 쓰나

- 사용할 구체 타입을 미리 알 수 없거나, 라이브러리 사용자가 확장 지점으로 바꿔 끼워야 할 때
- 생성 로직(설정 읽기, 캐시 재사용 등)을 한곳에 모으고 싶을 때

## 주의

- 제품 종류마다 생성자 하위 클래스가 하나씩 늘어 클래스 수가 불어난다.
- 종류가 하나뿐이면 그냥 `new` 가 낫다. 확장 요구가 실제로 생겼을 때 도입한다.
- 인자 값에 따라 분기하는 정적 `create(type)` 함수는 흔히 "심플 팩토리"라 부르며, GoF 의 팩토리 메서드와는 구조가 다르다.

## 비교

| 패턴 | 초점 |
| --- | --- |
| 팩토리 메서드 | 어떤 클래스를 만들지를 하위 클래스·구현체에 위임 |
| 추상 팩토리 | 서로 어울리는 객체 **묶음**을 함께 생성 |
| 빌더 | 한 객체를 **여러 단계**에 걸쳐 조립 |

---
title: 퍼사드 패턴
aka: [Facade Pattern]
category: design-patterns
group: structural
level: beginner
summary: 여러 객체로 이뤄진 복잡한 서브시스템 앞에 필요한 기능만 묶은 단순한 진입점을 두는 구조 패턴.
tags: [gof, oop, encapsulation, layering]
related: [design-patterns/adapter, design-patterns/decorator, architecture/hexagonal, design-patterns/mediator, design-patterns/singleton, design-patterns/flyweight]
sources:
  - https://refactoring.guru/design-patterns/facade
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

주문 하나를 처리하려면 재고 예약, 결제, 배송 등록, 알림 발송을 정해진 순서로 호출해야 한다. 컨트롤러·배치·관리자 화면이 이 순서를 각자 알고 있으면, 단계가 하나 바뀔 때 모두 고쳐야 하고 서브시스템 클래스들과 강하게 묶인다.

## 해법

서브시스템을 감싸는 객체 하나가 자주 쓰는 작업을 고수준 메서드로 제공한다. 내부 객체는 그대로 두고, 필요하면 직접 접근도 막지 않는다.

```ts
class Inventory { reserve(sku: string) { /* ... */ } }
class Payments { charge(userId: string, amount: number) { return 'tx_1'; } }
class Shipping { register(sku: string, userId: string) { return 'ship_1'; } }
class Mailer { send(userId: string, text: string) { /* ... */ } }

class OrderFacade {
  constructor(
    private inv = new Inventory(), private pay = new Payments(),
    private ship = new Shipping(), private mail = new Mailer(),
  ) {}

  placeOrder(userId: string, sku: string, amount: number) {
    this.inv.reserve(sku);
    const tx = this.pay.charge(userId, amount);
    const shipment = this.ship.register(sku, userId);
    this.mail.send(userId, `주문 완료 (${shipment})`);
    return { tx, shipment };
  }
}
```

## 언제 쓰나

- 큰 라이브러리·SDK 에서 일부 기능만 쓰고 나머지 복잡도를 감출 때
- 계층·모듈 경계마다 진입점을 하나로 정해 결합도를 낮출 때
- 서드파티 교체·업그레이드 영향을 퍼사드 한곳에 가두고 싶을 때

## 주의

- 기능을 계속 끌어모으면 모든 것에 의존하는 "갓 오브젝트"가 된다. 용도별로 퍼사드를 나눈다.
- 퍼사드는 호출을 묶을 뿐 새 규칙을 담는 곳이 아니다. 도메인 로직이 쌓이면 서비스·도메인 객체로 옮긴다.
- 퍼사드가 실패 처리(결제 후 배송 실패 시 보상 등)까지 떠안게 되면 트랜잭션·사가 설계 문제로 따로 다룬다.

## 비교

| | 퍼사드 | 어댑터 |
| --- | --- | --- |
| 감싸는 범위 | 여러 객체(서브시스템) | 보통 객체 하나 |
| 인터페이스 | 새로 정의한 단순한 것 | 클라이언트가 이미 기대하는 것 |
| 목적 | 사용을 쉽게 | 호환되게 |

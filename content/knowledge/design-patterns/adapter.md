---
title: 어댑터 패턴
aka: [Adapter Pattern, Wrapper]
category: design-patterns
group: structural
level: beginner
summary: 인터페이스가 맞지 않는 기존 객체를 감싸, 클라이언트가 기대하는 인터페이스로 변환해 주는 구조 패턴.
tags: [gof, oop, integration, legacy]
related: [design-patterns/decorator, design-patterns/facade, design-patterns/proxy, architecture/hexagonal, design-patterns/bridge]
sources:
  - https://refactoring.guru/design-patterns/adapter
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

우리 코드는 `PaymentGateway.charge(amountKrw)` 를 기대하는데, 새로 붙일 외부 SDK 는 `createPayment({ value, currency })` 처럼 이름·단위·형식이 다르다. SDK 를 고칠 수는 없고, 호출부마다 변환 코드를 넣으면 SDK 가 바뀔 때 전부 고쳐야 한다.

## 해법

클라이언트가 쓰는 인터페이스를 구현하면서 내부에서 외부 객체를 호출하고 형식을 바꿔 주는 래퍼(어댑터)를 만든다.

```ts
// 우리 코드가 기대하는 인터페이스
interface PaymentGateway { charge(amountKrw: number): Promise<string> }

// 바꿀 수 없는 외부 SDK
class ForeignPaySdk {
  async createPayment(p: { value: string; currency: string }) {
    return { id: 'pay_123', status: 'ok' };
  }
}

class ForeignPayAdapter implements PaymentGateway {
  constructor(private sdk: ForeignPaySdk) {}
  async charge(amountKrw: number) {
    const res = await this.sdk.createPayment({ value: String(amountKrw), currency: 'KRW' });
    return res.id;
  }
}
```

## 언제 쓰나

- 레거시·서드파티 코드를 우리 인터페이스에 맞춰 재사용할 때
- 외부 의존성 교체 가능성을 열어 둘 때 — 헥사고날 아키텍처의 "어댑터"가 바로 이 역할이다
- 응답 포맷(XML→JSON, 필드명 변환)을 한곳에서 처리할 때

## 주의

- 변환할 대상이 우리 코드라면 어댑터를 덧대기보다 원본을 고치는 편이 단순할 수 있다.
- 어댑터 안에 비즈니스 규칙이 스며들기 쉽다. 형식 변환만 맡긴다.

## 비교

| 패턴 | 인터페이스 | 감싸는 대상 | 목적 |
| --- | --- | --- | --- |
| 어댑터 | **다른** 인터페이스로 바꿈 | 객체 하나 | 호환 |
| 데코레이터 | 같은 인터페이스 유지 | 객체 하나(중첩 가능) | 기능 추가 |
| 프록시 | 같은 인터페이스 유지 | 객체 하나 | 접근 제어·지연 생성·캐시 |
| 퍼사드 | **새로** 단순한 인터페이스 정의 | 서브시스템 전체 | 복잡도 숨김 |

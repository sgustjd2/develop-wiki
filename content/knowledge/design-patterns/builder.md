---
title: 빌더 패턴
aka: [Builder Pattern]
category: design-patterns
group: creational
level: beginner
summary: 선택 항목이 많은 복잡한 객체를 단계별 메서드 호출로 조립하고, 마지막에 완성된 객체를 돌려받는 생성 패턴.
tags: [gof, oop, creation, fluent-api]
related: [design-patterns/factory-method, design-patterns/abstract-factory, design-patterns/prototype]
sources:
  - https://refactoring.guru/design-patterns/builder
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

`new Request(url, 'GET', undefined, undefined, 3000, true)` 처럼 선택 인자가 많은 생성자는 순서를 외워야 하고 읽기도 어렵다. 인자 조합마다 생성자를 늘리면("점층적 생성자") 더 나빠진다. 필수값 검증이 여러 곳에 흩어지기도 쉽다.

## 해법

생성 과정을 단계별 메서드로 나눈 빌더 객체를 두고, `build()` 에서 검증 후 최종 객체를 만든다. 메서드가 `this` 를 돌려주면 체이닝으로 읽기 쉬워진다.

```ts
interface HttpRequest {
  url: string; method: string; headers: Record<string, string>; timeoutMs: number;
}

class RequestBuilder {
  private method = 'GET';
  private headers: Record<string, string> = {};
  private timeoutMs = 5000;
  constructor(private url: string) {}

  post() { this.method = 'POST'; return this; }
  header(k: string, v: string) { this.headers[k] = v; return this; }
  timeout(ms: number) { this.timeoutMs = ms; return this; }

  build(): HttpRequest {
    if (this.timeoutMs <= 0) throw new Error('timeout must be positive');
    return { url: this.url, method: this.method, headers: { ...this.headers }, timeoutMs: this.timeoutMs };
  }
}

const req = new RequestBuilder('/api/orders').post().header('Accept', 'application/json').build();
```

GoF 원형에는 단계 순서를 정하는 **디렉터**(Director)도 있지만, 실무에서는 위처럼 플루언트 빌더만 쓰는 경우가 흔하다.

## 언제 쓰나

- 선택 항목이 많거나 조합이 다양한 객체 (HTTP 요청, 쿼리, 설정, 테스트 데이터)
- 생성 중간 상태를 외부에 노출하지 않고, 완성·검증된 객체만 내보내고 싶을 때
- 같은 조립 절차로 다른 표현(예: SQL 문자열 / 쿼리 객체)을 만들 때

## 주의

- 필드가 몇 개 안 되면 TypeScript 에서는 **옵션 객체 인자**(`new Request({ url, timeoutMs })`)가 더 단순하다.
- 빌더와 제품 클래스를 함께 유지해야 하므로 코드량이 늘어난다.
- 빌더를 재사용하면 이전 호출의 값이 남는다. 재사용할 거면 `reset()` 을 두거나 매번 새 빌더를 만든다.
- `build()` 가 내부 상태를 그대로 넘기면 이후 빌더 변경이 이미 만든 객체에 번진다. 복사본을 돌려준다.

## 비교

| 패턴 | 결과물을 돌려주는 시점 |
| --- | --- |
| 빌더 | 여러 단계를 거친 뒤 `build()` 에서 |
| 팩토리 메서드·추상 팩토리 | 호출 한 번에 즉시 |

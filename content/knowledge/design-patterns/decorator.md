---
title: 데코레이터 패턴
aka: [Decorator Pattern, Wrapper]
category: design-patterns
group: structural
level: intermediate
summary: 같은 인터페이스를 구현한 래퍼로 객체를 감싸, 원본을 고치지 않고 실행 중에 기능을 덧붙이는 구조 패턴.
tags: [gof, oop, composition]
related: [design-patterns/adapter, design-patterns/facade, design-patterns/proxy, principles/solid]
sources:
  - https://refactoring.guru/design-patterns/decorator
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

HTTP 클라이언트에 로깅, 재시도, 캐시를 붙이고 싶다. 상속으로 풀면 `LoggingClient`, `RetryingClient`, `LoggingRetryingClient` … 조합마다 하위 클래스가 생긴다. 어떤 기능을 켤지는 실행 환경에 따라 달라지기도 한다.

## 해법

원본과 같은 인터페이스를 구현하는 래퍼가 내부 객체에 일을 위임하면서 앞뒤에 기능을 더한다. 래퍼도 같은 인터페이스라 다른 래퍼로 다시 감쌀 수 있다.

```ts
interface Fetcher { get(url: string): Promise<string> }

class HttpFetcher implements Fetcher {
  async get(url: string) { return (await fetch(url)).text(); }
}

class Logging implements Fetcher {
  constructor(private inner: Fetcher) {}
  async get(url: string) {
    console.time(url);
    try { return await this.inner.get(url); } finally { console.timeEnd(url); }
  }
}

class Retry implements Fetcher {
  constructor(private inner: Fetcher, private times = 3) {}
  async get(url: string): Promise<string> {
    for (let i = 1; ; i++) {
      try { return await this.inner.get(url); } catch (e) { if (i >= this.times) throw e; }
    }
  }
}

const fetcher: Fetcher = new Logging(new Retry(new HttpFetcher()));
```

Express·Koa 미들웨어, 함수를 받아 함수를 돌려주는 고차 함수도 같은 발상이다. TypeScript 의 `@decorator` 문법은 이름만 같고 별개의 언어 기능이다.

## 언제 쓰나

- 기능을 조합해서 켜고 끄고 싶을 때 (로깅, 캐시, 재시도, 권한 검사, 압축)
- 상속할 수 없거나(외부 클래스) 상속 조합이 폭발할 때

## 주의

- 감싸는 **순서**가 결과에 영향을 준다. 위 예에서 `Retry(Logging(...))` 이면 시도마다 로그가 남는다.
- 겹겹이 감싼 중간 층 하나만 빼기 어렵고, 스택 트레이스·디버깅이 길어진다.
- 인터페이스 메서드가 많으면 위임 코드가 반복된다. 인터페이스를 작게 유지한다.

## 비교

| | 데코레이터 | 프록시 | 어댑터 |
| --- | --- | --- | --- |
| 인터페이스 | 같음(또는 확장) | 같음 | 바뀜 |
| 의도 | 기능 추가 | 접근 제어·지연 생성·캐시 | 호환 |
| 조합 | 클라이언트가 여러 겹 쌓음 | 보통 한 겹, 대상의 생명주기를 프록시가 관리 | 한 겹 |

구조가 거의 같아 코드만 보고 구분하기 어렵다. **왜 감쌌는지**로 이름을 붙인다.

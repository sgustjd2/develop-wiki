---
title: 싱글턴 패턴
aka: [Singleton Pattern]
category: design-patterns
group: creational
level: beginner
summary: 클래스의 인스턴스가 하나만 존재하도록 보장하고 그 인스턴스에 전역 접근점을 주는 생성 패턴. 숨은 전역 상태와 테스트 어려움 때문에 대안을 먼저 검토한다.
tags: [gof, oop, global-state, anti-pattern, dependency-injection]
related: [design-patterns/facade, design-patterns/abstract-factory, principles/solid, principles/coupling-and-cohesion, design-patterns/flyweight, design-patterns/prototype, design-patterns/service-locator-vs-dependency-injection, design-patterns/object-pool]
sources:
  - https://refactoring.guru/design-patterns/singleton
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

DB 커넥션 풀, 설정, 로거처럼 **하나만 있어야 하는** 공유 자원이 있다. 생성자를 여러 곳에서 부르면 풀이 여러 개 생겨 연결이 고갈된다. 동시에 어디서든 이 객체에 접근하고 싶다.

싱글턴은 이 두 문제(인스턴스 하나 보장 + 전역 접근)를 한꺼번에 푼다. 그리고 바로 그 점이 단점의 출발점이다.

## 해법

생성자를 막고, 정적 메서드가 처음 요청 때 인스턴스를 만들어 이후 같은 것을 돌려준다.

```ts
class Config {
  private static instance?: Config;
  private constructor(readonly values: Record<string, string>) {}
  static get(): Config {
    return (this.instance ??= new Config({ ...process.env } as Record<string, string>));
  }
}
Config.get().values.DB_URL;
```

TypeScript/JavaScript 에서는 **ES 모듈이 한 번만 평가**되므로 모듈 최상위에서 만든 객체를 export 하는 것이 사실상 싱글턴이다.

```ts
// db.ts
export const pool = createPool({ max: 10 });   // 프로세스(모듈 그래프) 안에서 하나
```

### 권장 대안: 하나만 만들고 주입하기

```ts
// 조립 지점(main)에서 한 번 만들고, 필요한 곳에 넘긴다
const pool = createPool({ max: 10 });
const orders = new OrderRepository(pool);
const users = new UserRepository(pool);
```

"하나만 있음"은 조립 코드가 보장하고, 각 클래스는 전역을 모른다. DI 컨테이너의 "싱글턴 스코프"도 같은 생각이다.

## 언제 쓰나

- 하드웨어·프로세스 수준에서 정말 하나뿐인 자원에 대한 얇은 진입점
- 상태가 없거나 읽기 전용인 객체(설정 스냅샷, 정적 레지스트리)
- 그 외 대부분은 "인스턴스 하나 + 의존성 주입"으로 충분하다.

## 주의 (단점)

- **단일 책임 원칙 위반**: 자기 역할에 더해 생성·수명 관리까지 맡는다.
- **숨은 전역 상태**: 시그니처에 의존성이 드러나지 않아, 어떤 코드가 무엇에 의존하는지 보이지 않는다. 결합이 숨는다.
- **테스트가 어렵다**: 정적 접근이라 목으로 바꾸기 어렵고, 테스트 간 상태가 새어 순서 의존 테스트가 생긴다.
- **동시성**: 멀티스레드 언어(Java, C# 등)에서는 지연 초기화 시 인스턴스가 둘 생기지 않도록 동기화가 필요하다.
- **"하나"의 범위가 생각과 다를 수 있다**: 번들러가 같은 모듈을 두 번 포함하거나, 서버 인스턴스가 여러 대거나, 서버리스 함수가 재사용·재시작되면 인스턴스가 여럿이다. 클러스터 전체에서 하나여야 한다면 싱글턴이 아니라 분산 락·리더 선출 문제다.
- 서버 렌더링(SSR)에서 요청별 데이터를 모듈 싱글턴에 담으면 **다른 사용자의 데이터가 섞인다**.

## 비교

| | 싱글턴 | 전역 변수 | DI 싱글턴 스코프 | 플라이웨이트 |
| --- | --- | --- | --- | --- |
| 인스턴스 수 | 1 | 1 (덮어쓰기 가능) | 컨테이너당 1 | 내부 상태별로 여러 개 |
| 의존성 노출 | 숨음 | 숨음 | 생성자에 드러남 | — |
| 테스트 교체 | 어려움 | 어려움 | 쉬움 | — |
| 가변성 | 가변 가능 | 가변 | 가변 가능 | 불변 |

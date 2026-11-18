---
title: 책임 연쇄 패턴
aka: [Chain of Responsibility, CoR, Middleware Pipeline]
category: design-patterns
group: behavioral
level: intermediate
summary: 요청을 처리기 사슬에 따라 넘기며 각 처리기가 직접 처리하거나 다음으로 넘기게 해, 보내는 쪽과 처리하는 쪽의 결합을 끊는 행위 패턴.
tags: [gof, oop, middleware, pipeline]
related: [design-patterns/decorator, design-patterns/command, design-patterns/mediator, principles/solid]
sources:
  - https://refactoring.guru/design-patterns/chain-of-responsibility
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

API 핸들러 앞에 인증, 권한, 요청 크기 제한, 속도 제한, 캐시 확인이 줄줄이 `if` 로 붙어 있다. 검사를 하나 추가하거나 순서를 바꾸려면 핸들러를 고쳐야 하고, 다른 엔드포인트에 같은 조합을 재사용할 수 없다.

## 해법

각 검사를 같은 인터페이스의 **처리기**로 만들고 사슬로 잇는다. 처리기는 요청을 처리해 끝내거나(short-circuit) 다음 처리기에 넘긴다.

```ts
type Req = { user?: string; path: string; body: string };
type Res = { status: number; body: string };
type Handler = (req: Req, next: () => Promise<Res>) => Promise<Res>;

const auth: Handler = async (req, next) =>
  req.user ? next() : { status: 401, body: 'login required' };

const sizeLimit: Handler = async (req, next) =>
  req.body.length > 1_000_000 ? { status: 413, body: 'too large' } : next();

function chain(handlers: Handler[], final: (req: Req) => Promise<Res>) {
  return (req: Req): Promise<Res> => {
    const run = (i: number): Promise<Res> =>
      i < handlers.length ? handlers[i](req, () => run(i + 1)) : final(req);
    return run(0);
  };
}

const handle = chain([auth, sizeLimit], async () => ({ status: 200, body: 'ok' }));
```

Express·Koa 미들웨어, DOM 이벤트 버블링, 로깅 레벨 처리기가 이 패턴의 변형이다.

## 언제 쓰나

- 요청 종류와 처리 순서를 미리 고정할 수 없고, 처리기 집합·순서를 설정이나 런타임에 바꾸고 싶을 때
- 여러 처리기를 정해진 순서로 거쳐야 할 때 (검증 파이프라인, 승인 단계: 팀장 → 부서장 → 임원)

## 주의

- **아무도 처리하지 않을 수 있다.** 사슬 끝에 기본 처리기(404, 기본값)를 둔다.
- 순서 의존성이 숨는다. 인증보다 캐시가 먼저 오면 권한 없는 응답이 캐시될 수 있다. 사슬 구성을 한곳에서 선언한다.
- 사슬이 길면 요청이 어디서 멈췄는지 디버깅하기 어렵다. 처리기별 로그·트레이스를 남긴다.
- 처리기가 2~3개로 고정이면 그냥 함수 호출 순서로 충분하다.

## 비교

| | 책임 연쇄 | 데코레이터 | 커맨드 |
| --- | --- | --- | --- |
| 구조 | 재귀적 연결 | 재귀적 감싸기 | 요청을 객체로 |
| 흐름을 멈출 수 있나 | 예 (중간 처리기가 끝냄) | 아니오 (항상 안쪽 호출, 기능만 추가) | 해당 없음 |
| 수신자 | 사슬 중 하나 또는 여럿, 동적 | 감싼 대상 하나 | 정해진 수신자 하나 |
| 조합 | 처리기를 커맨드로 구현하거나 요청 자체를 커맨드로 넘길 수 있음 | | |

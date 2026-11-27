---
name: Elysia
url: https://elysiajs.com
repo: https://github.com/elysiajs/elysia
stars: 19421
docs: https://elysiajs.com/at-glance
domain: backend
category: web-framework
description: Bun 에 최적화된 TypeScript 웹 프레임워크. 스키마 하나로 검증·타입 추론·OpenAPI 를 얻고 Eden 으로 종단 간 타입 안전성을 제공한다.
pricing: oss
tags: [bun, typebox, end-to-end-types, web-standard]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Elysia 는 Bun 을 주 대상으로 하는 TypeScript 프레임워크다. 라우트에 붙인 스키마(기본 TypeBox 기반 `t`)가 런타임 검증과 TypeScript 타입, OpenAPI 문서의 단일 원천이 되고, Eden Treaty 클라이언트가 서버 타입을 그대로 가져가 tRPC 와 비슷한 종단 간 타입 안전성을 준다. Web Standard `Request`/`Response` 를 쓰므로 Node(어댑터), Deno, Cloudflare Workers 에서도 돌린다.

현재 안정판 1.4.32(2026-11-11)이며 Elysia 2 는 npm 에서 `2.0.0-rc.3` 등 프리릴리스 단계다(AOT 컴파일 중심 재작성). [Hono](/develop-wiki/backend/web-framework/hono/), [Fastify](/develop-wiki/backend/web-framework/fastify/) 가 비교 대상이다.

## 설치
```bash
bun create elysia app          # 새 프로젝트
bun add elysia                 # 기존 프로젝트
bun run --watch src/index.ts   # 개발 실행
```
Node 에서는 `@elysia/node` 어댑터와 `tsx` 를 추가한다(공식 문서의 Node 탭 기준).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `new Elysia()` | 앱/플러그인 인스턴스. 메서드 체이닝으로 타입이 누적된다 |
| 라우트 스키마 | 세 번째 인자 `{ params, query, body, response }` 에 `t.*` 지정 |
| Context | `({ params, query, body, status, set })` 구조 분해 |
| 라이프사이클 훅 | `onTransform`, `onBeforeHandle`, `onAfterHandle`, `onError` 등 |
| `derive` / `resolve` | 요청마다 컨텍스트에 값을 추가(`resolve` 는 검증 후) |
| 플러그인 | Elysia 인스턴스를 `.use()` 로 합성. cors, openapi, bearer 등 공식 플러그인 |
| Eden Treaty | `treaty<typeof app>()` 로 타입 안전한 API 클라이언트 |
| Standard Schema | Zod 등 Standard Schema 라이브러리도 스키마로 사용 가능 |

## 기본 사용법
```ts
import { Elysia, t } from 'elysia'

const todos = new Map<number, { title: string; done: boolean }>()

new Elysia()
  .get(
    '/todos/:id',
    ({ params: { id }, status }) => todos.get(id) ?? status(404, 'not found'),
    { params: t.Object({ id: t.Numeric() }) }
  )
  .post(
    '/todos',
    ({ body, status }) => {
      const id = todos.size + 1
      todos.set(id, { title: body.title, done: body.done ?? false })
      return status(201, { id })
    },
    { body: t.Object({ title: t.String({ minLength: 1 }), done: t.Optional(t.Boolean()) }) }
  )
  .listen(3000)
```
스키마에 맞지 않는 요청은 핸들러 전에 거부되고(422), `t.Numeric()` 은 문자열 경로 값을 숫자로 변환한다.

## 자주 쓰는 패턴
- **플러그인 분리**: `new Elysia({ prefix: '/todos' })` 를 만들어 `app.use(todoRoutes)` 로 합친다.
- **인증**: `.derive(({ headers }) => ({ token: headers.authorization }))` 또는 `onBeforeHandle` 에서 `status(401)` 반환.
- **DB**: 공식 문서에 [Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/), [Prisma](/develop-wiki/backend/orm-query/prisma/) 통합 가이드가 있다.
- **OpenAPI**: 스키마에서 문서를 생성하는 공식 플러그인이 있다(`patterns/openapi`).
- **테스트**: `app.handle(new Request('http://localhost/'))` 가 `Response` 를 돌려주므로 `bun:test` 로 서버 없이 검증한다. 요청은 전체 URL 이어야 한다. Eden Treaty 로 타입 안전한 테스트도 가능하다.

## 언제 쓰나 / 피할 때
- 쓸 때: Bun 기반 API, 스키마 하나로 검증·타입·문서를 묶고 프런트엔드와 타입을 공유하려는 TypeScript 풀스택.
- 피할 때(대안): Node 중심 대규모 생태계는 [Fastify](/develop-wiki/backend/web-framework/fastify/)·[NestJS](/develop-wiki/backend/web-framework/nestjs/), 런타임 중립 경량은 [Hono](/develop-wiki/backend/web-framework/hono/). 미해결 이슈가 400건대이고 2.0 전환이 진행 중이라 업그레이드 전 변경점을 확인한다.

## 공식 문서
- [At a glance](https://elysiajs.com/at-glance) · [Validation](https://elysiajs.com/essential/validation) · [Life cycle](https://elysiajs.com/essential/life-cycle) · [Unit test](https://elysiajs.com/patterns/unit-test) · [Eden](https://elysiajs.com/eden/overview)

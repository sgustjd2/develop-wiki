---
name: Fastify
url: https://fastify.dev
docs: https://fastify.dev/docs/latest/
repo: https://github.com/fastify/fastify
stars: 37437
domain: backend
category: web-framework
description: JSON Schema 기반 검증·직렬화와 캡슐화된 플러그인 구조를 가진 Node.js 웹 프레임워크. 오버헤드가 낮은 HTTP API 서버를 만들 때 쓴다.
pricing: oss
tags: [nodejs, json-schema, plugins, rest]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Fastify 는 OpenJS Foundation 산하의 Node.js 웹 프레임워크다. 라우트마다 JSON Schema 를 선언하면 요청 검증(Ajv)과 응답 직렬화(fast-json-stringify)를 미리 컴파일해 처리하고, 기능은 모두 플러그인(`register`)으로 붙인다. 플러그인은 기본적으로 자기 스코프 안에 캡슐화되며, 상위로 노출하려면 `fastify-plugin` 으로 감싼다. 로거로 pino 가 내장돼 있다.

현재 메이저는 v5(2024-09 출시, 최신 v5.12.x)이며 공식 LTS 문서 기준 Node.js 20·22 를 지원한다. v4 는 2025-06-30 에 LTS 가 끝났다. [NestJS](/develop-wiki/backend/web-framework/nestjs/) 의 HTTP 어댑터로도 쓰인다.

## 설치
```bash
npm init -y
npm i fastify
node server.js           # 또는 TypeScript 는 tsx/tsc 로 실행
```
프로젝트 골격이 필요하면 `npm init fastify` (fastify-cli) 로 플러그인·라우트 디렉터리 구조를 생성할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 인스턴스 | `Fastify({ logger: true })`. 라우트·훅·데코레이터를 소유한다 |
| 라우트 스키마 | `schema: { body, querystring, params, headers, response }` 를 JSON Schema 로 선언 |
| 플러그인 | `fastify.register(fn, opts)`. 등록 순서대로 로드되고 각자 캡슐화된 컨텍스트를 갖는다 |
| `fastify-plugin` | 캡슐화를 풀어 데코레이터·훅을 상위 스코프에 공유할 때 쓴다 |
| 데코레이터 | `decorate`·`decorateRequest`·`decorateReply` 로 인스턴스·요청에 속성 추가(DB 클라이언트 등) |
| 훅 | `onRequest` → `preParsing` → `preValidation` → `preHandler` → `onSend` → `onResponse` 순 생명주기 |
| Type Provider | `@fastify/type-provider-typebox`·`json-schema-to-ts` 등으로 스키마에서 TS 타입 추론 |

## 기본 사용법
```js
import Fastify from 'fastify'

const app = Fastify({ logger: true })
const todos = new Map()

app.get('/todos/:id', async (req, reply) => {
  const todo = todos.get(Number(req.params.id))
  if (!todo) return reply.code(404).send({ error: 'not found' })
  return todo
})

app.post('/todos', {
  schema: {
    body: {
      type: 'object',
      required: ['title'],
      properties: { title: { type: 'string', minLength: 1 } },
    },
  },
}, async (req, reply) => {
  const todo = { id: todos.size + 1, title: req.body.title }
  todos.set(todo.id, todo)
  return reply.code(201).send(todo)
})

await app.listen({ port: 3000 })
```
본문이 스키마와 맞지 않으면 핸들러가 실행되기 전에 400 응답이 나간다. `async` 핸들러는 값을 반환하면 그대로 응답이 된다.

## 자주 쓰는 패턴
- **라우트 모듈화**: 라우트 묶음을 `export default async function (fastify, opts) { ... }` 플러그인으로 만들고 `app.register(todoRoutes, { prefix: '/todos' })` 로 붙인다. `@fastify/autoload` 로 디렉터리 단위 자동 등록도 한다.
- **공통 처리(미들웨어 대신 훅)**: 인증은 `app.addHook('onRequest', async (req) => { ... })` 또는 라우트의 `preHandler` 로 건다. CORS·헬멧·레이트 리밋은 `@fastify/cors`·`@fastify/helmet`·`@fastify/rate-limit` 공식 플러그인을 쓴다.
- **응답 스키마**: `response: { 200: {...} }` 를 선언하면 직렬화가 빨라지고 스키마에 없는 필드는 응답에서 빠진다(민감 정보 노출 방지).
- **DB 연동**: `@fastify/postgres` 같은 공식 플러그인이나 직접 만든 플러그인에서 `fastify.decorate('db', pool)` 하고 `fastify-plugin` 으로 감싸 전체에서 `app.db` 로 쓴다. 종료 정리는 `onClose` 훅. ORM 은 [Prisma](/develop-wiki/backend/orm-query/prisma/)·[Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/) 을 같은 방식으로 주입한다.
- **테스트**: 서버를 띄우지 않고 `inject()` 로 요청을 흉내 낸다. 공식 가이드는 `node:test` 를 쓴다.
  ```js
  const res = await app.inject({ method: 'POST', url: '/todos', payload: { title: 'a' } })
  assert.strictEqual(res.statusCode, 201)
  assert.deepStrictEqual(res.json(), { id: 1, title: 'a' })
  ```
  앱 생성을 `build()` 함수로 분리해 두면 테스트마다 새 인스턴스를 만들고 `app.close()` 로 정리할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Node.js 로 만드는 JSON API 에서 요청 검증과 응답 형태를 스키마로 고정하고 싶을 때, 프레임워크 오버헤드를 줄이고 싶을 때, 플러그인 단위로 기능을 나눠 관리할 때.
- 피할 때(대안): Express 미들웨어 생태계를 그대로 써야 하면 [Express](/develop-wiki/backend/web-framework/express/)(`@fastify/express` 호환 계층도 있음), Cloudflare Workers·Bun 등 여러 런타임 배포는 [Hono](/develop-wiki/backend/web-framework/hono/), 계층 구조·DI 가 필요하면 [NestJS](/develop-wiki/backend/web-framework/nestjs/).

## 공식 문서
- [Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/) · [Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) · [Plugins](https://fastify.dev/docs/latest/Reference/Plugins/) · [Hooks](https://fastify.dev/docs/latest/Reference/Hooks/) · [Testing](https://fastify.dev/docs/latest/Guides/Testing/) · [LTS](https://fastify.dev/docs/latest/Reference/LTS/)

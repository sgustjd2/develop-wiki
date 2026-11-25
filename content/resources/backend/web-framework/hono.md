---
name: Hono
url: https://hono.dev
repo: https://github.com/honojs/hono
stars: 33075
docs: https://hono.dev/docs/
domain: backend
category: web-framework
description: Web 표준 기반의 가벼운 웹 프레임워크. Node, Bun, Deno, 엣지 런타임에서 그대로 돈다.
pricing: oss
tags: [typescript, edge]
languages: [typescript]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hono 는 Web 표준 `Request`/`Response` 와 Fetch API 위에 만든 작은 라우팅·미들웨어 프레임워크다. 같은 코드를 Node.js, Bun, Deno, Cloudflare Workers 같은 엣지 런타임에서 실행할 수 있고, 런타임별 차이는 진입점(export·serve) 정도로 줄어든다. TypeScript 타입 추론이 강해서 라우트·검증 스키마의 타입이 핸들러와 RPC 클라이언트까지 이어진다.

[Express](/develop-wiki/backend/web-framework/express/) 가 Node 전용 `req`/`res` 모델이라면, Hono 는 여러 런타임을 겨냥한 Web 표준 모델이라는 점이 다르다.

## 설치
```bash
npm create hono@latest my-app   # 템플릿(nodejs, bun, cloudflare-workers 등) 선택
cd my-app && npm i && npm run dev
```
기존 Node 프로젝트에 추가할 때는 어댑터를 함께 설치한다.
```bash
npm i hono @hono/node-server
```
`@hono/node-server` 2.x 는 Node.js 20 이상이 필요하다(공식 Node.js 페이지에는 아직 18.14.1+ 로 적혀 있다).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Hono` 인스턴스 | 라우트와 미들웨어를 등록하는 앱 객체. `app.fetch` 가 Web 표준 핸들러다 |
| Context (`c`) | 요청 정보(`c.req`)와 응답 헬퍼(`c.json`, `c.text`, `c.html`)를 담은 객체 |
| 미들웨어 | `async (c, next) => {}` 형태. `await next()` 앞뒤로 전·후처리를 넣는다 |
| 변수 | `c.set()` 으로 넣고 `c.var`/`c.get()` 으로 읽는다. 제네릭 `Variables` 로 타입 지정 |
| Validator | `zValidator`, `sValidator` 등으로 json·query·form·param 을 검증하고 `c.req.valid()` 로 꺼낸다 |
| 어댑터 | `@hono/node-server` 의 `serve()`, Workers/Bun/Deno 는 `export default app` |
| RPC | 서버 라우트 타입을 `hc` 클라이언트가 그대로 사용해 타입 안전한 호출을 만든다 |

## 기본 사용법
GET·POST 라우트 하나씩을 가진 Node 서버.
```ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
const todos: { id: number; title: string }[] = []

app.get('/todos/:id', (c) => {
  const todo = todos.find((t) => t.id === Number(c.req.param('id')))
  return todo ? c.json(todo) : c.json({ error: 'not found' }, 404)
})

app.post('/todos', async (c) => {
  const { title } = await c.req.json<{ title: string }>()
  const todo = { id: todos.length + 1, title }
  todos.push(todo)
  return c.json(todo, 201)
})

serve({ fetch: app.fetch, port: 3000 })
```
Cloudflare Workers·Bun 에서는 마지막 줄 대신 `export default app` 을 쓴다.

## 자주 쓰는 패턴
- **라우트 분리**: 기능별로 `new Hono()` 를 만들고 `app.route('/users', users)` 로 붙인다. `app.basePath('/api')` 로 공통 접두사를 둔다.
- **내장 미들웨어**: `hono/logger`, `hono/cors`, `hono/jwt`, `hono/basic-auth`, `hono/etag` 등을 `app.use('/api/*', cors())` 처럼 경로 단위로 건다.
- **커스텀 미들웨어**: 타입이 필요한 값은 `createMiddleware` 로 만든다.
  ```ts
  import { createMiddleware } from 'hono/factory'
  type Env = { Variables: { requestId: string } }
  const reqId = createMiddleware<Env>(async (c, next) => {
    c.set('requestId', crypto.randomUUID())
    await next()
  })
  ```
- **검증**: `zod` + `@hono/zod-validator` 조합이 흔하다. Standard Schema 를 지원하는 라이브러리(Valibot, ArkType 등)는 `@hono/standard-validator` 의 `sValidator` 로 쓴다.
  ```ts
  import * as z from 'zod'
  import { zValidator } from '@hono/zod-validator'
  app.post('/todos', zValidator('json', z.object({ title: z.string().min(1) })), (c) => {
    const { title } = c.req.valid('json')
    return c.json({ title }, 201)
  })
  ```
- **DB 연동**: 핸들러 안에서 ORM 을 직접 호출한다. 엣지 런타임에서도 도는 [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/) 과 자주 묶인다.
- **테스트**: 서버를 띄우지 않고 `app.request()` 로 호출한다. JSON 본문을 보낼 때는 `Content-Type` 헤더를 꼭 넣어야 검증기가 본문을 읽는다.
  ```ts
  const res = await app.request('/todos', {
    method: 'POST',
    body: JSON.stringify({ title: 'a' }),
    headers: { 'Content-Type': 'application/json' },
  })
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: Cloudflare Workers·Deno·Bun 같은 엣지·멀티 런타임 배포, 작고 빠른 JSON API, 프론트엔드와 타입을 공유하는 TypeScript 풀스택.
- 피할 때(대안): Node 전용 미들웨어 생태계(Passport 등)에 크게 기대는 기존 서비스는 [Express](/develop-wiki/backend/web-framework/express/), DI·모듈 구조가 강한 대형 Node 서버는 NestJS 같은 구조화된 프레임워크가 맞다.

## 공식 문서
- [시작하기](https://hono.dev/docs/getting-started/basic) · [Node.js 어댑터](https://hono.dev/docs/getting-started/nodejs) · [미들웨어 가이드](https://hono.dev/docs/guides/middleware) · [검증](https://hono.dev/docs/guides/validation) · [테스트](https://hono.dev/docs/guides/testing)

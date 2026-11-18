---
name: Express
url: https://expressjs.com
repo: https://github.com/expressjs/express
stars: 69661
docs: https://expressjs.com/en/5x/api.html
domain: backend
category: web-framework
description: Node.js용 미들웨어 기반 HTTP 서버 프레임워크. 생태계의 미들웨어를 조합해 REST API나 웹 서버를 직접 구성할 때 쓴다.
pricing: oss
tags: [nodejs, middleware, rest]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Express 는 Node.js `http` 서버 위에 라우팅과 미들웨어 체인을 얹은 최소 프레임워크다. 요청은 등록 순서대로 미들웨어 함수 `(req, res, next)` 를 통과하고, 인증·로깅·본문 파싱 같은 기능은 대부분 별도 미들웨어 패키지로 조합한다. 현재 메이저는 **Express 5** 로, async 핸들러의 에러 전달과 경로 문법이 4.x 와 달라졌다.

구조를 강제하지 않는 대신 설계 결정을 직접 해야 한다. 여러 런타임을 노린다면 [Hono](/develop-wiki/backend/web-framework/hono/) 가 대안이다.

## 설치
```bash
npm init -y
npm install express
# TypeScript 를 쓸 때
npm install --save-dev typescript @types/express @types/node
```
Express 5 는 Node.js 18 이상이 필요하다. Node 22.18+ 에서는 `node src/app.ts` 로 타입을 지운 채 바로 실행할 수 있지만 타입 검사는 `npx tsc` 로 따로 한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `app` | `express()` 로 만든 애플리케이션. 라우트·미들웨어·설정을 보관 |
| 미들웨어 | `(req, res, next)` 함수. `next()` 로 다음 단계로 넘기거나 응답을 끝낸다 |
| 에러 미들웨어 | 인자가 4개인 `(err, req, res, next)`. 마지막에 등록한다 |
| `express.Router` | 라우트 묶음을 모듈로 분리하고 `app.use('/prefix', router)` 로 마운트 |
| 본문 파서 | `express.json()`, `express.urlencoded()`. 등록하지 않으면 `req.body` 는 `undefined` |
| 경로 문법(v5) | `:id` 파라미터, 이름 있는 와일드카드 `/*splat`, 선택 구간 `/:file{.:ext}` |
| async 에러(v5) | 핸들러가 reject 한 Promise 는 자동으로 에러 미들웨어로 전달된다 |

## 기본 사용법
```js
import express from 'express'

const app = express()
app.use(express.json())

const todos = []

app.get('/todos/:id', (req, res) => {
  const todo = todos.find((t) => t.id === Number(req.params.id))
  if (!todo) return res.status(404).json({ error: 'not found' })
  res.json(todo)
})

app.post('/todos', async (req, res) => {
  const todo = { id: todos.length + 1, title: req.body.title }
  todos.push(todo)
  res.status(201).json(todo)
})

app.listen(3000, () => console.log('listening on 3000'))
```
`package.json` 에 `"type": "module"` 을 두면 위 ESM 문법이 그대로 동작한다.

## 자주 쓰는 패턴
- **라우터 분리**: `const users = express.Router()` 에 라우트를 등록하고 `app.use('/users', users)` 로 붙인다.
- **에러 처리**: v5 에서는 async 핸들러에서 `throw` 하거나 reject 되면 그대로 에러 미들웨어로 간다. `try/catch` + `next(err)` 보일러플레이트가 필요 없다.
  ```js
  app.use((err, req, res, next) => {
    res.status(err.status ?? 500).json({ error: err.message })
  })
  ```
- **검증**: 내장 검증기가 없다. Zod 같은 스키마 라이브러리로 `schema.parse(req.body)` 를 호출하는 미들웨어를 직접 만들거나 커뮤니티 미들웨어를 쓴다.
- **보안·공통 미들웨어**: CORS(`cors`), 보안 헤더(`helmet`), 로깅(`morgan`) 등은 별도 패키지다.
- **DB 연동**: 앱 시작 시 커넥션 풀을 만들고 핸들러에서 사용한다. TypeScript 라면 [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/) + [PostgreSQL](/develop-wiki/backend/database/postgresql/) 조합이 흔하다.
- **테스트**: `app.listen` 을 분리해 `app` 만 export 하고, `supertest` 같은 HTTP 테스트 라이브러리로 `request(app).post('/todos')` 를 호출한다.

## Express 4 → 5 주의점
- `app.get('/*', ...)` 처럼 이름 없는 와일드카드는 오류다. `/*splat` 또는 루트까지 포함하는 `/{*splat}` 을 쓴다.
- `?` 선택 파라미터 대신 중괄호 `{}` 를 쓰고, 정규식 문자는 경로 문자열에서 지원하지 않는다.
- `res.send(status)`, `res.json(obj, status)`, `app.del()`, `req.param()` 등은 제거됐다. `res.status(n).json(obj)`, `res.sendStatus(n)` 을 쓴다.
- `express.urlencoded()` 의 `extended` 기본값이 `false` 로 바뀌었고, `req.query` 는 기본 "simple" 파서를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Node.js 에서 단순한 REST API·웹 서버, 방대한 Express 미들웨어 생태계를 활용할 때, 팀이 이미 익숙할 때.
- 피할 때(대안): 엣지 런타임·Bun·Deno 를 함께 노린다면 [Hono](/develop-wiki/backend/web-framework/hono/), 스키마 기반 검증·직렬화가 내장된 고성능 서버가 필요하면 Fastify, 대규모 모듈 구조가 필요하면 NestJS.

## 공식 문서
- [설치](https://expressjs.com/en/starter/installing.html) · [라우팅 가이드](https://expressjs.com/en/guide/routing.html) · [미들웨어 작성](https://expressjs.com/en/guide/writing-middleware.html) · [5.x API 레퍼런스](https://expressjs.com/en/5x/api.html) · [v5 마이그레이션](https://expressjs.com/en/guide/migrating-5.html)

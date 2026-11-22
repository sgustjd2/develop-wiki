---
name: tRPC
url: https://trpc.io
docs: https://trpc.io/docs
repo: https://github.com/trpc/trpc
stars: 40850
domain: backend
category: api
description: 스키마나 코드 생성 없이 서버 라우터의 TypeScript 타입을 클라이언트가 그대로 가져다 쓰는 RPC 라이브러리. 같은 저장소의 TS 풀스택 앱에 쓴다.
pricing: oss
tags: [typescript, rpc, type-safety, fullstack]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
tRPC 는 서버에 정의한 프로시저(라우터)의 **타입만** 클라이언트에 import 해 호출 시 입력·출력 타입을 자동으로 맞추는 TypeScript RPC 라이브러리다. OpenAPI·GraphQL 같은 별도 스키마나 코드 생성 단계가 없고, 서버 코드를 바꾸면 클라이언트 쪽에서 즉시 타입 오류가 난다. 입력 검증은 Zod·Valibot 같은 Standard Schema 호환 검증기로 한다.

2026-11 기준 최신은 **v11**(11.29.x). TypeScript 5.7.2 이상, `strict` 모드를 권장한다. 서버는 독립 HTTP 서버, Express·Fastify 어댑터, Fetch 어댑터(Next.js, Hono, Workers 등)로 띄우고, React 에서는 TanStack Query 통합을 쓴다.

## 설치
```bash
npm install @trpc/server @trpc/client zod
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `initTRPC` | 프로젝트당 한 번 초기화. `t.router`, `t.procedure` 를 꺼내 쓴다 |
| 프로시저 | `query`(읽기), `mutation`(쓰기), `subscription`(SSE·WebSocket 스트림) |
| `.input()` | 검증 스키마. 통과한 값이 `input` 의 타입이 된다 |
| 컨텍스트 | 요청마다 만드는 객체(DB, 사용자). `createContext` 에서 생성 |
| 미들웨어 | `t.procedure.use(...)` 로 인증 등 공통 로직. `protectedProcedure` 패턴 |
| 링크 | 클라이언트 전송 방식. `httpBatchLink` 는 여러 호출을 한 요청으로 묶는다 |
| `AppRouter` 타입 | 서버 라우터 타입을 `export type` 으로 내보내 클라이언트가 import |

## 기본 사용법
```ts
// server.ts
import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { z } from 'zod'

const t = initTRPC.create()
const todos: { id: number; title: string }[] = []

const appRouter = t.router({
  todoList: t.procedure.query(() => todos),
  todoCreate: t.procedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(({ input }) => {
      const todo = { id: todos.length + 1, title: input.title }
      todos.push(todo)
      return todo
    }),
})
export type AppRouter = typeof appRouter

createHTTPServer({ router: appRouter }).listen(3000)
```
```ts
// client.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './server'

const trpc = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: 'http://localhost:3000' })] })
const created = await trpc.todoCreate.mutate({ title: 'write docs' })  // { id: number; title: string }
console.log(await trpc.todoList.query())
```

## 자주 쓰는 패턴
- **인증 미들웨어**: 컨텍스트에 세션을 넣고 `const protectedProcedure = t.procedure.use(({ ctx, next }) => { if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' }); return next({ ctx: { user: ctx.user } }) })`.
- **모노레포 공유**: 서버 패키지에서 `AppRouter` 타입만 export 하고 웹 앱은 `import type` 으로 가져와 런타임 의존성을 만들지 않는다.
- **직렬화**: `superjson` 트랜스포머로 `Date`, `Map` 등을 보존한다.
- **DB 연동**: 컨텍스트에 [Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/)·[Prisma](/develop-wiki/backend/orm-query/prisma/) 인스턴스를 넣어 프로시저에서 사용한다.
- **외부 공개 필요 시**: 별도 REST 엔드포인트나 OpenAPI 생성 플러그인을 함께 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: Next.js 등 TS 풀스택 앱, 프론트와 백엔드를 같은 팀이 같은 저장소에서 개발할 때.
- 피할 때(대안): 다른 언어 클라이언트·외부 개발자에게 공개하는 API 는 [OpenAPI](/develop-wiki/backend/api/openapi/)·[GraphQL](/develop-wiki/backend/api/graphql/), 다언어 서비스 간 통신은 [gRPC](/develop-wiki/backend/api/grpc/).

## 공식 문서
- [문서](https://trpc.io/docs) · [퀵스타트](https://trpc.io/docs/quickstart) · [서버 어댑터](https://trpc.io/docs/server/adapters) · [TanStack Query 통합](https://trpc.io/docs/client/tanstack-react-query/setup)

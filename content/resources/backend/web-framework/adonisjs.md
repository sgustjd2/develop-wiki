---
name: AdonisJS
url: https://adonisjs.com
repo: https://github.com/adonisjs/core
stars: 19192
docs: https://docs.adonisjs.com
domain: backend
category: web-framework
description: TypeScript 용 MVC 풀스택 Node.js 프레임워크. Lucid ORM, VineJS 검증, 인증, Ace CLI, Japa 테스트를 기본 제공한다.
pricing: oss
tags: [mvc, lucid, vinejs, batteries-included, node]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
AdonisJS 는 Laravel·Rails 처럼 구성 요소를 한 묶음으로 주는 Node.js 프레임워크다. 라우터, 컨트롤러, 미들웨어, VineJS 검증, Lucid ORM(SQL), 인증, 메일, Ace CLI 와 Japa 테스트 러너가 같은 컨벤션으로 맞물린다. TypeScript 우선이고 ESM 이다.

현재 `@adonisjs/core` v7.6.0(2026-10-05), v7.0.0 은 2026-02-25 에 나왔다. Node.js 24 이상과 npm 11 이상이 필요하다. 시작 키트로 hypermedia(서버 렌더링), react, vue, api, api-monorepo 를 고른다. 구조를 직접 짜는 대안은 [Express](/develop-wiki/backend/web-framework/express/), 구조화된 대안은 [NestJS](/develop-wiki/backend/web-framework/nestjs/) 다.

## 설치
```bash
npm create adonisjs@latest my-app -- --kit=api   # api 키트
cd my-app
node ace serve --hmr                                # 개발 서버(키트의 dev 스크립트도 가능)
```
초기화 도구가 의존성 설치, `.env`, `APP_KEY` 생성, 마이그레이션까지 수행한다. `--pkg`, `--git-init`, `--skip-migrations` 옵션이 있다. 개발 서버 명령은 키트의 `package.json` 스크립트를 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `start/routes.ts` | 라우트 정의. `router.get/post/group/resource` |
| 컨트롤러 | `app/controllers/*.ts`, `node ace make:controller posts` |
| HttpContext | `({ request, response, params, auth })` 구조 분해로 받는 요청 컨텍스트 |
| 미들웨어 | `node ace make:middleware`, `handle(ctx, next)`, `router.use([...])` 로 전역 등록 |
| VineJS 검증 | `vine.create({...})`, `request.validateUsing(validator)` |
| Lucid ORM | `node ace add @adonisjs/lucid --db=postgres`, 모델은 `BaseModel` 상속 |
| Ace | 코드 생성·마이그레이션·테스트를 실행하는 CLI |
| Japa | `node ace test` 로 실행하는 테스트 러너(`@japa/api-client`) |

## 기본 사용법
```ts
// start/routes.ts
import router from '@adonisjs/core/services/router'
import vine from '@vinejs/vine'

const todos = new Map<number, { title: string; done: boolean }>()
const createTodo = vine.create({ title: vine.string().minLength(1), done: vine.boolean().optional() })

router.get('/todos/:id', ({ params, response }) => {
  const todo = todos.get(Number(params.id))
  return todo ?? response.notFound({ message: 'not found' })
})

router.post('/todos', async ({ request, response }) => {
  const data = await request.validateUsing(createTodo)
  const id = todos.size + 1
  todos.set(id, { title: data.title, done: data.done ?? false })
  return response.created({ id })
})
```
검증에 실패하면 422 응답이 나간다. 실제 프로젝트는 컨트롤러로 분리해 `router.get('/posts/:id', [controllers.Posts, 'show'])` 처럼 연결한다(`controllers` 는 `#generated/controllers` 에서 import).

## 자주 쓰는 패턴
- **컨트롤러 분리**: `node ace make:controller posts` 후 `list:routes` 로 등록 결과 확인(`node ace list:routes`).
- **검증기 모듈화**: `app/validators/post.ts` 에 `vine.create` 를 두고 컨트롤러에서 `request.validateUsing(createPostValidator)`.
- **DB**: Lucid 마이그레이션(`make:migration`)과 모델/팩토리(`make:model`, `make:factory`). 드라이버는 [PostgreSQL](/develop-wiki/backend/database/postgresql/), [SQLite](/develop-wiki/backend/database/sqlite/) 등.
- **미들웨어**: `make:middleware LogRequests` 로 생성해 전역 또는 라우트 그룹에 적용한다.
- **테스트**: Japa `test('...', async ({ client }) => { const res = await client.post('/todos').json({...}); res.assertStatus(422) })`. `@japa/plugin-adonisjs` 와 `apiClient()` 플러그인이 필요하다. 실행은 `node ace test`.

## 언제 쓰나 / 피할 때
- 쓸 때: 인증·ORM·검증·메일까지 한 컨벤션으로 쓰는 Node.js MVC 앱, Laravel/Rails 경험자가 TypeScript 로 갈 때.
- 피할 때(대안): 최소 구성은 [Hono](/develop-wiki/backend/web-framework/hono/)·[Fastify](/develop-wiki/backend/web-framework/fastify/), 엔터프라이즈 DI 구조는 [NestJS](/develop-wiki/backend/web-framework/nestjs/). 요구 Node 버전(24+)이 높다.

## 공식 문서
- [Installation](https://docs.adonisjs.com/start/installation) · [Routing](https://docs.adonisjs.com/guides/basics/routing) · [Validation](https://docs.adonisjs.com/guides/basics/validation) · [Testing](https://docs.adonisjs.com/guides/testing/introduction) · [Lucid](https://docs.adonisjs.com/guides/database/lucid)

---
name: Fresh
url: https://usefresh.dev
repo: https://github.com/freshframework/fresh
stars: 13786
docs: https://usefresh.dev/docs/introduction
domain: frontend
category: meta-framework
description: Deno 기반 풀스택 웹 프레임워크. 파일 시스템 라우팅과 아일랜드 하이드레이션으로 기본적으로 클라이언트 JS 를 보내지 않는다.
pricing: oss
tags: [deno, islands, preact, ssr, vite]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Fresh 는 Deno 위에서 동작하는 서버 렌더링 프레임워크다. 페이지는 서버에서 Preact 로 렌더링하고, 상호작용이 필요한 컴포넌트만 `islands/` 에 두어 클라이언트에서 하이드레이션한다. 기본 상태에서 브라우저로 가는 JS 가 없다.

저장소는 2026-06 에 `denoland/fresh` 에서 `freshframework/fresh` 조직으로 옮겼고 사이트는 `usefresh.dev` 다. 현재 안정 버전은 2.3.3(2026-04-28), 다음 메이저인 Fresh 3 는 `next` 브랜치에서 alpha 로 개발 중이다(Vite·Nitro 기반, Deno 외 런타임 지원 목표). 같은 아일랜드 모델이면서 Node 기반인 대안은 [Astro](/develop-wiki/frontend/meta-framework/astro/) 다.

## 유지보수 상태 (검토 필요)
- 마지막 릴리스는 2.3.3(2026-04-28)이고 `main` 의 마지막 커밋은 2026-10-17 이다. `next` 에는 2026-10 까지 alpha 가 올라왔다.
- 메인테이너는 2026-06 공지(Discussion #3830)에서 Deno 회사와 분리된 조직으로 옮기고 Vite 전용으로 전환하겠다고 밝혔다.
- 2026-10-09 Deno 팀이 Cloudflare 에 합류했고, Deno 런타임 개발은 1년 뒤 종료 예정이다(오픈소스로 유지). Fresh 3 는 Nitro 가 지원하는 런타임을 목표로 한다고 메인테이너가 답했다.
- 이슈에는 "중단된 것이냐"는 질문과 몇 주간 병합이 없다는 지적이 있다. 활동은 있으나 속도가 느리므로 신규 도입 전에 저장소 활동을 직접 확인한다.

## 설치
```bash
deno run -Ar jsr:@fresh/init
cd <프로젝트>
deno task dev     # 개발 서버
```
초기화 마법사가 `routes/`, `islands/`, `components/`, `static/`, `main.ts`, `client.ts`, `vite.config.ts`, `deno.json` 을 만든다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `App` | `main.ts` 의 앱 객체. `.get/.post/.use` 로 라우트·미들웨어 등록 |
| 파일 라우팅 | `routes/` 하위 파일이 경로가 된다. `[id].tsx` 는 동적 세그먼트 |
| `define` | `createDefine<State>()` 로 만든 헬퍼. `define.handlers/page/middleware` 에 타입을 붙인다 |
| 아일랜드 | `islands/` 의 컴포넌트만 클라이언트에서 하이드레이션. props 는 직렬화 가능해야 한다 |
| 미들웨어 | `ctx.next()` 를 호출하는 함수. `_middleware.ts` 로 폴더 단위 적용 |
| Signals | `@preact/signals` 로 아일랜드 상태 관리 |

## 기본 사용법
```ts
// main.ts — 프로그램 방식 라우트
import { App } from "fresh";

export const app = new App()
  .get("/todos/:id", (ctx) => Response.json({ id: ctx.params.id }))
  .post("/todos", async (ctx) => {
    const { title } = await ctx.req.json();
    return Response.json({ title }, { status: 201 });
  });
```
파일 기반으로는 `routes/api/todos.ts` 에서 `define.handlers({ GET(ctx){...}, POST(ctx){...} })` 를 export 한다. 정의하지 않은 메서드는 405 로 응답한다.

## 자주 쓰는 패턴
- **아일랜드**: `islands/Counter.tsx` 에서 `useSignal` 로 상태를 만들고 서버 라우트에서 일반 컴포넌트처럼 쓴다. 함수 props 는 넘길 수 없다.
- **미들웨어**: `app.use(async (ctx) => { ...; return await ctx.next(); })` 로 헤더 추가·인증. 내장 `cors()`, `csrf()`, `csp()`, `trailingSlashes()` 가 있다.
- **데이터 로딩**: 핸들러가 `{ data }` 를 반환하고 `define.page<typeof handler>` 컴포넌트가 `props.data` 로 받는다.
- **검증·DB**: 내장되어 있지 않다. 검증은 Zod 같은 라이브러리, 저장소는 Deno KV·Postgres 드라이버를 직접 붙인다.
- **테스트**: `new App().use(...).get(...).handler()` 로 핸들러 함수를 얻어 `handler(new Request("http://localhost"))` 를 호출하고 `Deno.test` + `@std/expect` 로 검증한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Deno 환경에서 콘텐츠 중심 사이트를 JS 최소로 서버 렌더링할 때, Preact 기반 아일랜드 구조가 맞을 때.
- 피할 때(대안): 생태계·장기 지원 안정성이 필요하면 [Astro](/develop-wiki/frontend/meta-framework/astro/), [Next.js](/develop-wiki/frontend/meta-framework/nextjs/). Deno 런타임 종료 일정과 메인테이너 속도를 감안해 장기 프로젝트는 신중히 판단한다.

## 공식 문서
- [소개](https://usefresh.dev/docs/introduction) · [Routing](https://usefresh.dev/docs/concepts/routing) · [Middleware](https://usefresh.dev/docs/concepts/middleware) · [Islands](https://usefresh.dev/docs/concepts/islands) · [Testing](https://usefresh.dev/docs/testing)

---
name: TanStack Start
url: https://tanstack.com/start
docs: https://tanstack.com/start/latest/docs/framework/react/overview
repo: https://github.com/TanStack/router
stars: 15337
domain: frontend
category: meta-framework
description: TanStack Router 위에 SSR·스트리밍·서버 함수를 더한 풀스택 프레임워크. 타입 안전한 라우팅과 RPC를 클라이언트 중심 React 앱에 붙일 때 쓴다.
pricing: oss
tags: [react, ssr, server-functions, vite, type-safety]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
TanStack Start는 타입 안전 라우터인 TanStack Router를 그대로 라우팅 계층으로 쓰고, 그 위에 문서 단위 SSR, 스트리밍, 서버 함수(타입 안전 RPC), 서버 라우트, 미들웨어를 더한 풀스택 프레임워크다. Vite(또는 Rsbuild) 플러그인으로 빌드하며 특정 호스팅에 묶이지 않는다. 이 문서는 **v1** React 어댑터 기준이다(npm `@tanstack/react-start` `latest` 1.169.5). 같은 코어 위에 Solid 어댑터도 있다.

- 경로·params·검색 파라미터·loader 데이터가 모두 타입으로 추론되는 것이 다른 React 메타 프레임워크와의 가장 큰 차이다.
- React Server Components는 실험 기능으로만 제공된다. 서버 중심 설계는 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/), 웹 표준 loader/action 모델은 [React Router](/develop-wiki/frontend/meta-framework/react-router/)가 대안이다.

## 설치

```bash
npx @tanstack/cli@latest create        # 패키지 매니저·Tailwind·ESLint 등 선택
npm run dev                             # http://localhost:3000
```

수동 구성은 `npm i @tanstack/react-start @tanstack/react-router react react-dom`, `npm i -D vite @vitejs/plugin-react typescript`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `vite.config.ts` | `@tanstack/react-start/plugin/vite`의 `tanstackStart()`를 `@vitejs/plugin-react`보다 **앞에** 둔다 |
| `src/router.tsx` | `getRouter()`를 내보내 `createRouter({ routeTree })`를 반환. `routeTree.gen.ts`는 자동 생성 |
| `src/routes/__root.tsx` | `createRootRoute`. `<html>` 안에 `<HeadContent />`, `<Outlet />`, `<Scripts />` |
| 파일 라우트 | `createFileRoute('/posts/$id')({ loader, component })`. `$id`가 동적 세그먼트 |
| 서버 함수 | `createServerFn({ method })` + `.validator()` + `.handler()`. 클라이언트에서 호출하면 RPC 요청이 된다 |
| 서버 라우트 | 라우트 정의의 `server.handlers`에 `GET`·`POST` 등을 두면 API 엔드포인트 |
| 미들웨어 | `createMiddleware()`로 서버 함수·요청 앞뒤 처리, `src/start.ts`의 `createStart()`에 전역 등록 |
| 선택적 SSR | 라우트별 `ssr: true`(기본) / `false`(클라이언트만) / `'data-only'`(loader만 서버) |
| 격리 함수 | `createServerOnlyFn`, `createClientOnlyFn`, `createIsomorphicFn`으로 실행 환경을 강제 |

## 기본 사용법
`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
});
```

`src/routes/posts.$id.tsx` — 입력 검증이 있는 서버 함수를 loader에서 호출:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getPost = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const res = await fetch(`https://api.example.com/posts/${data.id}`);
    return (await res.json()) as { title: string };
  });

export const Route = createFileRoute('/posts/$id')({
  loader: ({ params }) => getPost({ data: { id: params.id } }),
  component: () => <h1>{Route.useLoaderData().title}</h1>,
});
```

## 자주 쓰는 패턴
- **스키마 검증.** `.validator(UserSchema)`처럼 Zod 스키마를 넘기면 `data` 타입이 스키마에서 추론된다.
- **변경 요청.** `createServerFn({ method: 'POST' })`로 만들고 컴포넌트에서는 `useServerFn(fn)`으로 감싸 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)의 `useMutation`·`useQuery`와 함께 쓴다.
- **API 엔드포인트.** `createFileRoute('/api/health')({ server: { handlers: { GET: () => Response.json({ ok: true }) } } })`.
- **무거운 화면만 클라이언트 렌더링.** 차트·에디터 라우트에 `ssr: false` 또는 `'data-only'`를 주고, 하위 라우트는 더 제한적인 값만 가질 수 있다.
- **서버 함수는 정적으로 import.** 동적 import로 불러오면 빌드 시 서버/클라이언트 분리가 깨질 수 있다고 문서가 경고한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 TanStack Router·Query를 쓰는 SPA에 SSR과 서버 로직을 붙이고 싶을 때, URL 검색 파라미터 상태가 많은 대시보드처럼 라우트 타입 안전성이 중요한 앱.
- 피할 때(대안): React Server Components 기반의 서버 중심 렌더링·CDN 캐시 모델이 필요하면 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/), 콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/).
- 참고: 패키지 버전은 TanStack Router 저장소와 함께 1.x 마이너가 매우 자주 올라간다. lockfile로 버전을 고정하고 변경 기록을 확인하며 올린다.

## 공식 문서
- [개요](https://tanstack.com/start/latest/docs/framework/react/overview) · [빠른 시작](https://tanstack.com/start/latest/docs/framework/react/quick-start) · [처음부터 구성](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [서버 함수](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) · [서버 라우트](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) · [선택적 SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)

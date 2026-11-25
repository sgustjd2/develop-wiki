---
name: React Router
url: https://reactrouter.com
docs: https://reactrouter.com/start/framework/installation
repo: https://github.com/remix-run/react-router
stars: 56650
domain: frontend
category: meta-framework
description: React 라우터이자 Remix를 흡수한 풀스택 프레임워크. 프레임워크 모드에서 loader/action·SSR·프리렌더링을 웹 표준 Request/Response로 다룰 때 쓴다.
pricing: oss
tags: [react, routing, ssr, vite, remix]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
React Router는 [React](/develop-wiki/frontend/framework/react/)의 대표 라우팅 라이브러리이면서, v7부터 Remix v2의 기능을 합쳐 **프레임워크 모드**(Vite 플러그인 기반 SSR·코드 분할·타입 생성)를 제공한다. 같은 패키지를 선언형(Declarative)·데이터(Data)·프레임워크(Framework) 세 모드로 쓸 수 있고, 이 문서는 메타 프레임워크로서의 프레임워크 모드를 다룬다. 이 문서는 **v8** 기준이다(npm `latest` 8.5.1, 2026-06 출시).

- 8에서 `react-router-dom`이 제거돼 모든 import가 `react-router`(DOM 전용은 `react-router/dom`)로 통일됐고, 미들웨어·라우트 모듈 분할이 기본값이 됐다. ESM 전용이며 매년 메이저를 내는 일정으로 바뀌었다.
- Remix v2와 React Router v6은 지원 종료(EOL)됐다. "Remix 3"는 React에 의존하지 않는 별도 프레임워크로 방향을 바꿨다.

## 설치
Node.js 22.22 이상, React 19.2.7 이상, Vite 7 이상이 필요하다.

```bash
npx create-react-router@latest my-app
cd my-app && npm i && npm run dev     # http://localhost:5173
```

배포 대상별 템플릿은 `--template remix-run/react-router-templates/<이름>`으로 고른다. 빌드는 `react-router build`, 실행은 `react-router-serve ./build/server/index.js`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `app/routes.ts` | 라우트 설정 파일. `@react-router/dev/routes`의 `route`, `index`, `layout`, `prefix`로 선언 |
| `app/root.tsx` | 최상위 라우트. `<html>` 골격과 `<Meta />`, `<Links />`, `<Scripts />`, `<Outlet />` |
| 라우트 모듈 | 라우트 파일이 `default`(컴포넌트), `loader`, `action`, `meta`, `ErrorBoundary` 등을 내보냄 |
| `loader` / `clientLoader` | 서버에서 / 브라우저에서 실행하는 데이터 로딩 |
| `action` / `clientAction` | `<Form>`·`useFetcher` 제출을 처리. 끝나면 loader가 자동 재검증 |
| 타입 생성 | `./+types/<라우트>`의 `Route.ComponentProps`, `Route.LoaderArgs`로 loaderData·params 타입 자동 추론 |
| `middleware` | 요청 전후 실행. `createContext`로 만든 키로 `context.set/get` (v8 기본 활성) |
| `react-router.config.ts` | `ssr`(false면 SPA), `prerender`(빌드 시 정적 생성 경로), `splitRouteModules`, `basename` |
| `useFetcher` | 페이지 이동 없이 action·loader 호출(좋아요 버튼, 인라인 편집 등) |

## 기본 사용법
`app/routes.ts`:

```ts
import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  index('./routes/home.tsx'),
  layout('./routes/dashboard-layout.tsx', [
    route('projects/:id', './routes/project.tsx'),
  ]),
] satisfies RouteConfig;
```

`app/routes/project.tsx`:

```tsx
import { Form } from 'react-router';
import type { Route } from './+types/project';

export async function loader({ params }: Route.LoaderArgs) {
  return { id: params.id, name: `Project ${params.id}` };
}

export async function action({ request, params }: Route.ActionArgs) {
  const name = (await request.formData()).get('name');
  await saveProject(params.id, String(name)); // 앱의 저장 함수
  return { ok: true };
}

export default function Project({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <input name="name" defaultValue={loaderData.name} />
      {actionData?.ok && <p>저장됨</p>}
    </Form>
  );
}
```

## 자주 쓰는 패턴
- **인증 미들웨어.** `export const middleware: Route.MiddlewareFunction[] = [auth]`에서 세션이 없으면 `throw redirect('/login')`, 있으면 `context.set(userContext, user)`. 하위 loader는 `context.get(userContext)`로 읽는다.
- **SPA·정적 사이트.** `react-router.config.ts`에 `ssr: false`면 SPA로, `prerender: ['/', '/about']`이면 해당 경로를 빌드 시 HTML로 만든다.
- **낙관적 UI.** `useFetcher()`의 `fetcher.formData`로 제출 중인 값을 먼저 화면에 반영한다.
- **에러 처리.** 라우트별 `ErrorBoundary`에서 `isRouteErrorResponse(error)`로 404·401 같은 응답 에러와 예외를 나눠 그린다.
- **메타 태그.** React 19부터는 컴포넌트 안에 `<title>`·`<meta>`를 직접 렌더링하는 방식이 권장된다.

## 언제 쓰나 / 피할 때
- 쓸 때: React 앱에서 웹 표준(Request·Response·FormData) 위의 단순한 데이터 흐름을 원할 때, 기존 React Router SPA를 점진적으로 SSR로 옮길 때, Remix v2 앱을 이어서 유지할 때.
- 피할 때(대안): React Server Components·세밀한 캐시 지시어가 필요하면 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/), 타입 안전한 검색 파라미터와 서버 함수를 원하면 [TanStack Start](/develop-wiki/frontend/meta-framework/tanstack-start/), 콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/).
- 8로 올릴 때: 먼저 최신 v7에서 `v8_middleware`, `v8_splitRouteModules`, `v8_viteEnvironmentApi`, `v8_passThroughRequests`, `v8_trailingSlashAwareDataRequests` 플래그를 하나씩 켜고, `meta`·`useMatches()`의 `data`를 `loaderData`로 바꾼 뒤 `react-router-dom`을 제거한다. Cloudflare는 `@cloudflare/vite-plugin`으로 교체.

## 공식 문서
- [프레임워크 모드 설치](https://reactrouter.com/start/framework/installation) · [라우트 모듈](https://reactrouter.com/start/framework/route-module) · [미들웨어](https://reactrouter.com/how-to/middleware)
- [v7 → v8 업그레이드](https://reactrouter.com/upgrading/v7) · [변경 기록](https://reactrouter.com/changelog) · [v8 발표](https://remix.run/blog/react-router-v8)

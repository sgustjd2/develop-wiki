---
name: Remix 3
url: https://remix.run
docs: https://docs.remix.run
repo: https://github.com/remix-run/remix
stars: 33462
domain: frontend
category: meta-framework
description: React에 의존하지 않는 웹 표준 기반 풀스택 TypeScript 프레임워크. 라우팅·미들웨어·자체 컴포넌트 모델·DB·인증을 remix 패키지 하나로 쓸 때 쓴다.
pricing: oss
tags: [fullstack, web-standards, fetch, ssr, no-react]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
**Remix 3는 React 프레임워크가 아니다.** Remix 2까지의 React 기반 기능은 [React Router](/develop-wiki/frontend/meta-framework/react-router/) v7+ 프레임워크 모드로 옮겨졌고, Remix 3는 같은 팀이 처음부터 다시 만든 별도의 풀스택 프레임워크다. 요청은 Web `Request`로 받아 `Response`로 돌려주고, UI는 React가 아닌 **자체 컴포넌트 런타임**(`remix/component`)으로 서버 렌더링·브라우저 하이드레이션을 한다. 이 문서는 **v3** 기준이다(npm `remix` `latest` 3.2.0, 3.0.0은 2026-10-01 배포).

- `remix` 단일 패키지가 라우터, 미들웨어(CORS·CSRF·세션·정적 파일·압축), 컴포넌트, 폼 데이터 파서, `data-table`(SQLite·PostgreSQL·MySQL), 인증, 테스트 러너를 서브경로(`remix/router`, `remix/component` …)로 묶는다. 각 부품은 `@remix-run/*` 단독 패키지로도 쓸 수 있다.
- 번들러·타입 생성·정적 분석에 기대지 않는 "런타임 우선" 설계를 원칙으로 내세운다. Node, Bun, Deno, Cloudflare Workers에서 동작한다.
- **Remix 2 앱의 업그레이드 경로는 Remix 3가 아니라 React Router**다.

## 설치
```bash
npx remix new my-remix-app
cd my-remix-app && npm i
npm run dev          # http://localhost:44100
```

생성 프로젝트의 런타임 의존성은 `remix` 하나다. 구조: `server.ts`(진입점) → `app/router.ts`(미들웨어·컨트롤러 연결) → `app/routes.ts`(라우트 정의) → `app/actions/`(컨트롤러) → `app/ui/`(공용 컴포넌트).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `route()` / `get()` (`remix/routes`) | URL·메서드를 정의한 타입 있는 라우트 맵. `routes.x.href({...})`로 URL 생성 |
| `createController` (`remix/router`) | 라우트 맵에 대응하는 action 함수 묶음. `context.params`가 타입으로 보장됨 |
| `createRouter` / `router.map` | 미들웨어와 라우트·컨트롤러를 연결, `router.fetch(request)`로 실행 |
| `remix/component` | `(handle) => () => JSX` 형태. 바깥 함수는 1회 setup, 안쪽이 render. 상태는 일반 변수 + `handle.update()` |
| `mix` 속성 | 요소에 이벤트(`on('click', …)`)·스타일(`css({...})`)을 붙이는 방식. React의 `onClick`·`className` 대신 쓴다 |
| `context.render(...)` | render 미들웨어가 컴포넌트 트리를 HTML 스트림 `Response`로 만든다 |
| `<Frame>` | 페이지 일부 영역을 서버에서 다시 받아 갱신 |
| `createRequestListener` | Node `http` 서버에 `router.fetch`를 연결하는 어댑터 |

## 기본 사용법
라우트 정의와 컨트롤러.

```ts
// app/routes.ts
import { get, route } from 'remix/routes';

export const routes = route({
  home: '/',
  albums: { show: get('/albums/:albumId') },
});
```

```tsx
// app/actions/albums/controller.tsx
import { createController } from 'remix/router';
import { routes } from '../../routes.ts';

export default createController(routes.albums, {
  actions: {
    show(context) {
      return new Response(`Album: ${context.params.albumId}`);
    },
  },
});
```

컴포넌트(로컬 상태 + 명시적 갱신).

```tsx
import { on } from 'remix/component';
import type { Handle } from 'remix/component';

export function Counter(handle: Handle<{ initial: number }>) {
  let count = handle.props.initial;
  return () => (
    <button
      type="button"
      mix={on('click', () => { count++; handle.update(); })}
    >
      {count}
    </button>
  );
}
```

## 자주 쓰는 패턴
- **라우트 맵을 URL의 단일 원천으로:** 링크·리다이렉트·폼 action·테스트가 모두 `routes`를 import 해 `href()`로 URL을 만든다.
- **컨트롤러는 Response만 돌려준다:** HTML(`context.render`), 리다이렉트, JSON, 파일 스트림을 같은 방식으로 반환.
- **미들웨어 조합:** `remix/middleware/*`(static, session, csrf, cors, compression, logger)를 라우터에 순서대로 건다.
- **에이전트 친화 문서:** 설치된 `node_modules/remix/INDEX.md`에 버전별 문서·패키지 README가 들어 있고, 생성 템플릿에 Agent Skill이 포함된다.

## 언제 쓰나 / 피할 때
- 쓸 때: React 없이 웹 표준 API 중심으로 서버·UI·데이터를 한 패키지로 묶은 새 프로젝트, 의존성을 최소화하고 여러 JS 런타임에 배포해야 할 때.
- 피할 때(대안): 기존 Remix 2·React 코드와 React 생태계 컴포넌트를 쓰려면 [React Router](/develop-wiki/frontend/meta-framework/react-router/) 프레임워크 모드, 성숙한 React 풀스택은 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/)·[TanStack Start](/develop-wiki/frontend/meta-framework/tanstack-start/). 3.x는 출시 직후라 서드파티 생태계가 작다.

## 공식 문서
- [Getting Started](https://docs.remix.run/start-here/) · [UI 렌더링](https://docs.remix.run/rendering-ui/) · [API 레퍼런스](https://docs.remix.run/api/remix/) · [GitHub](https://github.com/remix-run/remix)
- [Wake up, Remix (방향 전환 배경)](https://remix.run/blog/wake-up-remix)

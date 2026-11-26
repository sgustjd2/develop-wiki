---
name: Next.js
url: https://nextjs.org
docs: https://nextjs.org/docs
repo: https://github.com/vercel/next.js
stars: 143738
domain: frontend
category: meta-framework
description: Vercel이 만드는 React 풀스택 프레임워크. App Router·서버 컴포넌트·캐시 지시어로 정적 셸과 요청 시 렌더링을 한 페이지에 섞을 때 쓴다.
pricing: oss
tags: [react, ssr, rsc, app-router, turbopack]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Next.js는 [React](/develop-wiki/frontend/framework/react/) 위에 파일 기반 라우팅, 서버 렌더링, 데이터 캐시, API 엔드포인트, 이미지·폰트 최적화를 얹은 풀스택 프레임워크다. 현재 기본은 **App Router**로, 컴포넌트가 기본적으로 React Server Component이고 브라우저에서 동작해야 하는 부분만 `'use client'`로 표시한다. 이 문서는 **v16** 기준이다(npm `latest` 16.4.6).

- 16에서 Turbopack이 기본 번들러가 됐고, 캐시는 `'use cache'` 지시어 기반의 Cache Components로 명시적 opt-in이 됐다.
- 같은 React 계열 대안으로 [React Router](/develop-wiki/frontend/meta-framework/react-router/)(프레임워크 모드), [TanStack Start](/develop-wiki/frontend/meta-framework/tanstack-start/)가 있다.

## 설치
Node.js 20.9 이상, TypeScript 5.1 이상이 필요하다.

```bash
npx create-next-app@latest my-app --yes   # TypeScript·Tailwind·ESLint·App Router·Turbopack 기본값
cd my-app && npm run dev                  # http://localhost:3000
```

수동 설치는 `npm i next@latest react@latest react-dom@latest`. 업그레이드는 `npx next upgrade`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| App Router | `app/` 폴더 구조가 URL. `page.tsx`가 화면, `layout.tsx`가 공유 껍데기(루트 레이아웃은 필수) |
| 특수 파일 | `loading.tsx`(Suspense 폴백), `error.tsx`(에러 경계), `not-found.tsx`, `route.ts`(HTTP 핸들러) |
| 서버/클라이언트 컴포넌트 | 기본은 서버 컴포넌트. 상태·이벤트·브라우저 API가 필요하면 파일 맨 위에 `'use client'` |
| Server Functions | `'use server'` 함수를 `<form action>`이나 클라이언트에서 호출해 데이터 변경 |
| Cache Components | `next.config.ts`의 `cacheComponents: true`. `'use cache'` + `cacheLife()`/`cacheTag()`로 캐시할 부분만 지정 |
| Partial Prerendering | 정적·캐시된 부분은 빌드 시 셸에 포함, `<Suspense>` 안의 요청 시 데이터는 스트리밍 |
| 무효화 | `revalidateTag(tag, 'max')`(SWR), Server Action 안에서 `updateTag(tag)`(즉시 반영), `refresh()` |
| `proxy.ts` | 16에서 `middleware.ts`를 대체하는 요청 가로채기 파일. Node.js 런타임에서 실행 |
| 비동기 요청 API | `params`, `searchParams`, `cookies()`, `headers()`는 모두 `await` 해야 한다 |
| Pages Router | 기존 `pages/` 방식. 계속 지원되지만 새 프로젝트는 App Router 권장 |

## 기본 사용법
`app/posts/[id]/page.tsx` — 동적 세그먼트와 캐시된 데이터 함수:

```tsx
import { cacheLife, cacheTag } from 'next/cache';

async function getPost(id: string) {
  'use cache';
  cacheLife('hours');
  cacheTag(`post-${id}`);
  const res = await fetch(`https://api.example.com/posts/${id}`);
  return res.json() as Promise<{ title: string; body: string }>;
}

export default async function Page({ params }: PageProps<'/posts/[id]'>) {
  const { id } = await params;
  const post = await getPost(id);
  return <article><h1>{post.title}</h1><p>{post.body}</p></article>;
}
```

`app/posts/[id]/actions.ts` — 폼에서 호출하는 Server Action:

```ts
'use server';
import { updateTag } from 'next/cache';
import { db } from '@/lib/db'; // 앱의 DB 클라이언트(예시)

export async function savePost(id: string, formData: FormData) {
  await db.post.update(id, { title: String(formData.get('title')) });
  updateTag(`post-${id}`); // 같은 요청에서 바로 새 데이터를 읽는다
}
```

## 자주 쓰는 패턴
- **요청 시 데이터는 Suspense로 감싼다.** `cookies()`·`headers()`나 캐시하지 않는 fetch를 쓰는 컴포넌트를 `<Suspense fallback>` 안에 두면 나머지 페이지는 정적 셸로 즉시 나간다. 감싸지 않으면 개발 오버레이가 경고한다.
- **`await`를 트리 아래로 내린다.** 레이아웃에서 `params`를 바로 `await`하지 말고 Promise를 자식에 넘기면 정적으로 만들 수 있는 영역이 넓어진다.
- **클라이언트 경계 최소화.** 인터랙션이 있는 말단 컴포넌트에만 `'use client'`를 붙이고, 데이터 조회는 서버 컴포넌트에서 한다.
- **API 엔드포인트.** `app/api/hello/route.ts`에서 `export async function GET(request: Request) { return Response.json({ ok: true }) }`.
- **린트는 직접 실행.** 16부터 `next build`가 린트를 돌리지 않고 `next lint`도 제거됐다. `eslint` 또는 `biome check`를 스크립트로 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: React로 SEO가 필요한 서비스·커머스·대시보드를 만들고, 정적 생성·SSR·스트리밍·서버 액션을 한 프레임워크에서 다루고 싶을 때. Vercel 배포가 가장 매끄럽지만 16.2부터 Adapter API로 다른 플랫폼 배포도 공식 지원한다.
- 피할 때(대안): 서버 컴포넌트·캐시 모델이 과한 SPA·내부 도구는 Vite + [React](/develop-wiki/frontend/framework/react/) 또는 [TanStack Start](/develop-wiki/frontend/meta-framework/tanstack-start/), 콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/), 웹 표준 Request/Response 중심 설계를 원하면 [React Router](/develop-wiki/frontend/meta-framework/react-router/).
- 16으로 올릴 때: 동기 `params`/`cookies()` 접근 제거, `middleware.ts` → `proxy.ts`(함수명 `proxy`), AMP·`next lint` 제거, `revalidateTag` 단일 인자 형태 폐기 예정, 병렬 라우트 슬롯마다 `default.js` 필수. `npx @next/codemod@canary upgrade latest`가 대부분 처리한다.

## 공식 문서
- [설치](https://nextjs.org/docs/app/getting-started/installation) · [App Router 문서](https://nextjs.org/docs/app) · [캐싱(Cache Components)](https://nextjs.org/docs/app/getting-started/caching)
- [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache) · [v16 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16) · [Next.js 16 발표](https://nextjs.org/blog/next-16)

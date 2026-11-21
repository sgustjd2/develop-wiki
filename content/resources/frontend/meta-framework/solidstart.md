---
name: SolidStart
url: https://start.solidjs.com
docs: https://v1.solidjs.com/solid-start/v2/
repo: https://github.com/solidjs/solid-start
stars: 5925
domain: frontend
category: meta-framework
description: Solid 기반 풀스택 메타 프레임워크. Vite 플러그인으로 파일 라우팅·SSR·서버 함수를 붙여 Solid 앱을 서버까지 확장할 때 쓴다.
pricing: oss
tags: [solid, ssr, vite, server-functions, file-routing]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SolidStart는 [Solid](/develop-wiki/frontend/framework/solid/) 앱에 파일 기반 라우팅, 서버 렌더링(SSR), `"use server"` 서버 함수, API 라우트를 더하는 메타 프레임워크다. v2부터는 Vite 8+의 Environment API 위에 `solidStart()` Vite 플러그인 하나로 동작하며, 배포는 Nitro v3·Cloudflare·Netlify Vite 플러그인 같은 어댑터에 맡긴다. 이 문서는 **SolidStart v2** 기준이다(npm `@solidjs/start` `latest` 2.2.3, 1.x는 `v1-latest` 1.5.1).

- **Solid 2.0과의 관계(중요):** SolidStart 2.x는 **Solid v1** 위에서 동작한다. `@solidjs/start@2.2.3`의 peerDependency는 `solid-js ^1.9.15`, `@solidjs/router <2.0.0`이다. 그래서 v2 문서도 Solid 2.0 문서(docs.solidjs.com)가 아니라 v1.solidjs.com 아래에 있다. Solid 2.0 쪽에서는 `vite-plugin-solid`의 "start mode"로 풀스택 기능을 시험할 수 있다(v2.solidjs.com 레퍼런스).
- 라우터를 고정하지 않는다. Solid Router v1 또는 TanStack Solid Router v1 중 하나를 고른다.
- 같은 위치의 대안: React는 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/)·[TanStack Start](/develop-wiki/frontend/meta-framework/tanstack-start/), Svelte는 [SvelteKit](/develop-wiki/frontend/meta-framework/sveltekit/).

## 설치
```bash
npm init solid
cd my-app && npm i
npm run dev
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { solidStart } from '@solidjs/start/config';

export default defineConfig({
  plugins: [solidStart()],
});
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `src/routes/` | 파일 라우팅. `index.tsx` → `/`, `about.tsx` → `/about`, `[id].tsx` → 동적 세그먼트 |
| API 라우트 | `src/routes/api/*.ts`에서 `GET`·`POST` 같은 HTTP 메서드 이름 함수를 export |
| `"use server"` | 함수 안에 넣으면 서버에서만 실행되는 RPC가 된다. DB·비밀키 접근용 |
| `query` / `createAsync` | Solid Router의 캐시되는 데이터 로딩 함수와, 컴포넌트에서 그 결과를 읽는 프리미티브 |
| `action` | 폼 제출·변경 작업. `<form action={...} method="post">`로 연결 |
| `solidStart({ middleware })` | 요청 미들웨어 파일 경로를 플러그인 옵션으로 지정 |
| `~` 별칭 | 앱 루트(`src/`) 별칭. `~/lib/db` → `src/lib/db` |

## 기본 사용법
서버에서만 실행되는 쿼리를 라우트에서 읽기.

```tsx
// src/routes/posts.tsx
import { For } from 'solid-js';
import { createAsync, query } from '@solidjs/router';

const getPosts = query(async () => {
  'use server';
  const res = await fetch('https://example.com/api/posts');
  return (await res.json()) as { id: number; title: string }[];
}, 'posts');

export default function Posts() {
  const posts = createAsync(() => getPosts());
  return <ul><For each={posts()}>{(p) => <li>{p.title}</li>}</For></ul>;
}
```

API 라우트.

```ts
// src/routes/api/users/[id].ts
import type { APIEvent } from '@solidjs/start/server';

export async function GET({ params }: APIEvent) {
  return Response.json({ userId: params.id });
}
```

## 자주 쓰는 패턴
- **서버 전용 코드 분리:** DB 클라이언트는 `src/lib/` 아래 두고 `"use server"` 함수 안에서만 import 한다.
- **세션:** `@solidjs/start/http`의 `useSession`으로 쿠키 기반 세션을 서버 함수에서 읽는다.
- **라우트 프리로드:** 라우트 파일에서 `route: RouteDefinition`의 `preload`로 `query`를 미리 호출해 워터폴을 줄인다.
- **배포 대상 변경:** 앱 코드는 두고 Vite 배포 플러그인(Nitro v3, Cloudflare, Netlify)만 바꾼다.
- **v1 → v2 이전:** `app.config.ts`(Vinxi) 대신 `vite.config.ts`로 옮기는 툴링 변경이 중심이다. 공식 마이그레이션 가이드를 따른다.

## 언제 쓰나 / 피할 때
- 쓸 때: Solid 1.x로 만든 앱에 SSR·서버 함수·API 라우트가 필요할 때, 라우터와 배포 대상을 자유롭게 고르고 싶을 때.
- 피할 때(대안): Solid 2.0 API로 새로 시작하려면 SolidStart의 2.0 대응을 확인한 뒤 결정한다. 생태계 규모가 중요하면 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/), 콘텐츠 중심 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/)(Solid 컴포넌트 사용 가능).

## 공식 문서
- [SolidStart v2 개요](https://v1.solidjs.com/solid-start/v2/) · [시작하기](https://v1.solidjs.com/solid-start/v2/getting-started) · [데이터 가져오기](https://v1.solidjs.com/solid-start/v2/building-your-application/data-fetching) · [API 라우트](https://v1.solidjs.com/solid-start/v2/building-your-application/api-routes)
- [GitHub 릴리스](https://github.com/solidjs/solid-start/releases)

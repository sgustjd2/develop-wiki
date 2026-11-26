---
name: Analog
url: https://analogjs.org
docs: https://analogjs.org/docs
repo: https://github.com/analogjs/analog
stars: 3214
domain: frontend
category: meta-framework
description: Angular용 풀스택 메타 프레임워크. Vite 위에서 파일 기반 라우팅·SSR·API 라우트·마크다운 콘텐츠를 Angular 앱에 붙일 때 쓴다.
pricing: oss
tags: [angular, ssr, vite, file-routing, nitro]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Analog는 [Angular](/develop-wiki/frontend/framework/angular/)에 Next.js·Nuxt 같은 메타 프레임워크 기능을 더하는 프로젝트다. Angular CLI 대신 Vite로 빌드하고, `src/app/pages`의 파일 이름으로 라우트를 만들며, 서버 쪽은 Nitro(h3) 기반으로 SSR·API 라우트·정적 프리렌더링을 처리한다. 이 문서는 **v2** 기준이다(npm `@analogjs/platform` `latest` 2.9.7, Angular 17~22 지원). 기본 브랜치에서는 **v3가 beta**(3.0.0-beta.x)로 개발 중이다.

- 서버 렌더링이 기본으로 켜져 있고, 빌드 결과는 `dist/analog/public`(클라이언트)와 `dist/analog/server`(SSR·API)로 나뉜다.
- 같은 Angular 생태계에서 Angular 자체 SSR(`@angular/ssr`)을 쓰는 방식과 비교하면, Analog는 파일 라우팅·서버 load·마크다운 콘텐츠를 프레임워크가 제공한다는 점이 다르다.

## 설치
```bash
npm create analog@latest
cd my-analog-app && npm install
npm run start        # http://localhost:5173
```

생성된 `vite.config.ts`의 핵심:

```ts
import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

export default defineConfig(() => ({
  plugins: [analog()],
}));
```

`app.config.ts`에서는 `@analogjs/router`의 `provideFileRouter()`를 providers에 넣는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `src/app/pages/*.page.ts` | `.page.ts`로 끝나는 파일만 라우트가 된다. 컴포넌트는 **default export** |
| `(home).page.ts` / `index.page.ts` | 괄호로 감싼 이름은 경로에 들어가지 않는 인덱스 라우트(`/`) |
| `[productId].page.ts` | 동적 세그먼트 → `:productId` |
| `products.page.ts` + `products/` | 같은 이름 파일·폴더로 레이아웃 라우트(자식은 `router-outlet`에 렌더) |
| `[...not-found].page.ts` | catch-all 라우트(404 등) |
| `*.server.ts` 의 `load` | 페이지 렌더 전에 서버에서 실행. 클라이언트 번들에 포함되지 않음 |
| `src/server/routes/api/` | h3 이벤트 핸들러로 API 라우트 작성, `/api` 접두사로 노출 |

## 기본 사용법
서버 load와 페이지.

```ts
// src/app/pages/index.server.ts
import { PageServerLoad } from '@analogjs/router';

export const load = async ({ params }: PageServerLoad) => {
  return { loaded: true, at: new Date().toISOString() };
};
```

```ts
// src/app/pages/index.page.ts
import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { injectLoad } from '@analogjs/router';
import { load } from './index.server';

@Component({ template: `<p>로드됨: {{ data().at }}</p>` })
export default class HomePage {
  data = toSignal(injectLoad<typeof load>(), { requireSync: true });
}
```

API 라우트(`src/server/routes/api/v1/hello.ts` → `/api/v1/hello`).

```ts
import { defineEventHandler } from 'h3';

export default defineEventHandler(() => ({ message: 'Hello World' }));
```

## 자주 쓰는 패턴
- **load 결과를 input으로 받기:** `provideFileRouter(withComponentInputBinding())`를 쓰면 `@Input() load(data: LoadResult<typeof load>)`처럼 받을 수 있다.
- **SSR 중 상대 URL HttpClient 호출:** 템플릿처럼 `provideHttpClient(withInterceptors([requestContextInterceptor]))`를 넣어 둔다.
- **마크다운 블로그·문서:** `@analogjs/content`로 마크다운 파일을 라우트·콘텐츠 목록으로 쓴다.
- **Nx 모노레포:** `@nx/angular`·`@nx/vite`와 함께 쓰는 공식 통합 가이드가 있다.
- **테스트:** 생성 템플릿에 Vitest 설정(`test` 블록, jsdom)이 들어 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Angular를 유지하면서 파일 라우팅·서버 load·API를 한 프로젝트에 두고 싶을 때, Vite 기반 개발 서버·Vitest를 쓰고 싶을 때.
- 피할 때(대안): Angular CLI 표준 구성과 공식 지원 범위를 우선하면 Angular 기본 SSR, 프레임워크 선택이 자유롭다면 [Nuxt](/develop-wiki/frontend/meta-framework/nuxt/)·[Next.js](/develop-wiki/frontend/meta-framework/nextjs/). v3 beta는 API가 바뀔 수 있으니 운영 프로젝트는 2.x `latest`를 쓴다.

## 공식 문서
- [시작하기](https://analogjs.org/docs/getting-started) · [라우팅](https://analogjs.org/docs/features/routing/overview) · [서버 데이터 가져오기](https://analogjs.org/docs/features/data-fetching/server-side-data-fetching) · [API 라우트](https://analogjs.org/docs/features/api/overview)
- [마이그레이션(기존 Angular 앱)](https://analogjs.org/docs/guides/migrating) · [Nx 통합](https://analogjs.org/docs/integrations/nx)

---
name: Nuxt
url: https://nuxt.com
docs: https://nuxt.com/docs/4.x/getting-started/introduction
repo: https://github.com/nuxt/nuxt
stars: 61103
domain: frontend
category: meta-framework
description: Vue 기반 풀스택 프레임워크. 파일 기반 라우팅·SSR·서버 API(Nitro)·자동 import를 갖춘 Vue 앱을 만들 때 쓴다.
pricing: oss
tags: [vue, ssr, nitro, fullstack]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Nuxt는 [Vue](/develop-wiki/frontend/framework/vue/) 앱에 파일 기반 라우팅, 서버 렌더링(SSR)·정적 생성, 서버 API, 데이터 패칭 컴포저블, 모듈 생태계를 얹은 풀스택 프레임워크다. 컴포넌트·컴포저블·유틸을 import 없이 쓰는 자동 import와, 배포 대상(Node, 서버리스, 엣지)을 바꿔 주는 서버 엔진 Nitro가 특징이다. 이 문서는 **v4** 기준이다(npm `latest` 4.6.4).

- 4에서 앱 코드가 `app/` 폴더로 모였다. 3.x는 2026-07-31에 지원이 끝났다. 5는 준비 중이다(4.5·4.6이 그 기반 작업).
- React 쪽 대응물은 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/), Svelte 쪽은 [SvelteKit](/develop-wiki/frontend/meta-framework/sveltekit/)이다.

## 설치
Node.js 22 이상(짝수 LTS 권장)이 필요하다.

```bash
npm create nuxt@latest my-app
cd my-app && npm run dev        # nuxt dev, http://localhost:3000
```

모듈 추가는 `npx nuxt module add <이름>`(예: `@nuxt/image`, `@nuxt/content`). 빌드는 `nuxt build`, 정적 생성은 `nuxt generate`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `app/` 디렉터리 | `pages/`, `components/`, `composables/`, `layouts/`, `middleware/`, `plugins/`, `utils/`, `app.vue` |
| 루트 디렉터리 | `server/`(api·routes·middleware), `public/`, `shared/`(앱·서버 공용 코드), `nuxt.config.ts` |
| 파일 기반 라우팅 | `app/pages/posts/[id].vue` → `/posts/:id`. `<NuxtPage />`가 현재 페이지를 렌더링 |
| 자동 import | Vue API(`ref`, `computed`), 컴포넌트, `composables/`·`utils/`의 내보내기를 import 없이 사용 |
| `useFetch` / `useAsyncData` | SSR에서 가져온 데이터를 페이로드로 클라이언트에 넘겨 중복 요청을 막는 컴포저블 |
| `$fetch` | 이벤트 핸들러 등에서 쓰는 단순 요청 함수(ofetch). SSR 페이로드 전달은 없음 |
| 서버 라우트 | `server/api/*.ts`에서 `defineEventHandler`로 API 작성. Nitro가 배포 대상별로 빌드 |
| 라우트 미들웨어 | `app/middleware/`의 `defineNuxtRouteMiddleware`로 페이지 이동 전 검사 |
| 렌더링 규칙 | `routeRules`로 경로별 SSR·프리렌더·SWR 캐시·CSR 전환 |
| 모듈·레이어 | 설정·기능을 패키지로 확장(module), 앱 일부를 상속해 재사용(layer) |

## 기본 사용법
`server/api/users.get.ts` — 4.6에 추가된 서버 중립 API(`nuxt/server`)를 명시적으로 import:

```ts
import { defineEventHandler, getQuery } from 'nuxt/server';

export default defineEventHandler((event) => {
  const { q } = getQuery<{ q?: string }>(event);
  const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }];
  return q ? users.filter((u) => u.name.includes(q)) : users;
});
```

`app/pages/users.vue`:

```vue
<script setup lang="ts">
const q = ref('');
const { data, status, refresh } = await useFetch('/api/users', { query: { q } });
</script>

<template>
  <input v-model="q" placeholder="검색" />
  <p v-if="status === 'pending'">불러오는 중…</p>
  <ul v-else>
    <li v-for="u in data" :key="u.id">{{ u.name }}</li>
  </ul>
  <button @click="() => refresh()">새로고침</button>
</template>
```

## 자주 쓰는 패턴
- **초기 데이터는 `useFetch`, 클릭 이벤트는 `$fetch`.** 셋업에서 `$fetch`만 쓰면 서버·클라이언트에서 두 번 요청한다.
- **반응형 쿼리.** `query`에 ref를 넘기면 값이 바뀔 때 자동 재요청된다. URL 자체를 바꾸려면 computed URL을 쓴다.
- **페이로드 줄이기.** `pick: ['id', 'name']`이나 `transform`으로 필요한 필드만 클라이언트로 보낸다.
- **경로별 렌더링.** `nuxt.config.ts`에 `routeRules: { '/blog/**': { prerender: true }, '/admin/**': { ssr: false } }`.
- **공용 타입·검증 로직**은 `shared/`에 두면 앱과 서버 양쪽에서 import 할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vue로 SEO가 필요한 서비스나 서버 API까지 포함한 풀스택 앱을 만들 때, 다양한 호스팅(Node·서버리스·엣지)에 같은 코드를 배포해야 할 때.
- 피할 때(대안): SSR이 필요 없는 관리자 화면은 Vite + [Vue](/develop-wiki/frontend/framework/vue/)만으로 충분하다. 콘텐츠 사이트 위주면 [Astro](/develop-wiki/frontend/meta-framework/astro/)도 Vue 컴포넌트를 쓸 수 있다.
- 주의: 4.6의 `nuxt/server` 이전은 선택 사항이다. 자동 import된 `defineEventHandler`는 여전히 h3 버전이라 두 방식을 한 파일에서 섞으면 오류(`NUXT_E8012`)가 난다.

## 공식 문서
- [소개](https://nuxt.com/docs/4.x/getting-started/introduction) · [설치](https://nuxt.com/docs/4.x/getting-started/installation) · [디렉터리 구조](https://nuxt.com/docs/4.x/directory-structure)
- [데이터 패칭](https://nuxt.com/docs/4.x/getting-started/data-fetching) · [Nuxt 4.6 발표](https://nuxt.com/blog/v4-6) · [모듈 목록](https://nuxt.com/modules)

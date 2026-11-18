---
name: SvelteKit
url: https://svelte.dev/docs/kit
docs: https://svelte.dev/docs/kit/introduction
repo: https://github.com/sveltejs/kit
stars: 20917
domain: frontend
category: meta-framework
description: Svelte 공식 풀스택 프레임워크. 파일 기반 라우팅, load 함수, 폼 액션, 어댑터 배포로 Svelte 앱을 SSR·정적 생성할 때 쓴다.
pricing: oss
tags: [svelte, ssr, vite, fullstack]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SvelteKit은 [Svelte](/develop-wiki/frontend/framework/svelte/) 팀이 만드는 앱 프레임워크로, 라우팅·서버 렌더링·데이터 로딩·폼 처리·배포 어댑터를 제공한다. Vite 플러그인으로 동작하며, 첫 요청은 서버에서 렌더링하고 이후 이동은 클라이언트 라우터가 처리한다. 이 문서는 **v3** 기준이다(npm `latest` 3.3.1, 2026년 10월 안정판).

- 3에서 `svelte.config.js`가 사라지고 설정이 `vite.config.js`의 `sveltekit()` 플러그인 옵션으로 옮겨졌다. `$lib` 별칭도 Node 표준 subpath import인 `#lib`로 바뀌었다.
- 비슷한 위치의 프레임워크로 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/)(React), [Nuxt](/develop-wiki/frontend/meta-framework/nuxt/)(Vue)가 있다.

## 설치
Node.js 22.17 이상, Svelte 5.57.1 이상, Vite 8, TypeScript를 쓰면 6 이상이 필요하다.

```bash
npx sv create my-app
cd my-app && npm run dev        # http://localhost:5173
```

`sv` CLI는 TypeScript·린터·Tailwind 같은 도구 설정을 묻는다. 기존 프로젝트에 추가할 때는 `npx sv add tailwindcss`처럼 쓴다. 2.x에서 올릴 때는 최신 2.x로 먼저 맞춘 뒤 `npx sv migrate sveltekit-3`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `+page.svelte` | 해당 경로의 화면. `src/routes/blog/[slug]/+page.svelte` → `/blog/:slug` |
| `+page.ts` / `+page.server.ts` | `load` 함수. 전자는 서버·브라우저 양쪽(universal), 후자는 서버에서만 실행 |
| `+layout.svelte` / `+layout.server.ts` | 하위 경로가 공유하는 레이아웃과 그 데이터 |
| `+server.ts` | `GET`·`POST` 등을 내보내는 API 엔드포인트 |
| `+error.svelte` | 해당 구간의 에러 화면 |
| 폼 액션 | `+page.server.ts`의 `actions`. `<form method="POST">`가 JS 없이도 동작하고 `use:enhance`로 점진적 향상 |
| `$app/state` | `page`, `navigating`, `updated` 같은 런타임 상태(3에서 `$app/stores` 제거) |
| `hooks.server.ts` | 모든 요청을 가로채는 `handle`, 에러 처리 `handleError` |
| 어댑터 | `adapter-auto`, `adapter-node`, `adapter-static`, Vercel·Netlify·Cloudflare 어댑터 |
| 원격 함수 | 파일명에 `remote` 세그먼트가 있는 모듈(예: `data.remote.ts`)의 `query`·`form`·`command`. 3에서도 실험 기능(`experimental.remoteFunctions`) |

## 기본 사용법
`vite.config.js`:

```js
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() })],
});
```

`src/routes/todos/+page.server.ts` — 데이터 로딩과 폼 액션:

```ts
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const todos: string[] = [];

export const load: PageServerLoad = () => ({ todos });

export const actions: Actions = {
  default: async ({ request }) => {
    const text = (await request.formData()).get('text');
    if (!text) return fail(400, { missing: true });
    todos.push(String(text));
  },
};
```

`src/routes/todos/+page.svelte`:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>

<form method="POST" use:enhance>
  <input name="text" />
  {#if form?.missing}<p>내용을 입력하세요</p>{/if}
</form>
<ul>{#each data.todos as t}<li>{t}</li>{/each}</ul>
```

## 자주 쓰는 패턴
- **DB·비밀 값은 서버 load에서.** `+page.server.ts`에서만 읽고, 직렬화 가능한 값만 반환한다. 서버 전용 모듈은 파일명이나 디렉터리에 `server` 세그먼트를 넣어(예: `src/lib/server/db.ts`) 클라이언트 번들 유입을 막는다.
- **공용 코드 import.** `package.json`의 `"imports"`에 `"#lib": "./src/lib/index.js"`, `"#lib/*": "./src/lib/*"`를 선언하고 `import x from '#lib/foo.js'`처럼 확장자까지 쓴다.
- **페이지별 렌더링 옵션.** `export const prerender = true`(정적 생성), `export const ssr = false`(클라이언트 전용).
- **인증 공통 처리.** `hooks.server.ts`의 `handle`에서 세션을 읽어 `event.locals`에 넣고, load에서 `locals`를 사용한다.
- **이동 후 데이터 갱신.** `$app/navigation`의 `refreshAll()`(3에서 `invalidateAll` 대체)로 모든 load를 다시 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Svelte로 SSR·정적 생성·API를 한 저장소에서 다루는 앱, JS 없이도 동작하는 폼(점진적 향상)이 중요한 서비스.
- 피할 때(대안): 콘텐츠 중심 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/)(Svelte 컴포넌트 사용 가능), React 생태계 라이브러리가 꼭 필요하면 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/)나 [React Router](/develop-wiki/frontend/meta-framework/react-router/).
- 3으로 올릴 때: `svelte.config.js` 제거, `$lib` → `#lib`, `$app/stores`·`$service-worker` 제거, `$app/environment` → `$app/env`, `$app/paths`의 `base`·`assets` 대신 `asset()`·`resolve()`, 외부 URL `redirect()`에 `external` 옵션 필요, Vercel `edge` 런타임 제거.

## 공식 문서
- [소개](https://svelte.dev/docs/kit/introduction) · [프로젝트 만들기](https://svelte.dev/docs/kit/creating-a-project) · [라우팅](https://svelte.dev/docs/kit/routing)
- [폼 액션](https://svelte.dev/docs/kit/form-actions) · [설정](https://svelte.dev/docs/kit/configuration) · [SvelteKit 3 마이그레이션](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)

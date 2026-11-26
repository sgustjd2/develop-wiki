---
name: Vite
url: https://vite.dev
docs: https://vite.dev/guide/
repo: https://github.com/vitejs/vite
stars: 84121
domain: frontend
category: build-tooling
description: 네이티브 ES 모듈 기반 개발 서버와 Rolldown 기반 프로덕션 빌드를 묶은 프론트엔드 빌드 도구. 대부분의 메타 프레임워크가 기반으로 쓴다.
pricing: oss
tags: [bundler, dev-server, rolldown, hmr]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Vite는 개발 중에는 소스를 번들하지 않고 브라우저의 네이티브 ES 모듈로 바로 제공해 서버 시작과 HMR을 빠르게 하고, 배포용으로는 최적화된 번들을 만드는 빌드 도구다. 이 문서는 **Vite 8** 기준이다(npm `latest` 8.3.8).

- 8부터 번들링과 의존성 사전 번들링을 **Rolldown**(Rust로 만든 Rollup 호환 번들러)이, JS 변환·압축을 **Oxc**가 맡는다. 7까지 쓰던 esbuild + Rollup 조합을 대체했고 esbuild는 선택 의존성이 됐다.
- [Astro](/develop-wiki/frontend/meta-framework/astro/), [Nuxt](/develop-wiki/frontend/meta-framework/nuxt/), [SvelteKit](/develop-wiki/frontend/meta-framework/sveltekit/), [React Router](/develop-wiki/frontend/meta-framework/react-router/), [TanStack Start](/develop-wiki/frontend/meta-framework/tanstack-start/)가 Vite 위에서 동작하고, [Vitest](/develop-wiki/frontend/testing/vitest/)도 Vite 설정을 그대로 쓴다.
- webpack 계열 설정 호환이 필요하면 [Rspack](/develop-wiki/frontend/build-tooling/rspack/)이 대안이다.

## 설치
Node.js 20.19+ 또는 22.12+가 필요하다.

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install && npm run dev
```

템플릿: `vanilla`, `vue`, `react`, `react-compiler`, `preact`, `lit`, `svelte`, `solid`, `qwik` (각각 `-ts` 변형). 기존 프로젝트에는 `npm install -D vite`.

| 명령 | 용도 |
| --- | --- |
| `vite` (`vite dev`) | 개발 서버 |
| `vite build` | 프로덕션 빌드 → `dist/` |
| `vite preview` | 빌드 결과를 로컬에서 확인 |

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `index.html` 진입점 | 프로젝트 루트의 HTML이 진입점. `<script type="module" src="/src/main.ts">`를 따라 그래프를 만든다 |
| 의존성 사전 번들링 | `node_modules` 의존성을 한 번 묶어 캐시(`optimizeDeps`). 8에서는 Rolldown이 수행 |
| HMR | 바뀐 모듈만 교체. 프레임워크 플러그인(`@vitejs/plugin-react`, `@vitejs/plugin-vue` 등)이 상태 유지 갱신을 구현 |
| 플러그인 | Rollup/Rolldown 플러그인 인터페이스 + Vite 전용 훅(`configureServer`, `transformIndexHtml` 등) |
| `import.meta.env` | 환경 변수. 클라이언트에는 `VITE_` 접두사가 붙은 것만 노출 |
| `public/` | 변환 없이 그대로 복사되는 정적 파일 |
| `build.rolldownOptions` | 번들러 저수준 옵션. 7의 `build.rollupOptions`는 이름이 바뀌었다(구 이름은 deprecated) |
| Environment API | 클라이언트·SSR·엣지 등 여러 실행 환경을 하나의 설정에서 다루는 API(프레임워크 작성자용) |

## 기본 사용법
`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    port: 3000,
    proxy: { '/api': 'http://localhost:8080' },
  },
  build: { sourcemap: true },
});
```

환경 변수 사용:

```ts
// .env → VITE_API_URL=https://api.example.com
const apiUrl = import.meta.env.VITE_API_URL;
if (import.meta.env.DEV) console.log('개발 모드', apiUrl);
```

## 자주 쓰는 패턴
- **API 프록시.** 개발 중 CORS를 피하려고 `server.proxy`로 백엔드 경로를 넘긴다.
- **모드별 설정.** `defineConfig(({ mode }) => ...)` + `loadEnv(mode, process.cwd())`로 설정 파일 안에서 `.env.[mode]` 값을 읽는다.
- **정적 자산 import.** `import logo from './logo.svg'`는 URL, `?raw`는 문자열, `?url`은 명시적 URL로 가져온다.
- **라이브러리 모드.** `build.lib`에 `entry`·`formats`를 지정하면 앱이 아닌 패키지 번들을 만든다.
- **글롭 import.** `import.meta.glob('./pages/*.tsx')`로 여러 모듈을 지연 로드 맵으로 가져온다.
- **CSS.** CSS Modules(`*.module.css`), PostCSS 설정을 자동 인식하고, 8부터 CSS 압축 기본값은 Lightning CSS다. [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/)는 `@tailwindcss/vite` 플러그인으로 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: React·Vue·Svelte·Solid SPA를 새로 시작할 때, 메타 프레임워크 없이 가벼운 빌드 파이프라인이 필요할 때, 라이브러리 번들을 만들 때.
- 피할 때(대안): 대규모 webpack 설정·로더·Module Federation 자산을 그대로 옮겨야 하면 [Rspack](/develop-wiki/frontend/build-tooling/rspack/). 단순 스크립트 번들 하나면 [esbuild](/develop-wiki/frontend/build-tooling/esbuild/) CLI로 충분하다.
- 7 → 8로 올릴 때: 브라우저 기본 타깃 상향(Chrome 111, Firefox 114, Safari 16.4), CJS default import 해석 변경(`legacy.inconsistentCjsInterop`으로 임시 복원), `manualChunks` 객체 형태 제거, `system`·`amd` 출력 미지원. `esbuild` 옵션 일부는 Oxc/Rolldown 옵션으로 자동 변환된다.

## 공식 문서
- [시작하기](https://vite.dev/guide/) · [설정 레퍼런스](https://vite.dev/config/) · [플러그인 API](https://vite.dev/guide/api-plugin)
- [v7에서 마이그레이션](https://vite.dev/guide/migration) · [한국어 문서](https://ko.vite.dev/guide/) · [Rolldown](https://rolldown.rs)

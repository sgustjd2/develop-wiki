---
name: Rspack
url: https://rspack.rs
docs: https://rspack.rs/guide/start/quick-start
repo: https://github.com/web-infra-dev/rspack
stars: 12984
domain: frontend
category: build-tooling
description: Rust로 작성한 webpack 호환 번들러. 기존 webpack 설정·로더·플러그인을 대부분 유지한 채 빌드 속도를 높이고 싶을 때 쓴다.
pricing: oss
tags: [bundler, webpack, rust, module-federation]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Rspack은 ByteDance 웹 인프라 팀이 만든 Rust 기반 번들러로, webpack의 설정 구조와 로더·플러그인 API를 따르면서 핵심 처리를 네이티브 코드로 수행한다. SWC 기반 `builtin:swc-loader`, Lightning CSS, 내장 CSS 처리 등이 기본 포함돼 별도 로더를 줄인다. 이 문서는 **Rspack 2** 기준이다(npm `@rspack/core` `latest` 2.3.3, 2.0은 2026-04-22 공개).

- 같은 팀의 **Rsbuild**(Rspack 위의 기본값·개발 서버·프레임워크 통합), **Rslib**(라이브러리 빌드)가 상위 도구다. 새 웹앱은 공식적으로 Rsbuild를 권장한다.
- 새 프로젝트 중심의 [Vite](/develop-wiki/frontend/build-tooling/vite/)와 달리, 기존 webpack 자산을 옮기는 경로에 강점이 있다.

## 설치
Node.js 20.19+ 또는 22.12+가 필요하다(1.x는 18.12+). Deno·Bun에서도 실행된다.

```bash
npm create rspack@latest                     # 템플릿으로 시작
# 직접 구성
npm install -D @rspack/core @rspack/cli @rspack/dev-server
```

`package.json` 스크립트: `"dev": "rspack dev"`, `"build": "rspack build"`, `"preview": "rspack preview"`. 2.0부터 `@rspack/cli`가 dev-server를 포함하지 않으므로 `rspack dev`를 쓰려면 `@rspack/dev-server`를 따로 설치한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `rspack.config.*` | `.ts`/`.js`/`.mts`/`.mjs`/`.cts`/`.cjs` 순으로 탐색. 구조는 webpack 설정과 같다 |
| `defineConfig` | `@rspack/cli`에서 가져오는 타입 도우미 |
| `builtin:swc-loader` | babel-loader·ts-loader 대체. `detectSyntax: 'auto'`로 TS/JSX 자동 판별 |
| 내장 CSS | `type: 'css/auto'` 등 모듈 타입으로 CSS 처리. `CssExtractRspackPlugin`은 mini-css-extract-plugin 대체 |
| 내장 플러그인 | `rspack.HtmlRspackPlugin`, `CopyRspackPlugin`, `SwcJsMinimizerRspackPlugin`, `LightningCssMinimizerRspackPlugin` |
| webpack 호환 | 대부분의 webpack 로더·플러그인이 그대로 동작. `resolve.plugins`는 미지원(`resolve.tsConfig` 사용) |
| `incremental` / `lazyCompilation` | 2.0에서 `experiments`를 벗어나 최상위 옵션이 됐다 |
| Module Federation | 마이크로 프런트엔드용 원격 모듈 공유. 2.0에서 `@module-federation/runtime-tools`를 직접 설치 |

## 기본 사용법
`rspack.config.mjs`:

```js
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';

export default defineConfig({
  entry: { main: './src/index.tsx' },
  resolve: { extensions: ['.ts', '.tsx', '.js'] },
  module: {
    rules: [
      {
        test: /\.(?:js|jsx|ts|tsx)$/,
        exclude: [/[\\/]node_modules[\\/]/],
        use: [{ loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } }],
      },
      { test: /\.css$/, type: 'css/auto' },
    ],
  },
  plugins: [new rspack.HtmlRspackPlugin({ template: './index.html' })],
});
```

## 자주 쓰는 패턴
- **webpack 이전.** `webpack.config.js` → `rspack.config.js`로 이름을 바꾸고, babel-loader를 `builtin:swc-loader`로, mini-css-extract-plugin·copy-webpack-plugin을 내장 플러그인으로 교체한다. 커스텀 Babel 플러그인이 필요한 파일만 babel-loader를 남긴다.
- **html 플러그인.** 호환성을 우선하면 `html-rspack-plugin` 포크, 속도를 우선하면 내장 `rspack.HtmlRspackPlugin`.
- **압축기 지정.** `optimization.minimizer`를 직접 쓰면 JS(`SwcJsMinimizerRspackPlugin`)와 CSS(`LightningCssMinimizerRspackPlugin`)를 둘 다 넣는다.
- **ESM 라이브러리 빌드.** 2.0의 `output.library.type: 'modern-module'`로 트리 셰이킹 가능한 ESM 패키지를 만든다.
- **기본값으로 시작.** 설정을 직접 짜기 싫으면 Rsbuild(`npm create rsbuild@latest`)를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 큰 webpack 프로젝트의 빌드 시간을 줄이고 싶지만 설정·플러그인 생태계·Module Federation을 버릴 수 없을 때.
- 피할 때(대안): 새 SPA나 Vite 기반 메타 프레임워크를 쓰는 경우 [Vite](/develop-wiki/frontend/build-tooling/vite/)가 더 단순하다. 설정 없이 스크립트만 묶으면 [esbuild](/develop-wiki/frontend/build-tooling/esbuild/).
- 1.x → 2.0으로 올릴 때: 패키지가 순수 ESM, Node 18 지원 종료, `exportsPresence` 기본값 `error`, 개발 모드 `devtool` 기본값 `cheap-module-source-map`, 런타임 전역 접두사 `webpackChunk` → `rspackChunk`, `experiments.css` 제거(규칙에 `type` 지정 필요). 공식 업그레이드 가이드에 전체 목록이 있다.

## 공식 문서
- [빠른 시작](https://rspack.rs/guide/start/quick-start) · [설정](https://rspack.rs/config/) · [webpack에서 이전](https://rspack.rs/guide/migration/webpack)
- [1.x → 2.0 업그레이드](https://rspack.rs/guide/migration/rspack_1.x) · [2.0 발표](https://rspack.rs/blog/announcing-2-0)

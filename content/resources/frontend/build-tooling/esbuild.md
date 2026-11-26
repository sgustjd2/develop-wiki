---
name: esbuild
url: https://esbuild.github.io
docs: https://esbuild.github.io/getting-started/
repo: https://github.com/evanw/esbuild
stars: 40187
domain: frontend
category: build-tooling
description: Go로 작성한 JavaScript·TypeScript 번들러 겸 변환기. 설정이 거의 없는 스크립트·라이브러리·서버 코드 번들링에 쓴다.
pricing: oss
tags: [bundler, transpiler, go, minifier]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
esbuild는 Go로 작성된 번들러로, JS·TS·JSX 변환, 번들링, 압축, 소스맵 생성을 하나의 네이티브 실행 파일에서 병렬로 처리한다. CLI 플래그나 짧은 JS API 호출만으로 동작해 설정 파일이 필요 없다. 이 문서는 **0.28** 기준이다(npm `latest` 0.28.2, 2026-08-08 공개). 아직 1.0 전이라 마이너 버전(0.x)에서 호환성이 깨질 수 있어 정확한 버전 고정을 권장한다.

- 다른 도구의 내부 엔진으로 널리 쓰였다. [Vite](/develop-wiki/frontend/build-tooling/vite/)는 7까지 esbuild를 썼고 8부터 Rolldown·Oxc로 바꿨다(esbuild는 선택 의존성).
- 타입 검사는 하지 않는다. TS 타입은 지우기만 하므로 `tsc --noEmit`을 별도로 돌린다.

## 설치
```bash
npm install --save-exact --save-dev esbuild
npx esbuild --version
```

플랫폼별 네이티브 바이너리가 `node_modules`에 설치된다. Deno·Go 라이브러리로도 쓸 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `--bundle` | import된 의존성을 하나로 묶는다. 없으면 파일 단위 변환만 |
| `--platform` | `browser`(기본) / `node` / `neutral`. `node`는 내장 모듈을 external 처리 |
| `--format` | `iife` / `cjs` / `esm`. 플랫폼별 기본값이 다르다(browser→iife, node→cjs) |
| `--target` | 문법 변환 대상(`es2020`, `chrome100`, `node20` 등) |
| `loader` | 확장자별 처리 방식(`.png: 'dataurl'`, `.svg: 'text'` 등) |
| `define` / `external` | 전역 상수 치환 / 번들에서 제외할 모듈 |
| `splitting` | 코드 스플리팅. `esm` 포맷과 `outdir`가 필요 |
| `context()` | 재사용 가능한 빌드 컨텍스트. `watch()`, `serve()`, `rebuild()`, `dispose()` |
| 플러그인 | `onResolve`/`onLoad` 콜백으로 경로 해석·파일 로드를 가로챈다 (JS API `build`·`context`에서만) |
| `metafile` | 입력·출력 크기 정보를 JSON으로 출력해 번들 분석에 쓴다 |

## 기본 사용법
CLI:

```bash
npx esbuild src/app.tsx --bundle --minify --sourcemap \
  --target=es2020 --outfile=dist/app.js
npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.mjs
```

JS API (`build.mjs`):

```js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'dist/index.js',
  external: ['pg'],
  define: { 'process.env.NODE_ENV': '"production"' },
});
```

## 자주 쓰는 패턴
- **개발 서버.** `const ctx = await esbuild.context({...}); await ctx.serve({ servedir: 'public' })`로 요청마다 최신 빌드를 제공한다(개발 전용).
- **감시 모드.** `await ctx.watch()`는 변경 시 증분 재빌드. 종료할 때 `ctx.dispose()`.
- **서버·람다 번들.** `--platform=node --bundle`로 의존성을 한 파일에 담아 콜드 스타트와 배포 크기를 줄인다. 네이티브 모듈은 `external`로 뺀다.
- **변환만.** `esbuild.transform(code, { loader: 'ts' })`로 문자열 단위 TS→JS 변환(테스트 러너·도구 내부용).
- **번들 분석.** `metafile: true` 결과를 공식 Bundle Size Analyzer에 올려 크기를 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: CLI 도구·Node 서버·서버리스 함수·작은 라이브러리처럼 HTML·HMR이 필요 없는 번들, 다른 도구 안의 빠른 변환 단계.
- 피할 때(대안): HMR·프레임워크 플러그인이 필요한 앱 개발은 [Vite](/develop-wiki/frontend/build-tooling/vite/), webpack 호환이 필요하면 [Rspack](/develop-wiki/frontend/build-tooling/rspack/). 구형 브라우저용 ES5 하향 변환은 지원 범위가 제한적이다.
- 참고: 저장소 마지막 커밋이 2026-08이라 릴리스 주기가 Vite·Rspack보다 느리다.

## 공식 문서
- [시작하기](https://esbuild.github.io/getting-started/) · [API](https://esbuild.github.io/api/) · [플러그인](https://esbuild.github.io/plugins/)
- [콘텐츠 타입](https://esbuild.github.io/content-types/) · [변경 기록](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)

---
name: Oxlint
url: https://oxc.rs
docs: https://oxc.rs/docs/guide/usage/linter.html
repo: https://github.com/oxc-project/oxc
stars: 23527
domain: frontend
category: build-tooling
description: Rust로 만든 Oxc 프로젝트의 JavaScript·TypeScript 린터. ESLint 핵심·주요 플러그인 규칙을 내장해 대규모 저장소의 린트 시간을 줄일 때 쓴다.
pricing: oss
tags: [linter, rust, oxc]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Oxlint는 Rust로 작성된 JavaScript 도구 모음 Oxc(파서·변환기·리졸버·미니파이어·포매터)의 린터다. ESLint 핵심 규칙과 typescript-eslint, React, Jest, Vitest, import, unicorn, jsx-a11y 등의 규칙을 870여 개 내장 규칙으로 다시 구현했고, 기본값은 오탐이 적은 `correctness` 위주다. 이 문서는 **v1** 기준이다(npm `latest` 1.94.0).

- [ESLint](/develop-wiki/frontend/build-tooling/eslint/)를 완전히 대체하거나, ESLint 앞단에서 빠른 1차 검사로 병행하는 두 방식을 모두 공식 지원한다.
- 같은 Oxc 파서를 [Vite](/develop-wiki/frontend/build-tooling/vite/)의 번들러 Rolldown도 쓴다. 포매터는 별도 패키지 `oxfmt`(Prettier 출력을 기준으로 삼음)다.

## 설치
```bash
npm install -D oxlint
npx oxlint --init        # .oxlintrc.json 생성
npx oxlint               # 현재 디렉터리 검사
```

`package.json` 스크립트에 `"lint": "oxlint"`, `"lint:fix": "oxlint --fix"`를 두는 구성이 기본이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 설정 파일 | `.oxlintrc.json`, `.oxlintrc.jsonc`, `oxlint.config.ts`, `oxlint.config.mts`. 디렉터리마다 하나 |
| `categories` | 규칙 묶음 단위 심각도: `correctness`, `suspicious`, `pedantic`, `perf`, `style`, `restriction`, `nursery` |
| `plugins` | 켤 내장 플러그인 목록(`typescript`, `react`, `import`, `jest`, `unicorn`, `oxc` …). 지정하면 기본 세트를 **덮어씀** |
| `rules` | `"플러그인/규칙": "error"` 형식. ESLint와 같은 이름 체계 |
| `overrides` | `files` glob별로 규칙·플러그인·`env`를 다르게 적용 |
| 타입 인식 린트 | `--type-aware` + `oxlint-tsgolint`. TypeScript 네이티브 포트(tsgo)로 타입 정보를 얻는다 |
| `jsPlugins` | ESLint 형식 JS 플러그인을 불러와 실행. **알파** 단계 |

## 기본 사용법
`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "import", "oxc"],
  "categories": { "correctness": "error", "suspicious": "warn" },
  "rules": {
    "no-console": "warn",
    "typescript/no-floating-promises": "error"
  },
  "overrides": [
    { "files": ["scripts/**"], "rules": { "no-console": "off" } }
  ],
  "options": { "typeAware": true }
}
```

```bash
npm install -D oxlint-tsgolint     # 타입 인식 규칙을 쓸 때만
npx oxlint --fix
```

## 자주 쓰는 패턴
- **ESLint 설정 변환.** `npx @oxlint/migrate`가 기존 flat config를 `.oxlintrc.json`으로 옮긴다. 타입 인식 규칙까지 옮기려면 `--type-aware`.
- **ESLint와 병행.** Oxlint를 먼저 돌리고, ESLint에는 `eslint-plugin-oxlint`를 추가해 겹치는 규칙을 끈다. Oxlint가 아직 없는 규칙만 ESLint가 맡는다.
- **커스텀 JS 플러그인.** `"jsPlugins": ["eslint-plugin-whatever"]`로 불러온다. 알파 단계이고, Vue·Svelte 같은 사용자 정의 파서와 타입 정보가 필요한 규칙은 아직 지원하지 않는다.
- **CI.** 바이너리 하나로 빠르게 끝나므로 PR마다 전체 저장소를 검사해도 부담이 작다.

## 언제 쓰나 / 피할 때
- 쓸 때: 수천 파일 이상 저장소에서 ESLint 시간이 병목일 때, 내장 규칙 범위(React·TS·import·테스트)로 충분할 때.
- 피할 때(대안): Vue·Svelte·Angular 템플릿 린트, 사내 커스텀 규칙이 많고 타입 정보까지 쓰는 경우는 [ESLint](/develop-wiki/frontend/build-tooling/eslint/). 포맷까지 한 도구로 묶으려면 [Biome](/develop-wiki/frontend/build-tooling/biome/).
- 타입 인식 린트는 typescript-eslint 타입 규칙 62개 중 60개를 지원하지만, 아주 큰 코드베이스에서는 메모리 사용이 클 수 있다고 문서가 밝힌다.

## 공식 문서
- [Oxlint 사용법](https://oxc.rs/docs/guide/usage/linter.html) · [설정](https://oxc.rs/docs/guide/usage/linter/config.html) · [타입 인식 린트](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
- [ESLint에서 이전](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html) · [JS 플러그인](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) · [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)

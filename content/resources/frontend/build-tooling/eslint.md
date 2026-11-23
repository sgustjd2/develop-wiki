---
name: ESLint
url: https://eslint.org
docs: https://eslint.org/docs/latest/use/getting-started
repo: https://github.com/eslint/eslint
stars: 27644
domain: frontend
category: build-tooling
description: JavaScript·TypeScript 코드의 버그 패턴과 규칙 위반을 찾는 플러그인형 린터. 팀 규칙을 자동으로 강제하고 싶을 때 쓴다.
pricing: oss
tags: [linter, flat-config, static-analysis]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
ESLint는 소스 코드를 AST로 파싱한 뒤 규칙(rule)마다 문제 패턴을 찾아 보고하고, 가능한 경우 자동 수정하는 린터다. 규칙·파서·플러그인이 모두 교체 가능해서 React, TypeScript, 접근성, import 정리 같은 생태계 플러그인이 넓다. 이 문서는 **v10** 기준이다(npm `latest` 10.15.0).

- 설정은 `eslint.config.*` 하나(flat config)만 지원한다. v10에서 예전 `.eslintrc` 형식이 완전히 제거됐다.
- 속도를 우선하면 Rust 기반 [Oxlint](/develop-wiki/frontend/build-tooling/oxlint/)나 [Biome](/develop-wiki/frontend/build-tooling/biome/)가 대안이다. 플러그인 폭과 커스텀 규칙 작성은 ESLint가 가장 넓다.

## 설치
Node.js `^20.19.0`, `^22.13.0`, `>=24` 중 하나가 필요하다.

```bash
npm init @eslint/config@latest        # 대화형으로 설정 파일 생성
# 또는 직접 설치
npm install -D eslint @eslint/js
```

TypeScript 프로젝트는 `typescript-eslint`(현재 8.x)를 함께 설치한다.

```bash
npm install -D eslint @eslint/js typescript typescript-eslint
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| flat config | `eslint.config.js`(`.mjs`/`.cjs`/`.ts`/`.mts`/`.cts`)가 설정 객체 **배열**을 export |
| `defineConfig()` | `eslint/config`에서 가져오는 타입 도우미. 배열·`extends`를 정리해 준다 |
| `files` / `ignores` | 설정 객체가 적용될 파일 glob. 기본 대상은 `**/*.js`, `**/*.cjs`, `**/*.mjs`뿐 |
| `globalIgnores()` | 모든 설정에 적용되는 무시 패턴. 디렉터리는 `dist/**`처럼 끝까지 써야 한다 |
| `extends` | 다른 설정(객체·배열·`"플러그인/설정"` 문자열)을 이어받음 |
| 규칙 심각도 | `"off"` / `"warn"` / `"error"` (또는 0/1/2) |
| 플러그인 | `plugins: { name: plugin }`로 등록, 규칙은 `name/rule-id`로 참조 |
| 설정 탐색 | v10부터 **각 파일의 디렉터리에서 위로** `eslint.config.*`를 찾는다 |

## 기본 사용법
`eslint.config.mjs` (TypeScript 프로젝트):

```js
// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/**', 'coverage/**']),
  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

```bash
npx eslint .            # 검사
npx eslint . --fix      # 자동 수정 가능한 문제 수정
```

## 자주 쓰는 패턴
- **Prettier와 함께.** 포매팅 관련 규칙은 `eslint-config-prettier`로 끄고 서식은 [Prettier](/develop-wiki/frontend/build-tooling/prettier/)에 맡긴다. lint-staged에서는 ESLint를 먼저, Prettier를 나중에 돌린다.
- **파일별 설정.** 테스트 파일만 전역 변수·규칙을 바꾸려면 `files: ['**/*.test.ts']` 객체를 배열 뒤쪽에 추가한다. 뒤의 객체가 앞을 덮어쓴다.
- **TypeScript 설정 파일.** `eslint.config.ts`는 Node에서 `jiti` 2.2 이상을 devDependency로 설치해야 읽는다(Bun·Deno는 기본 지원).
- **모노레포.** v10의 파일 기준 탐색 덕분에 패키지마다 `eslint.config.*`를 두면 그 아래 파일에 그 설정이 적용된다. 예전처럼 cwd 기준이 필요하면 `--config`로 지정한다.
- **점진적 가속.** 규칙 수가 많아 느리면 [Oxlint](/develop-wiki/frontend/build-tooling/oxlint/)를 먼저 돌리고 `eslint-plugin-oxlint`로 겹치는 ESLint 규칙을 끈다.

## 언제 쓰나 / 피할 때
- 쓸 때: React Hooks 규칙, 접근성, import 순서 등 생태계 플러그인이 필요하거나 팀 고유 규칙을 직접 작성해야 할 때. 대부분의 프레임워크 템플릿이 기본으로 ESLint 설정을 제공한다.
- 피할 때(대안): 대규모 저장소에서 린트 시간이 병목이면 Oxlint, 린트와 포맷을 도구 하나로 합치고 싶으면 Biome.
- v9 → v10으로 올릴 때: Node 20.19 미만·21·23 지원 종료, `.eslintrc`·`FlatESLint`/`LegacyESLint` 제거, 설정 탐색이 파일 기준으로 변경, `/* eslint-env */` 주석이 오류로 보고된다. `eslint:recommended`에 `no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`가 추가됐고, JSX 식별자를 참조로 추적해 `no-unused-vars` 결과가 달라질 수 있다.

## 공식 문서
- [시작하기](https://eslint.org/docs/latest/use/getting-started) · [설정 파일](https://eslint.org/docs/latest/use/configure/configuration-files) · [CLI](https://eslint.org/docs/latest/use/command-line-interface)
- [규칙 목록](https://eslint.org/docs/latest/rules/) · [v10 마이그레이션](https://eslint.org/docs/latest/use/migrate-to-10.0.0) · [typescript-eslint](https://typescript-eslint.io/getting-started/)

---
name: Prettier
url: https://prettier.io
docs: https://prettier.io/docs/install
repo: https://github.com/prettier/prettier
stars: 52449
domain: frontend
category: build-tooling
description: 옵션을 최소화한 코드 포매터. JS·TS·CSS·HTML·Markdown·YAML 등을 일관된 스타일로 다시 출력해 서식 논쟁을 없앨 때 쓴다.
pricing: oss
tags: [formatter, code-style]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Prettier는 코드를 파싱한 뒤 원래 줄바꿈·들여쓰기를 버리고 자체 규칙으로 다시 출력하는 포매터다. 설정 옵션을 일부러 적게 두어 "어떤 스타일로 할지"를 팀이 논의할 필요를 줄이는 것이 설계 목표다. 이 문서는 **v3** 기준이다(npm `latest` 3.10.1).

- 린터와 역할이 다르다. 버그 패턴 검사는 [ESLint](/develop-wiki/frontend/build-tooling/eslint/)가, 서식은 Prettier가 맡는 조합이 흔하다.
- 같은 출력을 더 빠르게 내려는 대안으로 [Biome](/develop-wiki/frontend/build-tooling/biome/) 포매터와 Oxc의 oxfmt가 있다.

## 설치
팀원 간 출력 차이를 막기 위해 **정확한 버전으로 고정**해 설치하는 것이 공식 권장이다.

```bash
npm install -D --save-exact prettier
echo '{}' > .prettierrc                  # 프로젝트가 Prettier를 쓴다는 표시
printf 'build\ncoverage\n' > .prettierignore
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 설정 파일 | `.prettierrc`(JSON/YAML), `.prettierrc.json`, `prettier.config.js`/`.mjs`/`.ts` 등, 또는 `package.json`의 `"prettier"` 키 |
| `.prettierignore` | 포맷하지 않을 경로. `.gitignore`도 함께 따른다 |
| 주요 옵션 | `printWidth`, `tabWidth`, `semi`, `singleQuote`, `trailingComma`, `endOfLine` 등 소수 |
| `overrides` | `files` glob별로 `options`를 다르게 적용 |
| 플러그인 | `plugins` 배열로 언어 추가(예 Tailwind 클래스 정렬, Svelte, Astro) |
| `--check` / `--write` | 검사만 / 파일을 실제로 고침 |

## 기본 사용법
```bash
npx prettier . --write          # 전체 포맷
npx prettier . --check          # CI에서 포맷 여부만 검사
npx prettier "src/**/*.ts" --write
```

`prettier.config.ts`:

```ts
import { type Config } from 'prettier';

const config: Config = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  overrides: [{ files: '*.md', options: { proseWrap: 'always' } }],
};

export default config;
```

TypeScript 설정 파일은 Node.js 22.6 이상이 필요하고, 24.3 미만에서는 `NODE_OPTIONS="--experimental-strip-types"`를 붙여야 한다.

## 자주 쓰는 패턴
- **에디터 연동.** VS Code 등에서 저장 시 포맷을 켜고, 전역이 아닌 프로젝트 로컬 Prettier를 쓰게 한다.
- **커밋 전 포맷.** husky + lint-staged로 스테이징된 파일만 포맷한다.

  ```json
  "lint-staged": { "**/*": "prettier --write --ignore-unknown" }
  ```
- **ESLint와 충돌 제거.** `eslint-config-prettier`를 ESLint 설정 마지막에 추가해 서식 관련 규칙을 끈다.
- **CI 검사.** `prettier . --check`가 실패하면 포맷되지 않은 파일이 있다는 뜻이다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 언어(JS·TS·CSS·HTML·Markdown·YAML·GraphQL) 파일을 한 도구로 맞추고 싶을 때, 프레임워크·에디터 생태계 호환성이 중요할 때.
- 피할 때(대안): 대규모 저장소에서 포맷 시간이 문제면 Biome이나 oxfmt(Prettier 출력을 기준으로 삼는 Rust 포매터), 린트와 포맷을 한 도구로 묶으려면 Biome.

## 공식 문서
- [설치](https://prettier.io/docs/install) · [옵션](https://prettier.io/docs/options) · [설정 파일](https://prettier.io/docs/configuration)
- [린터와 함께 쓰기](https://prettier.io/docs/integrating-with-linters) · [CLI](https://prettier.io/docs/cli) · [변경 기록](https://github.com/prettier/prettier/blob/main/CHANGELOG.md)

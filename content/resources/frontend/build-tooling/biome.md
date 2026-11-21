---
name: Biome
url: https://biomejs.dev
docs: https://biomejs.dev/guides/getting-started/
repo: https://github.com/biomejs/biome
stars: 26171
domain: frontend
category: build-tooling
description: 포매터와 린터를 Rust 바이너리 하나로 묶은 웹 코드 도구. ESLint+Prettier 조합을 단일 설정·단일 명령으로 바꾸고 싶을 때 쓴다.
pricing: oss
tags: [linter, formatter, rust]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Biome은 JavaScript·TypeScript·JSON·CSS·GraphQL 등을 같은 파서 위에서 포맷하고 린트하는 툴체인이다. 설정 파일 하나(`biome.json`)와 명령 하나(`biome check`)로 포맷·린트·import 정리를 함께 처리하는 것이 핵심이다. 이 문서는 **v2** 기준이다(npm `latest` 2.6.8, 라이선스 Apache-2.0 또는 MIT).

- 포매터 출력은 [Prettier](/develop-wiki/frontend/build-tooling/prettier/)와의 호환을 목표로 하지만 기본값이 일부 다르다(예 기본 들여쓰기가 탭).
- 린트 규칙은 ESLint·typescript-eslint·플러그인 규칙을 Rust로 다시 구현한 것이다. 임의의 ESLint 플러그인을 그대로 쓸 수는 없다.

## 설치
버전 고정(`-E`)이 공식 권장이다. Node 없이 쓰는 단독 바이너리 설치 스크립트도 있다.

```bash
npm i -D -E @biomejs/biome
npx biome init            # biome.json 생성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `biome check` | 포맷 + 린트 + assist(import 정리 등)를 한 번에 검사. `--write`로 안전한 수정 적용 |
| `biome format` / `biome lint` | 포맷만 / 린트만 실행 |
| `biome ci` | CI 전용. 수정 옵션이 없고 GitHub에서는 진단을 annotation으로 표시 |
| `biome.json` | 포매터·린터·assist·언어별 설정. `$schema`로 에디터 자동완성 |
| 규칙 그룹 | `a11y`, `complexity`, `correctness`, `nursery`, `performance`, `security`, `style`, `suspicious` |
| `rules.preset` | 기준 규칙 묶음: `recommended`(기본) / `all` / `none`. 예전 `recommended: true` 불리언은 deprecated |
| 안전/비안전 수정 | 기본 `--write`는 안전한 수정만. 비안전 수정은 `--unsafe` 추가 |
| `vcs` 연동 | `.gitignore` 반영, `--changed`/`--staged`로 바뀐 파일만 검사 |

## 기본 사용법
`biome.json` (2.6 스키마 기준):

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.8/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "formatter": { "enabled": true, "indentStyle": "space", "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": { "preset": "recommended" }
  },
  "javascript": { "formatter": { "quoteStyle": "single" } },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } }
}
```

```bash
npx biome check              # 문제 목록 출력
npx biome check --write      # 포맷 + 안전한 린트 수정 + import 정리
npx biome ci .               # CI에서 검사만
```

## 자주 쓰는 패턴
- **기존 설정 이전.** `npx biome migrate eslint --write`는 같은 의미의 규칙만 옮기고, `--include-inspired`를 붙이면 "영감을 받은" 규칙까지 옮긴다. `npx biome migrate prettier --write`는 Prettier 옵션과 `.prettierignore`를 옮긴다.
- **스테이징 파일만.** VCS 연동을 켜고 `biome check --staged --write`를 커밋 훅에 둔다.
- **언어 지원 확인.** JS/TS/JSX, JSON, CSS·SCSS, GraphQL, YAML, Markdown은 포맷·린트 지원. HTML은 설정으로 켜야 하고, Vue·Svelte·Astro 파일 지원은 실험 단계다.
- **에디터.** 공식 VS Code·IntelliJ 확장, LSP를 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 프로젝트에서 린터·포매터 의존성과 설정을 줄이고 싶을 때, CI 검사 시간을 줄이고 싶을 때.
- 피할 때(대안): 특정 ESLint 플러그인(프레임워크 전용 규칙, 사내 커스텀 규칙)에 의존하면 [ESLint](/develop-wiki/frontend/build-tooling/eslint/) 유지. 린트 속도만 필요하면 [Oxlint](/develop-wiki/frontend/build-tooling/oxlint/)를 ESLint와 병행하는 방법도 있다. Vue·Svelte 단일 파일 컴포넌트 비중이 크면 지원 수준을 먼저 확인한다.

## 공식 문서
- [시작하기](https://biomejs.dev/guides/getting-started/) · [설정 레퍼런스](https://biomejs.dev/reference/configuration/) · [린트 규칙](https://biomejs.dev/linter/)
- [ESLint·Prettier에서 이전](https://biomejs.dev/guides/migrate-eslint-prettier/) · [언어 지원](https://biomejs.dev/internals/language-support/) · [CI](https://biomejs.dev/recipes/continuous-integration/)

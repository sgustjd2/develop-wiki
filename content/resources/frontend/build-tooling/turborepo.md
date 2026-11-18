---
name: Turborepo
url: https://turborepo.dev
docs: https://turborepo.dev/docs
repo: https://github.com/vercel/turborepo
stars: 31363
domain: frontend
category: build-tooling
description: JavaScript·TypeScript 모노레포의 작업 실행기. 패키지 의존 그래프 순서로 build·test를 병렬 실행하고 결과를 로컬·원격에 캐시한다.
pricing: oss
tags: [monorepo, task-runner, cache]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Turborepo는 npm·pnpm·Yarn·Bun 워크스페이스 위에서 동작하는 모노레포 작업 실행기다. 각 패키지의 `package.json` 스크립트를 그대로 쓰되, `turbo.json`에 작업 간 의존 관계와 출력물을 선언하면 실행 순서·병렬화·캐시를 대신 관리한다. 이 문서는 **v2** 기준이다(npm `latest` 2.11.12). Vercel이 관리하며 공식 사이트가 turborepo.dev로 옮겨졌다.

- 패키지 설치·링크는 패키지 매니저([pnpm](/develop-wiki/frontend/build-tooling/pnpm/) 등)가, 작업 실행과 캐시는 Turborepo가 맡는 분업 구조다.
- 코드 생성기·플러그인·프로젝트 그래프 분석까지 포함한 더 큰 도구가 필요하면 Nx가 대안이다.

## 설치
```bash
npx create-turbo@latest               # 앱 2개 + 공유 패키지 3개 예제 생성
# 기존 저장소에 추가 (pnpm, 루트에 설치)
pnpm add turbo --save-dev --ignore-workspace-root-check
```

전역 바이너리도 있다(macOS/Linux `curl -fsSL https://turborepo.dev/install | sh`). 저장소에 로컬 `turbo`가 있으면 전역 명령이 그 버전을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `turbo.json` | 루트(필요하면 패키지별)에 두는 작업 설정. `tasks` 아래에 작업 이름별 정의 |
| `dependsOn` | 먼저 끝나야 하는 작업. `^build`는 "의존 패키지들의 build 먼저" |
| `outputs` | 캐시에 저장·복원할 파일 glob(예 `dist/**`) |
| `inputs` | 해시에 넣을 입력 파일. `$TURBO_DEFAULT$`로 기본값 유지 후 제외 추가 |
| `env` / `globalEnv` | 해시에 포함할 환경 변수. 값이 바뀌면 캐시 미스 |
| `cache: false` / `persistent: true` | 캐시하지 않음 / dev 서버처럼 끝나지 않는 작업 |
| 원격 캐시 | 팀·CI가 작업 결과를 공유. Vercel 또는 공개 API 규격을 따르는 자체 서버 |

## 기본 사용법
`turbo.json`:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": ["tsconfig.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "!README.md"],
      "env": ["API_URL"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": { "dependsOn": ["build"] },
    "lint": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

```bash
turbo run build                  # 전체 패키지 build (의존 순서, 병렬)
turbo run build lint test        # 여러 작업 한 번에
turbo run dev --filter=web       # web 패키지만
```

## 자주 쓰는 패턴
- **필터.** `--filter=web...`는 web과 그 의존 패키지, `--filter=...ui`는 ui에 의존하는 패키지, `--filter=./apps/*`는 디렉터리 기준이다.
- **바뀐 것만 CI.** `turbo run test --affected`는 기본으로 `main...HEAD` 사이 변경과 그 영향을 받는 패키지만 실행한다.
- **원격 캐시.** `npx turbo login` 후 `npx turbo link`로 Vercel 원격 캐시에 연결한다. 자체 서버는 `turbo login --manual`로 API URL·팀·토큰을 넣는다.
- **캐시 미스 디버깅.** `--summarize`가 `.turbo/runs`에 해시·입력 정보를 남기고, `--dry`는 실행 없이 계획만 보여 준다. `--force`는 캐시를 무시한다.
- **그래프 확인.** `turbo run build --graph=graph.svg`(svg·html·mermaid·dot).

## 언제 쓰나 / 피할 때
- 쓸 때: 앱과 공유 패키지가 여럿인 JS/TS 모노레포에서 빌드·테스트 시간을 캐시로 줄이고 싶을 때, 설정을 적게 두고 기존 `package.json` 스크립트를 유지하고 싶을 때.
- 피할 때(대안): 패키지가 하나뿐이면 불필요하다. 코드 생성·모듈 경계 규칙·다언어 프로젝트 지원까지 필요하면 Nx, pnpm 워크스페이스 기본 기능(`pnpm -r`, `--filter`)만으로 충분한 작은 저장소도 많다.

## 공식 문서
- [설치](https://turborepo.dev/docs/getting-started/installation) · [`turbo.json` 레퍼런스](https://turborepo.dev/docs/reference/configuration) · [`turbo run`](https://turborepo.dev/docs/reference/run)
- [원격 캐시](https://turborepo.dev/docs/core-concepts/remote-caching) · [릴리스](https://github.com/vercel/turborepo/releases)

---
name: Nx
url: https://nx.dev
docs: https://nx.dev/docs/getting-started/intro
repo: https://github.com/nrwl/nx
stars: 29499
domain: frontend
category: build-tooling
description: 프로젝트 의존 그래프를 분석해 작업을 순서대로 병렬 실행하고 결과를 캐시하는 모노레포 빌드 시스템. 플러그인·코드 생성기·affected 실행이 필요한 큰 모노레포에 쓴다.
pricing: oss
tags: [monorepo, task-runner, cache, affected, codegen]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Nx는 워크스페이스 안의 프로젝트와 그 사이 의존 관계를 **프로젝트 그래프**로 만들고, 그 그래프를 따라 `build`·`test`·`lint` 같은 작업을 올바른 순서로 병렬 실행하며 결과를 캐시하는 빌드 시스템이다. 변경된 코드에 영향받는 프로젝트만 실행하는 **affected**, 프레임워크별 플러그인이 설정 파일을 읽어 작업을 자동으로 만드는 **추론 작업(inferred tasks)**, 코드 생성기(generator), 모듈 경계 규칙을 제공한다. 이 문서는 **v24** 기준이다(npm `nx` `latest` 24.0.6, 24.0.0은 2026-10 출시). Nrwl이 MIT 라이선스로 관리한다.

- 원격 캐시·분산 실행·CI 자동 수정은 유료 클라우드 **Nx Cloud**가 맡는다(무료 Hobby 플랜 월 50K 크레딧, Team 월 $29부터, Enterprise 별도 견적 — 2026-11 가격표 기준).
- 같은 위치의 [Turborepo](/develop-wiki/frontend/build-tooling/turborepo/)가 `package.json` 스크립트 실행·캐시에 집중한다면, Nx는 플러그인·생성기·그래프 분석·모듈 경계 등 범위가 더 넓다. 공식 플러그인으로 Java(Gradle·Maven)·.NET 프로젝트도 다룬다.

## 설치
새 워크스페이스:

```bash
npx create-nx-workspace@latest
```

기존 저장소(npm·pnpm 워크스페이스 등)에 추가:

```bash
npx nx@latest init
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 프로젝트 그래프 | 코드 import·`package.json` 의존성을 분석한 프로젝트 간 관계. `nx graph`로 시각화 |
| 작업 파이프라인 | `dependsOn: ["^build"]` = 의존 프로젝트의 build를 먼저 실행 |
| 캐시 | `cache: true`인 작업은 입력(파일·환경)이 같으면 이전 출력·로그를 재사용 |
| `inputs` / `namedInputs` | 캐시 키에 포함할 파일 집합. `production`처럼 이름 붙여 재사용 |
| `outputs` | 캐시에서 복원할 출력 경로 (`{projectRoot}/dist`) |
| affected | 기준 브랜치 대비 변경에 영향받는 프로젝트만 실행 |
| 플러그인 | `@nx/vite`, `@nx/eslint` 등. 설정 파일을 읽어 작업을 추론하고 generator 제공 |
| `nx.json` / `project.json` | 워크스페이스 전역 설정 / 프로젝트별 설정(없으면 `package.json`) |

## 기본 사용법
`nx.json` 예:

```json
{
  "plugins": ["@nx/eslint/plugin"],
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts"]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["production", "^production"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": { "cache": true }
  }
}
```

자주 쓰는 명령:

```bash
nx build web                 # 한 프로젝트의 build (의존 프로젝트 build 먼저)
nx run-many -t build test    # 모든 프로젝트의 build, test
nx affected -t lint test     # 변경 영향 범위만
nx graph                     # 프로젝트·작업 그래프 보기
```

## 자주 쓰는 패턴
- **CI에서 affected만:** PR 파이프라인은 `nx affected -t lint test build`로 바뀐 범위만 검사하고, 원격 캐시로 다른 브랜치의 결과를 재사용한다.
- **테스트 파일은 캐시 키에서 제외:** `production` named input에서 spec 파일을 빼 두면 테스트만 바꿨을 때 build 캐시가 유지된다.
- **모듈 경계 규칙:** 프로젝트에 `tags`를 달고 ESLint 규칙(`@nx/enforce-module-boundaries`)으로 레이어 간 import를 제한한다.
- **생성기로 일관된 구조:** `nx g @nx/react:library ...`처럼 플러그인 generator로 새 라이브러리를 같은 규칙으로 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 수십 개 이상 프로젝트가 있는 모노레포, 프레임워크·언어가 섞인 저장소, 아키텍처 경계를 도구로 강제하고 싶을 때.
- 피할 때(대안): 패키지 몇 개짜리 저장소에서 스크립트 실행·캐시만 필요하면 [Turborepo](/develop-wiki/frontend/build-tooling/turborepo/)나 [pnpm](/develop-wiki/frontend/build-tooling/pnpm/) 워크스페이스의 `--filter`만으로 충분하다.

## 공식 문서
- [소개](https://nx.dev/docs/getting-started/intro) · [새 프로젝트 시작](https://nx.dev/docs/getting-started/start-new-project) · [기존 저장소에 추가](https://nx.dev/docs/getting-started/start-with-existing-project) · [nx.json 레퍼런스](https://nx.dev/docs/reference/nx-json)
- [Nx Cloud 가격](https://nx.dev/pricing) · [GitHub 릴리스](https://github.com/nrwl/nx/releases)

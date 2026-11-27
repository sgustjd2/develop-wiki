---
name: pnpm
url: https://pnpm.io
docs: https://pnpm.io/installation
repo: https://github.com/pnpm/pnpm
stars: 37169
domain: frontend
category: build-tooling
description: 전역 콘텐츠 주소 저장소와 심볼릭 링크로 node_modules를 구성하는 JavaScript 패키지 매니저. 디스크·설치 시간을 줄이고 모노레포 워크스페이스를 관리할 때 쓴다.
pricing: oss
tags: [package-manager, monorepo, workspace]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
pnpm은 npm 레지스트리 패키지를 설치하는 패키지 매니저다. 모든 패키지 파일을 머신 단위 저장소에 한 번만 두고 프로젝트에는 하드링크·심볼릭 링크로 연결하며, `package.json`에 선언하지 않은 패키지는 import할 수 없는 엄격한 `node_modules` 구조를 만든다. 이 문서는 **v12** 기준이다(npm `latest` 12.21.0).

- 12는 **Rust로 다시 작성한 네이티브 실행 파일**이다. pnpm 11의 명령·플래그·설정·lockfile 형식을 유지한다.
- 워크스페이스·카탈로그를 기본 제공해 모노레포의 의존성 관리 도구로 많이 쓰이고, 작업 실행 캐시는 [Turborepo](/develop-wiki/frontend/build-tooling/turborepo/) 같은 도구와 조합한다.

## 설치
```bash
npm install -g pnpm@latest                      # npm 패키지는 Node 18 이상에서 설치
curl -fsSL https://get.pnpm.io/install.sh | sh -   # Node 없이 단독 설치(POSIX)
pnpm self-update                                 # 11.10.0 이상에서 업데이트
```

12는 설치 후 Node.js 없이 실행된다. 프로젝트별 버전은 `package.json`의 `packageManager` 필드로 고정한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 콘텐츠 주소 저장소 | 파일을 해시로 한 번만 저장하고 프로젝트에 링크. 여러 프로젝트가 디스크를 공유 |
| 엄격한 `node_modules` | 선언한 의존성만 최상위에 보임. 유령 의존성(phantom dependency)을 막는다 |
| `pnpm-workspace.yaml` | 워크스페이스 패키지 목록 + 대부분의 pnpm 설정. `.npmrc`는 인증·레지스트리·TLS·프록시만 |
| `workspace:` 프로토콜 | 로컬 워크스페이스 패키지로만 해석. 배포 시 실제 버전으로 치환 |
| 카탈로그 | 워크스페이스 공통 버전을 한 곳에 정의하고 `"catalog:"`로 참조 |
| `allowBuilds` | 의존성의 설치 스크립트(postinstall 등)는 **기본 차단**. 허용할 패키지만 명시 |
| `minimumReleaseAge` | 공개된 지 일정 시간(분 단위, 기본 1440)이 지난 버전만 설치. 공급망 공격 완화 |

## 기본 사용법
```bash
pnpm install                 # lockfile 기준 설치 (CI는 --frozen-lockfile)
pnpm add react               # 의존성 추가
pnpm add -D vitest           # 개발 의존성
pnpm dlx create-vite         # 설치 없이 실행 (npx 대응)
pnpm -r run build            # 모든 워크스페이스 패키지에서 실행
pnpm --filter web dev        # 특정 패키지만
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*

catalog:
  react: ^19.2.0
  typescript: ^7.0.0

allowBuilds:
  esbuild: true
  core-js: false
```

패키지 쪽 `package.json`에서는 `"react": "catalog:"`, `"@acme/ui": "workspace:*"`처럼 참조한다.

## 자주 쓰는 패턴
- **빌드 스크립트 승인.** 새 의존성이 설치 스크립트를 가지면 기본으로 오류가 난다(`strictDepBuilds`). `pnpm approve-builds`로 검토하면 결과가 `allowBuilds`에 기록된다.
- **필터.** `--filter web...`(web과 의존 패키지), `--filter "...[origin/main]"`(변경된 패키지와 그 의존자)처럼 그래프 기준으로 고른다.
- **이름 있는 카탈로그.** `catalogs:` 아래 `react18:` 같은 그룹을 두고 `"catalog:react18"`로 참조해 버전 묶음을 나눈다.
- **호이스팅이 필요한 도구.** 평평한 `node_modules`를 기대하는 오래된 도구는 `nodeLinker`·`publicHoistPattern`(워크스페이스 파일에서만 설정 가능)으로 맞춘다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모노레포, 같은 머신에 프로젝트가 많아 디스크·설치 시간이 문제일 때, 선언하지 않은 의존성 사용을 막고 싶을 때.
- 피할 때(대안): 런타임까지 하나로 통합하려면 Bun, 생태계 기본값과 최대 호환성이 우선이면 npm. 평평한 `node_modules`에 의존하는 레거시 도구가 많으면 설정 조정이 필요하다.
- 11 → 12로 올릴 때: `install --resolution-only`는 오류(대신 `pnpm peers check`), `--frozen-lockfile false` 대신 `--no-frozen-lockfile`. GitHub·GitLab·Bitbucket Git 의존성은 HTTPS URL로 기록되고, Linux에서 `packageImportMethod: auto`가 하드링크를 먼저 시도한다. lockfile 형식은 그대로지만 순환 의존성의 peer 변형이 한 번 다시 써질 수 있다.

## 공식 문서
- [설치](https://pnpm.io/installation) · [워크스페이스](https://pnpm.io/workspaces) · [카탈로그](https://pnpm.io/catalogs) · [필터링](https://pnpm.io/filtering)
- [설정](https://pnpm.io/settings) · [pnpm 12에서 달라진 점](https://pnpm.io/blog/whats-different-in-pnpm-12) · [동기(설계 배경)](https://pnpm.io/motivation)

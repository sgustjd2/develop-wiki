---
name: Dev Containers
url: https://containers.dev
docs: https://containers.dev/implementors/json_reference/
repo: https://github.com/devcontainers/cli
stars: 3035
domain: devtools
category: environment
description: devcontainer.json 하나로 개발에 필요한 컨테이너 이미지·도구·에디터 확장을 정의하는 개방형 명세. 팀 전체가 같은 개발 환경을 쓰게 할 때 쓴다.
pricing: oss
tags: [container, docker, devcontainer, codespaces, reproducible]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Development Container 명세는 `.devcontainer/devcontainer.json`에 기반 이미지(또는 Dockerfile·Compose), 추가 도구("Features"), 포트, 설치 후 명령, 에디터 설정을 적어 컨테이너 안에서 개발하게 한다. VS Code Dev Containers 확장, GitHub Codespaces, JetBrains, 참조 구현인 `@devcontainers/cli`(2026-11 기준 0.90.0, MIT)가 같은 파일을 읽는다. 로컬에서는 [Docker](/develop-wiki/backend/infra-devops/docker/) 호환 런타임이 필요하다.

## 설치
```bash
npm install -g @devcontainers/cli
# VS Code: "Dev Containers" 확장 설치 후 "Reopen in Container"
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `image` / `build.dockerfile` / `dockerComposeFile` | 컨테이너를 만드는 세 가지 방법 |
| Features | `ghcr.io/devcontainers/features/node:1`처럼 OCI로 배포되는 설치 단위 |
| Templates | 언어별 시작 구성 모음 |
| 수명 주기 명령 | `onCreateCommand`, `postCreateCommand`, `postStartCommand` 등 |
| `forwardPorts` | 컨테이너 포트를 로컬로 전달 |
| `customizations` | 도구별 설정. `vscode.extensions`, `vscode.settings` |
| `remoteUser` | 컨테이너 안 작업 사용자 |

## 기본 사용법
`.devcontainer/devcontainer.json`:

```jsonc
{
  "name": "web-app",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "24" },
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm ci",
  "customizations": {
    "vscode": { "extensions": ["dbaeumer.vscode-eslint"] }
  }
}
```

```bash
devcontainer up --workspace-folder .            # 빌드·실행
devcontainer exec --workspace-folder . npm test # 컨테이너 안에서 명령
```

## 자주 쓰는 패턴
- **DB까지 함께.** `dockerComposeFile`로 앱 컨테이너와 PostgreSQL·Redis 서비스를 같이 띄우고 `service`로 작업 컨테이너 지정.
- **CI와 같은 환경.** `devcontainers/ci` GitHub Action이나 CLI로 CI에서도 같은 컨테이너에서 테스트.
- **빌드 시간 줄이기.** 자주 바뀌지 않는 부분은 미리 빌드한 이미지로 올리고 `image`로 참조.
- **macOS 파일 성능.** 큰 `node_modules`는 named volume으로 마운트하면 바인드 마운트보다 빠르다.

## 언제 쓰나 / 피할 때
- 쓸 때: 신규 입사자 환경 설정 시간을 줄이고 싶을 때, 시스템 의존성(네이티브 라이브러리, DB 클라이언트)이 많은 프로젝트, Codespaces 사용.
- 피할 때(대안): 언어 런타임 버전만 맞추면 되면 [mise](/develop-wiki/devtools/environment/mise/)가 가볍다. 컨테이너 없이 선언형 재현이 필요하면 [Nix](/develop-wiki/devtools/environment/nix/).

## 공식 문서
- [devcontainer.json 레퍼런스](https://containers.dev/implementors/json_reference/) · [Features](https://containers.dev/features) · [Templates](https://containers.dev/templates)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) · [CLI](https://github.com/devcontainers/cli)

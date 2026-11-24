---
name: mise
url: https://mise.jdx.dev/
docs: https://mise.jdx.dev/getting-started.html
repo: https://github.com/jdx/mise
stars: 36467
domain: devtools
category: environment
description: 프로젝트별 런타임·CLI 도구 버전, 환경 변수, 작업(task)을 mise.toml 하나로 관리하는 개발 환경 관리자. asdf·nvm·pyenv를 대체할 때 쓴다.
pricing: oss
tags: [version-manager, asdf, node, python, task-runner]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
mise(발음 "미즈")는 Node·Python·Go·Java 등 런타임과 각종 CLI 도구의 버전을 디렉터리별로 바꿔 주는 Rust 도구다. asdf 플러그인 형식과 `.tool-versions` 파일을 읽을 수 있어 asdf에서 옮기기 쉽고, 환경 변수(`[env]`)와 작업 실행(`[tasks]`)까지 한 설정 파일에서 다룬다. 버전은 날짜 형식이며 2026-11 기준 **v2026.11.9**(MIT).

- 대안: asdf(셸 플러그인 기반 원조), 언어별 관리자(nvm, pyenv, rbenv), 완전 재현은 [Nix](/develop-wiki/devtools/environment/nix/).

## 설치
```bash
curl -fsSL https://mise.run | sh     # 또는 brew install mise
# 셸 활성화 (zsh)
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `mise.toml` | 프로젝트 설정. `[tools]`, `[env]`, `[tasks]` 섹션 |
| 전역 설정 | `~/.config/mise/config.toml` (`mise use -g`) |
| activate | 디렉터리 진입 시 PATH·환경 변수를 자동 전환 |
| `mise exec` / `mise x` | 활성화 없이 지정 도구로 명령 실행 (CI에 유용) |
| 백엔드 | 코어 런타임, aqua, ubi, npm, pipx, cargo, asdf 플러그인 등에서 도구 설치 |
| `.tool-versions` | asdf 호환 파일도 읽음 |

## 기본 사용법
```bash
cd my-app
mise use node@24 python@3.13       # 설치 + mise.toml 기록
mise use -g node@lts               # 전역 기본값
mise ls                            # 현재 활성 도구
mise install                       # mise.toml 에 적힌 도구 설치 (클론 직후)
mise upgrade                       # 허용 범위 안 최신으로
```

`mise.toml`:

```toml
[tools]
node = "24"
python = "3.13"
"npm:pnpm" = "latest"

[env]
DATABASE_URL = "postgres://localhost:5432/app"
_.file = ".env"            # .env 파일 로드

[tasks.dev]
run = "pnpm dev"

[tasks.test]
run = "pnpm test"
depends = ["lint"]
```

```bash
mise run dev       # 또는 mise dev
mise tasks         # 작업 목록
```

## 자주 쓰는 패턴
- **팀 버전 고정.** `mise.toml`을 커밋해 팀원·CI가 같은 런타임을 쓰게 한다. CI에서는 공식 GitHub Action(`jdx/mise-action`)이나 `mise install && mise x -- npm test`.
- **asdf에서 이전.** 기존 `.tool-versions`를 그대로 두고 mise로 바꾼 뒤 점진적으로 `mise.toml`로 옮긴다.
- **도구 신뢰.** 처음 보는 저장소의 설정은 `mise trust` 후에만 적용된다.
- **진단.** `mise doctor`로 활성화·PATH 문제를 확인.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 언어·버전이 섞인 프로젝트를 오갈 때, Makefile·npm scripts 대신 언어 중립 작업 러너가 필요할 때.
- 피할 때(대안): 시스템 라이브러리까지 비트 단위로 재현해야 하면 Nix나 [Dev Containers](/develop-wiki/devtools/environment/dev-containers/).

## 공식 문서
- [시작하기](https://mise.jdx.dev/getting-started.html) · [설정](https://mise.jdx.dev/configuration.html) · [작업(tasks)](https://mise.jdx.dev/tasks/)
- [asdf에서 이전](https://mise.jdx.dev/faq.html) · [릴리스](https://github.com/jdx/mise/releases)

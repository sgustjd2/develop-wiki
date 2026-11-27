---
name: Codex CLI
url: https://chatgpt.com/codex
docs: https://developers.openai.com/codex/cli
repo: https://github.com/openai/codex
stars: 136672
domain: ai
category: coding-agent
description: 로컬 터미널에서 코드를 읽고 수정·실행하는 OpenAI의 오픈소스 코딩 에이전트. ChatGPT 요금제나 API 키로 쓰고, 샌드박스·승인 정책으로 실행 범위를 제한한다.
pricing: oss
tags: [agent, cli, openai, agents-md]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-23
---

## 개요
Codex CLI 는 OpenAI 가 만든 터미널용 코딩 에이전트다. Rust 로 작성된 단일 바이너리이며 Apache-2.0 으로 공개돼 있다. 프로젝트 폴더에서 실행하면 모델이 파일 읽기·편집·셸 실행을 반복하며 작업하고, OS 수준 샌드박스와 승인 정책으로 무엇을 묻지 않고 실행할지 정한다.
같은 이름 아래 IDE 확장, 데스크톱 앱(`codex app`), 클라우드 에이전트(Codex Web)가 있고 CLI 는 그중 로컬 실행 담당이다. 2026-11-18 기준 최신 릴리스는 **0.170.0**(`rust-v0.170.0`, npm `@openai/codex@0.170.0`)이며 거의 매일 릴리스된다.
[Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 와 같은 계열의 도구로, 프로젝트 지침 파일로 `AGENTS.md` 를 쓰는 것이 특징이다.

## 설치
```bash
# macOS / Linux (독립 설치 스크립트, 같은 명령으로 업데이트)
curl -fsSL https://chatgpt.com/codex/install.sh | sh

# 패키지 매니저
npm install -g @openai/codex
brew install --cask codex
```

```powershell
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

처음 `codex` 를 실행하면 **Sign in with ChatGPT** 로 로그인한다. ChatGPT Plus·Pro·Business·Edu·Enterprise 요금제에 포함된 사용량으로 쓰거나, API 키로 쓸 수 있다(별도 설정 필요). CI 에서는 `CODEX_API_KEY` 환경 변수로 한 번의 실행에만 키를 준다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 샌드박스 모드 | `read-only`(기본) / `workspace-write` / `danger-full-access`. 쓰기·네트워크 범위를 OS 수준에서 제한 |
| 승인 정책 | `approval_policy`: `on-request`(모델이 필요할 때 질문, 기본) / `never` / `granular` 세부 설정 |
| `AGENTS.md` | 전역(`~/.codex/AGENTS.md`)과 저장소 루트→현재 디렉터리의 파일을 이어 붙여 지침으로 사용 |
| `config.toml` | `~/.codex/config.toml`(사용자) 또는 `.codex/config.toml`(프로젝트) |
| 프로필 | `~/.codex/<이름>.config.toml` 같은 별도 파일, `codex --profile <이름>` 으로 선택 |
| MCP | `codex mcp` 로 로컬(stdio)·원격(Streamable HTTP) [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버 추가 |
| `codex exec` | 비대화형 실행. 스크립트·CI 용 |
| `codex cloud` | 작업을 클라우드 환경에 보내고 결과를 로컬에 적용 |

## 기본 사용법
```bash
cd my-project
codex                                  # 대화형 세션
codex "실패하는 테스트를 고쳐 줘"           # 첫 프롬프트와 함께 시작
codex resume                           # 이 저장소의 이전 대화 다시 열기
codex --search "이 라이브러리 최신 API로 바꿔 줘"   # 웹 검색 허용
```

세션 안 슬래시 명령: `/init`(AGENTS.md 생성), `/permissions`(승인·샌드박스 범위 확인/변경), `/model`, `/review`(변경 사항 리뷰), `/status`.

`~/.codex/config.toml` 예시:

```toml
model_reasoning_effort = "medium"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false

[mcp_servers.docs]
command = "npx"
args = ["-y", "my-docs-mcp-server"]

[mcp_servers.tracker]
url = "https://mcp.example.com/mcp"
```

## 자주 쓰는 패턴
- **AGENTS.md 계층**: 저장소 루트에 공통 규칙, 하위 패키지에 패키지별 규칙을 둔다. 디렉터리마다 `AGENTS.override.md` → `AGENTS.md` 순으로 하나만 읽고, 합친 크기는 `project_doc_max_bytes`(기본 32 KiB)까지만 넣는다. 다른 파일명을 쓰려면 `project_doc_fallback_filenames = ["TEAM_GUIDE.md"]`.
- **CI 자동화**: `--full-auto` 는 더 이상 지원되지 않는다. 쓰기가 필요하면 `--sandbox workspace-write` 를 명시한다.
  ```bash
  codex exec --sandbox workspace-write \
    --output-schema ./schema.json -o result.json \
    "CHANGELOG 초안을 만들고 요약을 스키마에 맞춰 반환해 줘"
  ```
- **이벤트 스트림**: `codex exec --json "..."` 은 stdout 을 JSONL 이벤트로 내보낸다. 이어서 작업하려면 `codex exec resume --last`.
- **저장소 밖에서 실행**: Git 저장소가 아닌 곳에서는 `--skip-git-repo-check` 가 필요하다. 세션 기록을 남기지 않으려면 `--ephemeral`.
- **IDE·클라우드와 병행**: 긴 작업은 `codex cloud` 로 넘기고 결과만 로컬에 적용한다.

## 언제 쓰나 / 피할 때
- 쓸 때: ChatGPT 요금제를 이미 쓰고 있고 터미널 중심으로 작업할 때, `AGENTS.md` 를 여러 에이전트와 공유하는 저장소, 샌드박스 경계를 엄격히 두고 CI 에서 에이전트를 돌릴 때.
- 피할 때(대안): 모델 공급자를 자유롭게 바꾸고 싶으면 [Cline](/develop-wiki/ai/coding-agent/cline/) 처럼 여러 공급자를 지원하는 도구가 낫다. 에디터 안에서 인라인 자동완성이 주 용도라면 [GitHub Copilot](/develop-wiki/ai/coding-agent/github-copilot/) 이나 [Cursor](/develop-wiki/ai/coding-agent/cursor/) 가 맞다. `danger-full-access` 는 격리된 컨테이너에서만 쓴다.

## 공식 문서
- [Codex CLI](https://developers.openai.com/codex/cli) · [설정 예시(config.toml)](https://developers.openai.com/codex/config-sample) · [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [비대화형 실행](https://developers.openai.com/codex/noninteractive) · [보안·샌드박스](https://developers.openai.com/codex/security) · [GitHub 릴리스](https://github.com/openai/codex/releases)

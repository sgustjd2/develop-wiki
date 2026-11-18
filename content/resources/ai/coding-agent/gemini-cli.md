---
name: Gemini CLI
url: https://geminicli.com
docs: https://geminicli.com/docs/
repo: https://github.com/google-gemini/gemini-cli
domain: ai
category: coding-agent
description: Gemini 모델로 동작하는 Google의 오픈소스 터미널 코딩 에이전트. 2026년 6월부터 Gemini Code Assist 기업 라이선스·유료 API 키 사용자 대상으로 유지된다.
pricing: oss
tags: [agent, cli, gemini, google, mcp]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Gemini CLI(`gemini`)는 Google 이 Apache-2.0 으로 공개한 터미널용 AI 에이전트다. 파일 시스템·셸·웹 검색 도구와 MCP 서버를 써서 코드베이스 질의, 편집, 디버깅, 운영 작업 자동화를 한다. TypeScript(Node.js)로 작성됐고 npm `@google/gemini-cli` 로 배포된다. 2026-11-18 기준 최신 안정 버전은 **0.68.0**(2026-11-10)이다.
**지위 변화에 주의**: Google 은 2026-05-19 공지에 따라 2026-06-18 부터 무료 개인 사용자와 Google AI Pro·Ultra(Google One) 구독자를 [Antigravity CLI](https://antigravity.google/product/antigravity-cli)(`agy`)로 옮겼다. 현재 Gemini CLI 는 Gemini Code Assist Standard·Enterprise, Code Assist for GitHub(Google Cloud) 조직과 기존 유료 API·Vertex 키 사용자를 위한 도구로 유지되며, README 는 Gemini 4 이후 모델에 맞춰 조정되지 않았다고 밝힌다.
저장소 자체는 매주 릴리스가 나오는 활성 상태다.

## 설치
```bash
npx @google/gemini-cli                 # 설치 없이 실행
npm install -g @google/gemini-cli      # 전역 설치 (stable = latest 태그)
brew install gemini-cli                # Homebrew (macOS/Linux)
npm install -g @google/gemini-cli@preview   # 주간 프리뷰 채널
```

인증은 셋 중 하나다.

```bash
# 1) 조직의 Code Assist 라이선스로 Google 로그인
export GOOGLE_CLOUD_PROJECT="<프로젝트 id>"
gemini

# 2) Gemini API 키 (AI Studio 에서 발급, 값은 환경 변수로만)
export GEMINI_API_KEY="..."

# 3) Vertex AI
export GOOGLE_GENAI_USE_VERTEXAI=true
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `GEMINI.md` | 컨텍스트 파일. 전역 `~/.gemini/GEMINI.md` → 작업 디렉터리와 상위 → 도구가 접근한 폴더(JIT) 순으로 모아 매 프롬프트에 붙임 |
| `settings.json` | 사용자 `~/.gemini/settings.json`, 프로젝트 `.gemini/settings.json` |
| 승인 모드 | `--approval-mode` 값 `default` / `auto_edit`(편집 도구 자동 승인) / `plan` / `yolo`(전부 자동, 기본으로 샌드박스 활성) |
| MCP | `settings.json` 의 `mcpServers` 또는 `gemini mcp add` 로 [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버 등록 |
| 확장(Extensions) | 명령·도구·MCP 설정을 묶어 배포하는 단위 |
| 체크포인트 | 대화를 저장하고 되돌리기 |
| 헤드리스 모드 | `-p` 와 `--output-format json` / `stream-json` 으로 스크립트에서 실행 |

## 기본 사용법
```bash
cd my-project
gemini                                          # 대화형 세션
gemini --include-directories ../lib,../docs     # 작업 디렉터리 추가
gemini -p "이 코드베이스의 구조를 설명해 줘"          # 비대화형 1회 실행
gemini -p "테스트를 돌리고 결과를 요약해 줘" --output-format json
```

세션 안에서는 `/help`, `/memory show`(현재 로드된 GEMINI.md 내용), `/memory reload`, `/chat`(대화 저장·복원), `/bug` 등을 쓴다.

`.gemini/settings.json` 예시:

```json
{
  "context": { "fileName": ["AGENTS.md", "GEMINI.md"] },
  "mcpServers": {
    "local-docs": { "command": "npx", "args": ["-y", "my-docs-mcp-server"] }
  }
}
```

## 자주 쓰는 패턴
- **AGENTS.md 공유**: `context.fileName` 에 `AGENTS.md` 를 넣으면 다른 에이전트와 같은 지침 파일을 읽는다.
- **편집만 자동 승인**: `gemini --approval-mode auto_edit` 은 파일 편집은 자동, 셸 명령은 확인을 받는다.
- **MCP 서버 추가**:
  ```bash
  gemini mcp add --transport http tracker https://mcp.example.com/mcp/
  gemini mcp add -e LOG_LEVEL=debug local-tool node ./tools/server.js
  ```
- **CI 이벤트 스트림**: `--output-format stream-json` 은 줄 단위 JSON 이벤트를 내보내 장시간 작업 모니터링에 쓴다.
- **신뢰 폴더·샌드박스**: Trusted Folders 로 폴더별 실행 정책을 두고, `yolo` 는 샌드박스 안에서만 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 조직이 Gemini Code Assist 라이선스나 Vertex AI 를 쓰고 있어 그 계약 안에서 터미널 에이전트가 필요할 때, 오픈소스 에이전트 구현을 직접 고쳐 쓰거나 확장을 만들 때.
- 피할 때(대안): 개인·무료 사용자나 최신 Gemini 4 계열을 쓰려면 Google 이 안내하는 Antigravity CLI 로 간다. 공급자 중립 도구가 필요하면 [Cline](/develop-wiki/ai/coding-agent/cline/), 구독형 도구는 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) · [Codex CLI](/develop-wiki/ai/coding-agent/codex-cli/) 가 대안이다.

## 공식 문서
- [문서 홈](https://geminicli.com/docs/) · [설치](https://www.geminicli.com/docs/get-started/installation) · [인증](https://www.geminicli.com/docs/get-started/authentication) · [설정](https://www.geminicli.com/docs/reference/configuration)
- [GEMINI.md](https://www.geminicli.com/docs/cli/gemini-md) · [MCP 서버](https://www.geminicli.com/docs/tools/mcp-server) · [헤드리스 모드](https://www.geminicli.com/docs/cli/headless)
- [Antigravity CLI 전환 공지](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)

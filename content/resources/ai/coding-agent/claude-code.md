---
name: Claude Code
url: https://www.claude.com/product/claude-code
domain: ai
category: coding-agent
description: 터미널·IDE·데스크톱에서 코드베이스를 읽고 수정하는 Anthropic의 에이전트형 코딩 도구.
pricing: paid
tags: [agent, cli]
docs: https://code.claude.com/docs/en/overview
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Claude Code 는 Anthropic 의 에이전트형 코딩 도구다. 프로젝트 폴더에서 실행하면 Claude 모델이 파일 읽기·검색·편집·셸 실행 같은 내장 도구로 코드베이스를 직접 탐색하고 수정하며, 위험한 동작은 권한 모드에 따라 사용자 승인을 받는다.
터미널 CLI 가 중심이고, 같은 엔진을 데스크톱 앱, VS Code·JetBrains 확장, 웹, Slack, GitHub Actions·GitLab CI 에서도 쓸 수 있다. 같은 에이전트 루프를 Python·TypeScript 로 가져다 쓰는 것이 Agent SDK 다.
자동완성 중심의 IDE 보조 도구와 달리, 여러 파일에 걸친 작업을 계획·실행·검증까지 맡기는 쪽에 가깝다.

## 설치
```bash
# macOS / Linux / WSL (네이티브 설치, 자동 업데이트)
curl -fsSL https://claude.ai/install.sh | bash

# Homebrew (자동 업데이트 없음)
brew install --cask claude-code
```

```powershell
# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
# 또는
winget install Anthropic.ClaudeCode
```

설치 뒤 `claude --version` 으로 확인한다. Claude 구독(Pro·Max·Team·Enterprise 등), Claude Console(API 크레딧), 또는 Amazon Bedrock·Google Cloud·Microsoft Foundry 계정이 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 에이전트 루프 | 모델이 도구를 호출 → 결과를 보고 → 다음 행동을 정하는 반복 |
| 권한 모드 | 어떤 동작을 묻지 않고 할지 정함 (Manual, `acceptEdits`, `auto`, `dontAsk` 등). `Shift+Tab` 으로 전환 |
| `CLAUDE.md` | 매 세션 자동으로 읽는 프로젝트 규칙·명령 메모. 상위 디렉터리부터 누적 로드 |
| 스킬 | `.claude/skills/<이름>/SKILL.md`. 필요할 때 불러오는 지식·절차, `/이름` 으로 직접 호출 |
| 서브에이전트 | `.claude/agents/` 에 정의하는 독립 컨텍스트 작업자. 요약만 돌려줘 메인 컨텍스트를 아낌 |
| 훅 | 도구 실행 전후·세션 시작 등 이벤트에 셸 명령·HTTP 요청 등을 강제로 실행 |
| MCP | [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버로 외부 시스템(DB, 이슈 트래커, 브라우저) 도구를 추가 |
| 플러그인 | 스킬·훅·서브에이전트·MCP 서버를 묶어 배포하는 단위. 마켓플레이스로 공유 |

## 기본 사용법
```bash
cd my-project
claude                         # 대화형 세션 시작 (첫 실행 시 로그인)
claude "빌드 에러 고쳐 줘"        # 첫 프롬프트와 함께 시작
claude -c                      # 이 디렉터리의 최근 대화 이어가기
claude -p "auth 모듈이 하는 일을 요약해 줘"   # 비대화형 1회 실행 후 종료
```

세션 안에서는 `/help`(명령 목록), `/clear`(새 대화), `/resume`, `/mcp`(서버 상태), `/login` 등을 쓴다.

프로젝트 스킬 예시 — `.claude/skills/release-notes/SKILL.md`:

```markdown
---
name: release-notes
description: 마지막 태그 이후 커밋으로 릴리스 노트 초안을 쓴다. "릴리스 노트" 요청에 사용.
---
1. `git describe --tags --abbrev=0` 으로 마지막 태그를 찾는다.
2. 그 이후 커밋을 기능/수정/기타로 묶는다.
3. CHANGELOG.md 맨 위에 초안을 추가하고 커밋은 하지 않는다.
```

## 자주 쓰는 패턴
- **CLAUDE.md 를 짧게 유지**: 빌드·테스트 명령과 "항상/절대" 규칙만 두고(공식 권장 200줄 이하), 긴 참고 자료는 스킬로 뺀다.
- **MCP 서버 추가**: `claude mcp add --transport http <이름> <URL>`. 팀과 공유하려면 `--scope project` 로 저장소의 `.mcp.json` 에 기록한다. 토큰은 `${API_KEY}` 처럼 환경 변수로 참조한다.
- **규칙은 훅으로 강제**: "`.env` 수정 금지" 같은 규칙은 CLAUDE.md 가 아니라 `PreToolUse` 훅으로 막고, 편집 뒤 린트는 `PostToolUse` 훅으로 돌린다.
- **CI·스크립트**: `claude --bare -p "..." --allowedTools "Read,Edit,Bash" --output-format json`. `--bare` 는 로컬 훅·플러그인·CLAUDE.md 자동 로드를 건너뛰어 재현성이 높고, 인증은 `ANTHROPIC_API_KEY` 환경 변수로 준다.
- **구조화 출력**: `--output-format json --json-schema '<스키마>'` 로 결과를 `structured_output` 필드에 받는다.
- **로컬 모델로 실행**: [Ollama](/develop-wiki/ai/inference-serving/ollama/) 의 `ollama launch claude` 로 오픈 웨이트 모델을 백엔드로 붙일 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 파일에 걸친 기능 추가·리팩터링, 버그 재현과 수정, 낯선 코드베이스 파악, 테스트 작성, PR 리뷰·커밋 자동화, CI 안의 반복 작업.
- 피할 때(대안): 한 줄 자동완성 정도만 필요하면 IDE 인라인 보조 도구로 충분하다. 자체 서비스 안에 에이전트를 넣는 경우라면 Agent SDK 나 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/), [LangGraph](/develop-wiki/ai/agent-framework/langgraph/) 같은 프레임워크가 맞다. 승인 없이 셸을 실행하는 모드는 격리된 환경에서만 쓴다.

## 공식 문서
- [개요](https://code.claude.com/docs/en/overview) · [Quickstart](https://code.claude.com/docs/en/quickstart) · [CLI 레퍼런스](https://code.claude.com/docs/en/cli-reference)
- [확장 기능 개요](https://code.claude.com/docs/en/features-overview) · [CLAUDE.md(메모리)](https://code.claude.com/docs/en/memory) · [스킬](https://code.claude.com/docs/en/skills) · [훅](https://code.claude.com/docs/en/hooks-guide) · [MCP](https://code.claude.com/docs/en/mcp)
- [비대화형 실행 / Agent SDK](https://code.claude.com/docs/en/headless)

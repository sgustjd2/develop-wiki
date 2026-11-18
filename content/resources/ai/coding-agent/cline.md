---
name: Cline
url: https://cline.bot
docs: https://docs.cline.bot/cline-overview
repo: https://github.com/cline/cline
domain: ai
category: coding-agent
description: VS Code 확장·CLI·SDK로 쓰는 오픈소스 코딩 에이전트. 모델 공급자를 직접 고르고, Plan/Act 모드와 단계별 승인으로 파일 편집·명령 실행을 진행한다.
pricing: oss
tags: [agent, cli, vscode, byok, mcp]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Cline 은 Apache-2.0 으로 공개된 코딩 에이전트다. 처음에는 VS Code 확장(마켓플레이스 id `saoudrizwan.claude-dev`)으로 시작했고, 지금은 같은 에이전트 코어를 CLI, JetBrains 플러그인, 데스크톱 앱, Node.js SDK(`@cline/sdk`)가 공유한다.
특정 모델 회사에 묶이지 않고 Anthropic, OpenAI, Gemini, OpenRouter, Bedrock, Vertex, Ollama·LM Studio(로컬), OpenAI 호환 엔드포인트 등 공급자를 골라 쓰는 BYOK 구조가 특징이다. 기본은 모든 편집·명령을 사용자가 승인하는 방식이고, 체크포인트로 작업 전 상태로 되돌릴 수 있다.
2026-11-18 기준 VS Code 확장 v4.1.26, CLI(npm `cline`) 3.0.74 가 최신이다.

## 설치
```bash
# CLI (플랫폼별 바이너리가 함께 설치됨)
npm install -g cline

# SDK
npm install @cline/sdk
```

VS Code 는 마켓플레이스에서 "Cline" 을, JetBrains 는 JetBrains Marketplace 에서 설치한다. 처음 실행하면 Cline 계정 로그인, ChatGPT 구독 로그인(`openai-codex`), 또는 공급자 API 키 중 하나를 고른다.

```bash
cline auth                              # 대화형 인증 설정
cline auth cline                        # Cline 계정 OAuth
cline auth --provider anthropic --apikey "$ANTHROPIC_API_KEY" --modelid <모델 id>
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Plan / Act | Plan 은 코드를 탐색하고 계획만 세움, Act 는 실제로 편집·실행. 토글로 전환 |
| 승인·자동 승인 | 기본은 편집·명령마다 승인. 자동 승인(CLI 의 yolo)을 켜면 자율 실행 |
| 체크포인트 | 단계마다 작업 공간 스냅숏. 대화는 유지한 채 코드만 되돌림(CLI `/undo`) |
| Rules | `.clinerules/` 또는 `.cline/rules/` 의 마크다운 파일. `AGENTS.md`, `.cursorrules`, `.windsurfrules` 도 자동 인식 |
| Skills·Workflows·Hooks | `.cline/skills/`, `.cline/workflows/`, `.cline/hooks/` 에 두는 재사용 절차와 수명주기 훅 |
| MCP | `cline mcp` 로 [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버 추가. 설정은 `~/.cline/data/settings/cline_mcp_settings.json` |
| 설정 범위 | 전역 `~/.cline/`(IDE·CLI·SDK 공유) / 프로젝트 `.cline/`(저장소에 커밋) |

## 기본 사용법
```bash
cd my-project
cline                                   # 대화형 TUI (Plan/Act, 슬래시 명령, @파일 멘션)
cline "이 패키지를 점검하고 수정안을 제시해 줘"     # 한 번 실행 (기본 yolo)
cline --auto-approve false --plan "인증 흐름 리팩터링 계획만 세워 줘"
git diff origin/main | cline "이 변경에서 문제를 찾아 줘"
```

프로젝트 규칙 예시 — `.clinerules/testing.md`:

```markdown
# 테스트 규칙
- 새 함수에는 같은 폴더의 `*.test.ts` 에 단위 테스트를 추가한다.
- 테스트는 `pnpm test --run` 으로 실행하고, 실패하면 완료로 보고하지 않는다.
- `legacy/` 폴더는 수정하지 않는다.
```

## 자주 쓰는 패턴
- **계획 → 실행 분리**: 큰 변경은 Plan 모드에서 범위와 단계를 합의한 뒤 Act 로 넘긴다. "Use different models for Plan and Act" 를 켜면 계획에는 추론이 강한 모델, 구현에는 빠른 모델처럼 모드별로 모델을 따로 지정할 수 있다.
- **MCP 서버 추가**:
  ```bash
  cline mcp add files --yes -- npx -y @modelcontextprotocol/server-filesystem .
  cline mcp add docs https://example.com/mcp --transport http --yes
  ```
- **CI 헤드리스 실행**: `cline --json "FIXME 주석을 모두 나열해 줘"` 는 NDJSON 이벤트를 내보내므로 `jq` 로 후처리한다. 승인 없이 끝까지 돌리려면 `--yolo`.
- **반복 작업 예약**: `cline schedule create "PR 요약" --cron "0 9 * * MON-FRI" --prompt "열린 PR 상태를 정리해 줘" --workspace .`
- **로컬 모델**: [Ollama](/develop-wiki/ai/inference-serving/ollama/) 나 LM Studio 를 공급자로 지정해 코드를 외부로 보내지 않고 쓴다(모델 성능에 따라 도구 호출 품질 차이가 큼).

## 언제 쓰나 / 피할 때
- 쓸 때: 모델 공급자를 자유롭게 바꾸거나 사내 게이트웨이·로컬 모델을 써야 할 때, VS Code 안에서 diff 를 단계별로 승인하며 에이전트를 쓰고 싶을 때, 같은 에이전트를 SDK 로 자체 도구에 넣고 싶을 때.
- 피할 때(대안): 사용량을 정액 구독으로 관리하고 싶다면 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/), [Codex CLI](/develop-wiki/ai/coding-agent/codex-cli/), [GitHub Copilot](/develop-wiki/ai/coding-agent/github-copilot/) 처럼 요금제에 포함된 도구가 비용 예측이 쉽다. BYOK 는 긴 작업에서 API 비용이 빠르게 늘어난다.

## 공식 문서
- [개요](https://docs.cline.bot/cline-overview) · [설치](https://docs.cline.bot/getting-started/installing-cline) · [설정 위치](https://docs.cline.bot/getting-started/config)
- [Plan & Act](https://docs.cline.bot/core-workflows/plan-and-act) · [Rules](https://docs.cline.bot/customization/cline-rules) · [MCP](https://docs.cline.bot/mcp/mcp-overview) · [CLI 개요](https://docs.cline.bot/usage/cli-overview)

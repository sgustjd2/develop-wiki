---
name: Cursor
url: https://cursor.com
docs: https://cursor.com/docs
domain: ai
category: coding-agent
description: 에이전트 중심으로 만든 VS Code 기반 AI 코드 에디터. 에디터·터미널 CLI·클라우드 에이전트에서 코드베이스를 탐색하고 여러 파일을 수정한다.
pricing: freemium
tags: [agent, editor, cli, completion, cloud-agent]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Cursor 는 Anysphere 가 만든 AI 코드 에디터다. VS Code 를 기반으로 해 확장·단축키를 그대로 쓰면서, 에이전트(Agent·Plan·Ask 모드), Tab 자동완성, 규칙(Rules)·스킬·MCP 를 에디터에 통합했다. 같은 에이전트를 터미널 CLI(`agent`), 원격에서 도는 Cloud Agents, PR 리뷰 봇 Bugbot, iOS·웹에서도 쓴다.
여러 회사의 모델을 고를 수 있고, 프로젝트 지침은 `.cursor/rules/*.mdc` 와 `AGENTS.md` 로 준다. 소스는 공개되지 않은 상용 제품이며 빠르게 기능이 바뀐다(2026-11-06 변경 로그: 에이전트 음성 대화 추가).

## 요금제 (2026-11-18 공식 가격 페이지 기준)
| 플랜 | 가격(USD) | 요약 |
| --- | --- | --- |
| Free | $0/월 | 제한된 에이전트·채팅 요청 |
| Plus | $8/월 | 공유 사용량 풀. 이 플랜에서는 Grok 모델만 사용 |
| Premium | $30/월 | Plus 대비 4배 사용량, Cloud Agents·자동화, Bugbot 코드 리뷰, 서드파티 모델(API 정가로 별도 과금) |
| Super | $100/월 | Plus 대비 15배 사용량, 피크 시간 우선 접근 |
| Ultra | $200/월 | Plus 대비 50배 사용량 |
| Teams | $30+/사용자/월 | 중앙 결제, SSO, 팀 규칙·스킬 마켓플레이스 |
| Enterprise | 문의 | SCIM, 감사 로그, 세부 지출·접근 통제 |

가격 페이지는 Grok·X(구 Twitter) 구독 혜택과 함께 묶여 있으며, 서드파티 모델 사용료는 월 요금에 포함되지 않는다. 요금 체계가 자주 바뀌므로 도입 전 페이지를 다시 확인한다.

## 설치
에디터는 [cursor.com/downloads](https://cursor.com/downloads) 에서 받는다(macOS .dmg, Windows .exe, Linux apt·dnf 저장소 또는 AppImage). 처음 실행 시 VS Code 설정·확장을 가져올 수 있다.

```bash
# 터미널 CLI (macOS / Linux / WSL)
curl https://cursor.com/install -fsS | bash
agent --version
agent update            # 수동 업데이트 (기본은 자동 업데이트)
```

```powershell
# Windows PowerShell
irm 'https://cursor.com/install?win32=true' | iex
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Agent / Plan / Ask | 실행 / 질문하며 계획 수립 / 읽기 전용 탐색. `Shift+Tab` 으로 순환 |
| Tab | 에디터 자동완성·다음 편집 예측 |
| Project Rules | `.cursor/rules/*.mdc`. frontmatter `alwaysApply`·`globs`·`description` 조합으로 적용 시점 결정 (`.md` 는 무시됨) |
| AGENTS.md | frontmatter 없는 단순 지침 파일. CLI 는 `CLAUDE.md` 도 규칙으로 읽음 |
| MCP | 프로젝트 `.cursor/mcp.json`, 전역 `~/.cursor/mcp.json` |
| Cloud Agents | 원격 환경에서 도는 에이전트. CLI 에서 메시지 앞에 `&` 를 붙여 넘김 |
| Bugbot | PR 을 자동으로 리뷰하는 에이전트 |

## 기본 사용법
에디터에서 `Cmd+I`(Windows `Ctrl+I`)로 Agent 를 열고 "이 코드베이스의 진입점과 핵심 모듈을 설명해 줘"처럼 시작한다. 변경은 diff 로 검토하고 수락·거절한다.

터미널에서는:

```bash
cd my-project
agent                                   # 대화형 세션
agent --plan                            # Plan 모드로 시작
agent -w feature-x                      # 새 git worktree 에서 작업
agent -p "이 파일에 JSDoc 을 추가해 줘"      # 비대화형(print) 모드
```

규칙 예시 — `.cursor/rules/components.mdc`:

```markdown
---
globs: src/components/**/*.tsx
alwaysApply: false
---
- 컴포넌트는 named export 로 내보낸다.
- 200줄을 넘으면 같은 폴더에 하위 컴포넌트로 분리한다.
```

## 자주 쓰는 패턴
- **규칙 적용 방식 고르기**: 항상 필요한 것은 `alwaysApply: true`, 특정 경로용은 `globs`, 상황에 따라 필요한 것은 `description` 만 적어 에이전트가 고르게 한다. `/create-rule` 로 규칙 파일을 생성할 수 있다.
- **MCP 비밀값은 변수로**: `.cursor/mcp.json` 에서 `${env:TRACKER_TOKEN}` 처럼 환경 변수를 참조하고 값은 커밋하지 않는다.
  ```json
  { "mcpServers": { "tracker": { "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${env:TRACKER_TOKEN}" } } } }
  ```
- **스크립트·CI**: `agent -p` 는 승인이 필요한 동작을 거부하고 진행한다. 모두 허용하려면 `--force` 를 붙이며, 인증은 `CURSOR_API_KEY` 환경 변수로 준다. 구조화 출력은 `--output-format json`.
- **CLI 권한**: `~/.cursor/cli-config.json`(전역)과 `.cursor/cli.json`(프로젝트, 권한만)에서 `permissions.allow` / `permissions.deny` 를 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: VS Code 사용 경험을 유지하면서 에디터 안에서 에이전트·자동완성을 함께 쓰고 싶을 때, 같은 규칙으로 에디터·CLI·클라우드 에이전트를 오갈 때.
- 피할 때(대안): JetBrains 나 Vim 등 다른 에디터를 계속 쓰려면 [GitHub Copilot](/develop-wiki/ai/coding-agent/github-copilot/) 이나 터미널 에이전트([Claude Code](/develop-wiki/ai/coding-agent/claude-code/), [Codex CLI](/develop-wiki/ai/coding-agent/codex-cli/))가 낫다. 오픈소스·자체 모델 공급자가 필요하면 [Cline](/develop-wiki/ai/coding-agent/cline/).

## 공식 문서
- [문서 홈](https://cursor.com/docs) · [Quickstart](https://cursor.com/docs/get-started/quickstart) · [가격](https://cursor.com/pricing)
- [Rules](https://cursor.com/docs/rules) · [MCP](https://cursor.com/docs/mcp) · [CLI 설치](https://cursor.com/docs/cli/installation) · [헤드리스 CLI](https://cursor.com/docs/cli/headless)

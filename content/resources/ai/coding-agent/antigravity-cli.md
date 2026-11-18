---
name: Antigravity CLI
url: https://antigravity.google/product/antigravity-cli
docs: https://antigravity.google/docs/getting-started?tab=cli
repo: https://github.com/google-antigravity/antigravity-cli
stars: 2880
domain: ai
category: coding-agent
description: Google Antigravity 에이전트 하네스를 터미널에서 쓰는 코딩 에이전트 CLI(agy). Gemini CLI의 개인 사용자 후속 도구로, 코드 편집·명령 실행·헤드리스 자동화에 쓴다.
pricing: freemium
tags: [agent, cli, google, gemini, mcp, terminal]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Antigravity CLI(`agy`)는 Google Antigravity 의 에이전트 엔진을 터미널 TUI 로 쓰는 코딩 에이전트다. 코드베이스를 읽고, 권한을 받아 여러 파일을 편집하고, 셸 명령을 실행하며, 대화 기록을 유지한다. 데스크톱 앱(Antigravity 2.0), 에디터 확장, Python SDK 와 **같은 에이전트 하네스**를 공유해 설정·권한이 동기화되고, 터미널 세션을 GUI 앱으로 넘겨 이어 작업할 수 있다. SSH·원격 환경처럼 GUI 가 없는 곳을 겨냥한다.
**Gemini CLI 와의 관계**: Google 은 무료 개인 사용자와 Google AI Pro·Ultra 구독자를 [Gemini CLI](/develop-wiki/ai/coding-agent/gemini-cli/)에서 Antigravity CLI 로 옮겼다(2026-06-18, Gemini CLI README 기준). Gemini CLI 는 Code Assist 기업 라이선스·기존 유료 키 사용자용으로 남았고, README 는 Gemini 4 이후 모델에는 Antigravity CLI 를 쓰라고 안내한다. Antigravity CLI 는 `GEMINI.md`·`AGENTS.md` 컨텍스트 파일을 그대로 읽고, `agy plugin import gemini` 로 Gemini CLI 확장을 플러그인으로 옮기며, 커스텀 명령은 스킬로 바뀐다. Gemini CLI 는 오픈소스(Apache-2.0)지만 **Antigravity CLI 는 소스가 공개돼 있지 않다** — GitHub 저장소에는 README·CHANGELOG·예제만 있고 라이선스 표기가 없다.
2026-11-18 기준 최신 버전은 **1.5.11**(2026-11-18)이며 거의 매일 릴리스된다. 개인 Free·Pro·Ultra 플랜, Gemini Enterprise 라이선스, 종량제(pay-as-you-go)로 쓸 수 있다.

## 설치
```bash
# macOS / Linux
curl -fsSL https://antigravity.google/cli/install.sh | bash     # ~/.local/bin/agy
# Windows PowerShell
irm https://antigravity.google/cli/install.ps1 | iex
agy --version
```
첫 실행 시 색 테마, 렌더링 모드(Alt-Screen/Inline), 작업 폴더 신뢰 여부를 묻는다. 인증 방식은 개인 Google 계정(`oauth-personal`), Gemini Enterprise(`oauth-business`, Preview), Gemini API 키(`gemini-api-key`), Agent Platform(`agent-platform`, Preview)이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 대화형 TUI | 프로젝트 폴더에서 `agy` 실행. `agy -i "프롬프트"` 로 첫 질문과 함께 시작 |
| 실행 모드 | Shift+Tab 으로 `default`, `accept-edits`, `plan`, `auto` 전환 |
| 서브에이전트 | 백그라운드 작업을 동시 세션으로 위임하고 `/agents` 로 확인 |
| 컨텍스트 파일 | 작업 폴더의 `GEMINI.md`·`AGENTS.md`, 전역 `~/.gemini/GEMINI.md` |
| 스킬 | 작업 폴더 `.agents/skills/`, 전역 `~/.gemini/skills/` (옛 `.gemini/skills/` 는 옮겨야 인식) |
| MCP | 작업 폴더 `.agents/mcp_config.json`, 전역 `~/.gemini/config/mcp_config.json`. 원격 서버는 `serverUrl` 키 |
| 플러그인·훅·규칙 | 슬래시 명령으로 플러그인·MCP·스킬·훅 설정, `/config` 로 권한·환경설정 |
| 아티팩트 리뷰 | Ctrl+R 로 에이전트가 만든 계획·결과물을 검토 |
| 헤드리스 | `-p` 로 한 번 실행 후 종료, `--output-format json/stream-json` |
| ACP | Agent Client Protocol 로 외부 에디터에서 에이전트로 연결 |

## 기본 사용법
```bash
cd my-project
agy                                         # 대화형 세션
agy -p "README 의 설치 절차가 package.json 스크립트와 맞는지 확인해줘"
/usage                                      # (세션 안) 사용량·쿼터 확인
```

## 자주 쓰는 패턴
- **CI 에서 실행**: 대화형으로 한 번 로그인해 자격 증명을 캐시한 뒤 `agy -p "..." --output-format json --print-timeout 10m` 결과의 `status`·`response` 필드를 `jq` 로 읽는다. 인증되지 않은 헤드리스 실행은 실패한다.
- **승인 없는 실행 주의**: `--dangerously-skip-permissions` 는 모든 도구 호출을 자동 승인하므로 격리된 컨테이너에서만 쓴다. 기본값에서는 승인이 필요한 동작이 거부되고 실행은 계속된다.
- **Gemini CLI 에서 이전**: 기존 `GEMINI.md` 는 그대로 두고, 확장은 `agy plugin import gemini`, 작업 폴더 스킬은 `.agents/skills/` 로 옮기고, MCP 설정은 `settings.json` 에서 `mcp_config.json` 으로 분리한다.
- **원격 개발**: SSH 세션에서 `agy` 를 띄우고, 필요하면 세션을 데스크톱 앱으로 내보내 이어 본다.

## 언제 쓰나 / 피할 때
- 쓸 때: Google AI Pro·Ultra 또는 무료 개인 계정으로 Gemini 계열 모델을 쓰는 터미널 코딩 에이전트가 필요할 때, Antigravity 데스크톱 앱과 같은 설정·세션을 터미널에서 이어 쓰고 싶을 때.
- 피할 때(대안): 소스를 감사하거나 포크해야 하면 오픈소스인 [Gemini CLI](/develop-wiki/ai/coding-agent/gemini-cli/)(Code Assist·유료 API 키 사용자 대상), [Codex CLI](/develop-wiki/ai/coding-agent/codex-cli/), [Cline](/develop-wiki/ai/coding-agent/cline/). Claude 모델 중심이면 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/).

## 공식 문서
- [시작하기(CLI)](https://antigravity.google/docs/getting-started?tab=cli) · [인증](https://antigravity.google/docs/install?tab=cli) · [명령 레퍼런스](https://antigravity.google/docs/cli/reference/) · [실행 모드](https://antigravity.google/docs/cli/modes/)
- [헤드리스 모드](https://antigravity.google/docs/cli/headless/) · [Gemini CLI 마이그레이션](https://antigravity.google/docs/cli/gcli-migration/) · [ACP](https://antigravity.google/docs/cli/acp/) · [CHANGELOG](https://github.com/google-antigravity/antigravity-cli/blob/main/CHANGELOG.md)

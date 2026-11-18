---
name: GitHub Copilot
url: https://github.com/features/copilot
docs: https://docs.github.com/en/copilot
domain: ai
category: coding-agent
description: 코드 자동완성·채팅·에이전트 모드·CLI·클라우드 에이전트를 묶은 GitHub의 AI 코딩 도구. VS Code·JetBrains 등 여러 에디터와 github.com에서 쓴다.
pricing: freemium
tags: [agent, cli, completion, code-review, github]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GitHub Copilot 은 GitHub 가 제공하는 AI 코딩 도구 묶음이다. 에디터 안의 코드 자동완성·다음 편집 제안, 채팅과 에이전트 모드, 터미널용 **Copilot CLI**, 이슈·PR 에서 작업을 맡기는 클라우드 에이전트(2026-10 부터 "Copilot in the cloud"), PR 코드 리뷰까지 같은 구독으로 쓴다.
VS Code, Visual Studio, JetBrains, Xcode, Eclipse, Neovim, Zed 등 여러 에디터와 github.com·GitHub Mobile 에서 동작하며, 모델은 OpenAI·Anthropic·Google 등 여러 회사 모델 중에서 고른다. 저장소의 이슈·PR·Actions 와 바로 연결된다는 점이 다른 도구와의 차이다.
Copilot CLI 는 2026-11-18 기준 **v1.0.114**(npm `@github/copilot`)이며 소스는 공개되지 않은 상용 도구다.

## 요금제 (2026-11-18 공식 가격 페이지 기준, 개인)
| 플랜 | 가격(USD) | 요약 |
| --- | --- | --- |
| Free | $0 | 월 2,000회 자동완성, 채팅·에이전트 사용 제한, CLI·에이전트 모드 지원 |
| Pro | $10/월 | 무제한 자동완성·다음 편집 제안, 클라우드 에이전트·코드 리뷰, 모델 선택 |
| Pro+ | $39/월 | 프리미엄 모델, Pro 대비 4배 이상 사용량 |
| Max | $100/월 | Pro+ 대비 2.9배 이상 사용량, 신규 모델 우선 접근 |

채팅·에이전트·CLI·클라우드 에이전트 사용량은 **GitHub AI Credits** 로 차감된다. Business·Enterprise 는 별도 조직용 요금제다. 인증된 학생은 Student 플랜을 쓸 수 있다.

## 설치
에디터는 각 마켓플레이스에서 "GitHub Copilot" 확장을 설치하고 GitHub 계정으로 로그인한다(VS Code 는 기본 내장). CLI 는 다음 중 하나로 설치한다.

```bash
curl -fsSL https://gh.io/copilot-install | bash   # macOS / Linux
brew install copilot-cli
npm install -g @github/copilot
winget install GitHub.Copilot                      # Windows
```

`copilot` 을 실행하고 `/login` 으로 인증한다. 자동화 환경에서는 "Copilot Requests" 권한을 준 fine-grained PAT 를 `GH_TOKEN` 또는 `GITHUB_TOKEN` 환경 변수로 넘긴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 자동완성·다음 편집 제안 | 입력 중 코드를 제안하고, 방금 한 편집에 이어질 수정을 예측 |
| 에이전트 모드 | 에디터 안에서 여러 파일 편집·터미널 실행을 스스로 반복 |
| Copilot CLI | 터미널 에이전트. GitHub MCP 서버 기본 탑재, plan·autopilot 모드 |
| 클라우드 에이전트 | 리포지토리 Agents 탭·Copilot 홈에서 작업을 맡기면 GitHub Actions 또는 클라우드 샌드박스에서 실행해 PR 생성 |
| 저장소 지침 | `.github/copilot-instructions.md`(저장소 전체), `.github/instructions/*.instructions.md`(경로별), `AGENTS.md` |
| MCP | CLI 는 `~/.copilot/mcp-config.json`, `copilot mcp` 로 관리 |

## 기본 사용법
```bash
cd my-repo
copilot                                     # 대화형 세션
copilot --plan                              # 계획 모드로 시작
copilot -p "@src/app.ts 의 역할을 설명해 줘"     # 비대화형 1회 실행
copilot --continue                          # 이 디렉터리의 최근 세션 이어가기
copilot init                                # .github/copilot-instructions.md 생성·갱신
```

경로별 지침 예시 — `.github/instructions/frontend.instructions.md`:

```markdown
---
applyTo: "src/components/**/*.tsx"
excludeAgent: "code-review"
---
- 컴포넌트는 named export 로 내보낸다.
- 스타일은 같은 폴더의 CSS Module 에 둔다.
```

## 자주 쓰는 패턴
- **지침 파일 정리**: 공통 규칙은 `.github/copilot-instructions.md`, 디렉터리별 규칙은 `applyTo` 글롭을 쓴 `.instructions.md` 로 나눈다. `excludeAgent` 로 코드 리뷰나 클라우드 에이전트에서 제외할 수 있다.
- **CLI 권한 제어**: `--allow-tool` / `--deny-tool` 로 허용 도구를 명시하고, 전부 허용하는 `--allow-all-tools` 는 격리 환경에서만 쓴다.
- **세션 한정 MCP**: `copilot --additional-mcp-config @mcp.json` 은 이 세션에만 서버를 추가한다.
- **작업 위임**: CLI 의 `/delegate` 나 리포지토리 Agents 탭으로 클라우드 에이전트에 넘기고, 결과 PR 을 리뷰한다.
- **병렬 실행**: `/fleet`(또는 `--fleet`)으로 여러 서브에이전트에 작업을 나눈다.

## 언제 쓰나 / 피할 때
- 쓸 때: 팀이 GitHub 를 중심으로 일하고 이슈→PR→리뷰 흐름에 AI 를 넣고 싶을 때, 여러 에디터를 섞어 쓰는 조직, 무료 플랜으로 자동완성부터 시작하고 싶을 때.
- 피할 때(대안): GitLab·Bitbucket 중심이면 통합 이점이 적다. 터미널 에이전트만 필요하면 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) · [Codex CLI](/develop-wiki/ai/coding-agent/codex-cli/), 모델 공급자를 직접 고르려면 [Cline](/develop-wiki/ai/coding-agent/cline/) 이 맞다.

## 공식 문서
- [Copilot 문서](https://docs.github.com/en/copilot) · [요금제](https://github.com/features/copilot/plans) · [Copilot CLI 개요](https://docs.github.com/copilot/concepts/agents/about-copilot-cli)
- [CLI 명령 레퍼런스](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference) · [저장소 지침 추가](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)

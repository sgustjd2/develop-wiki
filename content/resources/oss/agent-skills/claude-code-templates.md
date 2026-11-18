---
name: Claude Code Templates
url: https://www.aitmpl.com
docs: https://docs.aitmpl.com
repo: https://github.com/davila7/claude-code-templates
stars: 33946
domain: oss
category: agent-skills
description: Claude Code 용 스킬·서브에이전트·명령·훅·MCP 설정 등 약 2천 개 구성 요소를 모은 카탈로그와 설치 CLI. npx 한 줄로 필요한 조각만 프로젝트에 넣을 때 쓴다.
pricing: oss
tags: [claude-code, agent-skills, subagents, hooks, mcp, cli, registry]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Claude Code Templates 는 Claude Code 설정을 이루는 작은 파일들(스킬, 서브에이전트, 슬래시 명령, 훅, MCP 서버, settings)을 한 카탈로그로 모으고 `npx claude-code-templates` CLI 로 설치하게 해 주는 오픈소스 레지스트리다. 카탈로그는 [aitmpl.com](https://www.aitmpl.com)에서 검색하고, 각 구성 요소 페이지에 정확한 설치 명령이 나온다. 모든 PR 은 Claude Code 플러그인 검증기와 NVIDIA SkillSpector 스캔을 거친다고 README 에 적혀 있다.
**2026-11 기준**: 별 약 3.4만, 마지막 푸시 2026-11-18, MIT. 구성 요소 1,980개 이상(스킬 918, 에이전트 422, 명령 288, MCP 119, settings 80, 훅 63 등).

## 무엇이 들어 있나
| 유형 | 수 | 예 |
| --- | ---: | --- |
| Skills | 918 | PDF 처리, frontend design, 코드 리뷰 |
| Agents | 422 | 보안 감사, 프론트엔드 개발자, DB 설계 |
| Commands | 288 | `/generate-tests`, `/security-audit` |
| MCPs | 119 | GitHub, PostgreSQL, Supabase, Sentry 연동 설정 |
| Settings · Hooks | 80 · 63 | 타임아웃·권한·상태줄, conventional commits 강제 |
| Mods · Loops · Templates | 50 · 18 · 14 | UI 확장, 주기 실행 워크플로, 프로젝트 전체 설정 |

로컬 도구로 세션 사용량 대시보드(`--analytics`, `localhost:3333`), 대화 기록 브라우저(`--chats`, `localhost:9876`), 설치 점검(`--health-check`)도 들어 있다. 두 대시보드는 대화 기록을 다루므로 `127.0.0.1` 에서만 열린다.

## 설치·사용법
```bash
# 대화형 탐색·설치
npx claude-code-templates@latest

# 구성 요소 하나씩
npx claude-code-templates@latest --skill creative-design/frontend-design
npx claude-code-templates@latest --agent development-tools/code-reviewer
npx claude-code-templates@latest --hook git/conventional-commits

# 여러 개를 한 번에
npx claude-code-templates@latest \
  --agent development-team/frontend-developer \
  --command testing/generate-tests \
  --mcp integration/github-integration

# 키워드 검색
npx claude-code-templates@latest --search "code review"
```

설치 결과는 프로젝트의 `.claude/` 아래(스킬, agents, commands, settings)와 MCP 설정 파일에 기록된다. `--yes` 를 붙이면 확인 프롬프트를 건너뛴다.

## 언제 쓰나 / 주의
- 쓸 때: 새 프로젝트에 Claude Code 기본 구성을 빠르게 갖출 때, 다른 사람이 만든 훅·명령 예시를 찾을 때.
- 주의: 훅과 settings 는 Claude Code 의 동작·권한을 바꾼다. `--yes` 로 일괄 설치하지 말고 생성된 `settings.json`·훅 스크립트를 커밋 전에 검토한다.
- 주의: MCP 구성 요소는 외부 서비스 토큰을 요구한다. 토큰은 환경 변수로 넘기고 저장소에 커밋하지 않는다.
- 주의: 카탈로그 규모가 커서 품질 편차가 있다. 스캔을 통과했다는 것이 동작·안전을 보증하지는 않는다.
- 대안: 형식이 표준화된 스킬만 필요하면 [skills CLI](/develop-wiki/oss/agent-skills/skills-cli/), 공식 출처를 원하면 [claude-plugins-official](/develop-wiki/oss/agent-skills/claude-plugins-official/).

## 링크
- [aitmpl.com 카탈로그](https://www.aitmpl.com) · [문서](https://docs.aitmpl.com) · [저장소](https://github.com/davila7/claude-code-templates)

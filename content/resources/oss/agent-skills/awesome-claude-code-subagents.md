---
name: Awesome Claude Code Subagents
url: https://github.com/VoltAgent/awesome-claude-code-subagents
docs: https://github.com/VoltAgent/awesome-claude-code-subagents#readme
repo: https://github.com/VoltAgent/awesome-claude-code-subagents
stars: 26790
domain: oss
category: agent-skills
description: 언어 전문가·인프라·보안·데이터 등 10개 분류의 Claude Code 서브에이전트 정의 161개를 모은 VoltAgent 저장소. 분류별 플러그인으로 설치하거나 .md 파일을 골라 복사해 쓴다.
pricing: oss
tags: [claude-code, subagents, plugin-marketplace, agents]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
이 저장소는 링크 모음이 아니라 **실제 서브에이전트 정의 파일**을 담고 있다. Claude Code 서브에이전트는 `name`·`description`·`tools`·`model` frontmatter 와 역할 지침으로 이뤄진 Markdown 파일로, 메인 대화와 분리된 컨텍스트에서 위임받은 일을 하고 요약만 돌려준다. VoltAgent(에이전트 프레임워크 개발사)가 관리하며, 각 분류를 하나의 플러그인으로 묶어 마켓플레이스로 배포한다.
**2026-11 기준**: 별 약 2.7만, 마지막 푸시 2026-11-02, MIT. README 배지 기준 서브에이전트 161개.

## 무엇이 들어 있나
| 분류 (플러그인) | 예 |
| --- | --- |
| 01 Core Development (`voltagent-core-dev`) | 백엔드·프론트엔드·API 설계 |
| 02 Language Specialists (`voltagent-lang`) | `typescript-pro`, `sql-pro` 등 언어·프레임워크 전문가 |
| 03 Infrastructure (`voltagent-infra`) | DevOps·클라우드·쿠버네티스 |
| 04 Quality & Security (`voltagent-qa-sec`) | 코드 리뷰·테스트·보안 감사 |
| 05 Data & AI (`voltagent-data-ai`) | 데이터 엔지니어링·ML |
| 06 Developer Experience (`voltagent-dev-exp`) | 리팩터링·문서·빌드 도구 |
| 07~08 Domains / Business (`voltagent-domains`, `voltagent-biz`) | 특화 도메인, 제품·비즈니스 |
| 09 Meta & Orchestration (`voltagent-meta`) | 다른 에이전트를 조율, `agent-installer` |
| 10 Research & Analysis | 조사·분석 |

서브에이전트 파일 형식:

```markdown
---
name: typescript-pro
description: 고급 타입 설계·tsconfig·빌드 문제를 다룰 때 사용
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---
You are a senior TypeScript developer ...
```

## 설치·사용법
```bash
# 플러그인(분류 단위)으로 설치
claude plugin marketplace add VoltAgent/awesome-claude-code-subagents
claude plugin install voltagent-lang

# 또는 필요한 파일만 복사
git clone --depth 1 https://github.com/VoltAgent/awesome-claude-code-subagents /tmp/subagents
mkdir -p ~/.claude/agents
cp /tmp/subagents/categories/02-language-specialists/typescript-pro.md ~/.claude/agents/
```

`~/.claude/agents/` 는 모든 프로젝트, `.claude/agents/` 는 현재 프로젝트에만 적용된다. 설치 후 "typescript-pro 에이전트로 이 타입 오류를 분석해 줘"처럼 지정하거나, `description` 이 맞으면 Claude 가 알아서 위임한다.

## 언제 쓰나 / 주의
- 쓸 때: 특정 분야 리뷰어·전문가 역할을 별도 컨텍스트로 돌리고 싶을 때, 서브에이전트 작성 예시가 필요할 때.
- 주의: 각 파일의 `tools` 에 `Bash`·`Write` 가 들어 있으면 서브에이전트가 명령 실행과 파일 수정을 할 수 있다. 리뷰 전용 에이전트는 읽기 도구만 남기도록 고쳐 쓴다.
- 주의: README 의 Standalone Installer 는 원격 셸 스크립트를 내려받아 실행하는 방식이다. 스크립트를 먼저 읽어 보거나 `git clone` 후 파일을 직접 복사하는 쪽이 안전하다.
- 주의: Meta 분류에는 외부 프로젝트 링크도 섞여 있다. 저장소 안의 `.md` 파일과 외부 링크를 구분한다.
- 대안: 스킬·명령까지 포함한 대형 묶음은 [wshobson/agents](/develop-wiki/oss/agent-skills/wshobson-agents/).

## 링크
- [저장소](https://github.com/VoltAgent/awesome-claude-code-subagents) · [분류 폴더](https://github.com/VoltAgent/awesome-claude-code-subagents/tree/main/categories)
- [Claude Code 서브에이전트 문서](https://code.claude.com/docs/en/sub-agents)

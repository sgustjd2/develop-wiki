---
name: wshobson/agents
url: https://github.com/wshobson/agents
docs: https://github.com/wshobson/agents/blob/main/docs/plugins.md
repo: https://github.com/wshobson/agents
stars: 42984
domain: oss
category: agent-skills
description: 94개 플러그인에 서브에이전트 202개·스킬 185개·명령 105개를 담은 마켓플레이스. Claude Code 형식으로 한 번 작성해 Codex·Cursor·OpenCode·Copilot 등 형식으로 변환해 준다.
pricing: oss
tags: [claude-code, subagents, agent-skills, plugin-marketplace, codex, cursor]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`wshobson/agents` 는 언어·인프라·보안·테스트 등 분야별 **전문 서브에이전트와 스킬을 플러그인 단위로 묶은 대형 카탈로그**다. 기여자는 Claude Code 플러그인 형식(Markdown)으로 한 번만 쓰고, `tools/adapters/` 의 생성기가 하네스별 형식으로 변환한다. 모델 별칭(`opus`·`sonnet`·`haiku`·`inherit`)과 도구 권한도 하네스에 맞게 매핑한다.
**2026-11 기준**: 별 약 4.3만, 마지막 푸시 2026-11-16, MIT(외부 플러그인은 각자 라이선스). 플러그인 94개(로컬 92 + 외부 2), 에이전트 202, 스킬 185, 명령 105.

## 무엇이 들어 있나
| 플러그인 예 | 용도 |
| --- | --- |
| `python-development` | Python·Django·FastAPI·테스트·패키징 (에이전트 3, 스킬 16, scaffold 명령) |
| `javascript-typescript` | JS/TS 개발과 프로젝트 설정 |
| `developer-essentials` | 코드 리뷰·디버깅·Git·테스트 패턴 |
| `security-scanning` | 보안 리뷰, 의존성 점검, 코드 스캔 |
| `plugin-eval` | 모델 호출 없이 스킬 구조를 정적으로 점수화 |

| 하네스 | 설치 방식 |
| --- | --- |
| Claude Code · Codex CLI · Cursor | 네이티브 플러그인 마켓플레이스 |
| OpenCode · Antigravity CLI · GitHub Copilot · Pi | 클론 후 `make install-<하네스>` 로 생성·연결 |

## 설치·사용법
Claude Code:

```text
/plugin marketplace add wshobson/agents
/plugin install python-development@claude-code-workflows
/python-development:python-scaffold Create a FastAPI service with tests
```

Codex CLI:

```bash
codex plugin marketplace add wshobson/agents
codex plugin add python-development@claude-code-workflows
```

스킬 하나만 필요하면 플러그인 없이 설치한다(`gh skill` 은 GitHub CLI 2.90 이상).

```bash
gh skill install wshobson/agents python-testing-patterns
npx skills add wshobson/agents --skill python-testing-patterns
```

## 언제 쓰나 / 주의
- 쓸 때: 특정 언어·프레임워크 전문 서브에이전트가 필요할 때, 같은 에이전트 세트를 여러 코딩 도구에서 쓰고 싶을 때.
- 주의: 플러그인을 많이 켜면 에이전트·스킬 설명이 모두 컨텍스트에 올라간다. 필요한 플러그인만 설치한다.
- 주의: `plugin-eval` 의 LLM 판정 기능은 `ANTHROPIC_API_KEY` 가 있으면 그 계정으로 과금된다. README 는 이 점수가 실제 작업 성공을 보장하지 않는다고 밝힌다.
- 주의: 외부 플러그인 항목(예: Pensyve)은 저장소 관리자와 관계된 프로젝트다. 외부 항목은 따로 코드와 데이터 경로를 확인한다.
- 대안: 서브에이전트만 가볍게 고르려면 [awesome-claude-code-subagents](/develop-wiki/oss/agent-skills/awesome-claude-code-subagents/).

## 링크
- [저장소](https://github.com/wshobson/agents) · [플러그인 카탈로그](https://github.com/wshobson/agents/blob/main/docs/plugins.md) · [하네스별 지원표](https://github.com/wshobson/agents/blob/main/docs/harnesses.md)
- [ARCHITECTURE.md](https://github.com/wshobson/agents/blob/main/ARCHITECTURE.md)

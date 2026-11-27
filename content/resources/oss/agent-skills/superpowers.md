---
name: Superpowers
url: https://github.com/obra/superpowers
docs: https://github.com/obra/superpowers#readme
repo: https://github.com/obra/superpowers
stars: 328143
domain: oss
category: agent-skills
description: 브레인스토밍 → 계획 → 서브에이전트 구현 → TDD → 코드 리뷰로 이어지는 개발 절차를 스킬로 묶은 라이브러리. 코딩 에이전트에 일관된 작업 방식을 강제하고 싶을 때 쓴다.
pricing: oss
tags: [agent-skills, claude-code, codex, tdd, workflow, plugin]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Superpowers 는 Jesse Vincent(Prime Radiant)가 만든 **개발 방법론형 스킬 묶음**이다. 개별 스킬을 골라 쓰는 대신, 세션 시작 시 `using-superpowers` 스킬이 로드돼 에이전트가 작업마다 관련 스킬을 먼저 찾도록 만든다. 요구 사항을 질문으로 끌어내고, 승인된 설계를 2~5분 단위 작업 계획으로 쪼갠 뒤, 작업마다 서브에이전트를 띄워 구현·리뷰하는 흐름이 기본이다.
**2026-11 기준**: 별 약 32만, 최신 릴리스 v7.0.2(2026-11-03), MIT. Claude Code·Codex·Cursor·Gemini CLI·GitHub Copilot CLI·OpenCode 등 여러 하네스용 설치 경로를 제공한다.

## 무엇이 들어 있나
| 스킬 | 언제 동작하나 |
| --- | --- |
| `brainstorming` | 무언가 만들기 전. 질문으로 의도를 끌어내고 설계 문서를 만든다 |
| `using-git-worktrees` | 설계 승인 후. 새 브랜치 worktree 를 만들고 테스트 기준선을 확인 |
| `writing-plans` | 파일 경로·코드·검증 단계까지 적힌 작은 작업 목록 작성 |
| `subagent-driven-development` / `executing-plans` | 작업마다 새 서브에이전트 + 리뷰, 또는 한 세션에서 순차 실행 |
| `test-driven-development` | RED-GREEN-REFACTOR 강제. 테스트 전에 쓴 코드는 지운다 |
| `systematic-debugging` · `verification-before-completion` | 4단계 원인 분석, "고쳤다" 선언 전 검증 |
| `requesting-code-review` · `receiving-code-review` | 작업 사이 리뷰, 피드백 반영 |
| `finishing-a-development-branch` | 테스트 확인 후 merge/PR/보관/폐기 선택, worktree 정리 |
| `dispatching-parallel-agents` | 독립 작업을 병렬 서브에이전트로 분배 |
| `writing-skills` | 새 스킬 작성·테스트 방법 |
| `diagnosing-superpowers` | 세션이 이상하게 돌았을 때 transcript 를 근거로 원인 보고 |

## 설치·사용법
Claude Code 는 공식 마켓플레이스 또는 전용 마켓플레이스에서 설치한다.

```text
/plugin install superpowers@claude-plugins-official

# 또는 전용 마켓플레이스
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

다른 에이전트 예시(README 기준):

```bash
gemini extensions install https://github.com/obra/superpowers   # Gemini CLI
copilot plugin marketplace add obra/superpowers-marketplace     # Copilot CLI
copilot plugin install superpowers@superpowers-marketplace
```

Codex 는 앱·CLI 의 공식 플러그인 목록(`/plugins`)에서 검색해 설치한다. 설치 뒤 "할 일 앱에 태그 기능을 추가하자"처럼 평소대로 요청하면 브레인스토밍 단계부터 자동으로 시작된다. 하네스를 여러 개 쓰면 각각 따로 설치해야 한다.

## 언제 쓰나 / 주의
- 쓸 때: 에이전트가 요구 사항을 묻지 않고 바로 코드를 쓰거나, 테스트 없이 "완료"를 선언하는 문제가 반복될 때. 몇 시간짜리 작업을 계획대로 자율 진행시키고 싶을 때.
- 주의: 절차가 무겁다. 한두 줄 수정에도 설계·계획 단계를 거치려 할 수 있어 토큰과 시간이 더 든다. 가벼운 조합형을 원하면 [Matt Pocock skills](/develop-wiki/oss/agent-skills/mattpocock-skills/)가 대안이다.
- 주의: brainstorming 의 선택 기능(visual companion)은 기본적으로 제작사 웹사이트에서 로고를 불러오며 버전 정보를 보낸다. `SUPERPOWERS_DISABLE_TELEMETRY` 로 끌 수 있다.
- 보안: 플러그인은 훅·스크립트를 포함할 수 있다. 업데이트가 자동으로 들어오므로 팀 환경에서는 버전을 고정하거나 변경 내역을 확인한다.

## 링크
- [저장소·README](https://github.com/obra/superpowers) · [릴리스](https://github.com/obra/superpowers/releases)
- [Superpowers 마켓플레이스](https://github.com/obra/superpowers-marketplace) · [첫 공개 글](https://blog.fsck.com/2025/10/09/superpowers/)

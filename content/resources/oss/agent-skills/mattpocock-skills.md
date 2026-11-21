---
name: Skills For Real Engineers (mattpocock/skills)
url: https://github.com/mattpocock/skills
docs: https://github.com/mattpocock/skills#readme
repo: https://github.com/mattpocock/skills
stars: 329604
domain: oss
category: agent-skills
description: Matt Pocock 이 매일 쓰는 작고 조합 가능한 엔지니어링 스킬 모음(grill-me, tdd, to-spec, diagnosing-bugs 등). 정렬·피드백 루프·설계 품질을 에이전트 작업에 넣고 싶을 때 쓴다.
pricing: oss
tags: [agent-skills, claude-code, codex, tdd, domain-modeling, plugin]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`mattpocock/skills` 는 TypeScript 교육자 Matt Pocock 이 실제 개발에 쓰는 스킬을 공개한 저장소다. 전체 프로세스를 장악하는 프레임워크(GSD, BMAD, Spec-Kit 등) 대신 **작고 고쳐 쓰기 쉬운 스킬**을 조합하는 방식을 내세운다. 에이전트와의 오해(정렬), 장황함(공유 용어), 동작하지 않는 코드(피드백 루프), 진흙 덩어리 코드(설계)라는 네 가지 실패를 각각 스킬로 다룬다.
**2026-11 기준**: 별 약 32.7만, 마지막 푸시 2026-11-18, MIT. 스킬은 사용자가 직접 부르는 것(user-invoked)과 모델이 알아서 부를 수 있는 것(model-invoked)으로 나뉜다.

## 무엇이 들어 있나
| 스킬 | 종류 | 하는 일 |
| --- | --- | --- |
| `grill-me` | 사용자 호출 | 계획·아이디어를 질문 공세로 검증 |
| `grill-with-docs` | 사용자 호출 | 질문하며 `GLOSSARY.md`(공유 용어)와 ADR 을 함께 갱신 |
| `to-spec` · `to-tickets` | 사용자 호출 | 대화를 스펙으로, 스펙을 의존 관계가 있는 티켓으로 |
| `implement` · `implement-spec` | 사용자 호출 | 티켓·스펙을 TDD 와 코드 리뷰로 구현 |
| `improve-codebase-architecture` | 사용자 호출 | "깊은 모듈" 관점으로 리팩터링 후보를 찾아 보고 |
| `triage` · `wayfinder` · `retro` | 사용자 호출 | 이슈 분류, 큰 작업의 결정 지도, 세션 회고 |
| `tdd` | 모델 호출 | red-green-refactor 루프와 좋은 테스트 기준 |
| `diagnosing-bugs` | 모델 호출 | 재현 → 최소화 → 가설 → 계측 → 수정 → 회귀 테스트 |
| `prototype` | 모델 호출 | 설계 질문에 답하는 일회용 프로토타입 |

`skills/` 아래는 `engineering`, `productivity`, `misc`, `in-progress`, `deprecated` 로 나뉜다.

## 설치·사용법
플러그인(자동 업데이트)과 `npx skills`(파일 복사, 수동 업데이트) 중 **하나만** 고른다. 둘 다 설치하면 스킬이 두 번 보인다.

```bash
# Claude Code — 공식 마켓플레이스
claude plugin install mattpocock-skills@claude-plugins-official

# Codex
codex plugin marketplace add mattpocock/skills
codex plugin add mattpocock-skills@mattpocock

# 그 밖의 에이전트(편집 가능한 파일로 복사)
npx skills@latest add mattpocock/skills -a cursor
```

설치 후 저장소마다 한 번 `/setup-matt-pocock-skills` 를 실행해 이슈 트래커(GitHub·GitLab·로컬 파일 등), 분류 라벨, 문서 저장 위치를 정한다. 이후에는 변경 전에 `/grill-me`, 구현할 때 `/tdd` 처럼 필요한 스킬을 부른다.

## 언제 쓰나 / 주의
- 쓸 때: 에이전트에게 무거운 프로세스를 강제하기보다 필요한 순간에 골라 쓰고 싶을 때, 용어집·ADR 로 프로젝트 맥락을 쌓아 가고 싶을 때.
- 주의: 일부 스킬은 이슈 트래커에 티켓을 만들거나 GitHub 이슈를 수정한다. 처음에는 로컬 파일 모드로 시험해 보고, 에이전트의 `gh` 권한 범위를 확인한다.
- 주의: 스킬 이름이 바뀌거나 `deprecated` 로 옮겨지는 일이 잦다. 파일 복사 방식이면 `npx skills@latest update` 로 주기적으로 갱신한다.
- 대안: 절차 전체를 묶은 방식은 [Superpowers](/develop-wiki/oss/agent-skills/superpowers/).

## 링크
- [저장소·README](https://github.com/mattpocock/skills) · [skills.sh 페이지](https://skills.sh/mattpocock/skills)
- [CHANGELOG](https://github.com/mattpocock/skills/blob/main/CHANGELOG.md)

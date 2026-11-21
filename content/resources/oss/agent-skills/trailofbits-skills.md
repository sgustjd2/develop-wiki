---
name: trailofbits/skills
url: https://github.com/trailofbits/skills
docs: https://github.com/trailofbits/skills#readme
repo: https://github.com/trailofbits/skills
stars: 8332
domain: oss
category: agent-skills
description: 보안 감사 기업 Trail of Bits 의 스킬·플러그인 마켓플레이스. 코드 감사, 취약점 변종 분석, Semgrep·CodeQL, 퍼징·뮤테이션 테스트, 스마트 컨트랙트 보안 워크플로를 담았다. 에이전트로 보안 리뷰를 할 때 쓴다.
pricing: free
tags: [agent-skills, security, code-audit, semgrep, static-analysis, trail-of-bits]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
보안 연구·감사 업무에 쓰는 Claude Code 플러그인 마켓플레이스다. 플러그인마다 감사 방법론을 `SKILL.md` 로 옮겨 놓아, 에이전트가 "함수 하나씩 이해한 뒤 버그를 찾는다"거나 "오탐을 강제 점검 단계로 거른다" 같은 절차를 따르게 한다.
**2026-11 기준**: 별 8,267, 마지막 푸시 2026-11-12. 라이선스는 **CC-BY-SA-4.0** 이다. 콘텐츠용 Creative Commons 라이선스로 OSI 가 승인한 소프트웨어 라이선스가 아니며, 이 저장소를 가져다 수정·재배포하면 같은 조건(저작자 표시, 동일 조건 변경 허락)을 지켜야 한다. 사내에서 쓰는 것만으로는 대개 문제가 없지만 파생물을 공개한다면 확인한다.

## 무엇이 들어 있나
| 분야 | 플러그인 (일부) |
| --- | --- |
| 코드 감사 | `audit-context-building` · `differential-review` · `variant-analysis` · `sharp-edges` · `insecure-defaults` · `supply-chain-risk-auditor` |
| 정적 분석 | `static-analysis`(CodeQL·Semgrep·SARIF) · `semgrep-rule-creator` · `c-review` · `rust-review` |
| 검증·테스트 | `mutation-testing` · `property-based-testing` · `constant-time-analysis` · `zeroize-audit` · `fp-check` |
| 스마트 컨트랙트 | `building-secure-contracts` · `entry-point-analyzer` |
| 기타 | `yara-authoring`(악성코드 규칙), `firebase-apk-scanner`, `devcontainer-setup`, `modern-python` 등 |

## 설치·사용법
```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

메뉴에서 필요한 플러그인만 설치한다. Codex 는 `codex plugin marketplace add trailofbits/skills` 로 같은 마켓플레이스를 쓴다. 변경 사항을 보안 관점으로 보려면 `differential-review`, 코드베이스를 낯선 상태에서 파악하려면 `audit-context-building` 처럼 목적에 맞는 플러그인만 고른다.

## 언제 쓰나 / 주의
- 쓸 때: PR 단위 보안 리뷰, 알려진 취약점의 변종 탐색, Semgrep 규칙 작성, 암호 코드의 타이밍 부채널 점검.
- 주의: 에이전트 결과는 **후보**일 뿐 검증된 취약점이 아니다. 오탐 확인 단계를 거치고 재현해서 확인한다. 일부 플러그인은 `git` 정리나 PR 병합처럼 저장소를 바꾸는 작업(`git-cleanup`, `github-triage`)을 하므로 설치 전 권한과 절차를 읽는다.
- 허가받지 않은 대상에 공격성 분석 도구를 쓰지 않는다.

## 링크
- [저장소](https://github.com/trailofbits/skills) · [Testing Handbook](https://appsec.guide)
- 이 사이트: [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/) · [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/)

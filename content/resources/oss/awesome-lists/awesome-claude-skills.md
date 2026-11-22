---
name: Awesome Claude Skills (ComposioHQ)
url: https://github.com/ComposioHQ/awesome-claude-skills
repo: https://github.com/ComposioHQ/awesome-claude-skills
stars: 80058
domain: oss
category: awesome-lists
description: Composio 가 관리하는 Claude 스킬 모음 겸 목록. 문서 처리·개발·업무 자동화 스킬과 Composio 연동 스킬을 담았다. Anthropic 스킬 일부를 복제했고 GitHub 상 라이선스가 없다는 점에 주의한다.
pricing: free
tags: [awesome, claude-skills, agent-skills, composio, curated]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Composio(앱 연동 플랫폼 회사)가 운영하는 저장소로, 링크 목록이면서 **스킬 폴더를 직접 포함**한다. README 는 Claude.ai·Claude Code·Codex·Cursor·Gemini CLI 등에서 쓸 스킬과 플러그인 1,000개 이상을 모았다고 소개하고, 상단에서 Composio MCP Gateway 와 `connect-apps` 플러그인(API 키 필요)을 홍보한다.
**2026-11 기준**: 별 79,776, 마지막 푸시 2026-09-18, 기본 브랜치의 마지막 커밋은 2026-07-24 라서 최근에는 갱신이 뜸하다. 기본 브랜치는 `master`.

**라이선스에 주의한다.** GitHub 은 라이선스를 인식하지 못한다(LICENSE 파일 없음). README 하단은 Apache-2.0 이라 적으면서 "개별 스킬은 다른 라이선스일 수 있다"고 한다. 실제로 저장소의 `document-skills/docx` 같은 폴더는 Anthropic 스킬을 복제한 것으로 보이며, 그 `LICENSE.txt` 는 "© 2025 Anthropic, PBC. All rights reserved." 로 시작하고 `SKILL.md` 의 license 는 `Proprietary` 다. 원본은 [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/) 를 쓰는 것이 안전하다.

## 무엇이 들어 있나
| 구분 | 내용 |
| --- | --- |
| 저장소 안의 스킬 | `document-skills`(docx·pdf·pptx·xlsx), `skill-creator`, `mcp-builder`, `webapp-testing`, `theme-factory`, `changelog-generator`, `file-organizer`, `invoice-organizer` 등 약 30개 폴더 |
| 목록 카테고리 | Document Processing, Development & Code Tools, Data & Analysis, Business & Marketing, Communication & Writing, Creative & Media, Productivity, Collaboration, Security & Systems |
| App Automation via Composio | CRM·프로젝트 관리 등 SaaS 78개용 자동화 스킬(Composio 의 Rube MCP 가 전제) |
| 가이드 | 스킬 구조, 기본 템플릿, 모범 사례, 사용법(Claude.ai·Claude Code·API) |

## 이렇게 활용하라
1. 스킬 아이디어와 분류를 훑는 **카탈로그**로 쓴다. 문서·PDF 처리 같은 공식 스킬은 원본 저장소에서 가져온다.
2. 쓸 스킬 폴더의 `SKILL.md`·스크립트·`LICENSE.txt` 를 읽고, 필요한 폴더만 `~/.claude/skills/` 나 프로젝트 `.claude/skills/` 로 복사한다.
3. Composio 연동 스킬은 Composio 계정과 API 키가 필요하다. 무료 키로 시작할 수 있다고 안내하지만 서비스 약관과 요금은 직접 확인한다.

## 주의
- 홍보 성격: 상단 배너와 "App Automation" 섹션은 자사 서비스(Composio) 홍보를 겸한다.
- 복제 스킬은 원본과 달라질 수 있고(원본 갱신이 반영되지 않음), 원본 라이선스 조건을 따라야 한다. 재배포나 파생이 필요하면 이 저장소 대신 원 출처의 라이선스를 확인한다.
- 큐레이션 검증 수준이 낮아 스킬에 실행 스크립트가 있을 수 있다. 읽고 설치한다. 열린 이슈가 1,900건이 넘는다.

## 링크
- [저장소](https://github.com/ComposioHQ/awesome-claude-skills)
- 이 사이트: [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/) · [Awesome Agent Skills](/develop-wiki/oss/awesome-lists/awesome-agent-skills/) · [Awesome Claude Code](/develop-wiki/oss/awesome-lists/awesome-claude-code/)

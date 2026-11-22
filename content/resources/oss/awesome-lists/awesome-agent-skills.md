---
name: Awesome Agent Skills
url: https://github.com/VoltAgent/awesome-agent-skills
repo: https://github.com/VoltAgent/awesome-agent-skills
stars: 37437
domain: oss
category: awesome-lists
description: 공식 개발팀과 커뮤니티가 만든 에이전트 스킬 1,000여 개를 모은 목록. Claude Code·Codex·Gemini CLI·Cursor 등에서 쓸 스킬을 회사·언어별로 찾을 때 쓴다.
pricing: oss
tags: [awesome, agent-skills, skill-md, claude-code, codex, curated]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
VoltAgent 가 관리하는 Agent Skills 큐레이션 목록이다. 스킬을 직접 담지 않고 **각 팀의 저장소로 연결**한다. README 는 AI 로 대량 생성한 스킬이 아니라 실제 엔지니어링 팀이 만들어 쓰는 스킬 위주로 모았다고 밝힌다.
**2026-11 기준**: 별 37,312, 마지막 푸시 2026-11-15, 라이선스 MIT. README 의 링크 항목은 1,200개 이상이다.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Official Skills by (회사별) | Anthropic·Google·Microsoft·OpenAI·Vercel·Stripe·Cloudflare·HashiCorp·Supabase·Hugging Face·Trail of Bits·Sentry·Figma 등 공식 팀의 스킬 |
| Core · .NET · Java · Python · Rust · TypeScript Skills | 언어·분야별 스킬 |
| Community Skills | 커뮤니티 스킬 |
| Skills Paths | Claude Code(`.claude/skills/`), Codex(`.agents/skills/`), Cursor, Gemini CLI, Copilot, Windsurf, OpenCode 별 설치 경로 표 |
| Skill Quality Standards | 설명은 3인칭으로 무엇을·언제 쓰는지, 본문 500줄 이하, 절대 경로 금지, 도구 권한 최소화 |

## 이렇게 활용하라
1. **Official Skills by 섹션부터 본다.** 쓰는 서비스(Stripe, Supabase, Cloudflare 등)의 공식 스킬이 있는지 먼저 확인한다.
2. 항목의 저장소로 가서 `SKILL.md` 와 `scripts/` 를 읽고, 도구별 경로 표에 맞춰 복사하거나 `npx skills add <저장소 URL>` 로 설치한다([skills CLI](/develop-wiki/oss/agent-skills/skills-cli/)).
3. 스킬 품질 기준을 직접 만들 스킬의 체크리스트로 쓴다.

## 주의
- README 가 직접 "큐레이션일 뿐 감사하지 않았고, 원작자가 추가 후에 내용을 바꾸거나 교체할 수 있다"고 경고한다. 스킬은 **프롬프트 주입, 도구 오염, 악성 페이로드**를 담을 수 있으므로 설치 전에 읽고, 권장 도구(Snyk agent-scan 등)로 점검한다.
- 항목이 많아 README 가 약 250KB 다. 웹에서 일부가 잘릴 수 있으니 클론해서 검색한다.
- 스폰서 광고 배너가 상단에 있다. 목록 순위가 품질 순위는 아니다.

## 링크
- [저장소](https://github.com/VoltAgent/awesome-agent-skills)
- 이 사이트: [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/) · [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/) · [skills CLI](/develop-wiki/oss/agent-skills/skills-cli/)

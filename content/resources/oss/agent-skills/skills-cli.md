---
name: skills CLI (npx skills)
url: https://skills.sh
docs: https://github.com/vercel-labs/skills/blob/main/docs/commands.md
repo: https://github.com/vercel-labs/skills
stars: 40603
domain: oss
category: agent-skills
description: GitHub 저장소의 Agent Skills 를 Claude Code·Codex·Cursor 등 여러 에이전트 디렉터리에 설치·갱신하는 Vercel Labs CLI. skills.sh 디렉터리와 함께 스킬 배포 표준 도구로 쓰인다.
pricing: oss
tags: [agent-skills, cli, installer, skills-sh, lockfile]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`skills` 는 Vercel Labs 가 만든 **에이전트 스킬 패키지 관리자**다. `npx skills add <owner/repo>` 로 저장소의 스킬 폴더를 받아, 감지된 코딩 에이전트별 스킬 디렉터리에 복사한다. 설치 기록은 `skills-lock.json` 에 남기고, 파일 내용 해시로 변조·변경 여부를 확인한다. 스킬 검색·인기 순위는 [skills.sh](https://skills.sh) 디렉터리에서 본다.
**2026-11 기준**: 별 약 4만, 마지막 푸시 2026-11-17, MIT. Node.js 22.20 이상 필요. OpenCode·Claude Code·Codex·Cursor 외 75개 에이전트를 지원한다고 README 에 적혀 있다.

## 무엇이 들어 있나
| 명령 | 하는 일 |
| --- | --- |
| `npx skills add <source>` | 저장소의 스킬을 골라 설치 (`-g` 전역, `--skill` 하나만, `-a` 대상 에이전트) |
| `npx skills find [query]` | 스킬 검색 |
| `npx skills list` | 설치된 스킬 목록 |
| `npx skills use <source>@<skill>` | 설치 없이 그 스킬로 에이전트 실행 또는 프롬프트 출력 |
| `npx skills check` / `update` / `remove` | 업데이트 확인·갱신·삭제 |
| `npx skills init [name]` | 새 스킬 템플릿 생성 |

같은 조직의 [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)(별 약 3.4만)는 이 CLI 로 설치하는 대표 스킬 묶음이다. `react-best-practices`, `web-design-guidelines`, `composition-patterns`, `react-native-skills`, `deploy-to-vercel` 등이 들어 있다.

## 설치·사용법
```bash
# 프로젝트에 설치 (대화형으로 스킬·에이전트 선택)
npx skills add vercel-labs/agent-skills

# 스킬 하나를 Claude Code 에만, 모든 프로젝트에서 쓰도록
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a claude-code -g

# 설치 없이 한 번 써 보기
npx skills use vercel-labs/agent-skills@web-design-guidelines --agent claude-code

# 팀원이 lock 파일 기준으로 복원 (실험적 명령)
npx skills experimental_install
```

프로젝트 설치 시 파일은 `.agents/skills/<name>` 등 에이전트별 경로에 놓이고, lock 파일에는 출처 커밋과 `computedHash` 가 기록된다. 커밋 SHA 로 고정되므로 원본 저장소가 바뀌어도 같은 내용이 복원된다.

## 언제 쓰나 / 주의
- 쓸 때: 여러 에이전트를 함께 쓰는 팀에서 같은 스킬을 일괄 배포할 때, 스킬 버전을 lock 파일로 저장소에 고정하고 싶을 때.
- 주의: 기본으로 익명 사용 데이터를 보내고, 설치 시 보안 감사 요청도 보낸다. `DISABLE_TELEMETRY=1` 또는 `DO_NOT_TRACK=1` 로 끈다.
- 주의: `npx skills add` 는 임의의 GitHub 저장소를 받는다. skills.sh 순위는 품질·안전성 보증이 아니므로 설치 전 `SKILL.md` 와 `scripts/` 를 읽는다.
- 대안: GitHub CLI 2.90+ 의 `gh skill install <owner/repo> <skill>` 도 같은 역할을 한다.

## 링크
- [저장소](https://github.com/vercel-labs/skills) · [CLI 레퍼런스](https://github.com/vercel-labs/skills/blob/main/docs/commands.md) · [지원 에이전트](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)
- [skills.sh](https://skills.sh) · [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) · [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/)

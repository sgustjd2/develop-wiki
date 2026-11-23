---
name: anthropics/skills
url: https://github.com/anthropics/skills
docs: https://support.claude.com/en/articles/12512180-using-skills-in-claude
repo: https://github.com/anthropics/skills
stars: 199372
domain: oss
category: agent-skills
description: Anthropic 이 공개한 Agent Skills 예제 저장소. docx·pdf·pptx·xlsx 문서 스킬과 skill-creator·mcp-builder 등을 담고 있어 스킬 작성법을 익히거나 Claude Code 에 바로 설치할 때 쓴다.
pricing: oss
tags: [agent-skills, skill-md, claude-code, plugin-marketplace, anthropic]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`anthropics/skills` 는 Anthropic 이 Claude 용으로 만든 스킬(Skill)을 모아 둔 공식 저장소다. 스킬은 `SKILL.md`(메타데이터 + 지침)와 스크립트·참고 자료를 담은 폴더로, 에이전트가 작업에 맞을 때만 불러와 쓴다. 이 저장소는 그 형식의 **참조 예제** 역할을 하고, Claude 앱의 문서 생성 기능에 실제로 쓰이는 docx·pdf·pptx·xlsx 스킬도 공개돼 있다.
README 는 이 스킬들이 시연·학습용이며 Claude 제품 안의 동작과 다를 수 있다고 밝힌다. 형식 자체의 표준은 [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/)가 따로 관리한다.
**2026-11 기준**: GitHub 별 약 19.7만, 마지막 푸시 2026-11-16, 태그 릴리스 없이 main 브랜치로 배포. 저장소 루트에는 LICENSE 가 없고 각 스킬 폴더의 `LICENSE.txt` 가 적용된다(README 기준 다수가 Apache-2.0).

## 무엇이 들어 있나
| 폴더 | 내용 |
| --- | --- |
| `skills/` | 예제 스킬 19개 (2026-11 기준) |
| `spec/` | Agent Skills 명세 사본 (원본은 agentskills.io) |
| `template/` | 새 스킬을 만들 때 복사하는 기본 틀 |
| `.claude-plugin/marketplace.json` | Claude Code 플러그인 마켓플레이스 정의 |

| 대표 스킬 | 하는 일 |
| --- | --- |
| `docx` · `pdf` · `pptx` · `xlsx` | Office 문서·PDF 읽기, 생성, 편집 (스크립트 포함) |
| `skill-creator` | 새 스킬 설계·작성·평가를 돕는 메타 스킬 |
| `mcp-builder` | MCP 서버를 설계·구현하는 절차 |
| `webapp-testing` | Playwright 로 로컬 웹앱을 시험 |
| `frontend-design` | 템플릿 느낌을 피한 UI 디자인 지침 |
| `claude-api` | Claude API·SDK 사용 레퍼런스 |
| `canvas-design` · `algorithmic-art` · `theme-factory` | 이미지·아트·테마 생성 |
| `internal-comms` · `doc-coauthoring` · `brand-guidelines` | 사내 문서·커뮤니케이션 작성 |

## 설치·사용법
Claude Code 에서는 저장소를 플러그인 마켓플레이스로 등록한 뒤 묶음 단위로 설치한다.

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

설치 후에는 "PDF 스킬로 이 파일의 양식 필드를 뽑아 줘"처럼 스킬 이름을 언급하거나, 작업이 `description` 과 맞으면 에이전트가 알아서 불러온다.

스킬 하나만 쓰고 싶으면 폴더를 개인 스킬 디렉터리로 복사해도 된다(경로는 예시).

```bash
git clone --depth 1 https://github.com/anthropics/skills /tmp/anthropic-skills
mkdir -p ~/.claude/skills
cp -R /tmp/anthropic-skills/skills/webapp-testing ~/.claude/skills/
```

직접 만들 때는 `template/` 을 복사해 frontmatter 의 `name`(소문자·하이픈)과 `description`(무엇을 하고 언제 쓰는지)만 채우면 된다.

```markdown
---
name: release-notes
description: Git 로그로 릴리스 노트 초안을 쓴다. 릴리스 노트·변경 내역 요청 시 사용.
---
# Release notes
1. `git log --oneline <이전 태그>..HEAD` 로 커밋을 모은다.
2. feat / fix / chore 로 묶어 한 줄씩 요약한다.
```

Claude.ai 유료 플랜과 Claude API(Skills API)에서도 같은 형식의 스킬을 올려 쓸 수 있다.

## 언제 쓰나 / 주의
- 쓸 때: 스킬 구조(progressive disclosure, 스크립트 동봉, 참고 파일 분리)를 실제 예제로 배울 때, 문서·PDF 처리 스킬을 코딩 에이전트에 바로 붙일 때.
- 주의: 스킬은 지침뿐 아니라 **실행되는 스크립트**를 담을 수 있다. 공식 저장소라도 설치 전 `SKILL.md` 와 `scripts/` 를 읽어 보고, 문서 스킬은 Python 패키지·LibreOffice 같은 로컬 의존성이 필요한지 확인한다.
- 대안: 개발 방법론까지 묶은 스킬 묶음은 [Superpowers](/develop-wiki/oss/agent-skills/superpowers/), 여러 에이전트에 한 번에 설치하려면 [skills CLI](/develop-wiki/oss/agent-skills/skills-cli/).

## 링크
- [저장소](https://github.com/anthropics/skills) · [스킬 템플릿](https://github.com/anthropics/skills/tree/main/template)
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills) · [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude) · [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- [Claude Code 스킬 문서](https://code.claude.com/docs/en/skills) · [Agent Skills 엔지니어링 글](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

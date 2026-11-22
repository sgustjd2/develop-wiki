---
name: Agent Skills (명세)
url: https://agentskills.io
docs: https://agentskills.io/specification
repo: https://github.com/agentskills/agentskills
stars: 27526
domain: oss
category: agent-skills
description: SKILL.md 폴더 형식으로 에이전트에 지식·절차를 붙이는 공개 표준. Anthropic 이 만들어 공개했고 Claude Code·Codex·Gemini CLI 등이 지원한다. 스킬을 직접 만들거나 검증할 때 기준으로 본다.
pricing: oss
tags: [agent-skills, specification, skill-md, open-standard]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Agent Skills 는 "에이전트가 필요할 때만 읽는 지침 폴더"를 정의한 공개 형식이다. 폴더 하나에 `SKILL.md` 를 두고, 앞부분 YAML frontmatter 에 이름과 설명을, 본문에 작업 절차를 적는다. 스크립트·참고 문서·템플릿을 함께 넣을 수 있다.
Anthropic 이 처음 만들어 공개 표준으로 내놓았고, 지금은 `agentskills/agentskills` 저장소에서 명세·문서·검증 도구(`skills-ref`)를 관리한다. 지원 클라이언트 목록은 [Client Showcase](https://agentskills.io/clients)에 있다.
**2026-11 기준**: 별 약 2.7만, 마지막 푸시 2026-11-04. 코드는 Apache-2.0, 문서는 CC-BY-4.0.

## 무엇이 들어 있나
```text
my-skill/
├── SKILL.md       # 필수: frontmatter + 지침
├── scripts/       # 선택: 실행 코드
├── references/    # 선택: 필요할 때 읽는 문서
└── assets/        # 선택: 템플릿·리소스
```

| frontmatter 필드 | 필수 | 규칙 |
| --- | --- | --- |
| `name` | 예 | 1~64자, 소문자·숫자·하이픈. 하이픈으로 시작·끝나거나 연속 불가. **폴더 이름과 같아야 함** |
| `description` | 예 | 1~1024자. 무엇을 하고 언제 쓰는지 |
| `license` | 아니오 | 라이선스 이름 또는 동봉 파일 참조 |
| `compatibility` | 아니오 | 최대 500자. 필요한 제품·패키지·네트워크 등 |
| `metadata` | 아니오 | 문자열 키-값 맵 |
| `allowed-tools` | 아니오 | 미리 허용할 도구 목록(공백 구분, 실험적) |

**점진적 공개(progressive disclosure)** 가 핵심이다.

| 단계 | 읽는 것 | 권장 크기 |
| --- | --- | --- |
| 발견 | 모든 스킬의 `name`·`description` | 스킬당 약 100토큰 |
| 활성화 | 작업과 맞는 스킬의 `SKILL.md` 본문 | 5,000토큰 미만, 500줄 이하 |
| 실행 | `scripts/`·`references/` 의 파일 | 필요할 때만 |

## 설치·사용법
명세 자체는 설치할 것이 없다. 스킬을 만들고 검증하는 흐름은 다음과 같다.

```markdown
---
name: pdf-processing
description: PDF 에서 텍스트·표를 추출하고 양식을 채운다. PDF 파일을 다룰 때 사용.
license: Apache-2.0
compatibility: Python 3 과 pypdf 필요
allowed-tools: Bash(python:*) Read
---
# PDF 처리
1. 양식 필드 추출은 `scripts/extract_fields.py <파일>` 을 실행한다.
2. 상세 옵션은 [레퍼런스](references/REFERENCE.md)를 본다.
```

검증은 참조 구현 `skills-ref` 로 한다. README 는 시연용이라 운영 용도로 쓰지 말라고 적어 둔다.

```bash
git clone --depth 1 https://github.com/agentskills/agentskills && cd agentskills/skills-ref
uv sync && source .venv/bin/activate
skills-ref validate ../../my-skill      # frontmatter·이름 규칙 검사
```

만든 폴더는 각 에이전트의 스킬 디렉터리(예: Claude Code 의 `~/.claude/skills/<name>/` 또는 프로젝트 `.claude/skills/<name>/`)에 두거나, [skills CLI](/develop-wiki/oss/agent-skills/skills-cli/)로 여러 에이전트에 한 번에 설치한다.

## 언제 쓰나 / 주의
- 쓸 때: 팀 규칙·배포 절차·도메인 지식을 여러 코딩 에이전트에서 같이 쓰고 싶을 때, 스킬이 클라이언트에서 인식되지 않을 때 형식을 점검할 때.
- 주의: `description` 이 트리거 조건이다. "PDF 를 돕는다"처럼 모호하면 불리지 않는다. 참조 파일은 `SKILL.md` 에서 한 단계 깊이로만 연결한다.
- 주의: `allowed-tools` 는 실험적이고 클라이언트마다 해석이 다르다. 남이 만든 스킬이 넓은 도구 권한을 미리 요구하면 의심한다.
- 관련: 예제는 [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/). OpenAI 의 `openai/skills` 카탈로그는 2026-11 현재 deprecated 로 표시되고 `openai/plugins` 로 옮겨 갔다.

## 링크
- [agentskills.io](https://agentskills.io) · [명세](https://agentskills.io/specification) · [지원 클라이언트](https://agentskills.io/clients)
- [저장소](https://github.com/agentskills/agentskills) · [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref)

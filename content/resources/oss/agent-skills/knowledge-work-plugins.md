---
name: anthropics/knowledge-work-plugins
url: https://github.com/anthropics/knowledge-work-plugins
docs: https://github.com/anthropics/knowledge-work-plugins#readme
repo: https://github.com/anthropics/knowledge-work-plugins
stars: 36900
domain: oss
category: agent-skills
description: Anthropic 이 공개한 직무별 플러그인 마켓플레이스. 영업·재무·법무·데이터·엔지니어링 등 역할별 스킬·슬래시 명령·MCP 커넥터를 묶었다. 개발자보다 비개발 직군 업무를 Claude 에 맡기는 구성을 참고할 때 쓴다.
pricing: oss
tags: [agent-skills, plugins, claude-cowork, claude-code, marketplace, anthropic]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Claude Cowork 용으로 만들었고 Claude Code 에서도 쓸 수 있는 플러그인 모음이다. 플러그인 하나가 한 직무에 필요한 **스킬(자동 호출되는 도메인 지식), 슬래시 명령, MCP 커넥터, 서브에이전트**를 묶는다. 코드 없이 Markdown 과 JSON 만으로 이뤄져 있어 회사 용어·절차에 맞게 고쳐 쓰는 것이 전제다.
**2026-11 기준**: 별 36,491, 마지막 푸시 2026-11-18, 라이선스 Apache-2.0. 마켓플레이스 정의에는 Anthropic 이 만든 플러그인 외에 파트너사 플러그인까지 120여 개가 등록돼 있다(README 본문은 11개를 소개).

## 무엇이 들어 있나
| 플러그인 | 내용 |
| --- | --- |
| `engineering` | 아키텍처·코드 리뷰·디버그·배포 체크리스트·장애 대응·문서화·테스트 전략 등 스킬 |
| `productivity` · `enterprise-search` | 작업·일정 관리, 여러 도구를 가로지르는 검색 |
| `sales` · `customer-support` · `marketing` · `product-management` | 영업·지원·마케팅·기획 업무 |
| `legal` · `finance` · `data` | 계약 검토, 결산·대사, SQL·통계 분석 |
| `bio-research` | 문헌·유전체·타깃 도구 연동 |
| `cowork-plugin-management` | 새 플러그인을 만들거나 기존 것을 조직에 맞게 수정 |

구조는 `.claude-plugin/plugin.json`(매니페스트), `.mcp.json`(도구 연결), `commands/`, `skills/` 로 통일돼 있다.

## 설치·사용법
```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install sales@knowledge-work-plugins
```

설치 후 스킬은 관련 작업에서 자동으로 불려 오고, `/sales:call-prep`·`/data:write-query` 같은 명령을 쓸 수 있다. `.mcp.json` 의 커넥터를 실제 쓰는 도구(Slack, Jira, Notion 등)로 바꾸고 스킬 파일에 회사 맥락을 적어 넣는 것이 권장 사용법이다.

## 언제 쓰나 / 주의
- 쓸 때: 직무별 플러그인을 어떻게 구성하는지 참고할 때, 팀 공용 플러그인 마켓플레이스를 직접 만들 때의 출발점.
- 주의: 플러그인의 `.mcp.json` 은 외부 SaaS(CRM·메신저·재무 도구)에 연결되며, 쓰기 권한이 있으면 메일 발송·티켓 생성 같은 부수 효과가 생긴다. 설치 전에 커넥터와 슬래시 명령 정의를 읽고, 파트너 플러그인은 제작사와 권한 범위를 별도로 확인한다.
- 개발 중심이라면 [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/)나 [Superpowers](/develop-wiki/oss/agent-skills/superpowers/)가 더 직접적이다.

## 링크
- [저장소](https://github.com/anthropics/knowledge-work-plugins) · [Claude 플러그인](https://claude.com/plugins/)
- 이 사이트: [Claude 공식 플러그인](/develop-wiki/oss/agent-skills/claude-plugins-official/) · [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/)

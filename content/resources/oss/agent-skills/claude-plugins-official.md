---
name: Claude Plugins Official (claude-plugins-official)
url: https://github.com/anthropics/claude-plugins-official
docs: https://code.claude.com/docs/en/plugins
repo: https://github.com/anthropics/claude-plugins-official
stars: 48305
domain: oss
category: agent-skills
description: Claude Code 기본 플러그인 마켓플레이스와 Anthropic 자체 플러그인(LSP 연동, code-review, plugin-dev 등)을 담은 저장소. 검증된 플러그인을 찾거나 플러그인 구조를 참고할 때 쓴다.
pricing: oss
tags: [claude-code, plugin, plugin-marketplace, agent-skills, anthropic]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`claude-plugins-official` 은 Claude Code 의 `/plugin` 메뉴에서 기본으로 보이는 마켓플레이스다. 플러그인은 스킬·서브에이전트·슬래시 명령·훅·MCP 서버 설정을 한 폴더로 묶어 배포하는 단위이고, 이 저장소에는 Anthropic 이 직접 만든 플러그인(`/plugins`)과 예전에 등록된 서드파티 플러그인(`/external_plugins`)이 있다.
2026-11 현재 서드파티 제출은 [claude.ai/directory/manage](https://claude.ai/directory/manage)로 옮겨졌고, 이 저장소의 PR 은 확인하지 않는다. `marketplace.json` 도 점차 Anthropic 자체 플러그인만 남기도록 줄어드는 중이다.
**2026-11 기준**: 별 약 4.8만, 마지막 푸시 2026-11-18, 저장소 Apache-2.0(플러그인별 라이선스는 각 폴더 확인). `/plugins` 43개, `/external_plugins` 14개.

## 무엇이 들어 있나
| 플러그인 | 하는 일 |
| --- | --- |
| `typescript-lsp` · `pyright-lsp` · `gopls-lsp` · `rust-analyzer-lsp` 등 | 언어 서버를 연결해 정의 이동·진단을 에이전트에 제공 |
| `code-review` · `pr-review-toolkit` | PR·변경분 리뷰용 명령과 에이전트 |
| `feature-dev` | 탐색 → 설계 → 구현 단계의 기능 개발 흐름 |
| `plugin-dev` · `skill-creator` · `mcp-server-dev` | 플러그인·스킬·MCP 서버 제작 도구 |
| `hookify` · `security-guidance` | 원치 않는 동작을 막는 훅 규칙 작성, 생성 코드의 보안 패턴 경고·diff 리뷰 |
| `commit-commands` · `claude-md-management` | 커밋·PR 명령, CLAUDE.md 관리 |
| `frontend-design` · `explanatory-output-style` | 디자인 지침, 설명형 출력 스타일 |

외부 공급자 플러그인(예: Superpowers, Figma, mattpocock-skills)도 이 마켓플레이스 이름(`@claude-plugins-official`)으로 설치된다.

## 설치·사용법
```text
/plugin                                   # Discover 탭에서 탐색
/plugin install typescript-lsp@claude-plugins-official
/plugin install code-review@claude-plugins-official
```

터미널에서는 `claude plugin install <이름>@claude-plugins-official` 형식도 쓴다. 플러그인 폴더 구조는 다음과 같다.

```text
my-plugin/
├── .claude-plugin/plugin.json   # 필수: 이름·버전·설명
├── skills/<name>/SKILL.md       # 선택
├── agents/*.md                  # 선택: 서브에이전트
├── commands/*.md                # 선택: 슬래시 명령
└── .mcp.json                    # 선택: MCP 서버 설정
```

마켓플레이스 항목의 `name` 은 바꿀 수 없는 식별자다. 표시 이름만 바꾸려면 `displayName` 을 쓰고, 꼭 바꿔야 하면 `renames` 맵을 둔다. `plugin.json` 없이 스킬만 묶을 때는 `strict: false` 와 `skills` 배열로 선언한다.

## 언제 쓰나 / 주의
- 쓸 때: 처음 플러그인을 고를 때 기본 출처로, 또는 LSP·리뷰 도구처럼 Anthropic 이 유지하는 플러그인을 쓸 때. 플러그인을 만들 때 `example-plugin` 을 참고한다.
- 주의: README 도 경고하듯 Anthropic 은 플러그인에 포함된 MCP 서버·파일·소프트웨어를 통제하거나 검증하지 않는다. 특히 외부 플러그인은 홈페이지와 코드를 확인하고 설치한다.
- 주의: 훅이 있는 플러그인은 도구 호출마다 셸 명령을 실행할 수 있다. 설치 후 `/plugin` 에서 활성 구성 요소를 확인한다.

## 링크
- [저장소](https://github.com/anthropics/claude-plugins-official) · [플러그인 문서](https://code.claude.com/docs/en/plugins) · [마켓플레이스 문서](https://code.claude.com/docs/en/plugin-marketplaces)
- [플러그인 제출](https://claude.ai/directory/manage)

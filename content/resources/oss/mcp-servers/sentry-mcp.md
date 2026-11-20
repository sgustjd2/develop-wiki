---
name: Sentry MCP
url: https://mcp.sentry.dev
docs: https://github.com/getsentry/toolkit#readme
repo: https://github.com/getsentry/toolkit
stars: 972
domain: oss
category: mcp-servers
description: Sentry 공식 MCP 서버. 이슈·이벤트·트레이스·릴리스를 조회하고 Seer 로 원인 분석을 요청하는 도구를 코딩 에이전트에 준다. 원격(mcp.sentry.dev) 또는 sentry CLI 로 연결한다.
pricing: source-available
tags: [mcp, sentry, error-tracking, observability, remote-mcp, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
[Sentry](/develop-wiki/backend/observability/sentry/) 가 만든 MCP 서버로, 범용 Sentry API 래퍼라기보다 **사람이 함께 보는 코딩 에이전트의 디버깅 흐름**에 맞춰 도구를 골랐다. 원격 서버는 Cloudflare Workers 위에서 돌고 OAuth 로 로그인한다. 셀프 호스팅 Sentry 에는 stdio 방식을 쓴다.
저장소는 `getsentry/sentry-mcp` 에서 `getsentry/toolkit` 으로 바뀌었고 Sentry CLI 와 함께 관리된다(이전 주소는 리다이렉트).
**2026-11 기준**: 별 968, 마지막 푸시 2026-11-18. 라이선스 FSL-1.1-Apache-2.0(Functional Source License, 일정 기간 후 Apache-2.0 으로 전환)이라 OSI 오픈소스는 아니다. Sentry 자체는 유료(무료 구간 있음) 서비스다.

## 무엇이 들어 있나
| 도구 (일부) | 하는 일 |
| --- | --- |
| `find_organizations` · `find_projects` · `find_teams` · `find_releases` | 조직·프로젝트·릴리스 탐색 |
| `search_issues` · `search_errors` · `search_traces` · `search_logs` | 자연어 질의를 Sentry 검색 쿼리로 바꿔 조회 (LLM 키 필요) |
| `get_issue_details` · `get_event_stacktrace` · `get_trace_details` | 이슈 상세, 스택 트레이스, 트레이스 조회 |
| `analyze_issue_with_seer` | Sentry 의 AI(Seer)로 이슈 원인·수정안 분석 |
| `find_related_issues` · `add_issue_note` | 관련 이슈 찾기, 메모 추가 |
| `create_project` · `create_dsn` · `create_alert_rule` 등 | 프로젝트·DSN·알림·모니터 관리 |

도구는 "skill" 묶음(`inspect`, `triage`, `seer`, `project-management` 등)으로 켜고 끈다.

## 설치·사용법
원격 서버(OAuth):

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

Claude Code 플러그인으로 설치하면 Sentry 질문을 맡는 `sentry-mcp` 서브에이전트가 함께 생긴다.

```text
/plugin marketplace add getsentry/sentry-mcp
/plugin install sentry-mcp@sentry-mcp
```

로컬 stdio(셀프 호스팅 포함)는 Sentry CLI 의 `sentry mcp` 명령을 쓴다. 로그인 정보를 재사용하므로 설정에 토큰을 적지 않아도 된다.

```json
{
  "mcpServers": {
    "sentry": {
      "command": "sentry",
      "args": ["mcp", "acme/web"],
      "env": { "SENTRY_HOST": "sentry.example.com" }
    }
  }
}
```

인자 `acme/` 나 `acme/web` 은 모든 호출을 해당 조직·프로젝트로 제한한다. `SENTRY_HOST` 는 셀프 호스팅일 때만 지정한다.

## 언제 쓰나 / 주의
- 쓸 때: "어제 배포 이후 늘어난 오류"를 에이전트가 직접 찾아 스택 트레이스와 코드를 대조하게 할 때, 이슈 분류·메모를 자동화할 때.
- 보안: 오류 이벤트에는 요청 데이터·사용자 정보가 들어 있을 수 있다. Sentry 쪽 데이터 스크러빙 설정을 확인하고, 필요한 조직·프로젝트로 범위를 묶는다.
- 비용: AI 검색 도구는 OpenAI·Anthropic 등 LLM 키가 필요하고(stdio), `EMBEDDED_AGENT_PROVIDER` 를 명시해야 한다. Seer 는 셀프 호스팅에서 쓸 수 없다.
- 주의: 병렬로 많이 호출하면 Sentry API 요청 제한에 걸린다. 순차 호출로 바꾼다.

## 링크
- [mcp.sentry.dev](https://mcp.sentry.dev) · [저장소](https://github.com/getsentry/toolkit) · [`sentry mcp` 명령 문서](https://cli.sentry.dev/commands/mcp/)

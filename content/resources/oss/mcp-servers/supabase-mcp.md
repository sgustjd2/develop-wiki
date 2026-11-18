---
name: Supabase MCP Server
url: https://supabase.com/mcp
docs: https://supabase.com/docs/guides/getting-started/mcp
repo: https://github.com/supabase/mcp
stars: 3018
domain: oss
category: mcp-servers
description: Supabase 공식 MCP 서버. 프로젝트의 테이블 조회, SQL 실행, 마이그레이션 적용, 로그·보안 권고 확인, Edge Function 배포를 에이전트 도구로 제공한다. 원격(mcp.supabase.com)으로 연결한다.
pricing: oss
tags: [mcp, supabase, postgresql, database, remote-mcp, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
[Supabase](/develop-wiki/cloud/baas/supabase/) 가 운영하는 MCP 서버로, 저장소 이름이 `supabase-community/supabase-mcp` 에서 `supabase/mcp` 로 바뀌었다. 기본 사용 방식은 원격 서버 `https://mcp.supabase.com/mcp` 이고, 클라이언트가 처음 연결할 때 Supabase 로그인(OAuth)을 띄운다. 로컬 Supabase CLI(`http://localhost:54321/mcp`)와 셀프 호스팅 환경에서도 제한된 도구 집합으로 동작한다.
URL 쿼리로 **프로젝트 범위·읽기 전용·기능 그룹**을 좁힐 수 있어, 에이전트에 넘길 권한을 연결 설정 단계에서 줄이는 것이 핵심이다.
**2026-11 기준**: 별 약 3,000, 마지막 푸시 2026-11-18, Apache-2.0. npm 패키지 `@supabase/mcp-server-supabase` 는 Vercel AI SDK 용 스키마와 자체 호스팅 핸들러도 내보낸다.

## 무엇이 들어 있나
| 기능 그룹 | 도구 예 |
| --- | --- |
| `database` | `list_tables`, `list_extensions`, `list_migrations`, `apply_migration`, `execute_sql` |
| `debugging` | `get_logs`, `get_advisors`(보안·성능 권고) |
| `functions` | `list_edge_functions`, `get_edge_function`, `deploy_edge_function` |
| `docs` | `search_docs` (Supabase 문서 검색) |
| `account` | 조직·프로젝트 목록·생성 (프로젝트 범위 모드에서는 제외) |
| `development` · `branching` · `storage` · `notebooks` | 타입 생성·프로젝트 URL, 개발 브랜치, 스토리지, 노트북 |

## 설치·사용법
권장 연결: 특정 프로젝트만, 읽기 전용, 필요한 기능만.

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=<project-ref>&read_only=true&features=database,docs,debugging"
    }
  }
}
```

Claude Code 에서는 같은 URL 로 등록한다.

```bash
claude mcp add --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<project-ref>&read_only=true"
```

Supabase 대시보드의 MCP 설정 화면에서 이 URL 을 대화형으로 만들 수 있다.

## 언제 쓰나 / 주의
- 쓸 때: 에이전트가 스키마를 보고 마이그레이션 SQL 을 쓰게 할 때, 로그·advisor 결과로 RLS 누락이나 느린 쿼리를 찾을 때, Edge Function 을 고치고 배포할 때.
- 보안: Supabase 는 연결 전에 [보안 위험 문서](https://supabase.com/docs/guides/ai-tools/mcp#security-risks)를 읽으라고 권한다. **운영 프로젝트가 아니라 개발 프로젝트나 브랜치**에 연결하고, `read_only=true` 와 `project_ref` 를 기본으로 둔다.
- 보안: `execute_sql` 결과에 사용자가 입력한 데이터가 섞여 오면 그 안의 지시문이 프롬프트 인젝션이 된다. 도구 호출 자동 승인을 끄고 SQL 을 확인한 뒤 실행한다.
- 관련: 다른 DB 들을 같은 방식으로 붙이려면 [MCP Toolbox for Databases](/develop-wiki/oss/mcp-servers/mcp-toolbox/).

## 링크
- [MCP 도구·설정 옵션](https://supabase.com/mcp) · [설정 가이드](https://supabase.com/docs/guides/getting-started/mcp) · [보안 모범 사례](https://supabase.com/docs/guides/ai-tools/mcp#security-risks)
- [저장소](https://github.com/supabase/mcp) · [셀프 호스팅에서 MCP 켜기](https://supabase.com/docs/guides/self-hosting/enable-mcp)

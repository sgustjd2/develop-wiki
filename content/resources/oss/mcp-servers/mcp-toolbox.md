---
name: MCP Toolbox for Databases
url: https://mcp-toolbox.dev/
docs: https://mcp-toolbox.dev/
repo: https://github.com/googleapis/mcp-toolbox
stars: 16961
domain: oss
category: mcp-servers
description: Google 의 데이터베이스용 MCP 서버. PostgreSQL·MySQL·BigQuery·MongoDB 등에 바로 쓰는 prebuilt 도구와, tools.yaml 로 정해 둔 쿼리만 노출하는 커스텀 도구를 제공한다.
pricing: oss
tags: [mcp, database, postgresql, bigquery, sql, google]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
MCP Toolbox for Databases(옛 이름 Gen AI Toolbox, 저장소 `genai-toolbox` → `mcp-toolbox`)는 Google 이 관리하는 Go 서버다. 두 가지 용도가 있다.
1. **개발 중 DB 탐색**: `--prebuilt=<db>` 로 띄우면 `list_tables`, `execute_sql` 같은 범용 도구가 바로 생겨, 코딩 에이전트가 스키마를 보고 쿼리를 돌린다.
2. **운영 에이전트용 도구 프레임워크**: `tools.yaml` 에 매개변수화된 SQL 을 미리 정의해 두고 그것만 노출한다. 연결 풀링, IAM 인증, OpenTelemetry 를 내장하고 Python·JS/TS·Go·Java SDK 로 앱에서 불러 쓴다.

**2026-11 기준**: 별 약 1.7만, 최신 릴리스 v1.17.0(2026-11-13), Apache-2.0.

## 무엇이 들어 있나
| 구분 | 지원 대상 |
| --- | --- |
| Google Cloud | AlloyDB, BigQuery, Cloud SQL(PostgreSQL·MySQL·SQL Server), Spanner, Firestore, Knowledge Catalog |
| 그 밖의 DB | PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB, Redis, Elasticsearch, ClickHouse, Neo4j, Snowflake, Trino 등 |

PostgreSQL prebuilt 도구 예: `execute_sql`, `list_tables`, `list_schemas`, `list_indexes`, `get_query_plan`, `list_active_queries`, `list_locks`, `list_top_bloated_tables`, `list_invalid_indexes`, `database_overview`. `--prebuilt=postgres/<toolset>` 로 일부만 켤 수 있다.

## 설치·사용법
prebuilt 서버를 stdio 로 등록한다. 접속 정보는 환경 변수로 준다(PostgreSQL 은 `POSTGRES_HOST`·`POSTGRES_PORT`·`POSTGRES_DATABASE`·`POSTGRES_USER`·`POSTGRES_PASSWORD`).

```json
{
  "mcpServers": {
    "toolbox-postgres": {
      "command": "npx",
      "args": ["-y", "@toolbox-sdk/server", "--prebuilt=postgres", "--stdio"],
      "env": {
        "POSTGRES_HOST": "localhost",
        "POSTGRES_DATABASE": "app_dev",
        "POSTGRES_USER": "readonly_user",
        "POSTGRES_PASSWORD": "<password>"
      }
    }
  }
}
```

운영용은 허용할 쿼리만 `tools.yaml` 에 적는다.

```yaml
kind: source
name: app-db
type: postgres
host: 127.0.0.1
port: 5432
database: app
user: agent_ro
password: ${DB_PASSWORD}
---
kind: tool
name: find-order
type: postgres-sql
source: app-db
description: 주문 번호로 주문 상태를 조회한다.
parameters:
  - name: order_id
    type: string
    description: 주문 번호
statement: SELECT id, status, updated_at FROM orders WHERE id = $1;
```

`--config tools.yaml` 로 실행하면 이 도구만 노출된다.

## 언제 쓰나 / 주의
- 쓸 때: 에이전트가 개발 DB 스키마를 보며 쿼리·마이그레이션을 짜게 할 때, 운영 에이전트에 "정해진 쿼리만" 허용해야 할 때.
- 보안: prebuilt 의 `execute_sql` 은 **임의 SQL** 을 실행한다. 반드시 읽기 전용 DB 사용자로 연결하고, 운영 DB 에는 prebuilt 대신 커스텀 도구만 노출한다.
- 보안: 쿼리 결과(고객 데이터 등)가 모델 제공자에게 전송된다. 개인정보가 있는 테이블은 뷰·마스킹으로 가린다.
- 관련: Google Cloud 관리형 MCP 서버도 있다. Supabase 프로젝트라면 [Supabase MCP](/develop-wiki/oss/mcp-servers/supabase-mcp/), DB 자체는 [PostgreSQL](/develop-wiki/backend/database/postgresql/).

## 링크
- [문서](https://mcp-toolbox.dev/) · [prebuilt 도구 레퍼런스](https://mcp-toolbox.dev/documentation/configuration/prebuilt-configs/) · [설정(sources·tools)](https://mcp-toolbox.dev/documentation/configuration/)
- [저장소](https://github.com/googleapis/mcp-toolbox) · [릴리스](https://github.com/googleapis/mcp-toolbox/releases)

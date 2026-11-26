---
name: MongoDB MCP Server
url: https://www.mongodb.com/docs/mcp-server/get-started/
docs: https://www.mongodb.com/docs/mcp-server/get-started/
repo: https://github.com/mongodb-js/mongodb-mcp-server
stars: 1164
domain: oss
category: mcp-servers
description: MongoDB 공식 MCP 서버. 컬렉션 조회·집계·인덱스 확인 같은 DB 도구와 Atlas 클러스터·프로젝트 관리 도구를 제공한다. 에이전트가 MongoDB 스키마와 데이터를 보며 쿼리를 짜게 할 때 쓴다.
pricing: oss
tags: [mcp, mongodb, atlas, database, nosql, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
[MongoDB](/develop-wiki/backend/database/mongodb/) 연결 문자열 또는 Atlas API 자격 증명으로 붙는 MCP 서버다. 로컬 실행(`mongodb-mcp-server`)과 MongoDB 가 호스팅하는 Atlas 원격 서버 두 방식이 있다.
**2026-11 기준**: 별 1,163, 최신 릴리스 v3.3.0(2026-11-09), 마지막 푸시 2026-11-18. 라이선스 Apache-2.0. 서버는 오픈소스이고 연결 대상 Atlas 는 별도 서비스다.

## 무엇이 들어 있나
| 구분 | 도구 (일부) |
| --- | --- |
| 데이터 조회·변경 | `find` · `aggregate` · `count` · `insert-many` · `update-many` · `delete-many` · `export` |
| 구조 확인 | `list-databases` · `list-collections` · `collection-schema` · `collection-indexes` · `explain` · `db-stats` |
| 구조 변경 | `create-collection` · `create-index` · `drop-collection` · `drop-database` · `rename-collection` |
| Atlas 관리 | `atlas-list-clusters` · `atlas-create-free-cluster` · `atlas-create-db-user` · `atlas-get-performance-advisor` · `atlas-list-alerts` |

## 설치·사용법
대화형 설정 스크립트가 연결 문자열이나 Atlas 자격 증명을 안내한다.

```bash
npx -y mongodb-mcp-server@latest setup
```

수동 설정은 클라이언트 설정에 `--readOnly` 를 붙여 시작한다.

```json
{
  "mcpServers": {
    "MongoDB": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server@latest", "--readOnly"],
      "env": { "MDB_MCP_CONNECTION_STRING": "mongodb://localhost:27017/myDatabase" }
    }
  }
}
```

Atlas 는 `mongodb-atlas` 플러그인(OAuth, 로컬 실행 불필요)을 쓰는 것이 권장 방식이다. 원격 서버는 정적 API 키를 HTTP 로 받지 않으므로, 키 방식이 필요하면 `mongodb-atlas-mcp-remote` stdio 패키지에 서비스 계정 ID·시크릿을 환경 변수로 준다.

## 언제 쓰나 / 주의
- 쓸 때: 낯선 컬렉션의 스키마·인덱스를 에이전트가 읽고 집계 파이프라인을 설계하게 할 때, Atlas 개발용 클러스터를 빠르게 띄울 때.
- 보안: `--readOnly`(또는 `MDB_MCP_READ_ONLY=true`)로 create·update·delete 도구를 아예 등록하지 않을 수 있다. 운영 DB 는 읽기 전용 계정과 함께 쓴다. 파괴적 도구는 클라이언트의 도구 승인 설정으로 사람이 확인하게 한다.
- 텔레메트리: 사용 데이터를 MongoDB 로 보내며, `MDB_MCP_TELEMETRY=disabled` 로 끈다.

## 링크
- [저장소](https://github.com/mongodb-js/mongodb-mcp-server) · [MCP 서버 문서](https://www.mongodb.com/docs/mcp-server/get-started/)
- 이 사이트: [MongoDB](/develop-wiki/backend/database/mongodb/) · [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)

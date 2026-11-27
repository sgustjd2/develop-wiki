---
name: Notion MCP
url: https://developers.notion.com/docs/mcp
docs: https://developers.notion.com/guides/mcp/get-started-with-mcp
repo: https://github.com/makenotion/notion-mcp-server
stars: 4728
domain: oss
category: mcp-servers
description: Notion 공식 원격 MCP 서버(mcp.notion.com). 워크스페이스 검색, 페이지 읽기·쓰기(Markdown), 데이터베이스 조회를 OAuth 로 연결해 쓴다. 설계 문서·회의록을 에이전트 작업에 끌어올 때 쓴다.
pricing: freemium
tags: [mcp, notion, docs, knowledge-base, remote-mcp, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Notion 이 운영하는 호스팅형 MCP 서버다. 사용자는 OAuth 로 로그인하고, 에이전트는 그 사용자의 기존 Notion 권한 범위 안에서만 페이지를 읽고 쓴다. 페이지를 블록 JSON 이 아니라 Markdown 으로 주고받아 토큰을 아끼는 쪽으로 설계됐다.
`repo` 의 `makenotion/notion-mcp-server`(MIT, 별 4,714, 마지막 푸시 2026-10-29)는 통합 토큰으로 Notion API 를 감싸는 **로컬 서버**인데, README 에 "더 이상 적극적으로 유지·지원하지 않는다"고 적혀 있고 향후 종료될 수 있다. 새로 연결한다면 원격 서버를 쓴다. 원격 서버 자체는 오픈소스가 아니다.

## 무엇이 들어 있나
| 기능 | 내용 |
| --- | --- |
| 검색 | `notion-search` 로 워크스페이스 검색(전 플랜), `notion-connector-search` 로 연결된 외부 앱까지 검색(Business 이상 + Notion AI) |
| 페이지 | 페이지 생성·수정, Markdown 으로 읽기·편집 |
| 데이터베이스 | 데이터 소스 조회, `notion-query-data-sources` 로 SQL 질의(무제한은 Business 이상 + Notion AI) |
| 스킬·메모리 | Notion 에 저장한 스킬과 개인 메모리를 MCP 클라이언트에서 불러 씀 |
| 관리 | 관리자가 허용할 MCP 클라이언트와 사용 현황을 관리 |

## 설치·사용법
Claude Code 에서는 원격 서버를 추가한 뒤 `/mcp` 로 OAuth 인증을 마친다.

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

팀이 함께 쓰려면 `--scope project` 로 `.mcp.json` 에 기록한다. stdio 만 지원하는 클라이언트는 `mcp-remote` 브리지(`npx -y mcp-remote https://mcp.notion.com/mcp`)를 쓴다. 브라우저 로그인이 어려운 자동화 환경은 Business·Enterprise 플랜에서 워크스페이스 소유자가 발급하는 MCP 토큰을 Bearer 로 보낸다. 구형 SSE 엔드포인트(`/sse`)는 2027-02-23 종료 예정이다.

## 언제 쓰나 / 주의
- 쓸 때: 기획서·설계 문서를 읽고 구현하게 할 때, 작업 결과를 Notion 페이지나 데이터베이스에 정리하게 할 때.
- 보안: 에이전트는 로그인한 사용자가 볼 수 있는 모든 페이지에 닿는다. 외부에서 가져온 페이지 내용에 섞인 지시(간접 프롬프트 주입)에 주의하고, 쓰기 도구 호출은 클라이언트에서 승인 후 실행하게 둔다.
- 플랜: 연결 앱 검색·무제한 SQL·MCP 토큰·일부 검색 필터는 Business·Enterprise 전용이고, 워크스페이스 게스트는 연결할 수 없다.

## 링크
- [Notion MCP 개요](https://developers.notion.com/docs/mcp) · [시작하기](https://developers.notion.com/guides/mcp/get-started-with-mcp) · [지원 도구](https://developers.notion.com/guides/mcp/mcp-supported-tools)
- [로컬 서버 저장소(유지보수 중단)](https://github.com/makenotion/notion-mcp-server)

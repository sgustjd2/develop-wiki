---
name: Atlassian MCP Server
url: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/
docs: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/
repo: https://github.com/atlassian/atlassian-mcp-server
stars: 1188
domain: oss
category: mcp-servers
description: Atlassian 공식 원격 MCP 서버(mcp.atlassian.com/v2/mcp). Jira·Confluence·Bitbucket·Compass 등을 OAuth 2.1 또는 API 토큰으로 연결한다. 이슈 검색·생성과 문서 요약을 에이전트에 맡길 때 쓴다.
pricing: freemium
tags: [mcp, atlassian, jira, confluence, bitbucket, remote-mcp, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Atlassian Cloud 사이트에 연결하는 클라우드 호스팅 MCP 서버다. 사용자의 기존 접근 권한을 그대로 따르고, 조직에서 IP 허용 목록을 쓰면 도구 호출도 그 규칙을 따른다. 서버는 Atlassian 이 운영하며, Atlassian Cloud 계정이 있어야 한다.
저장소 `atlassian/atlassian-mcp-server` 는 서버 코드가 아니라 **플러그인 패키지(Claude Code·Cursor·Gemini 등)와 스킬**을 담는다(Apache-2.0, 별 1,174, 마지막 푸시 2026-11-14). README 는 신규 설정에 **v2(`/v2/mcp`)** 를 권장한다. 기존 v1 연결도 v2 도구를 자동으로 받는다.

## 무엇이 들어 있나
| 제품 | 권한 그룹 |
| --- | --- |
| Jira | `read_jira` · `write_jira` · `search_jira` (`delete_jira`·`manage_jira` 는 관리자가 켜야 함) |
| Confluence | `read_confluence` · `write_confluence` · `search_confluence` |
| Bitbucket Cloud | `read_bitbucket` · `write_bitbucket` (조직에 연결된 워크스페이스만) |
| Jira Service Management | `read_jsm` · `write_jsm` (API 토큰 인증만) |
| Compass · Loom · Goals · Projects · Teams | 읽기·쓰기 그룹 (Compass 는 OAuth 만) |

관리자는 권한 그룹 단위로 접근을 허용·회수한다.

## 설치·사용법
```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v2/mcp
```

세션에서 `/mcp` 로 OAuth 2.1 인증을 마친다. 브라우저를 쓸 수 없는 환경은 API 토큰으로 인증할 수 있는데, 조직 관리자가 토큰 인증을 꺼 두었다면 OAuth 만 가능하다. stdio 전용 로컬 클라이언트는 `mcp-remote` 프록시(Node.js 18 이상)를 거친다.

## 언제 쓰나 / 주의
- 쓸 때: "이 스프린트 미해결 버그 요약", 회의록에서 Jira 이슈 만들기, Confluence 설계 문서를 읽고 구현하기.
- 보안: README 가 직접 프롬프트 주입·툴 포이즈닝 위험을 경고한다. 최소 권한 토큰을 쓰고, 이슈 생성·삭제 같은 쓰기 작업은 사람이 확인하게 하며, 감사 로그를 본다. 이슈·페이지 본문에 섞인 지시문을 에이전트가 따를 수 있다는 점을 염두에 둔다.
- 비용: 서버 자체는 별도 요금이 없지만 Atlassian Cloud 플랜·권한에 따라 쓸 수 있는 범위가 다르다.

## 링크
- [시작하기](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/) · [저장소](https://github.com/atlassian/atlassian-mcp-server) · [보안·관리 설정](https://support.atlassian.com/security-and-access-policies/docs/control-atlassian-rovo-mcp-server-settings/)
- 이 사이트: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)

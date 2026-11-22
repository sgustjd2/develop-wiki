---
name: Awesome MCP Servers
url: https://github.com/punkpeye/awesome-mcp-servers
repo: https://github.com/punkpeye/awesome-mcp-servers
stars: 98391
domain: oss
category: awesome-lists
description: 직접 설치해 쓰는 MCP(Model Context Protocol) 서버를 분야별로 모은 목록. Claude Code·Cursor 같은 MCP 클라이언트에 붙일 DB·브라우저·개발 도구 서버를 찾을 때 쓴다.
pricing: oss
tags: [awesome, mcp, model-context-protocol, ai-agent, llm-tools]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
punkpeye 가 관리하는 MCP 서버 목록으로, 항목 수가 수천 개에 이를 만큼 크다(README 만 약 1.8MB). 항목마다 **구현 언어(🐍 Python, 📇 TypeScript, 🏎️ Go, 🦀 Rust 등), 범위(☁️ 원격 API 연동 / 🏠 로컬 소프트웨어 제어), 지원 OS**를 이모지로 표시하고, 🎖️ 는 해당 서비스의 공식 구현을 뜻한다. 같은 데이터가 Glama 의 웹 디렉터리(glama.ai/mcp/servers)와 동기화된다. 2026-11 기준 별 약 9.8만, 라이선스 MIT.

커밋이 매일 수준으로 이어진다(마지막 2026-11-17). 한국어 README(README-ko.md)가 있고 2026-10 에도 갱신됐다. 다만 영어판보다 늦게 반영되므로 최신 항목은 영어판에서 확인한다.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| What is MCP? · Tutorials · Community | MCP 소개, 빠른 시작 글, Reddit·Discord |
| Clients · Remote Servers | 클라이언트 목록(awesome-mcp-clients)과 호스팅형 원격 서버 목록(awesome-remote-mcp-servers)으로 연결 |
| Legend | 언어·범위·OS·공식 구현 이모지 설명 |
| Server Implementations | Aggregators, Browser Automation, Cloud Platforms, Code Execution, Coding Agents, Command Line, Communication, Databases, Data Platforms, Developer Tools, File Systems, Knowledge & Memory, Monitoring, Search & Data Extraction, Security, Version Control, Workplace & Productivity 등 50여 분야 |

## 이렇게 활용하라
1. **분야 → 🎖️ 공식 구현부터 찾는다.** 예: Databases 에서 쓰는 DB 의 공식 서버가 있으면 그것을 우선한다. 공식 구현이 없으면 별 수·최근 커밋이 많은 것을 고른다.
2. **범위 이모지로 위험도를 가늠한다.** 🏠 로컬 서버는 파일·셸·브라우저를 직접 다루므로 권한 범위를 꼭 확인한다.
3. **코드와 요구 권한을 읽는다.** 서버가 노출하는 도구 목록, 필요한 토큰 범위(읽기 전용으로 충분한지), 외부 전송 여부를 본다.
4. **Inspector 로 먼저 시험한다.** 클라이언트에 붙이기 전에 [MCP Inspector](/develop-wiki/ai/mcp-tooling/mcp-inspector/) 로 도구 호출을 확인한다.
   ```bash
   npx @modelcontextprotocol/inspector <서버 실행 명령>
   ```
5. **클라이언트 설정에 추가한다.** Claude Code 라면 `claude mcp add <이름> -- <실행 명령>` 처럼 등록하고, 토큰은 환경 변수로 넘긴다.

## 주의
- 등록 심사가 가볍고 항목이 매우 많다. **목록에 있다는 것이 안전성 검증을 뜻하지 않는다.** 프롬프트 주입·과도한 권한·비공식 래퍼에 주의한다.
- README 가 커서 GitHub 웹에서 일부가 잘려 보일 수 있다. 검색은 Glama 웹 디렉터리가 편하다.
- 호스팅형(URL 로 연결하는) 서버는 이 목록이 아니라 awesome-remote-mcp-servers 에 있다.

## 링크
- [저장소 README](https://github.com/punkpeye/awesome-mcp-servers) · [한국어 README](https://github.com/punkpeye/awesome-mcp-servers/blob/main/README-ko.md) · [Glama MCP 서버 디렉터리](https://glama.ai/mcp/servers) · [awesome-mcp-clients](https://github.com/punkpeye/awesome-mcp-clients)
- 이 사이트: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) · [MCP 공식 레퍼런스 서버](/develop-wiki/ai/mcp-tooling/mcp-reference-servers/) · [MCP Registry](/develop-wiki/ai/mcp-tooling/mcp-registry/) · [FastMCP](/develop-wiki/ai/mcp-tooling/fastmcp/)

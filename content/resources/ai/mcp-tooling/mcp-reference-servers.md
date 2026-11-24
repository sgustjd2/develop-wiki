---
name: MCP Reference Servers
url: https://github.com/modelcontextprotocol/servers
docs: https://github.com/modelcontextprotocol/servers#readme
repo: https://github.com/modelcontextprotocol/servers
stars: 92216
domain: ai
category: mcp-tooling
description: MCP 운영 그룹이 관리하는 참조 서버 모음(Filesystem, Git, Fetch, Memory 등). SDK 사용법 학습과 클라이언트 테스트용 예제로 쓴다.
pricing: oss
tags: [mcp, server, reference, example]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`modelcontextprotocol/servers` 저장소는 [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 운영 그룹(steering group)이 직접 유지하는 **참조 구현** 서버 7개를 담고 있다. 각 서버는 공식 TypeScript·Python SDK 로 작성돼, 프로토콜 기능과 SDK 사용법을 보여 주는 예제 역할을 한다.
README 는 이 서버들이 교육용 예제이지 운영용 완성품이 아니라고 명시한다. 공개된 서버 전체 목록은 이제 이 저장소가 아니라 [MCP Registry](/develop-wiki/ai/mcp-tooling/mcp-registry/) 에서 찾는다. GitHub·Slack·PostgreSQL 같은 예전 서버는 `servers-archived` 로 옮겨졌고, 상당수는 각 서비스 공식 서버로 대체됐다.
**2026-11 기준**: 저장소 릴리스 v2.4.0, npm 패키지는 서버별 버전(예: `server-filesystem` 2.3.0), PyPI 패키지는 날짜 버전(예: `mcp-server-git` 2026.11.11). 서버들은 2026-07-28 명세와 이전 핸드셰이크 방식 클라이언트를 모두 지원한다.

## 설치
설치 없이 클라이언트가 `npx`(TypeScript 서버) 또는 `uvx`(Python 서버)로 띄우게 하는 방식이 기본이다.

```bash
npx -y @modelcontextprotocol/server-memory          # TypeScript 서버
uvx mcp-server-git --repository ./my-repo            # Python 서버 (uv 필요)
pip install mcp-server-git && python -m mcp_server_git   # pip 로도 가능
```

## 핵심 개념
| 서버 | 패키지 | 하는 일 |
| --- | --- | --- |
| Everything | `@modelcontextprotocol/server-everything` | 도구·리소스·프롬프트 등 프로토콜 기능 전부를 노출하는 테스트용 서버 |
| Fetch | `mcp-server-fetch` (PyPI) | 웹 페이지를 가져와 LLM 이 읽기 좋은 마크다운으로 변환 |
| Filesystem | `@modelcontextprotocol/server-filesystem` | 허용된 디렉터리 안에서 파일 읽기·쓰기·검색 |
| Git | `mcp-server-git` (PyPI) | 저장소 상태·diff·log 조회, 스테이징·커밋 |
| Memory | `@modelcontextprotocol/server-memory` | 엔터티·관계·관찰로 이뤄진 지식 그래프를 JSONL 파일에 저장 |
| Sequential Thinking | `@modelcontextprotocol/server-sequential-thinking` | 단계별 사고 과정을 기록·수정하는 도구 |
| Time | `mcp-server-time` (PyPI) | 현재 시각 조회와 시간대 변환 |

## 기본 사용법
대부분의 MCP 호스트가 쓰는 `mcpServers` JSON 설정에 등록한다. 경로는 예시다.

```json
{
  "mcpServers": {
    "fs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "--read-only", "/home/me/docs"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/home/me/project"]
    }
  }
}
```

Windows 에서는 `npx` 를 `"command": "cmd", "args": ["/c", "npx", ...]` 로 감싼다. [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 라면 `claude mcp add fs -- npx -y @modelcontextprotocol/server-filesystem /home/me/docs` 로 등록한다.

## 자주 쓰는 패턴
- **접근 범위를 인자로 제한**: Filesystem 은 명령줄로 준 디렉터리만 접근한다. 쓰기를 막으려면 `--read-only`, 일부 디렉터리만 막으려면 `--read-only-dir <경로>` 를 쓴다. 클라이언트가 보내는 Roots 로 범위를 바꾸는 방식은 2026-07-28 명세에서 deprecated 다.
- **Git 서버는 `--repository` 필수로**: 지정하지 않으면 서버 프로세스가 접근할 수 있는 모든 저장소에서 커밋·체크아웃까지 가능하다. 신뢰할 수 없는 입력을 다룰 때는 반드시 지정한다.
- **Fetch 는 내부망 주의**: 로컬·사내 IP 에도 접근할 수 있어 민감 정보가 노출될 수 있다. 응답 본문은 최대 5 MiB 까지만 읽는다.
- **Memory 저장 위치 지정**: `MEMORY_FILE_PATH` 환경 변수로 지식 그래프 파일 경로를 바꾼다.
- **클라이언트·SDK 개발 시험대**: 직접 만든 MCP 클라이언트나 [MCP Inspector](/develop-wiki/ai/mcp-tooling/mcp-inspector/) 검증에는 Everything 서버를 대상으로 쓴다.
- **내 서버의 출발점**: 같은 기능을 [FastMCP](/develop-wiki/ai/mcp-tooling/fastmcp/) 나 공식 SDK 로 다시 짤 때 코드 구조·도구 annotation(`readOnlyHint` 등) 작성법을 참고한다.

## 언제 쓰나 / 피할 때
- 쓸 때: MCP 를 처음 익히며 실제 동작하는 서버를 붙여 볼 때, 로컬 파일·Git·웹 페이지를 코딩 에이전트에 간단히 연결할 때, 클라이언트 구현을 시험할 때.
- 피할 때(대안): 운영 환경에서는 보안 요구 사항을 직접 점검하거나, GitHub·Slack·DB 처럼 서비스 제공자가 직접 운영하는 공식 서버를 MCP Registry 에서 찾아 쓴다. 여러 서버를 조직 단위로 관리·감사해야 하면 [ContextForge](/develop-wiki/ai/mcp-tooling/contextforge/) 같은 게이트웨이를 앞에 둔다.

## 공식 문서
- [README (서버 목록·사용법)](https://github.com/modelcontextprotocol/servers#readme) · [보관된 서버](https://github.com/modelcontextprotocol/servers-archived)
- [Filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) · [Git](https://github.com/modelcontextprotocol/servers/tree/main/src/git) · [Fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) · [Memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- [로컬 서버 연결 가이드](https://modelcontextprotocol.io/docs/develop/connect-local-servers)

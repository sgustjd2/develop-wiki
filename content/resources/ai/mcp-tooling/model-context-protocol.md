---
name: Model Context Protocol
url: https://modelcontextprotocol.io
repo: https://github.com/modelcontextprotocol
domain: ai
category: mcp-tooling
description: LLM 앱이 외부 도구·데이터에 연결하는 개방형 프로토콜. 서버/클라이언트 SDK와 명세를 제공한다.
pricing: oss
tags: [mcp, tools, protocol]
languages: [typescript, python, java, kotlin, csharp, go, rust]
docs: https://modelcontextprotocol.io/specification/latest
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Model Context Protocol(MCP)은 LLM 애플리케이션(호스트)이 외부 도구·데이터를 쓰는 방식을 표준화한 JSON-RPC 2.0 기반 프로토콜이다. 도구를 한 번 MCP 서버로 만들어 두면 Claude, IDE, 에이전트 프레임워크 등 MCP 클라이언트를 지원하는 어떤 앱에서도 재사용할 수 있다. Language Server Protocol 이 편집기와 언어 지원을 분리한 것과 비슷한 위치다.
현재 명세 개정판은 **2026-07-28** 이다. 이 개정판부터 프로토콜이 상태를 갖지 않는(stateless) 구조로 바뀌어, 모든 요청이 프로토콜 버전과 클라이언트 기능을 `_meta` 에 직접 담는다. 예전 `initialize` 핸드셰이크 기반 클라이언트와는 SDK 가 버전 협상으로 호환을 맞춘다.

## 설치
공식 SDK 는 TypeScript, Python, Java, Kotlin, C#, Go, Rust, Ruby 등으로 나와 있다.

```bash
# Python (SDK v2)
uv init my-server && cd my-server
uv add "mcp[cli]"

# TypeScript
npm install @modelcontextprotocol/server zod
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 호스트 / 클라이언트 / 서버 | 호스트(LLM 앱)가 서버마다 클라이언트 연결을 하나씩 만든다 |
| Tools | 모델이 호출하는 함수. 입력은 JSON Schema(기본 2020-12)로 기술 |
| Resources | 파일·API 응답처럼 읽기 전용 컨텍스트 데이터 (URI 로 식별) |
| Prompts | 사용자가 골라 쓰는 프롬프트 템플릿 |
| Elicitation | 서버가 처리 도중 사용자에게 추가 입력을 요청하는 클라이언트 기능 |
| 전송(transport) | `stdio`(로컬 하위 프로세스), Streamable HTTP(원격 서버) |
| 인가 | HTTP 전송은 OAuth 기반 인가 명세를 따르고, stdio 는 환경 변수로 자격 증명을 받는다 |
| 확장 | Tasks(장시간 비동기 작업), MCP Apps(대화 안 UI) 등 선택적 기능 |

2026-07-28 개정판에서 클라이언트 기능 중 sampling·roots, 그리고 logging 유틸리티는 deprecated 로 분류됐다.

## 기본 사용법
Python 으로 도구 하나짜리 서버 (`server.py`):

```python
from mcp.server import MCPServer

mcp = MCPServer("calc")

@mcp.tool()
def add(a: int, b: int) -> int:
    """두 정수를 더한다."""
    return a + b

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

타입 힌트와 docstring 에서 도구 스키마·설명이 자동으로 만들어진다. `uv run mcp dev server.py` 로 MCP Inspector 를 띄워 바로 호출해 볼 수 있다.

TypeScript 버전:

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

function createServer() {
  const server = new McpServer({ name: "calc", version: "1.0.0" });
  server.registerTool(
    "add",
    { description: "두 수를 더한다", inputSchema: z.object({ a: z.number(), b: z.number() }) },
    async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] }),
  );
  return server;
}

serveStdio(createServer);
```

`serveStdio` 는 요청마다 새 인스턴스가 필요할 수 있어 서버 객체 대신 팩토리 함수를 받는다.

## 자주 쓰는 패턴
- **클라이언트에 등록**: 대부분의 호스트는 `command`/`args`/`env` 로 stdio 서버를 띄우는 JSON 설정을 쓴다. [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 는 `claude mcp add` 로 추가한다.
- **stdout 금지**: stdio 서버에서 `print()`·`console.log()` 는 JSON-RPC 스트림을 깨뜨린다. 로그는 stderr 나 파일로 보낸다.
- **원격 서버**: 여러 사용자가 공유하는 서버는 Streamable HTTP 로 띄운다 (`uv run mcp run server.py --transport streamable-http`). 이때 인증은 OAuth 인가 흐름을 붙인다.
- **비밀값은 환경 변수로**: API 키는 클라이언트 설정의 `env` 로 주입하고 서버 코드나 저장소에 넣지 않는다.
- **도구 설명은 신뢰하지 않는다**: 서드파티 서버의 도구 설명·annotation 은 프롬프트 인젝션 통로가 될 수 있으므로, 호스트는 호출 전에 사용자 승인을 받는다.
- **에이전트 프레임워크 연동**: [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/), [LangChain](/develop-wiki/ai/agent-framework/langchain/), [Google ADK](/develop-wiki/ai/agent-framework/google-adk/), [Mastra](/develop-wiki/ai/agent-framework/mastra/) 등이 MCP 서버의 도구를 에이전트 도구로 불러오는 어댑터를 제공한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 같은 도구를 여러 AI 앱·에이전트에서 재사용하고 싶을 때, 사내 시스템(DB, 티켓, 문서)을 코딩 에이전트에 연결할 때, 도구 제공자와 소비자를 분리하고 싶을 때.
- 피할 때(대안): 한 애플리케이션 안에서만 쓰는 도구 몇 개라면 프레임워크의 함수 도구(function calling)로 직접 정의하는 편이 단순하다. 서버 하나를 더 운영·보안 점검하는 비용이 생긴다.

## 공식 문서
- [명세 (최신)](https://modelcontextprotocol.io/specification/latest) · [기본 프로토콜](https://modelcontextprotocol.io/specification/2026-07-28/basic) · [전송](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [서버 만들기 튜토리얼](https://modelcontextprotocol.io/docs/develop/build-server) · [Python SDK](https://github.com/modelcontextprotocol/python-sdk) · [GitHub 조직](https://github.com/modelcontextprotocol)

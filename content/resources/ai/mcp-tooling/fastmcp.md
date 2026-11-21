---
name: FastMCP
url: https://gofastmcp.com
docs: https://gofastmcp.com/docs/getting-started/welcome
repo: https://github.com/PrefectHQ/fastmcp
stars: 28703
domain: ai
category: mcp-tooling
description: Python 함수에 데코레이터를 붙여 MCP 서버·클라이언트를 만드는 Prefect 의 프레임워크. 서버 조합, 프록시, 인증, 테스트용 클라이언트까지 포함한다.
pricing: oss
tags: [mcp, server, client, python, framework]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
FastMCP 는 [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버와 클라이언트를 Python 으로 만드는 고수준 프레임워크다. 함수에 `@mcp.tool` 을 붙이면 타입 힌트·docstring 에서 입력 스키마와 설명이 만들어지고, 전송(stdio·HTTP)·프로토콜 협상·인증은 프레임워크가 맡는다.
FastMCP 1.0 은 2024년에 공식 Python SDK 에 흡수됐고(공식 SDK 의 고수준 서버 API 가 그 계보), 지금의 `fastmcp` 패키지는 Prefect 가 별도로 유지하는 독립 프로젝트다. 서버 조합(mount)·프록시·OAuth 연동·미들웨어처럼 공식 SDK 보다 넓은 기능을 다룬다.
**v4.2 기준**(2026-11 현재 4.2.1). v4 는 2026-07-28 명세의 무상태(stateless) 프로토콜과 이전 핸드셰이크 방식 클라이언트를 한 서버에서 동시에 지원한다. TypeScript 판은 별도 저장소(`@prefecthq/fastmcp-ts`)다.

## 설치
```bash
uv add fastmcp            # 권장
pip install fastmcp       # 또는 pip
fastmcp version           # 설치 확인
```
v4.2 는 Python 3.11 이상이 필요하다(3.10 환경은 4.1.x 로 해석된다). 인터랙티브 UI(Apps) 기능은 `fastmcp[apps]` extra 로 설치한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `FastMCP` | 서버 객체. 도구·리소스·프롬프트를 등록하고 `run()` 으로 실행 |
| `@mcp.tool` | 함수를 MCP 도구로 노출. 인자 타입 힌트 → JSON Schema, 반환값 → 결과 |
| `@mcp.resource("uri")` | URI 로 읽는 읽기 전용 데이터. `{param}` 이 들어가면 리소스 템플릿 |
| `@mcp.prompt` | 재사용 프롬프트 템플릿 |
| `Context` | 도구 안에서 로그·진행률·리소스 읽기 등 MCP 기능에 접근하는 객체 |
| `Client` | 어떤 MCP 서버(URL, 스크립트 경로, 서버 객체)에든 붙는 비동기 클라이언트 |
| `mount()` / `create_proxy()` | 여러 서버를 하나로 합치거나 원격·하위 프로세스 서버를 프록시 |
| Provider / Transform | 컴포넌트를 가져오는 출처(로컬, 파일 시스템, 프록시, 스킬)와 이름·스키마를 바꾸는 변환 계층 |
| `fastmcp.json` | 서버 진입점·의존성·실행 옵션을 선언하는 프로젝트 설정 파일 |

## 기본 사용법
서버 (`server.py`):

```python
from fastmcp import FastMCP

mcp = FastMCP("Notes")
notes: dict[str, str] = {}

@mcp.tool
def save_note(title: str, body: str) -> str:
    """제목과 본문으로 메모를 저장한다."""
    notes[title] = body
    return f"saved: {title}"

@mcp.resource("notes://{title}")
def read_note(title: str) -> str:
    return notes.get(title, "")

if __name__ == "__main__":
    mcp.run()                    # 기본 stdio
    # mcp.run(transport="http", port=8000)  # → http://localhost:8000/mcp
```

클라이언트로 호출하기:

```python
import asyncio
from fastmcp import Client

async def main():
    async with Client("http://localhost:8000/mcp") as client:
        tools = await client.list_tools()
        result = await client.call_tool("save_note", {"title": "a", "body": "b"})
        print([t.name for t in tools], result.data)

asyncio.run(main())
```

`Client` 는 무상태 프로토콜을 먼저 시도하고, 안 되면 핸드셰이크 방식으로 자동 전환한다.

## 자주 쓰는 패턴
- **CLI 로 실행**: `fastmcp run server.py:mcp --transport http --port 8000`. 이때 `if __name__ == "__main__"` 블록은 실행되지 않는다. 개발 중에는 `--reload` 로 파일 변경 시 재시작한다.
- **메모리 내 테스트**: `Client(mcp)` 처럼 서버 객체를 그대로 넘기면 네트워크 없이 pytest 에서 도구를 호출할 수 있다(`pytest-asyncio` 필요).

  ```python
  async def test_save():
      async with Client(mcp) as c:
          r = await c.call_tool("save_note", {"title": "t", "body": "x"})
          assert r.data == "saved: t"
  ```
- **서버 조합**: `main.mount(weather, namespace="weather")` 로 하위 서버를 붙이면 도구 이름이 `weather_<도구>` 로 바뀌어 충돌을 피한다. 외부 서버는 `create_proxy("https://…/mcp")` 로 감싸 mount 한다.
- **기존 API 변환**: `FastMCP.from_openapi(openapi_spec=spec, client=api_client)` 로(클라이언트는 `httpx2.AsyncClient`) OpenAPI 명세에서 도구를 생성한다. 엔드포인트가 많으면 필요한 것만 노출하도록 걸러 낸다.
- **클라이언트 등록**: `fastmcp install claude-code server.py` 처럼 호스트별 설치 명령이 의존성 설정까지 포함해 등록해 준다.
- **원격 배포 인증**: HTTP 서버는 토큰 검증, 외부 IdP(OAuth/OIDC 프록시) 연동을 서버 생성 시 `auth=` 로 붙인다. 비밀값은 환경 변수로 주입한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 으로 MCP 서버를 빠르게 만들 때, 여러 MCP 서버를 하나로 묶거나 프록시할 때, OAuth·미들웨어·백그라운드 작업 같은 운영 기능이 필요할 때, 파이썬 코드에서 MCP 서버를 호출·테스트할 때.
- 피할 때(대안): 의존성을 최소화하고 명세를 그대로 따르고 싶다면 공식 Python SDK(`mcp` 패키지)의 `MCPServer` 로 충분하다. TypeScript·Go 등 다른 언어 서버는 각 언어의 공식 SDK 를 쓴다. 메이저 버전 사이 변경이 잦으므로(v2→v3→v4) 업그레이드 가이드를 확인하고 버전을 고정한다.

## 공식 문서
- [Welcome](https://gofastmcp.com/docs/getting-started/welcome) · [설치](https://gofastmcp.com/docs/getting-started/installation) · [Quickstart](https://gofastmcp.com/docs/getting-started/quickstart) · [FastMCP 4 변경점](https://gofastmcp.com/docs/getting-started/whats-new)
- [서버](https://gofastmcp.com/docs/servers/server) · [서버 조합](https://gofastmcp.com/docs/servers/composition) · [테스트](https://gofastmcp.com/docs/servers/testing) · [서버 실행](https://gofastmcp.com/docs/deployment/running-server) · [클라이언트](https://gofastmcp.com/docs/clients/client)
- [GitHub](https://github.com/PrefectHQ/fastmcp) · [PyPI](https://pypi.org/project/fastmcp/)

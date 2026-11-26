---
name: Agno
url: https://www.agno.com
docs: https://docs.agno.com/
repo: https://github.com/agno-agi/agno
stars: 43316
domain: ai
category: agent-framework
description: 에이전트·팀·워크플로를 만드는 Python SDK와, 이를 API·MCP 서버로 띄우는 런타임 AgentOS를 함께 제공하는 프레임워크. 사내용 에이전트를 서비스로 운영할 때 쓴다.
pricing: oss
tags: [agent, multi-agent, python, runtime, memory]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-19
---

## 개요
Agno(옛 이름 Phidata)는 에이전트를 **만드는 SDK** 와 **운영하는 런타임(AgentOS)** 을 한 저장소에서 제공하는 Python 프레임워크다. SDK 로 `Agent`·`Team`·`Workflow` 를 정의하고, AgentOS 가 이를 REST API·MCP 서버로 띄워 인증·권한, 세션 저장, 재개·재실행, 사람 승인, 스케줄링, 내구 실행을 맡는다. 상태(대화, 메모리, 실행 기록)는 SQLite·PostgreSQL 같은 DB 에 저장한다.
2026-11-18 기준 최신 버전은 **3.2.1**(2026-11-17, Apache-2.0, Python 3.9+)이다. 공식 사이트는 스스로를 "self-managing agent platform" 으로 소개하며, 웹 Control Plane(os.agno.com)에서 실행 중인 AgentOS 에 접속해 대화·트레이스를 본다. Agno SDK 외에 Claude Agent SDK·Codex SDK 로 만든 에이전트도 AgentOS 에 올릴 수 있다고 문서에 적혀 있다.
그래프 정의보다 "에이전트를 서비스로 배포·운영" 하는 부분까지 한 번에 필요할 때 위치가 분명하다.

## 설치
```bash
uv add "agno[os,sqlite]" openai      # 또는 pip install -U "agno[os,sqlite]" openai
export OPENAI_API_KEY="..."          # 키는 환경 변수로
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` | 모델·도구·지시문으로 컨텍스트를 만들고 도구를 실행해 `RunOutput` 을 돌려주는 단위 |
| 모델 클래스 | `agno.models.openai.OpenAIResponses(id=...)`, `agno.models.anthropic.Claude(id=...)` 처럼 공급자별 클래스 |
| 도구 | 타입 힌트·docstring 이 있는 Python 함수나 Toolkit(`HackerNewsTools()`, `MCPTools` 등)을 `tools=[...]` 로 전달 |
| `Team` | 여러 `Agent`/`Team` 을 `members` 로 묶음. `TeamMode.coordinate`(기본)·`broadcast` 등 모드 |
| `Workflow` | 에이전트·팀·함수를 정해진 단계로 실행하는 결정적 파이프라인 |
| DB | `SqliteDb`, PostgreSQL 등. 세션·메모리·실행 기록 저장 |
| 메모리·지식 | 사용자 메모리, RAG 용 knowledge 를 에이전트에 붙임 |
| AgentOS | 에이전트를 HTTP 앱(`get_app()`)으로 서빙. 기본 `localhost:7777`, `/docs` 에 API 문서 |

## 기본 사용법
함수 도구 하나를 가진 에이전트:

```python
from agno.agent import Agent
from agno.models.openai import OpenAIResponses

def lookup_order(order_id: str) -> str:
    """주문 번호로 배송 상태를 조회한다."""
    return {"A100": "배송 중"}.get(order_id, "주문 없음")

agent = Agent(
    model=OpenAIResponses(id="gpt-5.4-mini"),
    tools=[lookup_order],
    instructions="배송 문의에는 주문 도구를 쓰고 한국어로 답한다.",
    markdown=True,
)
agent.print_response("A100 주문 어디쯤이야?", stream=True)
```
개발 중에는 `print_response()`, 서비스 코드에서는 `run()`/`arun()` 을 쓴다. 모델 id 는 공급자 목록에서 확인한다.

## 자주 쓰는 패턴
- **AgentOS 로 서빙**:

  ```python
  from agno.db.sqlite import SqliteDb
  from agno.os import AgentOS
  db = SqliteDb(db_file="agent.db")
  agent_os = AgentOS(agents=[agent], db=db, tracing=True)
  app = agent_os.get_app()          # uvicorn 등으로 실행하거나 agent_os.serve(...)
  ```
- **대화 기록 유지**: `Agent(db=db, add_history_to_context=True)` 로 세션별 이전 대화를 컨텍스트에 넣는다.
- **팀 구성**: `Team(members=[researcher, writer], mode=TeamMode.coordinate)` — 리더가 작업을 나눠 위임하고 결과를 합친다.
- **스트리밍 이벤트**: `for ev in agent.run(prompt, stream=True): if ev.event == RunEvent.run_content: ...`.

## 언제 쓰나 / 피할 때
- 쓸 때: 에이전트를 사내 API·Slack 봇·백오피스 기능으로 배포하고, 세션 저장·인증·스케줄·트레이싱을 직접 만들고 싶지 않을 때.
- 피할 때(대안): 런타임 없이 라이브러리만 필요하면 [Pydantic AI](/develop-wiki/ai/agent-framework/pydantic-ai/)나 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/), 상태 그래프를 세밀하게 제어하려면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), 역할 기반 크루 모델이면 [CrewAI](/develop-wiki/ai/agent-framework/crewai/).

## 공식 문서
- [문서 홈](https://docs.agno.com/) · [첫 에이전트](https://docs.agno.com/first-agent) · [에이전트 만들기](https://docs.agno.com/agents/building-agents) · [도구](https://docs.agno.com/tools/overview)
- [Teams](https://docs.agno.com/teams/overview) · [Workflows](https://docs.agno.com/workflows/overview) · [AgentOS](https://docs.agno.com/agent-os/introduction) · [릴리스](https://github.com/agno-agi/agno/releases)

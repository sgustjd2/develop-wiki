---
name: OpenAI Agents SDK
url: https://openai.github.io/openai-agents-python/
repo: https://github.com/openai/openai-agents-python
stars: 30798
domain: ai
category: agent-framework
description: 에이전트·핸드오프·가드레일·트레이싱 같은 적은 기본 요소로 멀티 에이전트 워크플로를 만드는 OpenAI의 SDK. 가벼운 코드 중심 에이전트가 필요할 때 쓴다.
pricing: oss
tags: [agent, multi-agent, openai]
languages: [python, typescript]
docs: https://openai.github.io/openai-agents-python/
addedAt: 2026-11-18
verifiedAt: 2026-11-22
---

## 개요
OpenAI Agents SDK 는 에이전트(지시문 + 도구를 가진 LLM), 핸드오프, 가드레일, 세션, 트레이싱 같은 적은 수의 기본 요소로 멀티 에이전트 앱을 만드는 라이브러리다. 그래프 DSL 없이 평범한 Python 코드로 흐름을 짜고, `Runner` 가 도구 호출 → 결과 반영 → 최종 답변까지의 루프를 돌린다.
OpenAI Responses API 에 맞춰져 있지만 Chat Completions 호환 엔드포인트를 쓰는 다른 공급자·자체 호스팅 모델도 붙일 수 있다. 명시적 상태 그래프와 체크포인트가 중요하면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/) 가 대안이다.
Python(`openai-agents`, 2026-11 기준 v0.25.0, Python 3.10+)과 JS/TS(`openai-agents-js`) 판이 있다. 아래는 Python 기준.

## 설치
```bash
pip install openai-agents      # 또는 uv add openai-agents
export OPENAI_API_KEY="..."    # 키는 환경 변수로만 둔다
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` | `name`, `instructions`, `tools`, `handoffs`, `model`, `output_type` 등을 가진 LLM 단위 |
| `Runner` | 에이전트 루프 실행기. `Runner.run`(async), `Runner.run_sync`, 스트리밍 실행 제공 |
| 함수 도구 | `@function_tool`(별칭 `agents.decorators.tool`)로 파이썬 함수를 도구로 등록. 타입 힌트·docstring 으로 스키마 생성 |
| 호스티드 도구 | `WebSearchTool`, `FileSearchTool`, `CodeInterpreterTool`, `HostedMCPTool` 등 OpenAI 서버 측 도구 |
| 핸드오프 | 다른 에이전트에게 대화 제어권을 넘김 (`handoffs=[...]`) |
| Agents as tools | `agent.as_tool(...)` 로 하위 에이전트를 도구처럼 호출하고 제어권은 유지 |
| 가드레일 | 입력·출력을 검사하고 조건이 맞으면 tripwire 로 실행을 중단 |
| 세션 | 대화 기록을 자동 저장·로드하는 메모리 (`SQLiteSession` 등) |
| 트레이싱 | 실행 단계를 기록해 OpenAI 대시보드 등에서 확인 |
| 샌드박스 에이전트 | 격리된 작업 공간에서 파일·셸 작업을 하는 에이전트 |

## 기본 사용법
도구 하나를 가진 최소 에이전트:

```python
from agents import Agent, Runner, function_tool

@function_tool
def get_exchange_rate(base: str, target: str) -> str:
    """두 통화 간 환율을 돌려준다."""
    rates = {("USD", "KRW"): 1380.0}
    return str(rates.get((base, target), "unknown"))

agent = Agent(
    name="Assistant",
    instructions="환율 질문에는 도구를 써서 한국어로 답한다.",
    tools=[get_exchange_rate],
)
result = Runner.run_sync(agent, "1달러는 몇 원이야?")
print(result.final_output)
```

## 자주 쓰는 패턴
- **트리아지 + 핸드오프**: 분류용 에이전트에 `handoffs=[billing_agent, tech_agent]` 를 주고, 각 전문 에이전트가 이어서 답하게 한다.
- **매니저 패턴**: 제어권을 넘기지 않고 `tools=[researcher.as_tool(tool_name="research", tool_description="...")]` 로 하위 에이전트를 호출한다.
- **대화 기억**:

  ```python
  from agents import SQLiteSession
  session = SQLiteSession("user-42")
  await Runner.run(agent, "내 이름은 민수야", session=session)
  await Runner.run(agent, "내 이름이 뭐였지?", session=session)
  ```
- **입력 가드레일**: `@input_guardrail` 함수가 `GuardrailFunctionOutput(tripwire_triggered=...)` 를 돌려주면 `InputGuardrailTripwireTriggered` 예외로 실행이 멈춘다. 값싼 모델로 먼저 검사해 비용을 줄이는 데 쓴다.
- **MCP 서버 연결**: `from agents.mcp import MCPServerStdio` 를 `async with` 로 열고 `Agent(..., mcp_servers=[server])` 로 넘긴다. 원격 서버는 `MCPServerStreamableHttp` 또는 `HostedMCPTool`. ([MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/))
- **다른 모델 공급자**: `OpenAIChatCompletionsModel(model=..., openai_client=AsyncOpenAI(base_url=...))` 로 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[Ollama](/develop-wiki/ai/inference-serving/ollama/) 같은 OpenAI 호환 서버를 쓴다. OpenAI 키가 없으면 `set_tracing_disabled(True)` 로 트레이싱 업로드를 끈다.
- **구조화 출력**: `Agent(output_type=MyPydanticModel)` 로 최종 답을 타입이 있는 객체로 받는다.

## 언제 쓰나 / 피할 때
- 쓸 때: OpenAI 모델 중심으로 도구 호출·멀티 에이전트를 가볍게 구성하고 싶을 때, 트레이싱·가드레일·세션을 기본 제공으로 쓰고 싶을 때, 음성(Realtime) 에이전트.
- 피할 때(대안): 분기·반복·사람 승인 단계가 많은 장기 실행 워크플로를 명시적으로 그려야 하면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), 모델 공급자 통합 폭이 중요하면 [LangChain](/develop-wiki/ai/agent-framework/langchain/), Google Cloud 배포 중심이면 [Google ADK](/develop-wiki/ai/agent-framework/google-adk/), TypeScript 풀스택이면 [Mastra](/develop-wiki/ai/agent-framework/mastra/).

## 공식 문서
- [문서 홈](https://openai.github.io/openai-agents-python/) · [Quickstart](https://openai.github.io/openai-agents-python/quickstart/) · [도구](https://openai.github.io/openai-agents-python/tools/) · [MCP](https://openai.github.io/openai-agents-python/mcp/)
- [가드레일](https://openai.github.io/openai-agents-python/guardrails/) · [세션](https://openai.github.io/openai-agents-python/sessions/) · [모델 설정](https://openai.github.io/openai-agents-python/models/) · [JS/TS 판](https://github.com/openai/openai-agents-js)

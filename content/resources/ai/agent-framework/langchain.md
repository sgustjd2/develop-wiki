---
name: LangChain
url: https://docs.langchain.com/oss/python/langchain/overview
repo: https://github.com/langchain-ai/langchain
stars: 149983
domain: ai
category: agent-framework
description: 모델·도구 통합과 LangGraph 기반 에이전트 루프(create_agent)를 제공하는 LLM 앱 프레임워크. 여러 모델 공급자를 바꿔 가며 에이전트를 빠르게 만들 때 쓴다.
pricing: oss
tags: [agent, llm, integrations]
languages: [python, typescript]
docs: https://docs.langchain.com/oss/python/langchain/overview
addedAt: 2026-11-18
verifiedAt: 2026-11-21
---

## 개요
LangChain 은 여러 LLM 공급자·도구·벡터 저장소를 같은 인터페이스로 다루게 해 주는 LLM 애플리케이션 프레임워크다. 1.x 부터는 `create_agent` 하나로 "모델 + 도구 + 시스템 프롬프트" 에이전트를 만들고, 그 실행 루프는 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/) 위에서 돈다. 동작을 바꾸고 싶으면 체인을 새로 짜는 대신 미들웨어를 끼운다.
모델 문자열(`"provider:model"`)만 바꿔 공급자를 교체할 수 있다는 점이 강점이다. 세밀한 흐름 제어가 필요하면 LangGraph 로 내려가고, 장기 작업용 고수준 에이전트는 같은 팀의 `deepagents` 패키지가 맡는다.
2026-11 기준 Python `langchain` 1.5.0(Python 3.11+). JS/TS 판도 있다.

## 설치
```bash
pip install -U langchain
pip install -U langchain-openai          # 공급자별 통합 패키지를 따로 설치
# uv 사용 시: uv add langchain langchain-openai
export OPENAI_API_KEY="..."              # 공급자 키는 환경 변수로
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `create_agent` | 모델·도구·`system_prompt` 로 도구 호출 루프를 가진 에이전트 그래프를 만든다 |
| 모델 식별자 | `"openai:..."`, `"google_genai:..."` 같은 `공급자:모델` 문자열 또는 초기화된 채팅 모델 객체 |
| 도구 | `@tool`(`langchain.tools`) 데코레이터, 일반 파이썬 함수, 도구 dict 모두 가능 |
| 메시지 | `{"messages": [...]}` 상태로 입출력. 응답은 `content_blocks` 로 공급자 무관하게 읽음 |
| 미들웨어 | 모델·도구 호출 앞뒤에 끼워 요약, 사람 승인, 재시도 등을 추가 |
| 체크포인터 | 스레드별 대화 상태 저장 (`InMemorySaver`, 운영에서는 DB 기반) |
| `response_format` | 최종 답을 스키마로 검증된 구조화 출력으로 받음 |
| 통합 패키지 | `langchain-openai`, `langchain-anthropic` 등 공급자·벡터 DB 어댑터 |

## 기본 사용법
도구 하나를 가진 에이전트:

```python
from langchain.agents import create_agent
from langchain.tools import tool

@tool
def get_weather(city: str) -> str:
    """도시의 현재 날씨를 돌려준다."""
    return f"{city}: 맑음, 18°C"

agent = create_agent(
    model="openai:<모델명>",  # 설치한 langchain-openai 사용
    tools=[get_weather],
    system_prompt="날씨 질문에는 도구를 써서 짧게 답한다.",
)
result = agent.invoke({"messages": [{"role": "user", "content": "서울 날씨 어때?"}]})
print(result["messages"][-1].content)
```

## 자주 쓰는 패턴
- **대화 기억(스레드)**:

  ```python
  from langgraph.checkpoint.memory import InMemorySaver
  agent = create_agent(model=..., tools=[...], checkpointer=InMemorySaver())
  cfg = {"configurable": {"thread_id": "user-42"}}
  agent.invoke({"messages": [{"role": "user", "content": "내 이름은 민수"}]}, config=cfg)
  ```
- **사람 승인**: `HumanInTheLoopMiddleware(interrupt_on={"write_file": True})` 를 `middleware=[...]` 로 넣으면 해당 도구 호출 전에 실행이 멈추고 승인을 기다린다(체크포인터 필요).
- **구조화 출력**: `create_agent(..., response_format=MyPydanticModel)` 로 결과를 검증된 객체로 받는다.
- **공급자 교체**: 모델 문자열만 바꾸고 도구·프롬프트는 그대로 둔다. 자체 호스팅 모델은 OpenAI 호환 엔드포인트([vLLM](/develop-wiki/ai/inference-serving/vllm/), [Ollama](/develop-wiki/ai/inference-serving/ollama/))를 가리키는 채팅 모델 객체를 넘긴다.
- **스트리밍**: 중간 메시지·도구 활동을 `agent.stream_events(...)` 로 받아 UI 에 표시한다.
- **MCP 도구**: MCP 어댑터로 [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버의 도구를 LangChain 도구로 불러와 `tools` 에 넣는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 모델 공급자를 비교·교체하며 에이전트를 빠르게 만들 때, 벡터 저장소·문서 로더 등 기존 통합을 활용하는 RAG, 나중에 LangGraph 로 확장할 여지가 필요한 프로젝트.
- 피할 때(대안): 노드·분기·병렬 실행을 직접 설계해야 하면 처음부터 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/). 의존성을 최소화하고 OpenAI 중심이면 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/). TypeScript 앱이면 [Mastra](/develop-wiki/ai/agent-framework/mastra/), Java 는 [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/)(별도 프로젝트).

## 공식 문서
- [개요](https://docs.langchain.com/oss/python/langchain/overview) · [Quickstart](https://docs.langchain.com/oss/python/langchain/quickstart) · [에이전트(create_agent)](https://docs.langchain.com/oss/python/langchain/agents)
- [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) · [GitHub](https://github.com/langchain-ai/langchain)

---
name: LangGraph
url: https://www.langchain.com/langgraph
repo: https://github.com/langchain-ai/langgraph
stars: 45368
domain: ai
category: agent-framework
description: 상태 그래프로 에이전트 워크플로를 구성하는 프레임워크. 체크포인트와 사람 개입 단계를 지원한다.
pricing: oss
tags: [agent, workflow]
languages: [python, typescript]
docs: https://docs.langchain.com/oss/python/langgraph/overview
addedAt: 2026-11-18
verifiedAt: 2026-11-21
---

## 개요
LangGraph 는 에이전트·워크플로를 **상태(state) + 노드 + 엣지**로 이뤄진 그래프로 정의하고 실행하는 저수준 오케스트레이션 프레임워크다. 각 단계 뒤 상태를 체크포인트로 저장하므로 실패 지점에서 재개하거나(durable execution), 중간에 멈춰 사람의 승인·수정을 받고 이어 갈 수 있다.
프롬프트나 에이전트 구조를 강제하지 않고 실행 제어만 제공한다. "모델 + 도구" 기본 에이전트가 필요하면 그 위에 만든 [LangChain](/develop-wiki/ai/agent-framework/langchain/) 의 `create_agent` 를 쓰고, 분기·루프·병렬·사람 개입을 직접 설계할 때 LangGraph 를 쓴다.
2026-11 기준 Python `langgraph` 1.2.22(Python 3.10+). JS/TS 판(`@langchain/langgraph`)도 있다.

## 설치
```bash
pip install -U langgraph        # 또는 uv add langgraph
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| State | 그래프 전체가 공유하는 상태 스키마 (`TypedDict`, `MessagesState` 등) |
| Node | 상태를 받아 갱신할 부분만 dict 로 돌려주는 함수 |
| Edge | 노드 간 이동. `START`/`END` 와 조건부 엣지(`add_conditional_edges`) |
| Reducer | 같은 키를 여러 노드가 쓸 때 합치는 규칙 (메시지 목록은 append) |
| `compile()` | 그래프를 검증하고 실행 가능한 객체로 만듦. 여기서 체크포인터를 붙임 |
| Checkpointer | 단계별 상태 저장소. `thread_id` 로 대화·실행을 구분 |
| `interrupt()` / `Command` | 노드 안에서 실행을 멈추고, `Command(resume=값)` 으로 재개 |
| 스트리밍 | 토큰, 상태 업데이트, 커스텀 이벤트를 실행 중 내보냄 |
| 메모리 | 스레드 단위 단기 기억 + 세션을 넘는 장기 기억(store) |

## 기본 사용법
두 노드를 잇는 최소 그래프(LLM 호출 대신 고정 응답):

```python
from langgraph.graph import StateGraph, MessagesState, START, END

def respond(state: MessagesState):
    last = state["messages"][-1].content
    return {"messages": [{"role": "assistant", "content": f"받은 말: {last}"}]}

builder = StateGraph(MessagesState)
builder.add_node(respond)
builder.add_edge(START, "respond")
builder.add_edge("respond", END)
graph = builder.compile()

out = graph.invoke({"messages": [{"role": "user", "content": "안녕"}]})
print(out["messages"][-1].content)
```

실제 에이전트는 `respond` 자리에 채팅 모델 호출 노드를 두고, 도구 호출이 있으면 도구 노드로, 없으면 `END` 로 가는 조건부 엣지를 단다.

## 자주 쓰는 패턴
- **사람 승인 단계**:

  ```python
  from langgraph.types import interrupt, Command
  from langgraph.checkpoint.memory import InMemorySaver

  def approve(state):
      ok = interrupt("이 작업을 실행할까요?")   # 여기서 멈춤
      return {"approved": ok}
  # graph = builder.compile(checkpointer=InMemorySaver())
  # cfg = {"configurable": {"thread_id": "t1"}}
  # graph.invoke(Command(resume=True), config=cfg)  # 재개 값이 interrupt() 반환값
  ```
  재개에는 체크포인터와 같은 `thread_id` 가 필요하다.
- **조건부 라우팅**: `add_conditional_edges("agent", route_fn)` 에서 상태를 보고 다음 노드 이름을 돌려준다.
- **영속화**: 개발은 `InMemorySaver`, 운영은 DB 기반 체크포인터(예: [PostgreSQL](/develop-wiki/backend/database/postgresql/))로 바꿔 프로세스 재시작 후에도 재개한다.
- **멀티 에이전트**: 각 에이전트를 서브그래프(노드)로 넣고 슈퍼바이저 노드가 라우팅한다.
- **스트리밍 UI**: `graph.stream_events(...)` 로 토큰과 노드 진행 상황을 프런트엔드에 전달한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 단계가 많고 실패 재개가 중요한 장기 실행 에이전트, 승인·검토 같은 사람 개입 지점이 있는 업무 흐름, 루프·분기·병렬을 명시적으로 통제해야 할 때.
- 피할 때(대안): 단순한 도구 호출 에이전트에는 과하다 → [LangChain](/develop-wiki/ai/agent-framework/langchain/) `create_agent` 나 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/). 역할 기반 협업 팀을 빠르게 구성하려면 [CrewAI](/develop-wiki/ai/agent-framework/crewai/), Go 서비스라면 [Eino](/develop-wiki/ai/agent-framework/eino/).

## 공식 문서
- [개요](https://docs.langchain.com/oss/python/langgraph/overview) · [Interrupts(사람 개입)](https://docs.langchain.com/oss/python/langgraph/interrupts) · [GitHub](https://github.com/langchain-ai/langgraph)

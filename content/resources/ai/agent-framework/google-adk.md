---
name: Agent Development Kit (ADK)
url: https://adk.dev/
repo: https://github.com/google/adk-python
stars: 22262
domain: ai
category: agent-framework
description: 에이전트 정의, 그래프·멀티 에이전트 워크플로, 평가, 배포까지 다루는 Google의 코드 중심 에이전트 툴킷. Gemini·Google Cloud 환경에서 에이전트를 만들 때 쓴다.
pricing: oss
tags: [agent, multi-agent, workflow, google]
languages: [python, typescript, go, java, kotlin]
docs: https://adk.dev/
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Agent Development Kit(ADK)는 Google 이 만든 코드 중심 에이전트 개발 툴킷이다. LLM 에이전트 정의부터 멀티 에이전트·그래프 워크플로, 로컬 개발용 웹 UI, 평가(`adk eval`), Cloud Run·GKE·Agent Runtime 배포까지 한 도구 안에서 다룬다.
Gemini 와 함께 쓰는 예제가 기본이지만 LiteLLM 래퍼(`pip install "google-adk[extensions]"`) 등으로 다른 모델이나 [Ollama](/develop-wiki/ai/inference-serving/ollama/)·[vLLM](/develop-wiki/ai/inference-serving/vllm/) 호스팅 모델도 쓸 수 있다. Python·TypeScript·Go·Java·Kotlin SDK 가 있다.
2026-11 기준 Python `google-adk` 2.14.1(Python 3.11+), npm `@google/adk` 2.5.0. Google Cloud 배포·평가까지 한 흐름으로 가져가려는 팀에 맞다.

## 설치
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install google-adk

# 다른 언어
npm install @google/adk                    # TypeScript
go get google.golang.org/adk/v2            # Go
# Java: com.google.adk:google-adk / Kotlin: com.google.adk:google-adk-kotlin-core
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` / `LlmAgent` | 모델·`instruction`·`tools`·`sub_agents` 를 가진 LLM 에이전트 |
| `root_agent` | 프로젝트의 진입 에이전트. CLI·웹 UI 가 이 이름을 찾는다 |
| 함수 도구 | 파이썬 함수를 `tools=[...]` 에 넣으면 시그니처·docstring 으로 도구가 됨 |
| 워크플로 에이전트 | `SequentialAgent`, `ParallelAgent`, `LoopAgent` — 정해진 순서·병렬·반복 패턴 |
| 그래프 워크플로 | `Workflow(edges=[...])` 로 에이전트·함수 노드를 잇고 라우팅·분기를 명시 (v2) |
| 세션·상태 | 대화 이벤트와 상태를 저장하는 세션 서비스 |
| `McpToolset` | [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버의 도구를 ADK 도구로 연결 |
| CLI | `adk create`, `adk run`, `adk web`, `adk eval`, `adk deploy` |

## 기본 사용법
```bash
adk create my_agent         # my_agent/agent.py, __init__.py, .env 생성
echo 'GOOGLE_API_KEY="..."' > my_agent/.env   # 실제 키는 저장소에 커밋하지 않는다
```

`my_agent/agent.py`:

```python
from google.adk.agents.llm_agent import Agent

def get_exchange_rate(base: str, target: str) -> dict:
    """두 통화 간 환율을 돌려준다."""
    return {"base": base, "target": target, "rate": 1380.0}

root_agent = Agent(
    model="gemini-flash-latest",
    name="root_agent",
    description="환율을 알려 주는 에이전트",
    instruction="환율 질문에는 get_exchange_rate 도구를 써서 한국어로 답한다.",
    tools=[get_exchange_rate],
)
```

```bash
adk run my_agent            # 터미널에서 대화
adk web --port 8000         # my_agent 의 상위 폴더에서 실행, 브라우저 개발 UI
```

## 자주 쓰는 패턴
- **고정 파이프라인**: `SequentialAgent(name="pipeline", sub_agents=[writer, reviewer, refactorer])` 로 작성 → 검토 → 수정 순서를 고정한다. 동시에 돌릴 조사는 `ParallelAgent`, 조건 충족까지 반복은 `LoopAgent`.
- **그래프 워크플로**: `from google.adk import Workflow` 후 `Workflow(name=..., edges=[("START", agent_a, some_function, agent_b)])` 처럼 노드를 나열한다. 노드 출력이 다음 노드 입력으로 넘어가며, 라우터 노드로 분기할 수 있다.
- **MCP 도구 붙이기**: 먼저 `pip install "google-adk[mcp]"` 로 extra 를 설치한 뒤 `McpToolset(connection_params=StdioConnectionParams(...))` 를 `tools` 에 넣는다.
- **평가**: `pip install "google-adk[eval]"` 로 평가 의존성을 설치한 뒤, 평가 세트를 만들어 `adk eval` 이나 pytest 로 회귀 테스트를 돌린다.
- **배포**: `adk deploy cloud_run --project=$GOOGLE_CLOUD_PROJECT --region=$GOOGLE_CLOUD_LOCATION ./my_agent` (`--with_ui` 로 웹 UI 포함).
- **세션 저장**: `adk run --save_session --session_id s1 ./my_agent` 로 대화 세션을 남겨 재현·평가에 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Gemini·Vertex AI·Cloud Run 을 쓰는 팀, 개발 UI·평가·배포까지 표준화된 흐름이 필요할 때, 여러 언어(특히 Java·Go·Kotlin) 서비스에서 같은 에이전트 개념을 쓰고 싶을 때.
- 피할 때(대안): OpenAI 모델 위주의 가벼운 앱은 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/), 체크포인트·사람 개입 중심의 상태 그래프는 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), .NET 중심 조직은 [Microsoft Agent Framework](/develop-wiki/ai/agent-framework/microsoft-agent-framework/).

## 공식 문서
- [문서 홈](https://adk.dev/) · [Python 시작하기](https://adk.dev/get-started/python/) · [그래프 워크플로](https://adk.dev/graphs/) · [워크플로 에이전트](https://adk.dev/agents/workflow-agents/)
- [MCP 도구](https://adk.dev/tools-custom/mcp-tools/) · [CLI](https://adk.dev/runtime/command-line/) · [Cloud Run 배포](https://adk.dev/deploy/cloud-run/) · [평가](https://adk.dev/evaluate/) · [GitHub (Python)](https://github.com/google/adk-python)

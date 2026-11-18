---
name: Microsoft Agent Framework
url: https://learn.microsoft.com/en-us/agent-framework/
domain: ai
category: agent-framework
description: AutoGen과 Semantic Kernel의 후속인 Microsoft의 에이전트·그래프 워크플로 프레임워크. .NET·Python(Go는 프리뷰)으로 에이전트를 만들 때 쓴다.
pricing: oss
tags: [agent, multi-agent, workflow, microsoft]
languages: [csharp, python, go]
docs: https://learn.microsoft.com/en-us/agent-framework/overview/
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Microsoft Agent Framework 는 Semantic Kernel 과 AutoGen 팀이 함께 만든 두 프로젝트의 직접적인 후속작이다. AutoGen 의 에이전트 추상화와 Semantic Kernel 의 상태 관리·미들웨어·텔레메트리 기능을 한 프레임워크로 모았고, 실행 경로를 명시하는 그래프 워크플로를 더했다.
.NET 과 Python 이 중심이며 Go SDK 는 공개 프리뷰(Go 1.26+)다. Microsoft Foundry·Azure OpenAI 외에 OpenAI, Anthropic, Gemini, Bedrock, [Ollama](/develop-wiki/ai/inference-serving/ollama/) 등 여러 모델 공급자를 같은 `Agent` 인터페이스로 쓴다.
2026-11 기준 Python `agent-framework` 1.26.0(Python 3.11+). .NET 패키지는 문서상 `--prerelease` 로 설치한다.

## 설치
```bash
# Python: 필요한 공급자 패키지만 (agent-framework-core 가 함께 설치됨)
pip install agent-framework-openai
pip install agent-framework-foundry azure-identity
# 모든 통합을 한 번에: pip install agent-framework
```

```bash
# .NET
dotnet add package Microsoft.Agents.AI.OpenAI --prerelease
dotnet add package Microsoft.Agents.AI.Foundry --prerelease

# Go (preview)
go get github.com/microsoft/agent-framework-go
```

Python 판은 `.env` 를 자동으로 읽지 않는다. 필요하면 `load_dotenv()` 를 직접 호출한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` / `AIAgent` | 지시문·도구·미들웨어를 가진 에이전트. Python 은 `Agent(client=...)`, .NET 은 `.AsAIAgent(...)` |
| 채팅 클라이언트 | 공급자별 추론 클라이언트. Python OpenAI 는 `OpenAIChatClient`(Responses), `OpenAIChatCompletionClient` |
| 도구 | Python `@tool`, .NET `AIFunctionFactory.Create`. 고위험 도구는 승인 모드로 사람 확인 |
| 세션 | `AgentSession` 으로 여러 턴의 대화 상태 유지 |
| 미들웨어·컨텍스트 공급자 | 에이전트 동작 가로채기, 메모리·RAG 주입 |
| Harness Agent | 계획·할 일 추적·컨텍스트 압축·파일 접근을 갖춘 장기 작업용 에이전트 |
| 워크플로 | Executor(작업 단위) + Edge(라우팅)로 구성. Python 은 `WorkflowBuilder`(그래프)와 `@workflow`(함수형) 제공 |
| 체크포인트 | 그래프 워크플로는 superstep 경계마다 상태 저장, 사람 입력 대기 후 재개 |

## 기본 사용법
OpenAI 공급자로 도구 하나를 가진 에이전트(Python). `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL` 환경 변수를 미리 설정한다.

```python
import asyncio
from agent_framework import Agent, tool
from agent_framework.openai import OpenAIChatClient

@tool(approval_mode="never_require")   # 읽기 전용 도구라 승인 생략
def get_weather(location: str) -> str:
    """지역의 날씨를 돌려준다."""
    return f"{location}: 맑음, 18°C"

async def main() -> None:
    agent = Agent(
        client=OpenAIChatClient(),
        instructions="날씨 질문에는 도구를 써서 짧게 답한다.",
        tools=[get_weather],
    )
    print(await agent.run("부산 날씨 알려 줘"))

asyncio.run(main())
```

## 자주 쓰는 패턴
- **멀티 턴**: `session = agent.create_session()` 후 `await agent.run("...", session=session)` 을 반복한다. .NET 은 `await agent.CreateSessionAsync()`.
- **스트리밍**: `async for chunk in agent.run("...", stream=True): print(chunk.text, end="")`. .NET 은 `RunStreamingAsync`.
- **Azure 인증**: 키 대신 `AzureCliCredential`(개발)·`ManagedIdentityCredential`(운영)을 `credential=` 로 넘긴다. `DefaultAzureCredential` 은 운영에서 지연·의도치 않은 자격 증명 탐색 위험이 있다.
- **OpenAI 호환 서버**: `OpenAIChatCompletionClient(model=..., base_url="http://localhost:8000/v1")` 로 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 등에 연결한다.
- **워크플로 선택**: 순차 파이프라인·임의 루프는 함수형 `@workflow`, 고정된 fan-out/fan-in 과 타입 검증 라우팅은 `WorkflowBuilder`. 완성된 워크플로는 `.as_agent()` 로 다시 에이전트처럼 노출할 수 있다.
- **MCP**: 로컬 MCP 서버 도구와 호스티드 MCP 도구를 모두 지원한다([MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/)).
- **기존 코드 이전**: Semantic Kernel·AutoGen 앱은 공식 마이그레이션 가이드를 따라 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: .NET([ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/)) 서비스에 에이전트를 넣을 때, Azure·Microsoft Foundry 를 쓰는 조직, Semantic Kernel·AutoGen 을 쓰던 프로젝트의 후속 선택지, 엔터프라이즈 텔레메트리·승인 흐름이 필요할 때.
- 피할 때(대안): Python 만 쓰고 그래프 상태·체크포인트 생태계가 중요하면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), Gemini·Google Cloud 중심이면 [Google ADK](/develop-wiki/ai/agent-framework/google-adk/), Java 면 [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/). Go SDK 는 아직 프리뷰라 일부 기능(선언형 에이전트, 함수형 워크플로 등)이 빠져 있다.

## 공식 문서
- [개요](https://learn.microsoft.com/en-us/agent-framework/overview/) · [첫 에이전트](https://learn.microsoft.com/en-us/agent-framework/get-started/your-first-agent) · [도구 추가](https://learn.microsoft.com/en-us/agent-framework/get-started/add-tools) · [멀티 턴](https://learn.microsoft.com/en-us/agent-framework/get-started/multi-turn)
- [워크플로 개념](https://learn.microsoft.com/en-us/agent-framework/concepts/workflows/) · [모델 공급자](https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/model-providers/) · [OpenAI 공급자](https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/model-providers/openai) · [Go SDK GitHub](https://github.com/microsoft/agent-framework-go)

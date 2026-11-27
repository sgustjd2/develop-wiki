---
name: Strands Agents
url: https://strandsagents.com/
docs: https://strandsagents.com/docs/user-guide/sdk/quickstart/overview/
repo: https://github.com/strands-agents/harness-sdk
stars: 9300
domain: ai
category: agent-framework
description: 모델이 계획·도구 선택을 주도하는 "모델 주도" 방식의 오픈소스 에이전트 SDK(Python·TypeScript). AWS가 시작했고 Bedrock 외 여러 공급자를 지원하며, 자체 프로세스에서 도는 에이전트 루프가 필요할 때 쓴다.
pricing: oss
tags: [agent, aws, bedrock, mcp, multi-agent, harness]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-23
---

## 개요
Strands Agents 는 프롬프트·도구·모델만 주면 계획과 도구 선택은 모델에게 맡기는 **model-driven** 에이전트 SDK 다. 호스팅된 컨트롤 플레인 없이 내 프로세스 안에서 루프가 돌고, 컨텍스트 관리·실행 한도·OpenTelemetry 트레이싱·훅·가드레일이 기본으로 들어 있다. Amazon Bedrock 이 기본 공급자지만 Anthropic·OpenAI·Gemini·Ollama·LiteLLM·llama.cpp 등도 지원한다.
**저장소 이동 주의**: 원래의 `strands-agents/sdk-python` 은 `strands-agents/harness-sdk` 모노레포로 옮겨졌고(옛 URL 은 리다이렉트), 별도 TS 저장소 `sdk-typescript` 는 archived 됐다. 모노레포에는 Python SDK(`strands-py`), TypeScript SDK(`strands-ts`), 미리 조립된 에이전트 **Strands harness**, `strands` CLI, 문서 사이트가 함께 있다.
2026-11-18 기준 최신 버전은 Python `strands-agents` **1.65.0**(2026-11-13, Python 3.10+), TypeScript `@strands-agents/sdk` **1.25.0**(Node.js 22+ ESM), harness `strands-harness` **0.4.0** 이다. 라이선스는 Apache-2.0.

## 설치
```bash
pip install strands-agents               # Python SDK
npm install @strands-agents/sdk          # TypeScript SDK ("type": "module" 필요)
pip install strands-harness              # 기본값이 조립된 harness 에이전트
# 기본 공급자는 Bedrock → AWS 자격 증명(AWS_PROFILE 등)을 설정하거나 다른 모델을 넘긴다
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` | 모델·도구·시스템 프롬프트를 가진 에이전트. 함수처럼 `agent("질문")` 으로 호출 (TS 는 `await agent.invoke(...)`) |
| 에이전트 루프 | 모델 호출 → 도구 실행 → 결과 반영을 모델이 끝낼 때까지 반복 |
| `@tool` | docstring·타입 힌트로 Python 함수를 도구로 등록 |
| Vended tools | `strands.vended_tools` 의 `shell`, `file_editor`, `http_request` 같은 기본 제공 도구 |
| 모델 공급자 | `BedrockModel`, `strands.models.ollama.OllamaModel`, `GeminiModel` 등 클래스로 교체 |
| `MCPClient` | `strands.tools.mcp.MCPClient` 로 MCP 서버의 도구를 에이전트에 연결 |
| 멀티 에이전트 | `strands.multiagent` 의 `Swarm`, `GraphBuilder`, A2A 지원, agents-as-tools 패턴 |
| 훅·스티어링 | 루프의 각 단계를 가로채 기록·검증·방향 수정 |
| Harness | `create_harness()` 한 줄로 벤치마크된 기본값의 범용 에이전트를 얻는 상위 패키지 |

## 기본 사용법
도구 하나를 가진 에이전트(Python, Ollama 로컬 모델):

```python
from strands import Agent, tool
from strands.models.ollama import OllamaModel

@tool
def word_count(text: str) -> int:
    """문장의 단어 수를 센다."""
    return len(text.split())

model = OllamaModel(host="http://localhost:11434", model_id="qwen3:8b")
agent = Agent(model=model, tools=[word_count],
              system_prompt="도구 결과를 근거로 한국어로 답한다.")
result = agent("'Strands 는 모델 주도 에이전트 SDK 다' 는 몇 단어야?")
print(result)
```
`model` 을 생략하면 Bedrock 기본 모델을 쓴다. 모델 id 는 사용하는 공급자에서 확인한다.

## 자주 쓰는 패턴
- **MCP 도구 연결**: `with MCPClient(lambda: stdio_client(StdioServerParameters(command="uvx", args=[...]))) as c: Agent(tools=c.list_tools_sync())`.
- **기본 도구로 빠른 자동화**: `Agent(tools=[file_editor, http_request, shell])` — 셸 도구는 격리된 환경에서만.
- **멀티 에이전트**: 역할별 에이전트를 `Swarm` 으로 묶어 자율 협업시키거나, `GraphBuilder` 로 실행 순서를 명시한다.
- **바로 쓰는 에이전트**: `from strands_harness import create_harness; agent = create_harness()` 로 시작한 뒤, 루프를 직접 소유해야 할 때 SDK 로 내려간다.
- **배포**: Lambda·Fargate·EKS·Bedrock AgentCore 등 배포 가이드가 문서에 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: AWS·Bedrock 중심 인프라에서 에이전트를 운영할 때, Python 과 TypeScript 양쪽에서 같은 개념의 SDK 가 필요할 때, 그래프를 그리기보다 모델에게 계획을 맡기는 단순한 구조를 원할 때.
- 피할 때(대안): 실행 경로를 결정적으로 통제해야 하면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), Google Cloud 중심이면 [Google ADK](/develop-wiki/ai/agent-framework/google-adk/), Azure·.NET 중심이면 [Microsoft Agent Framework](/develop-wiki/ai/agent-framework/microsoft-agent-framework/).

## 공식 문서
- [문서 홈](https://strandsagents.com/) · [Quickstart](https://strandsagents.com/docs/user-guide/sdk/quickstart/overview/) · [에이전트 루프](https://strandsagents.com/docs/user-guide/sdk/agents/agent-loop/) · [모델 공급자](https://strandsagents.com/docs/user-guide/sdk/model-providers/)
- [Harness](https://strandsagents.com/docs/user-guide/harness/) · [Python API](https://strandsagents.com/docs/api/python/strands.agent.agent/) · [TypeScript API](https://strandsagents.com/docs/api/typescript/) · [운영 가이드](https://strandsagents.com/docs/user-guide/sdk/deploy/operating-agents-in-production/)

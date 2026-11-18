---
name: Pydantic AI
url: https://pydantic.dev/pydantic-ai
docs: https://pydantic.dev/docs/ai/overview/
repo: https://github.com/pydantic/pydantic-ai
stars: 21275
domain: ai
category: agent-framework
description: Pydantic 팀이 만든 타입 중심 Python 에이전트 프레임워크. 의존성 주입·구조화 출력·도구 인자 검증을 타입 힌트로 처리해야 하는 프로덕션 에이전트에 쓴다.
pricing: oss
tags: [agent, python, pydantic, structured-output, type-safe]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Pydantic AI 는 Pydantic 검증 계층을 그대로 LLM 에이전트에 가져온 Python 프레임워크다. 에이전트의 의존성 타입(`deps_type`)과 출력 타입(`output_type`)을 제네릭으로 선언하면 도구 인자와 최종 출력이 모두 검증되고, 검증 실패는 모델에게 되돌려 재시도하게 한다. FastAPI 를 쓰는 감각으로 에이전트를 짜는 것이 설계 목표다.
2026-11-18 기준 최신 버전은 **2.70.0**(2026-11-17, MIT, Python 3.11+)이며 거의 매주 릴리스된다. 모델은 `'provider:model'` 문자열로 지정하고 OpenAI·Anthropic·Google·Bedrock·Groq·Mistral·OpenRouter 등 다수 공급자를 지원한다.
LangGraph 처럼 그래프를 먼저 그리기보다 **타입이 있는 에이전트 루프**가 중심이며, 그래프가 필요하면 같은 저장소의 `pydantic-graph` 를 쓴다.

## 설치
```bash
pip install pydantic-ai                          # 모든 공급자 포함
pip install "pydantic-ai-slim[openai,logfire]"   # 필요한 extra 만
export OPENAI_API_KEY="..."                      # 키는 환경 변수로
```
extra 예: `openai`, `anthropic`, `google`, `bedrock`, `mcp`, `evals`, `temporal`, `dbos`, `prefect`, `ag-ui`, `cli`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` | 모델·`instructions`·도구·`deps_type`·`output_type` 을 묶은 재사용 단위. 모듈 수준에 한 번 만들어 둔다 |
| `RunContext[Deps]` | 도구·동적 지시문에 주입되는 실행 컨텍스트. `ctx.deps` 로 DB 연결 등 의존성 접근 |
| 함수 도구 | `@agent.tool`(컨텍스트 필요) / `@agent.tool_plain`(불필요). 시그니처·docstring 이 스키마가 된다 |
| 구조화 출력 | `output_type=` 에 Pydantic 모델·TypedDict·유니온을 주면 결과가 그 타입으로 검증됨 |
| Toolsets | 도구 묶음. MCP 서버도 toolset/capability 로 붙인다 |
| Capabilities | 도구·훅·지시문·모델 설정을 묶은 재사용 단위 (예: 캐싱, MCP, 내구 실행) |
| 실행 메서드 | `run`(async), `run_sync`, `run_stream`, `run_stream_events`, `iter`(노드 단위 순회) |
| Pydantic Evals | 데이터셋 기반 출력·도구 호출 궤적 평가 |
| 내구 실행 | Temporal·DBOS·Prefect 등과 통합해 장기 실행 에이전트를 재시작에 견디게 함 |

## 기본 사용법
의존성 주입 + 구조화 출력 예제:

```python
from dataclasses import dataclass
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

@dataclass
class Deps:
    user_name: str

class Reply(BaseModel):
    answer: str
    confident: bool

agent = Agent("openai:gpt-5.6", deps_type=Deps, output_type=Reply,
              instructions="한국어로 짧게 답한다.")

@agent.tool
def whoami(ctx: RunContext[Deps]) -> str:
    """현재 사용자 이름을 돌려준다."""
    return ctx.deps.user_name

result = agent.run_sync("내 이름이 뭐지?", deps=Deps(user_name="민수"))
print(result.output.answer, result.output.confident)
```
모델 id 는 공급자의 현재 목록에서 확인해 바꾼다. 키 없이 흐름만 시험하려면 모델 자리에 `"test"` 를 넣는다.

## 자주 쓰는 패턴
- **대화 이어가기**: `agent.run_sync("다음 질문", message_history=result.all_messages())`.
- **스트리밍**: `async with agent.run_stream(prompt) as r: async for text in r.stream_text(): ...`.
- **테스트**: `TestModel`/`FunctionModel` 로 실제 API 호출 없이 도구 호출 흐름을 단위 테스트한다. `agent.override(model=...)` 로 교체.
- **관측성**: `logfire.configure(); logfire.instrument_pydantic_ai()` 로 OpenTelemetry 트레이스를 남긴다. Logfire 외 OTel 백엔드도 가능.
- **멀티 에이전트**: 도구 안에서 다른 에이전트를 `await other.run(..., usage=ctx.usage)` 로 호출해 사용량을 합산한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Pydantic·FastAPI 를 쓰는 Python 백엔드, 출력 스키마 검증이 중요한 추출·분류형 에이전트, 타입 검사기(mypy/pyright)로 에이전트 코드를 관리하고 싶을 때.
- 피할 때(대안): 명시적 상태 그래프·체크포인트 중심이면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), OpenAI 핸드오프 모델이 맞으면 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/), 프롬프트를 데이터로 자동 최적화하려면 [DSPy](/develop-wiki/ai/agent-framework/dspy/), TypeScript 면 [Mastra](/develop-wiki/ai/agent-framework/mastra/)·[Vercel AI SDK](/develop-wiki/ai/agent-framework/vercel-ai-sdk/).

## 공식 문서
- [개요](https://pydantic.dev/docs/ai/overview/) · [설치](https://pydantic.dev/docs/ai/overview/install/) · [Agent](https://pydantic.dev/docs/ai/core-concepts/agent/) · [의존성](https://pydantic.dev/docs/ai/core-concepts/dependencies/)
- [도구](https://pydantic.dev/docs/ai/tools-toolsets/tools/) · [구조화 출력](https://pydantic.dev/docs/ai/core-concepts/output/) · [MCP](https://pydantic.dev/docs/ai/capabilities/mcp/) · [릴리스](https://github.com/pydantic/pydantic-ai/releases)

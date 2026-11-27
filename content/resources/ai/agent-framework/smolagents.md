---
name: smolagents
url: https://huggingface.co/docs/smolagents
docs: https://huggingface.co/docs/smolagents/index
repo: https://github.com/huggingface/smolagents
stars: 30569
domain: ai
category: agent-framework
description: 에이전트가 JSON 대신 Python 코드로 행동을 작성하는 CodeAgent 중심의 Hugging Face 경량 에이전트 라이브러리. 오픈 모델로 도구 사용 에이전트를 빠르게 실험할 때 쓴다.
pricing: oss
tags: [agent, code-agent, huggingface, python, sandbox]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-22
---

## 개요
smolagents 는 Hugging Face 가 만든 최소 구조의 에이전트 라이브러리로, 핵심 로직이 약 천 줄 수준이다. 대표 클래스 `CodeAgent` 는 도구 호출을 JSON 이 아니라 **Python 코드 조각**으로 작성해 실행한다. 코드로 쓰면 함수 중첩·반복·조건문으로 여러 도구를 한 번에 조합할 수 있다는 것이 설계 근거다. 일반적인 JSON 도구 호출 방식이 필요하면 `ToolCallingAgent` 를 쓴다.
Hub 의 Inference Providers, LiteLLM 경유 상용 API, Transformers·Ollama 로컬 모델을 모두 붙일 수 있고, 도구·에이전트를 Hub Space 로 공유·로드할 수 있다.
2026-11-18 기준 최신 버전은 **1.26.0**(2026-05-29, Apache-2.0, Python 3.10+)이다. 커밋은 계속되지만 릴리스 간격이 5개월 이상 벌어져 있어 신규 기능 반영 속도는 다른 프레임워크보다 느리다.

## 설치
```bash
pip install "smolagents[toolkit]"    # 기본 도구(웹 검색 등) 포함
pip install "smolagents[litellm]"    # OpenAI·Anthropic 등 LiteLLM 경유 모델
pip install "smolagents[docker]"     # 원격 실행기: e2b / modal / blaxel / docker
export HF_TOKEN="..."                # Hub 추론 API 토큰은 환경 변수로
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `CodeAgent` | 행동을 Python 코드로 작성·실행하는 에이전트. 기본 실행기는 AST 기반 `LocalPythonExecutor` |
| `ToolCallingAgent` | JSON/텍스트 형식의 일반 도구 호출 에이전트 |
| 모델 클래스 | `InferenceClientModel`(Hub), `LiteLLMModel`, `TransformersModel` 등 |
| `@tool` / `Tool` | 함수 데코레이터 또는 클래스 상속으로 도구 정의. 타입 힌트와 docstring 의 `Args:` 설명이 필수 |
| `additional_authorized_imports` | 로컬 실행기에서 허용할 import 목록. 기본은 거의 모든 import 차단 |
| `executor_type` | `"e2b"`, `"modal"`, `"blaxel"`, `"docker"` 로 생성 코드를 원격 샌드박스에서 실행 |
| `managed_agents` | 하위 에이전트를 관리자 에이전트에 붙이는 멀티 에이전트 구성 |
| `ToolCollection.from_mcp` | MCP 서버의 도구를 가져옴. LangChain 도구·Hub Space 도 도구로 변환 가능 |
| CLI | `smolagent`, `webagent` 명령으로 코드 없이 실행 |

## 기본 사용법
직접 만든 도구를 쓰는 `CodeAgent`:

```python
from smolagents import CodeAgent, InferenceClientModel, tool

@tool
def celsius_to_f(celsius: float) -> float:
    """섭씨를 화씨로 바꾼다.

    Args:
        celsius: 섭씨 온도
    """
    return celsius * 9 / 5 + 32

agent = CodeAgent(tools=[celsius_to_f], model=InferenceClientModel())
print(agent.run("서울 25도, 부산 28도를 화씨로 바꾸고 평균을 구해줘"))
```
`CodeAgent` 는 한 단계에서 두 번의 도구 호출과 평균 계산을 코드 한 덩어리로 처리할 수 있다.

## 자주 쓰는 패턴
- **샌드박스 실행**: 신뢰할 수 없는 입력을 다루면 `with CodeAgent(..., executor_type="docker") as agent:` 처럼 원격 실행기를 쓴다. `with` 를 쓰면 실행 후 컨테이너가 정리된다. 단, 이 방식은 `managed_agents` 를 지원하지 않는다.
- **허용 import 지정**: `CodeAgent(..., additional_authorized_imports=["numpy.*", "pandas"])`.
- **상용 모델 사용**: `LiteLLMModel(model_id="anthropic/<모델 id>")` — 키는 각 공급자 환경 변수로.
- **멀티 에이전트**: 웹 검색 에이전트에 `name`·`description` 을 주고 관리자 `CodeAgent(managed_agents=[web_agent])` 에 넘긴다.
- **도구 공유**: `tool.push_to_hub("user/tool-name")`, `Tool.from_space(...)` 로 Hub 에서 주고받는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈 웨이트 모델로 에이전트를 실험·연구할 때, 코드 액션 방식의 효과를 시험할 때, 의존성이 적은 단순한 에이전트 루프가 필요할 때.
- 피할 때(대안): 로컬 실행기는 완전한 샌드박스가 아니므로 공개 서비스에서는 원격 실행기가 필수다. 장기 실행·체크포인트·사람 승인 흐름은 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), 타입 검증 중심 프로덕션 코드는 [Pydantic AI](/develop-wiki/ai/agent-framework/pydantic-ai/)가 맞다.

## 공식 문서
- [문서 홈](https://huggingface.co/docs/smolagents/index) · [Guided tour](https://huggingface.co/docs/smolagents/guided_tour) · [도구 만들기](https://huggingface.co/docs/smolagents/tutorials/tools)
- [안전한 코드 실행](https://huggingface.co/docs/smolagents/tutorials/secure_code_execution) · [에이전트 레퍼런스](https://huggingface.co/docs/smolagents/reference/agents) · [릴리스](https://github.com/huggingface/smolagents/releases)

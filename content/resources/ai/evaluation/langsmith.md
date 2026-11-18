---
name: LangSmith
url: https://www.langchain.com/langsmith
docs: https://docs.langchain.com/langsmith/home
repo: https://github.com/langchain-ai/langsmith-python
domain: ai
category: evaluation
description: LangChain 사의 LLM 앱 트레이싱·평가·프롬프트 관리 SaaS. LangChain 없이도 SDK 데코레이터로 계측해 데이터셋 기반 실험을 돌린다.
pricing: freemium
tags: [observability, tracing, evals, llm-as-judge, prompt-management]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
LangSmith 는 LangChain 사가 운영하는 LLM 애플리케이션용 관측·평가 플랫폼이다. 트레이스 수집, 데이터셋·실험 기반 오프라인 평가, 운영 트레이스에 대한 온라인 평가, 사람 검토(annotation queue), 프롬프트 관리를 제공한다. 이름과 달리 프레임워크에 묶이지 않아 OpenAI·Anthropic SDK 를 직접 쓰는 코드도 `@traceable` 데코레이터로 계측할 수 있다.
플랫폼 자체는 비공개 SaaS 이고 클라이언트 SDK 만 MIT 오픈소스다. 2026년 10월 SDK 저장소가 `langsmith-sdk` 에서 `langsmith-python`·`langsmith-javascript` 로 분리됐다. Python SDK v0.15, JS SDK v0.13 기준.
오픈소스·셀프 호스팅이 필요하면 [Langfuse](/develop-wiki/ai/evaluation/langfuse/) 나 [Arize Phoenix](/develop-wiki/ai/evaluation/arize-phoenix/) 가 대안이다.

## 설치
```bash
pip install -U langsmith openai      # Python
npm install langsmith openai         # TypeScript
pip install -U openevals             # 미리 만든 LLM-as-judge 평가기(선택)
```

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=...         # Settings 에서 발급
export LANGSMITH_PROJECT=my-app      # 프로젝트 기반 워크스페이스
# EU 리전이면: export LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com
```

에이전트 기반 워크스페이스에서는 `LANGSMITH_PROJECT` 대신 `LANGSMITH_AGENT_ID`·`LANGSMITH_AGENT_ENVIRONMENT` 로 기록 위치를 지정한다(둘을 섞지 않는다).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Run / Trace | 함수·LLM·도구 호출 하나가 run, 최상위 run 아래 중첩된 run 묶음이 trace |
| `@traceable` | 함수를 run 으로 기록하는 데코레이터. `run_type`(`llm`, `tool`, `retriever` 등) 지정 가능 |
| Wrapper | `wrap_openai`, `wrap_anthropic` 등 클라이언트를 감싸 모델 호출을 자동 기록 |
| Dataset / Example | 평가용 입력(`inputs`)과 기대 출력(`outputs`) 묶음 |
| Experiment | 대상 함수를 데이터셋에 돌리고 평가기 점수를 붙인 실행 결과. 실험끼리 비교 화면 제공 |
| Evaluator | `(inputs, outputs, reference_outputs)` 를 받아 점수를 돌려주는 함수(코드 또는 LLM-as-judge) |
| Feedback | trace 에 붙는 점수·코멘트. 사용자 피드백, 사람 검토, 온라인 평가가 모두 여기로 모인다 |

## 기본 사용법
```python
from langsmith import traceable, Client

@traceable(run_type="tool")
def lookup(city: str) -> str:
    return {"서울": "대한민국", "도쿄": "일본"}.get(city, "모름")

@traceable
def agent(inputs: dict) -> dict:
    return {"country": lookup(inputs["city"])}

client = Client()
ds = client.create_dataset(dataset_name="city-country")
client.create_examples(dataset_id=ds.id, examples=[
    {"inputs": {"city": "서울"}, "outputs": {"country": "대한민국"}},
    {"inputs": {"city": "도쿄"}, "outputs": {"country": "일본"}},
])

def exact(inputs: dict, outputs: dict, reference_outputs: dict) -> bool:
    return outputs["country"] == reference_outputs["country"]

client.evaluate(agent, data="city-country", evaluators=[exact], experiment_prefix="baseline")
```

실행이 끝나면 콘솔에 실험 링크가 출력되고, UI 에서 예제별 결과와 이전 실험과의 차이를 본다.

## 자주 쓰는 패턴
- **모델 호출 자동 기록**: `client = wrap_openai(OpenAI())` 처럼 감싸 두면 `@traceable` 함수 안의 호출이 하위 run 으로 중첩된다.
- **LLM-as-judge**: `openevals` 의 `create_llm_as_judge(prompt=CORRECTNESS_PROMPT, model=..., feedback_key="correctness")` 로 정답 비교 평가기를 바로 만든다.
- **운영 트레이스로 데이터셋 만들기**: 실패한 trace 를 UI 에서 데이터셋에 추가해 회귀 테스트로 키운다.
- **온라인 평가·자동화 규칙**: 필터에 맞는 운영 trace 에 평가기를 돌리거나 웹훅·annotation queue 로 보낸다.
- **병렬 실행**: `client.evaluate(..., max_concurrency=4)` 로 실험 속도를 높인다.

## 언제 쓰나 / 피할 때
- 쓸 때: [LangChain](/develop-wiki/ai/agent-framework/langchain/)·[LangGraph](/develop-wiki/ai/agent-framework/langgraph/) 기반 앱(환경 변수만으로 자동 트레이싱), 관리형 SaaS 로 트레이싱·평가·사람 검토를 한 번에 쓰고 싶을 때.
- 피할 때(대안): 셀프 호스팅은 Enterprise 플랜에서만 가능하다. 데이터를 외부로 보낼 수 없고 예산이 작으면 [Langfuse](/develop-wiki/ai/evaluation/langfuse/)·[Arize Phoenix](/develop-wiki/ai/evaluation/arize-phoenix/) 를, CI 용 프롬프트 테스트만 필요하면 [Promptfoo](/develop-wiki/ai/evaluation/promptfoo/) 를 쓴다.

## 요금 (2026-11 확인)
| 플랜 | 내용 |
| --- | --- |
| Developer | 무료, 1석, 월 5천 기본 trace 포함 후 종량제 |
| Plus | 석당 월 39달러, 월 1만 기본 trace 포함, 석 수 제한 없음 |
| Enterprise | 별도 견적. 셀프 호스팅·하이브리드 배포, SSO·RBAC |

## 공식 문서
- [문서 홈](https://docs.langchain.com/langsmith/home) · [트레이싱 Quickstart](https://docs.langchain.com/langsmith/observability-quickstart) · [평가 Quickstart](https://docs.langchain.com/langsmith/evaluation-quickstart)
- [Python SDK](https://github.com/langchain-ai/langsmith-python) · [JS SDK](https://github.com/langchain-ai/langsmith-javascript) · [가격](https://www.langchain.com/pricing)

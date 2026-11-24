---
name: Langfuse
url: https://langfuse.com
docs: https://langfuse.com/docs
repo: https://github.com/langfuse/langfuse
stars: 37796
domain: ai
category: evaluation
description: LLM 앱의 트레이싱·프롬프트 관리·데이터셋 실험·점수 기록을 한곳에서 하는 오픈소스 LLMOps 플랫폼. 셀프 호스팅이나 클라우드로 쓴다.
pricing: oss
tags: [observability, tracing, evals, prompt-management, opentelemetry]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-24
---

## 개요
Langfuse 는 LLM 애플리케이션의 호출 흐름을 트레이스로 기록하고, 그 위에서 평가 점수·데이터셋 실험·프롬프트 버전을 관리하는 플랫폼이다. SDK 는 OpenTelemetry 기반이라 다른 OTel 계측 라이브러리와 함께 쓸 수 있고, 특정 프레임워크에 묶이지 않는다.
2026년 1월 ClickHouse 가 인수했으며, 코어 기능은 MIT 라이선스 오픈소스로 유지된다(일부 엔터프라이즈 기능은 `ee` 라이선스 키 필요). 서버 v4.82, Python SDK v5.2 기준.
비슷한 위치의 도구로는 상용 SaaS 인 [LangSmith](/develop-wiki/ai/evaluation/langsmith/), OpenTelemetry 표준을 앞세운 [Arize Phoenix](/develop-wiki/ai/evaluation/arize-phoenix/) 가 있다.

## 설치
```bash
# SDK
pip install langfuse            # Python (v5)
npm install @langfuse/tracing @langfuse/otel   # TypeScript

# 셀프 호스팅(로컬·테스트용, http://localhost:3000)
git clone https://github.com/langfuse/langfuse.git
cd langfuse && docker compose up
```

SDK 는 환경 변수로 설정한다. 키는 프로젝트 설정 화면에서 발급한다.

```bash
export LANGFUSE_PUBLIC_KEY=...      # pk-lf-...
export LANGFUSE_SECRET_KEY=...      # sk-lf-...
export LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 셀프 호스팅이면 해당 주소
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Trace / Observation | 요청 하나의 전체 흐름(trace)과 그 안의 단계(span, generation, tool 등 observation) |
| Generation | LLM 호출 observation. 모델명·토큰 사용량·비용이 붙는다 |
| Session / User | 여러 trace 를 대화 단위·사용자 단위로 묶는 속성 |
| Score | trace·observation·session 에 붙이는 평가 값(숫자, 범주, 불리언) |
| Dataset / Experiment | 입력·기대 출력 묶음과, 이를 특정 프롬프트·모델로 돌린 실행 결과 |
| LLM-as-a-Judge | 운영 trace 나 실험 결과를 모델로 자동 채점하는 평가기 |
| Annotation Queue | 사람이 trace 를 검토하고 점수를 매기는 작업 대기열 |
| Prompt Management | 프롬프트를 버전·라벨(`production` 등)로 관리하고 SDK 로 가져오기 |

## 기본 사용법
데코레이터로 함수를 계측하고 trace 에 점수를 남긴다(Python SDK v5 기준).

```python
from langfuse import get_client, observe

langfuse = get_client()

@observe(name="answer", as_type="generation")
def answer(question: str) -> str:
    return "서울"  # 실제로는 LLM 호출

@observe()
def handle(question: str) -> str:
    result = answer(question)
    langfuse.score_current_trace(name="exact_match", value=1.0 if result == "서울" else 0.0)
    return result

handle("대한민국의 수도는?")
langfuse.flush()  # 짧게 끝나는 스크립트는 종료 전 전송
```

데이터셋 없이 로컬 데이터로 실험을 돌릴 수도 있다.

```python
from langfuse import get_client, Evaluation

langfuse = get_client()
data = [{"input": "hello", "expected_output": "HELLO"}, {"input": "dev", "expected_output": "DEV"}]

def task(*, item, **kwargs):
    return item["input"].upper()  # 예제용. 실제로는 LLM 호출

def exact(*, output, expected_output, **kwargs):
    return Evaluation(name="exact", value=float(output == expected_output))

result = langfuse.run_experiment(name="upper-v1", data=data, task=task, evaluators=[exact])
print(result.format())
```

## 자주 쓰는 패턴
- **사용자·세션 묶기**: `propagate_attributes(user_id=..., session_id=...)` 컨텍스트 안에서 생성한 observation 이 같은 속성을 상속한다.
- **드롭인 계측**: `from langfuse.openai import OpenAI` 처럼 OpenAI 클라이언트를 바꿔 넣으면 호출이 자동으로 generation 으로 기록된다. LangChain·LlamaIndex 등은 콜백·OTel 통합을 쓴다.
- **데이터셋 회귀 테스트**: `langfuse.get_dataset("이름").run_experiment(...)` 로 프롬프트·모델 변경 전후를 같은 데이터셋에서 비교한다.
- **입출력 수집 끄기**: 민감 데이터는 `@observe(capture_input=False, capture_output=False)` 또는 `LANGFUSE_OBSERVE_DECORATOR_IO_CAPTURE_ENABLED=false`.
- **사후 점수 기록**: 사용자 피드백처럼 나중에 오는 평가는 `create_score(name=..., value=..., trace_id=...)` 로 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 운영 중인 LLM 앱의 트레이스·비용·지연을 보고 싶을 때, 데이터를 자체 인프라에 두어야 해서 셀프 호스팅이 필요할 때, 트레이싱과 평가·프롬프트 관리를 한 도구로 묶고 싶을 때.
- 피할 때(대안): CI 에서 프롬프트 회귀 테스트만 필요하면 [Promptfoo](/develop-wiki/ai/evaluation/promptfoo/) 나 [DeepEval](/develop-wiki/ai/evaluation/deepeval/) 같은 테스트 도구가 가볍다. 셀프 호스팅은 PostgreSQL·ClickHouse·Redis·S3 호환 스토리지가 필요하므로 운영 부담이 싫으면 클라우드(무료 Hobby 플랜: 월 5만 유닛, 30일 보관)를 쓴다.

## 공식 문서
- [문서 홈](https://langfuse.com/docs) · [SDK 개요](https://langfuse.com/docs/observability/sdk/overview) · [계측(Instrumentation)](https://langfuse.com/docs/observability/sdk/instrumentation)
- [평가 개요](https://langfuse.com/docs/evaluation/overview) · [SDK 로 실험 실행](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk) · [점수 기록](https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-sdk)
- [셀프 호스팅](https://langfuse.com/docs/self-hosting) · [가격](https://langfuse.com/pricing)

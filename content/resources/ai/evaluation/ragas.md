---
name: Ragas
url: https://docs.ragas.io
docs: https://docs.ragas.io/en/stable/getstarted/quickstart/
repo: https://github.com/vibrantlabsai/ragas
stars: 16366
domain: ai
category: evaluation
description: RAG·에이전트 출력을 충실도·문맥 정밀도·재현율 같은 지표로 점수화하는 Python 평가 라이브러리. 데이터셋과 실험 단위로 결과를 비교한다.
pricing: oss
tags: [evals, rag, metrics, llm-as-judge, experiments]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ragas 는 RAG 파이프라인 평가 지표로 출발한 Python 라이브러리다. 답변이 검색 문맥에 근거하는지(Faithfulness), 검색 결과가 질문에 맞는지(Context Precision/Recall), 답변이 질문에 맞는지(Answer Relevancy) 등을 LLM 채점과 임베딩·문자열 비교로 계산한다. 지금은 에이전트·도구 호출·SQL 지표와, 자체 지표를 만드는 `DiscreteMetric`·`NumericMetric`, 데이터셋·실험(`@experiment`) 관리까지 포함한다.
v0.4 기준. 저장소는 `explodinggradients/ragas` 에서 `vibrantlabsai/ragas` 로 옮겨졌다(기존 주소는 리다이렉트). Apache-2.0.
pytest 형태의 테스트를 원하면 [DeepEval](/develop-wiki/ai/evaluation/deepeval/), 트레이싱과 묶인 평가는 [Langfuse](/develop-wiki/ai/evaluation/langfuse/)·[Arize Phoenix](/develop-wiki/ai/evaluation/arize-phoenix/) 쪽이다.

## 설치
```bash
pip install ragas
export OPENAI_API_KEY=...            # LLM 채점 지표용

# 예제 프로젝트 템플릿
ragas quickstart rag_eval            # 또는 uvx ragas quickstart rag_eval
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `llm_factory` | 채점용 LLM 래퍼 생성. `llm_factory("모델", provider="openai", client=...)`, OpenAI 호환 엔드포인트 가능 |
| `ragas.metrics.collections` | 기성 지표 모음. `Faithfulness`, `ContextPrecision`, `ContextRecall`, `AnswerRelevancy`, `FactualCorrectness`, `ToolCallAccuracy`, `ExactMatch` 등 |
| `score` / `ascore` | 지표 계산. 키워드 인자(`user_input`, `response`, `retrieved_contexts`, `reference`)를 받고 `MetricResult`(`.value`) 반환 |
| `DiscreteMetric` / `NumericMetric` | 프롬프트와 허용 값(또는 범위)으로 정의하는 사용자 지표 |
| `Dataset` | 평가 입력 행 묶음. `backend="local/csv"` 등으로 저장·불러오기 |
| `@experiment` | 행 하나를 처리하는 async 함수를 실험으로 만들고, `arun(dataset)` 결과를 타임스탬프 붙은 CSV 로 저장 |

## 기본 사용법
RAG 응답 하나의 충실도 계산(LLM 채점):

```python
import asyncio
from openai import AsyncOpenAI
from ragas.llms import llm_factory
from ragas.metrics.collections import Faithfulness

llm = llm_factory("gpt-5-mini", client=AsyncOpenAI())  # 계정에서 쓰는 모델로
faithfulness = Faithfulness(llm=llm)

async def main():
    result = await faithfulness.ascore(
        user_input="환불 기한은?",
        response="구매 후 30일 이내 환불됩니다.",
        retrieved_contexts=["모든 상품은 구매일로부터 30일 이내 전액 환불된다."],
    )
    print(result.value)  # 0~1

asyncio.run(main())
```

데이터셋과 실험(채점 모델 없이 동작하는 예):

```python
import asyncio
from ragas import Dataset, experiment
from ragas.metrics.collections import ExactMatch

ds = Dataset(name="capitals", backend="local/csv", root_dir="./data")
ds.append({"question": "대한민국의 수도는?", "answer": "서울"})
ds.append({"question": "일본의 수도는?", "answer": "도쿄"})
ds.save()

@experiment()
async def baseline(row):
    response = "서울"  # 실제로는 RAG 앱 호출
    score = await ExactMatch().ascore(reference=row["answer"], response=response)
    return {**row, "response": response, "exact_match": score.value}

asyncio.run(baseline.arun(ds))  # ./data/experiments/<이름>.csv 에 결과 저장
```

## 자주 쓰는 패턴
- **검색과 생성 분리 평가**: 검색 품질은 `ContextPrecision`·`ContextRecall`, 생성 품질은 `Faithfulness`·`AnswerRelevancy` 로 나눠 어느 단계가 문제인지 본다.
- **맞춤 지표**: `DiscreteMetric(name=..., prompt="... {response} ...", allowed_values=["pass", "fail"])` 을 만들고 `await metric.ascore(llm=llm, response=...)` 로 채점한다.
- **실험 비교**: 프롬프트·검색 설정만 바꾼 `@experiment` 함수를 같은 `Dataset` 에 돌려 CSV 결과를 비교한다.
- **async 컨텍스트 주의**: `@experiment` 함수 안에서는 동기 `score()` 가 막혀 있으므로 `await ...ascore()` 를 쓴다.
- **다른 도구와 함께**: Langfuse·LangSmith·Phoenix 등은 Ragas 지표를 트레이스 점수로 붙이는 통합을 제공한다.

## 언제 쓰나 / 피할 때
- 쓸 때: RAG 시스템의 검색·생성 품질을 표준 지표로 수치화할 때, 청킹·임베딩·리랭커 설정을 바꿔 가며 같은 데이터셋으로 비교할 때.
- 피할 때(대안): LLM 채점 지표는 비용이 들고 점수가 모델에 따라 흔들린다. CI 합격/불합격 게이트가 목적이면 [Promptfoo](/develop-wiki/ai/evaluation/promptfoo/)·[DeepEval](/develop-wiki/ai/evaluation/deepeval/), 운영 모니터링은 [Langfuse](/develop-wiki/ai/evaluation/langfuse/) 가 맞다. 0.x 버전이라 마이너 버전 사이에도 API 가 바뀌므로(예: `ragas.metrics.collections` 로의 이동) 버전을 고정해 쓴다.

## 공식 문서
- [시작하기](https://docs.ragas.io/en/stable/getstarted/) · [Quickstart](https://docs.ragas.io/en/stable/getstarted/quickstart/) · [실험](https://docs.ragas.io/en/stable/concepts/experimentation/)
- [지표 목록](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) · [GitHub](https://github.com/vibrantlabsai/ragas)

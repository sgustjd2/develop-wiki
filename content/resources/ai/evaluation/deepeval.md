---
name: DeepEval
url: https://deepeval.com
docs: https://deepeval.com/docs/getting-started
repo: https://github.com/confident-ai/deepeval
stars: 19547
domain: ai
category: evaluation
description: pytest 처럼 테스트 케이스와 지표로 LLM 출력을 검증하는 오픈소스 평가 프레임워크. RAG·에이전트·대화·안전성 지표를 기본 제공한다.
pricing: oss
tags: [evals, llm-as-judge, pytest, rag, g-eval]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
DeepEval 은 LLM 앱 출력을 "단위 테스트"처럼 검사하는 프레임워크다. 입력·실제 출력·기대 출력·검색 문맥을 `LLMTestCase` 로 만들고, G-Eval·답변 관련성·충실도(faithfulness) 같은 지표를 붙여 0~1 점수와 판정 이유를 받는다. Pytest 에 붙어 동작하므로 기존 테스트 습관대로 CI 에 넣기 쉽다.
대부분의 지표는 LLM-as-a-judge 방식이라 채점용 모델(기본 OpenAI, `deepeval set-*` 명령으로 Anthropic·Gemini·Ollama·LiteLLM 등으로 교체)이 필요하다. Confident AI 사가 만들며, 결과 대시보드·데이터셋 관리용 클라우드(Confident AI)는 선택 사항이다. Python v4.3 기준(TypeScript 패키지 `deepeval` 도 있음).
YAML 설정 기반 비교 도구는 [Promptfoo](/develop-wiki/ai/evaluation/promptfoo/), RAG 지표 전용 라이브러리는 [Ragas](/develop-wiki/ai/evaluation/ragas/) 다.

## 설치
```bash
pip install -U deepeval
export OPENAI_API_KEY=...        # 기본 채점 모델용
# 다른 채점 모델: deepeval set-anthropic / set-ollama / set-gemini ...
```

DeepEval 은 `.env.local` → `.env` 순으로 환경 변수를 읽는다(이미 설정된 프로세스 변수가 우선).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `LLMTestCase` | `input`, `actual_output`(필수), `expected_output`, `retrieval_context`, `context`, `tools_called` 등 |
| `ConversationalTestCase` | 여러 턴 대화를 하나의 테스트 케이스로 다룸 |
| Metric | `measure()` 후 `score`(0~1), `reason`, `is_successful()`. 기본 `threshold` 0.5 |
| `GEval` | 자연어 기준(`criteria`)이나 단계(`evaluation_steps`)로 정의하는 맞춤 지표 |
| `SingleTurnParams` | GEval 이 볼 필드 지정(`ACTUAL_OUTPUT`, `EXPECTED_OUTPUT` …). v4 에서 `LLMTestCaseParams` 를 대체 |
| RAG 지표 | `AnswerRelevancyMetric`, `FaithfulnessMetric`, `ContextualPrecision/Recall/RelevancyMetric` |
| 에이전트 지표 | `TaskCompletionMetric`, `ToolCorrectnessMetric`, `ArgumentCorrectnessMetric` 등 |
| Golden / `EvaluationDataset` | 실제 출력이 아직 없는 입력·기대 출력 묶음. 실행 시 앱 출력을 채워 테스트 케이스로 만든다 |

## 기본 사용법
`test_answers.py`:

```python
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, SingleTurnParams
from deepeval.metrics import GEval, FaithfulnessMetric

correctness = GEval(
    name="Correctness",
    criteria="actual output 이 expected output 과 사실상 같은 답인지 판단한다.",
    evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT, SingleTurnParams.EXPECTED_OUTPUT],
    threshold=0.7,
)

def test_refund_answer():
    case = LLMTestCase(
        input="환불은 며칠 안에 가능한가요?",
        actual_output="구매 후 30일 이내에 환불할 수 있습니다.",  # 실제로는 앱 호출 결과
        expected_output="30일 이내",
        retrieval_context=["모든 상품은 구매일로부터 30일 이내 전액 환불된다."],
    )
    assert_test(case, [correctness, FaithfulnessMetric(threshold=0.7)])
```

```bash
deepeval test run test_answers.py      # pytest 와 같은 방식으로 실행
deepeval test run test_answers.py -n 4 # 병렬 실행
```

## 자주 쓰는 패턴
- **테스트 밖에서 일괄 평가**: `from deepeval import evaluate` 후 `evaluate(test_cases=[...], metrics=[AnswerRelevancyMetric()])`.
- **지표 하나만 확인**: `m = AnswerRelevancyMetric(); m.measure(case); print(m.score, m.reason)`.
- **채점 모델 지정**: 지표마다 `model="모델명"` 또는 `DeepEvalBaseLLM` 을 상속한 사용자 모델 객체를 넘긴다. 전역 기본값은 `deepeval set-ollama` 같은 CLI 로 바꾼다.
- **데이터셋 관리**: `EvaluationDataset` 에 Golden 을 CSV·JSON 에서 불러오고(`add_goldens_from_csv_file`), `generate_goldens_from_docs` 로 문서에서 합성 질문을 만든다.
- **결과 보관**: `deepeval login` 으로 Confident AI 에 연결하면 테스트 실행 기록이 대시보드에 올라간다. 로그인 없이도 전부 로컬에서 돈다.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 코드로 평가 로직을 관리하고 싶을 때, RAG·에이전트·대화형 앱에 맞는 기성 지표가 필요할 때, 기존 pytest 기반 CI 에 LLM 품질 검사를 붙일 때.
- 피할 때(대안): LLM-as-a-judge 지표는 채점 호출 비용과 점수 흔들림이 있으므로, 정답이 명확한 검사는 문자열·정규식 단언으로 충분하다([Promptfoo](/develop-wiki/ai/evaluation/promptfoo/)). 운영 트레이스 수집·모니터링은 [Langfuse](/develop-wiki/ai/evaluation/langfuse/) 같은 관측 도구와 함께 쓴다.

## 공식 문서
- [시작하기](https://deepeval.com/docs/getting-started) · [지표 소개](https://deepeval.com/docs/metrics-introduction) · [G-Eval](https://deepeval.com/docs/metrics-llm-evals)
- [테스트 케이스](https://deepeval.com/docs/evaluation-test-cases) · [데이터셋](https://deepeval.com/docs/evaluation-datasets) · [GitHub](https://github.com/confident-ai/deepeval)

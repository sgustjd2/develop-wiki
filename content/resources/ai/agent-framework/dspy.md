---
name: DSPy
url: https://dspy.ai/
docs: https://dspy.ai/current/
repo: https://github.com/stanfordnlp/dspy
stars: 39122
domain: ai
category: agent-framework
description: 프롬프트 문자열 대신 입출력 시그니처와 모듈로 LLM 프로그램을 짜고, 지표와 예제 데이터로 프롬프트·few-shot 예시를 자동 최적화하는 Stanford의 Python 프레임워크. 품질을 수치로 끌어올려야 하는 파이프라인에 쓴다.
pricing: oss
tags: [prompt-optimization, llm-programming, python, signatures, optimizer]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
DSPy 는 "Program, don't prompt" 를 내건 Stanford NLP 의 프레임워크다. 작업을 손으로 쓴 프롬프트가 아니라 **타입 있는 시그니처**(입력 필드 → 출력 필드)로 선언하고, `Predict`·`ChainOfThought`·`ReAct` 같은 모듈로 조합한다. 그다음 **옵티마이저**가 평가 지표와 학습 예제를 써서 지시문·few-shot 예시(필요하면 가중치까지)를 자동으로 찾아 프로그램을 "컴파일" 한다.
**에이전트 오케스트레이터와의 차이**: LangGraph·OpenAI Agents SDK·Pydantic AI 같은 도구는 "어떤 순서로 모델과 도구를 호출할지"(제어 흐름, 상태, 핸드오프)를 다룬다. DSPy 의 중심은 그 반대편, 즉 **각 LLM 호출의 프롬프트를 데이터로 최적화**하는 일이다. `dspy.ReAct` 로 도구 쓰는 에이전트도 만들 수 있지만, 장기 실행·체크포인트·사람 승인 같은 오케스트레이션 기능은 목표가 아니다. 그래서 둘은 경쟁보다 조합 관계에 가깝다(오케스트레이터 안의 한 단계를 DSPy 모듈로 최적화).
2026-11-18 기준 최신 버전은 **3.5.0**(2026-11-10, MIT, Python 3.10~3.15)이다. 모델 연결은 LiteLLM 형식의 `"공급자/모델"` 문자열을 쓴다.

## 설치
```bash
pip install -U dspy
export OPENAI_API_KEY="..."     # 사용하는 공급자의 키를 환경 변수로
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `dspy.LM` / `dspy.configure` | `dspy.configure(lm=dspy.LM("openai/<모델>"))` 로 기본 언어 모델 지정 |
| Signature | `"question -> answer"` 문자열 또는 `dspy.Signature` 클래스(`InputField`/`OutputField`)로 입출력 선언. docstring 이 작업 설명 |
| Module | `Predict`, `ChainOfThought`, `ReAct`, `Refine`, `BestOfN`, `Parallel`, `RLM` 등. `dspy.Module` 을 상속해 조합 |
| Metric | `(example, prediction) -> 점수` 함수. 최적화의 목표 |
| Example / trainset | `dspy.Example(...).with_inputs(...)` 로 만든 소량의 라벨 데이터 |
| Optimizer | `BootstrapFewShot`, `MIPROv2`, `GEPA`, `SIMBA`, `BootstrapFinetune` 등. `compile()` 로 최적화된 프로그램 생성 |
| 저장·로드 | `optimized.save("x.json")` / `program.load(...)` 로 최적화 결과(프롬프트·예시) 보관 |

## 기본 사용법
클래스 시그니처로 정보 추출 + 체인 오브 소트:

```python
import dspy

dspy.configure(lm=dspy.LM("openai/gpt-5.4-nano"))

class ExtractEvent(dspy.Signature):
    """이메일에서 일정 정보를 뽑는다."""
    email: str = dspy.InputField()
    event_name: str = dspy.OutputField()
    date: str = dspy.OutputField(desc="YYYY-MM-DD")

extract = dspy.ChainOfThought(ExtractEvent)
pred = extract(email="다음 주 화요일(2026-11-24) 오후 3시에 분기 리뷰 회의가 있습니다.")
print(pred.event_name, pred.date)
```
모델 id 는 사용하는 공급자 목록에서 확인해 바꾼다.

## 자주 쓰는 패턴
- **최적화(컴파일)**:

  ```python
  def exact_date(ex, pred, trace=None):
      return ex.date == pred.date
  optimizer = dspy.MIPROv2(metric=exact_date, auto="light")
  optimized = optimizer.compile(extract, trainset=trainset)
  optimized.save("extract_v2.json")
  ```
  `GEPA` 는 실행 궤적을 언어 모델이 돌아보며 지시문을 고치는 방식으로, 적은 예제로도 쓸 수 있다.
- **도구 쓰는 에이전트**: `dspy.ReAct("question -> answer", tools=[search, calc])` — 도구는 docstring 과 타입 힌트가 있는 함수.
- **평가**: `dspy.Evaluate(devset=devset, metric=metric)(program)` 로 최적화 전후 점수를 비교한다.
- **모델 교체 후 재컴파일**: 모델을 바꾸면 손으로 프롬프트를 고치는 대신 같은 metric·trainset 으로 다시 `compile()` 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 분류·추출·RAG 답변처럼 정답 지표를 정의할 수 있는 LLM 파이프라인, 모델 교체가 잦아 프롬프트 유지보수 비용이 큰 경우, 작은 모델로 큰 모델 품질에 가깝게 맞추려 할 때.
- 피할 때(대안): 평가 지표·예제 데이터를 만들 수 없는 작업에서는 이점이 적다. 상태·분기·사람 승인 중심 워크플로는 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), 타입 안전한 에이전트 앱은 [Pydantic AI](/develop-wiki/ai/agent-framework/pydantic-ai/), 프롬프트 회귀 테스트만 필요하면 [promptfoo](/develop-wiki/ai/evaluation/promptfoo/)가 가볍다.

## 공식 문서
- [문서 홈](https://dspy.ai/current/) · [Program, don't prompt](https://dspy.ai/current/getting-started/program-dont-prompt/) · [튜토리얼](https://dspy.ai/current/tutorials/)
- [옵티마이저 고르기](https://dspy.ai/current/diving-deeper/choosing-an-optimizer/) · [옵티마이저 API](https://dspy.ai/current/api/optimizers/) · [API 레퍼런스](https://dspy.ai/current/api/)

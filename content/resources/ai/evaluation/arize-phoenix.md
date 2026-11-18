---
name: Arize Phoenix
url: https://phoenix.arize.com
docs: https://arize.com/docs/phoenix
repo: https://github.com/Arize-ai/phoenix
domain: ai
category: evaluation
description: OpenTelemetry·OpenInference 기반으로 LLM 트레이스를 수집하고 평가·데이터셋 실험·프롬프트 관리를 하는 셀프 호스팅형 관측 도구. 로컬에서 바로 띄울 수 있다.
pricing: source-available
tags: [observability, tracing, evals, opentelemetry, openinference]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Phoenix 는 Arize AI 가 만드는 LLM 관측·평가 도구다. 트레이스 수집 형식을 OpenTelemetry(OTLP)와 그 위의 LLM 시맨틱 규약인 OpenInference 로 표준화해, OpenAI·Anthropic·LangChain·LlamaIndex 등 계측 라이브러리를 그대로 붙인다. 수집한 트레이스 위에서 LLM-as-a-judge·코드 평가, 데이터셋 실험, 프롬프트 플레이그라운드를 제공한다.
서버는 `pip` 나 Docker 로 로컬에서 바로 실행되고 셀프 호스팅 비용이 없다. 다만 서버 라이선스는 **Elastic License 2.0**(소스 공개, 비OSI)이며, 클라이언트 패키지(`arize-phoenix-otel`, `arize-phoenix-evals` 등)는 Apache-2.0 이다. 서버 v21, phoenix-evals v3 기준. 운영 알림·온라인 평가는 상용 제품 Arize AX 쪽 기능이다.
같은 영역의 MIT 오픈소스 대안은 [Langfuse](/develop-wiki/ai/evaluation/langfuse/), 관리형 SaaS 는 [LangSmith](/develop-wiki/ai/evaluation/langsmith/) 다.

## 설치
```bash
# 서버 (UI·OTLP HTTP: 6006, OTLP gRPC: 4317)
pip install arize-phoenix && phoenix serve     # 또는 uvx arize-phoenix serve
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest

# 앱 쪽 계측·평가 패키지
pip install arize-phoenix-otel openinference-instrumentation-openai arize-phoenix-evals
```

원격 Phoenix 에 보낼 때는 `PHOENIX_COLLECTOR_ENDPOINT`(예: `https://<호스트>/v1/traces`)와, 인증을 켠 경우 `PHOENIX_API_KEY` 를 설정한다. 로컬 `phoenix serve` 는 키가 필요 없다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| OpenInference | LLM·검색·도구 호출을 OTel span 으로 표현하는 규약과 프레임워크별 계측 패키지 모음 |
| `register()` | `phoenix.otel` 의 OTel TracerProvider 설정 함수. `project_name`, `auto_instrument`, `endpoint` |
| Project | 트레이스를 모으는 단위. 앱·환경별로 나눈다 |
| Evaluator | `phoenix.evals` 의 코드 평가(`create_evaluator`)와 LLM 분류 평가(`create_classifier`, 기성 `FaithfulnessEvaluator` 등) |
| Annotation | span·trace 에 붙는 평가 결과·사람 피드백 |
| Dataset / Experiment | 예제 묶음에 작업 함수를 돌려 평가기로 채점하고 실행끼리 비교 |
| Prompt Playground | 프롬프트·모델을 바꿔 가며 span 이나 데이터셋에 재실행해 보는 UI |

## 기본 사용법
계측: 앱 시작 시 한 번 호출하면 설치된 OpenInference 계측기가 자동으로 켜진다.

```python
from phoenix.otel import register
from openai import OpenAI

register(project_name="support-bot", auto_instrument=True)  # 기본: 로컬 6006

client = OpenAI()
client.responses.create(model="gpt-5-mini", input="Phoenix 를 한 줄로 소개해 줘")
# → http://localhost:6006 의 support-bot 프로젝트에 트레이스가 쌓인다
```

평가: DataFrame 의 각 행에 코드 평가기와 LLM 평가기를 함께 돌린다(phoenix-evals v3).

```python
import pandas as pd
from phoenix.evals import LLM, create_evaluator, evaluate_dataframe
from phoenix.evals.metrics import FaithfulnessEvaluator

@create_evaluator(name="short_enough", kind="code")
def short_enough(output: str) -> bool:
    return len(output) <= 200

faithfulness = FaithfulnessEvaluator(llm=LLM(provider="openai", model="gpt-5-mini"))
df = pd.DataFrame({
    "input": ["환불 기한은?"],
    "output": ["구매 후 30일 이내입니다."],
    "context": ["모든 상품은 구매일로부터 30일 이내 전액 환불된다."],
})
result = evaluate_dataframe(dataframe=df, evaluators=[short_enough, faithfulness])
print(result.filter(like="_score").iloc[0].to_dict())
```

## 자주 쓰는 패턴
- **기존 앱에 빠르게 붙이기**: 앱 루트에서 `npx -y @arizeai/phoenix-cli setup` 을 실행하면 계측 설정을 도와준다.
- **기성 평가기**: `phoenix.evals.metrics` 에 Faithfulness·Hallucination·Correctness·DocumentRelevance·ToolSelection·Toxicity 등이 있고, 필요한 입력 열(`input`, `output`, `context` 등)만 맞추면 된다.
- **맞춤 LLM 분류 평가**: `create_classifier(name=..., prompt_template=..., llm=..., choices={"good": 1, "bad": 0})` 로 라벨·점수 매핑을 정의한다.
- **평가 결과를 트레이스에 기록**: 평가 결과를 span annotation 으로 올려 UI 에서 필터링한다(`arize-phoenix-client`).
- **gRPC 로 보내기**: 대량 트레이스는 `register(protocol="grpc")` 와 4317 포트를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: OpenTelemetry 표준으로 계측해 벤더 종속을 피하고 싶을 때, 노트북·로컬에서 트레이스와 평가를 바로 확인하고 싶을 때, RAG·에이전트 디버깅용 셀프 호스팅 도구가 필요할 때.
- 피할 때(대안): OSI 오픈소스 라이선스가 필요하면(ELv2 는 관리형 서비스로 재제공하는 것을 금지) [Langfuse](/develop-wiki/ai/evaluation/langfuse/). 알림이 포함된 운영 모니터링은 Arize AX 같은 상용 제품이 필요하다. 프롬프트 회귀 테스트만 필요하면 [Promptfoo](/develop-wiki/ai/evaluation/promptfoo/).

## 공식 문서
- [문서 홈](https://arize.com/docs/phoenix) · [시작하기](https://arize.com/docs/phoenix/get-started) · [트레이싱 시작하기](https://arize.com/docs/phoenix/get-started/get-started-tracing)
- [평가 개요](https://arize.com/docs/phoenix/evaluation/llm-evals) · [GitHub](https://github.com/Arize-ai/phoenix) · [OpenInference](https://github.com/Arize-ai/openinference)

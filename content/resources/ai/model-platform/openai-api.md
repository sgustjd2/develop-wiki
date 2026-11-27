---
name: OpenAI API
url: https://developers.openai.com/api/docs
docs: https://developers.openai.com/api/docs
repo: https://github.com/openai/openai-python
stars: 32260
domain: ai
category: model-platform
description: OpenAI 의 GPT 계열 모델을 호출하는 상용 API. Responses API 를 중심으로 도구 호출, 임베딩, 배치, 실시간 음성을 제공한다.
pricing: paid
tags: [llm-api, gpt, responses-api, sdk]
languages: [python, typescript, csharp, java, go, ruby]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenAI API 는 GPT 계열 텍스트·추론 모델과 이미지·음성·임베딩 모델을 HTTP 로 제공하는 플랫폼이다. 새 코드는 `POST /v1/responses`(Responses API)를 기본으로 쓰고, 기존 Chat Completions API 도 계속 지원된다.
Responses API 는 대화 상태 저장(`previous_response_id`), 내장 도구(웹 검색·파일 검색·코드 컨테이너), 함수 호출, 구조화 출력을 한 엔드포인트에서 다룬다.
"OpenAI 호환 API" 가 사실상 업계 표준이라 [vLLM](/develop-wiki/ai/inference-serving/vllm/), [Ollama](/develop-wiki/ai/inference-serving/ollama/), [OpenRouter](/develop-wiki/ai/model-platform/openrouter/) 등 많은 서버가 같은 SDK 로 base URL 만 바꿔 호출된다.

## 설치
공식 SDK: TypeScript/JavaScript, Python, .NET(C#), Java, Go, Ruby (2026-11 기준 PyPI `openai` 3.55.0, npm `openai` 7.59.0).

```bash
pip install openai
npm install openai
export OPENAI_API_KEY="..."   # 대시보드에서 발급
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 ID | 2026-11 문서 기준 `gpt-6.2-astra`(복잡한 추론·코딩, 처음이면 이것), `gpt-6.2-sol`(성능·비용 균형), `gpt-6.1-terra`(빠름), `gpt-6-luna`(대량 처리) |
| Responses API | `input` 을 받아 `output` 항목 배열을 돌려준다. SDK 의 `output_text` 로 텍스트만 꺼낸다 |
| Chat Completions | `messages` 배열 기반의 이전 API. 호환 서버들이 주로 이 형식을 구현한다 |
| 함수 호출 | `tools` 에 JSON 스키마로 함수를 정의하고, 모델이 돌려준 호출을 실행해 결과를 다시 넣는다 |
| 구조화 출력 | JSON 스키마를 지정해 응답 형식을 강제 |
| 처리 등급 | Standard, Batch, Flex, Fast(구 Priority) 등 지연·가격이 다른 처리 방식 |

## 기본 사용법
Python

```python
from openai import OpenAI

client = OpenAI()  # OPENAI_API_KEY 사용
resp = client.responses.create(
    model="gpt-6.2-sol",
    input="임베딩과 리랭커의 차이를 두 문장으로",
)
print(resp.output_text)
```

TypeScript

```typescript
import OpenAI from "openai";

const client = new OpenAI();
const resp = await client.responses.create({
  model: "gpt-6.2-sol",
  input: "하이브리드 검색이란?",
});
console.log(resp.output_text);
```

## 자주 쓰는 패턴
- **다른 서버에 같은 코드 쓰기**: `OpenAI(base_url="http://localhost:8000/v1", api_key=...)` 처럼 base URL 만 바꾸면 자체 호스팅 서버·게이트웨이를 호출할 수 있다. 환경 변수 `OPENAI_BASE_URL` 도 읽는다.
- **멀티턴**: 대화 전체를 매번 보내는 대신 이전 응답 ID 를 `previous_response_id` 로 넘긴다. 저장을 원치 않으면 `store=False`.
- **대량 작업은 Batch**: 실시간이 아닌 분류·요약·임베딩 생성은 Batch API 로 보내 비용을 줄인다.
- **임베딩**: 임베딩 엔드포인트로 벡터를 만들어 [pgvector](/develop-wiki/ai/vector-db/pgvector/)·[Qdrant](/develop-wiki/ai/vector-db/qdrant/) 같은 벡터 DB 에 저장한다.
- **에이전트**: 공식 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/) 가 Responses API 위에서 도구·핸드오프·가드레일을 제공한다.

## 요금 구조
- 토큰 단위 과금이며 입력, 캐시된 입력, 출력 단가가 따로 있다. 캐시된 입력은 일반 입력보다 훨씬 싸고, 출력이 가장 비싸다.
- 아주 긴 프롬프트에는 더 높은 장문 요금이 붙는다.
- Batch 는 표준의 약 절반, Flex 도 많은 모델에서 저렴하고, Fast 는 더 비싼 대신 빠르다.
- 내장 도구(웹 검색 등)는 별도 요금이 있고, 이미지·음성·임베딩 모델은 따로 책정된다. 일반 무료 구간은 가격 페이지에 없다(모더레이션 엔드포인트만 무료).

## 언제 쓰나 / 피할 때
- 쓸 때: 범용 추론·코딩·멀티모달을 하나의 상용 API 로 해결할 때, 내장 웹 검색·파일 검색이 필요한 에이전트, OpenAI 호환 생태계 도구를 그대로 쓰고 싶을 때.
- 피할 때(대안): 오픈 웨이트로 자체 호스팅이 필요하면 [gpt-oss-120b](/develop-wiki/models/openai/gpt-oss-120b/) 같은 공개 모델을 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 으로 서빙한다. AWS 안에서 OpenAI 모델을 쓰려면 [Amazon Bedrock](/develop-wiki/ai/model-platform/amazon-bedrock/) 도 선택지다.

## 공식 문서
- [Quickstart](https://developers.openai.com/api/docs/quickstart) · [모델](https://developers.openai.com/api/docs/models) · [가격](https://developers.openai.com/api/docs/pricing)
- [Responses API 레퍼런스](https://developers.openai.com/api/reference/resources/responses) · [Python SDK](https://github.com/openai/openai-python) · [Node SDK](https://github.com/openai/openai-node)

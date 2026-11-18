---
name: OpenRouter
url: https://openrouter.ai
docs: https://openrouter.ai/docs
domain: ai
category: model-platform
description: 여러 회사의 상용·오픈 웨이트 모델을 API 키 하나와 OpenAI 호환 엔드포인트로 호출하는 모델 라우팅 게이트웨이.
pricing: freemium
tags: [llm-api, gateway, router, openai-compatible]
languages: [typescript, python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenRouter 는 여러 모델 공급자 앞에 놓인 통합 API 다. `https://openrouter.ai/api/v1` 하나로 OpenAI·Anthropic·Google 모델과 여러 호스팅 업체가 서빙하는 오픈 웨이트 모델을 같은 형식(OpenAI 호환 Chat Completions·Responses)으로 부른다.
같은 모델을 여러 공급자가 서빙하면 요청을 나눠 보내고, 한 곳이 오류를 내면 다음 공급자로 자동 전환한다. 결제는 선불 크레딧 하나로 묶인다.
공급자 직접 계약([Claude API](/develop-wiki/ai/model-platform/anthropic-api/), [OpenAI API](/develop-wiki/ai/model-platform/openai-api/))과 비교해 모델 교체가 쉬운 대신, 중간 계층이 하나 더 생긴다.

## 설치
공식 SDK(2026-11 기준 npm `@openrouter/sdk` 1.5.111, PyPI `openrouter` 1.3.186). OpenAI SDK 를 그대로 써도 된다.

```bash
npm install @openrouter/sdk
pip install openrouter
export OPENROUTER_API_KEY="..."
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 슬러그 | `공급자/모델` 형식. 전체 목록은 `GET /api/v1/models` |
| 최신 별칭 | `~openai/gpt-sol-latest`, `~anthropic/claude-sonnet-latest` 처럼 `~` 접두사 별칭은 해당 계열의 최신 모델로 해석된다 |
| `:free` 변형 | 무료 모델 항목. 별도 속도 제한이 있다. `openrouter/free` 는 무료 모델을 자동 선택 |
| 라우팅 변형 | `:nitro`(처리량 우선), `:floor`(가격 우선), `:exacto`(도구 호출 신뢰도 우선) |
| 공급자 폴백 | 한 공급자가 실패하면 다음 공급자로 자동 재시도 |
| BYOK | 내 공급자 키를 연결해 OpenRouter 경유로 사용 |
| 선택 헤더 | `HTTP-Referer`, `X-OpenRouter-Title` — openrouter.ai 순위 집계용 앱 정보 |

## 기본 사용법
OpenAI SDK 로 호출 (가장 흔한 방식)

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"],
)
resp = client.responses.create(
    model="~anthropic/claude-sonnet-latest",
    input="모델 라우터가 필요한 상황 두 가지",
)
print(resp.output_text)
```

공식 TypeScript SDK

```typescript
import { OpenRouter } from "@openrouter/sdk";

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
const res = await client.responses.send({
  responsesRequest: { model: "~openai/gpt-sol-latest", input: "안녕?" },
});
console.log(res);
```

curl

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "~openai/gpt-sol-latest", "messages": [{"role": "user", "content": "hi"}]}'
```

## 자주 쓰는 패턴
- **모델 A/B 비교**: 코드 수정 없이 `model` 문자열만 바꿔 여러 회사 모델을 같은 프롬프트로 비교한다.
- **오픈 웨이트 모델 호출**: GPU 없이 [GLM-5.3](/develop-wiki/models/zai/glm-5.3/), [Qwen3-Coder-Next](/develop-wiki/models/qwen/qwen3-coder-next/) 같은 공개 모델을 호스팅 업체 경유로 쓴다.
- **에이전트 프레임워크 백엔드**: OpenAI 호환이라 [LangChain](/develop-wiki/ai/agent-framework/langchain/)·[Mastra](/develop-wiki/ai/agent-framework/mastra/) 등에서 base URL 만 바꿔 붙인다.
- **개인정보 정책**: 계정의 프라이버시 설정으로 데이터 학습·보관 정책이 맞지 않는 공급자를 제외할 수 있다. 조건을 만족하는 공급자가 없으면 요청이 실패한다.

## 요금 구조
- 모델 가격은 공급자 가격을 그대로 전달하고 추론 자체에 마진을 붙이지 않는다고 밝힌다. 대신 크레딧을 충전할 때 결제 수수료가 붙는다.
- BYOK 는 요금제별 무료 허용량을 넘으면 사용분에 비례한 수수료가 크레딧에서 차감된다.
- `:free` 모델은 하루 요청 수 제한이 있고, 크레딧을 일정 금액 이상 구매한 계정은 한도가 올라간다. 세부 수치는 [FAQ](https://openrouter.ai/docs/faq)에서 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 공급자 모델을 실험·비교할 때, 공급자 장애에 대비한 자동 폴백이 필요할 때, 결제·키 관리를 하나로 묶고 싶을 때.
- 피할 때(대안): 특정 공급자의 신규 기능(베타 파라미터 등)을 바로 써야 하거나 데이터 경로를 최소화해야 하면 공급자 API 를 직접 쓴다. 오픈 모델 중심이라면 [Hugging Face](/develop-wiki/ai/model-platform/huggingface-hub/) Inference Providers 도 비교 대상이다.

## 공식 문서
- [Quickstart](https://openrouter.ai/docs/quickstart) · [FAQ(요금·무료 모델)](https://openrouter.ai/docs/faq) · [모델 목록](https://openrouter.ai/models)

---
name: Claude API (Anthropic)
url: https://platform.claude.com
docs: https://platform.claude.com/docs/en/home
repo: https://github.com/anthropics/anthropic-sdk-python
domain: ai
category: model-platform
description: Anthropic 의 Claude 모델을 호출하는 상용 API. Messages API 하나로 도구 호출·구조화 출력·프롬프트 캐싱·배치를 다룬다.
pricing: paid
tags: [llm-api, claude, messages-api, sdk]
languages: [python, typescript, java, go, ruby, csharp, php]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Claude API 는 Anthropic 이 제공하는 Claude 모델의 HTTP API 다. 모든 생성은 `POST /v1/messages`(Messages API) 하나로 처리하고, 사용자 정의 도구, 서버 측 도구(웹 검색·웹 페치·코드 실행), 구조화 출력, PDF·이미지 입력이 모두 이 엔드포인트의 옵션이다.
보조 엔드포인트로 Message Batches(비동기 대량 처리), Files, 토큰 카운트, Models(모델 목록·컨텍스트 크기 조회)가 있고, 에이전트 루프와 샌드박스를 Anthropic 이 호스팅하는 Managed Agents(베타)도 있다.
같은 모델을 Amazon Bedrock, Google Cloud Vertex AI, Microsoft Foundry 에서도 쓸 수 있다(→ [Amazon Bedrock](/develop-wiki/ai/model-platform/amazon-bedrock/)).

## 설치
공식 SDK: Python, TypeScript, Java, Go, Ruby, C#, PHP (2026-11 기준 PyPI `anthropic` 2.10.0, npm `@anthropic-ai/sdk` 1.10.0).

```bash
pip install anthropic
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY="..."   # 콘솔에서 발급. 코드에 넣지 않는다
```

SDK 는 `ANTHROPIC_API_KEY` → `ANTHROPIC_AUTH_TOKEN` → `ant auth login` 프로필 순으로 자격 증명을 찾는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 ID | 2026-11 기준 `claude-opus-5-5`(기본 권장), `claude-sonnet-5-5`, `claude-haiku-5-5`, 고난도 추론·장기 에이전트 작업용 `claude-fable-5-2`. 날짜 접미사를 붙이지 않는다 |
| `max_tokens` | 응답 최대 토큰. 필수 파라미터 |
| content block | 응답 `content` 는 블록 배열(`text`, `thinking`, `tool_use` …). `type` 으로 분기해서 읽는다 |
| 적응형 사고 | 최신 모델은 `thinking: {type: "adaptive"}` 와 `output_config.effort`(`low`~`max`)로 사고량을 조절. 예전 `budget_tokens` 방식은 최신 모델에서 거부된다 |
| `stop_reason` | `end_turn`, `max_tokens`, `tool_use`, `refusal` 등. 내용 읽기 전에 확인 |
| 프롬프트 캐싱 | `cache_control` 로 앞부분(도구→system→messages) 접두사를 캐시. 바이트 하나만 바뀌어도 이후가 무효 |
| 구조화 출력 | `output_config.format` 에 JSON 스키마, 도구에는 `strict: true` |

## 기본 사용법
Python

```python
import anthropic

client = anthropic.Anthropic()  # ANTHROPIC_API_KEY 사용
resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    messages=[{"role": "user", "content": "벡터 DB 를 한 문장으로 설명해 줘"}],
)
for block in resp.content:
    if block.type == "text":
        print(block.text)
```

TypeScript

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const resp = await client.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 4096,
  messages: [{ role: "user", content: "RAG 의 장단점 두 가지씩" }],
});
for (const block of resp.content) if (block.type === "text") console.log(block.text);
```

REST 로 직접 부를 때는 `x-api-key` 와 `anthropic-version` 헤더를 붙여 `https://api.anthropic.com/v1/messages` 에 POST 한다.

## 자주 쓰는 패턴
- **긴 출력은 스트리밍**: `max_tokens` 가 크면 HTTP 타임아웃을 피하려고 `client.messages.stream(...)` 과 `get_final_message()`(TS `finalMessage()`)를 쓴다.
- **도구 호출 루프**: 도구를 정의하고 `stop_reason == "tool_use"` 이면 실행 결과를 `tool_result` 블록으로 돌려보낸다. SDK 의 베타 Tool Runner 가 이 루프를 대신 돌려 준다.
- **캐시 친화적 프롬프트**: 고정된 system·도구 정의를 앞에, 매번 바뀌는 값(시각, 요청 ID)은 뒤에 둔다. `usage.cache_read_input_tokens` 가 0 이면 캐시가 깨지고 있다는 신호다.
- **대량 비동기 처리**: 지연이 상관없는 작업은 Message Batches 로 보내 비용을 줄인다. 결과는 순서가 보장되지 않으니 `custom_id` 로 매칭한다.
- **에이전트 프레임워크 연동**: [LangChain](/develop-wiki/ai/agent-framework/langchain/), [CrewAI](/develop-wiki/ai/agent-framework/crewai/), [Mastra](/develop-wiki/ai/agent-framework/mastra/) 등이 Claude 를 기본 공급자로 지원한다. 터미널 코딩 에이전트로는 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 가 있다.

## 요금 구조
- 입력·출력 토큰 단가가 모델별로 다르고 출력이 더 비싸다. 상위 모델일수록 단가가 높다.
- 프롬프트 캐시는 쓰기 시 일반 입력보다 조금 비싸고, 읽기는 일반 입력보다 훨씬 싸게 과금된다.
- Message Batches 는 표준 요금보다 할인된다. 일부 모델은 더 비싼 대신 빠른 fast mode 를 제공한다.
- 무료 사용 구간은 상시 제공되지 않는다. 정확한 단가는 [가격 페이지](https://platform.claude.com/docs/en/about-claude/pricing)에서 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 긴 문맥(최신 모델 1M 토큰) 문서 분석, 코딩·에이전트 작업, 도구 호출과 구조화 출력이 많은 백엔드.
- 피할 때(대안): 데이터를 외부로 보낼 수 없으면 오픈 웨이트 모델을 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 등으로 자체 호스팅한다. 여러 공급자를 한 키로 바꿔 가며 쓰려면 [OpenRouter](/develop-wiki/ai/model-platform/openrouter/), AWS 계정·IAM 안에서 쓰려면 [Amazon Bedrock](/develop-wiki/ai/model-platform/amazon-bedrock/).

## 공식 문서
- [문서 홈](https://platform.claude.com/docs/en/home) · [모델 개요](https://platform.claude.com/docs/en/about-claude/models/overview) · [가격](https://platform.claude.com/docs/en/about-claude/pricing)
- [도구 사용](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · [스트리밍](https://platform.claude.com/docs/en/build-with-claude/streaming) · [Python SDK](https://github.com/anthropics/anthropic-sdk-python) · [TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)

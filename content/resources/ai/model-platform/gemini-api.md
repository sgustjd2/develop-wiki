---
name: Gemini API
url: https://aistudio.google.com
docs: https://aistudio.google.com/docs
repo: https://github.com/googleapis/python-genai
stars: 4090
domain: ai
category: model-platform
description: Google 의 Gemini 모델을 호출하는 API. Google AI Studio 키로 쓰고, 일부 모델에 무료 등급이 있다.
pricing: freemium
tags: [llm-api, gemini, google, multimodal, sdk]
languages: [python, typescript, java, go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Gemini API(Gemini Developer API)는 Google 의 Gemini 텍스트·멀티모달 모델과 음성·이미지·영상 생성 모델, 임베딩 모델을 제공한다. Google AI Studio 에서 API 키를 발급해 바로 쓰며, 같은 모델을 Google Cloud 쪽(Vertex AI 계열)에서 기업용으로 쓸 수도 있다.
통합 SDK `google-genai`(Python)·`@google/genai`(JS)가 Developer API 와 Google Cloud 백엔드를 모두 지원한다. 2026-11 기준 문서 사이트가 `aistudio.google.com/docs` 로 옮겨졌고, 빠른 시작은 Interactions API(`client.interactions.create`)를 쓰며 기존 `models.generate_content` 도 SDK 에 그대로 있다.

## 설치
2026-11 기준 PyPI `google-genai` 3.5.0, npm `@google/genai` 3.6.0. Java·Go SDK 도 공식 제공된다.

```bash
pip install -U google-genai
npm install @google/genai
export GEMINI_API_KEY="..."   # AI Studio 에서 발급
```

Python SDK 는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` 를 읽는다(둘 다 있으면 `GOOGLE_API_KEY` 우선).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 ID | 2026-11 기준 Gemini 4 계열 `gemini-4-carbon`(최고 추론), `gemini-4-argon`(효율형 추론), `gemini-4-hydrogen`(빠른 일상·에이전트용), Flash 계열 `gemini-3.8-flash` 등 |
| 지원 종료 예정 | `gemini-2.5-flash`·`gemini-2.5-pro` 는 2026-12-01 부터 다른 모델로 라우팅된다고 공지됨 |
| `genai.Client` | Developer API·Google Cloud 공통 클라이언트 |
| Interactions API | `interactions.create(model, input)` → `output_text` |
| `generate_content` | `models.generate_content(model, contents, config)` → `response.text` |
| 임베딩 | `gemini-embedding-2`(멀티모달), `gemini-embedding-001`(텍스트) |
| Live API | 저지연 음성 대화용 `gemini-3.8-live` 계열 |

## 기본 사용법
Python (Interactions API)

```python
from google import genai

client = genai.Client()  # GEMINI_API_KEY 사용
interaction = client.interactions.create(
    model="gemini-4-hydrogen",
    input="청킹 전략 세 가지를 짧게",
)
print(interaction.output_text)
```

Python (generate_content)

```python
from google import genai

client = genai.Client()
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="BM25 와 벡터 검색을 섞는 이유는?",
)
print(response.text)
```

JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
  model: "gemini-4-hydrogen",
  input: "한 문장으로 자기소개",
});
console.log(interaction.output_text);
```

## 자주 쓰는 패턴
- **멀티모달 입력**: 이미지·PDF·오디오·영상을 텍스트와 함께 넣어 요약·추출한다. 큰 파일은 Files API 로 올린 뒤 참조한다.
- **구조화 출력**: 설정에 응답 MIME 타입과 스키마를 지정해 JSON 으로 받는다.
- **긴 문맥 재사용**: 유료 등급에서 컨텍스트 캐싱으로 반복 입력 비용을 줄인다. 최신 모델 다수는 암묵적 캐싱만 지원한다.
- **대량 처리**: Batch API 로 비동기 처리하면 표준 요금보다 싸다.
- **에이전트**: Google 의 [ADK](/develop-wiki/ai/agent-framework/google-adk/) 가 Gemini 를 기본 모델로 쓴다.

## 요금 구조
- **무료 등급**: 현재 다수 모델에 입력·출력 무료 사용분이 있지만 모델이 제한되고, 최상위 모델(Gemini 4 Carbon·Argon 등)은 제외된다. 무료 등급 데이터는 Google 제품 개선에 쓰일 수 있다.
- **유료 등급**: 100만 토큰 단위 과금, 더 높은 속도 제한, 컨텍스트 캐싱(시간당 저장 요금 별도). 유료 데이터는 원칙적으로 제품 개선에 쓰이지 않는다.
- Batch 는 표준의 약 절반, Flex 는 Batch 와 비슷하게 저렴, Priority 는 더 비싸다. 2026 년 말부터 여러 모델의 가격 인상이 공지돼 있으니 [가격 페이지](https://aistudio.google.com/docs/pricing)를 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 영상·오디오·PDF 를 섞은 멀티모달 처리, 무료 등급으로 프로토타입을 빠르게 만들 때, Google Cloud 와 연계된 서비스.
- 피할 때(대안): 무료 등급 데이터 활용 조건이 맞지 않는 민감 데이터는 유료 등급이나 Google Cloud 경로를 쓰고, 그래도 외부 전송이 불가하면 [Gemma 4](/develop-wiki/models/google/gemma-4-31b-it/) 같은 오픈 웨이트를 자체 호스팅한다.

## 공식 문서
- [시작하기](https://aistudio.google.com/docs/get-started) · [모델](https://aistudio.google.com/docs/models) · [가격](https://aistudio.google.com/docs/pricing)
- [Python SDK](https://github.com/googleapis/python-genai) · [JS SDK](https://github.com/googleapis/js-genai) · [문서 색인(llms.txt)](https://aistudio.google.com/llms.txt)

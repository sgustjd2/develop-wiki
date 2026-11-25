---
name: LM Studio
url: https://lmstudio.ai
docs: https://lmstudio.ai/docs/developer
repo: https://github.com/lmstudio-ai/lmstudio-js
stars: 1818
domain: ai
category: inference-serving
description: 로컬 모델을 내려받아 실행하고 OpenAI·Anthropic 호환 로컬 서버와 lms CLI, TypeScript·Python SDK 를 제공하는 로컬 LLM 실행 환경.
pricing: free
tags: [local, gguf, mlx, openai-compatible, sdk]
languages: [typescript, python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
LM Studio 는 오픈 웨이트 모델을 검색·다운로드해 내 컴퓨터에서 실행하는 도구다. GUI 앱 외에 GUI 없이 도는 데몬 **llmster**, 명령줄 도구 **`lms`**, 그리고 TypeScript(`@lmstudio/sdk`)·Python(`lmstudio`) SDK 를 제공해 개발용 로컬 추론 서버로 쓸 수 있다.
로컬 서버는 OpenAI 호환(`/v1/chat/completions`, `/v1/responses`, `/v1/embeddings` 등), Anthropic 호환(Messages), 자체 REST API(`/api/v1/...`)를 함께 연다.
앱 본체는 소스 비공개 무료 소프트웨어이고(2025-07 부터 업무용도 무료라고 공식 블로그가 발표), `lms` CLI·JS SDK 는 MIT 라이선스로 공개돼 있다. 완전 오픈소스가 필요하면 [Ollama](/develop-wiki/ai/inference-serving/ollama/)·[llama.cpp](/develop-wiki/ai/inference-serving/llama-cpp/) 가 대안이다.

## 설치
- GUI 앱: [lmstudio.ai](https://lmstudio.ai) 에서 받는다. `lms` CLI 가 함께 설치된다(경로 등록이 안 되면 `npx lmstudio install-cli`).
- 서버·CI 용 llmster(헤드리스 데몬):

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash          # macOS·Linux
# Windows PowerShell: irm https://lmstudio.ai/install.ps1 | iex
```

- SDK:

```bash
npm install @lmstudio/sdk     # 2.1.0 (2026-11 기준 npm)
pip install lmstudio          # 1.5.0
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `lms` CLI | `lms daemon up`, `lms get <model>`, `lms load`, `lms ps`, `lms server start`, `lms chat` |
| llmster | LM Studio 코어를 GUI 없이 돌리는 데몬. 서버·클라우드 인스턴스·CI 용 |
| 로컬 서버 | 문서 예시 기준 `http://localhost:1234`. OpenAI 클라이언트는 `/v1` 을 base URL 로 쓴다 |
| 모델 식별자 | `openai/gpt-oss-20b` 처럼 LM Studio 가 보여 주는 이름을 `model` 에 넣는다 |
| SDK | `LMStudioClient`(TS), `lms.Client`(Python)로 모델 로드·응답·도구 호출을 코드로 제어 |
| 인증 토큰 | REST 호출 예시는 `Authorization: Bearer $LM_API_TOKEN` 헤더를 쓴다(설정은 인증 문서 참조) |

## 기본 사용법
1) 모델 받고 서버 띄우기

```bash
lms get openai/gpt-oss-20b
lms server start --port 1234
```

2) OpenAI SDK 로 호출

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key=os.environ.get("LM_API_TOKEN", "lm-studio"),
)
resp = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": "로컬 LLM 의 장점 두 가지"}],
)
print(resp.choices[0].message.content)
```

3) 공식 TypeScript SDK

```typescript
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();
const model = await client.llm.model("openai/gpt-oss-20b");
const result = await model.respond("GGUF 와 MLX 의 차이는?");
console.info(result.content);
```

## 자주 쓰는 패턴
- **코딩 에이전트의 로컬 백엔드**: OpenAI·Anthropic 호환 엔드포인트가 있어 base URL 만 바꿔 붙인다.
- **헤드리스 운영**: 서버 머신에는 GUI 대신 llmster 를 설치하고 `lms daemon up` → `lms load` → `lms server start` 순서로 스크립트화한다.
- **로드 상태 확인**: `lms ps --json`, `lms ls --json` 출력은 스크립트에서 파싱하기 쉽다.
- **SDK 로 프로젝트 시작**: `lms create` 로 SDK 템플릿 프로젝트를 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 개인 개발 PC 에서 여러 로컬 모델([gpt-oss-20b](/develop-wiki/models/openai/gpt-oss-20b/), [Qwen3-30B-A3B](/develop-wiki/models/qwen/qwen3-30b-a3b/) 등)을 바꿔 가며 시험할 때, GUI 와 SDK 를 함께 쓰고 싶을 때.
- 피할 때(대안): 라이선스상 오픈소스여야 하거나 서버에 그대로 배포할 엔진이 필요하면 [llama.cpp](/develop-wiki/ai/inference-serving/llama-cpp/)·[Ollama](/develop-wiki/ai/inference-serving/ollama/), 다중 사용자 GPU 서빙은 [vLLM](/develop-wiki/ai/inference-serving/vllm/).
- 참고: Python SDK 저장소(`lmstudio-python`)는 2025-10 이후 커밋이 없다(2026-11-18 확인). TypeScript SDK·`lms` 는 활발히 갱신된다.

## 공식 문서
- [개발자 문서](https://lmstudio.ai/docs/developer) · [OpenAI 호환 API](https://lmstudio.ai/docs/developer/openai-compat)
- [`lms` CLI](https://github.com/lmstudio-ai/lms) · [TypeScript SDK](https://github.com/lmstudio-ai/lmstudio-js) · [Python SDK](https://github.com/lmstudio-ai/lmstudio-python) · [업무용 무료 발표](https://lmstudio.ai/blog/free-for-work)

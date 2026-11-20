---
name: Hugging Face Hub
url: https://huggingface.co
docs: https://huggingface.co/docs/hub
repo: https://github.com/huggingface/huggingface_hub
stars: 4059
domain: ai
category: model-platform
description: 오픈 웨이트 모델·데이터셋·Spaces 를 공유하는 허브. hf CLI·Python 라이브러리로 다운로드·업로드하고 Inference Providers 로 모델을 호출한다.
pricing: freemium
tags: [model-hub, open-weights, inference-providers, cli]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hugging Face Hub 는 오픈 웨이트 모델, 데이터셋, 데모 앱(Spaces)을 Git 기반 저장소로 공유하는 플랫폼이다. 이 사이트의 [오픈 웨이트 모델](/develop-wiki/models/) 항목 대부분이 Hub 의 모델 카드를 1차 출처로 삼는다.
개발자 입장에서는 세 가지 용도가 핵심이다. ① `hf` CLI 와 `huggingface_hub` 라이브러리로 가중치를 내려받고 올리기, ② **Inference Providers** 로 여러 호스팅 업체의 서버리스 추론을 HF 토큰 하나로 호출하기, ③ 전용 Inference Endpoints·Jobs·스토리지 버킷 같은 유료 컴퓨팅.
vLLM·llama.cpp·Ollama 등 대부분의 추론 엔진이 Hub 저장소 id 를 그대로 받는다.

## 설치
2026-11 기준 PyPI `huggingface_hub` 2.4.0, npm `@huggingface/inference` 4.13.33.

```bash
curl -LsSf https://hf.co/cli/install.sh | bash   # hf CLI 단독 설치 (macOS·Linux)
pip install huggingface_hub                       # Python 라이브러리 + hf CLI
npm install @huggingface/inference                # JS 추론 클라이언트
hf auth login                                     # CI 에서는 --token $HF_TOKEN
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 저장소 | 모델·데이터셋·Space 가 각각 Git 저장소. id 는 `org/name` |
| 모델 카드 | README.md + 메타데이터(라이선스, 태그, 파라미터 수). 게이트 모델은 약관 동의 후 접근 |
| 토큰 | `HF_TOKEN` 환경 변수. 세분화(fine-grained) 토큰에 "Inference Providers 호출" 권한을 줄 수 있다 |
| 캐시 | 다운로드 파일은 로컬 캐시(`~/.cache/huggingface`)에 저장돼 여러 라이브러리가 공유 |
| Inference Providers | 여러 공급자의 서버리스 추론을 한 API 로 라우팅. 장애 시 다른 공급자로 전환 |
| OpenAI 호환 라우터 | `https://router.huggingface.co/v1` (채팅만) |
| 정책 접미사 | 모델 id 뒤 `:fastest`, `:cheapest`, 또는 `:공급자명` 으로 공급자 선택 |

## 기본 사용법
1) 모델 내려받기

```bash
hf download Qwen/Qwen3-0.6B
hf models ls --warm          # Inference Providers 로 서빙 중인 모델 목록
```

```python
from huggingface_hub import snapshot_download

path = snapshot_download("BAAI/bge-m3")   # 로컬 경로 반환
print(path)
```

2) Inference Providers 로 채팅 호출 (OpenAI SDK)

```python
import os
from openai import OpenAI

client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=os.environ["HF_TOKEN"])
resp = client.chat.completions.create(
    model="deepseek-ai/DeepSeek-V4.1-Flash:fastest",
    messages=[{"role": "user", "content": "오픈 웨이트 모델의 장점은?"}],
)
print(resp.choices[0].message.content)
```

3) `InferenceClient` 로 공급자를 지정해 호출 — 채팅 외 작업(이미지 생성, 임베딩 등)도 같은 클라이언트의 작업별 메서드(`text_to_image`, `feature_extraction` …)로 부른다.

```python
from huggingface_hub import InferenceClient

client = InferenceClient()  # HF_TOKEN 또는 hf auth login 사용
result = client.chat_completion(
    model="deepseek-ai/DeepSeek-R1",
    provider="novita",  # 생략하면 "auto"
    messages=[{"role": "user", "content": "Hello!"}],
)
print(result.choices[0].message.content)
```

## 자주 쓰는 패턴
- **업로드**: `hf upload user/my-model ./model.safetensors` 또는 `upload_folder()`. 파인튜닝 결과를 비공개 저장소에 올려 팀과 공유한다.
- **오프라인·CI 캐시**: 서버 배포 시 `HF_HOME` 으로 캐시 위치를 고정하고, 이미지 빌드 단계에서 미리 `hf download` 해 둔다.
- **공급자 고정**: 지연이 중요하면 `:fastest`, 비용이 중요하면 `:cheapest`, 특정 업체가 필요하면 `model="org/name:novita"` 처럼 지정한다.
- **추론 엔진 연동**: [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[llama.cpp](/develop-wiki/ai/inference-serving/llama-cpp/)(`-hf`)·[MLX LM](/develop-wiki/ai/inference-serving/mlx-lm/) 이 Hub id 로 바로 모델을 받는다.
- **코딩 에이전트용 CLI**: `hf` 는 에이전트가 실행하면 출력 형식을 맞춰 주며, `hf skills add` 로 명령 레퍼런스를 스킬로 설치할 수 있다.

## 요금 구조
- 공개 모델·데이터셋 다운로드와 공개 저장소 호스팅은 무료다.
- Inference Providers 는 사용량 과금이며 공급자 요금에 마진을 붙이지 않는다고 밝힌다. PRO 개인 요금제와 Team·Enterprise 조직에는 매월 포함 크레딧이 있다.
- 전용 Inference Endpoints, Jobs, 스토리지, 유료 Spaces 하드웨어는 별도 과금이다. 정확한 금액은 [가격 페이지](https://huggingface.co/pricing)를 본다.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈 웨이트 모델을 찾고 받을 때, 파인튜닝 결과를 버전 관리·공유할 때, GPU 없이 공개 모델을 API 로 시험할 때.
- 피할 때(대안): 상용 폐쇄 모델은 각 공급자 API([Claude](/develop-wiki/ai/model-platform/anthropic-api/), [OpenAI](/develop-wiki/ai/model-platform/openai-api/), [Gemini](/develop-wiki/ai/model-platform/gemini-api/))를 쓴다. 상용·오픈 모델을 한 키로 섞어 쓰려면 [OpenRouter](/develop-wiki/ai/model-platform/openrouter/).

## 공식 문서
- [Hub 문서](https://huggingface.co/docs/hub) · [huggingface_hub 라이브러리](https://huggingface.co/docs/huggingface_hub) · [hf CLI](https://huggingface.co/docs/huggingface_hub/en/guides/cli)
- [Inference Providers](https://huggingface.co/docs/inference-providers/index) · [토큰](https://huggingface.co/docs/hub/security-tokens)

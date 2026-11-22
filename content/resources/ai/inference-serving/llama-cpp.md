---
name: llama.cpp
url: https://github.com/ggml-org/llama.cpp
docs: https://github.com/ggml-org/llama.cpp/tree/master/docs
repo: https://github.com/ggml-org/llama.cpp
stars: 136093
domain: ai
category: inference-serving
description: GGUF 형식 모델을 CPU·GPU·Apple Silicon 에서 돌리는 C/C++ 추론 엔진. 로컬 실행과 OpenAI 호환 서버(llama-server)에 쓴다.
pricing: oss
tags: [local, gguf, quantization, cpp, server]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
llama.cpp 는 [ggml](https://github.com/ggml-org/ggml) 텐서 라이브러리 위에 만든 C/C++ LLM 추론 엔진이다. 양자화된 GGUF 가중치를 쓰기 때문에 GPU 가 없는 노트북·서버, Apple Silicon, 모바일에서도 큰 모델을 돌릴 수 있고, CUDA·ROCm·Vulkan·SYCL·Metal 등 여러 백엔드를 지원한다.
`llama-server` 는 OpenAI 호환(`/v1/chat/completions`, `/v1/responses`, `/v1/embeddings`)과 Anthropic 호환(`/v1/messages`) API, 리랭킹 엔드포인트, 내장 웹 채팅 UI 를 한 바이너리로 제공한다.
[Ollama](/develop-wiki/ai/inference-serving/ollama/)·[LM Studio](/develop-wiki/ai/inference-serving/lm-studio/) 같은 로컬 실행 도구가 내부 엔진으로 많이 쓰며, 다중 사용자 GPU 처리량이 중요하면 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[SGLang](/develop-wiki/ai/inference-serving/sglang/) 이 더 맞다.

2026-11 에 v1.0.0 이 나오면서 시맨틱 버저닝을 도입했다(공개 C API 가 깨지면 메이저 버전을 올린다). 동시에 `b12500` 같은 빌드 번호 태그가 매일 나이트리로 계속 올라온다.

## 설치
```bash
# 공식 설치 스크립트 (macOS·Linux) — `llama` 명령이 설치된다
curl -LsSf https://llama.app/install.sh | sh

# 패키지 매니저
brew install llama.cpp          # macOS·Linux
winget install llama.cpp        # Windows
```

Docker 이미지는 `ghcr.io/ggml-org/llama.cpp:server`(CPU), `:server-cuda`, `:server-cuda13`, `:server-rocm`, `:server-vulkan` 등으로 나뉜다. 소스 빌드는 `cmake -B build && cmake --build build --config Release -t llama-server`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| GGUF | 가중치·토크나이저·채팅 템플릿을 한 파일에 담는 모델 형식. HF 에 `*-GGUF` 저장소로 많이 올라온다 |
| 양자화 | `Q4_K_M`, `Q8_0` 등. `-hf user/repo:Q4_K_M` 처럼 골라 받는다(미지정 시 Q4_K_M) |
| `llama-server` | OpenAI·Anthropic 호환 HTTP 서버 + 웹 UI. 기본 주소 `127.0.0.1:9931` (v1 문서 기준) |
| `llama-cli` / `llama cli` | 터미널 대화형 실행 |
| `-ngl` | GPU 에 올릴 레이어 수. 기본 `auto`, `all` 로 전부 |
| 슬롯 `-np` | 동시에 처리할 요청 수(서버 슬롯). 연속 배칭은 기본 켜짐 |
| 라우터 모드 | 모델 없이 `llama-server` 를 띄우면 요청의 `model` 에 따라 모델을 동적으로 올리고 내린다 |
| `libllama` | 다른 앱에 임베드하는 C API (`llama.h`) |

## 기본 사용법
1) Hugging Face 에서 GGUF 를 받아 바로 서버 띄우기

```bash
llama-server -hf ggml-org/Qwen3.5-0.8B-GGUF:Q4_K_M --port 8080 -c 8192
# 설치 스크립트로 깔았다면: llama serve -hf ggml-org/Qwen3.5-0.8B-GGUF
```

브라우저에서 `http://localhost:8080` 을 열면 내장 채팅 UI 가 나온다.

2) OpenAI SDK 로 호출 — 서버를 `--api-key` 없이 띄웠다면 키는 아무 문자열이나 된다.

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key=os.environ.get("LLAMA_API_KEY", "none"),
)
resp = client.chat.completions.create(
    model="any",  # 단일 모델 서버는 이 값을 무시한다
    messages=[{"role": "user", "content": "GGUF 가 뭔지 한 문장으로"}],
)
print(resp.choices[0].message.content)
```

3) 로컬 파일로 실행

```bash
llama-server -m ./models/my-model-Q4_K_M.gguf -ngl all --port 8080
```

## 자주 쓰는 패턴
- **인증**: `--api-key` 또는 `LLAMA_API_KEY` 환경 변수. 외부에 열 때는 `--host 0.0.0.0` 과 함께 반드시 키를 건다.
- **메모리가 부족할 때**: 더 낮은 양자화(`Q4_K_M` → `Q3_K_M`), `-c` 로 컨텍스트 축소, KV 캐시 양자화(`-ctk q8_0 -ctv q8_0`), MoE 모델은 `--cpu-moe` 로 전문가 가중치를 CPU 에 둔다.
- **임베딩·리랭킹 서버**: 임베딩 전용 모델로 `--embedding` 을 켜면 `/v1/embeddings`, 리랭커 모델이면 `/reranking` 을 쓴다. RAG 의 임베딩([BGE-M3](/develop-wiki/models/baai/bge-m3/) GGUF 등)과 재정렬을 로컬에서 처리할 때 유용하다.
- **도구 호출·구조화 출력**: Jinja 채팅 템플릿이 기본 켜져 있어 `tools`·`response_format`(JSON 스키마)을 OpenAI 형식으로 보낼 수 있다. 문법 제약은 GBNF 로도 건다.
- **여러 모델 운영**: 모델 없이 `llama-server --models-dir ./models` 로 라우터 모드를 띄우고 `/models/load`·`/models/unload` 로 관리한다.
- **모니터링**: `/health`, `/metrics`(Prometheus), `/slots` 엔드포인트.

## 언제 쓰나 / 피할 때
- 쓸 때: GPU 가 없거나 작은 환경에서 오픈 웨이트 모델([gpt-oss-20b](/develop-wiki/models/openai/gpt-oss-20b/), [Gemma 4 E4B](/develop-wiki/models/google/gemma-4-e4b-it/) 등)을 돌릴 때, 의존성 적은 단일 바이너리 서버가 필요할 때, 앱에 추론 엔진을 임베드할 때.
- 피할 때(대안): 모델 관리까지 편하게 하고 싶으면 [Ollama](/develop-wiki/ai/inference-serving/ollama/), 데이터센터 GPU 에서 동시 사용자 처리량이 중요하면 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[SGLang](/develop-wiki/ai/inference-serving/sglang/), Apple Silicon 에서 MLX 생태계를 쓰려면 [MLX LM](/develop-wiki/ai/inference-serving/mlx-lm/).

## 공식 문서
- [README](https://github.com/ggml-org/llama.cpp) · [설치](https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md) · [빌드](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) · [Docker](https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md)
- [llama-server 레퍼런스](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) · [함수 호출](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md) · [v1.0.0 발표](https://huggingface.co/blog/ggml-org/llama-cpp-v1)

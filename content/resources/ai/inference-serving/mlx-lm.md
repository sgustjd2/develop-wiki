---
name: MLX LM
url: https://github.com/ml-explore/mlx-lm
docs: https://github.com/ml-explore/mlx-lm/blob/main/README.md
repo: https://github.com/ml-explore/mlx-lm
stars: 7757
domain: ai
category: inference-serving
description: Apple 의 MLX 위에서 LLM 을 실행·양자화·LoRA 파인튜닝하는 Python 패키지. Apple Silicon Mac 에서 로컬 추론할 때 쓴다.
pricing: oss
tags: [apple-silicon, mlx, local, quantization, lora]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
MLX LM 은 Apple 머신러닝 연구팀의 배열 프레임워크 [MLX](https://github.com/ml-explore/mlx) 를 기반으로, Apple Silicon 의 통합 메모리를 활용해 LLM 을 실행하는 패키지다. Hugging Face Hub 와 붙어 있어 모델 이름만으로 내려받아 생성·대화할 수 있고, 같은 도구로 양자화 변환과 LoRA·전체 파인튜닝까지 한다.
`mlx-community` 조직에 미리 변환된 4bit·8bit 모델이 많이 올라와 있어 변환 없이 바로 쓰는 경우가 많다.
Mac 에서 GGUF 생태계를 쓰려면 [llama.cpp](/develop-wiki/ai/inference-serving/llama-cpp/)·[Ollama](/develop-wiki/ai/inference-serving/ollama/) 를, GUI 로 MLX 모델을 다루려면 [LM Studio](/develop-wiki/ai/inference-serving/lm-studio/) 를 비교한다.

## 설치
기준: mlx-lm 0.32.2 (2026-10), Python 3.11 이상, Apple Silicon Mac.

```bash
pip install mlx-lm
# 또는
conda install -c conda-forge mlx-lm
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `mlx_lm.generate` / `mlx_lm.chat` | 한 번 생성 / 대화 REPL CLI. `--model` 로 HF 저장소 지정 |
| `load()` / `generate()` / `stream_generate()` | Python API. `load` 가 모델과 토크나이저를 함께 돌려준다 |
| `mlx_lm.convert` | HF 모델을 MLX 형식으로 바꾸고 `-q` 로 양자화, `--upload-repo` 로 업로드 |
| `mlx_lm.server` | OpenAI 채팅 API 와 비슷한 HTTP 서버(기본 `localhost:8080`). 문서가 운영 환경용은 아니라고 명시 |
| `mlx_lm.lora` | LoRA·전체 파인튜닝 (양자화 모델 위 QLoRA 포함) |
| 프롬프트 캐시 | `mlx_lm.cache_prompt` 로 긴 문맥을 미리 계산해 파일로 저장·재사용 |
| 회전 KV 캐시 | `--max-kv-size n` 으로 KV 캐시 크기를 고정해 메모리를 아낀다 |

## 기본 사용법
1) CLI 로 바로 생성

```bash
mlx_lm.generate --model mlx-community/Mistral-7B-Instruct-v0.3-4bit \
  --prompt "MLX 를 한 문장으로 설명해 줘"
```

2) Python 에서 스트리밍 생성

```python
from mlx_lm import load, stream_generate

model, tokenizer = load("mlx-community/Mistral-7B-Instruct-v0.3-4bit")
messages = [{"role": "user", "content": "통합 메모리가 LLM 추론에 왜 유리해?"}]
prompt = tokenizer.apply_chat_template(messages, add_generation_prompt=True)

for chunk in stream_generate(model, tokenizer, prompt, max_tokens=256):
    print(chunk.text, end="", flush=True)
print()
```

3) 로컬 HTTP 서버

```bash
mlx_lm.server --model mlx-community/Mistral-7B-Instruct-v0.3-4bit
curl localhost:8080/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "안녕"}], "max_tokens": 64}'
```

## 자주 쓰는 패턴
- **양자화 변환**: `mlx_lm.convert --model <hf-repo> -q` 로 4bit 모델을 만든다. 업로드까지 하려면 `--upload-repo <user>/<name>`.
- **긴 문맥 재사용**: 같은 문서에 여러 질문을 던질 때 `mlx_lm.cache_prompt --prompt-cache-file doc.safetensors` 로 캐시를 만들고 `mlx_lm.generate --prompt-cache-file` 로 재사용한다.
- **메모리 절약**: 서버에서 `--kv-bits 4` 로 KV 캐시를 양자화한다. 이때 배칭은 꺼지고 요청을 하나씩 처리한다.
- **큰 모델**: 메모리 대비 큰 모델은 macOS 15 이상에서 가중치를 고정(wired)해 속도를 확보한다. 경고가 뜨면 더 작은 양자화를 고른다.
- **로컬 파인튜닝**: 작은 데이터셋으로 `mlx_lm.lora` 를 돌려 어댑터를 만들고, 필요하면 원 모델에 합쳐 배포한다.

## 언제 쓰나 / 피할 때
- 쓸 때: M 시리즈 Mac 에서 오픈 웨이트 모델을 로컬로 돌리거나 가볍게 LoRA 실험을 할 때, Python 코드에서 직접 생성 루프를 다루고 싶을 때.
- 피할 때(대안): Linux·NVIDIA GPU 서버라면 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[SGLang](/develop-wiki/ai/inference-serving/sglang/). 여러 사용자에게 노출하는 운영 서버로는 쓰지 않는다(문서가 기본 보안 검사만 한다고 밝힘).

## 공식 문서
- [README](https://github.com/ml-explore/mlx-lm/blob/main/README.md) · [HTTP 서버](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md) · [LoRA 파인튜닝](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md)
- [MLX 문서](https://ml-explore.github.io/mlx/) · [mlx-community 모델](https://huggingface.co/mlx-community)

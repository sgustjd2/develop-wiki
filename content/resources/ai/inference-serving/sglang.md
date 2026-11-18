---
name: SGLang
url: https://www.sglang.io
docs: https://docs.sglang.io/
repo: https://github.com/sgl-project/sglang
domain: ai
category: inference-serving
description: RadixAttention 기반 프리픽스 캐시로 에이전트·대규모 서빙에 맞춘 LLM·VLM 서빙 엔진. OpenAI 호환 서버를 제공한다.
pricing: oss
tags: [serving, gpu, openai-compatible, rl-rollout]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SGLang 은 LMSYS 가 호스팅하는 오픈소스 추론 프레임워크로, LLM·VLM·확산(이미지·영상) 모델을 서빙한다. 공통 프롬프트 앞부분의 KV 캐시를 트리(radix tree)로 관리해 재사용하는 RadixAttention 이 출발점이라, 같은 시스템 프롬프트·도구 정의를 반복해서 보내는 에이전트 워크로드와 RL 롤아웃 생성에 강하다.
`sglang serve` 한 줄로 OpenAI 호환 서버(기본 포트 30000)를 띄우며, NVIDIA·AMD GPU 외에 TPU, Intel, Ascend NPU, Apple Silicon 까지 지원 범위를 넓히고 있다.
같은 자리의 대안은 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 이고, NVIDIA 전용 최적화를 극단까지 원하면 [TensorRT-LLM](/develop-wiki/ai/inference-serving/tensorrt-llm/) 을 비교한다.

## 설치
기준: v0.5.23 (2026-11). Linux + NVIDIA GPU(CUDA 13 호환 드라이버) 환경의 빠른 시작 문서 기준이다.

```bash
uv venv --python 3.12
source .venv/bin/activate
uv pip install --prerelease=allow sglang
```

Docker:

```bash
docker run --rm --gpus all --ipc=host -p 30000:30000 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  lmsysorg/sglang:latest \
  sglang serve Qwen/Qwen3-0.6B --host 0.0.0.0 --port 30000
```

모델·하드웨어별 실행 플래그는 [Cookbook](https://cookbook.sglang.io/) 에서 골라 쓰는 방식을 권장한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `sglang serve MODEL` | 서버 실행 CLI. 모델은 위치 인자(HF id 또는 경로). 서버 인자 문서는 `python -m sglang.launch_server` 형태로도 설명한다 |
| RadixAttention | 요청 간 공통 프리픽스 KV 캐시 자동 재사용. 끄려면 `--disable-radix-cache` |
| 텐서·데이터 병렬 | `--tp-size`(`--tp`), `--dp-size`(`--dp`) |
| `--mem-fraction-static` | 가중치+KV 캐시에 쓸 GPU 메모리 비율. OOM 이면 낮춘다 |
| 파서 | `--tool-call-parser`, `--reasoning-parser` 로 모델별 도구 호출·사고 출력 형식을 OpenAI 형식으로 변환(`auto` 가능) |
| 추측 디코딩 | `--speculative-algorithm`(EAGLE, EAGLE3, NEXTN, NGRAM 등) + 드래프트 모델 |
| `sgl.Engine` | 서버 없이 파이썬에서 바로 배치 생성하는 오프라인 엔진 |

## 기본 사용법
1) 서버 띄우기

```bash
sglang serve Qwen/Qwen3-0.6B --port 30000 --context-length 8192
```

로그에 "The server is fired up and ready to roll!" 이 나오면 준비 완료다.

2) OpenAI SDK 로 호출

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key=os.environ.get("SGLANG_API_KEY", "EMPTY"),
)
resp = client.chat.completions.create(
    model="Qwen/Qwen3-0.6B",
    messages=[{"role": "user", "content": "RadixAttention 을 한 문장으로"}],
)
print(resp.choices[0].message.content)
```

3) 오프라인 엔진

```python
import sglang as sgl

llm = sgl.Engine(model_path="Qwen/Qwen3-0.6B")
outputs = llm.generate(["서울의 랜드마크 세 곳:"], {"temperature": 0.7, "max_new_tokens": 64})
print(outputs[0]["text"])
llm.shutdown()
```

## 자주 쓰는 패턴
- **인증**: `--api-key` 로 키 검사를 건다. 기본 바인딩은 `127.0.0.1` 이므로 외부 공개 시 `--host 0.0.0.0` 과 함께 쓴다.
- **멀티 GPU**: `--tp 4` 로 한 모델을 4장에 나누고, 처리량을 더 늘리려면 `--dp` 로 복제본을 둔다. 대형 MoE 는 전문가 병렬·PD 분리(prefill/decode disaggregation) 문서를 따른다.
- **에이전트 서빙**: 도구 정의·시스템 프롬프트를 요청마다 앞에 고정해 두면 RadixAttention 캐시 적중이 올라간다. 모델별로 `--tool-call-parser` 와 `--reasoning-parser` 를 맞춘다.
- **모니터링**: `--enable-metrics` 로 Prometheus 메트릭을 연다.
- **RL 학습 연동**: verl, slime, AReaL 같은 RL 프레임워크가 롤아웃 생성 엔진으로 SGLang 을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 프리픽스가 많이 겹치는 에이전트·멀티턴 트래픽, 대형 MoE([DeepSeek V4 Flash](/develop-wiki/models/deepseek/deepseek-v4-flash-0731/), [GLM-5.3](/develop-wiki/models/zai/glm-5.3/) 등)를 여러 GPU·노드에 서빙할 때, RL 롤아웃 생성.
- 피할 때(대안): 단일 PC 에서 가볍게 쓰려면 [Ollama](/develop-wiki/ai/inference-serving/ollama/)·[llama.cpp](/develop-wiki/ai/inference-serving/llama-cpp/). 팀이 이미 vLLM 운영 경험이 있고 기능 차이가 없다면 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 을 유지하는 편이 단순하다.

## 공식 문서
- [Quickstart](https://docs.sglang.io/docs/get-started/quickstart) · [서버 인자](https://docs.sglang.io/docs/advanced_features/server_arguments) · [오프라인 엔진 API](https://docs.sglang.io/docs/basic_usage/offline_engine_api)
- [Cookbook](https://cookbook.sglang.io/) · [릴리스 노트](https://github.com/sgl-project/sglang/releases)

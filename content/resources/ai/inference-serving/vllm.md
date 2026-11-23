---
name: vLLM
url: https://docs.vllm.ai
repo: https://github.com/vllm-project/vllm
stars: 97414
domain: ai
category: inference-serving
description: PagedAttention 기반의 고처리량 LLM 서빙 엔진. OpenAI 호환 API 서버를 제공한다.
pricing: oss
tags: [serving, gpu]
languages: [python]
docs: https://docs.vllm.ai/en/latest/
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
vLLM 은 GPU 에서 LLM 을 높은 처리량으로 서빙하기 위한 추론 엔진이다. KV 캐시를 페이지 단위로 나눠 관리하는 PagedAttention 과 연속 배칭(continuous batching)으로 동시 요청이 많을 때 GPU 메모리를 효율적으로 쓴다.
`vllm serve` 한 줄로 OpenAI 호환 HTTP 서버를 띄울 수 있어, 기존 OpenAI SDK 코드를 그대로 자체 호스팅 모델에 붙일 수 있다.
로컬 PC 에서 한 사람이 가볍게 돌리는 용도라면 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 가, 다중 사용자 GPU 서버라면 vLLM 이 맞는 위치다.

## 설치
Linux + Python 3.11~3.14 기준(v0.34 문서). CUDA 환경에서는 `uv` 를 권장한다.

```bash
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install vllm --torch-backend=auto
vllm download-kernels          # 미리 빌드된 커널을 받아 첫 기동 시간을 줄인다
```

Docker 로 띄우기:

```bash
docker run --runtime nvidia --gpus all \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  --env "HF_TOKEN=$HF_TOKEN" -p 8000:8000 --ipc=host \
  vllm/vllm-openai:latest --model Qwen/Qwen3-0.6B
```

AMD ROCm, Intel XPU, TPU(`vllm-tpu` 패키지), Apple Silicon(vLLM-Metal) 은 설치 문서의 별도 절차를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `vllm serve` | 모델을 올리고 OpenAI 호환 서버를 띄우는 CLI. 기본 포트 8000 |
| `LLM` / `SamplingParams` | 서버 없이 파이썬에서 바로 배치 추론하는 오프라인 API |
| PagedAttention | KV 캐시를 블록 단위로 할당해 메모리 단편화를 줄이는 방식 |
| 연속 배칭 | 요청이 끝나는 즉시 새 요청을 배치에 끼워 넣어 GPU 를 쉬지 않게 함 |
| 텐서·파이프라인 병렬 | `--tensor-parallel-size`, `--pipeline-parallel-size` 로 여러 GPU 에 모델을 나눔 |
| 프리픽스 캐싱 | 공통 프롬프트 앞부분의 KV 캐시를 재사용 (v0.34 에서 기본 켜짐, 끄려면 `--no-enable-prefix-caching`) |
| 도구 호출 파서 | 모델별 출력 형식을 OpenAI `tool_calls` 로 바꿔 주는 파서 (`--tool-call-parser`) |

## 기본 사용법
1) 서버 띄우기

```bash
vllm serve Qwen/Qwen3-0.6B --port 8000 --max-model-len 8192
```

2) OpenAI SDK 로 호출하기 — `base_url` 만 바꾼다. 서버를 `--api-key` 없이 띄웠다면 키 값은 아무 문자열이나 된다.

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key=os.environ.get("VLLM_API_KEY", "EMPTY"),
)
resp = client.chat.completions.create(
    model="Qwen/Qwen3-0.6B",
    messages=[{"role": "user", "content": "PagedAttention 을 한 문장으로 설명해 줘"}],
)
print(resp.choices[0].message.content)
```

3) 서버 없이 오프라인 배치 추론

```python
from vllm import LLM, SamplingParams

llm = LLM(model="Qwen/Qwen3-0.6B")
params = SamplingParams(temperature=0.7, max_tokens=128)
outputs = llm.chat([[{"role": "user", "content": "안녕?"}]], params)
print(outputs[0].outputs[0].text)
```

`llm.generate()` 는 채팅 템플릿을 적용하지 않으므로 instruct 모델에는 `llm.chat()` 을 쓴다.

## 자주 쓰는 패턴
- **인증**: `--api-key` 또는 `VLLM_API_KEY` 환경 변수로 `/v1` 경로에 키 검사를 건다. `/v1` 밖의 엔드포인트는 보호되지 않으므로 앞단 프록시로 막는다.
- **멀티 GPU**: GPU 4장에 한 모델을 나누려면 `--tensor-parallel-size 4`. 노드를 넘으면 파이프라인 병렬을 함께 쓴다.
- **메모리 조절**: `--max-model-len` 으로 최대 컨텍스트를 줄이고 `--gpu-memory-utilization` 으로 vLLM 이 잡을 GPU 메모리 비율을 정한다.
- **도구 호출**: 에이전트 프레임워크와 붙일 때 필수.

  ```bash
  vllm serve meta-llama/Llama-3.1-8B-Instruct \
    --enable-auto-tool-choice --tool-call-parser llama3_json
  ```
  (Llama 3.1 은 문서가 권장하는 `--chat-template` 도 함께 지정한다. 모델: [Llama 3.1 8B Instruct](/develop-wiki/models/meta/llama-3.1-8b-instruct/))
- **구조화 출력**: `response_format={"type": "json_schema", ...}` 또는 `extra_body={"structured_outputs": {"choice": [...]}}` 로 출력 형식을 강제한다.
- **설정 파일**: 플래그가 길어지면 YAML 로 옮기고 `vllm serve --config config.yaml`.
- **이름 바꾸기**: `--served-model-name` 으로 클라이언트가 쓸 모델 이름을 HF 저장소명과 다르게 줄 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 사용자·서비스가 동시에 호출하는 사내 LLM API, GPU 서버에서 오픈 웨이트 모델([Qwen3-30B-A3B](/develop-wiki/models/qwen/qwen3-30b-a3b/), [gpt-oss-20b](/develop-wiki/models/openai/gpt-oss-20b/) 등)을 OpenAI 호환으로 제공할 때, 대량 오프라인 배치 생성.
- 피할 때(대안): 노트북·데스크톱에서 혼자 써 보는 정도라면 설치가 간단한 [Ollama](/develop-wiki/ai/inference-serving/ollama/). GPU 가 없고 CPU 만 있다면 GGUF 기반 도구가 더 현실적이다.

## 공식 문서
- [Quickstart](https://docs.vllm.ai/en/latest/getting_started/quickstart.html) · [`vllm serve` CLI 레퍼런스](https://docs.vllm.ai/en/latest/cli/serve/) · [온라인 서빙 / OpenAI 호환 서버](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/)
- [도구 호출](https://docs.vllm.ai/en/latest/features/tool_calling/) · [병렬화·스케일링](https://docs.vllm.ai/en/latest/serving/parallelism_scaling/) · [Docker 배포](https://docs.vllm.ai/en/latest/deployment/docker/)

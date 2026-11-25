---
name: TensorRT LLM
url: https://nvidia.github.io/TensorRT-LLM/
docs: https://nvidia.github.io/TensorRT-LLM/
repo: https://github.com/NVIDIA/TensorRT-LLM
stars: 15134
domain: ai
category: inference-serving
description: NVIDIA GPU 전용 최적화 커널과 PyTorch 기반 런타임으로 LLM 을 서빙하는 NVIDIA 의 추론 라이브러리. trtllm-serve 로 OpenAI 호환 서버를 띄운다.
pricing: oss
tags: [serving, gpu, nvidia, quantization]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
TensorRT LLM 은 NVIDIA 가 만든 LLM 추론 라이브러리로, NVIDIA GPU 에 맞춘 전용 커널(어텐션, FP8·FP4 양자화 GEMM 등)과 PyTorch 기반 런타임을 묶었다. 고수준 Python `LLM` API 로 단일 GPU 부터 다중 노드까지 같은 코드로 다루고, `trtllm-serve` 로 OpenAI 호환 서버를 띄운다.
NVIDIA Dynamo, Triton Inference Server 의 백엔드로도 쓰인다. 라이선스는 Apache-2.0 이다.
범용성과 설치 편의는 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[SGLang](/develop-wiki/ai/inference-serving/sglang/) 이 낫고, TensorRT LLM 은 NVIDIA 최신 GPU(Blackwell 등)에서 성능을 끝까지 뽑아야 할 때 고른다.

## 설치
버전 상황(2026-11-18): PyPI 최신 안정판은 **1.2.1**(2026-04), 이후 1.3·1.4 계열은 `rc` 프리릴리스로만 나오고 있다. 문서는 Ubuntu 24.04, Python 3.12, CUDA 13.1, PyTorch 2.10 기준이다.

```bash
pip3 install torch==2.10.0 torchvision --index-url https://download.pytorch.org/whl/cu130
sudo apt-get -y install libopenmpi-dev
pip3 install --ignore-installed pip setuptools wheel && pip3 install tensorrt_llm
```

의존성 충돌이 잦으므로 NGC 의 TensorRT LLM 릴리스 컨테이너(태그는 NGC 카탈로그에서 확인)로 시작하는 편이 안전하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `LLM` API | `LLM(model=...)` + `SamplingParams` 로 생성. HF 모델 id 를 바로 받는다 |
| PyTorch 백엔드 | 1.x 부터 기본 아키텍처. 모델 정의를 PyTorch 코드로 수정·확장할 수 있다 |
| `trtllm-serve` | OpenAI 호환 HTTP 서버 CLI (문서 예시 포트 8000) |
| `trtllm-bench` / `trtllm-eval` | 처리량 벤치마크·정확도 평가 CLI |
| 양자화 | FP8, NVFP4, INT4 AWQ 등. 사전 양자화 체크포인트(NVIDIA Model Optimizer)를 그대로 로드 |
| 병렬화 | 텐서·파이프라인·전문가 병렬, 프리필/디코드 분리 서빙 |
| 텔레메트리 | 기본 수집. `--no-telemetry` 또는 `TelemetryConfig(disabled=True)` 로 끈다 |

## 기본 사용법
1) 서버 띄우고 호출

```bash
trtllm-serve "Qwen/Qwen3-0.6B" --no-telemetry
```

```python
import os
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1",
                api_key=os.environ.get("TRTLLM_API_KEY", "EMPTY"))
resp = client.chat.completions.create(
    model="Qwen/Qwen3-0.6B",
    messages=[{"role": "user", "content": "FP8 추론의 장점은?"}],
)
print(resp.choices[0].message.content)
```

2) Python LLM API 로 오프라인 생성

```python
from tensorrt_llm import LLM, SamplingParams

llm = LLM(model="Qwen/Qwen3-0.6B")
params = SamplingParams(temperature=0.8, top_p=0.95)
for out in llm.generate(["GPU 커널 퓨전이란"], params):
    print(out.outputs[0].text)
```

## 자주 쓰는 패턴
- **컨테이너 우선**: CUDA·PyTorch·MPI 버전 조합이 까다로워 NGC 컨테이너 안에서 실행하거나, 이미 쓰는 PyTorch 를 constraints 파일로 고정한 채 설치한다.
- **사전 양자화 모델 사용**: Model Optimizer 로 만든 FP8/NVFP4 체크포인트를 HF 에서 받아 그대로 `LLM(model=...)` 에 넣는다.
- **성능 측정**: 도입 전 `trtllm-bench` 로 같은 모델을 vLLM·SGLang 과 비교한다. 이득은 GPU 세대와 모델에 따라 크게 달라진다.
- **Dynamo/Triton 연동**: 대규모 배포에서는 직접 서버를 띄우기보다 NVIDIA Dynamo 나 Triton 의 백엔드로 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: NVIDIA 데이터센터 GPU 를 쓰고 처리량·지연을 최대로 끌어올려야 할 때, FP8·FP4 양자화를 하드웨어 수준에서 활용할 때, NVIDIA 스택(Dynamo, Triton, NIM)으로 배포할 때.
- 피할 때(대안): AMD·Apple·CPU 환경, 빠른 신규 모델 지원과 설치 편의가 중요할 때는 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[SGLang](/develop-wiki/ai/inference-serving/sglang/). 안정판 주기가 길어(1.2.1 이후 rc 만 배포) 최신 기능은 프리릴리스를 써야 하는 점도 고려한다.

## 공식 문서
- [Quick Start](https://nvidia.github.io/TensorRT-LLM/quick-start-guide.html) · [Linux 설치](https://nvidia.github.io/TensorRT-LLM/installation/linux.html) · [아키텍처 개요](https://nvidia.github.io/TensorRT-LLM/developer-guide/overview.html)
- [릴리스](https://github.com/NVIDIA/TensorRT-LLM/releases)

---
name: LLaMA-Factory
url: https://llamafactory.readthedocs.io
docs: https://llamafactory.readthedocs.io/en/latest/
repo: https://github.com/hiyouga/LlamaFactory
stars: 76279
domain: ai
category: fine-tuning
description: 다수의 오픈 웨이트 LLM·VLM 을 YAML 설정이나 Gradio 웹 UI(LLaMA Board)로 SFT·DPO·KTO·PPO 학습하는 통합 파인튜닝 프레임워크.
pricing: oss
tags: [lora, qlora, webui, yaml, sft, dpo]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-25
---

## 개요
LLaMA-Factory(저장소명 LlamaFactory)는 Qwen·Llama·Gemma·GLM·DeepSeek 등 수백 개의 오픈 웨이트 텍스트·멀티모달 모델을 같은 방식으로 학습·추론·병합·내보내기 하도록 묶은 프레임워크다. 학습 단계(`pt`, `sft`, `rm`, `ppo`, `dpo`, `kto`)와 방식(`lora`, `oft`, `freeze`, `full`)을 YAML 키로 고르고, `llamafactory-cli` 한 명령으로 실행한다. 코드 없이 브라우저에서 설정·학습·채팅을 할 수 있는 웹 UI(LLaMA Board)가 특징이다.
**v0.9.5 기준**(PyPI 마지막 릴리스 2026-05). 정식 릴리스 간격은 길지만 main 브랜치는 2026-11 에도 Transformers 5.x·vLLM 대응과 차세대 `v1` 학습 엔진 작업이 계속되고 있어, 최신 모델 지원은 소스 설치로 받는 편이 낫다. 라이선스는 Apache-2.0.

## 설치
소스 설치가 공식 권장 방식이다.
```bash
git clone --depth 1 https://github.com/hiyouga/LlamaFactory.git
cd LlamaFactory
pip install -e .
pip install -r requirements/metrics.txt     # 평가 지표 (선택)
```
Docker: `docker run -it --rm --gpus=all --ipc=host hiyouga/llamafactory:latest`. Python 3.11 이상, Windows 는 CUDA 빌드 PyTorch 를 먼저 설치한다. QLoRA 에는 `bitsandbytes` 가 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `stage` | 학습 단계: `pt`(사전학습 지속), `sft`, `rm`(보상 모델), `ppo`, `dpo`, `kto` |
| `finetuning_type` | `lora`, `oft`, `freeze`(일부 층만), `full` |
| `template` | 모델별 채팅 템플릿 이름(예: `qwen3_nothink`). 학습·추론에서 같은 값을 써야 함 |
| `dataset_info.json` | 데이터셋 등록부. alpaca·sharegpt 형식과 열 매핑을 정의 |
| `quantization_bit` | 4 또는 8 로 지정하면 QLoRA |
| `llamafactory-cli` | `train`, `chat`, `export`, `webui`, `api` 하위 명령 |
| LLaMA Board | Gradio 기반 웹 UI. 설정을 고르면 동일한 CLI 인자를 생성 |

## 기본 사용법
`qwen3_lora_sft.yaml` — 내장 데모 데이터로 LoRA SFT:

```yaml
model_name_or_path: Qwen/Qwen3-4B-Instruct-2507
stage: sft
do_train: true
finetuning_type: lora
lora_rank: 8
lora_target: all
dataset: identity,alpaca_en_demo
template: qwen3_nothink
cutoff_len: 2048
output_dir: saves/qwen3-4b/lora/sft
per_device_train_batch_size: 1
gradient_accumulation_steps: 8
learning_rate: 1.0e-4
num_train_epochs: 3.0
bf16: true
```

```bash
llamafactory-cli train qwen3_lora_sft.yaml
llamafactory-cli chat  examples/inference/qwen3_lora_sft.yaml   # 어댑터로 대화 테스트
llamafactory-cli export examples/merge_lora/qwen3_lora_sft.yaml # 병합 모델 저장
llamafactory-cli webui                                           # 웹 UI
```

## 자주 쓰는 패턴
- **커스텀 데이터**: JSON/JSONL 을 `data/` 에 두고 `dataset_info.json` 에 이름·형식·열 매핑을 등록한 뒤 `dataset: <이름>` 으로 쓴다.
- **QLoRA**: `quantization_bit: 4` 를 추가한다. 병합(`export`) 때는 양자화 모델을 쓰지 말고 원본 베이스로 병합한다.
- **DPO**: `stage: dpo` 와 `ranking: true` 로 등록한 선호 데이터셋을 지정한다.
- **OpenAI 호환 API**: `llamafactory-cli api <추론 설정> infer_backend=vllm` 로 학습 결과를 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 백엔드로 서빙한다.
- **분산 학습**: `FORCE_TORCHRUN=1 llamafactory-cli train ...` 과 DeepSpeed 설정으로 다중 GPU 학습한다(`examples/README.md` 참고).

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 모델을 같은 데이터로 비교 학습할 때, 코드 작성 없이 웹 UI 로 파인튜닝을 시작하고 싶을 때, Ascend NPU·AMD ROCm 환경.
- 피할 때(대안): 릴리스 주기가 느려 패키지 버전 고정이 중요한 운영 환경이면 [Axolotl](/develop-wiki/ai/fine-tuning/axolotl/). 학습 루프를 Python 으로 직접 다루려면 [TRL](/develop-wiki/ai/fine-tuning/trl/), 단일 GPU 속도 최적화는 [Unsloth](/develop-wiki/ai/fine-tuning/unsloth/).

## 공식 문서
- [문서(WIP)](https://llamafactory.readthedocs.io/en/latest/) · [예제 모음](https://github.com/hiyouga/LlamaFactory/blob/main/examples/README.md) · [데이터 형식](https://github.com/hiyouga/LlamaFactory/blob/main/data/README.md)
- [릴리스](https://github.com/hiyouga/LlamaFactory/releases)

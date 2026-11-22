---
name: Axolotl
url: https://axolotl.ai
docs: https://docs.axolotl.ai
repo: https://github.com/axolotl-ai-cloud/axolotl
stars: 12744
domain: ai
category: fine-tuning
description: YAML 설정 하나로 LLM 의 전체·LoRA·QLoRA 파인튜닝, DPO·GRPO, 다중 GPU·멀티노드 학습을 실행하는 오픈소스 학습 프레임워크.
pricing: oss
tags: [yaml, lora, qlora, fsdp, deepspeed, post-training]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Axolotl 은 데이터 전처리·학습·평가·병합·양자화를 하나의 YAML 설정 파일로 묶어 실행하는 LLM 후처리 학습 프레임워크다. 내부적으로 [Transformers](/develop-wiki/ai/fine-tuning/transformers/)·[PEFT](/develop-wiki/ai/fine-tuning/peft/)·[TRL](/develop-wiki/ai/fine-tuning/trl/) 위에서 동작하며, 샘플 패킹, Flash Attention, Liger 커널, FSDP2·DeepSpeed, 시퀀스·텐서·전문가(MoE) 병렬화 같은 최적화를 설정 키로 켜고 끈다.
**v0.21 기준**(2026-10 릴리스). 설정만 바꿔 여러 모델·기법을 재현성 있게 실험하거나 다중 GPU·멀티노드로 확장할 때 강하다. NVIDIA(Ampere 이상 권장) 또는 AMD GPU, Python 3.12+ 가 필요하다.

## 설치
uv 권장 방식(CUDA 버전에 맞춰 `UV_TORCH_BACKEND` 조정):
```bash
export UV_TORCH_BACKEND=cu130
uv venv --python 3.12 && source .venv/bin/activate
uv pip install torch==2.14.0 torchvision
uv pip install "axolotl[deepspeed]"
axolotl fetch examples          # 예제 설정 내려받기
```
Docker: `docker run --gpus '"all"' --ipc=host --rm -it axolotlai/axolotl:main-latest`

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 설정 YAML | `base_model`, `datasets`, `adapter`, 하이퍼파라미터, 최적화 옵션을 한 파일에 기술 |
| `datasets[].type` | 데이터 형식 지정. `alpaca`, `chat_template` 등 |
| `adapter` | `lora` / `qlora` / 비우면 전체 파인튜닝 |
| `rl` | `dpo`, `kto`, `orpo`, `grpo` 등 선호·강화학습 모드 |
| `sample_packing` | 짧은 샘플을 한 시퀀스에 채워 패딩 낭비 감소 |
| CLI | `preprocess`, `train`, `evaluate`, `inference`, `merge-lora`, `quantize` 등 |
| `agent-docs` | 코딩 에이전트용 내장 문서(`axolotl agent-docs sft`) |

## 기본 사용법
`lora.yml` — 1B 모델 LoRA SFT 최소 설정:

```yaml
base_model: NousResearch/Llama-3.2-1B
datasets:
  - path: teknium/GPT4-LLM-Cleaned
    type: alpaca
val_set_size: 0.05
output_dir: ./outputs/lora-out

adapter: lora
lora_r: 16
lora_alpha: 32
lora_dropout: 0.05
lora_target_linear: true

sequence_len: 2048
sample_packing: true
micro_batch_size: 2
gradient_accumulation_steps: 4
num_epochs: 1
learning_rate: 0.0002
optimizer: adamw_8bit
bf16: auto
```

```bash
axolotl preprocess lora.yml     # 토크나이즈 결과를 미리 캐시 (선택)
axolotl train lora.yml
axolotl inference lora.yml --lora-model-dir ./outputs/lora-out
axolotl merge-lora lora.yml     # 어댑터를 베이스에 병합
```

## 자주 쓰는 패턴
- **QLoRA**: `adapter: qlora` 와 `load_in_4bit: true` 로 바꿔 메모리를 줄인다.
- **채팅 데이터**: `type: chat_template` 으로 `messages` 형식 데이터를 모델의 채팅 템플릿에 맞춰 학습한다.
- **다중 GPU**: 같은 설정에 `fsdp_config` 또는 `deepspeed: deepspeed_configs/zero2.json` 를 추가하고 `axolotl train` 을 그대로 실행한다.
- **설정 검증**: `axolotl config-schema --field adapter` 로 허용 값을 확인하고, 학습 전 `preprocess` 로 데이터 오류를 먼저 잡는다.
- **클라우드 GPU**: 공식 Docker 이미지와 RunPod·Modal 등 템플릿으로 바로 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 코드 없이 설정 파일로 실험을 관리하고 싶을 때, 멀티 GPU·멀티노드·MoE 모델 학습, 최신 오픈 웨이트 모델을 빠르게 지원받아야 할 때.
- 피할 때(대안): 단일 GPU 에서 최대 속도·최소 VRAM 이 우선이면 [Unsloth](/develop-wiki/ai/fine-tuning/unsloth/). 학습 루프를 Python 으로 직접 커스터마이즈하려면 [TRL](/develop-wiki/ai/fine-tuning/trl/). 웹 UI 로 다루고 싶으면 [LLaMA-Factory](/develop-wiki/ai/fine-tuning/llama-factory/).

## 공식 문서
- [시작하기](https://docs.axolotl.ai/docs/getting-started.html) · [설정 레퍼런스](https://docs.axolotl.ai/docs/config-reference.html) · [데이터셋 형식](https://docs.axolotl.ai/docs/dataset-formats/)
- [다중 GPU](https://docs.axolotl.ai/docs/multi-gpu.html) · [릴리스](https://github.com/axolotl-ai-cloud/axolotl/releases)

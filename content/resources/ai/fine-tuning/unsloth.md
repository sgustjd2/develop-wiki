---
name: Unsloth
url: https://unsloth.ai
docs: https://unsloth.ai/docs
repo: https://github.com/unslothai/unsloth
stars: 80300
domain: ai
category: fine-tuning
description: 커스텀 커널로 LLM 의 LoRA·QLoRA·전체 파인튜닝과 GRPO 를 적은 VRAM 으로 빠르게 돌리는 학습 라이브러리. 단일 GPU 파인튜닝에 주로 쓴다.
pricing: oss
tags: [lora, qlora, grpo, gguf, fine-tuning]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-26
---

## 개요
Unsloth 는 Triton 으로 다시 쓴 커널과 메모리 최적화(자체 그래디언트 체크포인팅 등)로 LLM 파인튜닝의 속도와 VRAM 사용량을 줄이는 학습 도구다. 모델 로딩·어댑터 부착은 Unsloth API 로 하고, 학습 루프는 [TRL](/develop-wiki/ai/fine-tuning/trl/) 트레이너를 그대로 쓰는 구조라 TRL 사용법이 거의 그대로 통한다. 텍스트 LLM 외에 비전·TTS·임베딩 모델 학습과 GGUF 내보내기를 지원한다.
**PyPI `unsloth` 2026.11.6 기준**(날짜형 버전, GitHub 태그는 `v0.1.x-beta`). 코드 기반 라이브러리(Unsloth Core) 외에 로컬 실행·학습 웹 UI 인 Unsloth Studio 도 같은 저장소에서 배포된다. 라이선스는 Core 가 Apache-2.0, Studio UI 등 일부 선택 구성요소가 AGPL-3.0 이다.

## 설치
Unsloth Core(Python 라이브러리), Linux·WSL:
```bash
uv venv unsloth_env --python 3.13
source unsloth_env/bin/activate
uv pip install unsloth --torch-backend=auto
```
Windows 는 `uv pip install torchao` 를 먼저 설치한 뒤 같은 명령을 쓴다. AMD·Intel GPU, Blackwell 은 공식 문서의 별도 가이드를 따른다. Docker 이미지는 `unsloth/unsloth`(노트북 전용은 `:core` 태그).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `FastLanguageModel` | 텍스트 LLM 로더. `from_pretrained` 로 4/8/16비트·전체 파인튜닝 모드를 고름 |
| `FastVisionModel` | 비전·멀티모달 모델용 로더 |
| `get_peft_model` | LoRA 어댑터 부착. `use_gradient_checkpointing="unsloth"` 가 기본 |
| 사전 양자화 체크포인트 | Hub 의 `unsloth/*-bnb-4bit` 등. 다운로드·로딩이 빠름 |
| 학습 방법 플래그 | `load_in_4bit`(QLoRA), `load_in_8bit`, `load_in_16bit`(LoRA), `full_finetuning` 중 하나만 켬 |
| 내보내기 | `save_pretrained_merged`(16비트 병합), `save_pretrained_gguf`(llama.cpp·Ollama 용) |

## 기본 사용법
QLoRA 로 대화형 데이터셋 SFT 후 GGUF 로 저장.

```python
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTConfig, SFTTrainer

model, tokenizer = FastLanguageModel.from_pretrained(
    "unsloth/Qwen3-4B", max_seq_length=2048, load_in_4bit=True)
model = FastLanguageModel.get_peft_model(
    model, r=16, lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"])

dataset = load_dataset("trl-lib/Capybara", split="train")
trainer = SFTTrainer(model=model, processing_class=tokenizer, train_dataset=dataset,
                     args=SFTConfig(output_dir="out", per_device_train_batch_size=2,
                                    gradient_accumulation_steps=4, learning_rate=2e-4,
                                    max_steps=60))
trainer.train()
model.save_pretrained_gguf("qwen3-gguf", tokenizer, quantization_method="q4_k_m")
```

## 자주 쓰는 패턴
- **빠른 검증 후 본 학습**: `max_steps=60` 정도로 손실이 떨어지는지 확인하고, 본 학습은 `num_train_epochs=1~3` 으로 과적합을 피한다(공식 가이드 권장).
- **학습률**: LoRA·QLoRA 는 `2e-4` 에서 시작해 불안정하면 `1e-4`·`5e-5` 로 낮춘다.
- **응답만 학습**: `from unsloth.chat_templates import train_on_responses_only` 로 사용자 턴 손실을 마스킹한다.
- **GRPO 강화학습**: `FastLanguageModel` 로 로드한 모델을 TRL `GRPOTrainer` 에 넘긴다. `from_pretrained(..., fast_inference=True)` 로 vLLM 기반 생성을 켤 수 있다.
- **배포**: `save_pretrained_merged(..., save_method="merged_16bit")` 로 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 용, GGUF 로 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 용 산출물을 만든다.
- **무료 노트북**: 공식 Colab·Kaggle 노트북에서 모델별 레시피를 바로 실행해 볼 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: GPU 1장(소비자용 포함)이나 Colab 에서 7B~30B 급 모델을 LoRA/QLoRA 로 학습할 때, 학습 결과를 GGUF 로 바로 로컬 실행하고 싶을 때.
- 피할 때(대안): 다중 노드·대규모 분산 학습, 세밀한 병렬화 구성이 필요하면 [Axolotl](/develop-wiki/ai/fine-tuning/axolotl/) 이나 [TRL](/develop-wiki/ai/fine-tuning/trl/)+FSDP/DeepSpeed. 아직 지원하지 않는 아키텍처면 순수 [Transformers](/develop-wiki/ai/fine-tuning/transformers/)+[PEFT](/develop-wiki/ai/fine-tuning/peft/) 가 안전하다.

## 공식 문서
- [문서 홈](https://unsloth.ai/docs) · [pip 설치](https://unsloth.ai/docs/get-started/install/pip-install) · [파인튜닝 가이드](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide)
- [강화학습(RL) 가이드](https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide) · [GGUF 저장](https://unsloth.ai/docs/basics/inference-and-deployment/saving-to-gguf) · [Unsloth Studio](https://unsloth.ai/docs/new/studio/)

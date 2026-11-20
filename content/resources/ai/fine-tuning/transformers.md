---
name: Transformers
url: https://huggingface.co/docs/transformers
docs: https://huggingface.co/docs/transformers/training
repo: https://github.com/huggingface/transformers
stars: 169323
domain: ai
category: fine-tuning
description: Hugging Face 의 모델 정의·로딩 라이브러리. Trainer 로 사전학습 모델을 파인튜닝하며 PEFT·TRL·Unsloth 등 학습 도구가 공통으로 기반한다.
pricing: oss
tags: [huggingface, trainer, pytorch, llm, fine-tuning]
languages: [python]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Transformers 는 텍스트·비전·오디오·멀티모달 모델의 정의와 사전학습 가중치 로딩을 표준화한 Python 라이브러리다. `AutoModel*`·`AutoTokenizer` 로 Hugging Face Hub 의 체크포인트를 불러오고, 내장 `Trainer` 로 학습 루프(배치 구성, 혼합 정밀도, 그래디언트 누적, 체크포인트, 분산 학습)를 맡긴다.
**v5.23 기준**(2026-11 릴리스). 2026-01 의 v5.0 에서 TensorFlow·JAX 지원을 제거해 PyTorch 전용이 됐고, 이후 매주 마이너 버전을 낸다. Python 3.11+, PyTorch 2.6+ 가 필요하다.
LLM 파인튜닝만 놓고 보면 보통 [TRL](/develop-wiki/ai/fine-tuning/trl/)·[PEFT](/develop-wiki/ai/fine-tuning/peft/) 를 위에 얹어 쓰며, Transformers 자체는 그 기반 계층이다.

## 설치
```bash
pip install "transformers[torch]"
# 또는
uv pip install "transformers[torch]"
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `AutoModelForCausalLM` 등 Auto 클래스 | 체크포인트 config 를 보고 알맞은 모델 클래스를 골라 로드 |
| `AutoTokenizer` / processor | 텍스트를 `input_ids`·`attention_mask` 로 변환. 멀티모달은 `AutoProcessor` |
| `Trainer` | 범용 학습·평가 루프. 서브클래싱·콜백으로 확장 |
| `TrainingArguments` | 배치 크기, 학습률, 정밀도, 평가·저장 주기, 분산 설정을 담는 설정 객체 |
| data collator | 샘플을 배치로 묶는 함수. LM 학습엔 `DataCollatorForLanguageModeling(mlm=False)` |
| `quantization_config` | `BitsAndBytesConfig` 등으로 4/8비트 로딩. v5 에서 `load_in_4bit=` 인자는 제거 |
| Hub 연동 | `from_pretrained` / `push_to_hub` 로 가중치·토크나이저를 내려받고 올림 |

## 기본 사용법
작은 Causal LM 을 텍스트 데이터로 이어서 학습하는 최소 예제.

```python
from datasets import load_dataset
from transformers import (AutoModelForCausalLM, AutoTokenizer, Trainer,
                          TrainingArguments, DataCollatorForLanguageModeling)

name = "Qwen/Qwen3-0.6B"
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, dtype="auto")

ds = load_dataset("text", data_files={"train": "corpus.txt"})["train"]
ds = ds.map(lambda b: tok(b["text"], truncation=True, max_length=512),
            batched=True, remove_columns=["text"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=2,
                         gradient_accumulation_steps=8, learning_rate=2e-5,
                         num_train_epochs=1, bf16=True, logging_steps=10)
trainer = Trainer(model=model, args=args, train_dataset=ds, processing_class=tok,
                  data_collator=DataCollatorForLanguageModeling(tok, mlm=False))
trainer.train()
```

## 자주 쓰는 패턴
- **메모리 절약**: `gradient_checkpointing=True`, `bf16=True`, `gradient_accumulation_steps` 로 작은 GPU 에서 유효 배치를 키운다.
- **평가·최적 체크포인트**: `eval_strategy="epoch"`, `save_strategy="epoch"`, `load_best_model_at_end=True` 를 함께 지정한다.
- **4비트 로딩**: `from_pretrained(..., quantization_config=BitsAndBytesConfig(load_in_4bit=True))` 후 PEFT 어댑터를 붙여 QLoRA 로 학습한다.
- **커스텀 손실**: `Trainer` 를 상속해 `compute_loss` 를 재정의하거나, `TrainerCallback` 으로 로깅·조기 종료를 붙인다.
- **분산 학습**: 같은 스크립트를 `accelerate launch` 또는 `torchrun` 으로 실행하고 FSDP·DeepSpeed 설정은 `TrainingArguments` 에 준다.

## v4 → v5 마이그레이션 요점
- `Trainer(tokenizer=...)` → `processing_class=...`
- `use_auth_token` → `token`, `torch_dtype` 대신 `dtype` 권장
- `TrainingArguments` 의 `warmup_ratio` 는 `warmup_steps` 로 통합(실수 값 허용), `per_gpu_*` 는 `per_device_*`, `no_cuda` 는 `use_cpu`
- TensorFlow/Flax 모델 클래스 제거

## 언제 쓰나 / 피할 때
- 쓸 때: 분류·토큰 분류·임베딩 등 LLM 이외 태스크 파인튜닝, 학습 루프를 세밀하게 제어하고 싶을 때, 다른 학습 라이브러리의 동작을 이해해야 할 때.
- 피할 때(대안): 채팅 SFT·DPO·GRPO 같은 LLM 후처리 학습은 [TRL](/develop-wiki/ai/fine-tuning/trl/) 이 데이터 포맷·채팅 템플릿을 대신 처리해 준다. 단일 GPU 속도·메모리가 중요하면 [Unsloth](/develop-wiki/ai/fine-tuning/unsloth/), 코드 없이 YAML 로 돌리려면 [Axolotl](/develop-wiki/ai/fine-tuning/axolotl/)·[LLaMA-Factory](/develop-wiki/ai/fine-tuning/llama-factory/). 고처리량 추론 서빙은 [vLLM](/develop-wiki/ai/inference-serving/vllm/).

## 공식 문서
- [Fine-tuning 튜토리얼](https://huggingface.co/docs/transformers/training) · [Trainer](https://huggingface.co/docs/transformers/trainer) · [한국어 문서](https://huggingface.co/docs/transformers/ko/index)
- [v5 마이그레이션 가이드](https://github.com/huggingface/transformers/blob/main/MIGRATION_GUIDE_V5.md) · [릴리스](https://github.com/huggingface/transformers/releases)

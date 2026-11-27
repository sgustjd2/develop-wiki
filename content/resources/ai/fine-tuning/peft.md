---
name: PEFT
url: https://huggingface.co/docs/peft
docs: https://huggingface.co/docs/peft/quicktour
repo: https://github.com/huggingface/peft
stars: 21926
domain: ai
category: fine-tuning
description: LoRA·QLoRA 등 파라미터 효율 미세조정 기법을 Transformers 모델에 적용하는 Hugging Face 라이브러리. 작은 어댑터만 학습·저장할 때 쓴다.
pricing: oss
tags: [huggingface, lora, qlora, adapter, fine-tuning]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-26
---

## 개요
PEFT(Parameter-Efficient Fine-Tuning)는 사전학습 모델의 가중치를 얼려 두고 소수의 추가 파라미터(어댑터)만 학습하는 기법들을 모은 라이브러리다. 대표 기법인 LoRA 는 가중치 변화량을 두 개의 저랭크 행렬로 근사해, 수십억 파라미터 모델에서도 학습 대상이 전체의 1% 미만이 된다. 결과물은 수십 MB 수준의 어댑터 파일이라 베이스 모델 하나에 여러 태스크용 어댑터를 바꿔 끼울 수 있다.
**v0.21 기준**. LoRA 외에 DoRA, AdaLoRA, IA³, LoHa/LoKr, OFT/BOFT, VeRA, 프롬프트 튜닝 계열 등 수십 가지 방법을 같은 `get_peft_model` 인터페이스로 제공한다. [TRL](/develop-wiki/ai/fine-tuning/trl/)·[Unsloth](/develop-wiki/ai/fine-tuning/unsloth/)·[Axolotl](/develop-wiki/ai/fine-tuning/axolotl/) 등이 내부에서 PEFT 를 사용한다.

## 설치
```bash
pip install peft
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `LoraConfig` | 랭크 `r`, 스케일 `lora_alpha`, `target_modules`, `task_type` 등 어댑터 설정 |
| `get_peft_model` | 베이스 모델에 어댑터를 삽입한 `PeftModel` 을 반환 |
| `target_modules` | 어댑터를 붙일 레이어 이름 목록. `"all-linear"` 로 출력층 제외 모든 Linear 지정 |
| `PeftModel.from_pretrained` | 저장된 어댑터를 베이스 모델 위에 로드 |
| `merge_and_unload` | 어댑터를 베이스 가중치에 합쳐 일반 Transformers 모델로 변환(추론 지연 제거) |
| 다중 어댑터 | `load_adapter`/`set_adapter` 로 여러 어댑터를 올려두고 전환 |
| QLoRA | 4비트 양자화 베이스 + LoRA. `prepare_model_for_kbit_training` 으로 준비 |

## 기본 사용법
LoRA 어댑터 생성 → 학습 → 저장.

```python
from transformers import AutoModelForCausalLM
from peft import LoraConfig, TaskType, get_peft_model

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen3-0.6B", dtype="auto")
config = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05,
    target_modules="all-linear",
    task_type=TaskType.CAUSAL_LM,
)
model = get_peft_model(model, config)
model.print_trainable_parameters()   # 학습 대상 파라미터 비율 출력

# ... Trainer 또는 TRL SFTTrainer 로 학습 ...
model.save_pretrained("qwen3-lora")  # 어댑터 가중치만 저장
```

추론 시 로드·병합:

```python
from transformers import AutoModelForCausalLM
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained("Qwen/Qwen3-0.6B", dtype="auto")
model = PeftModel.from_pretrained(base, "qwen3-lora")
merged = model.merge_and_unload()     # 일반 모델로 합치기
merged.save_pretrained("qwen3-merged")
```

## 자주 쓰는 패턴
- **QLoRA**: `BitsAndBytesConfig(load_in_4bit=True)` 로 로드 → `prepare_model_for_kbit_training(model)` → `get_peft_model`. 소비자용 GPU 에서 7~8B 모델 학습에 흔히 쓴다.
- **DoRA·rsLoRA**: `LoraConfig(use_dora=True)` 또는 `use_rslora=True` 로 LoRA 변형을 켠다.
- **TRL 과 결합**: `SFTTrainer(..., peft_config=LoraConfig(...))` 로 넘기면 래핑을 트레이너가 처리한다.
- **어댑터만 공유**: `push_to_hub` 로 어댑터만 올리고, 사용자는 `AutoPeftModelForCausalLM.from_pretrained(<어댑터 repo>)` 로 베이스까지 자동 로드한다.
- **서빙**: [vLLM](/develop-wiki/ai/inference-serving/vllm/) 은 병합하지 않은 LoRA 어댑터를 요청별로 붙여 서빙할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: GPU 메모리가 제한된 환경에서 LLM·확산 모델을 태스크·도메인에 맞출 때, 하나의 베이스에 여러 어댑터를 운영할 때.
- 피할 때(대안): 모델 동작을 크게 바꾸는 지속 사전학습이나 충분한 자원이 있을 때는 전체 파인튜닝([Transformers](/develop-wiki/ai/fine-tuning/transformers/) `Trainer`)이 더 낫다. 학습 루프까지 한 번에 원하면 [TRL](/develop-wiki/ai/fine-tuning/trl/)·[Unsloth](/develop-wiki/ai/fine-tuning/unsloth/).

## 공식 문서
- [Quicktour](https://huggingface.co/docs/peft/quicktour) · [LoRA 레퍼런스](https://huggingface.co/docs/peft/package_reference/lora) · [양자화(QLoRA)](https://huggingface.co/docs/peft/developer_guides/quantization)
- [API 레퍼런스](https://huggingface.co/docs/peft/package_reference/peft_model) · [릴리스](https://github.com/huggingface/peft/releases)

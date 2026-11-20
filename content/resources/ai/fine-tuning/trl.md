---
name: TRL
url: https://huggingface.co/docs/trl
docs: https://huggingface.co/docs/trl/index
repo: https://github.com/huggingface/trl
stars: 19780
domain: ai
category: fine-tuning
description: SFT·DPO·GRPO 등 LLM 후처리 학습(post-training) 트레이너를 제공하는 Hugging Face 라이브러리. 채팅 모델 지도학습과 선호·강화학습에 쓴다.
pricing: oss
tags: [huggingface, sft, dpo, grpo, rlhf, post-training]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
TRL(Transformers Reinforcement Learning)은 사전학습된 언어 모델을 지시 따르기·선호 정렬·추론 강화 방향으로 후처리 학습하는 트레이너 모음이다. 각 트레이너는 [Transformers](/develop-wiki/ai/fine-tuning/transformers/) `Trainer` 를 얇게 감싸 DDP·DeepSpeed ZeRO·FSDP 를 그대로 쓰고, 채팅 템플릿 적용·패킹·프롬프트 마스킹 같은 LLM 전용 처리를 대신 해 준다.
**v1.18 기준**(2026-11 릴리스, v1.0 은 2026-03). `model` 인자에 Hub 모델 id 문자열만 넘겨도 트레이너가 모델·토크나이저를 로드한다. [PEFT](/develop-wiki/ai/fine-tuning/peft/) 와 [vLLM](/develop-wiki/ai/inference-serving/vllm/)(온라인 RL 생성 가속)이 통합돼 있다.

## 설치
```bash
pip install trl
pip install "trl[peft]"                 # LoRA 학습
pip install "trl[vllm,kernels,math_verify]"   # 비동기 GRPO + 수학 보상
```
Python 3.11 이상이 필요하다.

## 핵심 개념
| 트레이너 / 개념 | 설명 |
| --- | --- |
| `SFTTrainer` + `SFTConfig` | 지도 미세조정. 언어 모델링·prompt-completion·대화(`messages`) 형식 데이터 지원 |
| `DPOTrainer` | 선호 쌍(`chosen`/`rejected`)으로 정렬. 별도 보상 모델 불필요 |
| `GRPOTrainer` / `AsyncGRPOTrainer` | 보상 함수 기반 온라인 RL. 비동기 버전은 vLLM 서버가 롤아웃을 병렬 생성 |
| `KTOTrainer`, `RLOOTrainer` | 이진 피드백 정렬, REINFORCE 계열 RL |
| `RewardTrainer` | 선호 데이터로 보상 모델 학습 |
| 데이터셋 형식 | 표준(text) 또는 대화형(`messages`), prompt-only / prompt-completion / preference |
| `peft_config` | `LoraConfig` 를 넘기면 어댑터만 학습 |
| `trl` CLI | `trl sft`, `trl dpo`, `trl grpo` 등으로 코드 없이 학습 실행 |

## 기본 사용법
대화형 데이터셋으로 LoRA SFT.

```python
from datasets import load_dataset
from peft import LoraConfig
from trl import SFTConfig, SFTTrainer

dataset = load_dataset("trl-lib/Capybara", split="train")

trainer = SFTTrainer(
    model="Qwen/Qwen3-0.6B",
    train_dataset=dataset,
    args=SFTConfig(output_dir="qwen3-sft", learning_rate=1e-4,
                   assistant_only_loss=True, packing=True),
    peft_config=LoraConfig(r=16, lora_alpha=32, target_modules="all-linear"),
)
trainer.train()
trainer.save_model()
```

보상 함수를 직접 정의한 GRPO:

```python
from datasets import load_dataset
from trl import GRPOConfig, GRPOTrainer

def short_answer(completions, **kwargs):
    # 대화형 데이터: completion 은 메시지 리스트. 짧을수록 높은 보상 (예시용)
    return [-len(c[0]["content"]) / 100 for c in completions]

dataset = load_dataset("trl-lib/DeepMath-103K", split="train")
trainer = GRPOTrainer(model="Qwen/Qwen3-0.6B", reward_funcs=short_answer,
                      args=GRPOConfig(output_dir="qwen3-grpo"), train_dataset=dataset)
trainer.train()
```

CLI 로 같은 작업:

```bash
trl sft --model_name_or_path Qwen/Qwen3-0.6B --dataset_name trl-lib/Capybara \
        --use_peft --output_dir qwen3-sft
```

## 자주 쓰는 패턴
- **응답 토큰만 학습**: 대화형 데이터에 `assistant_only_loss=True`, prompt-completion 데이터는 기본으로 completion 에만 손실을 건다.
- **SFT → DPO 2단계**: SFT 로 형식을 잡은 뒤 선호 데이터로 `DPOTrainer` 를 돌린다.
- **보상 함수 입력 형식**: 표준(텍스트) 데이터면 `completions` 가 문자열 리스트, 대화형이면 메시지 리스트라 `c[0]["content"]` 로 본문을 꺼낸다. 데이터셋의 다른 열(예: `solution`)은 같은 이름의 키워드 인자로 들어온다.
- **추론 모델 RL**: `GRPOTrainer` 에 `trl.rewards` 의 `accuracy_reward` 같은 검증 가능한 보상을 주고, 생성은 vLLM 으로 가속한다.
- **LoRA 학습률**: 어댑터만 학습할 때는 공식 문서대로 전체 파인튜닝보다 높은 학습률(약 `1e-4`)을 쓴다.
- **속도 최적화**: [Unsloth](/develop-wiki/ai/fine-tuning/unsloth/) 가 TRL 트레이너를 그대로 쓰면서 커널을 교체해 메모리·속도를 개선한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 채팅·지시 모델 SFT, DPO·KTO 정렬, GRPO 로 추론 능력 강화, Python 코드로 학습 파이프라인을 직접 구성할 때.
- 피할 때(대안): YAML 설정만으로 여러 모델·기법을 반복 실험하려면 [Axolotl](/develop-wiki/ai/fine-tuning/axolotl/)·[LLaMA-Factory](/develop-wiki/ai/fine-tuning/llama-factory/). 분류·임베딩 등 비생성 태스크는 [Transformers](/develop-wiki/ai/fine-tuning/transformers/) `Trainer` 로 충분하다.

## 공식 문서
- [개요](https://huggingface.co/docs/trl/index) · [Quickstart](https://huggingface.co/docs/trl/quickstart) · [데이터셋 형식](https://huggingface.co/docs/trl/dataset_formats)
- [SFTTrainer](https://huggingface.co/docs/trl/sft_trainer) · [DPOTrainer](https://huggingface.co/docs/trl/dpo_trainer) · [GRPOTrainer](https://huggingface.co/docs/trl/grpo_trainer) · [CLI](https://huggingface.co/docs/trl/clis) · [PEFT 통합](https://huggingface.co/docs/trl/peft_integration)

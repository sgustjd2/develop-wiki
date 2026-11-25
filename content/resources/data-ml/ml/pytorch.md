---
name: PyTorch
url: https://pytorch.org
docs: https://docs.pytorch.org/docs/stable/
repo: https://github.com/pytorch/pytorch
stars: 105729
domain: data-ml
category: ml
description: 텐서 연산과 자동 미분을 제공하는 딥러닝 프레임워크. 연구용 모델 구현부터 LLM 학습·추론까지 GPU 기반 신경망 개발 전반에 쓴다.
pricing: oss
tags: [deep-learning, tensor, autograd, gpu, neural-network]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
PyTorch 는 NumPy 와 비슷한 텐서 API 에 GPU 가속과 자동 미분(autograd)을 더한 딥러닝 프레임워크다. 파이썬 코드가 실행되는 대로 계산 그래프가 만들어지는 eager 방식이라 디버깅이 쉽고, `torch.compile` 로 그래프를 캡처해 커널을 최적화할 수도 있다. Hugging Face [Transformers](/develop-wiki/ai/fine-tuning/transformers/), vLLM 등 대부분의 LLM 도구가 PyTorch 위에 있다. PyTorch Foundation(Linux Foundation 산하)이 관리한다.

**버전(2026-11 기준):** 2.15.0(2026-10-28), Python 3.11 이상. 저장소 LICENSE 는 BSD 스타일(BSD-3-Clause), PyPI 휠은 번들 구성요소 라이선스까지 합친 복합 표기다. 문서 도메인은 `docs.pytorch.org` 로 옮겨졌다.

## 설치
```bash
pip install torch torchvision               # OS·플랫폼에 맞는 기본 빌드
# 특정 CUDA 빌드는 pytorch.org 의 설치 선택기가 주는 --index-url 명령을 쓴다
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `torch.Tensor` | 다차원 배열. `device`(cpu/cuda/mps), `dtype` 보유 |
| autograd | `requires_grad=True` 텐서의 연산을 기록해 `.backward()` 로 기울기 계산 |
| `nn.Module` | 레이어·모델의 기본 클래스. `forward` 를 구현 |
| `torch.optim` | SGD, AdamW 등 옵티마이저 |
| `Dataset` / `DataLoader` | 데이터 접근 / 배치·셔플·병렬 로딩 |
| `torch.compile` | 모델을 그래프로 캡처해 최적화된 커널로 실행 |
| 분산 학습 | DDP, FSDP2, `torchrun` 실행기 |
| 혼합 정밀도 | `torch.autocast` 로 bf16/fp16 연산 |

## 기본 사용법
```python
import torch
from torch import nn

device = "cuda" if torch.cuda.is_available() else "cpu"
X = torch.randn(512, 10, device=device)
y = (X.sum(dim=1, keepdim=True) > 0).float()

model = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 1)).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-2)
loss_fn = nn.BCEWithLogitsLoss()

for epoch in range(100):
    opt.zero_grad()
    loss = loss_fn(model(X), y)
    loss.backward()
    opt.step()

with torch.no_grad():
    acc = ((model(X) > 0).float() == y).float().mean()
print(f"loss={loss.item():.3f} acc={acc:.2f}")
```

## 자주 쓰는 패턴
- **학습/평가 모드 전환**: `model.train()` / `model.eval()` 과 추론 시 `torch.inference_mode()`.
- **체크포인트**: `torch.save(model.state_dict(), "m.pt")` → `model.load_state_dict(torch.load("m.pt"))`.
- **속도 개선**: `model = torch.compile(model)`, bf16 `autocast`, `DataLoader(num_workers=..., pin_memory=True)`.
- **다중 GPU**: `torchrun --nproc_per_node=8 train.py` + DDP/FSDP.
- **실험 기록**: 손실·지표는 [MLflow](/develop-wiki/data-ml/ml/mlflow/)·[Weights & Biases](/develop-wiki/data-ml/ml/weights-and-biases/) 에 남긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 신경망 연구·구현, LLM·비전·음성 모델 학습과 파인튜닝, 생태계(사전학습 모델, 라이브러리)가 중요할 때.
- 피할 때(대안): 함수 변환·TPU 대규모 학습 중심이면 [JAX](/develop-wiki/data-ml/ml/jax/). 표 형식 데이터 예측은 [XGBoost](/develop-wiki/data-ml/ml/xgboost/)·[scikit-learn](/develop-wiki/data-ml/ml/scikit-learn/)이 보통 더 간단하고 강하다.

## 공식 문서
- [문서 홈](https://docs.pytorch.org/docs/stable/) · [설치 선택기](https://pytorch.org/get-started/locally/) · [튜토리얼](https://docs.pytorch.org/tutorials/)
- [torch.compile](https://docs.pytorch.org/docs/stable/torch.compiler.html) · [분산 학습 개요](https://docs.pytorch.org/tutorials/beginner/dist_overview.html) · [릴리스](https://github.com/pytorch/pytorch/releases)

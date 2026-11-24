---
name: Weights & Biases
url: https://wandb.ai
docs: https://docs.wandb.ai/
repo: https://github.com/wandb/wandb
stars: 11334
domain: data-ml
category: ml
description: ML 실험의 지표·설정·아티팩트를 기록해 웹 대시보드로 비교하는 실험 관리 서비스. 팀 단위 모델 학습 추적과 하이퍼파라미터 스윕에 쓴다.
pricing: freemium
tags: [mlops, experiment-tracking, sweeps, artifacts, visualization]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Weights & Biases(W&B)는 학습 코드에 몇 줄을 추가해 손실·지표·시스템 사용량·설정값을 클라우드(또는 자체 호스팅 서버)에 기록하고, 웹에서 실행들을 비교·시각화하는 서비스다. 하이퍼파라미터 탐색(Sweeps), 데이터·모델 버전 관리(Artifacts), 공유용 리포트를 제공하며, LLM 앱 추적·평가용 Weave 도 같은 플랫폼에 있다.

**버전·라이선스(2026-11 기준):** Python SDK `wandb` 0.31.0(2026-10-16), SDK 저장소는 MIT. 서버·웹 서비스는 상용이며 무료 플랜과 유료 플랜이 있어 freemium 으로 분류한다.

## 설치
```bash
pip install wandb
wandb login              # API 키 입력 (wandb.ai/authorize 에서 발급)
```
오프라인 환경에서는 `WANDB_MODE=offline` 으로 로컬에 기록 후 `wandb sync` 로 업로드.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project / Run | 실험 묶음 / 학습 실행 한 번 |
| `config` | 실행의 하이퍼파라미터. 대시보드에서 필터·그룹 기준 |
| `run.log` | 스텝별 지표·이미지·표 기록 |
| Sweep | 탐색 공간을 정의하고 에이전트가 grid/random/bayes 로 실행 |
| Artifact | 데이터셋·모델 파일의 버전·계보 관리 |
| Registry | 조직 단위로 승인된 모델·데이터셋 버전 관리 |
| Report | 차트와 설명을 묶은 공유 문서 |
| 통합 | PyTorch Lightning, Transformers `report_to="wandb"`, Keras 등 |

## 기본 사용법
```python
import random
import wandb

config = {"lr": 1e-3, "epochs": 5, "batch_size": 32}

with wandb.init(project="demo-classifier", config=config) as run:
    for epoch in range(run.config.epochs):
        train_loss = 1.0 / (epoch + 1) + random.random() * 0.05
        val_acc = 0.6 + epoch * 0.07
        run.log({"epoch": epoch, "train/loss": train_loss, "val/acc": val_acc})

    art = wandb.Artifact("model", type="model")
    art.add_file("model.pt")          # 학습한 모델 파일이 있다고 가정
    run.log_artifact(art)
```

스윕 정의 예(`sweep.yaml`):
```yaml
method: bayes
metric: {name: val/acc, goal: maximize}
parameters:
  lr: {min: 0.0001, max: 0.01}
  batch_size: {values: [16, 32, 64]}
```
`wandb sweep sweep.yaml` 후 출력된 id 로 `wandb agent <id>` 실행.

## 자주 쓰는 패턴
- **Transformers 학습 기록**: `TrainingArguments(report_to="wandb")` 로 자동 기록([Transformers](/develop-wiki/ai/fine-tuning/transformers/)).
- **지표 이름 계층화**: `train/loss`, `val/acc` 처럼 `/` 로 나누면 대시보드에서 섹션별로 묶인다.
- **실험 재현**: 코드 커밋·config·데이터 Artifact 버전을 함께 기록해 결과를 추적.
- **자체 호스팅**: 데이터 반출이 어려운 조직은 W&B Server(유료)를 검토.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 사람이 GPU 학습 실험을 공유·비교, 대시보드·리포트 협업, 스윕 자동화.
- 피할 때(대안): 완전한 오픈소스·셀프 호스팅 실험 추적과 모델 레지스트리가 필요하면 [MLflow](/develop-wiki/data-ml/ml/mlflow/).

## 공식 문서
- [문서 홈](https://docs.wandb.ai/) · [Quickstart](https://docs.wandb.ai/quickstart) · [실험 추적](https://docs.wandb.ai/guides/track/)
- [Sweeps](https://docs.wandb.ai/guides/sweeps/) · [Artifacts](https://docs.wandb.ai/guides/artifacts/) · [가격](https://wandb.ai/site/pricing/)

---
name: LeRobot
url: https://huggingface.co/lerobot
docs: https://huggingface.co/docs/lerobot
repo: https://github.com/huggingface/lerobot
stars: 29106
domain: robotics
category: robot-learning
description: Hugging Face 의 PyTorch 기반 로봇 학습 라이브러리. 하드웨어 제어, 데이터셋 수집·공유, ACT·Diffusion·VLA 정책 학습과 평가를 한 CLI 로 묶는다.
pricing: oss
tags: [lerobot, huggingface, imitation-learning, vla, act, diffusion-policy, dataset, pytorch]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
LeRobot 은 실제 로봇 팔·카메라 제어부터 시연 데이터 수집, 정책 학습, 평가, Hugging Face Hub 공유까지의 흐름을 PyTorch 로 통일한 라이브러리다. 데이터는 `LeRobotDataset`(Parquet + 비디오) 포맷으로 Hub 에서 스트리밍할 수 있고, 정책은 모방학습(ACT, Diffusion, VQ-BeT 등), 강화학습(HIL-SERL, TDMPC), VLA(Pi0 계열, SmolVLA, GR00T 등)를 지원한다. Apache-2.0.
**v0.7.0 기준(2026-11-05)**, Python 3.12 이상. 아직 0.x 라 CLI 이름·옵션과 모듈 경로가 릴리스마다 바뀐다(예: 정책 배포는 `lerobot-rollout`). 아래 명령은 저장소 README 기준이며 설치한 버전에서 `--help` 로 확인한다.

## 설치
```bash
pip install lerobot
lerobot-info                                   # 설치·환경 확인
pip install 'lerobot[dataset]'                 # 데이터셋 로딩
pip install 'lerobot[training]'                # 정책 학습
pip install 'lerobot[core_scripts,feetech]'    # SO-101 팔 녹화 예
```
기본 설치는 가볍고 용도별 extra 를 추가하는 방식이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `LeRobotDataset` | 관측(카메라·상태)·액션을 에피소드로 저장한 데이터셋 포맷(v3). Hub 와 연동 |
| Policy | 관측 → 액션 청크를 내는 모델. 종류는 `--policy.type` 으로 지정 |
| Robot / Teleoperator | 로봇과 원격 조종 장치 추상화. 하드웨어별 구현과 플러그인 |
| Processor | 관측·액션 전후처리 파이프라인(정규화 등) |
| EnvHub | 시뮬레이션 환경·벤치마크를 Hub 로 배포·로드 |
| 플러그인 | `lerobot_robot_*`, `lerobot_teleoperator_*`, `lerobot_camera_*` 접두사 패키지를 자동 발견 |

## 기본 사용법
공개 데이터셋 읽기(Hub 에서 받아옴):
```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

ds = LeRobotDataset("lerobot/pusht")
print(ds.num_episodes, len(ds))
sample = ds[0]                     # 딕셔너리: 관측·액션 텐서
print(list(sample.keys()))
```
정책 학습과 평가는 CLI 로 한다:
```bash
lerobot-train --policy.type=act \
  --dataset.repo_id=lerobot/aloha_mobile_cabinet \
  --policy.push_to_hub=false

lerobot-eval --policy.path=lerobot/pi0_libero_finetuned \
  --env.type=libero --env.task=libero_object --eval.n_episodes=10
```

## 자주 쓰는 패턴
- **데이터 수집**: 원격조종으로 `lerobot-record` 에피소드를 모아 Hub 에 올리고 팀과 공유한다.
- **정책 교체**: 같은 데이터셋으로 `--policy.type` 만 바꿔 ACT·Diffusion·SmolVLA 를 비교한다.
- **시뮬레이션 평가**: LIBERO, MetaWorld 같은 벤치마크를 `lerobot-eval` 로 돌려 재현 가능한 수치를 낸다.
- **VLA 파인튜닝**: 사전학습 VLA 를 자기 로봇 데이터로 미세조정한다. LoRA 등은 [PEFT](/develop-wiki/ai/fine-tuning/peft/) 와 함께 쓰는 경우가 많다.
- **새 하드웨어**: 자기 로봇 클래스를 구현하거나 플러그인 패키지로 배포한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 저가형 로봇 팔 등으로 시연 데이터를 모아 모방학습·VLA 를 시도하고, Hugging Face 생태계([Hub](/develop-wiki/ai/model-platform/huggingface-hub/))로 데이터·모델을 공유할 때.
- 피할 때(대안): 대규모 병렬 시뮬레이션 RL 은 [Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/)·[ManiSkill](/develop-wiki/robotics/robot-learning/maniskill/), 범용 RL 알고리즘 구현은 [Stable-Baselines3](/develop-wiki/robotics/robot-learning/stable-baselines3/).

## 공식 문서
- [LeRobot 문서](https://huggingface.co/docs/lerobot) · [GitHub README](https://github.com/huggingface/lerobot)
- [릴리스](https://github.com/huggingface/lerobot/releases)

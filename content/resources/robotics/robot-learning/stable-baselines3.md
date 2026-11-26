---
name: Stable-Baselines3
url: https://stable-baselines3.readthedocs.io/en/master/
docs: https://stable-baselines3.readthedocs.io/en/master/
repo: https://github.com/DLR-RM/stable-baselines3
stars: 14052
domain: robotics
category: robot-learning
description: PyTorch 기반 강화학습 알고리즘 구현 모음(PPO·SAC·TD3·DQN 등). Gymnasium 환경에 바로 붙여 로봇 제어 정책의 기준선을 학습할 때 쓴다.
pricing: oss
tags: [stable-baselines3, sb3, reinforcement-learning, ppo, sac, pytorch, gymnasium]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Stable-Baselines3(SB3)는 신뢰할 만한 RL 알고리즘 구현을 일관된 API 로 제공하는 [PyTorch](/develop-wiki/data-ml/ml/pytorch/) 기반 라이브러리다. A2C, DDPG, DQN, PPO, SAC, TD3 가 핵심이며 확장 패키지 `sb3-contrib`(TQC, RecurrentPPO 등)가 있다. [Gymnasium](/develop-wiki/robotics/robot-learning/gymnasium/) 환경을 입력으로 받는다. MIT 라이선스.
**v2.9.2 기준(2026-10-26)**, Python 3.10 이상. 대규모 GPU 병렬 학습용이 아니라 단일·소규모 벡터 환경에서의 재현성과 가독성이 중심이다. Isaac Lab 이 지원하는 학습 라이브러리 중 하나이기도 하다.

## 설치
```bash
pip install stable-baselines3          # 코어
pip install "stable-baselines3[extra]"  # TensorBoard, 영상 등 선택 의존성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 알고리즘 클래스 | `PPO`, `SAC`, `TD3` 등. 같은 `learn`/`predict`/`save`/`load` API |
| Policy | `"MlpPolicy"`, `"CnnPolicy"`, `"MultiInputPolicy"` 문자열로 선택 |
| VecEnv | 여러 환경을 묶는 벡터 환경(`make_vec_env`, `VecNormalize`) |
| Callback | 평가·체크포인트·조기 종료 훅(`EvalCallback`) |
| `policy_kwargs` | 네트워크 구조·활성화 함수 지정 |
| Monitor | 에피소드 보상·길이 기록 래퍼 |

## 기본 사용법
CartPole 을 PPO 로 학습하고 평가:
```python
from stable_baselines3 import PPO
from stable_baselines3.common.evaluation import evaluate_policy

model = PPO("MlpPolicy", "CartPole-v1", verbose=0)
model.learn(total_timesteps=50_000)
model.save("ppo_cartpole")

mean, std = evaluate_policy(model, model.get_env(), n_eval_episodes=10)
print(mean, std)
```
저장 모델은 `PPO.load("ppo_cartpole")` 로 불러와 `model.predict(obs, deterministic=True)` 로 추론한다.

## 자주 쓰는 패턴
- **연속 제어(로봇)**: SAC·TD3 가 오프폴리시로 샘플 효율이 좋아 매니퓰레이터 태스크에 흔하다.
- **관측 정규화**: `VecNormalize` 로 관측·보상을 정규화하고, 평가 때 같은 통계를 로드한다.
- **병렬 수집**: `make_vec_env(env_id, n_envs=8)` 로 PPO 수집 속도를 높인다.
- **하이퍼파라미터**: RL Baselines3 Zoo 에 알려진 설정이 있어 출발점으로 쓴다.
- **Dict 관측**: 이미지+상태 혼합 관측은 `"MultiInputPolicy"` 를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 환경의 기준선(baseline)을 빠르게 얻고 싶을 때, 알고리즘 동작을 읽기 쉬운 코드로 확인하고 싶을 때.
- 피할 때(대안): 수천 환경 GPU 학습은 RSL-RL·skrl 등 GPU 텐서 기반 구현([Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/) 연동), 실로봇 시연 기반 학습은 [LeRobot](/develop-wiki/robotics/robot-learning/lerobot/).

## 공식 문서
- [문서](https://stable-baselines3.readthedocs.io/en/master/) · [GitHub](https://github.com/DLR-RM/stable-baselines3)
- [릴리스](https://github.com/DLR-RM/stable-baselines3/releases)

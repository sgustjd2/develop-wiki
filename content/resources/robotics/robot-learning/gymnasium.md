---
name: Gymnasium
url: https://gymnasium.farama.org/
docs: https://gymnasium.farama.org/
repo: https://github.com/Farama-Foundation/Gymnasium
stars: 12860
domain: robotics
category: robot-learning
description: 강화학습 환경의 표준 API. OpenAI Gym 의 후속으로 Farama 재단이 유지하며 reset·step 인터페이스와 벤치마크 환경 모음을 제공한다.
pricing: oss
tags: [gymnasium, gym, reinforcement-learning, environment, api, farama]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Gymnasium 은 강화학습 에이전트와 환경 사이의 표준 인터페이스(`reset`, `step`, `observation_space`, `action_space`)와 기본 환경 모음을 제공한다. OpenAI Gym 이 유지보수를 멈춘 뒤 Farama Foundation 이 이어받았고, 로봇 시뮬레이터(MuJoCo, [ManiSkill](/develop-wiki/robotics/robot-learning/maniskill/), [Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/) 등)가 이 API 를 따른다. MIT 라이선스.
**v1.4.0 기준(2026-10-05)**, Python 3.10 이상. Gym 시절과 달리 `reset` 이 `(obs, info)` 를, `step` 이 `(obs, reward, terminated, truncated, info)` 5-튜플을 반환한다는 점이 옛 코드와의 가장 큰 차이다. 알고리즘은 담지 않고 환경 계약만 정의한다.

## 설치
```bash
pip install gymnasium
pip install "gymnasium[mujoco]"      # MuJoCo 로봇 환경
pip install "gymnasium[box2d]"       # Box2D 환경(일부 시스템은 swig 필요)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `gym.make(id)` | 등록된 ID 로 환경 생성 |
| `env.reset(seed=)` | 초기 관측과 info 반환 |
| `env.step(action)` | 5-튜플 반환. `terminated`(과제 종료)와 `truncated`(시간 제한) 구분 |
| Space | `Box`, `Discrete`, `Dict` 등 관측·액션 공간 정의 |
| Wrapper | 환경을 감싸 관측·보상·액션을 변환(`TimeLimit`, `RecordVideo` …) |
| Vector env | 여러 환경 병렬 실행(`gym.make_vec`) |
| 환경 등록 | `gym.register` 로 사용자 환경을 ID 에 연결 |

## 기본 사용법
CartPole 랜덤 정책 한 에피소드:
```python
import gymnasium as gym

env = gym.make("CartPole-v1")
obs, info = env.reset(seed=42)
done = False
total = 0.0
while not done:
    action = env.action_space.sample()
    obs, reward, terminated, truncated, info = env.step(action)
    total += reward
    done = terminated or truncated
env.close()
print(total)
```
사용자 환경은 `gym.Env` 를 상속해 `reset`/`step` 과 두 공간을 정의하면 된다.

## 자주 쓰는 패턴
- **학습 라이브러리 연결**: [Stable-Baselines3](/develop-wiki/robotics/robot-learning/stable-baselines3/) 등이 Gymnasium 환경을 바로 받는다.
- **래퍼 조합**: 관측 정규화, 프레임 스택, 영상 기록을 래퍼 체인으로 추가한다.
- **벡터화**: `gym.make_vec("CartPole-v1", num_envs=8)` 로 배치 수집한다.
- **커스텀 로봇 환경**: 시뮬레이터 호출을 `step` 안에 넣고 공간을 정의해 등록한다.
- **truncation 처리**: 시간 초과는 `truncated` 로 보고 부트스트랩 가치를 유지하도록 학습 코드를 작성한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 강화학습 환경·알고리즘 사이의 호환 계층이 필요할 때, 로봇 시뮬레이터에 표준 인터페이스를 붙일 때.
- 피할 때(대안): GPU 배치 텐서 환경 API 는 각 프레임워크(ManiSkill, Isaac Lab)의 자체 규약을 따르는 경우가 많다. 알고리즘 자체는 [Stable-Baselines3](/develop-wiki/robotics/robot-learning/stable-baselines3/) 등 별도 라이브러리가 필요하다.

## 공식 문서
- [Gymnasium 문서](https://gymnasium.farama.org/) · [GitHub](https://github.com/Farama-Foundation/Gymnasium)
- [릴리스](https://github.com/Farama-Foundation/Gymnasium/releases)

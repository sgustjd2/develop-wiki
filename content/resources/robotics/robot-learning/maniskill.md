---
name: ManiSkill
url: https://maniskill.readthedocs.io/en/latest/
docs: https://maniskill.readthedocs.io/en/latest/
repo: https://github.com/mani-skill/ManiSkill
stars: 3551
domain: robotics
category: robot-learning
description: SAPIEN 기반 GPU 병렬 로봇 조작 시뮬레이션 프레임워크. 수천 환경을 병렬로 돌리는 조작 벤치마크와 학습 기준 구현을 제공한다.
pricing: oss
tags: [maniskill, sapien, gpu-simulation, manipulation, benchmark, reinforcement-learning]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
ManiSkill 은 UCSD Hao Su 연구실이 만든 로봇 조작·학습용 프레임워크다. SAPIEN 시뮬레이터와 PhysX GPU 물리를 써서 수천 개 환경을 한 GPU 에서 병렬로 돌리고, GPU 병렬 렌더링으로 카메라 관측도 빠르게 얻는다. Gymnasium 호환 API 로 PickCube·StackCube 등 다양한 조작 태스크, 이동 조작, 휴머노이드 환경을 제공하고 PPO·SAC 등 기준 구현을 제공한다.
**v3.0.1 기준(2026-04-21)**. 저장소는 `haosulab/ManiSkill` 에서 `mani-skill/ManiSkill` 로 옮겨졌다. Apache-2.0 이며 에셋 일부는 별도 라이선스일 수 있다. PyPI 패키지명은 `mani-skill`(import 는 `mani_skill`).

## 설치
```bash
pip install --upgrade mani_skill torch
python -m mani_skill.examples.demo_random_action -e PickCube-v1   # 확인용 데모
```
GPU 병렬 시뮬레이션에는 NVIDIA GPU 와 드라이버가 필요하다. CPU 시뮬레이션도 가능하나 속도 이점은 줄어든다. Vulkan 렌더링 요구사항은 공식 설치 문서를 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 환경 ID | `PickCube-v1` 같은 `gym.make` 이름 |
| `num_envs` | 병렬 환경 수. 관측·보상·액션이 배치 텐서 |
| `obs_mode` | `state`, `rgbd`, `pointcloud` 등 관측 종류 |
| `control_mode` | `pd_joint_delta_pos`, `pd_ee_delta_pose` 등 컨트롤러 |
| `sim_backend` | `physx_cpu` / `physx_cuda`(GPU) |
| Demonstration | 모션 플래닝·RL 로 생성한 시연 데이터와 변환 도구 |
| Task builder | 새 환경을 `BaseEnv` 상속으로 구현하는 방식 |

## 기본 사용법
GPU 병렬 환경 만들고 랜덤 액션:
```python
import gymnasium as gym
import mani_skill.envs  # 환경 등록

env = gym.make(
    "PickCube-v1",
    num_envs=64,
    obs_mode="state",
    control_mode="pd_joint_delta_pos",
)
obs, _ = env.reset(seed=0)
for _ in range(50):
    action = env.action_space.sample()   # (64, 액션차원) 배치
    obs, reward, terminated, truncated, info = env.step(action)
env.close()
```
반환값은 torch 텐서(GPU)로 배치 처리된다. 정확한 옵션 이름은 설치 버전 문서를 확인한다.

## 자주 쓰는 패턴
- **GPU RL**: 제공되는 PPO 기준 구현으로 수천 환경을 돌려 몇 분 안에 PickCube 같은 태스크를 푼다.
- **시연 기반 모방학습**: 모션 플래닝 시연을 생성·재생(replay)해 행동 복제(BC)·Diffusion Policy 류 학습에 쓴다.
- **비전 입력**: `obs_mode="rgbd"` 로 병렬 카메라 관측을 받아 이미지 정책을 학습한다.
- **새 태스크**: `BaseEnv` 를 상속해 씬 로딩·초기화·평가·보상을 정의한다.
- **실로봇 평가 보조**: sim-to-real 환경과 렌더링 실험에 쓰인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 조작 태스크의 GPU 병렬 RL·모방학습 벤치마크가 필요할 때, SAPIEN 의 관절 물체(문·서랍) 에셋이 필요할 때.
- 피할 때(대안): 보행·NVIDIA 생태계 중심은 [Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/), 단순 MuJoCo 벤치마크는 [robosuite](/develop-wiki/robotics/robot-learning/robosuite/), 실로봇 데이터는 [LeRobot](/develop-wiki/robotics/robot-learning/lerobot/).

## 공식 문서
- [문서](https://maniskill.readthedocs.io/en/latest/) · [GitHub](https://github.com/mani-skill/ManiSkill)
- [릴리스](https://github.com/mani-skill/ManiSkill/releases)

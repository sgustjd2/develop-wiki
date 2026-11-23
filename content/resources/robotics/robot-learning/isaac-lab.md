---
name: NVIDIA Isaac Lab
url: https://isaac-sim.github.io/IsaacLab/main/
docs: https://isaac-sim.github.io/IsaacLab/main/
repo: https://github.com/isaac-sim/IsaacLab
stars: 8709
domain: robotics
category: robot-learning
description: GPU 가속 로봇 학습 프레임워크. 강화·모방학습 환경을 대량 병렬로 돌리며 Newton·PhysX(Isaac Sim) 등 여러 물리 백엔드를 지원한다.
pricing: oss
tags: [nvidia, isaac-lab, reinforcement-learning, imitation-learning, newton, warp, sim-to-real]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Isaac Lab 은 로봇 강화학습·모방학습·post-training 을 위한 GPU 가속 오픈소스 프레임워크다. 로봇·센서·태스크를 선언적으로 정의하고 수천 개 환경을 병렬 시뮬레이션하며, RSL-RL·skrl·RL-Games·Stable-Baselines 같은 학습 라이브러리와 연결한다. 보행·조작·휴머노이드 환경이 기본 제공된다.
**v3.0.0 기준(2026-10-20)**. 3.0 에서 구조가 크게 바뀌어 **Newton(NVIDIA Warp 기반)이 기본 백엔드**이고, Isaac Sim 은 선택 사항이 됐다(`isaacsim` extra, Isaac Sim 6.2 대응). 물리·렌더 백엔드는 Newton, OVPhysX/OVRTX, Isaac Sim 중에서 고른다. 2.x 는 Isaac Sim 4.5/5.x 와 짝이었으므로 옛 튜토리얼의 `isaaclab.sh` 방식과 다를 수 있다. 라이선스는 프레임워크 BSD-3-Clause, `isaaclab_mimic` 확장 Apache-2.0, 그리고 Isaac Sim 을 쓰는 워크플로는 Isaac Sim 의 독점 구성요소 약관을 함께 따른다.

## 설치
요구사항(Newton 기본 설치): Python 3.12, Ubuntu 22.04+ x86_64 / Linux aarch64(DGX Spark 포함) / Windows 11, CUDA 지원 NVIDIA GPU(기본 CUDA 13 스택은 Turing(컴퓨트 7.5) 이상), 드라이버 최소 Linux x86_64 595.58.03. Isaac Sim 백엔드를 쓰면 x86_64 에서 RAM 32GB·VRAM 16GB 이상과 지원 RTX GPU 를 계획해야 한다. 아래는 공식 권장 uv 방식이다.
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/isaac-sim/IsaacLab.git --branch main
cd IsaacLab
# Newton 백엔드(Isaac Sim 불필요)로 학습
uv run isaaclab train --rl_library rsl_rl \
   --task Isaac-Cartpole-Direct physics=newton_mjwarp
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Direct / Manager-based | 환경 작성 두 방식. Direct 는 한 클래스에 직접 구현, Manager-based 는 보상·관측·이벤트를 설정 조합 |
| Task ID | `Isaac-Cartpole-Direct` 처럼 등록된 환경 이름 |
| 백엔드(`physics=`) | `newton_mjwarp`, `ovphysx`, `isaacsim_physx` 등 물리 엔진 선택 |
| Scene / Asset | 로봇(articulation)·물체·센서의 선언. 에셋 설정 클래스로 정의 |
| 센서 | 카메라, IMU, 접촉 센서, 레이캐스터 |
| RL 라이브러리 연동 | `--rl_library rsl_rl` 등으로 학습기 선택 |
| `isaaclab_mimic` | 시연 데이터 증강·생성(모방학습) |

## 기본 사용법
학습과 재생(저장소 설치 문서의 명령):
```bash
# Isaac Sim 6.2/PhysX 로 학습
uv run --extra isaacsim isaaclab train --rl_library rsl_rl \
   --task Isaac-Cartpole-Direct physics=isaacsim_physx

# 학습된 정책 재생
uv run isaaclab play --rl_library rsl_rl \
   --task Isaac-Cartpole-Direct --viz newton_gl
```
`--extra` 는 `isaaclab` 앞에 둔다. 의존성은 `uv run` 이 자동으로 풀어 준다.

## 자주 쓰는 패턴
- **환경 시작점 복사**: 기존 Cartpole·보행 환경을 복사해 로봇·보상 항을 바꾼다.
- **백엔드 전환**: 설정 오버라이드(`physics=...`)로 같은 태스크를 Newton 과 PhysX 에서 비교한다.
- **헤드리스 대량 학습**: 렌더링 없이 수천 환경을 돌려 보행 정책을 학습한다.
- **카메라 입력 정책**: RTX 카메라로 비전 기반 조작 정책을 학습한다(RTX 요구사항 별도).
- **sim-to-real**: 도메인 랜덤화와 액추에이터 모델로 실로봇 전이를 준비하고, 실로봇 데이터·정책 관리는 [LeRobot](/develop-wiki/robotics/robot-learning/lerobot/) 과 함께 쓰기도 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: NVIDIA GPU 로 보행·조작 RL 을 대규모 병렬화할 때, [Isaac Sim](/develop-wiki/robotics/simulation/isaac-sim/) 의 RTX 센서·에셋을 학습에 쓰고 싶을 때.
- 피할 때(대안): GPU 가 NVIDIA 가 아니면 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/) 계열이나 [Genesis](/develop-wiki/robotics/simulation/genesis/), 실로봇 시연 기반 모방학습은 [LeRobot](/develop-wiki/robotics/robot-learning/lerobot/).

## 공식 문서
- [문서 홈](https://isaac-sim.github.io/IsaacLab/main/) · [설치](https://isaac-sim.github.io/IsaacLab/main/source/isaaclab/installation.html)
- [arXiv 논문](https://arxiv.org/abs/2511.04831) · [GitHub](https://github.com/isaac-sim/IsaacLab)

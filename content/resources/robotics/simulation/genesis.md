---
name: Genesis
url: https://genesis-world.readthedocs.io/en/latest/
docs: https://genesis-world.readthedocs.io/en/latest/
repo: https://github.com/Genesis-Embodied-AI/genesis-world
stars: 30253
domain: robotics
category: simulation
description: 강체·FEM·MPM·입자 등 다중 물리를 하나의 Python API 로 다루는 GPU 병렬 로봇 시뮬레이션 플랫폼. 로봇 학습 환경 구축에 쓴다.
pricing: oss
tags: [genesis, simulation, gpu, multi-physics, quadrants, reinforcement-learning]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Genesis World 는 Python 으로 장면을 구성하고 GPU 에서 대량 병렬로 돌리는 물리 시뮬레이션 플랫폼이다. 강체, FEM, MPM, 입자(PBD/SPH) 등 여러 솔버를 한 장면에서 결합하고, 자체 컴파일러 Quadrants 가 파이썬 커널을 CUDA·ROCm·Metal·Vulkan·CPU 로 낮춘다. 렌더링은 Nyx(자체), Luisa, Pyrender 경로가 있고, URDF·MJCF·USD 등 에셋을 읽는다. Apache-2.0.
**v1.4.7 기준(2026-11)**, PyPI 패키지명은 `genesis-world`(Python 3.12 이상 3.15 미만). 저장소 이름이 바뀌어 `Genesis-Embodied-AI/genesis-world` 가 현재 주소다. 버전 1.x 로 빠르게 변하는 프로젝트이므로 API 는 설치한 버전의 문서를 기준으로 확인한다.

## 설치
PyTorch 를 먼저 공식 안내대로 설치한 뒤:
```bash
pip install genesis-world
# 최신 개발본: pip install git+https://github.com/Genesis-Embodied-AI/genesis-world.git
```
IPC 솔버(`pyuipc`)와 Nyx 렌더러(`gs-nyx`)는 선택 확장이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `gs.init` | 백엔드(`gs.gpu`/`gs.cpu` 등) 초기화. 가장 먼저 호출 |
| `gs.Scene` | 시뮬레이션 장면. 뷰어 사용 여부 등을 옵션으로 받음 |
| Entity / Morph | 장면에 추가하는 객체와 그 형상 정의(`gs.morphs.Plane`, `MJCF`, `URDF` …) |
| `scene.build` | 장면을 확정·컴파일. 병렬 환경 수(`n_envs`)도 여기서 지정 |
| Solver | Rigid, FEM, MPM, PBD/SPH 등 물리 솔버와 커플러 |
| Quadrants | 파이썬 커널 컴파일러(자동 미분·GPU 그래프 포함) |

## 기본 사용법
평면 위에 Franka 팔을 올리고 시뮬레이션(공식 시작 예제 형태):
```python
import genesis as gs

gs.init(backend=gs.gpu)                      # CPU 만 있으면 gs.cpu
scene = gs.Scene(show_viewer=True)
scene.add_entity(gs.morphs.Plane())
franka = scene.add_entity(
    gs.morphs.MJCF(file="xml/franka_emika_panda/panda.xml")
)
scene.build()

for _ in range(1000):
    scene.step()
```
병렬 환경은 `scene.build(n_envs=4096)` 처럼 지정하고, 상태·제어는 배치 텐서로 다룬다. 정확한 시그니처는 설치 버전 문서에서 확인한다.

## 자주 쓰는 패턴
- **대량 병렬 RL**: `n_envs` 로 수천 환경을 만들고 PyTorch 정책과 텐서를 직접 주고받는다.
- **에셋 재사용**: MJCF·URDF 로봇을 `gs.morphs` 로 불러온다.
- **다중 물리**: 강체 로봇이 연체·유체와 상호작용하는 장면을 솔버 결합으로 구성한다.
- **카메라 센서**: 장면에 카메라를 추가해 RGB·깊이 이미지를 학습 입력으로 쓴다.
- **미분 가능 시뮬레이션**: Quadrants 의 자동 미분으로 일부 솔버에서 그래디언트를 얻는다(지원 범위는 문서 확인).

## 언제 쓰나 / 피할 때
- 쓸 때: Python 중심으로 GPU 병렬 학습 환경을 빠르게 만들고, 연체·입자까지 한 엔진에서 실험하고 싶을 때.
- 피할 때(대안): 성숙도·검증된 접촉 정확도와 폭넓은 사용 사례는 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/), ROS 2 통합 테스트는 [Gazebo](/develop-wiki/robotics/simulation/gazebo/), NVIDIA 렌더링 생태계는 [Isaac Sim](/develop-wiki/robotics/simulation/isaac-sim/).

## 공식 문서
- [Genesis World 문서](https://genesis-world.readthedocs.io/en/latest/) · [Quadrants](https://genesis-embodied-ai.github.io/quadrants/index.html) · [Nyx](https://genesis-embodied-ai.github.io/genesis-nyx/latest/)
- [GitHub](https://github.com/Genesis-Embodied-AI/genesis-world)

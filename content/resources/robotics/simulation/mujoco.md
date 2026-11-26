---
name: MuJoCo
url: https://mujoco.org
docs: https://mujoco.readthedocs.io/en/stable/
repo: https://github.com/google-deepmind/mujoco
stars: 18502
domain: robotics
category: simulation
description: Google DeepMind 의 접촉 중심 물리 엔진. 빠른 C 라이브러리에 Python 바인딩과 JAX(MJX)·Warp GPU 백엔드를 제공하며 로봇 학습에 널리 쓰인다.
pricing: oss
tags: [mujoco, physics-engine, mjx, mujoco-warp, mujoco-playground, mjcf, reinforcement-learning]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
MuJoCo(Multi-Joint dynamics with Contact)는 관절 로봇과 접촉 동역학에 최적화된 물리 엔진이다. 모델은 MJCF(XML)로 기술하고, C 라이브러리는 의존성이 적고 빠르다. 현재 Apache-2.0 오픈소스이며 Google DeepMind 가 유지한다.
**v4.0.1 기준(2026-11)**. 4.0 부터 PyPI `mujoco` 는 메타패키지로 바뀌어 코어 바인딩(`mujoco-core`), MuJoCo Studio·Filament 렌더링, 기존 OpenGL 렌더링 의존성을 함께 설치한다(서버·학습용 최소 설치는 `mujoco-core`). GPU 가속은 두 갈래다: JAX 기반 **MJX**(`mujoco-mjx`)와 NVIDIA Warp 기반 **MuJoCo Warp**(`mujoco-warp`). 이들 위에 **MuJoCo Playground**(`playground`, v1.0.1)가 환경·학습 예제를 제공한다. 세 패키지 모두 4.0.1 로 확인했다.

## 설치
```bash
pip install mujoco            # 코어 + 뷰어(메타패키지, 4.0 이상)
pip install mujoco-core       # 최소(헤드리스) 설치
pip install mujoco-mjx        # JAX 백엔드(MJX). jax 는 별도 설치
pip install mujoco-warp       # Warp 백엔드(NVIDIA GPU)
python -m mujoco.viewer       # 인터랙티브 뷰어
```
Python 3.11 이상이 필요하다(`mujoco` 4.0.1 기준).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| MJCF | MuJoCo 모델 XML. bodies, joints, geoms, actuators, sensors 정의 |
| `MjModel` | 컴파일된 정적 모델(상수) |
| `MjData` | 시뮬레이션 상태·중간 결과(qpos, qvel, ctrl, sensordata 등) |
| `mj_step` | 한 스텝 전진. `data.ctrl` 에 제어 입력을 쓰고 호출 |
| MJX | `MjModel`/`MjData` 를 JAX 로 옮겨 `jit`·`vmap` 으로 배치 시뮬레이션 |
| MuJoCo Warp | Warp 커널로 GPU 병렬 시뮬레이션 |
| Playground | MJX/Warp 기반 로봇 학습 환경 모음 |
| `dm_control` | MuJoCo 위의 DeepMind 제어 스위트(별도 패키지) |

## 기본 사용법
최소 시뮬레이션 — 떨어지는 박스의 높이 출력:
```python
import mujoco

xml = """
<mujoco>
  <worldbody>
    <geom type="plane" size="2 2 .1"/>
    <body pos="0 0 1">
      <freejoint/>
      <geom type="box" size=".1 .1 .1" mass="1"/>
    </body>
  </worldbody>
</mujoco>
"""
model = mujoco.MjModel.from_xml_string(xml)
data = mujoco.MjData(model)
for _ in range(500):
    mujoco.mj_step(model, data)
print(data.qpos[:3])   # [x, y, z] — 바닥에 안착
```
뷰어에서 보기: `mujoco.viewer.launch(model, data)` (`import mujoco.viewer`). 렌더링 이미지는 `mujoco.Renderer(model)`.

## 자주 쓰는 패턴
- **제어 루프**: 매 스텝 `data.ctrl[:] = policy(data.sensordata)` 후 `mj_step`. 모델 타임스텝(`model.opt.timestep`)과 제어 주기를 맞춘다.
- **MJX 배치**: `mjx.put_model`/`put_data` 로 이동한 뒤 `jax.vmap(mjx.step, ...)` 로 수천 환경을 병렬 실행한다. GPU/TPU 위에서 효과가 크다.
- **로봇 모델 재사용**: `mujoco_menagerie` 저장소의 검증된 로봇 MJCF 를 가져다 쓴다.
- **학습 프레임워크 연결**: [Gymnasium](/develop-wiki/robotics/robot-learning/gymnasium/) 의 MuJoCo 환경, [robosuite](/develop-wiki/robotics/robot-learning/robosuite/), MuJoCo Playground 가 MuJoCo 를 백엔드로 쓴다.
- **URDF 가져오기**: MuJoCo 컴파일러가 URDF 를 직접 읽을 수 있으나 접촉·관성 설정은 MJCF 로 다듬는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 접촉이 많은 조작·보행 연구, 대규모 병렬 강화학습, 정확하고 빠른 CPU 시뮬레이션이 필요할 때.
- 피할 때(대안): 센서 렌더링·합성 데이터·ROS 통합 시뮬레이션은 [Gazebo](/develop-wiki/robotics/simulation/gazebo/)·[Isaac Sim](/develop-wiki/robotics/simulation/isaac-sim/). 연체·유체 등 다중 물리는 [Genesis](/develop-wiki/robotics/simulation/genesis/).

## 공식 문서
- [문서 홈](https://mujoco.readthedocs.io/en/stable/) · [Python 바인딩](https://mujoco.readthedocs.io/en/stable/python.html)
- [MuJoCo Warp](https://github.com/google-deepmind/mujoco_warp) · [MuJoCo Playground](https://github.com/google-deepmind/mujoco_playground)

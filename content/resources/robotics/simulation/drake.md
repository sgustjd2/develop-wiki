---
name: Drake
url: https://drake.mit.edu
docs: https://drake.mit.edu/pydrake/index.html
repo: https://github.com/RobotLocomotion/drake
stars: 4261
domain: robotics
category: simulation
description: MIT·TRI 가 만든 모델 기반 설계·제어·시뮬레이션 툴박스. 다물체 동역학, 최적화 기반 계획·제어를 C++ 과 Python(pydrake)으로 제공한다.
pricing: oss
tags: [drake, pydrake, multibody, optimization, trajectory-optimization, control]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Drake 는 로봇의 동역학 시뮬레이션과 분석, 최적화 기반 계획·제어를 한 툴박스에서 다룬다. 시스템을 블록 다이어그램(`Diagram`)으로 조립하고, `MultibodyPlant` 로 다물체 동역학을 계산하며, 수학적 프로그래밍(`MathematicalProgram`)으로 궤적 최적화·역기구학을 푼다. BSD-3-Clause 라이선스(저장소 LICENSE 기준).
**v1.59.0 기준(GitHub 릴리스 2026-11-17)**. PyPI `drake` 는 확인 시점에 1.58.0 이어서 pip 로 받는 버전이 한 단계 늦을 수 있다. 접촉·렌더링 모델의 사실감보다 정확한 모델링·검증과 최적화에 강점이 있어, 대규모 병렬 RL 용도와는 결이 다르다.

## 설치
```bash
pip install drake            # Python 3.12 이상(확인 시점 wheel 기준)
```
C++ 사용·소스 빌드·Docker 는 공식 설치 문서를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `System` / `Diagram` | 입력·출력·상태를 가진 블록과 그 연결(다이어그램) |
| `DiagramBuilder` | 시스템을 추가·연결해 `Diagram` 으로 빌드 |
| `MultibodyPlant` | 다물체 동역학 모델. 링크·조인트·접촉·힘 |
| `SceneGraph` | 기하·충돌 질의·시각화 담당 |
| `Parser` | URDF·SDFormat·MJCF 모델을 plant 에 로드 |
| `Simulator` | Diagram 을 시간에 따라 적분 |
| `MathematicalProgram` | 비선형·볼록 최적화 문제 정의(IK, 궤적 최적화) |
| Meshcat | 브라우저 기반 시각화 |

## 기본 사용법
SDF 로 정의한 박스를 떨어뜨리는 최소 예제:
```python
from pydrake.all import (AddMultibodyPlantSceneGraph, DiagramBuilder,
                         Parser, Simulator)

sdf = """<sdf version="1.9"><model name="box"><link name="b">
<inertial><mass>1</mass><inertia><ixx>0.01</ixx><iyy>0.01</iyy><izz>0.01</izz></inertia></inertial>
</link></model></sdf>"""

builder = DiagramBuilder()
plant, scene_graph = AddMultibodyPlantSceneGraph(builder, time_step=1e-3)
Parser(plant).AddModelsFromString(sdf, "sdf")
plant.Finalize()
diagram = builder.Build()

simulator = Simulator(diagram)
simulator.AdvanceTo(1.0)
print(simulator.get_context().get_time())
```
`Parser` 생성 방식과 모델 로드 메서드는 버전에 따라 달라질 수 있으므로 설치본의 pydrake 문서로 확인한다.

## 자주 쓰는 패턴
- **조작 파이프라인**: 매니퓰레이션 교재(manipulation.mit.edu)의 Diagram 구성을 따라 스테이션·컨트롤러를 조립한다.
- **궤적 최적화**: `MathematicalProgram` 위에 DirectCollocation·KinematicTrajectoryOptimization 등으로 궤적을 푼다.
- **역기구학**: 제약을 가진 최적화로 IK 를 풀고 충돌 회피 제약을 넣는다.
- **Meshcat 시각화**: `StartMeshcat()` 로 브라우저 뷰를 열어 시뮬레이션·디버깅을 본다.
- **제어기 검증**: 선형화·LQR·리아푸노프 분석 같은 모델 기반 도구로 제어기를 점검한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모델 기반 제어·최적화 연구, 조작(manipulation) 파이프라인 프로토타이핑, 정확한 동역학과 해석이 중요한 작업.
- 피할 때(대안): 센서 렌더링·ROS 통합 시뮬레이션은 [Gazebo](/develop-wiki/robotics/simulation/gazebo/), GPU 대량 병렬 학습은 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/) MJX/Warp·[Genesis](/develop-wiki/robotics/simulation/genesis/).

## 공식 문서
- [Drake 홈](https://drake.mit.edu) · [pydrake API](https://drake.mit.edu/pydrake/index.html)
- [GitHub](https://github.com/RobotLocomotion/drake)

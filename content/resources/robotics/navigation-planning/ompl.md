---
name: OMPL
url: https://ompl.kavrakilab.org
docs: https://ompl.kavrakilab.org/geometricPlanningSE3.html
repo: https://github.com/ompl/ompl
stars: 2207
domain: robotics
category: navigation-planning
description: 샘플링 기반 모션 플래닝 알고리즘(RRT, PRM 등)을 모은 C++ 라이브러리. 충돌 검사는 사용자가 제공하며 MoveIt 의 기본 플래너로 쓰인다.
pricing: oss
tags: [ompl, sampling-based, rrt, prm, motion-planning, library]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
OMPL(Open Motion Planning Library)은 Rice 대학 Kavraki Lab 에서 시작한 샘플링 기반 플래너 라이브러리다. 로봇 모델·충돌 검사·시각화를 포함하지 않고, "상태 공간 + 유효 상태 검사 + 시작/목표" 만 받아 경로를 찾는다. 그래서 어떤 로봇·시뮬레이터에도 붙일 수 있으며 [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/) 의 기본 플래너 플러그인이다. 3-clause BSD 라이선스. 최신 릴리스 2.0.2(2026-08-14), ROS 2 Lyrical 패키지도 2.0.2.

## 설치
```bash
sudo apt install ros-lyrical-ompl          # ROS 2 환경
pip install ompl                            # PyPI 2.0.1 (CPython 3.10+ 휠, 플랫폼 확인)
```
소스 빌드는 CMake 로 하며 Boost, Eigen 등이 필요하다. 설치 옵션은 [OMPL 설치 문서](https://ompl.kavrakilab.org/installation.html)를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| StateSpace | 상태 표현(`RealVectorStateSpace`, `SE2`, `SE3`, `CompoundStateSpace`) |
| SpaceInformation | 상태 공간 + 유효성 검사기 + 해상도 |
| ProblemDefinition | 시작·목표 상태, 최적화 목표(경로 길이 등) |
| Planner | 기하 계획(RRT, RRT*, RRTConnect, PRM, BIT*, KPIECE, EST …), 제어 기반 계획 |
| Planner 선택 기준 | 가능 해만 필요하면 RRTConnect 등, 점근 최적이 필요하면 RRT*·BIT* |
| SimpleSetup | 위 구성 요소를 묶은 편의 클래스 |
| PathSimplifier | 얻은 경로를 단축·평활화 |

## 기본 사용법
2D 공간에서 원형 장애물을 피하는 경로(Python 바인딩):
```python
from ompl import base as ob, geometric as og

space = ob.RealVectorStateSpace(2)
b = ob.RealVectorBounds(2); b.setLow(0); b.setHigh(10)
space.setBounds(b)

def valid(state):
    dx, dy = state[0] - 5, state[1] - 5
    return dx * dx + dy * dy > 4          # 반지름 2 원 밖만 유효

ss = og.SimpleSetup(space)
ss.setStateValidityChecker(ob.StateValidityCheckerFn(valid))
start, goal = ob.State(space), ob.State(space)
start[0], start[1] = 1, 1
goal[0], goal[1] = 9, 9
ss.setStartAndGoalStates(start, goal)
ss.setPlanner(og.RRTConnect(ss.getSpaceInformation()))

if ss.solve(1.0):
    ss.simplifySolution()
    print(ss.getSolutionPath().printAsMatrix())
```

## 자주 쓰는 패턴
- 충돌 검사기는 FCL, Bullet 등 기존 충돌 라이브러리를 `StateValidityChecker` 안에서 호출한다.
- 계획 시간 제한을 두고 여러 번 실행해 가장 짧은 경로를 고른다(샘플링 기반은 결과가 비결정적).
- 최적성이 필요하면 `ProblemDefinition::setOptimizationObjective` 와 RRT*/BIT*.
- 고차원 팔은 `PathSimplifier` + 시간 매개변수화(MoveIt 이 담당)를 후처리로 둔다.
- MoveIt 설정(`ompl_planning.yaml`)에서 플래너를 바꿔 비교.

## 언제 쓰나 / 피할 때
- 쓸 때: 고차원 구성 공간(로봇 팔)의 충돌 회피 경로 탐색, 알고리즘 연구·비교. 언어 [C++](/develop-wiki/languages/cpp/)·[Python](/develop-wiki/languages/python/).
- 피할 때: 2D 격자 지도 주행은 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/) 의 Smac 등이 맞고, 궤적 최적화·동역학 제약이 핵심이면 최적화 기반 플래너를 본다. 시각화·충돌·URDF 처리는 포함돼 있지 않다.

## 공식 문서
- [OMPL 문서](https://ompl.kavrakilab.org) · [기하 계획 예제(SE3)](https://ompl.kavrakilab.org/geometricPlanningSE3.html) · [GitHub](https://github.com/ompl/ompl)

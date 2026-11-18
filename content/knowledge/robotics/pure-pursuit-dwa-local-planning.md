---
title: 지역 경로 추종 — Pure Pursuit 와 DWA
aka: [Pure Pursuit, Regulated Pure Pursuit, DWA, Dynamic Window Approach, DWB, Local Planner, Path Tracking]
category: robotics
group: planning
level: intermediate
summary: 전역 경로를 따라가는 지역 제어 두 계열. Pure Pursuit 는 전방 목표점으로 곡률을 계산하고, DWA 는 속도 후보를 시뮬레이션해 점수로 고른다. 룩어헤드·가중치가 동작을 좌우한다.
tags: [robotics, planning, pure-pursuit, dwa, local-planner, nav2, path-tracking]
related: [robotics/nav2-architecture, robotics/astar-grid-planning, robotics/trajectory-velocity-profile, robotics/model-predictive-control, robotics/pid-control]
sources:
  - https://www.ri.cmu.edu/publications/the-dynamic-window-approach-to-collision-avoidance
  - https://doi.org/10.1109/100.580977
  - https://arxiv.org/abs/2305.20026
  - https://github.com/ros-navigation/navigation2/tree/main/nav2_regulated_pure_pursuit_controller
  - https://github.com/ros-navigation/navigation2/tree/main/nav2_dwb_controller
  - https://www.ri.cmu.edu/pub_files/pub3/coulter_r_craig_1992_1/coulter_r_craig_1992_1.pdf
updatedAt: 2026-11-19
---

## 문제

전역 플래너(A* 등)가 준 경로는 점의 나열일 뿐이고, 바퀴 속도 명령이 아니다. 로봇은 경로에서 벗어나 있고, 속도·가속 한계가 있으며, 움직이는 장애물도 만난다. "지금 순간에 어떤 (선속도 v, 각속도 ω) 를 낼까" 를 짧은 주기로 정하는 층이 필요하다. Nav2 에서는 컨트롤러 서버의 플러그인이 이 일을 한다([Nav2 구조](/develop-wiki/knowledge/robotics/nav2-architecture/)).

## 해법 1: Pure Pursuit

경로 위에서 **로봇으로부터 거리 L(룩어헤드) 만큼 앞선 점**을 목표로 잡고, 로봇이 그 점을 지나는 원호를 따라가게 한다. 원호 곡률은 기하만으로 나온다. 목표점의 로봇 좌표계 횡방향 오프셋을 y 라 하면

`κ = 2y / L²`,  `ω = v · κ`

(로봇 위치에서 접선이 헤딩과 일치하고 목표점을 지나는 원의 곡률. 직접 유도했고 아래 시뮬레이션으로 확인했다.)

```python
import math
def pure_pursuit(x, y, th, path, L, v):
    tgt = next((p for p in path if math.hypot(p[0]-x, p[1]-y) >= L), path[-1])
    dx, dy = tgt[0]-x, tgt[1]-y
    ly = -math.sin(th)*dx + math.cos(th)*dy      # 로봇 좌표계 횡오프셋
    d2 = dx*dx + dy*dy
    return v * (2*ly/d2 if d2 > 1e-9 else 0.0)   # 각속도 명령
```

룩어헤드가 거동을 정한다. 직선 10 m 후 90도 코너, v = 1 m/s, 초기 0.5 m 옆에서 출발한 시뮬레이션(조향 지연 없음):

| L | 경로 이탈 최대(코너 이후) |
| --- | --- |
| 0.3 m | 0.07 m |
| 1.0 m | 0.24 m |
| 3.0 m | 0.78 m (코너를 크게 자름) |

작은 L 은 정확하지만, 같은 모델에 조향 지연(1차 지연 τ = 0.5 s)과 v = 2 m/s 를 넣으면 L = 0.3 m 에서 오차가 3 m 이상으로 커지는(진동·발산) 쪽이 되고 L = 2~3 m 에서는 0.5 m 안팎으로 안정했다. 즉 L 은 "정확도 대 안정성" 의 손잡이다. 수치는 이 장난감 모델에 한정된 예시다.

### Regulated Pure Pursuit (Nav2)

Nav2 의 `nav2_regulated_pure_pursuit_controller` 는 고전 Pure Pursuit 에 규칙을 더한 변형이다. 문서와 논문(Macenski 외)이 설명하는 요소는 속도에 비례하는 룩어헤드, 앞쪽 경로를 짧게 투영한 충돌 검사, 급커브에서의 감속, 장애물 근접 시 감속, 목표 접근 시 감속이다. 파라미터 이름(`lookahead_dist`, `use_velocity_scaled_lookahead_dist`, `lookahead_time`, `use_regulated_linear_velocity_scaling` 등)은 배포판 문서에서 확인한다. 문서의 튜닝 조언: 흔들리면 룩어헤드를 늘리고, 경로로 수렴이 느리면 줄인다.

## 해법 2: DWA (Dynamic Window Approach)

Fox, Burgard, Thrun(1997)의 방식이다. 속도 공간 (v, ω) 에서 **현재 속도에서 한 제어 주기 동안 가속 한계로 도달 가능한 창(dynamic window)** 만 후보로 삼는다. 후보마다 짧은 구간을 앞으로 시뮬레이션하고, 충돌하지 않으며 정지 가능한(허용) 후보 중 점수가 가장 높은 것을 고른다. 점수는 보통 목표 방향 정합, 장애물 간격, 속도의 가중합이다.

```python
# 후보 (v, w) 마다: 궤적 시뮬레이션 -> clearance c
if c <= 0 or v > math.sqrt(2 * c * A_DECEL):   # 충돌 또는 정지거리 초과는 제외
    continue
score = W_HEAD * heading + W_CLEAR * min(c, 1.0) + W_VEL * v / V_MAX
```

장애물이 경로를 막는 장난감 시뮬레이션(원형 장애물 반경 0.5 m, 로봇 반경 0.3 m, 가중치 W_HEAD, W_CLEAR, W_VEL):

| 가중치 | 결과 |
| --- | --- |
| 0.2, 0.6, 0.4 | 장애물을 돌아 목표 도달(13.2 s), 최소 간격 0.85 m |
| 0.4, 0.2, 0.4 / 0.6, 0.1, 0.3 | 장애물 앞 0.03 m 에서 정지 |
| 0.3, 0.4, 0.3 / 0.3, 0.6, 0.3 | 장애물 1 m 앞에서 정지(전진 후보가 모두 낮은 점수) |

같은 환경에서 **가중치만 바꿔도 도달·정지·교착이 갈린다**. 이것이 DWA 계열의 튜닝 비용이다. Nav2 의 DWB 는 DWA 를 확장해 점수 항목(critic)과 궤적 생성기를 플러그인으로 바꿀 수 있게 한 것이다.

## 비교

| | Pure Pursuit | DWA / DWB |
| --- | --- | --- |
| 입력 | 전역 경로 + 룩어헤드 | 경로 + 코스트맵 + 속도·가속 한계 |
| 장애물 | 기본은 없음(RPP 는 충돌 검사·감속 추가) | 후보 궤적별 비용으로 회피 |
| 계산량 | 거의 없음 | 후보 수 x 시뮬레이션 길이 |
| 튜닝 | 룩어헤드·속도 | critic 가중치 다수 |
| 약점 | 코너 자르기, 지연 시 진동 | 국소 최소, 가중치 민감 |

모델 기반 최적화로 한 단계 더 가면 [MPC](/develop-wiki/knowledge/robotics/model-predictive-control/) 계열(Nav2 의 MPPI 등)이 된다. 속도 명령 뒤에서는 바퀴·관절 수준 [PID](/develop-wiki/knowledge/robotics/pid-control/) 가 받는다.

## 언제 쓰나

- 경로가 이미 있고 차체가 단순한 차동·자동차형이면 (R)PP. 가볍고 예측하기 쉽다.
- 동적 장애물 회피를 지역 계층에서 직접 풀어야 하면 DWA/DWB 나 MPC 계열.

## 주의/비용

- 둘 다 **지역** 방법이라 막다른 길·U자 지형에서 국소 최소에 빠진다. 전역 재계획과 복구 동작(후진·회전)이 짝이다.
- 룩어헤드·가중치는 로봇 크기·속도·제어 주기에 묶인다. 속도를 올리면 다시 튜닝한다.
- 조향·구동 지연을 모델에 넣지 않으면 시뮬레이션과 실기의 거동이 갈린다. 속도 프로파일은 [궤적 속도 프로파일](/develop-wiki/knowledge/robotics/trajectory-velocity-profile/)에서 따로 다룬다.
- Pure Pursuit 원 논문 PDF(CMU RI-TR-92-01)는 스캔본이라 이 노트의 곡률식은 기하로 직접 유도해 검증했다.

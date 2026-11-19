---
title: Nav2 Graceful 컨트롤러와 Rotation Shim — 부드러운 자세 추종과 제자리 회전 덧대기
aka: [Nav2 Graceful Controller, nav2_graceful_controller, Rotation Shim Controller, nav2_rotation_shim_controller, Smooth Control Law, Egocentric Polar Coordinates, Park-Kuipers Control Law]
category: robotics
group: control
level: advanced
summary: Graceful 은 목표 자세를 극좌표(r, θ, δ)로 보고 슬로 매니폴드와 빠른 조향 서브시스템으로 부드러운 곡선을 만드는 폐형 법칙이고, Rotation Shim 은 경로 방향이 어긋난 출발에서 먼저 제자리 회전한 뒤 다른 컨트롤러에 넘기는 래퍼다.
tags: [robotics, nav2, controller, graceful, rotation-shim, unicycle, lyapunov, polar-coordinates, path-tracking]
related: [robotics/nav2-rpp-mppi-controllers, robotics/pure-pursuit-dwa-local-planning, robotics/nav2-architecture, robotics/nav2-costmap-inflation, robotics/smac-hybrid-astar-state-lattice, robotics/dubins-reeds-shepp-curves, robotics/trajectory-velocity-profile, robotics/behavior-tree-vs-state-machine]
sources:
  - https://web.eecs.umich.edu/~kuipers/papers/Park-icra-11.pdf
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_graceful_controller/README.md
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_rotation_shim_controller/README.md
updatedAt: 2026-11-19
---

> 출처 메모: Park·Kuipers(ICRA 2011) 논문 본문 전체(극좌표 식 (1), 제어 법칙 (13)·(14), 속도 규칙 (15), 목표 전환 (16)·(17), 실험)와 Nav2 저장소의 두 README(main 브랜치)를 읽었다. **docs.nav2.org 설정 페이지는 열리지 않아 읽지 못했고, 컨트롤러 C++ 소스도 읽지 않았다.** 그래서 Nav2 구현이 논문 식을 글자 그대로 쓰는지는 단정하지 않는다. 파라미터 기본값은 README 표 기준이다. 아래 시뮬레이션은 논문 식을 직접 구현한 장난감 실험이며 Nav2 성능이 아니다.

## 문제

[RPP·MPPI](/develop-wiki/knowledge/robotics/nav2-rpp-mppi-controllers/)는 이미 만들어진 경로를 따라간다. 그런데 두 상황에서 아프다.

1. **목표 자세(방향 포함)에 부드럽게 들어가기.** 좁은 경유점에 "이 방향으로 통과" 하라는 요구가 있을 때, 위치만 쫓는 추종기는 마지막에 급하게 꺾는다. 논문이 겨냥한 것은 승객이 타는 휠체어라서 속도·가속도·저크가 모두 한계 안이어야 했다.
2. **출발 방향이 경로와 크게 다름.** NavFn·Theta* 같은 전역 계획은 로봇의 현재 헤딩을 고려하지 않는 경로를 낸다. 그대로 추종기에 넘기면 큰 곡률을 한 번에 만든다.

## 해법 1: Graceful 제어 법칙

논문은 관측자(로봇)에서 목표를 바라보는 시선 기준 **극좌표**를 쓴다. `r` 은 목표까지 거리, `θ` 는 시선에 대한 목표 방향, `δ` 는 시선에 대한 로봇 헤딩이다. 유니사이클 운동학은 다음과 같다(논문 식 (1)).

```
ṙ = -v cos δ
θ̇ = (v / r) sin δ
δ̇ = (v / r) sin δ + ω
```

오차 `(r, θ, δ)` 를 0 으로 보내는 것이 목표다. 핵심은 **두 시간 척도로 나누는** 것이다.

- **느린 서브시스템** `(r, θ)`: 가상 제어로 헤딩 기준을 `δ_ref = arctan(-k1·θ)` 로 둔다. 리아푸노프 함수 `V = (r² + θ²)/2` 가 `v > 0` 이면 `r ≠ 0` 에서 감소한다. 이 곡선은 아르키메데스 나선이고 `k1` 은 θ 가 r 보다 얼마나 빨리 줄어드는지의 비율이다. `k1 = 0` 이면 단순 경유점 추종, 크면 자세 맞추기를 서두른다.
- **빠른 서브시스템** `δ`: `z = δ - arctan(-k1·θ)` 를 `ż = -k2 (v/r) z` 로 지수 수렴시키도록 각속도를 정한다. 결과 곡률은 다음과 같다(식 (14)).

```
κ = -(1/r) · [ k2·(δ - arctan(-k1·θ)) + (1 + k1/(1 + (k1·θ)²)) · sin δ ]
ω = κ · v
```

`κ` 가 `v` 에 의존하지 않으므로 **경로 모양은 속도와 무관**하다. 즉 속도는 자유 변수다. `k2 ≫ 1` 이어야 빠른 서브시스템이 정말 빨라진다는 것이 논문의 전제다. 원점이 전역 점근 안정이려면 `r → 0` 에서 `v → 0` 이어야 한다(예: `v = k3·r`).

논문은 곡률로 속도를 정하는 단순한 규칙을 제안한다(식 (15), "최적화하지 않은 실용 해").

```
v(κ) = v_max / (1 + β·|κ|^λ)     (β > 0, λ > 1)
```

논문의 실험은 `β = 0.4, λ = 2` 를 썼고 이때 `κ = 2`(회전 반경 0.5 m)에서 `v ≈ 0.4·v_max` 다. 목표를 여러 개 이으면 전환 순간 `(r, θ, δ)` 가 불연속이라 가속도·저크가 튄다. 그래서 전환 구간 `τ` 동안 이전·다음 각속도 명령을 시그모이드로 섞는다(식 (16)·(17)). 전환 중에는 선속도를 상수로 둔다.

### Nav2 구현이 이 위에 얹은 것 (README 기준)

README 는 위 법칙을 "모션 타깃" 을 경로 위에서 고르는 방식으로 쓴다고 설명한다.

1. 경로의 `max_lookahead` 지점에서 시작해 로봇 쪽으로 거슬러 오며 후보를 고른다.
2. 후보마다 제어 법칙을 **순방향 시뮬레이션**해 충돌 없이 도달하는 첫 후보를 쓴다.
3. 끝까지 유효한 후보가 없으면(`min_lookahead` 도달) `NoValidControl` 을 내고, 보통 재계획이 일어난다(목표 접근 중에는 해당 없음).
4. 속도가 `footprint_scaling_linear_vel` 이상이면 충돌 검사용 풋프린트를 키우고, 충돌하면 속도를 `footprint_scaling_step` 씩 낮춰 재시도한다.
5. 목표 근처에서 `prefer_final_rotation` 이면 최종 자세를 무시하고 접근하다가 XY 허용오차 안에서 제자리 회전한다.

README 가 적은 주요 기본값: `max_lookahead` 1.0 m, `min_lookahead` 0.25 m, `k_phi` 2.0, `k_delta` 1.0, `beta` 0.4, `lambda` 2.0, `v_linear_min` 0.1, `v_linear_max` 0.5 m/s, `v_angular_max` 1.0 rad/s, `slowdown_radius` 1.5 m, `deceleration_max` 2.5 m/s², `initial_rotation` true(허용 0.75 rad), `allow_backward` false. README 는 `k_phi`·`k_delta` 가 논문 초기 판의 `k1`·`k2` 라고 하며, 목표 근처 속도 한계를 `v = sqrt(2·dist·deceleration_max)` 로 적는다. `initial_rotation` 과 `allow_backward` 는 동시에 켤 수 없다.

### 직접 확인: 논문 식을 시뮬레이션

논문 식 (13)·(15)와 `v ≤ k3·r` 로 점 로봇이 원점·헤딩 0 목표로 가는 것을 적분했다(`k1 = 2, β = 0.4, λ = 2, v_max = 0.5, k3 = 1, dt = 0.01`). 네 가지 출발 자세에서 모두 목표 반경 0.02 m 안에 들어왔고, 그때 헤딩 오차는 0.01 rad 이하였다. `k2` 만 바꿔 본 결과는 이렇다.

| 출발 자세 (x, y, 헤딩) | k2 = 1 최대 \|κ\| | k2 = 3 | k2 = 10 |
| --- | --- | --- | --- |
| (-3, 0, 0) 정면 | 0 | 0 | 0 |
| (-2, 2, -2.83) 반대쪽 | 1.0 | 1.6 | 4.2 |

`k2` 가 클수록 헤딩이 슬로 매니폴드로 빨리 돌아오지만 **초기 곡률이 커진다**(`v(κ)` 규칙이 속도를 깎아 받아낸다). 곡률 규칙 쪽도 확인했다. `κ·v / v_max` 의 최댓값은 `κ = 1/√β ≈ 1.58` 에서 0.791 이며 논문이 말하는 `π/4 ≈ 0.785` 와 근사하게 맞지만 정확히 같지는 않다. `v(2)/v_max = 0.385` 로 논문의 "≈ 0.4" 와 일치한다.

## 해법 2: Rotation Shim

Rotation Shim 은 독립 컨트롤러가 아니라 **주 컨트롤러를 감싸는 래퍼**다. README 의 동작은 다음과 같다.

1. 새 경로가 오면 로봇 헤딩과 경로 방향(`forward_sampling_distance` 앞 지점) 차이를 본다.
2. 차이가 `angular_dist_threshold` 이하면 주 컨트롤러(RPP, MPPI, DWB, TEB 등)에 그대로 넘긴다.
3. 크면 제자리 회전한다(속도 `rotate_to_heading_angular_vel`, 가속 제한 `max_angular_accel`).
4. 차이가 `angular_disengage_threshold` 안으로 들어오면 **아직 회전 중인 채로** 주 컨트롤러에 넘긴다.
5. `rotate_to_goal_heading` 이면 목표 근처에서 다시 개입해 목표 헤딩까지 돈다.

`simulate_ahead_time` 동안의 회전을 미리 충돌 검사하고, 충돌이 보이면 제어를 주 컨트롤러에 돌려준다. `closed_loop` 가 false 면 마지막 명령 속도를 현재 속도로 쓰고, true 면 오도메트리를 쓰므로 빠르고 지연 낮은 오도메트리가 필요하다. `use_path_orientations` 는 Smac 처럼 경로에 방향이 들어 있는 플래너용이다.

README 는 이것이 제자리 회전이 가능한 로봇(차동·전방향)용이며, NavFn·Theta*·Smac 2D 처럼 현재 헤딩을 모르는 경로에 유용하다고 한다. 반대로 [Smac Hybrid-A*·State Lattice](/develop-wiki/knowledge/robotics/smac-hybrid-astar-state-lattice/)는 헤딩에서 출발하는 경로를 내므로 대개 필요 없다고 적는다.

## 언제 쓰나

- **Graceful**: 경유점·목표에 **방향까지 맞춰** 부드럽게 들어가야 하고(도킹 접근, 복도 진입), 속도·가속도 한계를 곡률 규칙으로 간단히 지키고 싶을 때. 폐형이라 계산이 가볍다.
- **Rotation Shim**: 전역 경로가 로봇 헤딩과 자주 어긋나고 로봇이 제자리 회전을 할 수 있을 때. 어떤 주 컨트롤러와도 조합된다.

## 주의/비용

- **`1/r` 항.** 논문은 목표에 가까워질 때 `1/r` 이 위치 추정 잡음을 증폭한다고 경고한다. 중간 목표는 전환 거리를 충분히 크게, 마지막 목표는 `v ∼ r` 로 줄여 상쇄하라고 한다.
- **운동학 수준 제어.** 논문 스스로 "기저 동역학 제어기가 충분히 빨라야 한다"는 조건을 둔다. 속도 명령에 지연·가속 한계가 큰 로봇은 이상적인 곡선을 못 따른다.
- **장애물 회피가 아니다.** Graceful 은 후보를 시뮬레이션해 충돌 후보를 버릴 뿐 능동적으로 돌아가지 않는다. 막히면 `NoValidControl` 로 재계획에 맡겨진다([행동 트리](/develop-wiki/knowledge/robotics/behavior-tree-vs-state-machine/)).
- **게인 선택.** README 기본 `k_delta` 1.0 은 논문의 `k2 ≫ 1` 전제와 거리가 있고, Nav2 가 같은 식을 쓰는지 확인하지 못했다. 현장 튜닝 시 초기 곡률(위 표)과 속도 규칙을 함께 본다.
- **Shim 의 인계 속도.** README 는 인계 때 로봇이 아직 도는 중이라 그 각속도가 주 컨트롤러의 최대 각속도를 넘으면 안 된다고 경고한다(기본값 기준 약 1.59 rad/s 라고 적었으나 이 노트에서 검증하지 않았다). `angular_disengage_threshold` 를 작게 하면 정지 후 추종처럼 되고 크게 하면 부드럽지만 덜 정밀하다.
- **Shim 의 한계.** 제자리 회전이 불가능한 아커만 형태 로봇에는 맞지 않는다.

## 비교

| 구분 | Graceful | Rotation Shim | RPP ([관련](/develop-wiki/knowledge/robotics/nav2-rpp-mppi-controllers/)) |
| --- | --- | --- | --- |
| 역할 | 단독 컨트롤러 | 래퍼(앞단 정렬) | 단독 컨트롤러 |
| 핵심 | 극좌표 폐형 법칙 + 곡률 속도 | 헤딩 오차 임계로 회전→인계 | 룩어헤드 원호 + 곡률·근접 감속 |
| 최종 자세 | 맞추도록 설계 | 목표 헤딩 회전 옵션 | 이 노트에서 확인 안 함 |
| 후진 | `allow_backward` (initial_rotation 과 배타) | 경로 방향 기준 | 경로 첨점에서 방향 전환 |

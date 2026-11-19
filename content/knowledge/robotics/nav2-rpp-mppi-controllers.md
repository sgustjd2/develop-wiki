---
title: Nav2 컨트롤러 비교 — Regulated Pure Pursuit 와 MPPI
aka: [RPP, Regulated Pure Pursuit, MPPI, Model Predictive Path Integral, nav2_mppi_controller, Information Theoretic MPC, Nav2 Controller]
category: robotics
group: control
level: advanced
summary: RPP 는 경로의 곡률·장애물 거리로 속도를 줄여 가며 경로를 따르는 기하학적 추종기이고, MPPI 는 노이즈를 섞은 제어열 수천 개를 굴려 비용 가중 평균으로 갱신하는 샘플링 MPC 다. 설정 부담과 연산량이 반대 방향이다.
tags: [robotics, nav2, controller, rpp, mppi, pure-pursuit, sampling-mpc, path-tracking, tuning]
related: [robotics/pure-pursuit-dwa-local-planning, robotics/model-predictive-control, robotics/nav2-architecture, robotics/nav2-costmap-inflation, robotics/smac-hybrid-astar-state-lattice, robotics/dubins-reeds-shepp-curves, robotics/trajectory-velocity-profile]
sources:
  - https://arxiv.org/abs/2305.20026
  - https://arxiv.org/abs/1707.02342
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/controller_plugins/configuring_regulated_pp.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/controller_plugins/mppi_controller/configuring_mppic.md
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_mppi_controller/README.md
updatedAt: 2026-11-19
---

> 출처 메모: RPP 논문(Macenski 외, arXiv 2305.20026 PDF 본문), MPPI 원 논문(Williams 외, arXiv 1707.02342 PDF 본문)의 알고리즘·중요도 샘플링·실용 절, Nav2 문서 두 쪽(rolling 브랜치 원문 마크다운)과 `nav2_mppi_controller` README 를 읽었다. 컨트롤러 소스 코드와 MPPI 비평가(critic)별 수식은 읽지 못했다. 기본값은 rolling 문서 기준이라 배포판마다 다를 수 있다. 아래 수치 실험은 직접 만든 장난감 모형이며 Nav2 구현의 성능이 아니다.

## 문제

전역 경로가 나와도 로봇은 그것을 **속도 명령으로** 바꿔야 한다. 이때 두 요구가 부딪힌다. 서비스·물류 로봇은 모퉁이와 좁은 통로에서 속도를 줄여야 안전하고, 동시에 경로에서 벗어나거나 장애물을 쓸고 지나가면 안 된다. [Pure Pursuit·DWA 노트](/develop-wiki/knowledge/robotics/pure-pursuit-dwa-local-planning/)가 기본 아이디어를 다뤘다면, 여기서는 Nav2 의 두 현대 컨트롤러가 이 문제를 **정반대 방식**으로 푸는 것을 비교한다.

## 해법 1: Regulated Pure Pursuit (RPP)

Pure Pursuit 는 앞쪽 경로의 한 점(룩어헤드 점)을 정하고 그곳으로 가는 원호의 곡률 κ 를 구해 `ω = v·κ` 로 각속도를 낸다. 논문은 고전형의 약점을 두 가지 든다. 고곡률에서 넘어서거나 모자라게 돈다는 점, 그리고 속도 지정이 없어 사실상 일정 속도를 쓰는데 이를 안전하지 않은 관행이라고 평가한다는 점이다. RPP 의 추가분은 다음과 같다.

- **룩어헤드 적응**: `L = v · lookahead_time`(속도에 비례). 느릴 때 짧게, 빠를 때 길게.
- **곡률 규제**: 곡률 반경이 `r_min` 보다 작아지면 속도를 `v' = v / (r_min · κ)` 로 줄인다. 반경이 `r_min` 의 절반이면 속도도 절반이다.
- **근접 규제**: 장애물까지 거리 `d_O` 가 `d_prox` 이하이면 `v' = α · v · d_O / d_prox`(α ≤ 1). 논문은 지수·이차 형태도 시험했으나 장애물 근처를 지나치게 억제하고 쓸 만한 이득 범위가 좁아서 선형을 택했다고 한다.
- **각속도는 규제 후 속도로**: `ω = v'κ`. 원래 속도로 계산하면 규제 때문에 목표 곡률에 못 미치게 돈다.
- **충돌 예측**: 지금 명령을 시간 T 동안 원호로 투영해 비용 지도 해상도 간격으로 검사하고 닿으면 정지한다. 룩어헤드 점까지가 아니라 **시간**으로 검사해 좁은 곳의 미세 이동을 막지 않는다.

Nav2 의 기본값(rolling 문서)은 `lookahead_dist` 0.6 m(`min` 0.3, `max` 0.9), `lookahead_time` 1.5 s, `use_velocity_scaled_lookahead_dist` false, `regulated_linear_scaling_min_radius` 0.9 m, `regulated_linear_scaling_min_speed` 0.25 m/s, `cost_scaling_dist` 0.6 m, `cost_scaling_gain` 1.0, `max_allowed_time_to_collision_up_to_carrot` 1.0 s, `approach_velocity_scaling_dist` 0.6 m 이다. 문서는 `cost_scaling_dist` 가 인플레이션 반경 이하여야 한다고 하는데, 거리 계산에 [코스트맵 인플레이션](/develop-wiki/knowledge/robotics/nav2-costmap-inflation/) 값을 쓰기 때문이다. 논문의 `r_min`·`d_prox`·α 가 위 파라미터에 어떻게 대응하는지는 소스를 읽지 못해 단정하지 않는다.

기본 `r_min` 0.9 m, 선속도 0.5 m/s 에서 규제식을 직접 계산하면 다음과 같다(최소 속도 0.25 로 바닥 처리).

| 곡선 반경 | 규제 후 속도 |
| --- | --- |
| 3.0 m, 0.9 m | 0.5 (규제 없음) |
| 0.6 m | 0.333 |
| 0.45 m | 0.25 |
| 0.3 m | 0.167 → 0.25 로 바닥 처리 |

논문은 RPP 가 일반 Pure Pursuit 계열의 안정성 분석을 상속한다고 한다(직선·정곡률 경로에서 수렴). 속도 규제는 `ω = vκ` 의 구조를 바꾸지 않기 때문이다. 동역학은 모형화하지 않는다.

## 해법 2: MPPI

MPPI(Williams 외)는 비용 함수와 동역학이 미분 가능할 필요가 없는 **샘플링 MPC** 다. 각 제어 주기마다 다음을 한다.

1. 직전 최적 제어열 `U` 에 가우시안 노이즈 `ε_k` 를 더해 K 개의 후보를 만든다.
2. 각 후보를 동역학 모형으로 굴려 궤적을 얻고 총비용 `S_k` 를 구한다.
3. 가중치 `w_k ∝ exp(-(S_k - ρ)/λ)` 로 노이즈를 평균해 `U ← U + Σ w_k ε_k` 로 갱신한다. `ρ` 는 최소 비용으로, 가장 좋은 궤적의 가중이 0 이 되지 않도록 비용을 평행 이동하는 수치 안정화다(논문의 실용 항목).
4. 첫 제어만 적용하고 나머지를 한 칸 밀어 다음 주기 초기값으로 쓴다.

λ 는 온도다. 작으면 가장 좋은 샘플 하나만 따르고, 크면 단순 평균에 가까워진다(논문의 그림 설명). 논문은 최적 분포의 기댓값을 몬테카를로로 추정하므로 샘플이 부족하면 "국소 최소" 처럼 보이는 현상이 생긴다고 쓴다. 보고된 구현은 GPU 에서 수천 샘플, 2~3초 궤적으로 40~60 Hz 를 냈다.

Nav2 구현(`nav2_mppi_controller`)은 이 알고리즘을 컨트롤러 플러그인으로 만든 것이다. 문서·README 가 확인해 주는 기본값은 `batch_size` 1000, `time_steps` 56, `model_dt` 0.05 s(즉 예측 2.8 s), `temperature` 0.3, `gamma` 0.015, `vx_std`·`vy_std` 0.2, `wz_std` 0.4(README·소스 기준이며 설정 문서 페이지에는 0.2 로 적혀 있어 문서 쪽 오기로 보인다), `vx_max` 0.5, `iteration_count` 1, 운동 모델 `DiffDrive`(`Omni`, `Ackermann` 도 제공)이다. 비용은 플러그인 **비평가(critic)** 목록으로 정한다. README 가 소개하는 것은 제약, 목표(위치·각), 경로(정렬·추종·각), 비용지도 또는 장애물 거리, 전진 선호, 데드밴드, 트월링 방지 등이다. 같은 README 는 `iteration_count` 는 1 로 두고 배치를 늘리는 편을 권하고, 예측 거리(`time_steps·model_dt·vx_max`)를 코스트맵 크기 안에 두라고 한다. 기본값으로 계산하면 예측 거리는 1.4 m 다. 시각화(`visualize`)는 크게 느려진다고 경고한다. README 는 AVX2·FMA 지원 CPU 가 필요하다고도 적는다.

장난감 실험으로 λ 의 의미를 확인했다. 2차원 점 로봇이 목표를 향하면서 원형 장애물을 피하는 문제(주기 30스텝, 샘플 1000개, 노이즈 σ 0.4)에서 한 번 갱신한 결과다. 비용 단위가 임의이므로 λ 값 자체는 Nav2 의 0.3 과 비교할 수 없다.

| λ | 유효 샘플 수(1/Σw²) / 1000 | 한 번 갱신 후 비용(영 제어 9.00) |
| --- | --- | --- |
| 0.01 | 1.2 | 8.03 |
| 0.1 | 11 | 8.15 |
| 0.3 | 147 | 8.57 |
| 1 | 423 | 8.86 |
| 100 | 998 | 9.00 (평균 ≈ 갱신 없음) |

λ 가 너무 작으면 사실상 샘플 한 개만 쓰여 갱신이 샘플 운에 좌우되고(유효 샘플 1), 너무 크면 갱신이 사라진다. 유효 샘플 수는 튜닝 때 볼 만한 지표라는 것이 이 실험의 교훈이다.

## 비교

| 구분 | RPP | MPPI |
| --- | --- | --- |
| 원리 | 기하(원호 추종) + 선형 속도 규제 | 샘플링 기반 최적 제어, 비용 함수 자유 |
| 입력 | 경로 한 줄 + 코스트맵 | 경로 + 코스트맵 + 동역학 모형 |
| 장애물 | 투영 원호 충돌 검사로 정지, 근접 감속 | 궤적 비용에 포함해 회피 시도 |
| 연산량 | 매우 작음 | 샘플 수·예측 길이에 비례, README 가 AVX2 요구 |
| 튜닝 | 파라미터 수 적고 의미 직관적 | 비평가 가중치·노이즈·온도·지평선 상호작용 |
| 동역학 | 무시 | 모형에 따라 반영(가속 한계, 지연 모델 파라미터) |

## 언제 쓰나

- **RPP**: 전역 계획이 이미 주행 가능한 경로를 주고(예: [Smac Hybrid](/develop-wiki/knowledge/robotics/smac-hybrid-astar-state-lattice/) 의 Dubins·Reeds-Shepp 경로), 컨트롤러는 작고 예측 가능했으면 할 때. 후진 경로도 첨점에서 방향을 바꿔 추종한다(논문의 구현 절).
- **MPPI**: 동적 장애물이 많거나 운동 모델(아커만·전방향)의 한계를 반영한 회피가 필요하고, 연산 여유가 있을 때. 비용 설계를 비평가로 바꿔 끼울 수 있다.

## 주의/비용

- **RPP 는 능동 회피가 없다.** 감속·정지만 한다. 좁은 곳에서 길이 막히면 멈춘 채 [행동 트리](/develop-wiki/knowledge/robotics/behavior-tree-vs-state-machine/)의 복구에 맡겨진다.
- **RPP 규제 속도에는 바닥이 있다.** 파라미터 설정이 나쁘면 비현실적으로 느려진다(논문이 바닥값을 둔 이유). 충돌 예측 창은 롤링 코스트맵 밖으로 나가면 안 된다.
- **MPPI 의 결과는 확률적이다.** 같은 입력에서도 주기마다 달라지고, 샘플이 모자라면 비일관적이 된다. README 는 `regenerate_noises` 를 끄면 주기별 연산 변동이 줄어든다고 설명한다.
- **MPPI 튜닝의 상호의존.** README 는 장애물 비평가와 경로 비평가의 균형, 반발 가중치와 인플레이션 반경의 반비례 관계를 조심하라고 한다. 균형이 틀리면 약간 비용이 있는 곳에는 들어가지 않으려 한다.
- **지평선과 코스트맵.** README 는 MPPI 예측 거리가 코스트맵보다 길면 코스트맵이 속도와 거동을 제한한다고 한다. RPP 의 충돌 예측 창도 같은 이유로 롤링 코스트맵 안에 있어야 한다.
- 장난감 실험의 한계: 노이즈 평균과 λ 의 정성적 거동만 보여 준다. Nav2 비평가나 실제 로봇 성능과 무관하다.

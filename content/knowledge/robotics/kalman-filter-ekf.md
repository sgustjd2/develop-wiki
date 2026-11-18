---
title: 칼만 필터와 EKF
aka: [Kalman Filter, Extended Kalman Filter, EKF, Bayes Filter, State Estimation]
category: robotics
group: estimation
level: intermediate
summary: 잡음 있는 측정과 운동 모델을 가우시안 가정으로 결합해 상태와 불확실성을 함께 추정하는 필터. 선형은 칼만 필터, 비선형은 EKF 로 선형화해 쓴다.
tags: [robotics, estimation, kalman-filter, ekf, sensor-fusion, gaussian]
related: [robotics/particle-filter-mcl, robotics/sensor-fusion-time-sync, robotics/slam-concepts, robotics/state-feedback-lqr, robotics/rotation-representations]
sources:
  - https://en.wikipedia.org/wiki/Kalman_filter
  - https://www.ros.org/reps/rep-0103.html
  - http://robots.stanford.edu/papers/thrun.graphslam.pdf
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
updatedAt: 2026-11-19
---

## 문제

센서는 잡음이 있고 가끔 틀린다. 모델로 예측한 값도 오차가 있다. 둘 중 어느 쪽을 얼마나 믿고 합칠까? 평균을 내거나 이동평균을 걸면 지연이 생기고, 센서마다 신뢰도가 다르다는 점을 반영하지 못한다.

## 왜 중요한가 (로봇 개발 관점)

- 위치 추정(GPS+IMU+휠 오도메트리), 자세 추정(IMU), 물체 추적의 기본 도구다. ROS 의 `robot_localization` 같은 패키지가 EKF/UKF 로 오도메트리를 융합한다.
- 출력이 값과 함께 **공분산**(불확실성)이라, 하위 모듈이 "얼마나 믿을지"를 판단할 수 있다. ROS 메시지가 공분산 필드를 가진 이유다(REP-103 의 covariance 표현).

## 해법

상태 `x`(평균)와 불확실성 `P`(공분산)를 들고, 두 단계를 반복한다.

**예측** (모델로 앞으로 미룸, 불확실성 증가)
```
x ← F x            P ← F P Fᵀ + Q
```
**갱신** (측정으로 보정, 불확실성 감소)
```
S = H P Hᵀ + R     K = P Hᵀ S⁻¹
x ← x + K (z − H x)    P ← (I − K H) P
```

`K`(칼만 이득)가 핵심이다. 측정 잡음 `R` 이 작으면 측정을 더 믿고, 모델 잡음 `Q` 가 작으면 예측을 더 믿는다. 모델이 선형이고 잡음이 가우시안이면 평균제곱오차 의미에서 최적이다(Wikipedia 칼만 필터).

```python
import numpy as np
dt = 0.1; F = np.array([[1, dt], [0, 1.]]); H = np.array([[1., 0]])      # 상태 = (위치, 속도)
Q = np.diag([1e-4, 1e-2]); R = np.array([[0.5**2]])
xh = np.zeros(2); P = np.eye(2)
def step(xh, P, z):
    xh = F @ xh; P = F @ P @ F.T + Q                       # 예측
    S = H @ P @ H.T + R; K = P @ H.T @ np.linalg.inv(S)
    xh = xh + (K @ (z - H @ xh)).ravel(); P = (np.eye(2) - K @ H) @ P   # 갱신
    return xh, P
```

시뮬레이션(등속 이동체, 위치 측정 표준편차 0.5)에서 필터 위치 RMSE 가 0.22, 측정값 자체의 RMSE 는 0.49 였다. 속도를 직접 재지 않아도 위치 열에서 속도가 추정된다. 단일 시드 실험이라 절대값보다 방향성(측정만 쓸 때보다 오차가 줄어듦)만 참고한다.

## EKF

비선형 모델 `x' = f(x)`, `z = h(x)` 는 현재 추정 주변에서 1차 선형화(야코비안)해 `F`, `H` 대신 쓴다.

- 주행 로봇 위치(x, y, θ)는 θ 에 대해 비선형이므로 EKF 가 표준이다.
- 자세 추정에서는 쿼터니언 상태의 오차를 3차원 오차 상태(error-state)로 따로 두는 변형(ESKF)을 흔히 쓴다([회전 표현](/develop-wiki/knowledge/robotics/rotation-representations/)).
- UKF 는 야코비안 대신 시그마 점으로 비선형을 통과시켜 평균·공분산을 근사한다. 야코비안을 직접 구하기 어려울 때 쓴다.

## 비교

| | 칼만 필터 | EKF | UKF | 파티클 필터 |
| --- | --- | --- | --- | --- |
| 분포 가정 | 가우시안 | 가우시안(선형화) | 가우시안(시그마 점) | 제한 없음(다봉 가능) |
| 모델 | 선형 | 약비선형 | 비선형 | 임의 |
| 비용 | 낮음 | 낮음 | 중간 | 표본 수에 비례 |
| 대표 용도 | 추적, 센서 융합 | 이동 로봇 위치, IMU | 강한 비선형 | 전역 위치 추정([MCL](/develop-wiki/knowledge/robotics/particle-filter-mcl/)) |

## 언제 쓰나

- 측정이 연속적이고 오차가 대략 단봉 가우시안인 상태 추정(위치·속도·자세).
- 서로 다른 속도·정확도를 가진 센서 융합(IMU 고속+저정확, GPS 저속+고정확)([센서 퓨전](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)).
- LQR 같은 상태 피드백 제어기에 상태를 공급할 때([LQR](/develop-wiki/knowledge/robotics/state-feedback-lqr/)).

## 주의/비용

- **`Q`, `R` 튜닝이 성능을 가른다.** 너무 작게 잡으면 필터가 과신해 측정을 무시하고 발산한다(필터 일관성 문제). 혁신(`z − Hx`) 통계가 `S` 와 맞는지 점검(NIS)한다.
- **선형화 오차**: 초기 추정이 크게 틀리거나 비선형이 강하면 EKF 가 발산한다. 다봉 분포(로봇이 어디인지 모름)는 가우시안으로 표현 못 한다.
- **수치 안정성**: `P` 가 대칭·양의 정부호를 잃을 수 있다. 조셉 형식이나 제곱근 필터를 쓴다.
- **측정 이상치**: 한 번의 튀는 값이 상태를 끌고 간다. 마할라노비스 거리로 게이팅한다.
- **타임스탬프**: 측정이 늦게 도착하면 과거 상태로 돌아가 다시 적용하거나 지연을 보상해야 한다.
- **상관된 잡음**: 같은 상태를 공유하는 센서 출력을 이중으로 쓰면 불확실성을 과소평가한다(중복 사용).

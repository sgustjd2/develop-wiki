---
title: IMU 자세 추정 — Madgwick 필터
aka: [Madgwick Filter, AHRS, Orientation Filter, Complementary Filter, Gradient Descent Filter, IMU Fusion]
category: robotics
group: estimation
level: intermediate
summary: 자이로 적분(빠르지만 드리프트)과 가속도계의 중력 방향(느리지만 절대)을 쿼터니언 하나로 합치는 경량 자세 필터. 이득 beta 하나가 두 센서의 신뢰 균형을 정한다.
tags: [robotics, estimation, imu, madgwick, ahrs, quaternion, sensor-fusion]
related: [robotics/rotation-representations, robotics/kalman-filter-ekf, robotics/sensor-fusion-time-sync, robotics/coordinate-frames-tf, graphics-xr/quaternion-3d-rotation, graphics-xr/six-dof-inside-out-tracking-slam]
sources:
  - https://courses.cs.washington.edu/courses/cse466/14au/labs/l4/madgwick_internal_report.pdf
  - https://ahrs.readthedocs.io/en/latest/filters/madgwick.html
  - https://reps.openrobotics.org/rep-0145/
updatedAt: 2026-11-19
---

## 문제

자이로는 각속도를 주므로 적분하면 자세가 나오지만 바이어스와 잡음이 같이 적분돼 시간이 갈수록 틀어진다. 가속도계는 정지 상태에서 중력 방향, 즉 롤·피치의 절대 기준을 주지만 로봇이 가속하면 중력과 섞여 틀린다. 두 센서의 약점이 정반대라 합치면 좋다. 칼만 필터([EKF](/develop-wiki/knowledge/robotics/kalman-filter-ekf/))도 되지만, 임베디드 MCU 에서 공분산을 굴리기는 무겁고 튜닝 항목이 많다.

## 해법

Madgwick 의 2010 보고서는 쿼터니언 자세 추정을 **경사 하강 한 스텝** 문제로 푼다. 아이디어는 두 갈래의 합이다.

1. 자이로로 쿼터니언을 적분한 변화율 `0.5 · q ⊗ (0, ω)`.
2. 현재 자세 q 가 예측하는 "센서 좌표계에서 본 중력" 과 가속도계 측정의 차이를 목적함수로 보고, 그 기울기 방향의 **정규화된** 한 스텝을 `beta` 만큼 빼서 자세를 측정 쪽으로 당긴다.

```python
def madgwick_imu(q, gyro, acc, beta, dt):
    q0, q1, q2, q3 = q
    qd = tuple(0.5 * c for c in qmul(q, (0.0, *gyro)))        # 자이로 항
    ax, ay, az = (a / norm(acc) for a in acc)
    f1 = 2*(q1*q3 - q0*q2) - ax                               # 예측 중력 - 측정
    f2 = 2*(q0*q1 + q2*q3) - ay
    f3 = 2*(0.5 - q1*q1 - q2*q2) - az
    g = (-2*q2*f1 + 2*q1*f2,  2*q3*f1 + 2*q0*f2 - 4*q1*f3,    # Jᵀ f
         -2*q0*f1 + 2*q3*f2 - 4*q2*f3,  2*q1*f1 + 2*q2*f2)
    qd = tuple(qd[i] - beta * g[i] / norm(g) for i in range(4))
    return normalize(tuple(q[i] + qd[i] * dt for i in range(4)))
```

(`qmul`, `norm`, `normalize` 는 쿼터니언 곱·노름·정규화 헬퍼. 위 식을 순수 Python 으로 구현해 아래 실험을 돌렸다.)

`beta` 는 자이로 오차를 쿼터니언 변화율 크기로 나타낸 값으로, 가속도계 보정을 얼마나 세게 믿을지 정한다.

### 실험: beta 의 효과

정지한 센서. 자이로에 바이어스 0.05 rad/s(x축)와 잡음, 가속도계에 잡음 0.02 g, 초기 자세 추정은 일부러 45도 틀리게 시작, 100 Hz, 60 초.

| beta | 10초 뒤 기울기 오차 | 60초 뒤 오차 |
| --- | --- | --- |
| 0 (자이로만) | 73.5도 | 143.1도 |
| 0.01 | 65.6도 | 166.0도 (바이어스를 못 따라감) |
| 0.1 | 0.2도 | 0.22도 |
| 0.5 | 약 0.7~1.3도 | 1.57도 (가속도계 잡음을 많이 받아들임) |

또 가속 외란(2 s 동안 수평 0.5 g, 자이로는 정지)을 주면 롤/피치 오판이 beta 0.01 에서 2.2도, 0.1 에서 22.1도, 0.5 에서 27.5도였다. **beta 를 키우면 수렴과 바이어스 흡수가 빨라지는 대신 선형 가속에 쉽게 속는다.** 수치는 이 설정의 예시다.

## 한계: 요(yaw)

가속도계만으로는 중력 축 둘레의 회전(요)을 알 수 없다. IMU 6축 버전은 요가 자이로 적분이라 계속 흐른다. 요 기준은 자력계(9축 MARG 버전, 자기 왜곡 보상 포함)나 카메라·LiDAR 등 외부 정보가 필요하다.

## 언제 쓰나

- 드론·핸드헬드·헤드셋의 롤·피치 안정화처럼 계산 예산이 작고 모델이 거의 없는 자세 추정.
- 위치까지 필요한 로봇에서는 이 출력을 오도메트리/EKF 의 입력(자세 관측)으로 넘기는 전처리로.

## 주의/비용

- 가속 중에는 가속도계 보정이 틀린다. 가속이 큰 구간에서는 beta 를 낮추거나 `|acc| ≈ 1 g` 가 아닐 때 보정을 끄는 등의 게이팅을 직접 넣는다.
- 자이로 바이어스를 상태로 추정하지 않는다(EKF 는 한다). 바이어스가 크고 beta 가 작으면 위 표처럼 못 따라간다. 시동 때 정지 상태로 바이어스를 측정해 빼는 것이 일반적이다.
- 샘플 주기 `dt` 가 실제와 다르면 적분이 틀린다. 타임스탬프를 쓰고 [시간 동기화](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)를 확인한다.
- 축·단위·좌표계 규약을 ROS 와 맞춘다(IMU 드라이버 규약은 REP-145 이며 초안 상태). 단위 쿼터니언 정규화 누락은 서서히 발산을 만든다([회전 표현](/develop-wiki/knowledge/robotics/rotation-representations/)).
- 필터의 이득값 권장 범위는 구현체마다 다르다. 이 노트의 beta 표는 위 실험 설정에서만 의미가 있고 일반 권장값이 아니다.

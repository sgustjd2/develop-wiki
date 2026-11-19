---
title: 카메라-IMU 시간 오프셋 온라인 보정 — 특징점 속도로 관측을 시간 이동
aka: [Camera-IMU Temporal Calibration, Time Offset Estimation, Online Temporal Calibration, td Estimation, Feature Velocity Shift]
category: robotics
group: estimation
level: advanced
summary: 카메라와 IMU 시계가 일정한 시간 td 만큼 어긋나면 비주얼-관성 추정이 틀어진다. Qin·Shen 의 방법은 특징점의 이미지 속도로 관측을 td 만큼 밀어 재투영 잔차에 넣고, td 를 상태에 포함해 슬라이딩 윈도 최적화에서 함께 푼다.
tags: [robotics, vio, time-offset, temporal-calibration, camera-imu, sensor-fusion, vins-mono, kalibr]
related: [robotics/sensor-fusion-time-sync, robotics/vio-accel-bias-extrinsic-observability, robotics/vio-initialization-observability, robotics/imu-preintegration, robotics/factor-graph-slam-optimization, robotics/coordinate-frames-tf]
sources:
  - https://arxiv.org/abs/1808.00692
  - https://ar5iv.labs.arxiv.org/html/1808.00692
updatedAt: 2026-11-19
---

> 출처 메모: Qin·Shen, "Online Temporal Calibration for Monocular Visual-Inertial Systems"(IROS 2018, arXiv 1808.00692)의 방법·실험 절을 ar5iv HTML 을 처음에는 요약 도구로 거쳐 읽었고, 독립 팩트체크가 ar5iv 전문과 대조해 식(1·2·4·7)과 표 수치가 일치함을 확인했다(2026-11-19). 논문 인쇄식은 식 1 이 `t_IMU = t_cam + t_d`, 식 4 가 `z + t_d·V` 인데, 공개 구현 VINS-Mono 의 `projection_td_factor.cpp` 는 `pts_i - (td - td_i + TR/ROW*row_i) * velocity_i` 로 부호가 마이너스다. **인쇄식을 그대로 구현하면 부호를 혼동하기 쉬우니 구현에서는 부호 규약을 따로 확인해야 한다.** Li·Mourikis(IJRR 2014, EKF 기반 시간 오프셋 보정), Kelly·Sukhatme, Kalibr 의 시간 보정 논문은 읽지 않았다. 표의 수치는 요약본에서 옮긴 것이다. "직접 확인" 절은 직접 만든 1차원 모형이고 논문 실험의 재현이 아니다.

## 문제

카메라 이미지의 타임스탬프와 IMU 타임스탬프는 같은 순간을 가리키지 않는다. 트리거 지연, 전송 지연, 시계 불일치 때문이다. 어긋남을 모르고 융합하면 시간 오프셋이 외부 파라미터(회전·이동)와 자세 오차로 흡수된다([센서 융합·시간 동기](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/), [외부 파라미터 관측성](/develop-wiki/knowledge/robotics/vio-accel-bias-extrinsic-observability/)). 하드웨어 동기화가 없거나 노출 시간이 변하면 오프셋은 장비마다, 때로는 실행마다 다르다. 오프라인 보정(체스보드 + Kalibr 류)은 장비가 바뀔 때마다 다시 해야 한다.

## 해법 (Qin·Shen)

### 가정

- 오프셋 `t_d` 는 **일정하지만 모르는 값**이다. 논문은 `t_IMU = t_cam + t_d`(식 1)로 정의하고 `t_d` 가 음수일 수도 있다고 한다. 시간에 따라 흘러 가는(drift) 오프셋은 범위 밖이라고 밝힌다.
- 매우 짧은 시간(수 ms) 동안 카메라가 등속으로 움직이므로 특징점이 이미지 위에서 **등속 직선**으로 움직인다.

### 핵심 아이디어

1. 연속 두 프레임 `k, k+1` 의 특징 `l` 의 이미지 속도를 유한 차분으로 구한다: `V_l^k = (z_l^{k+1} − z_l^k) / (t_{k+1} − t_k)`(식 2).
2. 재투영 잔차의 관측을 `t_d` 만큼 시간 이동해 넣는다: `z_l^k(t_d) = z_l^k + t_d · V_l^k`(식 4). 이미지나 IMU 열 전체를 옮기는 대신 **관측 값만** 이동한다.
3. 상태에 `t_d` 를 포함한다: `X = [x_0 … x_n, P_0 … P_l, t_d]`. 슬라이딩 윈도 지역 BA 에서(VINS-Mono 위에 구현, Ceres) 주변화 사전 정보·IMU 프리인테그레이션 잔차·이 비전 잔차를 합쳐 가우스-뉴턴 계열로 푼다.
4. **보상 절차**: 최적화마다 이후 영상의 타임스탬프를 현재 추정 `t_d` 만큼 옮기고, 남은 `δt_d` 를 다시 추정한다. 논문은 이를 coarse-to-fine 이라 설명한다. 등속 가정은 `δt_d` 가 작을수록 정확해지므로 처음에 수백 ms 어긋나 있어도 점차 수렴한다는 논리다.

```ts
// 관측 이동 (식 4 의 구조): z 는 픽셀, V 는 픽셀/초
const shifted = (z: [number, number], V: [number, number], td: number): [number, number] =>
  [z[0] + td * V[0], z[1] + td * V[1]];
// 잔차 = shifted(z, V, td) − project(pose_k, landmark)  → td 는 이 잔차의 야코비안으로 최적화
```

### 논문이 보고한 것 (요약본 기준)

- **시뮬레이션**: 특징 500 개, 픽셀 잡음 0.5 px, IMU 100 Hz·카메라 10 Hz·30 초, 오프셋마다 100 회. 참 오프셋 5·15·30 ms 에서 추정 평균 5.12·15.06·30.17 ms, RMSE 0.36·0.61·0.68 ms. (IMU 바이어스 없음.)
- **실제 센서 vs Kalibr**: RealSense ZR300, 노출 20~30 ms 5 종 × 40 초 15 세트. 추정 오프셋이 노출 시간에 대략 선형(기울기 약 0.5)으로 증가했다. 논문은 고정 지연 + 노출의 절반으로 해석한다. 반복 표준편차는 제안 방법 0.07~0.16 ms, Kalibr 0.13~0.27 ms. 정답이 없어 Kalibr 를 기준으로 삼았다.
- **EuRoC**: IMU 타임스탬프를 인위적으로 5·15·30 ms 이동시켜 비교. 보정을 안 한 VINS-Mono 는 논문이 허용 구간을 "6 ms 이내" 라고 쓴 범위에서만 견디고(± 여부는 원문이 모호하다), 제안 방법의 RMSE 는 오프셋에 거의 무관했다. OKVIS 는 오프셋이 커질수록 나빠졌다(MH_03 에서 30 ms 일 때 OKVIS 2.805 m vs 제안 0.195 m). 수렴은 수 초 이내라고 한다.
- **걷기 실험**: 영상 30 Hz·IMU 350 Hz, OptiTrack 정답, 추정 오프셋 12.74 ms.

논문이 스스로 밝히거나 요약에서 읽히는 한계: 상수 오프셋 가정, 짧은 구간 등속 가정, 충분한 회전·가속 운동 필요(관측성 분석은 하지 않음), 시뮬레이션은 바이어스 없음, EuRoC 오프셋은 인위적, 실제 센서 평가는 Kalibr 를 정답으로 간주, 걷기 실험은 한 궤적, 다중 카메라 확장은 주장만 하고 실험 없음.

### 직접 확인: 1차원 모형에서 coarse-to-fine

모형은 카메라가 무한히 먼 점을 보며 요(yaw) 만 회전하는 상황이다: `θ(t) = 0.3 sin(2π·0.5·t)`, 픽셀 `u = f tan θ`, `f = 400 px`, 카메라 30 Hz, 20 초. 영상은 스탬프 `t_k` 에 `u(t_k − t_d)` 를 담고 있고(식 4 의 이동이 맞아떨어지는 부호를 **내가 택했다**), 자세는 알려진 것으로 가정해 예측 `u(t_k)` 와 비교한다. 잔차 `z_k + d·V_k − 예측` 은 `d` 에 선형이라 닫힌 해 `d = −Σ V r / Σ V²` 가 나오고, 매 라운드 `d` 를 누적해 스탬프를 옮기는 식으로 6 번 반복했다. 속도는 전진 차분. 픽셀 잡음 0.5 px 포함. Node.js 로 직접 작성했다.

| 참 오프셋 | 1회차 | 2회차 | 6회차 (잡음 있음) |
| --- | --- | --- | --- |
| 5 ms | 4.99 | 5.02 | 5.02 |
| 30 ms | 29.96 | 30.11 | 30.11 |
| 100 ms | 98.46 | 99.92 | 99.93 |
| 300 ms | 262.33 | 299.86 | 300.10 |

1차 근사(`z + t_d V`)는 오프셋이 클수록 부족해(300 ms 에서 약 12% 과소 추정) 한 번에는 못 맞추지만, 추정값으로 시간을 옮긴 뒤 다시 풀면 2회차에 수렴한다. 논문이 말한 coarse-to-fine 논리와 방향이 같다. 단 이 모형은 자세·특징 위치가 완전히 알려진 경우라, 실제 VIO 에서 바이어스·외부 파라미터·깊이와 `t_d` 가 얽히는 난점은 검증하지 못했다. 중심 차분으로 바꿔도 결과는 거의 같았다.

## 언제 쓰나

- 하드웨어 트리거가 없는 USB 카메라 + 별도 IMU, 스마트폰·드론 보드처럼 오프셋을 모르는 장비.
- 노출 시간이 자동으로 바뀌어 오프셋이 달라지는 환경(요약본의 실험에서 노출에 따라 변함).
- 사전 보정 절차(체스보드)를 현장에서 반복하기 어려울 때. 단, 오프셋이 일정하다는 가정이 유지되는 장비여야 한다.

## 주의/비용

- **움직임이 필요하다.** 속도 `V` 가 0 이면 위 닫힌 해의 분모 `Σ V²` 가 0 이다. 정지·등속 직선 운동에서는 오프셋이 보이지 않는다고 보는 것이 안전하다(논문도 관측성 분석은 하지 않았다).
- **등속 가정의 한계.** 프레임 간격이 길거나 급격히 가속하면 `z + t_d V` 근사가 틀어진다. 위 실험에서 큰 오프셋에 1회차가 부족했던 것이 그 효과다.
- **상수 오프셋 가정.** 시계 drift 가 있으면 이 방법으로 따라가지 못한다.
- **다른 미지수와 결합.** `t_d` 는 외부 회전·이동, 바이어스와 부분적으로 구별이 안 될 수 있다. 초기화가 틀리면 같이 틀리게 수렴할 수 있다([초기화 관측성](/develop-wiki/knowledge/robotics/vio-initialization-observability/)).
- **롤링 셔터**의 라인별 시간차는 논문(arXiv 판)의 모형에는 없다. 공개 구현 VINS-Mono 의 투영 팩터에는 `TR/ROW*row` 항으로 롤링 셔터가 들어 있다.
- 오프셋의 정답을 모르면 보정값이 맞는지 판정하기 어렵다. 논문도 Kalibr 와의 일치로 평가했다.

## 비교

| 방법 | 방식 | 장점 | 한계 |
| --- | --- | --- | --- |
| 하드웨어 동기화(트리거·PTP) | 측정 시각 자체를 맞춤 | 오프셋이 작고 안정 | 장비·배선 필요 |
| 오프라인 보정(Kalibr 등) | 타깃으로 일괄 추정 | 정확한 기준값 | 장비 바뀌면 재보정, 계산량 큼(논문은 수십 배라고 서술) |
| Qin·Shen 온라인 | 특징 속도로 관측 이동, 상태에 포함 | 타깃 불필요, VIO 와 동시 | 상수·등속 가정, 충분한 운동 필요 |

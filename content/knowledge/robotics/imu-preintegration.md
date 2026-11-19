---
title: IMU 사전적분 — 키프레임 사이 관성 측정을 하나의 상대 제약으로
aka: [IMU Preintegration, On-Manifold Preintegration, Preintegrated IMU Factor, Visual-Inertial Odometry, VIO]
category: robotics
group: estimation
level: advanced
summary: 키프레임 사이의 수백 개 IMU 샘플을 시작 상태와 무관한 상대 회전·속도·위치 증분 하나로 미리 적분해 두면, 최적화가 상태를 바꿔도 다시 적분하지 않고 바이어스 변화는 1차 보정으로 처리한다.
tags: [robotics, imu, preintegration, vio, factor-graph, estimation, gyro, accelerometer, bias]
related: [robotics/factor-graph-slam-optimization, robotics/isam2-bayes-tree-incremental, robotics/madgwick-imu-orientation-filter, robotics/kalman-filter-ekf, robotics/rotation-representations, robotics/sensor-fusion-time-sync, robotics/slam-concepts, graphics-xr/six-dof-inside-out-tracking-slam]
sources:
  - https://arxiv.org/abs/1512.02363
  - https://ar5iv.labs.arxiv.org/html/1512.02363
updatedAt: 2026-11-19
---

> 출처 메모: Forster, Carlone, Dellaert, Scaramuzza 의 "On-Manifold Preintegration for Real-Time Visual-Inertial Odometry"(IEEE T-RO, DOI 10.1109/TRO.2016.2597321, arXiv 1512.02363)를 ar5iv HTML 로 읽었다. 전체 19만 자 중 앞쪽 약 10만 자(모델·사전적분·바이어스 보정·공분산·팩터 정식화·구조 없는 시각 팩터·가정)만 읽었고, 부록의 야코비안 유도와 실험 장은 읽지 못했다. 야코비안은 논문의 해석식이 아니라 수치 미분으로 대신해 확인했다. 초기화(중력·바이어스 관측성)는 이 노트에서 다루지 않는다.

## 문제

IMU 는 100 Hz~1 kHz 로 나오고 카메라 키프레임은 훨씬 드물다. 키프레임마다 상태(자세 R, 위치 p, 속도 v, 자이로·가속도 바이어스 b)를 두는 것은 가능하지만 IMU 샘플마다 상태를 두면 [팩터 그래프](/develop-wiki/knowledge/robotics/factor-graph-slam-optimization/)가 너무 커진다. 반대로 키프레임 i 의 상태에서 j 까지 샘플을 직접 적분해 제약을 만들면, 최적화가 i 의 R, v, p 나 바이어스를 조금만 바꿔도 **그 구간의 적분을 처음부터 다시** 해야 한다.

## 해법

논문은 시작 상태의 영향을 걷어 낸 **상대 증분**을 정의한다. 자이로 측정 ω̃ = ω + b_g + 잡음, 가속도 측정 ã = Rᵀ(a − g) + b_a + 잡음 모델에서, 샘플 간격 Δt 로 다음을 미리 계산한다.

- `ΔR_ij = ∏_k Exp((ω̃_k − b_g) Δt)` (= R_iᵀ R_j)
- `Δv_ij = Σ_k ΔR_ik (ã_k − b_a) Δt` (= R_iᵀ(v_j − v_i − g Δt_ij))
- `Δp_ij = Σ_k [Δv_ik Δt + ½ ΔR_ik (ã_k − b_a) Δt²]` (= R_iᵀ(p_j − p_i − v_i Δt_ij − ½ g Δt_ij²))

오른쪽 식이 이 증분이 맞춰야 할 상태 관계다. 증분은 IMU 데이터와 바이어스에만 의존하므로 최적화에서 i, j 의 전역 상태가 움직여도 재적분이 없다. 최적화는 `Log(ΔR̃ᵀ R_iᵀ R_j)` 같은 잔차를 쓰는 IMU 팩터 하나로 이 구간을 대신한다.

```ts
// 한 샘플씩 증분을 갱신 (Mat3 계산 함수 exp, mul, mv 는 별도 구현. 순서가 중요하다)
for (let k = 0; k < gyro.length; k++) {
  const a = sub(acc[k], ba), w = sub(gyro[k], bg);
  const Ra = mv(dR, a);
  dp = add(dp, add(scale(dv, dt), scale(Ra, 0.5 * dt * dt))); // 갱신 전 dv, dR 사용
  dv = add(dv, scale(Ra, dt));
  dR = mul(dR, exp(scale(w, dt)));
}
```

### 바이어스가 바뀌면

사전적분은 기준 바이어스 b̄ 에서 계산한다. 최적화가 바이어스를 δb 만큼 고치면, 논문은 b̄ 근처의 **1차 보정**을 쓴다. 회전은 `ΔR̃(b̄)·Exp((∂ΔR/∂b_g) δb_g)`, 속도·위치는 `Δ(b̄) + ∂Δ/∂b_g δb_g + ∂Δ/∂b_a δb_a` 다. 야코비안은 사전적분 때 같이 구해 두고 재사용한다.

직접 확인했다. 200 Hz, 1초 길이의 합성 IMU 데이터를 적분하고(바이어스 b̄ 에서), 바이어스를 (자이로 약 0.004, 가속도 약 0.02 규모) 바꿔 처음부터 다시 적분한 결과와 보정한 결과를 비교했다. 야코비안은 중심 차분으로 구했다.

| δb 크기 | 보정 안 한 회전 오차 | 1차 보정 후 회전 오차 | 보정 후 Δv 오차 | 보정 후 Δp 오차 |
| --- | --- | --- | --- | --- |
| 1배 | 5.4e-3 rad | 8.9e-7 rad | 2.8e-5 | 6.6e-6 |
| 0.1배 | 5.4e-4 rad | 부동소수 한계 | 2.8e-7 | 6.6e-8 |

δb 를 10분의 1로 줄이면 보정 후 Δv·Δp 오차가 100분의 1 로 줄어, 오차가 δb 의 제곱에 비례하는 1차 근사의 거동과 맞는다.

### 잡음

증분의 오차는 자이로·가속도 백색 잡음의 선형 결합으로 근사하며, 1차 가정에서 영평균 가우시안이고 공분산 Σ_ij 는 샘플이 들어올 때마다 반복 갱신할 수 있다. 이산 잡음 공분산은 연속 스펙트럼 밀도를 Δt 로 나눈 값이다. 바이어스는 랜덤 워크로 모델링해 연속한 키프레임 사이에 별도의 between 팩터를 둔다.

## 언제 쓰나

- 카메라·라이다 등 저주기 센서와 IMU 를 **스무딩(배치·증분 최적화)** 으로 결합하는 VIO·LIO.
- [iSAM2](/develop-wiki/knowledge/robotics/isam2-bayes-tree-incremental/) 같은 증분 최적화기와 함께, 재선형화가 잦은 환경.
- 저가 IMU 의 바이어스를 상태로 같이 추정해야 할 때.

## 주의/비용

논문이 둔 가정이 곧 한계다.

- 두 키프레임 사이에서 **바이어스가 일정**하다고 본다. 구간이 길어 바이어스가 움직이면 오차가 쌓인다.
- 회전 오차가 작아 1차 Exp·Log 근사가 맞아야 한다. 바이어스 변화가 크면 1차 보정이 부정확해져 재적분이 필요하다.
- 샘플 구간 안에서 입력이 일정하다고 가정한다. IMU 주기가 낮고 회전이 빠르면 고차 적분이 필요할 수 있다고 논문이 언급한다.
- 지구 자전을 무시하고(세계 좌표계를 관성계로 취급), IMU-카메라의 시간 지연과 외부 보정(extrinsics)을 미리 알고 있다고 본다. 시간 동기가 틀리면 결과도 틀린다([시간 동기](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)).
- 증분이 시작 상태와 무관하다는 것은 중력 방향·초기 속도를 최적화가 따로 알아내야 한다는 뜻이기도 하다. 초기화 전략은 이 노트의 범위 밖이다.
- 자세만 필요하면 [Madgwick 필터](/develop-wiki/knowledge/robotics/madgwick-imu-orientation-filter/)나 [EKF](/develop-wiki/knowledge/robotics/kalman-filter-ekf/)가 더 가볍다. 사전적분은 키프레임 기반 최적화 구조를 이미 쓸 때 이득이 크다.

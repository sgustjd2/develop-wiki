---
title: Spline Fusion — SE(3) 누적 B-spline 으로 하는 연속시간 VI-SLAM
aka: [Spline Fusion, Cumulative B-Spline on SE3, Continuous-Time Visual-Inertial SLAM, Lovegrove-Patron-Perez-Sibley, Lie Group Spline]
category: robotics
group: estimation
level: advanced
summary: 카메라 궤적을 SE(3) 위의 누적 3차 B-spline 으로 두면 어느 시각의 자세·속도·가속도도 해석적으로 나온다. 그래서 IMU 값을 궤적에서 "생성"해 비교하고, 롤링 셔터의 행마다 다른 시각도 그대로 다룬다.
tags: [robotics, slam, vio, b-spline, lie-group, se3, continuous-time, rolling-shutter, calibration]
related: [robotics/continuous-time-batch-estimation-temporal-basis, robotics/rolling-shutter-camera-calibration-line-delay, robotics/rolling-shutter-vio-row-time-model, robotics/continuous-time-spline-calibration-kalibr, robotics/rotation-representations, robotics/imu-preintegration, robotics/factor-graph-slam-optimization]
sources:
  - https://www.bmva-archive.org.uk/bmvc/2013/Papers/paper0093/paper0093.pdf
  - https://doi.org/10.5244/C.27.93
updatedAt: 2026-11-19
---

> 출처 메모: Lovegrove·Patron-Perez·Sibley, "Spline Fusion: A continuous-time representation for visual-inertial fusion with application to rolling shutter cameras"(BMVC 2013) 의 BMVA 아카이브 PDF 를 텍스트로 추출해 전문(12쪽)을 직접 읽었다(2026-11-19). 같은 저자들의 확장판(IJCV 2015, "A Spline-Based Trajectory Representation for Sensor Fusion and Rolling Shutter Cameras")은 읽지 않았다. 식 번호는 BMVC 판 기준이다.

## 문제

- 저가 센서(롤링 셔터 CMOS, MEMS IMU)는 동기화되지 않은 여러 스트림을 높은 주기로 낸다. 이산시간 SLAM 은 측정 시각마다 자세를 둬야 해서 상태가 커진다.
- [Furgale 등의 연속시간 일괄 추정](/develop-wiki/knowledge/robotics/continuous-time-batch-estimation-temporal-basis/)이 이 문제를 기저 함수로 풀었지만, 논문은 그 구현의 회전 매개화(Cayley-Gibbs-Rodrigues 를 전역 좌표에서 보간)를 세 가지로 비판한다: 180° 특이점, 보간이 회전군에서의 최단 경로가 아님, 토크 최소 궤적을 잘 근사하지 못함.
- 롤링 셔터는 지금까지 영상을 "펴서" 글로벌 셔터 파이프라인에 넣는 방식이 많았다. 논문은 두 최적화를 떼어 놓으면 고칠 수 없는 편향과 계산 비용이 생길 수 있다고 본다.

## 해법

### 1. 누적 B-spline 을 리 군 위에서

일반 B-spline `p(t) = Σ p_i B_i(t)` 를 **누적 기저** `B̃_i = Σ_{j≥i} B_j` 로 바꾸면 `p(t) = p_0 B̃_0 + Σ (p_i − p_{i−1}) B̃_i` 가 된다(식 2). 여기서 "제어점 차이"를 리 대수의 로그 사상 `Ω_i = log(T_{i−1}⁻¹ T_i)` 로, 덧셈을 지수 사상의 곱으로 바꾼다(식 3).

균일 매듭 간격 `Δt`, 3차(k=4)일 때 구간 안의 정규화 시각 `u ∈ [0,1)` 에서(식 4):

```
T(u) = T_{i−1} · exp(B̃₁(u) Ω_i) · exp(B̃₂(u) Ω_{i+1}) · exp(B̃₃(u) Ω_{i+2})
B̃(u) = C · [1, u, u², u³]ᵀ,  C = (1/6) [[6,0,0,0],[5,3,−3,1],[1,3,3,−2],[0,0,0,1]]
```

- 한 구간은 제어 자세 4 개에만 의존한다(국소 지지). 그래서 슬라이딩 윈도와 일괄 처리 모두 가능하다.
- 곱의 미분 규칙으로 `Ṫ`, `T̈` 가 닫힌 식으로 나온다(식 5·6). `B̃` 의 미분은 `(1/Δt) C [0,1,2u,3u²]ᵀ`, `(1/Δt²) C [0,0,2,6u]ᵀ`.
- C² 연속이라 가속도까지 매끄럽다. 그래야 IMU 측정을 궤적에서 예측할 수 있다.

```ts
// 누적 3차 B-spline 기저와 1·2차 미분 (식 4 아래의 행렬 표현)
const C = [[6, 0, 0, 0], [5, 3, -3, 1], [1, 3, 3, -2], [0, 0, 0, 1]].map((r) => r.map((x) => x / 6));
const mul = (v: number[]) => C.map((row) => row.reduce((s, c, k) => s + c * v[k], 0));
export const cumBasis = (u: number, dt: number) => ({
  B: mul([1, u, u * u, u ** 3]),                       // B[0] 은 항상 1
  dB: mul([0, 1, 2 * u, 3 * u * u]).map((x) => x / dt),
  ddB: mul([0, 0, 2, 6 * u]).map((x) => x / (dt * dt)),
});
// T(u) = T_{i-1} · Π_{j=1..3} expSE3(B[j] · Ω_{i+j}) — expSE3·logSE3 는 리 군 라이브러리 사용
```

### 2. IMU 를 생성 모델로

궤적의 해석 미분으로 자이로·가속도계 값을 합성해 실제 측정과 비교한다(식 8·9).

- 자이로: `Rᵀ Ṙ` (+ 바이어스). 가속도계: `Rᵀ (s̈ + g)` (+ 바이어스).
- [IMU 사전적분](/develop-wiki/knowledge/robotics/imu-preintegration/)처럼 IMU 를 적분해 자세 사이 제약을 만드는 대신, 궤적을 미분해 IMU 측정과 직접 비교한다는 점이 다르다.

### 3. 하나의 목적 함수

재투영 오차 + 자이로 오차 + 가속도계 오차를 각각의 정보 행렬로 가중해 더한다(식 10). 최적화 변수는 응용에 따라 스플라인 제어 자세, 카메라 내부 파라미터, 랜드마크 역깊이, 카메라-IMU 변환, IMU 바이어스. 랜드마크는 처음 본 자세 기준 **역깊이**로 둔다. Ceres 로 푼다.

### 4. 롤링 셔터 투영

행마다 노출 시각이 다르다. 논문은 영상의 세로축을 **연속적인 시간 축**으로 본다(부분 화소가 서로 다른 시각).

- 프레임 시작 `s`, 끝 `e`, 높이 `h` 라면 행 `y` 의 시각은 `y = h(t − s)/(e − s)` 관계를 만족해야 한다.
- 그런데 투영 위치가 시각에 의존하고, 시각이 투영 위치에 의존한다. 그래서 추정 시각에서 투영한 뒤, 투영을 시간에 대해 1차 테일러 전개해 두 관계가 맞도록 시각 보정량을 푼다(식 12·13). 이를 반복한다. 논문은 2~3 회 반복이면 심한 롤링 셔터에서도 수렴했다고 한다.

## 논문이 보고한 것

- **시뮬레이션 단안 롤링 셔터 VO**(도시 블록을 빠르게 걷는 200 프레임, 슬라이딩 윈도): 루프 닫힘 위치 오차(이동 거리로 정규화)가 롤링 셔터를 모델링하면 0.0057, 글로벌 셔터로 가정하면 0.0472. 모퉁이를 돌 때 차이가 컸다고 한다.
- **실제 데이터 자가 보정**(Xtion 롤링 셔터 30 fps + Microstrain 3DM-GX3-35 100 Hz): 카메라 내부·카메라-IMU 외부·바이어스·중력·궤적·랜드마크를 함께 추정. 대응은 격자 타깃으로 알려 줬지만 3D 위치는 모름. 제어점 0.1 초 간격, 모든 제어 자세를 단위행렬로 초기화, 역깊이 0(무한원점), 카메라-IMU 변환은 손으로 45° 이내.

| 시퀀스 | 셔터 모델 | 랜드마크 MSE (px) | 추정 길이 (cm) |
| --- | --- | --- | --- |
| 평면 | 글로벌 | 0.227 | 25.3094 |
| 평면 | 롤링 | 0.160 | 25.3746 |
| 곡면 | 글로벌 | 0.319 | — |
| 곡면 | 롤링 | 0.163 | — |

- 평면 타깃 실제 길이 25.45 cm 기준 스케일 오차가 롤링 셔터 모델 0.3%, 글로벌 셔터 0.6% 라고 쓴다(12.86 초 시퀀스).
- 속도: 슬라이딩 윈도 모드가 초당 몇 프레임 수준이라 실시간은 향후 과제로 남겼다.

### 직접 확인: 누적 기저 행렬

`spline_rs_checks.py` 에서 표준 균일 3차 B-spline 기저 행렬을 누적 합으로 바꿔 계산하니 `6C = [[6,0,0,0],[5,3,−3,1],[1,3,3,−2],[0,0,0,1]]` 로 논문 값과 같았다. `u = 0` 에서 `B̃ = [1, 5/6, 1/6, 0]`, `u = 1` 에서 `[1, 1, 5/6, 1/6]` 로 다음 구간의 `u = 0` 값과 한 칸씩 밀려 이어진다(연속성 확인).

## 언제 쓰나

- 동기화가 안 된 카메라·IMU 여러 대를 한 궤적에 묶어 **자가 보정**(내부·외부·바이어스·중력)할 때.
- 롤링 셔터 카메라로 VO·SLAM 을 하면서 행별 시각을 근사 없이 다루고 싶을 때.
- 회전이 큰 궤적(180° 이상 회전 등)이라 전역 3 매개변수 회전 보간의 특이점이 문제일 때.

## 주의/비용

- **실시간이 아니었다.** 논문 시점 구현은 윈도 모드에서 초당 몇 프레임. 다만 저자들은 스플라인 표현이 전체 복잡도를 바꾸지는 않는다고 본다.
- **매듭 간격 선택.** 0.1 초 균일 간격을 썼다. 빠른 움직임에 비해 성기면 궤적을 못 따라가고, 촘촘하면 변수가 늘고 측정이 없는 구간이 생긴다. 논문도 매 제어점에 약한 저가속 운동 모델을 넣어 이를 막았다.
- **실험 범위가 좁다.** 자가 보정은 데이터 연관을 격자로 줬고, 단안 VO 는 시뮬레이션이었다. 실제 프런트엔드 추적은 완성되지 않았다고 스스로 쓴다.
- **롤링 셔터 모델의 근사.** 특징 패치가 여러 행에 걸치므로 한 점의 시각을 연속값 하나로 두는 근사다. 판독 시간(프레임 시작·끝 시각)은 알고 있다고 가정한다. 그 값은 [line delay 보정](/develop-wiki/knowledge/robotics/rolling-shutter-camera-calibration-line-delay/)으로 얻는다.
- 리 군 지수·로그 사상과 그 미분을 매 평가마다 계산해야 해 구현 난도가 이산 방식보다 높다.

## 비교

| | Spline Fusion | Furgale 등 ICRA 2012 구현 | 롤링 셔터 오차 근사(Li·Mourikis) |
| --- | --- | --- | --- |
| 궤적 표현 | SE(3) 누적 3차 B-spline (국소 리 대수) | 회전 CGR·이동 각각 3차 B-spline | 상태는 판독 중간 시각 하나 |
| 회전 특이점 | 없음 | 180° | — |
| IMU 사용 | 궤적 미분으로 측정 생성 | 같은 방식 | IMU 적분으로 행별 자세 |
| 롤링 셔터 시각 | 테일러 전개 반복으로 일치 | (IJRR 2015 판 실험, 미확인) | 테일러 항 절단 |
| 주 용도 | 일괄·윈도 SLAM, 자가 보정 | 오프라인 보정 | 실시간 EKF |

## 검증 범위

- 직접 읽음: BMVC 2013 BMVA 아카이브 PDF 전문.
- 직접 계산: 누적 기저 행렬 `C`(스크래치 `spline_rs_checks.py`). 추정기 자체는 재현하지 않았다.
- 읽지 않음: IJCV 2015 확장판, 이 표현을 이어 쓴 후속 연구·구현의 세부.

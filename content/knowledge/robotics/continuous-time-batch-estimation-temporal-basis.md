---
title: 시간 기저 함수로 하는 연속시간 일괄 추정 (Furgale·Barfoot·Sibley)
aka: [Continuous-Time Batch Estimation, Temporal Basis Functions, CT-SLAM, Continuous-Time SLAM, Furgale-Barfoot-Sibley]
category: robotics
group: estimation
level: advanced
summary: 로봇 상태를 연속 함수 x(t)로 두고 MAP 추정을 연속시간에서 유도한 뒤, x(t)를 알려진 기저 함수의 가중합으로 근사해 계수만 추정한다. 측정이 많고 빠른 센서(IMU, 롤링 셔터)를 상태 폭증 없이 일괄 최적화에 넣는 틀이다.
tags: [robotics, slam, continuous-time, b-spline, batch-estimation, gaussian-process, map-estimation, calibration]
related: [robotics/continuous-time-spline-calibration-kalibr, robotics/spline-fusion-se3-cumulative-bspline, robotics/rolling-shutter-camera-calibration-line-delay, robotics/factor-graph-slam-optimization, robotics/imu-preintegration, robotics/slam-concepts]
sources:
  - https://web.archive.org/web/20240604035600/https://furgalep.github.io/bib/furgale_icra12.pdf
  - https://doi.org/10.1109/ICRA.2012.6225005
  - https://doi.org/10.1177/0278364915585860
updatedAt: 2026-11-19
---

> 출처 메모: 직접 읽은 것은 학회판 Furgale·Barfoot·Sibley, "Continuous-Time Batch Estimation using Temporal Basis Functions"(ICRA 2012, 8쪽) 저자 공개본이다(1저자 사이트 사본이 현재 내려가 있어 웹 아카이브 사본, 2026-11-19 전문 텍스트 추출). 저널판 Furgale·Tong·Barfoot·Sibley(IJRR 2015, 34(14):1688–1710) 은 본문을 구하지 못했고 **초록만**(OpenAlex 가 제공하는 출판사 초록) 읽었다. 아래 식 번호와 수치는 모두 ICRA 2012 판 기준이다(ICRA 판 DOI 는 Crossref 에서 제목·쪽수 2088–2095 로 대조).

## 문제

[팩터 그래프·일괄 최적화](/develop-wiki/knowledge/robotics/factor-graph-slam-optimization/)는 측정 시각마다 자세 변수를 하나씩 둔다. 두 상황에서 무너진다.

1. **고속 센서**: IMU 처럼 초당 수백 번 재는 센서는 변수 수를 측정 수만큼 늘린다. 필터는 최신 상태만 들고 있어 괜찮지만 일괄 방법은 커진다.
2. **움직이며 연속 촬영하는 센서**: 회전 레이저 스캐너, 롤링 셔터 카메라. 측정마다 시각이 다르다. 기존 방법은 자세 사이를 보간했는데, 보간을 쓰면 필터로는 풀 수 없다.

논문은 두 상황을 한 틀로 다루려고 추정 문제 자체를 연속시간으로 옮긴다.

## 해법 — 가정을 한 단계씩 더하며 유도

논문은 일부러 "가정을 하나씩 추가하는" 순서로 쓴다. 다른 가정을 끼워 다른 추정기를 만들 수 있게 하려는 의도다.

### 1. 연속시간 SLAM 사후 분포 (III-A)

구간 `[t₀, t_K]` 의 상태 `x(t)`, 제어 `u(t)`, 시간 불변 지도 `m`, 이산 측정 `z_1..z_N` 에 대해 베이즈 규칙과 세 가정(측정은 제어와 무관, 측정끼리 조건부 독립, 지도는 궤적과 독립)으로 다음을 얻는다(식 4):

```
p(x(t), m | u(t), z) ∝ p(m) · p(x(t) | u(t)) · Π_i p(z_i | x(t_i), m)
```

### 2. 가우시안 가정 (III-B)

- 측정: `z_i = h(x(t_i), m) + n_i`, `n_i ~ N(0, R_i)`.
- 운동 모델은 확률 미분방정식 `ẋ = f(x, u) + w(t)`, `w` 는 영평균 백색 가우시안 과정(공분산 함수 `Q δ(t − t′)`).
- 그러면 궤적의 사전 확률이 `exp(−½ ∫ e_uᵀ Q⁻¹ e_u dτ)` 꼴이 된다(식 10). `e_u = ẋ − f(x, u)`.

### 3. MAP 목적 함수 (III-C)

음의 로그 사후 = 측정 항 `J_z` + 지도 사전 `J_m` + 초기 상태 사전 `J_x` + **운동 모델 적분 항** `J_u = ½ ∫ e_uᵀ Q⁻¹ e_u dτ` (식 13). 마지막 항만 연속시간에 고유하다.

### 4. 기저 함수로 유한화 (III-D)

`x(t) = Φ(t) c` (식 15). 추정 대상은 계수 `c` 와 지도 `m`. 미분은 `ẋ = Φ̇ c` 로 바로 나온다.

- 가우스-뉴턴 한 단계: 각 항을 선형화해 `(A_z + A_m + A_x + A_u) δθ = −(b_z + b_m + b_x + b_u)` 를 푼다(식 22).
- 운동 항의 기여는 적분 `A_u = ∫ E_uᵀ Q⁻¹ E_u dτ` (식 21). 적분의 난도는 기저와 `f` 의 형태에 달렸다.
- 수렴 후 `A⁻¹` 이 계수의 공분산 `Σ_cc` 를 준다. 그러면 궤적 추정은 평균 `Φ(t)c*`, 공분산 함수 `Φ(t) Σ_cc Φ(t′)ᵀ` 인 **가우시안 과정**이 된다(식 25).

### 5. B-spline 을 고른 이유 (III-E)

원하는 성질은 (1) 국소 지지(계수 하나를 바꾸면 그 근처만 바뀜, 국소 일괄 최적화에 유리), (2) 미분·적분이 간단한 해석식. B-spline 은 어느 시각에서도 소수의 계수만 쓰는 다항식이다. 구현은 de Boor 점화식 대신 행렬 표현(Qin)을 썼다.

- 자세: 회전 3 + 이동 3 차원 스플라인. 회전은 **Cayley-Gibbs-Rodrigues** 매개변수(`φ = a tan(φ/2)` 꼴). 각속도는 `ω = S(φ) φ̇` (식 28).
- 실험은 **3차(order 4) 균일 매듭**으로 제한.

### 예: 손으로 든 센서의 운동 모델

제어 입력이 없으므로 이동과 회전의 2차 미분, 바이어스의 1차 미분을 백색 잡음으로 둔다(식 32): `ẗ = w_t`, `φ̈ = w_φ`, `ḃ_a = w_a`, `ḃ_ω = w_ω`. 그러면 운동 항은 `∫ Φ̈ᵀ Q⁻¹ Φ̈ dτ` 가 되고, B-spline 이면 이 적분을 닫힌 형태로 문제당 **한 번만** 계산하면 된다(식 34).

```ts
// 1차원 예: 가속도 백색잡음 사전의 정보 행렬 A_u = ∫ φ̈(τ)ᵀ Q⁻¹ φ̈(τ) dτ 를 수치 적분으로 근사
// (B-spline 이면 닫힌 형태가 있다. 여기서는 구조만 보이려고 사다리꼴 적분)
export function motionPriorInfo(ddPhi: (t: number) => number[], t0: number, t1: number,
                                q: number, steps = 2000): number[][] {
  const M = ddPhi(t0).length, A = Array.from({ length: M }, () => new Array(M).fill(0));
  const h = (t1 - t0) / steps;
  for (let s = 0; s <= steps; s++) {
    const w = (s === 0 || s === steps ? 0.5 : 1) * h / q, d = ddPhi(t0 + s * h);
    for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) A[i][j] += w * d[i] * d[j];
  }
  return A; // 정규 방정식의 A 에 더한다 (식 22)
}
```

## 논문이 보고한 것 (ICRA 2012, 카메라-IMU 보정)

- 추정량: 중력, 랜드마크 위치, 카메라-IMU 변환 `T_c,i`(시간 불변), IMU 자세 스플라인, 가속도·자이로 바이어스 스플라인(시간 함수). 관측 가능하도록 랜드마크 3 개에 사전 정보를 준다. 초기 자세는 영상별 8점법(단안)·Horn 3점법(스테레오)으로 구한 뒤 Schoenberg-Reinsch 선형 해로 스플라인 계수를 만든다.
- **시뮬레이션**: 60 초 사인파 궤적, 단안 영상 120 장, IMU 5950 개, 자세 기저 300 개, 1000 회 시행. 가우스-뉴턴 3~4 회, 약 12 초. 추정기가 낸 불확실성이 오차 히스토그램과 잘 맞았고, 시행 간 표준편차의 최대-최소 차가 표준편차의 0.2% 미만이었다. 단, 잡음 모델이 정확히 알려진 조건이다.
- **실제 데이터**(Bumblebee XB3 스테레오 + MicroStrain 3DM-GX2, Vicon 기준, 약 2 분 20 초): 스테레오 영상 1639 장, IMU 14211 개. 이산 일괄로 하면 12 개 시변 변수 × 15850 시각 = 190200 개 상태가 필요하다고 계산한다.
  - 바이어스 매듭 15 개 고정, 자세 매듭을 10~1350 개로 바꿔 가며 반복 4 회 제한으로 실행.
  - 매듭이 너무 적으면 오차가 크고, **200~300 매듭**이면 충분했으며, 더 늘리면 시간만 늘었다. 300 매듭에서 수렴까지 약 26 초(2.66 GHz Core 2 Duo). 실행 시간은 `A δθ = −b` 풀이가 지배했고 희소 행렬 기법은 쓰지 않았다.
  - 매듭을 늘려도 과적합하지 않은 이유를 운동 모델 항(식 13d)에 돌린다.

### IJRR 2015 판에 대해 확인한 것 (초록만)

- 같은 유도를 MAP 추정으로 제시하고, 실험을 (i) 카메라-고속 IMU 자가 보정, (ii) **롤링 셔터 카메라의 원근 위치 추정** 두 가지로 늘렸다고 초록에 쓰여 있다. 본문의 수치·추가 유도는 읽지 못했다(미확인).

## 언제 쓰나

- IMU·롤링 셔터·회전 라이다처럼 측정 시각이 촘촘하거나 제각각인 센서를 **일괄 최적화**로 묶어야 할 때. 보정(Kalibr 의 [카메라-IMU](/develop-wiki/knowledge/robotics/continuous-time-spline-calibration-kalibr/)·[롤링 셔터](/develop-wiki/knowledge/robotics/rolling-shutter-camera-calibration-line-delay/) 보정이 이 틀 위에 있다)이 대표적이다.
- 궤적의 불확실성을 임의 시각에서 연속적으로 질의해야 할 때(식 25 의 가우시안 과정 해석).
- 시간 오프셋처럼 "측정 시각 자체"를 추정 변수로 넣어야 할 때. 이산 상태로는 어려운 일이다.

## 주의/비용

- **기저 선택이 곧 모델 가정이다.** 매듭이 성기면 빠른 움직임을 표현 못 해 오차가 크다(실험의 10 매듭 근처). 매듭 수·배치 선택은 논문도 향후 과제로 남겼다. 후속 [Oth 2013](/develop-wiki/knowledge/robotics/rolling-shutter-camera-calibration-line-delay/)은 매듭을 너무 늘리면 오히려 보정값이 편향된다고 보고해, 여기의 "과적합하지 않는다"는 관찰이 일반적이지는 않다.
- **회전 매개화의 한계.** CGR 은 180° 에서 특이하고, 매개변수 공간 보간은 회전군 위의 최단 경로가 아니다. [Spline Fusion](/develop-wiki/knowledge/robotics/spline-fusion-se3-cumulative-bspline/)이 이 점을 지적하고 SE(3) 누적 스플라인으로 바꿨다.
- **계산량.** 측정 항은 측정마다 생기므로 오차 항 수는 줄지 않는다. 줄어드는 것은 변수 수다. 논문 구현은 밀집 풀이라 매듭이 많으면 느렸다.
- 불확실성 일치는 **잡음 모델이 정확할 때**의 결과다. 실제 IMU 잡음 매개변수가 틀리면 공분산도 틀린다.
- 이 틀은 일괄(오프라인) 방법이다. 온라인화는 논문의 향후 과제였다.

## 비교

| | 이산시간 일괄 | 연속시간 + 기저 함수(이 노트) | 필터(EKF 등) |
| --- | --- | --- | --- |
| 상태 크기 | 측정 시각 수에 비례 | 기저 계수 수(매듭 수)에 비례 | 최신 상태만 |
| 임의 시각 질의 | 보간 필요 | `Φ(t)c` 로 바로 | 불가(지난 상태 버림) |
| 재선형화 | 가능 | 가능 | 불가 |
| 운동 모델 | 이산 전이 | 적분 항 `∫ e_uᵀQ⁻¹e_u` | 이산 전이 |
| 약점 | 고속 센서에서 변수 폭증 | 매듭 선택, 회전 매개화 | 연속 촬영 센서 처리 곤란 |

## 검증 범위

- 직접 읽음: ICRA 2012 저자 공개본 전문.
- 초록만 읽음: IJRR 2015 저널판(출판사 초록, OpenAlex 경유).
- 읽지 않음: IJRR 2015 본문(롤링 셔터 실험·추가 유도), 같은 그룹의 가우시안 과정 기반 후속 연구.
- 코드 예시는 구조 설명용 직접 작성이며 논문 구현이 아니다.

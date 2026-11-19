---
title: EKF 기반 카메라-IMU 시간 오프셋 온라인 추정 — td 를 상태 하나로 넣기
aka: [Online Temporal Calibration for Camera-IMU Systems, Li-Mourikis Time Offset, td in EKF State, MSCKF Time Offset, Time Offset Identifiability]
category: robotics
group: estimation
level: advanced
summary: Li·Mourikis 는 카메라와 IMU 타임스탬프 사이의 오프셋 td 를 EKF 상태에 스칼라 하나로 넣어 함께 추정한다. 영상은 t+td̂ 까지 IMU 로 전파한 뒤 갱신하고, td 는 일반 궤적에서 국소 식별 가능함을 보였다.
tags: [robotics, vio, ekf, msckf, time-offset, temporal-calibration, camera-imu, observability]
related: [robotics/camera-imu-time-offset-online-calibration, robotics/rolling-shutter-vio-row-time-model, robotics/continuous-time-spline-calibration-kalibr, robotics/kalman-filter-ekf, robotics/vio-accel-bias-extrinsic-observability, robotics/sensor-fusion-time-sync]
sources:
  - http://web.archive.org/web/20250422000348/https://intra.ece.ucr.edu/~mourikis/papers/Li2014IJRR_timing.pdf
  - https://doi.org/10.1177/0278364913515286
updatedAt: 2026-11-19
---

> 출처 메모: Li·Mourikis, "Online Temporal Calibration for Camera-IMU Systems: Theory and Algorithms"(IJRR 2014) 의 저자 공개본 PDF(UC Riverside 연구실 사이트, 이 환경에서는 웹 아카이브 사본)를 텍스트로 추출해 3~7장과 부록을 직접 읽었다(2026-11-19). 식 번호와 수치는 공개본 기준이며 최종 출판본과 대조하지 않았다. 논문이 말하는 ICRA 2013 학회판은 읽지 않았다. 최적화 기반 대안(Qin·Shen)은 [별도 노트](/develop-wiki/knowledge/robotics/camera-imu-time-offset-online-calibration/)에 있다.

## 문제

카메라와 IMU 는 각자 지연(전송, 센서 내부 처리, OS)을 거쳐 타임스탬프가 찍힌다. 두 스트림 사이에 모르는 오프셋 `t_d` 가 생긴다. 논문은 실험 경험상 수십 ms 가 흔하다고 쓴다.

- 기존 해법은 하드웨어 지식으로 정하거나, 오프라인으로 따로 구하거나, 무시하는 것이었다.
- Kelly·Sukhatme(2010) 는 두 센서의 회전 추정을 일괄 정렬해 오프셋을 구했지만 오프라인이라 시간에 따라 변하는 오프셋을 못 따라가고 회전 정보만 쓴다고 논문은 지적한다.
- 시계가 서로 다르면 오프셋이 흘러간다(clock skew). 오프라인 값이 시간이 지나며 틀려진다.

## 해법

### 시간 규약

- **IMU 시간을 기준**으로 삼는다. 타임스탬프 `t` 인 영상은 실제로 `t + t_d` 에 찍혔다.
- `t_d` 는 양수일 수도 음수일 수도 있다. 지연 때문이라면 IMU 지연이 더 길 때 양수다.
- 식별 가능한 것은 **두 지연의 차** `t_d` 뿐이다. 각 센서의 절대 지연은 외부 정보 없이는 구할 수 없다.

### 상태와 전파

- 지도 기반 EKF 상태: IMU 상태(자세 사원수, 위치, 속도, 자이로·가속도 바이어스 = 16), 카메라-IMU 변환(사원수 + 이동), `t_d`. 오차 상태는 22 차원(식 3).
- `t_d` 의 동역학은 `ṫ_d = 0`(식 12). 변하는 오프셋이 예상되면 `ṫ_d = n_d` 로 랜덤 워크를 준다.
- 상태 하나만 늘어나므로 계산 부담이 작다.

### 갱신

1. 타임스탬프 `t` 인 영상이 오면 IMU 로 **`t + t̂_d` 까지** 전파한다. 그 시각은 보통 두 IMU 샘플 사이라 선형 보간으로 IMU 값을 만든다.
2. 그 시각의 추정 자세로 특징을 투영해 잔차를 만든다.
3. `t_d` 에 대한 야코비안(식 26):
   `H_td = H_θ · R̂ᵀ(t+t̂_d) · ω̂(t+t̂_d) + H_p · v̂(t+t̂_d)`
   즉 회전 야코비안에 **각속도**를, 위치 야코비안에 **속도**를 곱한 것이다. 움직임이 클수록 `t_d` 의 정보가 커진다.
4. 일반 EKF 갱신. `t_d` 의 불확실성은 공분산을 통해 잔차 공분산 `S` 에 자동으로 들어간다.
5. 타임스탬프에 독립 지터(표준편차 `σ_t`)가 있으면 `S` 에 `σ_t² H_td H_tdᵀ` 를 더한다(식 32).

```ts
// t_d 에 대한 측정 야코비안 (식 26 의 구조). 2x3 행렬 · 3 벡터 → 2 벡터
type M23 = number[][]; type V3 = number[];
const mulMV = (M: number[][], v: V3) => M.map((r) => r.reduce((s, x, i) => s + x * v[i], 0));
export function jacobianTd(Hth: M23, Hp: M23, R_GtoI: number[][], omegaI: V3, velG: V3) {
  const RT = R_GtoI[0].map((_, j) => R_GtoI.map((r) => r[j]));  // Rᵀ
  const a = mulMV(Hth, mulMV(RT, omegaI));                       // 회전 기여
  const b = mulMV(Hp, velG);                                     // 이동 기여
  return [a[0] + b[0], a[1] + b[1]];
}
```

### 슬라이딩 윈도(MSCKF) 에서는 더 간단

자세만 쌓는 방식에서는 바꿀 곳이 **상태 증강** 하나뿐이다. 새 영상의 카메라 자세를 `t` 가 아니라 `t + t̂_d` 시각으로 넣고, 증강 야코비안에 `t_d` 열 `J_t`(각속도·속도 항, 식 37)를 추가한다. 이후 특징 갱신은 원래 MSCKF 그대로이고, 상관관계를 통해 `t_d` 도 갱신된다. 논문은 반복 최적화(일괄·증분)에도 같은 방식으로 `t_d` 를 넣을 수 있다고 적는다.

## 식별 가능성 (6장)

카메라가 주는 정보를 "카메라 각속도"와 "척도를 모르는 카메라 속도"로 추상화해 두 제약식을 만든다(식 44·48). 결론:

- **보조정리 6.1(회전 제약만)**: IMU 각속도가 `ω̇ = ⌊k₂×⌋ω + k₁` 꼴의 미분방정식을 만족하는 경우에만 `t_d` 를 식별할 수 없다. 여기에는 회전 없음, 일정 각속도가 들어간다. 필요충분 조건이다.
- **보조정리 6.2(가속도까지)**: 위 조건과 가속도계 측정에 대한 또 하나의 미분방정식(식 56)을 **동시에** 만족해야 식별 불가다. 실용적으로 의미 있는 경우는 가속도계 측정이 일정할 때(회전 없이 등가속, 등속이며 중력축 회전만) 정도라고 한다.
- 이 퇴화 경우들은 `t_d` 를 알아도 원래 관측성을 잃는 경우다. 그래서 논문은 `t_d` 추정이 **실용적으로 새 퇴화 궤적을 만들지 않는다**고 결론 낸다.
- 반대로 `t_d` 가 식별 가능해도 다른 상태가 아닐 수 있다. 예: 한 축으로만 회전하면 `t_d` 는 식별되지만 카메라-IMU 회전은 안 된다.

## 논문이 보고한 것

- **장비**: Bumblebee2 의 카메라 하나(20 Hz) + Xsens MTI-G(100 Hz).
- **지도 기반 실내**: 위치를 아는 LED 20 개. 몇 초 안에 수렴, 최종 `t_d` 표준편차 0.40 ms. 최종값을 고정 입력으로 다시 돌린 결과와 궤적이 거의 같았다. (그림상 추정값은 약 −47 ms 부근이다.)
- **EKF-SLAM**: 같은 데이터. 3 초 이후 지도 기반 추정과 2.5 ms 이내, 최종 차이 0.7 ms.
- **VIO 실차**: 약 7.3 km·11 분, MSCKF 2.0 에 `t_d` 추가. 오차는 이동 거리의 0.5% 미만, 보정을 안 한 경우(`t_d = 0`, 외부 파라미터 수동 측정)보다 크게 정확.
- **시뮬레이션 VIO**(50 회, 표 III): 외부 파라미터만 추정하면 위치 RMSE 북 54.6 m·동 81.8 m, `t_d` 만 추정하면 18.4·13.5 m(하강 45.1 m), 둘 다 추정하면 8.11·5.18 m 로 정답을 아는 경우(7.93·5.00 m)와 거의 같다. `t_d` RMSE 0.25 ms.
- **일관성**: 지도 기반 시뮬레이션의 평균 NEES 가 `t_d` 0.99(기대 1), IMU 15.32(기대 15).
- **흘러가는 오프셋**: 500 초 동안 20 ms → 520 ms 로 선형 증가하는 시뮬레이션 1 회. 추정이 일관되게 따라갔다(대표 시행 1 회만 제시).

## 언제 쓰나

- 필터 기반 VIO(MSCKF, EKF-SLAM) 를 쓰고 하드웨어 동기화가 없을 때. 기존 필터에 스칼라 하나만 추가한다.
- 오프셋이 천천히 변하는 장비(별도 시계, 노출 자동 변경). 랜덤 워크로 따라갈 수 있다.
- 오프셋의 **불확실성**까지 추정 결과에 반영하고 싶을 때. 일괄 사전 보정은 값만 준다.

## 주의/비용

- **움직임이 필요하다.** 정지 상태에서는 `H_td = 0` 이라 정보가 없다. 회전 없는 등속 직선 운동은 `H_td` 가 0 은 아니지만 보조정리 6.2 의 퇴화 경우(가속도계 측정이 일정)에 해당해 `t_d` 를 식별할 수 없다. 식별성 분석도 일반 궤적을 전제한다.
- **국소 식별성**이다. 초기값이 크게 틀리면(수백 ms) 선형화가 맞지 않을 수 있다. 큰 초기 오차에서의 수렴은 시뮬레이션의 `σ = 50 ms` 초기 분포와 흘러가는 오프셋 시행 정도로만 다뤘다.
- `t_d < 0`(영상이 IMU 보다 늦음)이면 필터 출력이 영상 대기만큼 늦어진다. 논문은 별도 스레드로 최신 IMU 를 전파해 현재 상태를 내는 방법을 제안한다.
- 상수 오프셋과 지터만 모델링한다. 롤링 셔터의 행별 시각은 별개 문제다([롤링 셔터 노트](/develop-wiki/knowledge/robotics/rolling-shutter-vio-row-time-model/), 같은 저자들이 그 논문에서 이 `t_d` 를 함께 추정했다).
- 실제 실험에는 `t_d` 의 정답이 없다. 지도 기반·SLAM 추정끼리의 일치와 재처리 결과로 간접 확인했다.

## 비교

| | Li·Mourikis (EKF) | [Qin·Shen (최적화)](/develop-wiki/knowledge/robotics/camera-imu-time-offset-online-calibration/) | [Kalibr (연속시간 일괄)](/develop-wiki/knowledge/robotics/continuous-time-spline-calibration-kalibr/) |
| --- | --- | --- | --- |
| 추정기 | EKF / MSCKF | 슬라이딩 윈도 BA | 오프라인 일괄 LM |
| `t_d` 가 들어가는 곳 | 전파 끝 시각 `t + t̂_d`, 야코비안 | 특징 속도로 관측 이동 | 스플라인을 `t_j + d` 에서 평가 |
| 변하는 오프셋 | 랜덤 워크로 가능 | 상수 가정 | 상수 가정 |
| 보정 타깃 | 불필요 | 불필요 | 필요 |
| 이론 | 식별성 증명(6장) | 관측성 분석 없음 | 국소 볼록성 그림만 |

## 검증 범위

- 직접 읽음: 공개본 1~8장, 부록(보조정리 6.2 증명 앞부분), 표 I~III.
- 그림에서 읽은 값(실험의 `t_d` 약 −47 ms)은 축 눈금 기준 근사다.
- 읽지 않음: ICRA 2013 학회판, Kelly·Sukhatme 2010, 최종 출판본과의 차이.

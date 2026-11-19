---
title: 연속시간 B-spline 시공간 보정 — Kalibr 의 카메라-IMU 보정 원리
aka: [Continuous-Time Spatiotemporal Calibration, Unified Temporal and Spatial Calibration, Kalibr Camera-IMU Calibration, B-spline Trajectory Calibration, Temporal Basis Functions]
category: robotics
group: estimation
level: advanced
summary: IMU 자세를 B-spline 으로 두면 영상 잔차를 임의 시각 t+d 에서 평가할 수 있어, 시간 오프셋 d 와 카메라-IMU 변환을 한 번의 최대우도 일괄 최적화로 함께 푼다. Kalibr 카메라-IMU 보정의 원리다.
tags: [robotics, calibration, kalibr, b-spline, continuous-time, camera-imu, time-offset, batch-estimation]
related: [robotics/ekf-camera-imu-time-offset-estimation, robotics/camera-imu-time-offset-online-calibration, robotics/rolling-shutter-vio-row-time-model, robotics/factor-graph-slam-optimization, robotics/sensor-fusion-time-sync, robotics/coordinate-frames-tf, robotics/continuous-time-batch-estimation-temporal-basis, robotics/rolling-shutter-camera-calibration-line-delay]
sources:
  - https://doi.org/10.1109/IROS.2013.6696514
  - https://web.archive.org/web/20260110144748/https://furgalep.github.io/bib/furgale_iros13.pdf
  - https://github.com/ethz-asl/kalibr/wiki/camera-imu-calibration
updatedAt: 2026-11-19
---

> 출처 메모: Furgale·Rehder·Siegwart, "Unified Temporal and Spatial Calibration for Multi-Sensor Systems"(IROS 2013) 의 저자 공개본 PDF(1저자 사이트의 원래 경로는 현재 404 라 웹 아카이브 사본)를 텍스트로 추출해 전문을 직접 읽었다(2026-11-19). Kalibr 사용법은 공식 위키(camera-imu-calibration) 를 요약 도구로 읽었다. 기반이 되는 Furgale·Barfoot·Sibley 의 연속시간 일괄 추정 논문(ICRA 2012, IJRR 2015)은 읽지 않았으므로 기저 함수 이론은 2013 논문이 설명한 범위만 쓴다.

## 문제

카메라-IMU 보정에는 두 가지가 필요하다. **공간**(카메라와 IMU 사이의 회전·이동)과 **시간**(두 스트림의 타임스탬프 오프셋 `d`).

- 이산시간 추정은 측정 시각마다 상태를 둔다. `d` 를 바꾸면 영상이 가리키는 시각이 바뀌어 "어느 상태와 묶이는가" 자체가 바뀐다. 그래서 `d` 를 최적화 변수로 넣기 어렵다.
- 그래서 기존에는 오프셋을 먼저 따로 구하고(회전 곡선 정렬, 각속도 상관 등), 그다음 공간 보정을 했다. 논문은 이런 방법들이 가속도계 정보를 쓰지 않는다고 지적한다.

## 해법

### 시간 기저 함수

시간에 따라 변하는 상태를 알려진 함수들의 가중합으로 쓴다(식 1): `x(t) = Φ(t) c`. 추정 대상은 계수 `c` 다.

- 그러면 임의 시각의 상태를 계산할 수 있다. 오프셋이 있는 측정의 오차 `e_j = y_j − h(Φ(t_j + d) c)` (식 3) 를 `d` 가 바뀌어도 바로 평가한다.
- `d` 에 대한 야코비안은 `−H · Φ̇(t_j + d̄) c` (식 4): 측정 모델 야코비안에 상태의 **시간 미분**을 곱한 것이다. 기저 함수의 미분은 해석적으로 알려져 있다.
- 이렇게 `d` 가 다른 변수와 똑같이 최대우도 추정의 한 변수가 된다.

```ts
// 1차원 예: 상태 x(t) = Σ c_b φ_b(t). 시간 오프셋 d 에서의 오차와 d 에 대한 미분
type Basis = { phi: (t: number) => number[]; dphi: (t: number) => number[] };
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
export function delayedResidual(B: Basis, c: number[], y: number, tj: number, d: number,
                                h: (x: number) => number, dh: (x: number) => number) {
  const x = dot(B.phi(tj + d), c);
  const e = y - h(x);
  const de_dd = -dh(x) * dot(B.dphi(tj + d), c); // 식 4 의 구조: -H · Φ̇ c
  return { e, de_dd };
}
```

### 카메라-IMU 보정 문제 구성

- **추정 변수**: 중력 방향 `g_w`, 카메라-IMU 변환 `T_c,i`, 시간 오프셋 `d`(상수), IMU 자세 `T_w,i(t)`(시간 함수), 가속도·자이로 바이어스 `b_a(t)`, `b_ω(t)`(시간 함수).
- **자세 스플라인**: 6 차원(회전 3 + 이동 3). 회전은 축-각 매개화. 속도·가속도·각속도는 스플라인의 해석 미분으로 나온다(식 7·8).
- **측정 모델**(식 9): 가속도계 `α_k = Cᵀ(a − g_w) + b_a + n`, 자이로 `ϖ_k = Cᵀω + b_ω + n`, 영상 `y_mj = h(T_c,i · T_w,i(t_j + d)⁻¹ · p_m)`. 영상이 IMU 보다 늦은 것처럼 썼지만 `d` 가 음수일 수 있어 일반성을 잃지 않는다.
- **비용**(식 11): 영상·가속도·자이로 잔차의 마할라노비스 제곱합 + 바이어스 랜덤 워크에 대한 적분 항. Levenberg-Marquardt 로 모두 한꺼번에 푼다.
- **가정**: 카메라 내부 파라미터, IMU 잡음·바이어스 모델, 보정판 기하, 대응 관계는 알려져 있다. `T_c,i` 와 중력은 대략의 초깃값이 있다. `d` 의 초깃값은 0.

### 구현 세부 (논문 4장)

- 자세는 **차수(order) 6 B-spline**(5차 다항식 조각)이다. 가속도가 3차 다항식이 되어야 보정 중의 손 움직임을 따라간다고 한다. 바이어스는 cubic B-spline(3차 다항식 조각, 차수 4).
- B-spline 기저는 짧은 구간에서만 0 이 아니라 정보 행렬이 희소하다. CHOLMOD 로 푼다.
- `d` 가 바뀌면 영상 오차가 다른 매듭 구간으로 넘어가 희소 패턴이 변한다. 이를 막으려고 영상 오차의 야코비안에 이웃 계수 열을 미리 넣고, 그 범위를 **시간 패딩**(논문 실험 0.04 s)으로 제한한다. 패딩이 너무 작으면 최적화가 실패하고, 크면 느려진다. 결과적으로 `d` 는 패딩 범위 안에 있어야 한다.
- 초당 기저 함수 50 개를 썼다. 움직임에 맞는 최소 개수를 자동으로 고르는 것은 향후 과제로 남겼다.

## 논문이 보고한 것

- **조건**: IMU 200 Hz, 카메라 20 Hz, 영상 잡음 0.5 px.
- **계산량**: 약 80 초 데이터에서 설계 변수 12,400 개 이상, 오차 항 144,000 개, 약 50,000 × 50,000 희소 행렬(비영 3,550,000). 반복당 시스템 구성 약 18 초 + 풀이 0.2 초, 3~15 회 반복, 데이터당 최대 5 분. 병목은 오차 항 개수(구성 시간)라고 한다.
- **시뮬레이션**: 약 90 초 궤적, 오프셋 −8~8 ms 의 5 개 값 × 100 회 = 500 회. 오프셋 오차 분포가 대략 ±0.04 ms 범위였고(그림), 추정기가 보고한 불확실성과 맞았다.
- **실제 데이터**: 글로벌 셔터 MT9V034 + ADIS16488, FPGA 로 트리거 시각 기록. 노출 시간 4 종 × 10 세트 = 40 개. 이미지 타임스탬프가 노출 시작이므로 오프셋은 "고정 지연 + 노출 절반" 이어야 한다. 노출 대비 추정 오프셋의 기울기는 0.498(이론 0.5), 직선 적합 잔차는 모두 ±0.2 ms 이내.
- **센서 조합 비교**(그림 7): 직선 기울기 0.5 기준 RMS 오차가 모든 센서 결합 0.054 ms, 자이로만 0.165 ms, 시간·공간 분리 추정 0.344 ms, 가속도계만 0.572 ms. 논문은 가속도계 정보를 더하는 이득이 상관 없는 변수를 같이 추정하는 위험보다 컸다고 해석한다.
- 40 개 실제 데이터에서 최솟값 근처의 비용이 `d` 에 대해 볼록하고 가파르게 보였다(그림 3). 전역 볼록성 증명은 아니다.

## Kalibr 에서 쓰는 법

- 명령: `kalibr_calibrate_imu_camera`. 입력은 ROS bag(`--bag`), 카메라 체인 YAML(`--cam`, 내부·다중 카메라 외부 파라미터), IMU YAML(`--imu`, 잡음 밀도·바이어스 랜덤 워크), 타깃 YAML(`--target`).
- 시간 보정은 **기본으로 켜져 있고** `--no-time-calibration` 으로 끈다.
- 위키의 권장 사항: 모든 IMU 축을 회전·병진으로 고루 자극, 시작·끝에 충격 피하기, 짧은 노출과 밝은 조명으로 모션 블러 줄이기, 같은 시계의 저지터 타임스탬프, 카메라 20 Hz·IMU 200 Hz 가 잘 동작했다고 함, 대칭 타깃의 자세 뒤집힘 주의(Aprilgrid 권장), IMU 타임스탬프 간격이 몰려 있으면 하드웨어 문제부터 해결. IMU 잡음 값은 Allan 분산으로 구하라고 안내한다.

## 언제 쓰나

- 새 센서 헤드를 조립했거나 카메라·IMU 배치를 바꿨을 때 기준값을 얻는 **오프라인 보정**.
- 온라인 추정기([EKF](/develop-wiki/knowledge/robotics/ekf-camera-imu-time-offset-estimation/), [최적화](/develop-wiki/knowledge/robotics/camera-imu-time-offset-online-calibration/))의 초깃값이나 검증 기준이 필요할 때. Qin·Shen 논문도 Kalibr 결과를 기준으로 비교했다.
- 카메라-IMU 외의 센서 조합으로 확장할 여지가 있다. 논문은 카메라 + 가속도계만으로도 보정했다(방향 정규화 항 필요).

## 주의/비용

- **상수 오프셋**만 다룬다. 논문 결론도 시계가 다른 장비는 실행마다 오프셋이 다르고 흐를 수 있어 운영 중 연속 추정이 필요하다고 남긴다.
- **보정 타깃과 정지 환경**이 필요하다. 현장에서 반복하기 어렵다.
- **스플라인 해상도 선택**이 결과에 영향을 준다. 매듭이 너무 성기면 빠른 움직임을 못 따라가 모델 오차가 생기고, 촘촘하면 변수와 계산이 늘어난다. 같은 문제를 [롤링 셔터 노트](/develop-wiki/knowledge/robotics/rolling-shutter-vio-row-time-model/)의 Li·Mourikis 가 실시간 추정 관점에서 지적했다.
- **시간 패딩 밖의 오프셋은 못 찾는다.** 큰 오프셋이 예상되면 패딩을 늘리거나 대략 맞춘 뒤 돌린다.
- IMU 잡음 모델이 틀리면 가중치가 틀려 공간·시간 추정이 함께 흔들린다. 논문 시뮬레이션의 좋은 일치는 "정확한 잡음 모델" 조건이었다.
- 실제 데이터에는 오프셋 정답이 없어, 노출 시간 대비 기울기 0.5 라는 물리 예측으로 간접 평가했다.

## 비교

| | 연속시간 일괄(Kalibr) | 이산 EKF(Li·Mourikis) | 분리 추정(Mair 등) |
| --- | --- | --- | --- |
| 시간 오프셋 처리 | 스플라인을 `t + d` 에서 평가 | 전파 끝 시각을 `t + t̂_d` 로 | 회전 속도 정렬 후 공간 보정 |
| 쓰는 측정 | 영상·자이로·가속도 | 영상·자이로·가속도 | 주로 자이로 |
| 시점 | 오프라인, 타깃 필요 | 온라인, 타깃 불필요 | 오프라인 |
| 변하는 오프셋 | 불가(상수) | 랜덤 워크로 가능 | 불가 |

## 검증 범위

- 직접 읽음: IROS 2013 저자 공개본 전문.
- 요약 도구 경유: Kalibr 위키 camera-imu-calibration 페이지(옵션 이름은 위키 표기 그대로).
- 읽지 않음: Furgale 등 ICRA 2012·IJRR 2015 연속시간 추정 논문, Kalibr 의 롤링 셔터·다중 IMU 확장, 현재 Kalibr 코드의 기본 스플라인 설정.

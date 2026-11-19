---
title: 롤링 셔터 카메라 보정 — 보정판 영상만으로 line delay 추정하기 (Oth 2013)
aka: [Rolling Shutter Camera Calibration, Line Delay Calibration, Readout Time Calibration, kalibr_calibrate_rs_cameras, Oth-Furgale-Kneip-Siegwart]
category: robotics
group: estimation
level: advanced
summary: 롤링 셔터 카메라의 행 사이 지연(line delay)을 LED 장비 없이 보정판을 찍은 영상만으로 구한다. 카메라 자세를 B-spline 연속시간 궤적으로 두고, 각 특징의 행 번호로 촬영 시각을 정해 자세와 line delay 를 한 번의 일괄 최적화로 함께 푼다.
tags: [robotics, calibration, rolling-shutter, kalibr, b-spline, continuous-time, line-delay, camera-model]
related: [robotics/rolling-shutter-vio-row-time-model, robotics/continuous-time-spline-calibration-kalibr, robotics/continuous-time-batch-estimation-temporal-basis, robotics/spline-fusion-se3-cumulative-bspline, robotics/sensor-fusion-time-sync]
sources:
  - https://openaccess.thecvf.com/content_cvpr_2013/papers/Oth_Rolling_Shutter_Camera_2013_CVPR_paper.pdf
  - https://doi.org/10.1109/CVPR.2013.179
  - https://github.com/ethz-asl/kalibr/wiki/Rolling-Shutter-Camera-calibration
updatedAt: 2026-11-19
---

> 출처 메모: Oth·Furgale·Kneip·Siegwart, "Rolling Shutter Camera Calibration"(CVPR 2013) 의 CVF 공개본 PDF 를 텍스트로 추출해 전문(8쪽)을 직접 읽었다(2026-11-19). Kalibr 의 롤링 셔터 보정 도구는 공식 위키 페이지를 요약 도구로 읽었다. 현재 Kalibr 코드가 논문과 같은 알고리즘(적응형 매듭 등)을 그대로 쓰는지는 코드를 보지 않아 확인하지 못했다.

## 문제

롤링 셔터 카메라는 행을 위에서 아래로 차례로 노출한다. 이웃한 두 행의 노출 시작 간격을 **line delay** `d` 라고 하면, 한 장을 읽는 데 대략 `d × 행 수` 가 걸린다. 움직이는 카메라로 SfM·VIO 를 하려면 이 값이 필요하다([롤링 셔터 VIO 노트](/develop-wiki/knowledge/robotics/rolling-shutter-vio-row-time-model/)의 판독 시간 `t_r` 이 같은 양이다).

- 데이터시트가 없거나 설정을 모르는 소비자 기기가 많다.
- 논문 시점의 표준 방법(Geyer 등)은 고주파로 깜빡이는 LED 를 센서에 비춰 생기는 밝고 어두운 띠의 간격으로 `d` 를 구한다. 정확한 LED 주파수가 필요하고, 렌즈를 떼는 편이 좋다고 해서 고정 렌즈 카메라에는 쓰기 어렵다.
- 영상의 흔들림만 지우는 방법들은 SfM 정확도에 필요한 정밀 보정이 아니다.

## 해법

### 1. 카메라 자세를 시간 함수로

[연속시간 일괄 추정](/develop-wiki/knowledge/robotics/continuous-time-batch-estimation-temporal-basis/)을 그대로 쓴다. 자세 `x(t) = Φ(t) c`(식 1), 이동 3 + 회전 3 매개변수를 각각 기저 함수로 두고 변환 행렬 `T(t)` 를 만든다(식 3·4). 구현은 **4차(cubic) B-spline**, 회전은 축-각.

### 2. 행 번호가 촬영 시각을 정한다

프레임의 첫 행 노출 시작 `t̄` 를 알고 `d` 가 상수라고 두면, `v` 번째 행의 시각은 `t̄ + v·d` 다. 그래서 투영은 `u = π(T(t̄ + v d) p)`(식 6)다. 측정된 특징의 세로 좌표 `v` 가 곧 시각을 고른다.

- 재투영 오차 `e = y − π(T(t̄ + v d) p)`(식 9).
- `d` 에 대한 선형화에는 궤적의 **시간 미분** `Φ̇` 이 들어간다(식 13). 자세 계수와 `d` 를 한 식으로 묶어 함께 갱신한다(식 14). 기저 함수가 해석적이라 `Φ̇` 도 해석적으로 계산된다.

```ts
// 한 특징의 재투영 오차와 d 에 대한 미분 구조 (식 9, 13). pose(t), dpose(t): 스플라인과 그 시간 미분
type Pose = number[]; // 6 차원 자세 매개변수
export function rsResidual(y: [number, number], frameStart: number, d: number,
  pose: (t: number) => Pose, dpose: (t: number) => Pose,
  project: (x: Pose) => [number, number], J: (x: Pose) => number[][]) {
  const v = y[1];                       // 측정된 행 좌표가 시각을 정한다
  const t = frameStart + v * d;
  const x = pose(t), u = project(x);
  const e = [y[0] - u[0], y[1] - u[1]];
  const Jx = J(x), xd = dpose(t);       // ∂e/∂d = −J · ẋ(t) · v
  const de_dd = Jx.map((row) => -row.reduce((s, a, i) => s + a * xd[i], 0) * v);
  return { e, de_dd };
}
```

### 3. 잡음이 시각에도 들어간다 — 오차 공분산

글로벌 셔터와 달리 행 좌표 잡음 `n_v` 는 **촬영 시각**도 흔든다. 논문은 이를 선형화해 오차 공분산을 `R̄ = A R Aᵀ`(식 21)로 쓴다. `A` 는 단위행렬에 "세로 잡음 → 시각 변화 → 자세 변화 → 투영 변화" 항을 더한 것이다(식 18).

- `d = 0` 이거나 카메라가 느리면 `A → I` 로 글로벌 셔터와 같다.
- 빠르게 움직이면 비대각 항이 커진다. 판독 방향과 같은 방향으로 움직이면 세로 분산이 줄고, 반대면 커진다(그림 2). 같은 방향으로 아주 빠르면 공분산이 퇴화할 수 있다. 실제로는 일어나지 않았지만 구현에서는 대비해야 한다고 한다.
- 이 공분산은 `d` 에 따라 바뀌므로 반복마다 다시 계산한다.

### 4. 약한 운동 사전 + 적응형 매듭

- 측정이 없는 구간을 위해 가속도에 영평균 백색 가우시안 과정 사전을 둔다(대각 가중치 `Q`, 모든 실험에 고정).
- 그런데 이 사전이 `d` 를 **편향**시킨다. 균일 매듭 수를 늘리며 보니(그림 4) `d` 는 600~1000 매듭에서 안정했다가 더 늘리면 과적합으로 다시 벗어났다. 비용은 계속 줄었다.
- 그래서 매듭을 **잔차 기대값**으로 고른다. 공분산으로 정규화한 2차원 오차 하나의 제곱 기대값은 2 이므로, 구간 `j` 의 비용 `J_j` 가 `2N_j` 보다 크면 표현력이 모자란다고 보고 그 구간 가운데에 매듭을 넣는다(식 23~25).

### 알고리즘 (논문 4.3절)

1. 보정판 영상을 찍고 특징점을 뽑는다.
2. `d₀ = 1 / (fps × 행 수)` 로 초기화한다(프레임 사이 공백이 없다고 가정).
3. 프레임마다 글로벌 셔터 PnP(OpenCV) 해로 스무딩 스플라인을 만든다. 매듭은 균일하게, 적은 편으로.
4. `θ = d` 로 일괄 최적화(DogLeg, CHOLMOD).
5. `J_j ≥ 2N_j` 인 구간을 반으로 쪼갠다.
6. 매듭이 늘었으면 4 로.

## 논문이 보고한 것

- **장비**: Matrix Vision BlueFOX IGC202dG, Vicon 기준값, 보정판 앞에서 30~60 초 움직인 데이터.
- **연속시간 위치 추정**(`d` 는 Geyer 방식으로 미리 보정, 약 7 fps 에서 `d ≈ 137 µs`): 평균 절대 오차가 글로벌 셔터 PnP 189 mm·0.34 rad, 롤링 셔터 연속시간 모델 8.34 mm·0.03 rad.
- **line delay 보정**(픽셀 클럭 4 종에 걸친 실제 데이터 40 개, 표 1, 단위 µs):

| 픽셀 클럭 | 공칭 | 제안 중앙값 | Geyer 중앙값 | 제안 표준편차 | Geyer 표준편차 |
| --- | --- | --- | --- | --- | --- |
| 12 MHz | 137.5 | 137.7 | 136.86 | 0.56 | 3.12 |
| 20 MHz | 82.5 | 82.55 | 83.54 | 0.15 | 1.23 |
| 32 MHz | 51.56 | 51.35 | 51.48 | 0.19 | 1.70 |
| 40 MHz | 41.25 | 41.14 | 41.09 | 0.21 | 0.82 |

- 공칭값은 데이터시트의 `t_l = N_P / P`(수평 공백 포함 행당 화소 1650 개, `P` 는 픽셀 클럭)로 구했다. 픽셀 주기에 대한 직선 적합 기울기가 제안 1650.02, Geyer 1642.54(공칭 1650)였다(표 2).
- **스마트폰**(원형 패턴 권장, 50~60 초 영상, 표 3): iPhone 3GS 640×480 30 fps 에서 64.41 µs, iPhone 4S 1920×1080 에서 24.12 µs, Galaxy S3 1920×1080 에서 30.25 µs.

### 직접 확인: 공칭값과 초기값

`spline_rs_checks.py`(Python)로 계산했다.

- `1650 / P` 는 12·20·32·40 MHz 에서 137.500·82.500·51.562·41.250 µs 로 표 1 의 공칭 열과 같다.
- 초기값 `d₀ = 1/(30 × 480) = 69.44 µs` 는 iPhone 3GS 측정값 64.41 µs 와 8% 차이다. 측정값에 행 수를 곱한 판독 시간은 iPhone 3GS 30.9 ms, iPhone 4S 26.1 ms, Galaxy S3 32.7 ms 로 모두 프레임 주기 33.3 ms 보다 짧다. 프레임 사이 공백이 0 이 아니라는 뜻이고, 그래서 `d₀` 는 출발점일 뿐이다.

## Kalibr 에서 쓰는 법

- 명령: `kalibr_calibrate_rs_cameras`. 인자는 `--bag`, `--model`(`pinhole-radtan-rs`, `pinhole-equi-rs`, `omni-radtan-rs`), `--target`, `--topic`, `--inverse-feature-variance`, `--frame-rate`(대략값).
- 위키 기준 제약: **카메라 1 대만**, IMU 동시 보정 불가, 카메라를 고정하고 보정판을 움직이는 방식. 투영·왜곡·셔터 매개변수를 함께 추정한다고 적혀 있다(논문은 내부 파라미터를 따로 먼저 구한다고 가정했으므로 이 점이 다르다).

## 언제 쓰나

- 스마트폰·저가 CMOS 카메라로 VIO·SfM 을 하는데 판독 시간 `t_r` 을 모를 때. 롤링 셔터 VIO 가 입력으로 요구하는 값을 오프라인에서 얻는다.
- LED 같은 전용 장비 없이, 이미 내부 보정에 쓰는 보정판으로 끝내고 싶을 때.
- 해상도·픽셀 클럭·프레임률 모드를 바꿀 때마다 다시 잴 필요가 있을 때(모드마다 값이 다르다는 것이 표 1 과 표 3 에서 보인다).

## 주의/비용

- **상수 line delay 가정.** 논문 결론에 따르면 노출을 영상 도중에 바꾸며 line delay 를 바꾸는 카메라도 있다. 그런 기기는 온라인 추정이 필요하다.
- **내부 파라미터는 따로.** 논문은 내부·왜곡을 정지 영상으로 먼저 구하고 고정했다. 동시 보정은 미해결 과제로 남겼다.
- **움직임 설계가 결과를 좌우.** 어떤 움직임이 필요한지에 대한 분석은 향후 과제로 남겼다. 측정이 없는 구간은 운동 사전에만 의존한다.
- **매듭 수 선택.** 너무 적으면 궤적 모델 오차, 너무 많으면 과적합으로 `d` 가 편향된다. 적응형 매듭은 오차 공분산이 맞다는 전제 위에서만 의미가 있다(특징 검출기 분산을 잘못 주면 `2N_j` 기준이 틀어진다).
- **기준값이 간접적.** 실제 정답 대신 데이터시트 공칭값과 Geyer 방식으로 비교했다. 공칭값도 실제 값이 아닐 수 있다고 논문이 스스로 쓴다.
- 축-각 표현의 `2π` 점프를 피하려고 PnP 결과마다 이전 회전 벡터와 가장 가까운 등가 표현을 고르는 전처리가 필요하다(식 22).

## 비교

| | 보정판 + 연속시간(이 노트) | LED 띠 간격(Geyer 등) | 자이로 동시 보정(Karpenko 등) |
| --- | --- | --- | --- |
| 추가 장비 | 없음(보정판) | 고주파 LED, 렌즈 탈거 권장 | 고정된 자이로 |
| 추정 대상 | 자세 궤적 + `d` | `d` | 카메라-자이로 보정 + `d` |
| 논문의 반복성(표준편차) | 0.15~0.56 µs | 0.82~3.12 µs | 이 논문에서 비교 안 함 |

## 검증 범위

- 직접 읽음: CVPR 2013 CVF 공개본 전문.
- 요약 도구 경유: Kalibr 위키 Rolling-Shutter-Camera-calibration 페이지.
- 직접 계산: 공칭 line delay·초기값·판독 시간(스크래치 `spline_rs_checks.py`). 보정 알고리즘 자체는 재현하지 않았다.
- 읽지 않음: Geyer(Meingast 등) 원 논문, Kalibr 의 롤링 셔터 코드, 최신 Kalibr 의 기본 매듭 설정.

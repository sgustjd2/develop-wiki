---
title: 스캔 정합 — ICP 와 NDT
aka: [ICP, Iterative Closest Point, NDT, Normal Distributions Transform, Scan Matching, Point Cloud Registration]
category: robotics
group: estimation
level: advanced
summary: 두 점군을 겹치는 강체 변환을 찾는 정합 기법. ICP 는 최근접점 대응을 반복하고, NDT 는 격자별 정규분포 점수를 최대화한다. 초기값 의존성과 퇴화 환경이 핵심 한계다.
tags: [robotics, estimation, icp, ndt, scan-matching, point-cloud, lidar, slam]
related: [robotics/slam-concepts, robotics/particle-filter-mcl, robotics/kalman-filter-ekf, robotics/coordinate-frames-tf, robotics/rotation-representations, algorithms/graph-representation]
sources:
  - https://doi.org/10.1109/34.121791
  - https://doi.org/10.1109/IROS.2003.1249285
  - http://robots.stanford.edu/papers/thrun.graphslam.pdf
updatedAt: 2026-11-19
---

## 문제

LiDAR 가 연속으로 찍은 두 스캔 사이에 로봇이 얼마나 움직였는지 알고 싶다. 바퀴 오도메트리는 미끄러짐으로 틀리고, IMU 적분은 드리프트한다. 환경은 가만히 있으니 **두 점군이 최대한 겹치도록 하는 변환(R, t)** 이 곧 상대 이동이다. 이것이 스캔 정합(registration)이며 [SLAM](/develop-wiki/knowledge/robotics/slam-concepts/)의 프런트엔드, 지도 기반 위치 보정의 기본 도구다.

## 해법 1: ICP (Besl & McKay, 1992)

반복 구조는 단순하다.

1. 각 점에 대해 기준 점군에서 가장 가까운 점을 짝으로 정한다.
2. 짝들 사이 거리 제곱합을 최소화하는 강체 변환을 **닫힌 해**로 구한다(2D 는 중심 맞춤 + 회전각 `atan2`, 3D 는 SVD).
3. 변환을 적용하고 수렴할 때까지 1~2 반복.

```python
def best_rt(A, B):                    # A→B 최소제곱 2D 강체 변환
    ax, ay = mean_xy(A); bx, by = mean_xy(B)
    sxx = sum((a[0]-ax)*(b[0]-bx) for a, b in zip(A, B)); syy = sum((a[1]-ay)*(b[1]-by) for a, b in zip(A, B))
    sxy = sum((a[0]-ax)*(b[1]-by) for a, b in zip(A, B)); syx = sum((a[1]-ay)*(b[0]-bx) for a, b in zip(A, B))
    th = math.atan2(sxy - syx, sxx + syy)
    c, s = math.cos(th), math.sin(th)
    return th, bx - (c*ax - s*ay), by - (s*ax + c*ay)

for _ in range(50):
    B = [nearest(p, ref) for p in cur]       # 1) 최근접 대응
    th, tx, ty = best_rt(cur, B)             # 2) 닫힌 해
    cur = transform(cur, th, tx, ty)         # 3) 적용
```

(`mean_xy`, `nearest`, `transform` 은 평균·최근접 탐색·변환 헬퍼. 이 방식으로 L자 방(점 180개)을 구현해 아래 실험을 돌렸다.)

### 실험: 초기 오차에 따른 수렴

기준 점군에 잡음(σ=1 cm)을 준 스캔을 일부러 어긋나게 놓고 50회 반복.

| 초기 어긋남 | 결과 |
| --- | --- |
| 5도, 0.3 m | 정답 대비 RMS 0.002 m |
| 20도, 0.8 m | 0.002 m |
| 60도 | 0.002 m |
| 120도 | 실패, 국소 최소(RMS 4.6 m) |

**ICP 는 초기값이 가까워야만 맞는다.** 최근접 대응은 어긋남이 크면 틀린 짝을 만들고 그 짝에 맞춰 수렴해 버린다. 예시의 임계각은 이 지형에 한정이다.

### 퇴화 환경

한 면의 긴 벽만 보이는 복도에서는 벽에 수직인 이동은 잡히지만 **벽 방향 이동은 비용에 안 나타난다**. 실험에서 벽 방향 0.5 m 어긋남은 정합 후 잔차 0.488 m 가 그대로 남았고 수직 방향은 0 이었다. 복도·터널에서 위치가 한 축으로 미끄러지는 이유다.

## 해법 2: NDT (Biber & Strasser, 2003)

점 대 점 대응을 만들지 않는다. 기준 스캔을 격자 셀로 나누고 셀 안의 점들을 **정규분포(평균·공분산)** 로 요약한다. 새 스캔의 점을 변환해 해당 셀 분포에 넣었을 때의 우도 합 `Σ exp(-½ dᵀ Σ⁻¹ d)` 를 점수로 삼고, 변환 파라미터에 대해 점수를 최대화한다(뉴턴류 최적화).

- 점수가 변환에 대해 **부드럽게 미분 가능**해 최적화가 쉽고, 최근접 탐색이 필요 없다.
- 셀 크기가 수렴 반경과 정밀도의 균형을 정한다.

위 L자 방에 1 m 셀(점 5개 이상인 셀 18개)로 NDT 점수를 만들면, 정답 위치(0도, 0, 0)의 점수가 24.2 이고 (±30도, ±1 m) 격자 탐색의 최고점도 같은 자리였다. 구현은 점수 계산과 격자 탐색만 했고 뉴턴 최적화는 실험하지 않았다.

## 비교

| | ICP | NDT |
| --- | --- | --- |
| 대응 | 점 대 점(또는 점 대 선) 최근접 | 없음(셀 분포) |
| 비용 함수 | 불연속적(대응이 바뀜) | 매끄러움 |
| 전처리 | k-d 트리 같은 최근접 구조 | 격자 분포 계산 |
| 주요 약점 | 초기값, 잘못된 대응, 이상점 | 셀 크기·경계 효과 |

## 언제 쓰나

- 라이다 오도메트리 보정, 지도에 대한 재위치(MCL 의 보조), 루프 클로저 후보 검증.
- 초기값은 바퀴 오도메트리·IMU([Madgwick](/develop-wiki/knowledge/robotics/madgwick-imu-orientation-filter/))나 이전 프레임의 속도 외삽으로 준다.

## 주의/비용

- 초기 추정 없이 큰 이동을 정합하지 않는다. 거친 정합(특징 기반, 전역 탐색)으로 먼저 근처에 놓고 ICP/NDT 로 다듬는 2단계가 일반적이다.
- 이상점(움직이는 사람)과 부분 겹침에서는 거리 상한으로 대응을 걸러내거나 강건 비용을 쓴다. 위 코드는 걸러내지 않는 가장 단순한 형태다.
- 퇴화 환경(복도, 평평한 바닥)에서는 정합 결과의 공분산·고유값을 보고 한 축이 미결정이면 다른 센서(IMU, 바퀴)로 채운다.
- 정합 결과는 상대 포즈 측정이다. 누적하면 드리프트하므로 그래프 최적화·루프 클로저와 함께 쓴다.
- 3D 라이다 점군은 점이 많아 다운샘플링(복셀 필터)이 사실상 필수다.

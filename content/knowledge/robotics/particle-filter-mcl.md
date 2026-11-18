---
title: 파티클 필터와 Monte Carlo 위치 추정
aka: [Particle Filter, Monte Carlo Localization, MCL, AMCL, Sequential Monte Carlo, Resampling]
category: robotics
group: estimation
level: advanced
summary: 가능한 로봇 위치를 표본(파티클) 집합으로 표현해 이동 모델·센서 우도·재표집을 반복하는 필터. 다봉 분포와 납치 문제에 강하고 표본 수만큼 비싸다.
tags: [robotics, estimation, particle-filter, mcl, localization, nav2]
related: [robotics/kalman-filter-ekf, robotics/slam-concepts, robotics/coordinate-frames-tf, robotics/sensor-fusion-time-sync]
sources:
  - https://en.wikipedia.org/wiki/Monte_Carlo_localization
  - https://www.ros.org/reps/rep-0105.html
  - https://www.cs.cmu.edu/~thrun/papers/thrun.mapping-tr.pdf
updatedAt: 2026-11-19
---

## 문제

복도 길이가 같은 사무실 층에서 로봇이 어디에 있는지 모른다. 센서 값이 "문이 하나 보인다"면 위치 후보가 여러 곳이다. 칼만 필터는 가우시안 하나(단봉)만 표현하므로 후보가 여럿인 전역 위치 추정을 못 한다. 또 로봇을 갑자기 다른 곳으로 옮기면(납치) 단봉 필터는 복구하지 못한다.

## 왜 중요한가 (로봇 개발 관점)

- Nav2 의 AMCL 이 대표 사례다. 지도가 이미 있는 환경에서 `map → odom` 변환을 갱신하는 표준 로컬라이저가 이 계열이다([REP-105 프레임 권한](/develop-wiki/knowledge/robotics/coordinate-frames-tf/)).
- 표본 수, 재표집, 잡음 파라미터가 위치가 튀는지 안 튀는지를 결정한다.

## 해법

신뢰(belief) 분포를 N 개의 표본 `{x_i, w_i}` 로 근사한다. 반복마다:

1. **예측(이동 모델)**: 각 표본에 제어/오도메트리 + 샘플링한 잡음을 더해 옮긴다.
2. **가중(센서 모델)**: 실제 측정과 그 표본 위치에서 기대되는 측정을 비교해 우도로 가중치를 준다.
3. **재표집**: 가중치가 큰 표본을 복제하고 작은 것을 버려 표본을 다시 균등 가중으로 만든다. 가중치가 소수에 쏠릴 때만(유효 표본 수 `N_eff = 1/Σw²` 가 작을 때) 한다.
4. 추정치는 가중 평균(단봉일 때) 또는 군집별로 읽는다.

```python
import numpy as np
rng = np.random.default_rng(3)
L = np.array([2.0, 5.0, 9.0]); SIG = 0.3                  # 1D 복도, 랜드마크 3개
def meas(x): d = L - x; return d[np.argmin(np.abs(d))]     # 가장 가까운 랜드마크까지 부호 있는 거리
N = 500; p = rng.uniform(0, 10, N); w = np.ones(N)/N       # 전역 초기화: 어디인지 모름
def step(p, w, u, z):
    p = p + u + rng.normal(0, 0.05, N)                              # 이동 모델
    w = np.exp(-0.5*((np.array([meas(q) for q in p]) - z)/SIG)**2) + 1e-12
    w /= w.sum()
    if 1/np.sum(w**2) < N/2:                                         # N_eff 가 낮을 때만 재표집(체계적)
        idx = np.minimum(np.searchsorted(np.cumsum(w), (rng.random()+np.arange(N))/N), N-1)
        p, w = p[idx], np.ones(N)/N
    return p, w
```

실험(참 위치 1.0 에서 0.2씩 이동, 40 스텝): 처음 5 스텝 평균 오차 3.74(표본이 복도에 퍼져 있어 모호) → 마지막 10 스텝 평균 0.088 로 수렴했다. 초기에 모호한 랜드마크 때문에 여러 군집이 생겼다가 이동하며 하나로 정리되는 것이 이 방법의 특징이다.

## 비교

| | EKF | 파티클 필터(MCL) |
| --- | --- | --- |
| 분포 | 가우시안 하나 | 임의, 다봉 가능 |
| 전역 위치 추정 | 불가(초기값 필요) | 가능 |
| 납치 복구 | 어려움 | 일부 무작위 표본 주입으로 가능 |
| 비용 | 상태 차원^3 | 표본 수 × 센서 모델 비용 |
| 고차원 상태 | 유리 | 표본이 지수적으로 필요(차원의 저주) |

## 언제 쓰나

- 지도가 주어진 2D 평면 위치 추정(x, y, θ): 저차원이라 표본 수백~수천이면 된다.
- 초기 위치를 모르는 전역 위치 추정, 납치 복구.
- 센서 모델이 비선형·비가우시안(라이다 빔 모델, 우도장)일 때.

## 주의/비용

- **표본 퇴화**: 재표집을 너무 자주 하면 다양성이 줄어 한 점으로 수렴한다(샘플 빈곤). 너무 안 하면 가중치가 소수 표본에 쏠린다. `N_eff` 기준 재표집이 흔한 타협이다.
- **과신**: 센서 모델이 너무 뾰족하면(σ 가 작음) 올바른 후보도 가중치가 0 이 된다. 일부러 잡음을 넓히거나 우도에 바닥값을 둔다(코드의 `1e-12`).
- **계산량**: 표본 수 × 라이다 빔 수 × 갱신 빈도. 임베디드에서는 적응형 표본 수(KLD)를 쓴다.
- **대칭 환경**: 같은 복도가 반복되면 다봉이 오래 남는다. 이동하며 정보를 더 모으는 능동 행동이 필요할 수 있다.
- **지도 의존**: 지도가 틀리거나 환경이 변하면(사람, 이동한 가구) 가중치가 오염된다.
- 지도가 없으면 위치만이 아니라 지도도 추정해야 한다 → [SLAM](/develop-wiki/knowledge/robotics/slam-concepts/).

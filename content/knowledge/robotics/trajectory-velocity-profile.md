---
title: 궤적 최적화와 속도 프로파일 (사다리꼴·다항식)
aka: [Trajectory Generation, Time Scaling, Trapezoidal Velocity Profile, S-curve, Jerk Limited, Polynomial Trajectory]
category: robotics
group: planning
level: intermediate
summary: 경로(어디를 지나나)에 시간(언제 지나나)을 입히는 궤적 생성. 사다리꼴 속도, 5차 다항식, 저크 제한, 시간 최적 스케일링의 선택 기준과 한계를 정리한다.
tags: [robotics, trajectory, velocity-profile, trapezoidal, time-scaling, jerk]
related: [robotics/astar-grid-planning, robotics/sampling-based-planning, robotics/model-predictive-control, robotics/pid-control]
sources:
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://lavalle.pl/planning/
updatedAt: 2026-11-19
---

## 문제

플래너가 준 경로는 점들의 모양일 뿐이다. 로봇은 속도·가속도·토크 한계가 있어, 각 점에서 얼마나 빠르게 가야 하는지(시간)를 정해야 한다. 계단 속도 명령을 주면 모터 전류 한계에 걸리고 기계가 흔들린다. Modern Robotics 9장은 경로 `θ(s)` 와 시간 스케일링 `s(t)` 를 분리해 다룬다.

## 왜 중요한가 (로봇 개발 관점)

- 경로 계획과 제어 사이에서 실제로 모터가 따라갈 수 있는 기준 신호를 만드는 층이다.
- 가속도를 급히 바꾸면(저크) 기계 진동·감속기 마모·적재물 이탈이 생긴다. 서비스 로봇의 승차감도 여기서 결정된다.
- 제어기가 따라가지 못할 기준을 주면 오차가 쌓여 PID 가 포화·와인드업한다([PID](/develop-wiki/knowledge/robotics/pid-control/)).

## 해법

**경로와 시간의 분리**: 경로를 `s ∈ [0,1]` 의 함수로 두고 `s(t)` 만 설계하면 같은 경로로 느리게/빠르게 갈 수 있다(MR 9.2).

### 사다리꼴 속도 프로파일

가속 → 등속 → 감속. 최대 속도 `vmax`, 최대 가속도 `amax`, 이동 거리 `D`.

- 가속 시간 `ta = vmax / amax`.
- `D ≥ vmax·ta` 이면 등속 구간 `tc = (D - vmax·ta)/vmax`, 총 시간 `T = 2ta + tc`.
- 거리가 짧으면 `vmax` 에 못 닿고 삼각형 프로파일: `vp = √(D·amax)`.

```python
import numpy as np
def trapezoid(D, vmax, amax):
    ta = vmax / amax
    if D < vmax * ta: vmax = np.sqrt(D * amax); ta = vmax / amax; tc = 0.0    # 삼각형
    else: tc = (D - vmax * ta) / vmax
    T = 2*ta + tc
    def s(t):
        if t < ta: return 0.5*amax*t*t
        if t < ta + tc: return 0.5*amax*ta*ta + vmax*(t - ta)
        if t < T: return D - 0.5*amax*(T - t)**2
        return D
    return s, T
```

실행 검증: `D=2, vmax=1, amax=2` → T=2.5 s(가속 0.5 / 등속 1.5 / 감속 0.5), 끝점 위치 2.0000, 최대 속도 1.000. `D=0.2` 는 삼각형이 되어 T=0.632 s, 최대 속도 0.632. 수치적분으로 도달 거리를 확인했다.

### 다항식 (5차) 시간 스케일링

`s(τ) = 10τ³ − 15τ⁴ + 6τ⁵` (τ = t/T). 시작·끝에서 속도와 가속도가 모두 0 이라 가속도가 불연속 없이 이어진다. `D=2, T=2` 에서 시작/끝 속도 0, 최대 가속도 약 2.887(= 5.77·D/T²)을 확인했다.

### 시간 최적 스케일링

경로를 고정하고 토크·속도 한계 안에서 가장 빠른 `s(t)` 를 찾는다. MR 9.4 는 (s, ṡ) 위상 평면에서 가속·감속 곡선을 이어 푸는 방법을 설명한다. 이 방법이 성립하는 가정과 주의점은 9.4.4 절 "Assumptions and Caveats" 에 따로 정리돼 있다.

## 비교

| 프로파일 | 연속성 | 장점 | 단점 |
| --- | --- | --- | --- |
| 사다리꼴 | 속도 연속, **가속도 불연속** | 단순, 가장 짧은 시간(가속도 한계 내) | 가속도 점프 → 저크 무한대, 진동 |
| S-curve(저크 제한) | 가속도까지 연속 | 부드러움 | 구간이 7개로 복잡, 더 느림 |
| 5차 다항식 | 가속도까지 연속, 경계 조건 지정 | 수식 단순, 경유점 연결 쉬움 | 최대 속도·가속도가 부수적으로 정해짐 |
| 시간 최적 | 한계 직접 사용 | 가장 빠름 | 모델·토크 한계 필요, 계산 복잡 |

## 언제 쓰나

- 점-대-점 이동(산업용 팔, 갠트리, 이송 로봇): 사다리꼴 또는 S-curve.
- 경유점을 부드럽게 통과(MR 9.3): 다항식·스플라인.
- 사이클 타임이 돈인 라인: 시간 최적 스케일링.
- 모바일 로봇의 속도 계획: 경로 곡률에 따라 속도 상한을 낮추고(`v ≤ √(a_lat/κ)`) 그 위에 가감속 프로파일을 얹는다.

## 주의/비용

- 사다리꼴은 가속도가 계단이라 기계 공진을 일으킬 수 있다. 저크 제한이나 입력 성형 필터를 쓴다.
- 한계값(`vmax`, `amax`)은 모터 사양이 아니라 **기계 전체(감속기, 하중, 자세)** 에서 정한다. 하중이 바뀌면 허용 가속도도 바뀐다.
- 다관절 동기: 관절마다 따로 프로파일을 만들면 도착 시각이 달라 말단 경로가 휜다. 가장 오래 걸리는 관절에 맞춰 나머지를 늘린다(공통 `s(t)`).
- 시간 매개변수화한 결과도 제어기가 추종 가능한 주기로 샘플링해 줘야 한다. 주기·지터 문제는 [실시간성](/develop-wiki/knowledge/robotics/realtime-dds-latency/) 참고.
- 궤적 최적화(비용 최소화 + 제약)가 필요하면 MPC([MPC](/develop-wiki/knowledge/robotics/model-predictive-control/))나 최적화 기반 궤적 계획으로 넘어간다.

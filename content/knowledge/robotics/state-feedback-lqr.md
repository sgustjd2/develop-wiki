---
title: 상태 피드백과 LQR
aka: [State Feedback, LQR, Linear Quadratic Regulator, Riccati Equation, Pole Placement]
category: robotics
group: control
level: intermediate
summary: 시스템 상태 전체를 되먹임해 u=-Kx 로 제어하는 방식과, 상태·입력 비용을 이차식으로 정해 최적 이득 K 를 구하는 LQR 의 개념과 한계를 정리한다.
tags: [robotics, control, lqr, state-space, riccati, optimal-control]
related: [robotics/pid-control, robotics/model-predictive-control, robotics/kalman-filter-ekf]
sources:
  - https://fbswiki.org/wiki/index.php/Main_Page
  - https://en.wikipedia.org/wiki/Linear%E2%80%93quadratic_regulator
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
updatedAt: 2026-11-19
---

## 문제

PID 는 출력 하나를 보고 이득 세 개를 손으로 맞춘다. 위치·속도·각도·각속도가 서로 얽힌 시스템(도립진자, 쿼드콥터, 이륜 밸런싱 로봇)은 이득을 손으로 맞추기 어렵고 어떤 이득이 "좋은지" 기준도 불분명하다.

## 해법

**상태공간 모델**: `x_{k+1} = A x_k + B u_k`. 상태 `x` 전체를 되먹임한다.

```
u = -K x
```

폐루프는 `x_{k+1} = (A - B K) x_k`. `A - BK` 의 고유값을 원하는 곳에 놓는 것이 극점 배치다(이산계는 단위원 안쪽, 안쪽일수록 빠르게 수렴). 단, 극점을 어디에 둘지는 사용자가 정해야 한다.

**LQR** 은 "어디에 둘지" 대신 비용으로 정한다.

```
J = Σ ( xᵀ Q x + uᵀ R u )
```

- Q: 상태 오차 벌점. 클수록 상태를 빨리 0 으로.
- R: 입력 벌점. 클수록 입력(에너지·모터 부하)을 아낀다.
- 최적 이득은 대수 리카티 방정식의 해 P 에서 `K = (R + BᵀPB)⁻¹ BᵀPA` 로 나온다(이산 시간). 선형·이차 비용이면 한 번 계산하면 끝이고 오프라인 계산이다.

```python
import numpy as np
dt = 0.1
A = np.array([[1, dt], [0, 1.0]]); B = np.array([[0.5*dt*dt], [dt]])   # 이중 적분기(위치, 속도)
Q = np.diag([10., 1.]); R = np.array([[1.]])
P = Q.copy()
for _ in range(1000):                                                    # 리카티 반복
    P = Q + A.T@P@A - A.T@P@B@np.linalg.inv(R + B.T@P@B)@B.T@P@A
K = np.linalg.inv(R + B.T@P@B) @ B.T @ P @ A
```

실행 결과 `K ≈ [2.76, 2.51]`, 폐루프 극 크기 0.8735(단위원 안쪽, 안정), 초기 위치 1 에서 10 초 뒤 상태가 0 으로 수렴했다.

R 을 바꿔 본 결과(같은 Q):

| R | K | 최대 입력 크기 | 5초 뒤 위치 오차 |
| --- | --- | --- | --- |
| 0.1 | [7.61, 4.59] | 7.61 | 0.0 |
| 1 | [2.76, 2.51] | 2.76 | 0.0 |
| 100 | [0.30, 0.79] | 0.30 | 0.026 |

R 이 클수록 입력은 작아지고 수렴은 느려진다. 비용 가중치로 "얼마나 공격적인가"를 하나의 숫자로 고르는 것이 LQR 의 실용적 이점이다.

## 비교

| | PID | 극점 배치 | LQR | MPC |
| --- | --- | --- | --- | --- |
| 모델 필요 | 불필요 | 필요 | 필요(선형) | 필요 |
| 다변수 | 어려움 | 가능 | 자연스러움 | 자연스러움 |
| 튜닝 대상 | 이득 3개 | 극점 위치 | Q, R | 비용, 지평선, 제약 |
| 입력 제약 처리 | 포화만 | 없음 | 없음(포화 후 보장 깨짐) | **직접 포함** |
| 온라인 계산 | 거의 없음 | 거의 없음 | 행렬 곱 한 번 | 최적화 풀이 |

## 언제 쓰나

- 선형(또는 평형점 근방에서 선형화 가능한) 다변수 시스템: 밸런싱, 자세 안정화, 매니퓰레이터 관절 공간 제어.
- 모델이 어느 정도 믿을 만하고 입력 제약이 느슨할 때.
- 상태를 직접 못 재면 칼만 필터로 추정해 `u = -K x̂` 로 쓴다(분리 원리, 선형 가우시안일 때 성립)([칼만 필터](/develop-wiki/knowledge/robotics/kalman-filter-ekf/)).

## 주의/비용

- **선형화 영역을 벗어나면 보장이 깨진다.** 도립진자를 세운 점에서 선형화한 K 는 크게 기울어진 상태에서는 못 쓴다.
- **상태를 알아야 한다.** 측정이 부분적이면 관측기가 필수고, 관측기 오차가 성능을 갉아먹는다.
- **제약 처리 없음.** 입력 한계는 그냥 잘라 쓰면 안정성 보증이 사라진다. 한계가 핵심이면 MPC([MPC 개요](/develop-wiki/knowledge/robotics/model-predictive-control/)).
- Q, R 은 "좋은 값"이 정해져 있지 않다. 대각 행렬에서 시작해 허용 오차의 제곱 역수로 두는 브라이슨 규칙이 출발점으로 흔히 쓰인다.
- 모델 오차에 대한 강인성이 자동으로 보장되지 않는다. 실제 장치에서는 지연·마찰로 위상 여유를 점검한다.
- 기준 추종(목표가 움직임)이나 외란 제거(적분 작용)는 구조를 확장해야 한다. 기본 `u=-Kx` 는 0 으로 보내는 레귤레이터다.

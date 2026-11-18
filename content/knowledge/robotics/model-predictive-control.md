---
title: MPC (모델 예측 제어) 개요
aka: [Model Predictive Control, Receding Horizon Control, MPC, NMPC]
category: robotics
group: control
level: advanced
summary: 매 주기 모델로 앞으로 N 스텝을 최적화해 입력열을 구하고 첫 입력만 적용한 뒤 다시 계산하는 제어. 제약을 직접 다루지만 계산 시간과 모델 의존이 비용이다.
tags: [robotics, control, mpc, optimization, receding-horizon, constraints]
related: [robotics/state-feedback-lqr, robotics/pid-control, robotics/trajectory-velocity-profile, robotics/realtime-dds-latency]
sources:
  - https://en.wikipedia.org/wiki/Model_predictive_control
  - https://fbswiki.org/wiki/index.php/Main_Page
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
updatedAt: 2026-11-19
---

## 문제

LQR 은 입력 한계, 관절 한계, 장애물 회피 같은 **제약**을 다루지 못하고, 미래의 기준 궤적을 알아도 활용하지 못한다. 자율주행·보행·드론 궤적 추종은 제약과 미래 참조가 핵심이다.

## 해법 (후퇴 지평선)

매 제어 주기마다:
1. 현재 상태 `x₀` 를 측정/추정한다.
2. 모델 `x_{k+1} = f(x_k, u_k)` 로 N 스텝 앞까지 예측한다.
3. 비용(오차 + 입력 크기)을 최소화하고 제약(`|u| ≤ u_max`, 상태 범위)을 만족하는 입력열 `u₀..u_{N-1}` 을 푼다.
4. **첫 입력 `u₀` 만** 적용한다.
5. 다음 주기에 새로 측정해서 처음부터 반복한다.

매번 새 측정으로 다시 풀기 때문에 모델 오차·외란이 어느 정도 보정되는 피드백 효과가 생긴다.

선형 모델 + 이차 비용 + 선형 제약이면 이차계획(QP)이 되어 효율적으로 푼다. 비선형이면 NMPC 로 비볼록 최적화이고 훨씬 무겁다.

```python
import numpy as np
dt=0.1; A=np.array([[1,dt],[0,1.]]); B=np.array([[0.5*dt*dt],[dt]]); N=15
Q=np.diag([10.,1.]); R=0.1; umax=1.0
Phi=np.vstack([np.linalg.matrix_power(A,i+1) for i in range(N)])         # X = Phi x0 + Gam U
Gam=np.zeros((2*N,N))
for i in range(N):
    for j in range(i+1): Gam[2*i:2*i+2,j:j+1]=np.linalg.matrix_power(A,i-j)@B
Qb=np.kron(np.eye(N),Q); H=Gam.T@Qb@Gam+R*np.eye(N); Lip=np.linalg.eigvalsh(H).max()
def solve(x0):
    g=Gam.T@Qb@(Phi@x0); U=np.zeros(N)
    for _ in range(300): U=np.clip(U-(H@U+g)/Lip,-umax,umax)           # 투영 경사하강(입력 상자 제약)
    return U
x=np.array([2.0,0.0])
for k in range(80):
    u=solve(x)[0]; x=A@x+B[:,0]*u                                      # 첫 입력만 적용
```

실행 결과 초기 위치 2 에서 시작해 80 스텝 뒤 상태가 0 근처로 수렴했고 입력은 항상 한계 ±1 이내였다(`max|u| = 1.0`, 한계에 걸린 구간이 있었다는 뜻). 실제 제품은 이런 직접 만든 반복법 대신 OSQP, qpOASES, acados 같은 전용 솔버를 쓴다.

## 비교

| | LQR | MPC |
| --- | --- | --- |
| 제약 | 못 다룸 | 입력·상태 제약을 문제에 포함 |
| 미래 참조 | 현재 오차만 | 지평선 안의 참조 활용 |
| 온라인 계산 | 행렬 곱 | 매 주기 최적화 |
| 안정성 보증 | 이론적으로 명확 | 종단 비용·종단 집합을 설계해야 보증 |

지평선이 무한이고 제약이 없으면 MPC 는 LQR 과 같은 해가 된다.

## 언제 쓰나

- 입력·속도·가속도 한계가 실제로 활성화되는 시스템(차량 조향·가속 한계, 매니퓰레이터 토크 한계).
- 앞으로의 경로가 이미 알려진 추종 문제, 장애물을 제약으로 넣는 국소 회피.
- 다변수 결합이 강해서 PID 여러 개로 안 풀릴 때(보행 로봇의 접촉 계획 등).

## 주의/비용

- **계산 시간 예산**: 제어 주기 안에 풀려야 한다. 못 풀면 직전 해를 쓰거나 멈추는 대체 동작을 정의해야 한다. 이는 지연·지터 문제와 직결된다([실시간성](/develop-wiki/knowledge/robotics/realtime-dds-latency/)).
- 상태 추정과 모델이 부정확하면 예측이 틀어진다. 지평선이 길수록 모델 오차가 누적되므로 무작정 늘리지 않는다.
- 해가 없는(실행 불가능한) 순간이 생긴다. 제약을 소프트 제약(슬랙 변수)으로 풀어 두는 것이 관례다.
- NMPC 는 비볼록이라 지역해, 초기 추정(웜 스타트)에 민감하다.
- 단순한 문제에 MPC 를 쓰면 과설계다. PID 로 충분한 모터 루프를 MPC 로 바꾸지 않는다. 보통 MPC 는 상위(궤적 추종), PID 는 하위(모터) 층에 둔다.

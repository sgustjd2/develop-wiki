---
title: 계산 토크 제어 (역동역학 제어)
aka: [Computed Torque Control, Inverse Dynamics Control, Feedback Linearization, CTC]
category: robotics
group: control
level: advanced
summary: 로봇 동역학 모델 M(q)q̈ + C + G = τ 로 비선형 항을 상쇄해 관절을 선형 이중 적분기처럼 만들고 그 위에서 PD 를 거는 제어. 모델이 정확할수록 추종이 좋고 틀리면 성능이 떨어진다.
tags: [robotics, control, computed-torque, dynamics, manipulator, feedback-linearization]
related: [robotics/pid-control, robotics/state-feedback-lqr, robotics/model-predictive-control, robotics/forward-inverse-kinematics-jacobian, robotics/trajectory-velocity-profile, robotics/realtime-dds-latency]
sources:
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://doi.org/10.1007/978-1-84628-642-1
updatedAt: 2026-11-19
---

## 문제

매니퓰레이터 관절마다 따로 PID 를 걸면 이웃 관절의 움직임, 중력, 원심·코리올리 힘이 외란으로 들어온다. 자세에 따라 유효 관성이 크게 바뀌므로(팔을 펴면 무겁게 느껴진다) 한 지점에 맞춘 이득이 다른 자세에서는 느리거나 진동한다. 빠른 궤적일수록 이 결합 효과가 커진다.

## 해법

로봇 동역학은 `M(q)·q̈ + C(q, q̇) + G(q) = τ` 다(M 관성 행렬, C 코리올리·원심 항, G 중력). 모델을 안다고 보고 입력을 이렇게 만든다.

`τ = M(q)·( q̈_d + Kd·ė + Kp·e ) + C(q, q̇) + G(q)`

대입하면 `ë + Kd·ė + Kp·e = 0` 이 되어, 비선형·결합 항이 사라지고 **각 관절의 오차가 독립된 2차 선형 시스템**이 된다. Kp, Kd 로 극점을 정하면 그만이다. Modern Robotics 교재가 이 역동역학 제어(computed torque)를 로봇 제어 장에서 다루고, Siciliano 외 *Robotics: Modelling, Planning and Control* 도 표준 참고서다.

수직 평면 2링크(점질량 말단, 질량 1 kg 두 개, 링크 길이 1 m)를 직접 구현해 시변 궤적(`q_d`: 사인파)을 추종시켰다. 아래는 제어 법칙 부분이다.

```python
def computed_torque(q, qd, q_ref, qd_ref, qdd_ref, model):
    M, C, G = model(q, qd)                       # 모델이 계산한 M, C, G
    e  = [r - x for r, x in zip(q_ref,  q)]
    ed = [r - x for r, x in zip(qd_ref, qd)]
    a  = [qdd_ref[i] + KD*ed[i] + KP*e[i] for i in range(2)]   # 선형화된 가속도 명령
    return [sum(M[i][j]*a[j] for j in range(2)) + C[i] + G[i] for i in range(2)]
```

KP = 100, KD = 20, 1 kHz 반 암시적 오일러 적분, 0.5 s 이후 오차 노름의 최댓값(rad):

| 제어기 | 모델 정확 | 모델 질량 0.8배 | 모델 질량 1.2배 |
| --- | --- | --- | --- |
| PD (중력 보상 없음) | 0.436 | — | — |
| PD + 중력 보상 | 0.171 | 0.230 | 0.132 |
| 계산 토크 | 0.0042 | 0.044 | 0.030 |

모델이 맞으면 계산 토크가 자릿수 단위로 낫다. 모델 질량이 ±20% 틀려도 PD+중력보상보다 낫지만, 오차가 0.004 에서 0.03~0.04 로 **10배 가까이 늘었다**. 수치는 이 팔·궤적·이득 설정의 예시다(남은 0.004 는 이산화 오차).

## 언제 쓰나

- 관절 동역학이 중요한 고속·고정밀 팔 제어(자세 의존 관성, 코리올리 효과가 큰 경우).
- 모델(질량·관성·마찰)을 식별해 둔 로봇. 동역학 라이브러리(RBDL, Pinocchio, KDL 등)로 M, C, G 를 실시간 계산한다.
- 잔여 모델 오차는 바깥에 PID 나 적응·강건 제어를 얹어 줄인다.

## 주의/비용

- 모델 의존이 가장 큰 약점이다. 페이로드가 바뀌면(물건을 잡으면) 질량·관성이 달라진다. 위 표처럼 오차가 즉시 성능에 반영된다.
- 마찰, 백래시, 관절 탄성, 케이블 힘 같은 비모델 효과는 상쇄되지 않는다.
- M, C, G 를 제어 주기마다 계산해야 한다. 자유도가 많으면 재귀 뉴턴-오일러 같은 효율적 알고리즘이 필요하고 주기 지터는 성능을 해친다([실시간성](/develop-wiki/knowledge/robotics/realtime-dds-latency/)).
- 토크 제어 인터페이스가 필요하다. 속도·위치 명령만 받는 상용 로봇 팔에는 그대로 못 쓴다.
- 이 방법은 제약(토크 한계, 관절 한계)을 직접 다루지 않는다. 제약이 핵심이면 [MPC](/develop-wiki/knowledge/robotics/model-predictive-control/), 선형 모델의 최적 이득은 [LQR](/develop-wiki/knowledge/robotics/state-feedback-lqr/).
- 입력 궤적 `q_d, q̇_d, q̈_d` 가 매끄러워야 한다([속도 프로파일](/develop-wiki/knowledge/robotics/trajectory-velocity-profile/)). 이득이 단순 PD 와 같은 의미([PID](/develop-wiki/knowledge/robotics/pid-control/))라 튜닝 감각은 이어진다.

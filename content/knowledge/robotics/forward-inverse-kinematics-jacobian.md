---
title: 순기구학·역기구학과 자코비안
aka: [Forward Kinematics, Inverse Kinematics, Jacobian, Singularity, Damped Least Squares]
category: robotics
group: kinematics
level: intermediate
summary: 관절각에서 말단 위치를 구하는 순기구학, 그 반대인 역기구학, 둘 사이의 속도 관계를 주는 자코비안과 특이점, 수치 풀이 때의 주의점을 정리한다.
tags: [robotics, kinematics, jacobian, inverse-kinematics, manipulator, singularity]
related: [robotics/coordinate-frames-tf, robotics/rotation-representations, robotics/trajectory-velocity-profile, robotics/sampling-based-planning]
sources:
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://lavalle.pl/planning/ch5.pdf
updatedAt: 2026-11-19
---

## 문제

로봇 팔은 관절 각 `q` 를 제어하지만 우리가 원하는 건 "컵을 집는 손끝 자세"다. 둘 사이를 오가야 한다.

- **순기구학(FK)**: `q → 말단 자세 T(q)`. 항상 하나의 답이 있다.
- **역기구학(IK)**: `T 목표 → q`. 답이 없거나, 여러 개이거나, 무한히 많을 수 있다.

Modern Robotics 는 4장(순기구학), 5장(속도 기구학·자코비안), 6장(역기구학)으로 나눠 다룬다.

## 왜 중요한가 (로봇 개발 관점)

- MoveIt 같은 플래너, 텔레오퍼레이션, 비주얼 서보잉이 모두 IK 와 자코비안 위에 있다.
- 로봇 모델(URDF)이 곧 FK 의 정의다. 링크 길이·축 방향이 틀리면 제어기가 아무리 좋아도 손끝이 어긋난다. MR 4.2 절이 URDF 를 다룬다.
- 특이점 근처에서 로봇이 갑자기 빠르게 휘두르는 사고는 자코비안을 모르면 원인을 못 찾는다.

## 순기구학

관절마다 "링크 이동 + 관절 회전"을 4x4 변환으로 만들어 곱한다. 사슬 전체가 곱셈 하나다([변환 행렬](/develop-wiki/knowledge/robotics/coordinate-frames-tf/)). MR 은 이를 스크류 축의 지수 곱(PoE)으로 쓰고, 고전적으로는 Denavit–Hartenberg 파라미터를 쓴다(MR 부록 C 가 둘의 관계를 설명한다). 2링크 평면 팔이면 손끝은 이렇게 나온다.

```python
import numpy as np
L1, L2 = 1.0, 0.8
def fk(q):
    return np.array([L1*np.cos(q[0]) + L2*np.cos(q[0]+q[1]),
                     L1*np.sin(q[0]) + L2*np.sin(q[0]+q[1])])
```

## 자코비안

`ẋ = J(q) q̇` — 관절 속도와 말단 속도를 잇는 선형 사상이다. FK 를 `q` 로 미분한 행렬이다.

```python
def jac(q):
    s1, c1 = np.sin(q[0]), np.cos(q[0]); s12, c12 = np.sin(q[0]+q[1]), np.cos(q[0]+q[1])
    return np.array([[-L1*s1 - L2*s12, -L2*s12],
                     [ L1*c1 + L2*c12,  L2*c12]])
```

수치 미분과 비교해 오차 1e-6 이내로 일치함을 확인했다. 이 팔의 `det J = L1·L2·sin(q2)` 이므로 q2=0(팔이 완전히 펴짐) 또는 π(접힘)에서 특이해진다(실험으로 확인).

**특이점**: J 의 랭크가 떨어지는 자세다. 말단이 어떤 방향으로는 움직일 수 없고, 반대로 그 방향 속도를 내려 하면 관절 속도가 무한대로 요구된다(MR 5.3 절). 같은 맥락의 정량 지표가 조작 가능도(manipulability)이고 조건수(cond)다. q2=1e-3 근처 실험에서 cond 가 약 4850 으로 치솟았다.

자코비안의 전치는 정역학(힘 변환, `τ = Jᵀ F`)에도 쓰인다.

## 역기구학

| 방식 | 아이디어 | 장점 | 단점 |
| --- | --- | --- | --- |
| 해석적(닫힌 해) | 기하로 식을 풀어 공식 도출 | 빠르고 모든 해를 얻음 | 특정 구조(예: 6R 에서 마지막 세 축이 한 점에서 만남)만 가능 |
| 수치(뉴턴-랩슨 반복) | `q ← q + J⁺ (목표 - fk(q))` | 일반적인 구조에 통함 | 초기값 의존, 지역해, 특이점 불안정 |
| 최적화 기반 | 오차 + 관절 한계·자세 선호를 비용으로 | 제약을 직접 넣음 | 느림, 튜닝 필요 |

감쇠 최소제곱(damped least squares)은 특이점 근처 폭주를 막는 흔한 수치 풀이다.

```python
def ik(target, q0, lam=0.05, it=200):
    q = q0.copy()
    for k in range(it):
        err = target - fk(q)
        if np.linalg.norm(err) < 1e-6: return q, k
        J = jac(q)
        q = q + J.T @ np.linalg.solve(J @ J.T + lam**2 * np.eye(2), err)  # 감쇠 항 lam
    return q, it
```

실험 결과: 목표 (1.2, 0.9) 에 초기값 (0.1, 0.1) 이면 6회 반복에 오차 3e-7 로 수렴한다. 다른 초기값 (1.5, -1.0) 에서는 팔꿈치가 반대인 다른 해로 간다(해가 둘). 도달 범위 밖(2.5, 0)을 주면 오차 1.08 에서 멈춘다. 즉 "실패"를 반환값이나 잔차로 반드시 확인해야 한다.

## 언제 쓰나

- 손끝 목표를 관절 명령으로 바꿀 때(IK), 말단 속도 명령을 관절 속도로 바꿀 때(`q̇ = J⁺ ẋ`, 서보잉).
- 작업 공간 분석(도달 범위, 특이 영역 지도) 때.
- 계획 알고리즘의 충돌 검사에서 FK 로 링크 위치를 얻을 때([샘플링 기반 계획](/develop-wiki/knowledge/robotics/sampling-based-planning/)).

## 주의/비용

- 해가 여러 개다. 이전 해와 가까운 쪽을 고르지 않으면 프레임 사이에 팔이 뒤집힌다(연속성).
- 수치 IK 는 초기값이 중요하다. 직전 제어 주기의 `q` 를 쓰는 것이 기본이다.
- 감쇠 계수가 크면 안정하지만 목표에 못 닿는다. 작으면 정확하지만 특이점에서 위험하다.
- 관절 한계, 자기 충돌, 환경 충돌은 IK 자체가 모른다. 별도 검사가 필요하다.
- 여유 자유도(7축 팔)는 해가 무한하다. 영공간(null-space)에서 관절 한계 회피 같은 부가 목표를 얹는다.
- 닫힌 사슬(병렬 기구)은 FK 가 오히려 어렵고 IK 가 쉬운 경우가 있다(MR 7장).
- 회전 목표의 표현은 [회전 표현](/develop-wiki/knowledge/robotics/rotation-representations/) 참고. 자세 오차를 오일러각 차로 다루지 않는다.

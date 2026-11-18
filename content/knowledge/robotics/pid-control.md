---
title: PID 제어와 튜닝
aka: [PID Controller, Proportional-Integral-Derivative, Anti-windup, Ziegler-Nichols]
category: robotics
group: control
level: beginner
summary: 오차의 현재(P)·누적(I)·변화율(D)로 입력을 만드는 피드백 제어기. 이득 의미, 튜닝 순서, 적분 와인드업·미분 잡음 같은 구현 함정을 정리한다.
tags: [robotics, control, pid, feedback, tuning, anti-windup]
related: [robotics/state-feedback-lqr, robotics/model-predictive-control, robotics/realtime-dds-latency, robotics/trajectory-velocity-profile]
sources:
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://fbswiki.org/wiki/index.php/Main_Page
  - https://docs.ros.org/en/jazzy/Tutorials/Demos/Real-Time-Programming.html
updatedAt: 2026-11-19
---

## 문제

모터에 "속도 1 m/s" 를 명령해도 마찰, 부하, 전압 강하 때문에 실제 값이 다르다. 모델을 정확히 알 수 없을 때 **측정값과 목표의 차이(오차)를 계속 입력으로 되먹임**하는 것이 피드백 제어다. PID 는 그중 가장 흔한 형태로, 로봇 관절의 전류·속도·위치 루프 대부분이 PID 또는 그 변형이다. Modern Robotics 11장이 오차 동학과 PI 속도 제어를 다루고, Åström–Murray(Feedback Systems)가 PID 를 별도 장으로 다룬다.

## 왜 중요한가 (로봇 개발 관점)

- 상위 계층(경로 계획, MPC)이 아무리 좋아도 마지막에 모터를 움직이는 건 낮은 층의 PID 다. 튜닝이 나쁘면 위층이 아무리 정교해도 진동하거나 느리다.
- ROS 2 실시간 데모(pendulum)도 PID 컨트롤러로 도립진자를 잡는다. 제어 주기와 지터가 PID 성능에 직접 영향을 준다([실시간성·지연](/develop-wiki/knowledge/robotics/realtime-dds-latency/)).

## 해법

```
u(t) = Kp·e(t) + Ki·∫e dt + Kd·de/dt        e = 목표 - 측정
```

| 항 | 하는 일 | 너무 크면 | 너무 작으면 |
| --- | --- | --- | --- |
| P | 현재 오차에 비례해 민다 | 진동, 불안정 | 느림, 정상상태 오차 큼 |
| I | 오차를 누적해 잔류 오차를 없앤다 | 오버슈트, 느린 진동, 와인드업 | 정상상태 오차 남음 |
| D | 오차 변화율로 브레이크를 건다 | 잡음 증폭, 떨림 | 오버슈트 못 줄임 |

튜닝 요령(경험칙):
1. I, D 를 0 으로 두고 P 를 올려 응답이 빨라지되 진동이 막 시작되기 직전 근처로 맞춘다.
2. D 를 올려 오버슈트와 진동을 줄인다.
3. 정상상태 오차가 남으면 I 를 아주 조금 올린다.
- 지글러-니콜스 같은 규칙은 출발점일 뿐이다. 보통 지나치게 공격적이다.
- 모델을 알면 극점 배치나 LQR 로 계산할 수 있다([상태 피드백·LQR](/develop-wiki/knowledge/robotics/state-feedback-lqr/)).

## 구현 함정 (코드)

```python
class PID:
    def __init__(s, kp, ki, kd, lo, hi, tau=0.05):
        s.kp, s.ki, s.kd, s.lo, s.hi, s.tau = kp, ki, kd, lo, hi, tau
        s.i = 0.0; s.d = 0.0; s.prev = None
    def step(s, sp, y, dt):
        e = sp - y
        dy = 0.0 if s.prev is None else (y - s.prev) / dt; s.prev = y
        a = s.tau / (s.tau + dt); s.d = a * s.d + (1 - a) * dy     # 미분 저역통과
        u_un = s.kp * e + s.i - s.kd * s.d                          # 미분은 측정값에만
        u = min(max(u_un, s.lo), s.hi)
        if u == u_un or (u_un - u) * e < 0:                          # 조건부 적분
            s.i += s.ki * e * dt
        return u
```

- **적분 와인드업**: 출력이 포화(±한계)된 동안 적분이 계속 쌓이면, 목표에 도달한 뒤에도 쌓인 값을 풀어내느라 크게 오버슈트한다. 위 코드처럼 포화 상태에서 오차가 포화를 더 깊게 만들 때는 적분을 멈춘다(조건부 적분).
- **미분 킥**: 목표값이 계단으로 바뀌면 `de/dt` 가 순간 무한대. 미분을 측정값에만 걸면 피한다.
- **미분 잡음**: 인코더·IMU 잡음이 미분에서 증폭된다. 1차 저역통과를 건다.
- **고정 주기 가정**: `dt` 를 실제 경과 시간으로 쓰되 주기 지터가 크면 미분 항이 흔들린다.

실험(단위 질량+점성마찰 시스템, 출력 한계 ±2, 목표 1.0): 와인드업 방지 없이 오버슈트 1.07, 조건부 적분을 쓰면 0.55 로 줄었다. 수치는 이 설정에 한정한 예시다.

## 언제 쓰나

- 모델이 불확실하거나 모델링 비용이 큰 단일 입출력 루프(모터 속도·전류·위치, 온도, 그리퍼 힘).
- 다변수·강한 결합·제약이 핵심이면 LQR/MPC 쪽이 낫다.

## 주의/비용

- 선형 이득이라 포화·마찰(정지 마찰)·백래시 같은 비선형에서는 한계 사이클이 생길 수 있다. 정지 마찰은 I 가 천천히 쌓이다 튀는 "헌팅"을 만든다.
- 이득은 제어 주기에 묶인다. 주기를 바꾸면(예: 1 kHz → 500 Hz) 다시 튜닝한다.
- 종속(cascade) 구조(전류 → 속도 → 위치)에서는 안쪽 루프를 바깥보다 훨씬 빠르게(대략 한 자릿수 이상) 돌리는 것이 관례다.
- 지연이 있으면(통신 지연, 필터) 위상 여유가 줄어 같은 이득에서도 진동한다.
- 튜닝은 반드시 실제 장치나 정확한 시뮬에서, 안전한 가동 범위(저속, 비상정지)에서 시작한다.

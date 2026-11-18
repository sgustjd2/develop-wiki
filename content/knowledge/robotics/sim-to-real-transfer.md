---
title: Sim-to-Real 전이와 도메인 랜덤화
aka: [Sim-to-Real, Reality Gap, Domain Randomization, Dynamics Randomization, System Identification]
category: robotics
group: software
level: advanced
summary: 시뮬레이션에서 만든 정책·제어기를 실기에서 쓸 때 생기는 간극(reality gap)과 대응책. 파라미터를 무작위화해 강건하게 학습하거나 실측으로 모델을 맞추며, 각각 비용과 한계가 있다.
tags: [robotics, simulation, sim-to-real, domain-randomization, reinforcement-learning, system-identification]
related: [robotics/urdf-xacro-robot-description, robotics/robot-safety-iso-10218, robotics/pid-control, robotics/computed-torque-control, robotics/model-predictive-control, robotics/realtime-dds-latency, robotics/sensor-fusion-time-sync]
sources:
  - https://arxiv.org/abs/1703.06907
  - https://arxiv.org/abs/1710.06537
  - https://docs.ros.org/en/lyrical/Tutorials/Intermediate/URDF/Adding-Physical-and-Collision-Properties-to-a-URDF-Model.html
updatedAt: 2026-11-19
---

## 문제

실기에서 학습·튜닝하면 느리고 위험하고 비싸다. 시뮬레이터는 빠르고 안전하며 병렬로 돌릴 수 있다. 그러나 시뮬레이터의 모델은 틀렸다. 질량·마찰·모터 응답·센서 잡음·통신 지연·렌더링이 실제와 다르다. 이 차이가 **reality gap** 이고, 시뮬레이션에서 완벽한 정책이 실기에서 실패하는 전형적 원인이다. Peng 외(2018)는 모델링 오차가 시뮬레이션에서 성공한 전략을 실기에서 실패하게 만든다고 서술한다.

## 해법 계열

| 접근 | 아이디어 |
| --- | --- |
| 시스템 식별 | 실기 데이터로 시뮬레이터 파라미터(질량, 마찰, 모터 상수, 지연)를 맞춘다. 간극 자체를 줄인다 |
| 도메인 랜덤화 | 시뮬레이터 파라미터를 학습 중 무작위로 흔들어, 실기를 "또 하나의 변형"으로 만든다 |
| 실기 미세조정 | 시뮬레이션에서 초기 정책을 만들고 실기 데이터로 이어서 학습한다 |

### 시각 랜덤화 (Tobin 외, 2017)

렌더링 요소(텍스처, 조명 등)를 비현실적으로까지 무작위화한 시뮬레이션 이미지만으로 물체 위치 추정 네트워크를 학습했다. 논문은 실제 이미지를 쓴 사전 학습 없이 약 1.5 cm 이내로 물체를 찾아 파지에 이용했고, 시뮬레이션 RGB 만으로 학습한 네트워크의 실기 제어 전이를 처음으로 보였다고 주장한다.

### 동역학 랜덤화 (Peng 외, 2018)

시뮬레이터의 **동역학 파라미터**를 학습 중 무작위로 바꿔, 정책이 넓은 동역학 범위에 적응하게 한다. 로봇 팔로 물체를 목표 위치로 미는 작업에서, 시뮬레이션만으로 학습한 정책이 실기에서 비슷한 수준으로 동작했고 캘리브레이션 오차에도 강건했다고 보고한다.

## 장난감 실험: 무엇을 무작위화하나

질량·점성 마찰·지연이 있는 1축 위치 제어에서 비례 이득(Kp)을 고르는 문제로 효과를 본다. 명목 모델(질량 1, 마찰 0.5, 지연 없음)에서만 최적화하면 Kp 가 크게 나오고, 질량 0.5~4·마찰 0.1~1·지연 0~5 스텝을 200번 무작위로 뽑아 평균 비용을 최소화하면 더 낮은 값이 나온다.

```python
def pick_gain(candidates, cost, sampler, n=200):
    scenarios = [sampler() for _ in range(n)]            # (mass, friction, delay)
    return min(candidates, key=lambda k: sum(cost(k, *s) for s in scenarios) / n)

sampler = lambda: (random.uniform(0.5, 4.0), random.uniform(0.1, 1.0), random.randint(0, 5))
```

| 이득 선택 | Kp | 명목 모델 비용 | "실기"(질량 3, 마찰 0.2, 지연 4스텝) 비용 |
| --- | --- | --- | --- |
| 명목 최적 | 800 | 0.133 | 0.943 |
| 무작위화 최적 | 200 | 0.170 | 0.334 |

명목 모델에서는 약간 손해(0.133→0.170)를 보지만 실기에서는 비용이 약 1/3 로 줄었다. **랜덤화는 평균 성능을 조금 내주고 최악 성능을 지키는 거래**다. 수치는 이 장난감 환경에 한정된 예시다.

## 언제 쓰나

- 강화학습 정책(보행, 파지)을 시뮬레이터에서 대량 학습해 실기로 옮길 때.
- 실기 시험이 위험하거나 비싼 제어기(고속 이동, 드론)를 먼저 시뮬레이션에서 검증할 때.
- 모델 기반 제어([계산 토크](/develop-wiki/knowledge/robotics/computed-torque-control/), [MPC](/develop-wiki/knowledge/robotics/model-predictive-control/))의 모델 오차 민감도를 시뮬레이션으로 훑을 때.

## 주의/비용

- **범위 선택이 곧 설계다.** 범위가 너무 좁으면 실기가 밖에 있고, 너무 넓으면 정책이 보수적이 되거나 학습이 안 된다. 실기 측정(식별)으로 범위를 정한다.
- 무작위화할 수 없는 항목(모델에 없는 효과)은 못 막는다. 지연·샘플링 주기·센서 노이즈 특성처럼 시스템 소프트웨어 쪽 차이도 포함해 점검한다([실시간성](/develop-wiki/knowledge/robotics/realtime-dds-latency/), [시간 동기화](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)).
- 기술 파일의 질량·관성·마찰이 틀리면 간극의 출발점이다([URDF·Xacro](/develop-wiki/knowledge/robotics/urdf-xacro-robot-description/)).
- 시뮬레이션 성능만 보고 실기에 올리지 않는다. 낮은 이득·속도 제한·비상 정지로 시작하는 단계적 배포와 실기 평가 지표를 정해 둔다([로봇 안전](/develop-wiki/knowledge/robotics/robot-safety-iso-10218/)).
- 고전 제어에서는 랜덤화 대신 이득 여유, 외란 관측기, 적분 항([PID](/develop-wiki/knowledge/robotics/pid-control/))으로 모델 오차를 흡수하는 쪽이 더 단순할 수 있다. 학습이 필요한 문제인지 먼저 따진다.

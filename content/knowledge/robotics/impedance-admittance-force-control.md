---
title: 임피던스·어드미턴스·힘 제어
aka: [Impedance Control, Admittance Control, Force Control, Compliance Control, Hybrid Motion-Force Control]
category: robotics
group: control
level: advanced
summary: 접촉 작업에서는 위치만 따르는 제어 대신 로봇이 환경에 보이는 질량·감쇠·강성(임피던스)을 정한다. 힘을 입력받아 움직임을 내는 어드미턴스 방식과 움직임을 보고 힘을 내는 임피던스 방식으로 나뉜다.
tags: [robotics, impedance-control, admittance-control, force-control, compliance, manipulator, contact]
related: [robotics/computed-torque-control, robotics/pid-control, robotics/forward-inverse-kinematics-jacobian, robotics/realtime-dds-latency, robotics/robot-safety-iso-10218, robotics/emergency-stop-safety-control-design]
sources:
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://github.com/fzi-forschungszentrum-informatik/cartesian_controllers/blob/ros2/cartesian_compliance_controller/README.md
  - https://github.com/fzi-forschungszentrum-informatik/cartesian_controllers/blob/ros2/cartesian_force_controller/README.md
updatedAt: 2026-11-19
---

> 출처 메모: Lynch & Park, Modern Robotics 의 11장(2017 preprint) 11.5 힘 제어, 11.7 임피던스 제어를 PDF 본문에서 직접 읽었다. 11.6 하이브리드 제어는 도입부만 읽었다. 임피던스 제어의 원 논문(Hogan, 1985)은 접근 불가로 읽지 못했다. ROS 쪽 설명은 `cartesian_controllers` 패키지 README 에 근거한다.

## 문제

위치 제어는 "그 자리로 가라" 만 안다. 조립이나 연마, 표면 닦기에서는 환경이 로봇을 밀어낸다. 위치 오차 1 mm 가 단단한 표면에서는 큰 힘이 되고, 반대로 공기 중에서는 아무 힘도 못 낸다. 접촉 작업에는 위치 대신 **힘** 이나 **위치와 힘의 관계**를 다루는 제어가 필요하다.

## 해법

### 힘 제어와 그 위험

교재의 순수 힘 제어는 말단이 받는 힘 `F_tip` 에 대해 정적 근사 `g(θ) + Jᵀ F_tip = τ` 를 쓰고, 원하는 힘 `F_d` 를 `τ = g̃(θ) + Jᵀ F_d` 로 낸다. 중력 보상 모델 g̃ 가 정확해야 한다. 6축 힘-토크 센서를 달면 P-I 피드백(`K_fp F_e + K_fi ∫F_e`)을 더한다. 교재는 D 항이 흔히 쓸모없다고 설명한다(힘 측정이 잡음이 많고 힘 제어에는 적분할 운동 방정식이 없다).

위험도 짚는다. **밀 것이 없으면 로봇이 가속해 버린다.** 그래서 속도 감쇠 항을 넣어 가속을 제한한다. 순수 힘 제어는 환경이 모든 방향에서 저항해야 성립하는 추상이고, 현실에서는 일부 방향은 위치, 일부 방향은 힘을 제어하는 하이브리드 제어(11.6)가 된다.

### 임피던스

교재는 임피던스를 "위치 변화에 대한 힘의 전달함수" 로 정의한다. 1자유도로는 `m ẍ + b ẋ + k x = f`, 즉 `Z(s) = F(s)/X(s)` 이다. 어드미턴스는 역수 `Y = X/F`. 낮은 주파수에서는 스프링이, 높은 주파수에서는 질량이 지배한다.

- 좋은 **위치 제어** = 높은 임피던스(낮은 어드미턴스). 힘이 가해져도 거의 안 움직인다.
- 좋은 **힘 제어** = 낮은 임피던스(높은 어드미턴스). 움직임이 어긋나도 힘이 거의 안 변한다.

임피던스 제어의 목표는 작업 공간에서 `M ẍ + B ẋ + K x = f_ext` 의 거동을 로봇이 흉내 내는 것이다(M, B, K 는 가상 질량·감쇠·강성). K 만 쓰면 강성(컴플라이언스) 제어다. 구현 방식은 둘이다.

| 방식 | 센서 | 출력 | 잘 맞는 환경 | 약점 |
| --- | --- | --- | --- | --- |
| **임피던스 제어** | 위치·속도(엔코더 등) | 관절 토크로 힘을 만든다 | 어드미턴스형 환경에 결합하는 것이 이론상 맞다 | 큰 K 에서 작은 위치 변화가 큰 토크가 되어 지연·양자화와 겹치면 진동·불안정 |
| **어드미턴스 제어** | 손목 힘-토크 센서 | 힘을 받아 가속도/속도 명령을 낸다 | 임피던스형 환경에 결합하는 것이 이론상 맞다 | 작은 가상 질량에서 작은 힘이 큰 가속이 되어 이득이 커져 불안정 |

교재의 임피던스 제어 법칙(11.65)은 로봇 동역학 보상 항에서 `−(M ẍ + B ẋ + K x)` 를 힘으로 낸다. 가속도 측정이 잡음이 많아 흔히 M=0 으로 두고 가벼운 후방 구동 가능한 팔을 쓴다. 어드미턴스 쪽은 `ẍ_d = M⁻¹(f_ext − B ẋ − K x)` 로 목표 가속도를 구하고 자코비안 의사역으로 관절 가속도를 만든 뒤 역동역학으로 토크를 계산한다([계산 토크 제어](/develop-wiki/knowledge/robotics/computed-torque-control/), [자코비안](/develop-wiki/knowledge/robotics/forward-inverse-kinematics-jacobian/)). 기어비가 큰 로봇은 어드미턴스 제어로 단단한 환경을 흉내 내기에 유리하다는 것이 교재의 설명이다.

### 불안정 직접 보기

높은 강성에서의 불안정을 1 kHz 이산 제어로 단순 시뮬레이션했다(1 kg, B=20 N·s/m, 초기 변위 0.01 m, 3초). 발산 여부만 본 결과다.

| K [N/m] | 지연 0 | 지연 1샘플(1 ms) | 지연 3샘플 |
| --- | --- | --- | --- |
| 1,000 | 안정 | 안정 | 안정 |
| 5,000 | 안정 | 안정 | 안정 |
| 20,000 | 안정 | 발산 | 발산 |
| 100,000 | 발산 | 발산 | 발산 |

```ts
// 제어 주기 Ts 마다 u = -K x - B v 를 갱신(ZOH), delay 샘플 늦게 적용. 플랜트는 질량 mr 의 적분기.
for (let t = 0; t < T; t += dt) {
  if (t >= next) { queue.push(-K * x - B * v); u = queue.shift()!; next += Ts; }
  v += (u / mr) * dt; x += v * dt;
}
```

(이것은 이 노트의 단순 모델이고 특정 로봇의 한계가 아니다. 교재가 말한 "큰 K + 지연 + 양자화 → 진동" 이 실제로 K 임계값에서 나타남을 보이는 용도다.)

### ROS 에서

`cartesian_controllers` 패키지는 위치(motion), 힘(force), 순응(compliance) 컨트롤러를 ros2_control 위에 제공한다. 순응 컨트롤러는 motion 과 force 컨트롤러의 하이브리드로, 축별 `stiffness` 가 힘-토크 측정과 모션 오프셋의 균형을 정하고 값이 클수록 목표 자세에서 밀려났을 때의 복원력이 크다. README 는 이를 "접촉 없는 이동과 접촉 이동 사이 전환 구간의 안전한 기본값" 으로 소개한다. 관절 위치·속도 인터페이스 로봇에서 어드미턴스 방식으로 동작한다(순방향 동역학 시뮬레이션으로 풀이).

## 언제 쓰나

- 삽입·조립·연마·닦기 등 접촉이 본질인 작업, 사람 손이 닿는 협동 작업, 햅틱 렌더링.
- 위치 오차가 있는 환경(공차, 비정밀 지그)에서 힘이 커지지 않게 하려 할 때.

## 주의/비용

- **높은 강성은 불안정과 맞바꾼다.** 위의 표처럼 지연이 조금만 생겨도 임계 K 가 크게 내려간다. 제어 주기·통신 지연을 먼저 본다([DDS 지연](/develop-wiki/knowledge/robotics/realtime-dds-latency/)).
- 임피던스 제어는 정확한 토크 제어와 동역학 모델(또는 중력 보상)이 필요하다. 기어 마찰이 큰 로봇은 토크 센서 또는 힘-토크 센서가 필요할 수 있다.
- 어드미턴스 제어는 힘-토크 센서 잡음이 곧바로 움직임이 된다. 저역통과 필터가 필요하고 이는 지연을 더한다.
- 순수 힘 제어는 접촉이 사라지면 가속한다. 속도 감쇠와 속도·위치 한계를 반드시 둔다.
- 힘 한계를 소프트웨어 파라미터로만 정하는 것은 안전 근거가 아니다. 협동 운전의 힘·압력 제한은 인증된 안전 계통이 한다([로봇 안전](/develop-wiki/knowledge/robotics/robot-safety-iso-10218/), [비상 정지 설계](/develop-wiki/knowledge/robotics/emergency-stop-safety-control-design/)).
- 접촉 안정성(passivity 이론)과 임피던스 설계의 엄밀한 조건은 본 노트에서 다루지 않았다.

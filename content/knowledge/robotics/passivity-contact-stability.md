---
title: 수동성과 접촉 안정성 — 샘플링이 만드는 에너지 누수
aka: [Passivity, Contact Stability, Passivity Bound, Virtual Wall, Haptic Stability, Colgate-Schenkel Condition, Passivity Observer]
category: robotics
group: control
level: advanced
summary: 로봇이 사람이나 환경과 접촉할 때는 "루프가 안정한가" 보다 "시스템이 에너지를 만들어 내지 않는가(수동성)" 가 기준이 된다. 디지털 제어는 샘플링과 유지(ZOH) 때문에 에너지를 새로 만들 수 있고, 가상 벽에서는 물리 댐핑이 b > KT/2 + B 이상이어야 수동이다.
tags: [robotics, control, passivity, contact, impedance, haptics, sampled-data, stability]
related: [robotics/impedance-admittance-force-control, robotics/pid-control, robotics/computed-torque-control, robotics/realtime-dds-latency, robotics/emergency-stop-safety-control-design, robotics/robot-safety-iso-10218]
sources:
  - https://par.nsf.gov/servlets/purl/10533850
updatedAt: 2026-11-19
---

> 출처 메모: 직접 읽은 1차 자료는 Roberts, Moore, Colgate 의 "A New Expression for the Passivity Bound for a Class of Sampled-Data Systems"(IEEE T-RO 2024, 저자 제출본 PDF)다. 이 논문은 Colgate & Schenkel(1994·1997)의 결과를 다시 증명하고 인용한다. Colgate & Schenkel 원문과 Hannaford & Ryu 의 시간 영역 수동성 제어 논문은 접근하지 못해(초록·검색 요약 수준) 아래 해당 부분은 "원문 미확인" 으로 표시한다. 수동 시스템 상호연결의 안정성 정리 자체는 일반 이론으로 서술했고 이 노트에서 증명이나 원문 대조를 하지 않았다.

## 문제

[임피던스 제어](/develop-wiki/knowledge/robotics/impedance-admittance-force-control/)는 접촉 시 로봇이 환경에 보이는 강성·감쇠를 정한다. 그런데 강성을 올릴수록 벽에 닿을 때 떨리거나 튀는 경우가 생긴다. 환경(사람 손, 딱딱한 벽)은 모델을 모르는 변수이므로 "내 모델의 폐루프 극이 안정" 만으로는 부족하다. 어떤 접촉 대상이 와도 안전하다는 보장이 필요하다.

## 해법: 에너지로 보는 수동성

- **수동성**: 시스템이 밖에서 받은 에너지보다 많은 에너지를 내놓을 수 없다는 성질이다. 논문은 질량체 하나에 대해 운동 에너지가 입력 에너지 총합을 넘지 않는다는 형태로 쓴다.
- 일반 이론에서는 수동 시스템끼리 결합하면 결합체도 수동이라 접촉 대상이 수동이면 안정하다고 본다(원문 미확인, 일반 이론). 사람 손이나 벽은 에너지를 만들지 않는 수동 대상으로 모델링한다.
- 연속 시간 제어기는 가상 스프링·댐퍼가 수동이다. 문제는 **디지털 구현**이다. 샘플러와 영차 유지(ZOH)는 한 샘플 동안 힘을 일정하게 유지해, 연속이었다면 일어나지 않았을 에너지 주입을 만든다. 이를 물리 댐핑이 흡수해야 한다.

### 가상 벽 모델

논문의 1자유도 모델은 질량 m 에 점성 감쇠 b > 0 이 있는 햅틱 장치, 이상 샘플러(주기 T), 가상 환경 H(z), 영차 유지, 인간 조작자로 구성된다. 조작자는 수동이지만 그 외에는 임의라고 가정한다. 센서·증폭기 동역학, 비선형, 잡음은 무시한다.

- Colgate & Schenkel 이 보인 필요충분 조건은 논문 식 (1)로 인용된다. 0 ≤ ω ≤ π/T 에서 `b > (T/2) · Re{(1 − e^{−jωT}) H(e^{jωT})} / (1 − cos ωT)` 가 성립해야 수동이다.
- 후방 차분으로 구현한 스프링 K·댐퍼 B 의 가상 벽, `H(z) = K + B(1 − z⁻¹)/T` 에서는 이 식이 간단히 **`b > KT/2 + B`** 가 된다(논문 본문의 특수 사례).
- 후방 차분 대신 Tustin 근사를 쓰면 `b > KT/2 − B` 로 B 가 도움이 되는 것처럼 보이지만, 논문은 한 샘플 이내의 작은 계산 지연만 있어도 수동성이 깨진다고 지적한다.
- 지연이 샘플 주기의 n 배일 때 논문의 보수적 한계는 `b > (2n+1)KT/2 + B` 다. 지연이 한 샘플 늘 때마다 강성 항이 KT 만큼 커진다.

의미를 풀면, 같은 물리 댐핑 b 에서 **허용 강성은 K < 2(b − B)/T** 이고 샘플 주기 T 에 반비례한다. 예를 들어 b = 1 N·s/m, B = 0, T = 1 ms 이면 K 는 2000 N/m 미만이어야 한다. 강성을 올리려면 샘플링을 빠르게 하거나 물리 댐핑(마찰, 기계적 감쇠)을 확보해야 한다.

### 직접 확인

식 (1)을 수치로 훑어 닫힌 식과 비교하고, 시간 영역에서 조작자 없는 폐루프의 안정 경계를 이분법으로 찾았다(질량 m = 0.1 kg).

| K, B, T | 식 (1) 수치 최댓값 | KT/2 + B |
| --- | --- | --- |
| 1000, 2, 1 ms | 2.5000 | 2.5000 |
| 5000, 5, 1 ms | 7.5000 | 7.5000 |
| 5000, 5, 0.5 ms | 6.2500 | 6.2500 |

| 조건 (B = 0) | 폐루프가 안정해지는 최소 b | KT/2 |
| --- | --- | --- |
| m=0.1, K=1000, T=1 ms | 약 0.51 | 0.5 |
| m=0.1, K=20000, T=1 ms | 약 9.85 | 10 |

B 가 크면(예: K=1000, B=2) 조작자 없는 루프는 b 가 거의 0 이어도 안정으로 나왔지만 수동 조건은 b > 2.5 를 요구한다. 곧 **안정하다고 수동인 것은 아니다.** 수동성은 "어떤 수동 조작자가 잡아도" 를 보장하므로 더 엄격하다.

```ts
// 후방 차분 가상 벽(스프링 K, 댐퍼 B, 샘플 주기 T)의 수동성 한계와 허용 강성
export const minPhysicalDamping = (K: number, B: number, T: number, delaySamples = 0) =>
  ((2 * delaySamples + 1) * K * T) / 2 + B;       // 지연이 있으면 논문의 보수적 한계
export const maxStiffness = (b: number, B: number, T: number) => (2 * (b - B)) / T;
```

## 시간 영역 수동성 제어 (원문 미확인)

검색 요약 수준으로만 확인한 내용이다. Hannaford & Ryu 는 수동성 관측기(PO)가 실시간으로 에너지 흐름을 누적하고, 에너지를 내놓는 것으로 판단되면 수동성 제어기(PC)가 가변 감쇠기처럼 그만큼을 소산시키는 방식을 제안했다. 가상 환경이 비선형이거나 지연이 있어 주파수 영역 한계식을 못 쓰는 경우에 유용하다. 세부 식과 가정은 읽지 않았으므로 구현 전에 원문을 확인한다.

## 언제 쓰나

- 강성을 높게 쓰는 접촉 작업(삽입, 가상 벽, 원격 조작)에서 떨림·튕김이 보일 때 원인을 에너지 관점으로 진단.
- 임피던스 파라미터(K, B)·제어 주기·통신 지연을 정할 때 안전 여유 계산.
- 사람과 닿는 로봇에서 "모르는 환경에도 안전" 을 설계 목표로 둘 때.

## 주의/비용

- 위 식은 **1자유도·선형·후방 차분 가상 벽** 모델의 결과다. 다자유도 로봇, 비선형 마찰, 작동기 포화에는 그대로 적용되지 않는다.
- 필요충분 조건이지만 모델에 조작자의 수동성 가정이 들어 있다. 논문은 이를 완화해 수동성이 약간 부족한 조작자도 다루도록 한계를 조금 고쳤다.
- 수동성 설계는 **보수적**이다. 성능(대역폭, 강성)을 깎을 수 있어, 필요한 접촉 강성을 먼저 정하고 b·T 로 맞춘다.
- 제어 주기가 불규칙하거나 통신 지연이 끼면 한계가 빠르게 나빠진다([DDS 지연](/develop-wiki/knowledge/robotics/realtime-dds-latency/) 참고). 지연은 한계식의 계수를 (2n+1) 배로 만든다.
- 수동성은 제어 안정성이지 인체 안전 인증이 아니다. 접촉 시 힘 제한·정지 설계는 [ISO 10218 안전](/develop-wiki/knowledge/robotics/robot-safety-iso-10218/)과 [비상정지 설계](/develop-wiki/knowledge/robotics/emergency-stop-safety-control-design/)에서 따로 다룬다.
- 위 시간 영역 시뮬레이션은 노트용 단순 모델(이분법, 단조성 가정)이다. 실제 장치의 마찰·양자화·작동기 한계는 반영하지 않았다.

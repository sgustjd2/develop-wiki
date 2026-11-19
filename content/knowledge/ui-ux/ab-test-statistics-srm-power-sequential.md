---
title: A/B 테스트 통계 (SRM·검정력·순차 검정·다중 비교)
aka: [A/B Test Statistics, Sample Ratio Mismatch, Statistical Power, Peeking, Sequential Testing, Multiple Comparisons, Bonferroni]
category: ui-ux
group: research
level: advanced
summary: A/B 테스트 결과를 믿기 전에 SRM 으로 데이터 건전성을 확인하고, 검정력으로 표본을 정하며, 중간 확인(peeking)과 다중 지표가 오탐을 부풀리는 정도를 시뮬레이션으로 확인한다.
tags: [ux, ab-testing, statistics, srm, power, sequential-testing, multiple-comparisons, experimentation]
related: [ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/usability-testing-sample-size, ui-ux/deceptive-design-dark-patterns, engineering-practice/feature-flags, mobile-dev/staged-rollout-remote-config]
sources:
  - https://www.lukasvermeer.nl/publications/papers/2019/07/25/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments.html
  - https://arxiv.org/abs/1512.04922
updatedAt: 2026-11-19
---

## 문제

- 대시보드의 p<0.05 가 "효과 있음"을 뜻하려면 가정이 지켜져야 한다. 배정 비율이 어긋났거나, 결과가 좋을 때 멈췄거나, 지표를 여럿 보고 골랐다면 거짓 양성이 크게 늘어난다.
- 기초 지표·A/B 주의점은 [UX 지표](/develop-wiki/knowledge/ui-ux/ux-metrics-sus-heart-ab-test/)에 있다. 이 노트는 통계 점검을 숫자로 보여 준다.

## 해법

### 1. SRM (Sample Ratio Mismatch)

관찰한 변형별 사용자 비율이 설계 비율과 다른 현상. Fabijan 외(KDD 2019)는 SRM 이 다양한 데이터 품질 문제의 증상이고, 검출은 단순한 통계 검정으로 되지만 원인 규명이 어렵다고 보며, 4개 회사 25개 이상 제품의 경험으로 유형 분류를 제시한다(초록 기준; 본문·분류 세부와 권장 임계 p 값은 읽지 못했다). 실무에서는 카이제곱 적합도 검정으로 검사하고, SRM 이면 효과 지표를 해석하지 않고 원인(리다이렉트, 봇 필터, 로깅 누락 등)부터 찾는다.

### 2. 표본 크기와 검정력

기저 전환율 `p1`, 최소 탐지 효과로 `p2`, 양측 유의수준 α, 검정력 1−β 일 때 두 비율 비교의 변형별 표본(표준 정규 근사 공식):

`n = (z_{α/2}·√(2p̄(1−p̄)) + z_β·√(p1(1−p1)+p2(1−p2)))² / (p2−p1)²`, p̄=(p1+p2)/2

### 3. 중간 확인(peeking)과 순차 검정

고정 표본 p 값을 도중에 반복 확인해 처음 유의할 때 멈추면 제1종 오류가 커진다. Johari 외는 어느 시점에 멈춰도 유효한 "always valid" p 값·신뢰구간을 제안한다(초록 기준). 고정 시점 설계를 지키거나 순차 검정 방법을 쓴다.

### 4. 다중 비교

유의수준 α 에서 서로 무관한 m 개 지표를 보면 하나 이상 유의할 확률은 `1−(1−α)^m`. Bonferroni 는 각 검정을 α/m 로 엄격하게 한다(보수적). 주 지표 하나를 사전에 정하는 것이 우선이다.

### 시뮬레이션으로 검증 (직접 작성, Node, 정규 근사 이항 표본, 시드 고정)

```ts
// z 검정: 두 비율 차 (합동 분산)
const z = (x1: number, n1: number, x2: number, n2: number) => {
  const p = (x1 + x2) / (n1 + n2);
  return (x2 / n2 - x1 / n1) / Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
};
// 시나리오: p1=10%, p2=11%, α=0.05(양측, z=1.96), 검정력 80%(z=0.8416)
// 시나리오 A/A: 두 군 모두 p=10%, 변형별 n=14,751, 5,000회 반복
//   고정 표본 최종 시점 1회 검정  -> 오탐 4.6%
//   10번 나눠 보고 처음 |z|>1.96 에 멈춤 -> 오탐 19.0%
// 시나리오: 서로 무관한 20개 지표, 모두 효과 없음, 3,000회
//   하나라도 유의(α=0.05)  -> 64.9% (이론 1−0.95^20 = 64.2%)
//   Bonferroni(α/20, z=3.023) -> 4.7%
```

| 항목 | 값 |
| --- | --- |
| 공식으로 구한 표본(10%→11%, α 0.05, 검정력 80%) | 변형별 14,751 |
| 그 표본에서 실제 검정력(5,000회) | 80.9% |
| A/A 오탐: 고정 표본 / 10회 peeking | 4.6% / 19.0% |
| 20개 무효과 지표 중 하나 이상 유의: 보정 없음 / Bonferroni | 64.9% / 4.7% |
| SRM 예: 50,000 대 51,200(50:50 설계) | χ²=14.23 → p<0.0005 |

SRM 예의 χ²≈14.23 은 자유도 1 에서 p<0.0005 의 임계 χ²≈12.12 를 넘는다. 설계가 맞는데 이 임계로 SRM 경보가 울린 비율은 200,000회 중 0.04%(이론 0.05% 근처)였다. 위 수치는 이 노트의 시뮬레이션 결과이며 외부 논문 수치가 아니다.

## 언제 쓰나

- 실험 설계 전: 최소 탐지 효과·기간·표본 계산.
- 결과 해석 전: SRM 점검 → 지표 사전 등록 → 보정.
- 결과를 자주 보고 싶은 팀: 순차 검정 도구 사용.

## 체크리스트

- [ ] 주 지표 1개, 가드레일 지표, 최소 탐지 효과를 사전에 적었다
- [ ] 표본·기간을 정하고(요일 주기를 포함) 그 전에 멈추지 않는다
- [ ] SRM 검사를 먼저 하고 통과 못 하면 효과 해석을 보류한다
- [ ] 보조 지표가 많으면 보정하거나 탐색용으로 표시한다
- [ ] A/A 테스트로 배정·로깅을 점검한다

## 흔한 실수·주의

- **유의해지면 멈춘다.** 위 시뮬레이션처럼 5%가 19%가 된다(중간 확인 횟수에 따라 다름).
- **효과 없음 = 효과 0 으로 읽는다.** 검정력이 낮으면 못 본 것일 뿐이다.
- **SRM 을 무시한다.** 사용자 분포가 달라져 비교 자체가 무의미해질 수 있다.
- **Bonferroni 를 만능으로 쓴다.** 지표가 많으면 검정력이 크게 떨어진다. 사전 등록이 우선.
- 정규 근사, 독립 가정 시뮬레이션이라 실제 로그(중복 사용자, 비독립)에는 맞지 않는다. 실측 분산·유닛 단위로 재확인한다.

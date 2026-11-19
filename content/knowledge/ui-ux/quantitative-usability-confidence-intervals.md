---
title: 정량 사용성 지표와 신뢰구간 (과업 성공률·Adjusted Wald·SUS 해석)
aka: [Task Success Rate Confidence Interval, Adjusted Wald, Agresti-Coull, Wilson Interval, Small Sample Usability, SUS Interpretation, 과업 완료율 신뢰구간]
category: ui-ux
group: research
level: advanced
summary: 소표본 사용성 테스트의 과업 성공률을 점추정만 쓰지 않고 Adjusted Wald 신뢰구간으로 보고하는 계산법을 시뮬레이션으로 검증하고, SUS 점수를 해석할 때의 한계를 정리한다.
tags: [ux, metrics, statistics, confidence-interval, adjusted-wald, sus, task-success, small-sample]
related: [ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/usability-testing-sample-size, ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/usability-test-tasks-think-aloud, ui-ux/ux-research-method-selection]
sources:
  - https://measuringu.com/ci-five-steps/
  - https://doi.org/10.1080/00031305.1998.10480550
  - https://www.nngroup.com/articles/quantitative-studies-how-many-users/
  - https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval
updatedAt: 2026-11-19
---

## 문제

- 8명 중 8명이 성공했다. 성공률 100%라고 보고하면 "완벽"으로 읽힌다. 같은 과업을 다른 8명이 했을 때 6명이 성공할 수도 있다.
- 10명 중 9명 성공(90%)과 20명 중 18명 성공(90%)은 같은 숫자지만 불확실성이 전혀 다르다.
- 표준적인 Wald 구간(`p ± 1.96·√(p(1−p)/n)`)은 n 이 작거나 p 가 0·1에 가까우면 폭이 0이 되거나 100%를 넘는다.

## 해법

### 1. Adjusted Wald (Agresti-Coull 계열)

MeasuringU 가 소표본 완료율에 쓰는 절차(95%)다.

1. 성공 `x`, 시도 `n`. 조정: `x' = x + 2`, `n' = n + 4`, `p' = x'/n'`.
2. 표준오차 `se = √(p'(1−p')/n')`.
3. 구간 `p' ± 2·se` (엄밀하게는 z=1.96 쓰고 `x+z²/2`, `n+z²`; 2는 그 근사).

```ts
function adjustedWald(x: number, n: number, z = 1.96): [number, number] {
  const nn = n + z * z;
  const p = (x + (z * z) / 2) / nn;
  const m = z * Math.sqrt((p * (1 - p)) / nn);
  return [Math.max(0, p - m), Math.min(1, p + m)];
}
```

### 2. 직접 계산해 확인한 값 (Node 로 실행, 95%)

| 결과 | Wald | Adjusted Wald (+2/+4) | Wilson |
| --- | --- | --- | --- |
| 8/10 | 0.552~1.048 | 0.473~0.956 | 0.490~0.943 |
| 10/10 | 1.000~1.000 | 0.670~1.000 | 0.722~1.000 |
| 6/8 | 0.450~1.050 | 0.395~0.939 | 0.409~0.929 |
| 0/10 | 0.000~0.000 | 0.000~0.330 | 0.000~0.278 |
| 40/50 | 0.689~0.911 | 0.665~0.891 | 0.670~0.888 |

- 10/10 에서 Wald 는 "구간 폭 0"을 낸다. Adjusted 는 하한 약 0.67 로 "10명 전원 성공해도 모집단 성공률이 67%일 수 있다"를 보여 준다.
- MeasuringU 글의 예시 중 40/50 은 ".69~.91"로 적혀 있는데, 같은 글의 절차대로 계산하면 0.665~0.891 이다(위 값). 본문이 중간값을 반올림했거나 표기 오류로 보이며, 6/8 예시 상한(.91)도 절차 계산(약 .94)과 어긋난다. 이 노트는 직접 계산한 값을 쓴다.

### 3. 포괄률(coverage) 시뮬레이션

실제 성공률 p 가 정해졌을 때 구간이 p 를 포함하는 비율을 이항분포로 정확히 계산했다(목표 0.95).

| n | p | Wald | Adjusted | Wilson |
| --- | --- | --- | --- | --- |
| 10 | 0.9 | 0.650 | 0.930 | 0.930 |
| 10 | 0.95 | 0.400 | 0.988 | 0.914 |
| 20 | 0.9 | 0.876 | 0.957 | 0.957 |
| 20 | 0.95 | 0.639 | 0.984 | 0.925 |
| 50 | 0.9 | 0.879 | 0.970 | 0.970 |

- 소표본·높은 성공률에서 Wald 는 95% 구간이 실제로는 40~65%만 포함할 정도로 나쁘다. Adjusted 는 n=10, p=0.9 에서 0.930 으로 목표보다 약간 낮지만 Wald 보다 훨씬 가깝고 p=0.95 에서는 보수적(0.984)이다. Wilson 은 p=0.95 에서 0.91~0.93 으로 내려간다.
- 이 표는 이 저장소의 Node 스크립트(재현 가능, 난수 없음)로 얻은 값이다. 논문(Agresti & Coull, 1998)은 접근이 되지 않아 직접 읽지 못했다.

### 4. SUS 해석

- 계산식과 평균 약 68 이라는 벤치마크는 [UX 지표](/develop-wiki/knowledge/ui-ux/ux-metrics-sus-heart-ab-test/) 노트에 있다. 여기서는 계산 검증만: 모든 문항을 3점으로 답하면 50, 전부 최선이면 100, 전부 최악이면 0 이 나온다(코드로 확인).
- SUS 평균도 표본이 작으면 불확실하다. 점수 평균에 t 구간을 붙이고(연속 데이터), 두 디자인 비교는 구간이 겹치는지·차이의 구간으로 본다.
- 한 개 숫자를 "A등급" 같은 문자로 바꾸는 표는 출처마다 구간이 다르다. 이 노트는 특정 등급표를 옮기지 않았다.

## 언제 쓰나

- 5~30명 규모 정량 사용성 테스트의 과업 성공률 보고.
- 리디자인 전후 성공률 비교, 목표치(예: 80% 이상) 달성 여부 판단.

## 체크리스트

- [ ] 성공 정의(부분 성공 포함 여부)를 과업별로 사전 고정
- [ ] 점추정과 95% 구간을 함께 보고
- [ ] 구간 하한이 목표치를 넘는지로 "달성" 판단
- [ ] 두 조건 비교는 각각의 구간이 아니라 차이를 검정(구간이 겹쳐도 차이가 유의할 수 있음)
- [ ] 같은 참가자가 여러 과업을 하면 과업 간 독립을 가정하지 않는다

## 흔한 실수·주의

- **100%를 "완벽"으로 보고.** 소표본 하한을 반드시 적는다.
- **구간 계산을 정규 분포 가정으로 소표본 시간 데이터에 적용.** 완료 시간은 치우친 분포라 로그 변환 후 구간을 계산하는 방법이 흔하다(이 노트에서 검증하지 않음).
- **신뢰구간을 "참값이 이 안에 있을 확률"로 해석.** 반복 시 구간이 참값을 포함하는 비율에 대한 말이다.
- **다중 과업 전부에 유의성 검정.** 다중 비교 문제 → [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)
- NN/g 정량 표본 권고(2006년 글 20명, 2021년 글 40명)는 [표본 크기](/develop-wiki/knowledge/ui-ux/usability-testing-sample-size/) 참고. Wilson 구간의 포괄률 비교는 직접 계산 결과이며 출처 문헌은 확인하지 못했다.

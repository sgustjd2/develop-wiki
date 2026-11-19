---
title: 셋 이상 조건의 대응 이진 결과 비교 — Cochran's Q 검정
aka: [Cochran's Q Test, Cochran Q, Comparison of Percentages in Matched Samples, Repeated Binary Outcomes, 코크란 Q 검정]
category: ui-ux
group: research
level: advanced
summary: 같은 참가자가 디자인 3개 이상을 모두 써 본 과업 성공/실패를 비교하는 Cochran's Q 검정의 식·자유도·소표본 한계와, 사후 쌍별 McNemar·Holm 교정까지 직접 계산한 예로 정리한다.
tags: [ux, statistics, cochran-q, paired-data, success-rate, within-subjects, nonparametric, small-sample]
related: [ui-ux/mcnemar-test-paired-proportions, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/within-subjects-counterbalancing-latin-square, ui-ux/paired-proportion-difference-confidence-interval, ui-ux/mixed-effects-models-usability-studies, ui-ux/quantitative-usability-confidence-intervals, ui-ux/usability-testing-sample-size]
sources:
  - https://doi.org/10.1093/biomet/37.3-4.256
  - https://en.wikipedia.org/wiki/Cochran%27s_Q_test
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.contingency_tables.cochrans_q.html
updatedAt: 2026-11-19
---

두 조건이면 [McNemar 검정](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/)으로 충분하다. 이 노트는 그 확장인 **세 조건 이상**을 다룬다.

## 문제

- 20명이 디자인 A·B·C 로 같은 과업을 모두 했다. 성공 수 A 8, B 13, C 15. "세 디자인의 성공률이 다르다"고 말할 수 있나?
- 쌍별 McNemar 를 세 번 돌리면 다중 비교 문제가 생기고, 전체적으로 차이가 있는지에 대한 하나의 답이 없다.
- 독립 표본 카이제곱(3×2 표)은 같은 사람이 세 번 측정됐다는 구조를 버린다.

## 해법

### 1. 식

참가자 b 명(행), 조건 k 개(열), 0/1 결과. 열 합 `C_j`, 행 합 `R_i`, 전체 합 `N`.

```
Q = k(k − 1) · Σ_j (C_j − N/k)² / Σ_i R_i (k − R_i)
```

- 귀무가설: 모든 조건의 성공 확률이 같다. 대안: 적어도 둘이 다르다.
- 근사 분포: 자유도 k − 1 카이제곱. 행 수가 "충분히 클 때" 맞는다(Cochran 1950, statsmodels 문서).
- 모든 조건에서 성공(또는 모두 실패)한 행은 `R_i(k − R_i) = 0` 이라 분모·분자에 기여하지 않는다. McNemar 가 일치 쌍을 버리는 것과 같은 원리다.
- k = 2 이면 McNemar(연속성 보정 없는 카이제곱)와 같다.

```ts
function cochranQ(x: number[][]): number { // 행 = 참가자, 열 = 조건, 값 0/1
  const k = x[0].length;
  const C = x[0].map((_, j) => x.reduce((s, r) => s + r[j], 0));
  const R = x.map((r) => r.reduce((s, v) => s + v, 0));
  const N = R.reduce((s, v) => s + v, 0);
  const num = C.reduce((s, c) => s + (c - N / k) ** 2, 0);
  const den = R.reduce((s, r) => s + r * (k - r), 0);
  return (k * (k - 1) * num) / den; // 자유도 k−1 카이제곱 상위 확률이 p
}
```

### 2. 계산 예 (Python scipy·statsmodels 로 직접 계산)

20명의 결과 패턴(A, B, C):

| 패턴 | 111 | 011 | 001 | 000 | 110 | 101 | 010 | 100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 인원 | 5 | 6 | 3 | 2 | 1 | 1 | 1 | 1 |

- 열 합 8, 13, 15 (성공률 40%, 65%, 75%). 정보가 있는 행 13개(111·000 제외).
- Q = **6.00**, 자유도 2, 카이제곱 근사 p = **0.0498**. statsmodels `cochrans_q` 도 같은 값.
- 정확 순열 p(행 안에서 결과를 조건 간에 뒤섞는 3^13 가지를 모두 열거): **0.0647**.
- 근사로는 5% 경계를 겨우 넘고, 정확 계산으로는 넘지 못한다. 13개 행은 "충분히 큰" 표본이 아니다.

### 3. 사후 쌍별 비교

| 쌍 | 엇갈린 쌍 (b, c) | 정확 p | mid-p | Holm 교정(mid-p 기준) |
| --- | --- | --- | --- | --- |
| A–B | 2, 7 | 0.180 | 0.109 | 0.219 |
| A–C | 2, 9 | 0.065 | 0.039 | 0.116 |
| B–C | 2, 4 | 0.688 | 0.453 | 0.453 |

- 전체 검정이 근사 기준으로 유의해도 쌍별 비교는 Holm 교정 뒤 하나도 유의하지 않다. 엇갈린 쌍이 적으면 흔한 결과다.
- Wikipedia 는 사후 비교로 관심 쌍에 Cochran's Q(=McNemar)를 다시 적용하라고 설명하지만 다중성 교정은 다루지 않는다. 교정은 [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/)을 따른다.

## 언제 쓰나

- 응답자 내 설계에서 3개 이상 시안의 이진 결과: 과업 성공, 첫 클릭 정답, 오류 발생 여부.
- 같은 패널의 3회 이상 반복 측정(출시 전·직후·한 달 뒤 과업 성공).

## 주의·비용

- **효과 크기를 따로 보고한다.** Q 와 p 는 "어딘가 다르다"만 말한다. 조건별 성공률과 쌍별 차이의 구간을 함께 낸다 → [대응 비율 차의 신뢰구간](/develop-wiki/knowledge/ui-ux/paired-proportion-difference-confidence-interval/)
- 소표본에서는 카이제곱 근사를 믿기 어렵다. 위 예처럼 정확 순열 p 를 계산하거나(행이 15개 안팎이면 전수 열거 가능) 몬테카를로 순열을 쓴다(필자 제안). 근사가 맞는 행 수에 대한 수치 기준은 이 노트에서 확인하지 않았다.
- 과업이 여러 개면 참가자 × 과업 구조가 생긴다. Q 는 한 과업(또는 참가자별 요약)에만 맞는다. 과업 난이도·참가자 차이를 함께 다루려면 [혼합효과 모형](/develop-wiki/knowledge/ui-ux/mixed-effects-models-usability-studies/)을 쓴다.
- 순서 효과는 검정이 제거하지 못한다. 라틴 방격으로 순서를 역균형한다 → [응답자 내 설계](/develop-wiki/knowledge/ui-ux/within-subjects-counterbalancing-latin-square/)

## 비교

| 상황 | 검정 |
| --- | --- |
| 같은 사람, 2조건, 이진 | McNemar |
| 같은 사람, 3조건 이상, 이진 | Cochran's Q |
| 같은 사람, 3조건 이상, 순위·리커트 | Friedman |
| 같은 사람, 여러 과업 × 여러 조건, 이진 | 로지스틱 혼합효과 모형 |
| 다른 사람, 3그룹, 이진 | 카이제곱 독립성 검정 |

## 검증 범위

- 확인함: 식·자유도·k=2 동치·"행 수가 커야 근사" 조건은 Wikipedia(Cochran 1950 인용)와 statsmodels 문서. 표 2·3 의 Q, p, 정확 순열 p, 쌍별 p, Holm 값은 Python(scipy 1.18.1, statsmodels 0.15.0)으로 직접 계산.
- 확인 못 함: Cochran(1950) 원문은 서지·DOI 만 확인했고 본문은 읽지 않았다. 카이제곱 근사의 적정 표본 기준(문헌의 수치 규칙), Friedman 검정과의 검정력 비교. 위 TypeScript 함수는 실행하지 않았다(같은 식을 Python 으로 계산해 statsmodels 와 일치 확인).

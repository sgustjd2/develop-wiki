---
title: 범주형 자료 분석 — 분할표·카이제곱·Fisher·오즈비 (Categorical Data Analysis)
aka: [Contingency Table, Chi-square Test, Test of Independence, Homogeneity, Goodness of Fit, Fisher's Exact Test, Odds Ratio, Relative Risk, Cramér's V, 적합도 검정, 교차표]
category: data-analytics
group: statistics
level: intermediate
summary: 분할표에서 카이제곱 독립성·동질성·적합도 검정(기대도수·자유도·조건), Fisher 정확검정, 오즈비·상대위험도, Cramér's V 를 2×2 예제를 직접 계산해 정리한다.
tags: [statistics, categorical-data, chi-square, contingency-table, fisher-exact, odds-ratio, relative-risk, cramers-v, goodness-of-fit]
related: [data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/descriptive-statistics-probability-distributions, data-analytics/correlation-pearson-spearman-kendall, data-analytics/logistic-regression-odds-ratio, data-analytics/nonparametric-tests-rank-based, ui-ux/mcnemar-test-paired-proportions, ui-ux/cochrans-q-test-paired-binary]
sources:
  - https://openintro-ims.netlify.app/inference-tables
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chi2_contingency.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chisquare.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.fisher_exact.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.contingency.association.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.contingency.odds_ratio.html
updatedAt: 2026-11-23
---

## 개요

- 변수가 범주(명목·서열)일 때는 평균 대신 **빈도**를 비교한다. 두 범주형 변수의 교차 빈도표가 **분할표(contingency table)**다.
- 카이제곱 검정은 "관측도수가 귀무가설 아래 기대도수와 얼마나 다른가"를 하나의 통계량 Σ(O−E)²/E 로 잰다.
- 검정은 "연관성이 있는가"만 답한다. 얼마나 센가는 **효과 크기**(오즈비, 상대위험도, Cramér's V)로 따로 본다.

## 시험 범위 대응

- 빅데이터분석기사 3과목 "고급 분석기법 – 범주형 자료 분석", 4과목 "적합도 검정"(공식 출제범위 항목명).
- ADsP/ADP 에서는 "기초 통계분석"의 교차분석·카이제곱 검정으로 나온다. 항목명은 공식 출제범위에서 확인되지 않아 미확인.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 분할표(교차표) | contingency table | 두 범주형 변수의 수준 조합별 빈도표 |
| 기대도수 | expected count | 두 변수가 독립이라고 가정했을 때의 칸별 도수. (행 합 × 열 합) / 전체 합 (OpenIntro) |
| 카이제곱 통계량 | χ² | Σ (관측−기대)² / 기대, 모든 칸에 대해 합 |
| 독립성 검정 | test of independence | 한 표본에서 두 범주형 변수가 독립인지 |
| 동질성 검정 | test of homogeneity | 여러 집단의 범주 분포가 같은지(집단별로 따로 표집). 계산은 독립성 검정과 같은 식 |
| 적합도 검정 | goodness-of-fit test | 관측도수 분포가 지정한 기대 분포와 맞는지 |
| 오즈 / 오즈비 | odds / odds ratio | 오즈 = p/(1−p). 오즈비는 두 집단 오즈의 비 |
| 상대위험도 | relative risk | 두 집단의 사건 확률(위험)의 비 |
| Cramér's V | Cramér's V | χ² 에 기반한 0~1 의 연관 강도. 방향은 없음 (scipy) |

## 카이제곱 검정

### 독립성·동질성

- 기대도수 E_ij = (행 i 합 × 열 j 합) / 전체 합. 통계량 X² = Σ(O−E)²/E. 자유도 df = (R−1)(C−1) (OpenIntro). p-값은 카이제곱 분포의 상위 꼬리 확률.
- 조건(OpenIntro): 관측이 독립이고 모든 칸의 기대도수가 5 이상. scipy 도 칸별 5 이상을 지침으로 말한다.
- 독립성 vs 동질성은 **표집 방식의 차이**다. 한 표본에서 두 변수를 측정하면 독립성, 집단별로 표집해 분포를 비교하면 동질성이며 계산은 같다. 이 구분의 1차 출처 문장은 읽지 못했다(미확인).
- 유의해도 "어느 칸이 원인인지"는 알 수 없다. 칸별 (O−E)/√E(표준화 잔차)로 보는 방법이 일반적이나 이 노트에서 출처를 읽지 않았다.
- 2×2 에서는 scipy 가 Yates 연속성 보정(`correction=True`, df=1 일 때만 적용)을 기본으로 한다. 각 관측을 기대 쪽으로 0.5 만큼 당긴다.

### 직접 계산 (2×2)

| | 반응 O | 반응 X | 합 |
| --- | --- | --- | --- |
| 집단 A | 30 | 20 | 50 |
| 집단 B | 15 | 35 | 50 |

| 항목 | 값 |
| --- | --- |
| 기대도수 | A: 22.5 / 27.5, B: 22.5 / 27.5 |
| χ² (보정 없음), df | 9.09, 1 |
| p-값 (보정 없음) | 0.0026 |
| χ² (Yates 보정) / p | 7.92 / 0.0049 |
| Cramér's V (= φ, 2×2) | 0.3015 |

- 보정을 하면 통계량이 작아지고 p 가 커진다(보수적). 보정의 필요성 자체에는 논쟁이 있다고 알려져 있으나 이 노트에서 확인한 출처는 없다.
- 3×3 예(20,30,10 / 25,15,20 / 10,15,35, n=180): χ² = 28.48, df = 4, p = 1.0×10⁻⁵, Cramér's V = 0.281.

### 적합도 검정

- 관측도수 O_k 가 기대도수 E_k 와 맞는지: X² = Σ(O−E)²/E, 자유도 k−1−ddof. 기대 분포의 모수를 자료에서 p 개 추정했다면 ddof=p 를 쓴다(scipy `chisquare`). 기대·관측 도수는 각각 5 이상이 지침이다.
- 예 1: 4 개 범주 관측 [18, 22, 29, 31], 귀무가설 "동일 확률(기대 25)": χ² = 4.40, df = 3, p = 0.221 → 기각 못 함.
- 예 2: 이항 B(4, p) 에 적합한지(5 개 범주 관측 [6, 22, 38, 26, 8], n=100). 자료에서 p̂ = 0.52 를 추정해 기대를 만들면 ddof=1, df = 5−1−1 = 3, χ² = 0.246, p = 0.970. 모수를 추정했는데 ddof 를 빠뜨리면 자유도가 4 로 잡혀 p 가 틀린다.
- scipy 문서 주의: 모수를 다른 방식으로 추정했다면 정확한 자유도가 k−1−p ~ k−1 사이이고 점근 분포가 카이제곱이 아닐 수 있다.

## Fisher 정확검정

- 2×2 표에서 행·열 합계를 고정하고 초기하분포로 p-값을 정확히 계산한다(귀무가설: 모집단 오즈비 = 1). 양측 p 는 관측 표보다 확률이 크지 않은 모든 표의 확률 합이다(scipy).
- 기대도수가 5 미만인 칸이 있는 소표본에서 쓴다.

### 직접 계산 (소표본)

표 [[6, 2], [1, 4]] (n=13): 최소 기대도수 2.31 (<5).

| 방법 | p |
| --- | --- |
| 카이제곱 (보정 없음) | 0.053 |
| Fisher 정확 (양측) | 0.1026 (scipy 문서 예와 일치) |

- 근사가 맞지 않는 영역에서 카이제곱이 더 작은 p 를 줘 결론이 달라질 수 있다.
- scipy `fisher_exact` 가 반환하는 오즈비는 표본(비조건부) 추정이어서 12.0 이다. R `fisher.test` 의 조건부 MLE 와 다르다(scipy 문서). 필요하면 `contingency.odds_ratio`.

## 연관성의 크기

위 2×2 (A: 30/50, B: 15/50) 계산:

| 지표 | 식 | 값 |
| --- | --- | --- |
| 위험차 | 0.6 − 0.3 | 0.30 |
| 상대위험도 RR | (30/50) / (15/50) | 2.0 |
| 오즈비 OR (표본) | (30×35) / (20×15) | 3.5 |
| 오즈비 (조건부 MLE, scipy 기본) | | 3.45, 95% 구간 [1.42, 8.73] |
| Cramér's V | | 0.3015 |

### 헷갈리는 구분

| 쌍 | 구분 |
| --- | --- |
| 오즈비 vs 상대위험도 | 사건이 드물면 비슷하나, 흔하면 OR 이 RR 보다 멀리 벗어난다(위: RR 2.0, OR 3.5). OR 을 "몇 배 더 일어난다"로 읽으면 과장이 된다 |
| 오즈비 방향 | 두 행(또는 두 열)의 순서를 맞바꾸면 OR 이 역수가 된다(scipy 문서). 행과 열을 모두 바꾸거나 전치하면 값은 같다. 기준 집단을 명시한다 |
| 표본 OR vs 조건부 OR | 표본은 ad/bc, 조건부는 Fisher 비중심 초기하의 MLE. 작은 표에서 값이 다르다 |
| 연관 vs 상관 | Cramér's V 는 방향이 없다(scipy). Pearson r 과 달리 음수가 없다 |
| χ² vs V | χ² 는 n 에 비례해 커진다. V 는 n 영향을 줄인 크기 지표다 |

- Cramér's V 의 식(χ²/(n·min(R−1, C−1))의 제곱근)은 scipy 문서에 식이 없다. 위 3×3 예에서 이 식이 scipy 의 0.281 과 일치함을 확인했다(식 자체는 일반 지식).
- scipy `association` 은 Tschuprow T, Pearson 분할계수도 제공한다.
- RR·OR 의 신뢰구간 근사식(로그 변환)은 이 노트에서 출처를 읽지 않아 싣지 않았다.

## 언제 쓰나 / 주의

| 상황 | 방법 |
| --- | --- |
| 두 범주형 변수가 독립인가(큰 표본) | 카이제곱 독립성 |
| 2×2, 기대도수 < 5 | Fisher 정확(관례. scipy 는 관측·기대 도수 모두 5 이상이라는 흔히 인용되는 지침을 든다) |
| 분포 모양 적합 | 카이제곱 적합도 (연속형 정규성은 K-S 등 → [비모수](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/)) |
| 같은 대상의 전·후 이분 결과 | [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/), 셋 이상은 [Cochran's Q](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/) |
| 결과가 이분형이고 설명변수가 여럿 | [로지스틱 회귀](/develop-wiki/knowledge/data-analytics/logistic-regression-odds-ratio/)(오즈비의 모형 버전) |

- 칸이 독립 관측이어야 한다. 같은 사람이 여러 번 들어가면 쌍으로 처리해야 한다.
- 범주를 합쳐 칸을 크게 만들면 기대도수 조건은 맞지만 해석이 바뀐다. 사후에 범주를 합쳐 유의하게 만들지 않는다.
- n 이 크면 사소한 연관도 유의하다. V·OR 로 크기를 본다 → [p-값](/develop-wiki/knowledge/data-analytics/estimation-hypothesis-testing-errors-pvalue/)

## 검증 범위

- OpenIntro IMS 18 장(inference-tables: 기대도수·통계량·자유도·조건 5), scipy 문서(chi2_contingency, chisquare, fisher_exact, association, odds_ratio)를 읽었다. OpenIntro 의 페이지에는 적합도 검정이 없어 적합도 식·ddof 는 scipy `chisquare` 문서에 근거했다.
- `scipy.stats.relative_risk` 주소는 404 였다(함수는 `scipy.stats.contingency.relative_risk` 로 존재하며 이 문서는 읽지 않았다). RR 은 정의(위험의 비)로 직접 계산했다. 동질성·독립성의 표집 차이, 표준화 잔차, Yates 보정 논쟁은 1차 출처를 읽지 않았다(미확인).
- 수치는 Python 3.15.0, scipy 1.18.1 로 직접 계산(스크래치 `w3/d.py`). 모두 결정적 계산이며 난수는 쓰지 않았다.

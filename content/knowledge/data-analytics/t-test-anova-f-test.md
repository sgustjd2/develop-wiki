---
title: t-검정·분산분석(ANOVA)·F-검정 (t-test, ANOVA, F-test)
aka: [One-sample t-test, Student t-test, Welch t-test, Paired t-test, Levene, Bartlett, One-way ANOVA, Two-way ANOVA, Tukey HSD, 등분산 검정]
category: data-analytics
group: statistics
level: intermediate
summary: 평균 비교의 기본 도구인 일표본·독립 이표본(Student/Welch)·대응표본 t-검정, 등분산 검정, 일원·이원 분산분석과 Tukey 사후검정, 가정 위반 시 대안을 계산 예와 함께 정리한다.
tags: [statistics, t-test, anova, f-test, levene, bartlett, welch, tukey, scipy, statsmodels]
related: [data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/nonparametric-tests-rank-based, data-analytics/descriptive-statistics-probability-distributions, data-analytics/linear-regression-diagnostics-multicollinearity, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/task-time-log-transform-geometric-mean, ui-ux/mixed-effects-models-usability-studies]
sources:
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda359.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35a.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda357.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda354.htm
  - https://openintro-ims.netlify.app/inference-two-means
  - https://openintro-ims.netlify.app/inference-many-means
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_rel.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.f_oneway.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.tukey_hsd.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.levene.html
updatedAt: 2026-11-23
---

## 개요

- 연속형 결과의 **평균**을 기준값 또는 다른 집단과 비교할 때 t-검정을 쓰고, 집단이 셋 이상이면 분산분석(ANOVA)의 F-검정을 쓴다.
- ANOVA 의 F 는 "집단 간 변동 / 집단 내 변동"이고, 등분산 검정의 F 는 "분산 / 분산"이다. 같은 F 분포를 쓰지만 다른 검정이다.
- 각 방법에는 독립성·정규성·등분산 가정이 있다. 가정이 깨졌을 때의 대안을 같이 알아 두는 것이 실무의 핵심이다.

## 시험 범위 대응

- 빅데이터분석기사 4과목 "모수 유의성 검정", 2과목 "가설검정". ADsP/ADP 데이터분석 "기초 통계분석"(항목명만 있으며 세부는 공식 범위에 없다), ADP 실기 "유의성 검정".
- 사후검정(Tukey)·이원분산분석·등분산 검정이 시험 범위에 어디까지 포함되는지는 공식 출제범위의 항목명만으로는 확인되지 않는다(미확인).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 일표본 t-검정 | one-sample t-test | 평균이 기준값 μ₀ 와 같은지. T = (x̄−μ₀)/(s/√N), 자유도 N−1 |
| 독립 이표본 t-검정 | two-sample t-test | 서로 독립인 두 집단의 평균 비교 |
| 합동(pooled) t | Student t | 등분산 가정. s_p² = [(N₁−1)s₁²+(N₂−1)s₂²]/(N₁+N₂−2) 로 분산을 합쳐 T = (Ȳ₁−Ȳ₂)/(s_p√(1/N₁+1/N₂)) |
| Welch t | Welch's t | 등분산 가정 없음. T = (Ȳ₁−Ȳ₂)/√(s₁²/N₁+s₂²/N₂), 자유도는 Welch–Satterthwaite 식 |
| 대응표본 t-검정 | paired t-test | 일대일 대응 관측의 차이 Xᵢ−Yᵢ 에 대한 일표본 t |
| 등분산 검정 | test of equal variances | F(두 집단), Bartlett·Levene(k 집단) |
| 일원분산분석 | one-way ANOVA | 한 요인의 k 수준 평균이 모두 같은지. F = MS_between / MS_within, 자유도 (k−1, N−k) |
| 이원분산분석 | two-way ANOVA | 두 요인의 주효과와 상호작용을 한 번에 검정 |
| 사후검정 | post hoc test | ANOVA 가 유의할 때 어느 쌍이 다른지 찾는 다중 비교 |

## 독립 이표본: Student vs Welch

- 두 방법은 같은 H₀(μ₁=μ₂)를 검정한다. 차이는 분산을 합치느냐다. 합동 t 의 자유도는 N₁+N₂−2, Welch 는 표본분산과 크기에서 계산한 비정수 자유도다(NIST).
- OpenIntro 는 합동 t 를 다루지 않고 분리 분산(Welch 식) 방식만 가르친다. 소프트웨어 없이 계산할 때는 보수적으로 min(n₁,n₂)−1 을 자유도로 쓸 수 있다고 설명한다.
- scipy 의 `ttest_ind` 기본은 `equal_var=True`(합동). `equal_var=False` 가 Welch. 이상값·긴 꼬리 자료는 `trim` 으로 Yuen 절사 t 를 쓸 수 있다고 문서가 안내한다.
- 분산이 같은지 먼저 검정해서 방법을 고르는 2단계 절차보다 처음부터 Welch 를 쓰는 편이 안전하다는 의견이 있으나 이 노트에서 1차 출처로 확인하지 못했다(미확인). 선택 기준은 연구 전에 정해 둔다.

### 직접 계산

(1) 두 집단 6개·8개 [12.1, 11.8, 12.5, 12.0, 12.3, 11.9] vs [10.0, 14.5, 8.9, 15.2, 9.5, 13.8, 16.0, 7.9] (분산 비 약 152배):

| 방법 | t | 자유도 | p |
| --- | --- | --- | --- |
| 합동 t | 0.094 | 12 | 0.9267 |
| Welch t | 0.109 | 7.12 | 0.9159 |

- 이 자료는 평균이 거의 같아 결론은 같지만 **자유도가 12 → 7.1 로 달라진다.** 분산이 크게 다르고 표본 크기도 다르면 합동 t 의 p-값이 왜곡될 수 있다.
- 분산 비 F = s₂²/s₁² = 152.1, 양측 p = 3.2×10⁻⁵ (자유도 7, 5). F 검정의 정규성 민감도는 NIST F-검정 페이지가 다루지 않아 이 노트에서는 확인하지 못했다(Bartlett 쪽 민감도만 확인).

(2) 대응표본(8 명 전·후 [8.2, 7.9, 9.1, 8.8, 7.5, 8.0, 9.4, 8.6] vs [7.6, 7.7, 8.4, 8.9, 7.0, 7.5, 8.8, 8.1]): `ttest_rel` t = 4.73, 자유도 7, p = 0.0021. 차이 벡터에 `ttest_1samp(d, 0)`을 쓰면 **완전히 같은 값**이다.

- 대응이 가능한데 독립 t 를 쓰면 개인차가 오차에 섞여 검정력이 떨어진다(OpenIntro: 대응 검정이 대개 더 강력).

## 등분산 검정

| 검정 | 대상 | 통계량 | 정규성 민감도 |
| --- | --- | --- | --- |
| F | 2 집단 | F = s₁²/s₂², 자유도 (N₁−1, N₂−1) | 이 NIST 페이지는 민감도를 적지 않음 |
| Bartlett | k 집단 | 자유도 k−1 카이제곱 | 정규성에서 벗어나면 유의 결과가 분산 차이가 아니라 비정규성 때문일 수 있음(NIST) |
| Levene | k 집단 | W, F(k−1, N−k) | Bartlett 보다 덜 민감(NIST) |

- Levene 는 각 관측의 "그룹 중심으로부터의 절대 편차"에 일원 ANOVA 를 적용한 꼴이다. 중심으로 평균(원래 Levene)·중앙값(Brown–Forsythe)·절사평균을 고르며, NIST 는 중앙값 방식이 많은 비정규 형태에서 강건하다고 일반 권장한다. scipy 기본값도 `center='median'`.
- 직접 계산(위 (1)자료): Levene(중앙값) W = 56.86, p = 6.9×10⁻⁶; Levene(평균) W = 57.51; Bartlett T = 17.22, p = 3.3×10⁻⁵. 모두 등분산 기각.

## 일원 분산분석

모형: Yᵢⱼ = μ + αᵢ + Eᵢⱼ. 변동 분해 SS_total = SS_between(요인) + SS_within(잔차). 자유도는 요인 k−1, 잔차 N−k, F = MS_between/MS_within (NIST·OpenIntro). H₀ 는 모든 집단 평균이 같다, Hₐ 는 적어도 하나가 다르다.

### 직접 계산

집단 A [23,25,21,22,24,26], B [28,30,27,31,29,26], C [24,22,25,27,23,26]:

| 요소 | 값 |
| --- | --- |
| SS_between / SS_within | 84.0 / 52.5 |
| 자유도 | 2 / 15 |
| F | 12.0 (직접 식과 `f_oneway` 일치), p = 0.00077 |
| η² = SS_between/SS_total | 0.615 |

Tukey HSD(`tukey_hsd`), 쌍별 평균 차이와 보정 p:

| 쌍 | 평균 차이의 절댓값 | p |
| --- | --- | --- |
| A–B | 5.0 | 0.001 |
| A–C | 1.0 | 0.633 |
| B–C | 4.0 | 0.006 |

- ANOVA 가 유의해도 "어느 집단"인지는 알려 주지 않는다. 쌍마다 t-검정을 하면 제1종 오류가 쌓이므로(OpenIntro 경고) Tukey 같은 다중 비교를 쓴다.
- scipy `tukey_hsd`: 표본 크기가 다르면 Tukey–Kramer, `equal_var=False` 이면 Games–Howell. 가정은 독립·정규·동일한 분산이다.
- Tukey 의 통계량·스튜던트화 범위 분포 정의는 이 노트에서 1차 출처로 읽지 못했다(NIST 해당 페이지에 없음). scipy 문서의 사용 범위만 근거로 했다.

### 이원분산분석

두 요인(A: lo/hi, B: x/y, 각 칸 4 개)의 2×2 균형 자료를 statsmodels(`ols` + `anova_lm`, typ=2)로 돌렸다.

| 항 | SS | df | F | p |
| --- | --- | --- | --- | --- |
| A | 64 | 1 | 38.4 | 4.6×10⁻⁵ |
| B | 324 | 1 | 194.4 | 8.9×10⁻⁹ |
| A×B | 64 | 1 | 38.4 | 4.6×10⁻⁵ |
| 잔차 | 20 | 12 | | |

- 칸 평균: lo-x 13.5, lo-y 18.5, hi-x 13.5, hi-y 26.5. A 의 효과가 B 수준(x/y)에 따라 0 과 8 로 다르다 → **상호작용**이 유의하다. 상호작용이 있으면 주효과만 해석하지 않고 칸별(단순 효과)로 본다.
- 불균형(칸마다 n 이 다름) 설계에서 제곱합 유형(I/II/III)에 따라 결과가 달라지는 문제는 이 노트에서 확인하지 않았다(미확인).

## 가정과 위반 시 대안

| 가정 | 점검 | 위반 시 |
| --- | --- | --- |
| 독립성 | 설계로 확인(검정으로 못 잡음) | 대응·반복측정이면 대응 t, 혼합효과모형 |
| 정규성 | 정규 확률도·Shapiro–Wilk(귀무가설이 정규. n>5000 이면 p-값 부정확, scipy) | 큰 n 에서는 CLT 에 기댐, 작은 n 이면 [비모수 검정](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/), 로그 변환 |
| 등분산 | Levene(중앙값) | t: Welch. ANOVA: Welch ANOVA(`f_oneway(equal_var=False)`), Kruskal–Wallis |
| 극단 이상값 | 상자그림 | 절사 t(Yuen), 순위 검정 |

- 정규성 사전검정으로 방법을 고르는 것의 한계(작은 n 에서 검정력 부족, 큰 n 에서 사소한 이탈에도 기각)는 널리 지적되지만 이 노트에서 1차 출처로 확인하지 않았다(미확인).
- 시간 같은 비대칭 자료는 로그 변환 후 비교한다 → [로그 변환·기하평균](/develop-wiki/knowledge/ui-ux/task-time-log-transform-geometric-mean/)

## 언제 쓰나 / 주의

| 상황 | 방법 |
| --- | --- |
| 한 집단 평균 vs 기준값 | 일표본 t |
| 두 독립 집단 | Welch t (또는 등분산이 확실하면 합동 t) |
| 같은 대상 전·후, 짝지은 쌍 | 대응 t |
| 셋 이상 집단 | 일원 ANOVA → 유의하면 Tukey |
| 두 요인 | 이원 ANOVA, 상호작용 먼저 확인 |
| 이분 결과의 대응 비교 | [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/) |

- 집단이 많은 비교를 쌍별 t 로 반복하지 않는다.
- p-값만 쓰지 말고 평균 차이와 구간, 효과 크기를 보고한다 → [추정·검정·p-값](/develop-wiki/knowledge/data-analytics/estimation-hypothesis-testing-errors-pvalue/)

## 검증 범위

- NIST Handbook eda352·353·354·357·359·35a(식·가정·F·Bartlett·Levene·일원 ANOVA 모형), OpenIntro IMS 2 장(이표본·ANOVA), scipy 문서(ttest_ind, ttest_rel, f_oneway, tukey_hsd, levene, shapiro)를 읽었다. NIST prc43·prc431·prc474 는 ANOVA·Tukey 세부를 싣지 않아 근거로 쓰지 못했다.
- 모든 수치는 Python 3.15.0, scipy 1.18.1, statsmodels 0.15.0 으로 직접 계산(스크래치 `w3/b.py`, `w3/c.py`). statsmodels `anova_lm` 문서는 읽지 않고 출력만 확인했다.
- 미확인: Tukey 통계량 정의, 불균형 이원 ANOVA 의 제곱합 유형, 정규성 사전검정의 한계에 대한 1차 출처, 공식 시험 범위 중 사후검정·이원 ANOVA 포함 여부.

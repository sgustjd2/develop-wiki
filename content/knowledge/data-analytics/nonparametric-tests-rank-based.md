---
title: 비모수 검정과 순위 기반 검정 (Nonparametric & Rank-based Tests)
aka: [Sign Test, Wilcoxon Signed-Rank, Mann-Whitney U, Wilcoxon Rank-Sum, Kruskal-Wallis, Friedman, Kolmogorov-Smirnov, Runs Test, Distribution-free Tests, 윌콕슨, 맨-휘트니]
category: data-analytics
group: statistics
level: intermediate
summary: 정규성 가정이 어렵거나 자료가 서열·이상값 중심일 때 쓰는 부호·Wilcoxon·Mann-Whitney·Kruskal-Wallis·Friedman·KS·런 검정의 용도와 순위 원리를 모수 검정과 대응시켜 정리한다.
tags: [statistics, nonparametric, rank-test, wilcoxon, mann-whitney, kruskal-wallis, friedman, kolmogorov-smirnov, runs-test, sign-test]
related: [data-analytics/t-test-anova-f-test, data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/sampling-methods-measurement-scales, data-analytics/correlation-pearson-spearman-kendall, data-analytics/categorical-data-contingency-chi-square, ui-ux/mcnemar-test-paired-proportions, ui-ux/cochrans-q-test-paired-binary]
sources:
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mannwhitneyu.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.wilcoxon.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.kruskal.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.friedmanchisquare.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35g.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35d.htm
updatedAt: 2026-11-23
---

## 개요

- **비모수(nonparametric) 검정**은 모집단이 정규분포 같은 특정 모수적 분포를 따른다는 가정을 덜 쓰는 검정이다. 대표 계열은 값 대신 **순위(rank)**를 쓰는 검정이다.
- 순위로 바꾸면 이상값이 아무리 커도 "가장 큰 값" 하나일 뿐이라 영향이 제한된다. 서열 척도 자료(만족도 5단계)에도 쓸 수 있다.
- 대가는 정규 가정이 맞을 때의 검정력 손실(보통 약간)과 효과를 "평균 차이"가 아닌 분포 이동 같은 말로 해석해야 한다는 점이다.

## 시험 범위 대응

- 빅데이터분석기사 3과목 "고급 분석기법 – 비모수 통계"에 대응한다(공식 출제범위 항목명).
- 세부 검정 목록(부호·Wilcoxon 등)은 공식 출제범위 항목명에 나오지 않아 어떤 검정이 시험에 나오는지는 미확인이다. ADsP 에는 직접 항목이 없다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 부호검정 | sign test | 쌍 차이의 부호(+/−)만 세어 + 비율이 0.5 인지 이항검정하는 방법 |
| Wilcoxon 부호순위 검정 | Wilcoxon signed-rank | 쌍 차이가 0 을 중심으로 대칭인지 검정. 대응 t 의 비모수 대안 (scipy) |
| Mann–Whitney U (Wilcoxon 순위합) | Mann–Whitney U | 두 독립 표본의 분포가 같은지 검정. 독립 t 의 비모수 대안. p-값은 순위합 검정과 같다 (scipy) |
| Kruskal–Wallis H | Kruskal–Wallis | 둘 이상 독립 집단. 일원 ANOVA 의 비모수 대안 (scipy) |
| Friedman | Friedman test | 같은 대상의 셋 이상 반복 측정. 반복측정 ANOVA 의 비모수 대안 |
| Kolmogorov–Smirnov | K-S test | 경험적 분포함수의 최대 거리로 분포를 비교 |
| 런 검정 | runs test | 중앙값 기준 +/− 연속 구간 수로 순서의 무작위성 검정 |
| 순위 | rank | 크기순 위치. 동점은 평균 순위 |

## 모수 ↔ 비모수 대응

| 상황 | 모수 검정 | 비모수 대안 |
| --- | --- | --- |
| 한 집단의 중심 vs 기준값, 또는 대응 두 집단 | 일표본·대응 t | 부호검정, Wilcoxon 부호순위 |
| 독립 두 집단 | Welch/Student t | Mann–Whitney U |
| 독립 셋 이상 | 일원 ANOVA | Kruskal–Wallis |
| 같은 대상 셋 이상 | 반복측정 ANOVA | Friedman |
| 분포 일치·적합 | (정규성은 Shapiro 등) | Kolmogorov–Smirnov |
| 순서의 무작위성 | (자기상관 등) | 런 검정 |
| 대응 이분 결과 | | [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/), 셋 이상은 [Cochran's Q](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/) |

## 순위 기반 원리

- Mann–Whitney: 두 표본을 합쳐 순위를 매기고 표본 x 의 순위합 R₁ 을 구한다. U₁ = R₁ − n_x(n_x+1)/2, U₂ = n_x·n_y − U₁ (scipy 문서). 값 자체가 아니라 "x 가 y 보다 큰 쌍이 얼마나 많은가"를 센다.
- 귀무가설은 두 표본이 같은 분포에서 나왔다는 것이다. 대립은 한쪽이 확률적으로 더 크다(stochastically larger). "중앙값이 같다"로 읽으려면 두 분포의 모양이 같다는 추가 가정이 필요하다(scipy: 더 엄격한 가정 아래서 위치 차이로 해석).
- Wilcoxon 부호순위: 차이의 절댓값에 순위를 매기고 + 차이의 순위합과 − 차이의 순위합을 비교한다. 양측 검정 통계량은 둘 중 작은 값이다. 차이가 0 인 쌍은 기본으로 버린다(`zero_method="wilcox"`). 이론은 차이가 독립·동일 분포·동점/0 없음을 가정한다(scipy).
- Kruskal–Wallis: 모든 집단을 합친 순위로 H 를 만들고(동점 보정) p-값은 카이제곱 근사로 구한다. 집단당 5 개 이상이 지침(scipy). 유의하면 어느 집단이 다른지는 따로 사후비교한다.
- Friedman: 각 대상 안에서 조건에 순위를 매기고 조건별 순위합이 같은지 본다. scipy 는 샘플 3개 이상, 같은 길이를 요구하며 카이제곱 근사는 대상 수가 10 초과이고 반복 조건이 6 초과일 때 신뢰할 만하다고 한다.
- Kolmogorov–Smirnov: 두 경험적 CDF 의 최대 차이 D. 연속 분포를 가정하고, 분포의 가운데 쪽 차이에 더 민감하다(NIST). 단측/양측 대립을 고를 수 있다(scipy `ks_2samp`).
- 런 검정(NIST): 중앙값보다 크면 +, 작으면 −로 표시하고 같은 부호의 연속 구간(run) 수 R 을 센다. 기댓값 R̄ = 2n₁n₂/(n₁+n₂) + 1, 분산 2n₁n₂(2n₁n₂−n₁−n₂)/[(n₁+n₂)²(n₁+n₂−1)], Z = (R−R̄)/s_R. n₁, n₂ 가 모두 10 보다 클 때(NIST 대표본 조건) 정규 근사를 쓴다. 아래 예의 n₁=n₂=10 은 이 조건에 못 미치므로 p=0.0216 은 참고치다.

## 직접 계산

Python 3.15.0, scipy 1.18.1(스크래치 `w3/c.py`).

### Mann–Whitney 대 Welch t (이상값 포함)

x = [1.2, 3.4, 2.2, 15.0, 2.9, 3.1, 2.5, 4.0], y = [4.1, 5.5, 6.3, 5.9, 7.2, 30.0, 6.8, 5.2, 6.1].

| 방법 | 통계량 | p |
| --- | --- | --- |
| Mann–Whitney (exact) | U = 8 | 0.0055 |
| Mann–Whitney (asymptotic) | U = 8 | 0.0081 |
| Welch t | t = −1.37 (자유도 12.6) | 0.193 |

- 순위합 R₁ = 44, U₁ = 44 − 8·9/2 = 8 로 위 식과 일치했다.
- x 의 15.0 과 y 의 30.0 이 분산을 키워 t 검정은 차이를 못 찾지만, 순위로는 x 가 y 보다 일관되게 작다. 동점이 없을 때만 exact 가 정확하고, 동점이 있으면 asymptotic(동점 보정)이나 순열 검정을 쓴다(scipy).

### 대응 자료: 부호검정 vs Wilcoxon vs 대응 t

10 쌍 전−후 차이 d = [0.6, 0.2, 0.7, −0.1, 0.5, 0.5, 0.6, 0.5, 1.1, −0.6]. + 8개, − 2개.

| 방법 | 통계량 | p |
| --- | --- | --- |
| 부호검정(`binomtest(8, 10, 0.5)`) | 8/10 | 0.1094 |
| Wilcoxon 부호순위 | 8.0 (작은 쪽 순위합) | 0.0488 |
| 대응 t | t = 2.70 (자유도 9) | 0.0245 |

- 정보를 더 쓰는 방법일수록 p 가 작다. 부호검정은 크기를 버리고, Wilcoxon 은 크기의 순위, t 는 크기 자체를 쓴다. 부호검정은 가정이 가장 약한 대신 검정력이 낮다.
- 이 차이에는 절댓값 동점(0.5 가 3개, 0.6 이 2개)이 있다. 동점 때문에 'exact' 방식은 정확한 p 가 아니며, scipy `method='auto'` 는 n≤13 이면 전수 순열로 p 를 구한다(문서). 이 자료는 n=10 이라 0.0488 은 순열 p 일 가능성이 크다.

### Kruskal–Wallis, Friedman

- A [23,25,21,22,24,26], B [28,30,27,31,29,26], C [24,22,25,27,23,26]: H = 10.40, p = 0.0055 (같은 자료의 ANOVA 는 F=12.0, p=0.0008).
- 6 명이 세 조건을 모두 경험한 자료: 모든 대상이 조건 1 < 2 < 3 순서라 순위가 [1,2,3]으로 같다. Friedman χ² = 12.0, p = 0.0025. 다만 이 예는 대상 6 명이라 scipy 가 말한 "카이제곱 근사 신뢰 조건"에 못 미치므로 p 는 참고용이다.

### Kolmogorov–Smirnov

- N(0,1) 50 개 vs N(0.6,1) 50 개(seed 3): D = 0.26, p = 0.068. 평균이 0.6 σ 다른데도 n=50 으로는 5% 에서 기각하지 못한다.
- 단일표본 KS 를 정규성 검정에 쓸 때 **모수를 자료에서 추정하면 표준 임계값이 맞지 않는다**(NIST). 직접 확인: 진짜 N(5,2²)에서 n=30 표본 2,000 개로 `kstest` 를 돌렸을 때 모수를 알고 쓰면 기각률 0.0555(≈0.05), 표본 평균·표준편차를 넣으면 **0/2000**. 너무 보수적이라 정규성 위반을 놓친다(seed 3 계열).

### 런 검정 (NIST 식)

20 개 값 시퀀스, 중앙값 기준 n₁=n₂=10, 런 수 R=16, 기댓값 11, 분산 4.74, Z = 2.30, 양측 p = 0.0216. 값이 번갈아 위·아래로 오가는 패턴이 우연보다 잦다는 뜻이다. 시퀀스는 필자가 만든 예제다.

## 언제 쓰나 / 주의

- 선택 기준: 표본이 작고 비대칭·이상값이 있다, 서열 척도다, 정규성 확인이 어렵다. 반대로 n 이 크면 CLT 덕에 t 검정도 대체로 안전하다.
- 비모수가 "가정이 없다"는 뜻은 아니다. 독립성, 같은 모양(위치 해석 시), 동점 처리 등 가정이 있다.
- 동점이 많으면 정확 p-값이 안 맞는다. 순열 검정을 고려한다.
- 두 독립 표본 비교에서 Mann–Whitney 의 귀무는 "분포 동일"이어서, 분산이 다른데 중앙값이 같은 두 분포에서도 기각될 수 있다. 중앙값 비교로 단정하지 않는다(해석 제한은 scipy 의 귀무가설 설명에 근거).
- 같은 대상이 셋 이상 조건: Friedman, 이분 결과면 Cochran's Q. 다중 사후비교는 별도 교정이 필요하다 → [t·ANOVA](/develop-wiki/knowledge/data-analytics/t-test-anova-f-test/).
- 순위 기반 상관(Spearman, Kendall)은 [상관 노트](/develop-wiki/knowledge/data-analytics/correlation-pearson-spearman-kendall/).

## 검증 범위

- scipy 문서 `mannwhitneyu`, `wilcoxon`, `kruskal`, `friedmanchisquare`, `ks_2samp`, `binomtest`, NIST eda35g(K-S), eda35d(런 검정)을 읽었다. NIST K-S 페이지는 이표본 버전을 다루지 않는다.
- 부호검정의 정의는 별도 1차 출처 없이 `binomtest` 사용법과 일반 정의로 썼다(미확인). Kruskal–Wallis H·Friedman 통계량의 식은 읽지 않았다(순위 원리만 설명).
- 검정력 손실의 크기(예: 정규 자료에서 Mann–Whitney 의 상대 효율)는 확인하지 않아 수치를 쓰지 않았다.
- 공식 출제범위에서 비모수 항목 세부는 미확인. research/drafts 의 Friedman 초안은 참고하거나 링크하지 않았다.

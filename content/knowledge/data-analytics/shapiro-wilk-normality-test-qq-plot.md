---
title: 정규성 검정과 Q-Q 그림 (Shapiro–Wilk, Anderson–Darling, Q-Q plot)
aka: [Normality Test, Shapiro-Wilk, Anderson-Darling, Kolmogorov-Smirnov, Lilliefors, Jarque-Bera, D'Agostino-Pearson, Normal Probability Plot, Q-Q plot, 정규성 검정]
category: data-analytics
group: statistics
level: intermediate
summary: 자료가 정규분포에서 나왔는지 보는 Shapiro–Wilk·Anderson–Darling·Lilliefors·Jarque–Bera 검정과 Q-Q 그림 읽는 법, 표본 크기에 따른 검정의 민감도와 N>5000 의 p-값 주의를 직접 계산으로 정리한다.
tags: [statistics, normality, shapiro-wilk, anderson-darling, lilliefors, jarque-bera, qq-plot, scipy]
related: [data-analytics/t-test-anova-f-test, data-analytics/nonparametric-tests-rank-based, data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/descriptive-statistics-probability-distributions, data-analytics/eda-exploratory-data-analysis-visual, data-analytics/linear-regression-diagnostics-multicollinearity, data-analytics/bootstrap-permutation-test]
sources:
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.shapiro.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.anderson.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.normaltest.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.jarque_bera.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.probplot.html
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.diagnostic.lilliefors.html
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda33l.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35g.htm
  - https://www.itl.nist.gov/div898/handbook/prc/section2/prc213.htm
  - https://arxiv.org/abs/2302.11536
updatedAt: 2026-11-23
---

## 개요

- t-검정·ANOVA·회귀 잔차 분석은 "정규성"을 가정한다. 그 가정을 **검정(p-값)** 으로도, **그림(Q-Q)** 으로도 점검한다.
- 정규성 검정은 모두 귀무가설이 "자료가 정규분포에서 나왔다"이다. 그래서 p-값이 크다는 것은 정규라는 증거가 아니라 **기각할 증거가 부족하다**는 뜻이다.
- 어느 쪽이든 표본 크기에 크게 좌우된다. 이 노트는 검정마다 무엇을 보는지, 그림을 어떻게 읽는지, 표본 크기가 결과를 어떻게 바꾸는지를 직접 계산으로 보인다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| Shapiro–Wilk 검정 | Shapiro–Wilk test | 정규성 전용. 통계량 W, 작을수록 정규에서 멀다. 정렬한 표본과 정규 순서통계량에서 유도한 상수의 비(NIST) |
| Anderson–Darling 검정 | Anderson–Darling test | K–S 를 변형해 꼬리에 더 큰 가중을 둔 적합도 검정. 통계량 A², 분포별로 임계값이 다름(NIST·scipy) |
| Kolmogorov–Smirnov 검정 | K–S test | 경험분포함수와 이론 누적분포의 최대 격차 D. 분포가 완전히 지정돼야 함(NIST) |
| Lilliefors 검정 | Lilliefors test | 평균·분산을 자료에서 추정한 K–S. 전용 표로 p-값을 구함(statsmodels) |
| D'Agostino–Pearson 검정 | omnibus (`normaltest`) | 왜도 z 와 첨도 z 의 제곱합 s²+k². 표본 8 개 이상(scipy) |
| Jarque–Bera 검정 | Jarque–Bera | 왜도·첨도가 정규와 같은지. 통계량이 점근적으로 자유도 2 카이제곱(scipy) |
| Q-Q 그림 | Q-Q / normal probability plot | 정렬한 표본(세로)을 정규 분위수(가로)에 대응시킨 산점도 |

## 검정마다 무엇을 보나

| 검정 | 민감한 곳 | 쓸 때 조건·한계 |
| --- | --- | --- |
| Shapiro–Wilk | 정규 전반(순서통계량 기반) | scipy: N>5000 이면 W 는 믿을 만하나 p-값은 부정확할 수 있음 |
| Anderson–Darling | 꼬리 | 분포마다 임계값이 달라 소프트웨어 필요(NIST). scipy 는 p-값 산출 방법(`method`)을 명시하도록 FutureWarning 을 냄 |
| K–S | 중심 부근(꼬리보다) | 모수를 추정하면 임계영역이 달라져 보통 모의로 구해야 함(NIST) |
| Lilliefors | K–S 와 같은 성격 | 추정 모수를 반영. statsmodels 는 정규·지수만 지원 |
| D'Agostino–Pearson | 비대칭·두꺼운/얇은 꼬리 | 왜도·첨도 두 요약값에만 의존(scipy). 요약값이 정규와 비슷하면서 모양이 다른 분포는 이 노트에서 시험하지 않았다 |
| Jarque–Bera | 왜도·첨도 | scipy 문서: 표본이 충분히 클 때(>2000)만 점근 근사가 맞음 |

- NIST 는 K–S 보다 Anderson–Darling 이나 Cramér–von Mises 가 일반적으로 더 강력해 많은 분석가가 선호한다고 적는다.
- scipy 의 `anderson` 은 `dist='norm'` 외에 지수·로지스틱·Weibull·Gumbel 도 지원하고, `method` 를 주면 `statistic` 과 `pvalue` 만 돌려준다. 예전의 임계값 목록 반환(`critical_values`·`significance_level`·`fit_result`)은 deprecated 이며 1.19.0 제거 예정이라고 문서에 있다.
- 힘 비교 연구로 Razali & Wah(2011)가 scipy `shapiro` 문서의 참고문헌에 오른다. 이 노트는 그 논문 본문을 읽지 못했다(미확인). Wikipedia 요약에 따르면 그 연구에서 Shapiro–Wilk 의 힘이 가장 높고 Anderson–Darling 이 뒤를 이었다 — 보조 정보로만 둔다.

## Q-Q 그림 읽기

- **구성.** 세로축은 정렬된 자료, 가로축은 정규 순서통계량의 중앙값 근사다(NIST). scipy `probplot` 은 i 번째 점의 이론 분위수를 정규 분위수 함수에 (i−0.3175)/(n+0.365) 를 넣어 구하고(양 끝은 별도 식), 최소제곱 직선과 상관 r 을 함께 준다.
- **읽기.** 점이 직선 근처면 정규가 그럴듯하다. 직선에서 벗어날수록 비정규 증거가 강하다. NIST 는 이탈 유형을 비대칭, 정규보다 짧은 꼬리, 긴 꼬리로 구분하며, 선 모양 자체의 설명은 이 노트에서 읽은 페이지에 없다.
- scipy 문서는 `probplot` 이 "확률 그림"이며 Q-Q·P-P 그림과 혼동하지 말라고 적는다. 이 노트는 관용적으로 정규 확률 그림도 Q-Q 그림이라 부른다.
- 직선 위의 상관 r 을 임계표와 비교하는 정식 검정도 있다고 NIST 가 적는다(이 노트에서 계산하지 않음).

### 직접 계산: 모양별 이탈

표본 100 개(seed 42), 정규화한 표본의 양 끝 값과 이론 분위수(±2.46) 비교. W 와 r 은 같은 표본에서의 값이다.

| 자료 | 표본 최소/최대(표준화) | 이론 | 왜도 | 초과첨도 | Q-Q 직선 r | 읽는 법(직접 확인한 모양) |
| --- | --- | --- | --- | --- | --- | --- |
| 정규 | −2.45 / 2.82 | ±2.46 | −0.14 | −0.27 | 0.993 | 점이 직선 위 |
| 로그정규(오른쪽 꼬리) | −0.85 / 6.31 | ±2.46 | 3.23 | 15.01 | 0.816 | 오른쪽 끝이 직선 위로 치솟고 왼쪽 끝은 안쪽 |
| t(3) (두꺼운 꼬리) | −2.67 / 3.43 | ±2.46 | 0.34 | 2.01 | 0.965 | 양 끝이 직선 바깥으로 벌어짐(S 자) |
| 균등(얇은 꼬리) | −1.77 / 1.62 | ±2.46 | −0.08 | −1.15 | 0.982 | 양 끝이 직선 안쪽으로 말림 |

작은 예 `[2.1, 2.5, 2.8, 3.0, 3.4, 3.9, 5.2, 9.8]` (n=8)의 이론 분위수는 −1.385, −0.838, −0.466, −0.150, 0.150, 0.466, 0.838, 1.385 (손계산 식과 `probplot` 결과 일치). 직선 r=0.854, Shapiro–Wilk W=0.751, p=0.0084. 가장 큰 값 9.8 이 직선 위로 떠 오른쪽 비대칭을 보인다.

## 검정 결과 비교 (직접 계산)

같은 표본 100 개에 검정 5 종(Python 3.15, scipy 1.18.1, statsmodels 0.15.0):

| 자료 | Shapiro W (p) | Anderson A² (p) | Lilliefors D (p) | D'Agostino K² (p) | Jarque–Bera (p) |
| --- | --- | --- | --- | --- | --- |
| 정규 | 0.987 (0.448) | 0.505 (0.150) | 0.074 (0.208) | 0.47 (0.789) | 0.61 (0.736) |
| 로그정규 | 0.678 (<0.0001) | 8.45 (0.010) | 0.237 (0.001) | 98.3 (<0.0001) | 1113 (<0.0001) |
| t(3) | 0.937 (0.0001) | 2.46 (0.010) | 0.111 (0.004) | 10.2 (0.006) | 18.7 (0.0001) |
| 균등 | 0.956 (0.002) | 1.02 (0.011) | 0.072 (0.235) | 27.1 (<0.0001) | 5.62 (0.060) |

- 균등 자료(얇은 꼬리)는 검정마다 결론이 갈린다. Lilliefors(p=0.235)와 Jarque–Bera(p=0.060)는 α=0.05 에서 기각하지 못한다. 한 번의 표본이므로 일반 법칙으로 읽지 않는다.
- Lilliefors 의 0.001 은 표의 한계값에 닿은 값으로 보인다(statsmodels 문서: 표 범위를 벗어나면 0.990 또는 0.001 로 돌려줌). Anderson 의 0.150·0.010 도 한계값처럼 보이나 이를 뒷받침하는 scipy 문서 서술은 확인하지 못했다. 실제 p-값은 더 작거나 클 수 있다. 참고로 scipy `anderson` 의 p-값 옵션 이름은 `method='interpolate'` 이고, 생략하면 FutureWarning 이 난다.

## 표본 크기와 검정

### 직접 계산: 기각 비율

Shapiro–Wilk, α=0.05, 조건당 모의 2000 회(seed 고정, 단일 실행):

| 자료 | n=10 | n=30 | n=100 | n=500 | n=2000 |
| --- | --- | --- | --- | --- | --- |
| 정규(참) | 0.046 | 0.051 | 0.049 | 0.058 | 0.050 |
| t(10)(약간 두꺼운 꼬리) | 0.069 | 0.113 | 0.219 | 0.651 | 0.997 |
| 로그정규(σ=0.8) | 0.465 | 0.968 | 1.000 | 1.000 | 1.000 |

- 귀무가설이 참이면 표본 크기와 무관하게 약 5% 만 기각한다(제1종 오류가 α 로 유지).
- t(10)은 정규에 아주 가깝지만 n=2000 에서는 거의 항상 기각된다. 작은 표본에서는 기각하지 못한다 → **같은 분포가 n 에 따라 정반대 결론**을 낸다.
- 이 현상을 논한 자료: Frumento(2023, arXiv 프리프린트, 심사 여부 미확인)는 표본이 충분히 크면 정규성은 항상 기각되고, 검정이 정작 필요한 작은 표본에서는 힘이 부족해 기각하지 못할 수 있다고 주장한다. 필자의 모의와 같은 방향의 서술이다.
- **"검정 대신 그림"에 대한 근거 강도.** 위 현상은 직접 계산과 프리프린트로 확인했다. "정규성 사전검정 후 방법 선택을 하지 말라"는 일반 권고와 교재의 서술은 이 노트에서 1차 출처로 읽지 못했다(미확인). 표본 크기 보정이 필요하다는 점만 확정 서술한다.

### N>5000 경고

scipy `shapiro` 문서는 N>5000 에서 W 는 믿을 수 있지만 p-값은 부정확할 수 있다고 적는다. 정규 표본 6000 개로 실행하면 `scipy.stats.shapiro: For N > 5000, computed p-value may not be accurate. Current N is 6000.` 경고가 나온다(W=0.9995, p=0.139).

## 헷갈리는 구분

| 구분 | 내용 |
| --- | --- |
| 정규성 검정 vs 등분산 검정 | 둘 다 가정 점검이지만 대상이 다르다. 정규성은 분포 모양, 등분산은 산포. 등분산은 [t-검정·ANOVA](/develop-wiki/knowledge/data-analytics/t-test-anova-f-test/) 참조 |
| 정규성의 대상 | 회귀·ANOVA 에서는 원자료가 아니라 **잔차(오차)** 의 정규성이다. NIST 는 모형 잔차의 정규 확률 그림을 대표 용도로 든다 |
| 표본 vs 표본평균 | 평균 비교의 t 는 표본평균의 분포가 정규에 가까우면 되므로 큰 n 에서는 원자료 정규성이 덜 중요하다(중심극한). 이 노트는 그 경계 n 을 확인하지 않았다 |
| K–S vs Lilliefors | 모수를 먼저 정해 두면 K–S, 자료로 추정하면 Lilliefors 가 맞다. 추정 모수에 표준 K–S 임계값을 쓰면 틀린다(NIST) |
| p-값 큼 vs 정규 확인 | 큰 p 는 기각 실패일 뿐이다. 검정력이 낮은 작은 표본에서는 특히 그렇다 |

## 언제 쓰나 / 주의

- 모수 검정을 쓰기 전에 **그림을 먼저** 본다. 표본이 작을 때는 그림과 도메인 지식이 검정보다 정보가 많다고 본다(필자 판단).
- 큰 표본에서 p<0.05 가 나오면 "기각됐다"로 끝내지 말고 Q-Q 그림에서 이탈이 어디(꼬리·비대칭)인지, 그 이탈이 분석 결과를 바꿀지 본다.
- 이탈이 크면 변환(로그 등), [비모수 검정](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/), [부트스트랩·순열검정](/develop-wiki/knowledge/data-analytics/bootstrap-permutation-test/)을 고려한다.
- 정규성 가정을 "이 검정 통과 = 안전"으로 쓰지 않는다. 여러 검정을 돌려 통과한 것만 보고하면 선택 편향이 생긴다.
- Q-Q 그림도 주관적 판단이 들어간다. 표본이 작으면 정규 표본도 직선에서 흔들려 보인다.

## 검증 범위

- 읽은 것: scipy 문서(shapiro, anderson, normaltest, jarque_bera, probplot), statsmodels `lilliefors` 문서, NIST 핸드북(정규 확률 그림 eda33l, K–S eda35g, prc213 의 SW·AD 설명), Frumento(2023) arXiv 프리프린트 본문 일부(표본 크기·검정력 부분), Wikipedia Normality test(보조).
- 직접 계산: Python 3.15, scipy 1.18.1, statsmodels 0.15.0 (스크래치 `r12/ra/n1.py`). 표의 수치는 seed 고정 단일 실행이다.
- 미확인: Shapiro–Wilk 통계량 식의 세부(scipy 문서에는 식이 없고 Royston 1993 알고리즘을 쓴다고만 적힘. NIST prc213 에는 W 가 정렬 표본 가중합의 제곱을 편차제곱합으로 나눈 비라는 정의만 있고 가중치 계산 상세는 없음)와 NIST SW 전용 페이지(URL 오류로 못 읽음), Razali & Wah(2011) 본문, Ghasemi & Zahediasl(2012) 등 의학통계 개관 논문(사이트 접근 차단으로 읽지 못함), 교재의 "검정 대신 그림" 권고, Q-Q 곡선 모양별 NIST 설명 페이지, `normaltest` 통계량 식 상세, 임계표 기반 r 검정.

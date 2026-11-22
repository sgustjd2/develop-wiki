---
title: 추정·가설검정·오류·p-값 (Estimation, Hypothesis Testing, Errors, p-value)
aka: [Point Estimate, Confidence Interval, Hypothesis Test, Type I Error, Type II Error, Significance Level, Power, p-value, Effect Size, 점추정, 구간추정, 검정력]
category: data-analytics
group: statistics
level: intermediate
summary: 점추정·구간추정과 신뢰구간의 올바른 해석, 가설검정 절차, 제1·2종 오류와 검정력, p-값의 정의와 흔한 오해(ASA 2016), 다중 비교와 효과 크기를 직접 계산과 함께 정리한다.
tags: [statistics, inference, confidence-interval, hypothesis-test, p-value, type-1-error, power, multiple-comparison, effect-size, asa]
related: [data-analytics/descriptive-statistics-probability-distributions, data-analytics/t-test-anova-f-test, data-analytics/nonparametric-tests-rank-based, data-analytics/bayesian-inference-prior-posterior, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/quantitative-usability-confidence-intervals, ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/usability-testing-sample-size]
sources:
  - https://openintro-ims.netlify.app/foundations-errors
  - https://openintro-ims.netlify.app/foundations-bootstrapping
  - https://openintro-ims.netlify.app/inference-one-mean
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.false_discovery_control.html
  - https://www.eurekalert.org/news-releases/906692
  - https://doi.org/10.1080/00031305.2016.1154108
updatedAt: 2026-11-23
---

## 개요

- **추정**은 표본으로 모수를 알아내는 일(점추정: 하나의 값, 구간추정: 범위)이고, **가설검정**은 "모수에 대한 주장이 자료와 얼마나 어긋나는가"를 판단하는 절차다.
- 두 도구는 같은 표본분포에서 나온다. 95% 신뢰구간이 귀무값을 포함하지 않는 것은 5% 수준 양측 검정에서 기각되는 것과 같다(NIST 일표본 t 검정 설명).
- 가장 많이 오해되는 것은 p-값과 신뢰구간이다. 둘 다 "가설이 참일 확률"이나 "이 구간에 참값이 있을 확률"이 아니다.

## 시험 범위 대응

- 빅데이터분석기사 2과목 "통계기법 이해 – 추론통계: 점추정·구간추정·가설검정", 4과목 "모수 유의성 검정·적합도 검정".
- ADP 실기 통계 영역 "통계적 추론·모형: 유의성 검정·신뢰구간", ADsP "기초 통계분석"에 대응한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 점추정량 | point estimate | 표본으로 계산한 모수의 단일 추측값 (OpenIntro: 통계량이라고도 함) |
| 신뢰구간 | confidence interval | 점추정량 ± (임계값 × 표준오차)로 만드는 구간. 신뢰수준은 이 방법의 장기 성공 비율 |
| 귀무가설 H₀ | null hypothesis | 효과·차이가 없다는 기준 주장 |
| 대립가설 Hₐ | alternative hypothesis | 효과·차이가 있다는 주장 (양측/단측) |
| 유의수준 α | significance level | 귀무가설이 참일 때 기각하는 것을 허용하는 확률의 상한. 관례는 0.05 |
| 제1종 오류 | Type I error | 귀무가설이 참인데 기각 |
| 제2종 오류 | Type II error | 대립가설이 참인데 기각 못 함. 확률 β |
| 검정력 | power (1−β) | 대립가설이 참일 때 귀무가설을 기각할 확률 |
| p-값 | p-value | 귀무가설이 참이라고 가정할 때 관측값만큼 또는 더 대립가설 쪽인 결과가 나올 확률 |
| 효과 크기 | effect size | 차이·관계의 크기를 단위 없이(또는 실제 단위로) 나타낸 값 |

## 추정

- 일표본 평균: 점추정 x̄, 구간 x̄ ± t(1−α/2, n−1) · s/√n (NIST). 예: 10 개 측정값(평균 101.9, SE 1.54)의 95% 구간은 [98.42, 105.38]이며 H₀: μ=100 의 t 검정은 t=1.235, p=0.248 로 기각하지 못한다. 구간이 100 을 포함하는 것과 같은 결론이다.
- **신뢰구간 해석**: "같은 방식으로 표본을 계속 뽑아 구간을 만들면 약 95% 가 참값을 포함한다"가 맞다. 이미 계산된 한 구간은 참값을 포함하거나 안 하거나 둘 중 하나이다(OpenIntro, NIST 공통). "참값이 이 구간에 있을 확률이 95%"는 베이즈의 **신용구간** 해석이다([베이지안](/develop-wiki/knowledge/data-analytics/bayesian-inference-prior-posterior/) 참고).
- 표본이 커지면 구간이 좁아지고(정밀), 자료 변동이 크면 넓어진다.

### 직접 계산: 구간의 "장기 성공률"

N(100, 15²)에서 n=10 표본을 10,000번 뽑아 t 구간을 만들었더니 참값 100 을 포함한 비율이 0.9498 이었다(seed 7). 구간이 맞는 비율이 신뢰수준에 가깝다는 뜻이며, 개별 구간의 확률은 아니다.

## 가설검정 절차

1. H₀·Hₐ 를 **자료를 보기 전에** 정한다. 자료를 본 뒤 양측을 단측으로 바꾸면 제1종 오류가 부풀려진다(OpenIntro).
2. 유의수준 α, 검정 방법(필요한 가정 확인).
3. 검정통계량과 p-값 계산.
4. p ≤ α 면 H₀ 기각, 아니면 "기각하지 못함". "H₀ 가 참임을 증명"은 아니다.
5. 결과를 효과 크기·구간과 함께 보고한다.

### 오류와 검정력

| 실제 \ 결정 | H₀ 기각 안 함 | H₀ 기각 |
| --- | --- | --- |
| H₀ 참 | 옳음 (1−α) | 제1종 오류 (α) |
| Hₐ 참 | 제2종 오류 (β) | 옳음 (검정력 1−β) |

- 한쪽 오류를 줄이면 다른 쪽이 늘어난다(OpenIntro). 제1종 오류 비용이 크면 α 를 낮추고, 놓치는 비용이 크면 α 를 올린다.
- 검정력은 효과가 클수록, 표본이 클수록 높아진다(OpenIntro).

### 직접 계산: 두 집단 t 검정의 제1종 오류와 검정력

각 집단 n=30, 표준편차 1, 독립 t 검정(`ttest_ind`)을 10,000번 반복했다(seed 7).

| 상황 | 기각 비율 |
| --- | --- |
| 평균 차이 0 (H₀ 참) | 0.051 ≈ α |
| 평균 차이 0.5(효과 크기 d=0.5) | 0.481 (statsmodels `TTestIndPower` 해석값 0.478) |

- d=0.5 에서 검정력 0.8 을 얻으려면 집단당 약 64 명(63.77, statsmodels `solve_power`)이 필요하다. n=30 이면 효과가 있어도 절반은 놓친다.
- "유의하지 않음 = 차이가 없음"이 아닌 이유가 이것이다. 검정력이 낮았을 수 있다.

## p-값

정의: 귀무가설과 모형 가정이 모두 맞다고 할 때, 관측한 것만큼 극단적인 통계량이 나올 확률. **귀무가설이 참일 확률이 아니다.**

ASA(미국통계학회) 2016 성명(Wasserstein & Lazar)의 여섯 원칙을 보도자료 요약으로 확인한 내용:

1. p-값은 자료가 가정한 통계 모형과 얼마나 어긋나는지를 보여 줄 수 있다.
2. 가설이 참일 확률이나 결과가 우연만으로 생겼을 확률을 알려 주지 않는다.
3. 과학적·정책적 결정을 p-값이 문턱을 넘었는지만으로 하면 안 된다.
4. 올바른 추론은 완전한 보고와 투명성을 요구한다.
5. p-값은 효과의 크기나 중요성을 알려 주지 않는다.
6. p-값 하나만으로는 모형·가설에 대한 증거의 좋은 척도가 되지 못한다.

### 헷갈리는 구분: 흔한 오해

| 오해 | 바로잡기 |
| --- | --- |
| p=0.03 이면 H₀ 가 참일 확률 3% | p-값은 H₀ 를 가정한 뒤의 확률. H₀ 의 사후확률은 사전 정보가 있어야 계산된다 |
| p>0.05 면 효과 없음 | 검정력이 낮을 수 있다. 구간을 본다 |
| p 가 작을수록 효과가 크다 | 표본이 크면 아주 작은 차이도 작은 p 가 나온다(OpenIntro: 통계적 유의성 ≠ 실질적 중요성) |
| p=0.049 와 0.051 은 결론이 반대 | 문턱 하나로 이분법 결론을 내지 않는다(원칙 3) |
| 95% 신뢰구간 = 참값이 95% 확률로 구간 안 | 위 추정 절 참고 |

## 다중 비교

가설을 m 개 검정하면 하나 이상을 잘못 기각할 확률이 커진다. 독립인 20 개 검정을 각각 α=0.05 로 하면 1−0.95²⁰ = 0.641 이다(직접 계산).

예제 p-값 8 개 [0.001, 0.008, 0.012, 0.03, 0.041, 0.049, 0.2, 0.5] 를 statsmodels `multipletests` 로 보정(수준 0.05)했다.

| 방법 | 통제 대상 | 기각되는 가설 | 보정 p (앞 3개) |
| --- | --- | --- | --- |
| Bonferroni | 가족별 오류율(FWER) | 1개 | 0.008, 0.064, 0.096 |
| Holm | FWER (Bonferroni 보다 덜 보수적) | 1개 | 0.008, 0.056, 0.072 |
| Benjamini–Hochberg(BH) | 거짓발견율(FDR) | 3개 | 0.008, 0.032, 0.032 |

- BH 는 기각된 것 중 거짓의 기대 비율(FDR)을 통제한다. 독립이거나 양의 회귀 의존이면 BH 가 q·m₀/m 이하를 보장하고, 임의의 의존이면 BY 를 쓴다(scipy `false_discovery_control` 문서).
- 비교의 용도(확증 vs 탐색)에 따라 FWER/FDR 를 고른다. UX 연구 관점은 [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/)에서 다뤘다.

## 효과 크기

p-값은 "있나 없나", 효과 크기는 "얼마나"다. 두 평균의 표준화 차이 Cohen's d = (평균 차이) / 합동 표준편차. 예: 두 집단(각 8 개) 평균 차이를 합동 표준편차로 나눈 d = 2.30, Welch t=4.60, p=0.0004. 원 단위 차이도 함께 보고하고, ANOVA 에서는 η² = SS_between/SS_total (예: 0.615) 같은 지표를 쓴다. d 의 "작다·중간·크다" 기준값은 Cohen 의 관례로 알려져 있으나 이 노트에서는 출처를 읽지 못해 싣지 않는다.

## 언제 쓰나 / 주의

- 분석 전에 가설·α·표본 크기(검정력)를 정한다. 사후에 유의한 것만 골라 보고하면 제1종 오류가 커진다.
- p-값 단독 보고 금지. 점추정, 구간, 효과 크기, 표본 크기를 함께 낸다.
- 검정의 가정(독립성, 정규성 등)이 깨지면 p-값 자체가 틀린다. 가정별 대안은 [t 검정·ANOVA](/develop-wiki/knowledge/data-analytics/t-test-anova-f-test/), [비모수 검정](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/)에서 다룬다.
- 대규모 자료(빅데이터)는 사소한 차이도 유의해진다. 실질적 의미는 효과 크기로 판단한다.

## 검증 범위

- OpenIntro IMS(foundations-errors: 오류·p-값·검정력, foundations-bootstrapping: 신뢰구간 해석·점추정, inference-one-mean), NIST eda352(일표본 t, 구간·검정 대응), scipy `false_discovery_control` 문서를 읽었다.
- ASA 성명 원문은 tandfonline 접근이 403 이고 PDF 텍스트를 추출하지 못해 **직접 읽지 못했다**. 여섯 원칙은 ASA 보도자료(EurekAlert)의 요약으로 확인했고 원문 표현과 대조하지 않았다. p-값의 공식 정의 문장도 원문에서 확인하지 못해 OpenIntro 의 정의를 썼다.
- Bonferroni·Holm 의 공식(m 배, 순차 기각)은 일반 지식이며 이 노트에서 1차 출처로 읽지 않았다. 수치는 statsmodels 0.15.0 으로 계산했다.
- 계산은 Python 3.15.0, scipy 1.18.1(스크래치 `w3/b.py`). 시뮬레이션 값은 seed 7 의존.
- Cohen's d 기준값, 신뢰구간과 정확검정 변형(정확·mid-p 등)은 미확인/미수록.

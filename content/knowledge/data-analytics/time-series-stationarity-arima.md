---
title: 시계열 정상성과 ARIMA (Time Series Stationarity & ARIMA)
aka: [Stationarity, ACF, PACF, AR, MA, ARMA, ARIMA, SARIMA, Differencing, Exponential Smoothing, ADF Test, 시계열 분석]
category: data-analytics
group: statistics
level: intermediate
summary: 시계열의 네 성분, 약정상성과 차분, ACF·PACF 로 AR·MA 차수를 읽는 법, ARIMA·SARIMA 표기, 이동평균·지수평활, ADF 단위근 검정을 시뮬레이션 계산으로 정리한다.
tags: [time-series, stationarity, arima, acf, pacf, differencing, adf, exponential-smoothing]
related: [data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/correlation-pearson-spearman-kendall, data-analytics/linear-regression-diagnostics-multicollinearity, data-analytics/eda-exploratory-data-analysis-visual, machine-learning/data-split-cross-validation-leakage, machine-learning/model-deployment-monitoring-drift]
sources:
  - https://otexts.com/fpp3/tspatterns.html
  - https://otexts.com/fpp3/stationarity.html
  - https://otexts.com/fpp3/non-seasonal-arima.html
  - https://otexts.com/fpp3/seasonal-arima.html
  - https://otexts.com/fpp3/ses.html
  - https://www.statsmodels.org/stable/generated/statsmodels.tsa.stattools.adfuller.html
  - https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc442.htm
  - https://en.wikipedia.org/wiki/Stationary_process
updatedAt: 2026-11-23
---

## 개요

- 시계열은 시간 순서가 있는 관측 `y₁ … y_T` 이고, 앞뒤 관측이 서로 의존하므로 독립 표본 가정을 쓸 수 없다. 일반 회귀의 독립 오차 가정이 깨진다.
- 시계열 분석은 (1) 구조를 분해해 이해하고, (2) 정상 시계열로 바꿔 자기상관 구조를 모델링(ARIMA)하고, (3) 예측하는 순서로 진행하는 것이 일반적이다.
- ARIMA 는 "과거 값(AR)과 과거 예측오차(MA)의 선형결합, 필요하면 차분(I)"으로 정상 시계열을 표현한다.

## 시험 범위 대응

- ADsP 데이터분석 > 통계분석 > 시계열 예측, ADP 실기 통계 영역 > 시계열 분석, 빅데이터분석기사 3과목 > 고급 분석기법(시계열 분석)에 대응한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 추세 | trend | 장기적 증가·감소. 선형일 필요 없다 |
| 계절성 | seasonal | 달력에 묶인, 주기가 고정되고 알려진 반복 패턴 |
| 순환(주기) | cyclic | 주기가 일정하지 않은 오르내림. 보통 계절보다 길고 변동이 큼 |
| 불규칙(잡음) | irregular, noise | 위 성분으로 설명되지 않는 나머지 |
| 정상성 | stationarity | 통계적 성질이 관측 시점과 무관함 |
| 약정상성 | weak (covariance) stationarity | 평균이 일정, 자기공분산이 시차에만 의존, 2차 모멘트가 유한 |
| 백색잡음 | white noise | 평균 0, 분산 일정, 서로 무상관인 오차 |
| 차분 | differencing | 연속 관측의 차 `yₜ − yₜ₋₁` |
| 자기상관 함수 | ACF | 시차 `k` 에서 `yₜ` 와 `yₜ₋ₖ` 의 상관 |
| 부분자기상관 함수 | PACF | 사이 시차의 영향을 제거한 시차 `k` 상관 |
| 단위근 | unit root | 차분해야 정상이 되는 확률적 추세의 원인(랜덤워크 등) |

- "순환"과 "계절"을 구분하는 기준은 주기가 고정이냐 가변이냐다(FPP3). 수험서마다 "순환 요인"을 달리 설명할 수 있다.

## 정상성과 차분

- FPP3 는 정상 시계열을 "시점에 따라 성질이 달라지지 않는 것"으로 설명하고, 추세·계절성이 있으면 정상이 아니라고 한다. 백색잡음은 정상이다. 각주에서는 모든 시차에 대해 `(yₜ … yₜ₊ₛ)` 의 결합분포가 `t` 에 무관하다는 분포 정의(엄정상성에 가까운)를 준다.
- 이 FPP3 절에는 "약정상성"이란 용어가 없다. 약정상성(= 공분산 정상성)의 3 조건(평균 일정, 자기공분산이 시차에만 의존, 2차 모멘트 유한)은 Wikipedia 를 보조로 확인했다. NIST 핸드북 해당 절은 비형식적으로 "수준·변동성·상관이 시간에 따라 일관됨"이라고 한다.
- 차분은 수준 변화를 제거해 추세와 계절성을 줄인다. 로그는 분산 안정화에 따로 쓴다. 계절 차분은 이전 주기의 같은 시점을 뺀다. FPP3 는 **필요한 만큼만** 차분하라고 한다(과차분은 인위적 자기상관을 만든다).
- 정상 시계열의 ACF 는 비교적 빨리 0 으로 떨어지고, 비정상이면 천천히 떨어지며 `r₁` 이 크고 양수인 경우가 많다.
- 랜덤워크는 차분이 백색잡음인 시계열이다(`yₜ = yₜ₋₁ + εₜ`). 예측값은 마지막 관측값과 같다.

## ACF·PACF 로 차수 읽기

FPP3 의 식별 요령(차분해 정상으로 만든 뒤 적용):

| 모형 | ACF | PACF |
| --- | --- | --- |
| ARIMA(p, d, 0) = AR(p) | 지수적 또는 사인파 감소 | 시차 p 에서 유의한 스파이크 후 절단 |
| ARIMA(0, d, q) = MA(q) | 시차 q 에서 유의한 스파이크 후 절단 | 지수적 또는 사인파 감소 |

- **p 와 q 가 모두 양수이면 이 그림들은 대개 차수 선택에 도움이 안 된다**(FPP3). 이때는 후보 모형을 여럿 적합해 정보기준으로 고른다. FPP3 는 정보기준이 `d` 선택의 좋은 지침이 못 되고 차분 차수가 다른 모형끼리는 AIC 를 비교할 수 없다고 쓴다(차분 횟수가 다르면 서로 다른 자료에 적합한 것).
- 계절 항은 계절 주기 `m` 의 배수 시차(m, 2m, …)에서만 읽는다. 예: 계절 MA(0,0,0)(0,0,1)₁₂ 는 ACF 시차 12 스파이크, PACF 는 12, 24, 36 에서 감소. 계절 AR(1,0,0)₁₂ 는 PACF 시차 12 스파이크, ACF 는 계절 시차에서 감소.

## 모형 표기

| 모형 | 식(FPP3 의 표기를 풀어 씀) |
| --- | --- |
| AR(p) | `yₜ = c + φ₁yₜ₋₁ + … + φ_p yₜ₋ₚ + εₜ` (과거 값에 대한 회귀) |
| MA(q) | `yₜ = c + εₜ + θ₁εₜ₋₁ + … + θ_q εₜ₋_q` (과거 예측오차의 결합) |
| ARMA(p, q) | 위 둘의 결합. 정상 시계열에만 |
| ARIMA(p, d, q) | `d` 번 차분한 시계열에 ARMA(p, q). 후방이동 연산자로 `(1−φ₁B−…)(1−B)^d yₜ = c + (1+θ₁B+…)εₜ` |
| SARIMA(p,d,q)(P,D,Q)ₘ | 계절 항(대문자)이 `m` 기간 후방이동으로 비계절 항에 곱해짐. 예: ARIMA(1,1,1)(1,1,1)₄ |

- **MA(q) 모형**의 "MA"와 **이동평균 평활**은 전혀 다르다. 전자는 과거 예측오차의 결합(회귀가 아님), 후자는 추세 추정용 평활이다(FPP3 의 구분).
- 모형은 정상성·가역성 제약 하에 적합한다. 예측구간은 오차가 무상관·정규라는 가정에 의존하고, 모수·차수 불확실성을 무시해 좁은 경향이 있다(FPP3).

## 평활

- **단순지수평활(SES)**: `ŷ_{T+1|T} = α·y_T + (1−α)·ŷ_{T|T−1}`, `0 ≤ α ≤ 1`. 과거 관측에 지수적으로 줄어드는 가중치를 준다. α 가 크면 최근에 민감, `α = 1` 이면 마지막 값(나이브)이다. 추세·계절이 없는 자료용이고 예측은 평평하다.
- **이동평균 평활**은 인접 `k` 개 값의 평균으로 추세를 추정한다. 이 노트에서 FPP3 의 해당 절은 읽지 않았다.
- 추세·계절이 있으면 Holt, Holt-Winters 같은 확장(ETS 계열)이 있으나 이 노트에서는 이름만 언급한다.

## ADF 단위근 검정

- statsmodels `adfuller`: 귀무가설은 **단위근이 있다(비정상)**, 대립가설은 없다. p 값이 유의수준보다 작으면 단위근 귀무를 기각한다. 옵션은 `regression`("c" 상수, "ct" 상수+추세, "ctt", "n"), 지연 차수는 `autolag`(기본 AIC)로 고른다. p 값은 MacKinnon 근사.
- FPP3 가 쓰는 KPSS 검정은 귀무가설이 반대(**정상**)다. 두 검정은 귀무가 반대라 결과 해석 방향이 다르다.
- 검정은 모형 선택(상수·추세 포함 여부)에 따라 결과가 달라질 수 있어 그림과 함께 본다.

## 직접 계산

Python 3.15, numpy 2.5.5, statsmodels 0.15.0, 시드 고정(`default_rng(42)`, n = 500).

| 시계열 | ACF 시차 1~5 | PACF 시차 1~4 |
| --- | --- | --- |
| AR(1), φ = 0.7 | 0.713, 0.454, 0.260, 0.125, 0.050 (이론 φᵏ = 0.700, 0.490, 0.343, 0.240, 0.168) | 0.714, −0.111, −0.043, −0.030 |
| MA(1), θ = 0.8 | 0.501, −0.002, 0.015, 0.030, −0.009 (이론 시차 1: 0.8/1.64 = 0.488) | 0.502, −0.340, 0.282, −0.203 |

- AR(1)은 ACF 가 서서히 감소하고 PACF 는 시차 1 이후 대부분 0 근처로 절단되는 모양이다. MA(1)은 반대로 ACF 가 시차 1 에서 절단되고 PACF 는 진동하며 감소한다. 표본 ACF 는 이론값에서 어느 정도 벗어난다(예: 시차 3 의 0.260 대 0.343).
- 근사 ±1.96/√n = ±0.088 이 흔히 쓰이는 유의 경계다(FPP3 §2.9: 백색잡음이면 ACF 막대의 95% 가 이 안에 든다). MA(1)의 PACF 는 이 경계를 넘는 값이 여럿이다. 이는 MA 의 PACF 가 감소·진동한다는 FPP3 설명과 같은 모양이다.
- 시차 1 자기상관을 정의대로 `Σ(xₜxₜ₋₁)/Σxₜ²`(평균 제거 후)로 직접 계산하면 0.7128 로 statsmodels `acf` 와 같다.
- 랜덤워크(`cumsum` of 정규잡음): ACF 시차 1~5 가 0.980, 0.957, 0.933, 0.907, 0.882 로 천천히 감소.
- ADF(상수 포함, 5% 임계값 −2.87, 1% −3.44): AR(1) 통계량 −9.17(p ≈ 0 → 단위근 기각), 랜덤워크 −2.27(p = 0.183 → 기각 못 함), 랜덤워크의 1 차 차분 −21.31(p ≈ 0). 차분으로 정상이 된 것으로 보인다(ADF 가 단위근을 기각했다는 통계적 증거이며 확정은 아니다).
- AR(1) 적합(`ARIMA(order=(1,0,0))`): φ̂ = 0.720(참값 0.7).
- SES 직접 계산: `y = [3,5,4,6,8,7]`, α = 0.5, 초기 수준을 첫 관측으로 두면 최종 수준 6.75. FPP3 는 초기값 ℓ₀ 를 데이터로 추정하므로 소프트웨어 결과와 다를 수 있다.
- 모든 수치는 시드 의존이다.

## 언제 쓰나 / 주의

- 단기 예측, 추세·계절 분해, 잔차의 자기상관 제거가 목적일 때. 설명변수가 있으면 회귀 + ARIMA 오차를 쓰는 식으로 확장한다(이 노트에서 확인하지 않음).
- 시계열은 검증 시 **시간 순서를 유지**해야 한다. 무작위 분할은 미래 정보를 쓰는 누수다 → [데이터 분할과 누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)
- ACF/PACF 식별은 단순한 경우에만 쓸모가 있고, 혼합 모형에서는 후보 비교가 필요하다.
- 구조 변화(정책 변경 등)는 ARIMA 가정을 깬다. 배포 후에는 분포 변화를 점검한다 → [모델 모니터링과 드리프트](/develop-wiki/knowledge/machine-learning/model-deployment-monitoring-drift/)

## 검증 범위

- 읽은 것: FPP3(Hyndman & Athanasopoulos) 시계열 패턴·정상성·비계절 ARIMA·계절 ARIMA·SES 절, statsmodels `adfuller` 문서, NIST 핸드북 정상성 절, Wikipedia 정상 과정 항목(약정상성 조건의 보조 확인). 계산은 직접 실행.
- 미확인: FPP3 의 분해(STL)·이동평균 평활·ETS·Holt-Winters 절, ACF 유의 경계 근사식의 출처, 식(모형 표기)의 부호 규약(소프트웨어마다 MA 부호가 다름), ADF 검정의 수식과 임계값 도출, SARIMA 적합 사례(실행 안 함), 수험 교재의 "순환/계절/불규칙/추세" 설명 방식.

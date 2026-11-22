---
title: 선형회귀 진단과 다중공선성 (Linear Regression Diagnostics & Multicollinearity)
aka: [Linear Regression, OLS, VIF, Tolerance, Adjusted R-squared, AIC, BIC, Cook's distance, Leverage]
category: data-analytics
group: statistics
level: intermediate
summary: 단순·다중 선형회귀의 최소제곱 추정과 계수 해석, 잔차로 가정을 점검하는 법, VIF 로 보는 다중공선성, AIC·BIC 변수 선택, Cook 거리·leverage 영향점을 직접 계산으로 정리한다.
tags: [regression, ols, vif, multicollinearity, aic, bic, cooks-distance, diagnostics, statsmodels]
related: [data-analytics/logistic-regression-odds-ratio, data-analytics/correlation-pearson-spearman-kendall, data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/t-test-anova-f-test, data-analytics/feature-selection-dimensionality-reduction, machine-learning/regression-metrics-rmse-mae-r2, machine-learning/overfitting-bias-variance-regularization]
sources:
  - https://www.statsmodels.org/stable/regression.html
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.outliers_influence.variance_inflation_factor.html
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.outliers_influence.OLSInfluence.html
  - https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.RegressionResults.info_criteria.html
  - https://www.sscc.wisc.edu/sscc/pubs/RegDiag-R/no-multicollinearity.html
updatedAt: 2026-11-23
---

## 개요

- 선형회귀는 반응변수 `y` 를 설명변수의 선형결합 + 오차로 모델링한다. 설명변수가 하나면 단순, 둘 이상이면 다중 선형회귀다.
- 최소제곱(OLS)은 잔차제곱합 `Σ(yᵢ − ŷᵢ)²` 을 최소로 하는 계수를 고른다. 정규방정식 `β̂ = (XᵀX)⁻¹Xᵀy` 의 해이며, 설명변수끼리 거의 선형종속이면 `XᵀX` 가 거의 특이해져 계수가 불안정해진다(= 다중공선성).
- 계수 추정만으로는 모델이 믿을 만한지 알 수 없다. 가정이 맞는지(잔차 진단), 설명변수가 서로 겹치지 않는지(VIF), 몇 개 관측치가 결과를 좌우하지 않는지(영향점)를 따로 확인해야 한다.

## 시험 범위 대응

- ADsP 데이터분석 > 통계분석(기초 통계분석), ADP 실기 통계 영역 > 상관·회귀(단순·다중·로지스틱·비선형), 빅데이터분석기사 3과목 > 분석기법(회귀분석)·4과목 > 분석모형 진단에 대응한다. 변수 선택은 ADP 실기 "데이터 품질 평가·변수 선택", 빅데이터분석기사 2과목 "변수 선택"과 이어진다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 회귀계수 | coefficient (β) | 다른 설명변수를 고정했을 때 해당 변수가 1 단위 늘 때 `y` 의 기대 변화량 |
| 잔차 | residual | 관측값에서 적합값을 뺀 `eᵢ = yᵢ − ŷᵢ` (오차 εᵢ 의 추정치) |
| 결정계수 | R² | 설명되는 분산 비율 `1 − SSE/SST` |
| 수정 결정계수 | adjusted R² | 변수 수 `p` 로 벌점을 준 R². `1 − (1 − R²)(n − 1)/(n − p − 1)` |
| 분산팽창계수 | VIF | 변수 `j` 를 나머지 설명변수로 회귀한 R²ⱼ 로 계산한 `1/(1 − R²ⱼ)` |
| 공차 | tolerance | `1 − R²ⱼ` = `1/VIF` |
| 레버리지 | leverage (hᵢ) | 모자 행렬 `H = X(XᵀX)⁻¹Xᵀ` 의 대각 원소. 설명변수 공간에서 관측치가 얼마나 외진 곳에 있는지 |
| Cook 거리 | Cook's distance | 관측치 하나를 빼면 적합값이 얼마나 바뀌는지 요약한 영향도 |
| AIC / BIC | Akaike / Bayesian information criterion | 적합도(로그가능도)에 모수 수 벌점을 더한 모델 비교 지표. 작을수록 좋다 |

## 가정과 잔차 진단

| 가정 | 깨졌을 때 | 보는 법 |
| --- | --- | --- |
| 선형성 | 계수·예측이 편향 | 잔차 대 적합값 그림에 곡선 패턴이 없는가 |
| 오차 독립성 | 표준오차가 틀어짐(시계열·군집 자료) | Durbin-Watson(2 부근이면 자기상관 적음), 잔차의 순서 그림 |
| 등분산성 | 표준오차·검정이 틀어짐 | 잔차 대 적합값의 퍼짐(깔때기 모양), Breusch-Pagan |
| 오차 정규성 | 소표본의 t·F 검정·구간 부정확 | Q-Q 그림, Jarque-Bera (표본이 크면 중요도 낮음) |

- statsmodels 문서는 OLS 가 오차의 독립·동일분포를 전제하고, 이분산·자기상관 오차를 다루는 WLS·GLS·GLSAR 모형을 제공한다고 소개한다. 요약표에는 Omnibus·Jarque-Bera·Durbin-Watson·조건수(Cond. No.)가 함께 나온다.
- 계수 추정 자체(OLS 해)는 정규성 없이도 계산된다. 정규성은 주로 소표본에서 t 검정·신뢰구간의 정확성에 필요하다.

## 다중공선성

- **무슨 문제인가.** 설명변수끼리 강하게 상관되면 개별 계수의 표준오차가 커진다. 예측 성능 자체는 크게 안 변할 수 있지만, 계수의 부호·크기가 흔들리고 유의하지 않게 나온다.
- **VIF.** `√VIF` 는 해당 계수의 표준오차가 얼마나 커졌는지의 배수다. 모든 설명변수가 서로 직교하면 1 이다.
- **기준값은 경험칙이다.** "VIF 5 초과(R²ⱼ > 0.8)" 또는 "10 초과(R²ⱼ > 0.9)" 를 문제로 보는 관행이 널리 쓰인다. SSCC 가이드는 "5 또는 10 같은 기준"이라고만 쓰고, statsmodels 문서는 "하나의 권고"로 5 초과를 든다. 어느 쪽도 통계적 검정이 아니며 하나의 정답 기준이 있는 것이 아니다.
- **예외.** 다항항·교호작용항은 원래 변수와 높은 상관을 가져 VIF 가 크게 나오기 쉽다. SSCC 는 이 경우 즉시 문제로 보지 말고 그 항을 빼고 다시 확인하라고 한다. 평균 중심화가 도움이 되는 경우는 제한적이라고 쓴다.
- **대응.** 중복 변수 제거, 변수 합성(평균·주성분), 능형(ridge) 같은 규제, 또는 계수 해석을 포기하고 예측에만 쓰기. 목적이 예측이면 공선성은 덜 치명적이다.

## 변수 선택과 모델 비교

| 방법 | 절차 |
| --- | --- |
| 전진선택(forward) | 변수 없는 모델에서 시작해 기준을 가장 개선하는 변수를 하나씩 추가 |
| 후진제거(backward) | 전체 변수 모델에서 시작해 기여가 가장 작은 변수를 하나씩 제거 |
| 단계적(stepwise) | 추가와 제거를 번갈아 허용 |

- 기준은 p 값, 수정 R², AIC, BIC 등을 쓴다. 자동 선택은 후보 공간을 좁게 탐색하므로 선택된 모델의 p 값을 그대로 믿기 어렵다는 점에 유의한다(이 노트에서 그 크기를 계산하지는 않았다).
- AIC = `−2 ln L̂ + 2k`, BIC = `−2 ln L̂ + k ln n` (k = 추정 모수 수). 둘 다 작을수록 좋으며, n 이 8 이상이면 BIC 의 벌점이 더 크다(`ln n > 2`). 그래서 BIC 가 더 작은 모델을 택하는 경향이 있다.
- statsmodels 의 `info_criteria` 는 기본적으로 평균 모수만 세고 척도(분산) 모수는 세지 않는다(`dk_params=1` 로 추가). 라이브러리마다 k 에 오차분산을 넣는지가 달라 AIC 값이 상수만큼 다를 수 있다. 같은 도구로 계산한 값끼리만 비교한다.
- R² 는 변수를 추가하면 줄지 않는다. 수정 R² 는 쓸모없는 변수에 벌점을 줘 이를 보정한다.

## 영향점

- 이상값(outlier)은 `y` 방향으로 멀리 있는 점, 레버리지가 큰 점은 `X` 방향으로 외진 점이다. 둘이 겹칠 때 회귀선을 크게 끌어당긴다.
- 레버리지의 합은 `p + 1`(절편 포함 모수 수)이라 평균이 `(p + 1)/n` 이다(아래 계산에서 합 = 4.0000 확인). 이 평균의 몇 배를 넘으면 살펴보라는 관행이 있으나 배수는 관행이다.
- statsmodels `OLSInfluence` 는 `cooks_distance` 와 `hat_matrix_diag` 를 제공하지만, 문서에 Cook 거리·레버리지의 기준값은 없다(DFFITS 에만 `2√(k/n)` 이 적혀 있다). "Cook 거리 > 1" 또는 "4/n" 같은 기준은 이 노트가 읽은 출처에서 확인하지 못했다(SSCC 가이드의 다른 쪽에는 레버리지 2k/n 과 DFFITS 2√(k/n) 기준이 있으나 Cook 거리 기준은 없다).

## 직접 계산

Python 3.15, numpy 2.5.5, statsmodels 0.15.0, 시드 고정(`default_rng(0)`, n = 100). 참 모형 `y = 1 + 2·x1 + 0·x2 + 1.5·x3 + 오차`, `x2 = x1 + 작은 잡음`(상관 0.98)으로 일부러 공선성을 만들었다.

```python
X = sm.add_constant(pd.DataFrame({'x1': x1, 'x2': x2, 'x3': x3}))
m = sm.OLS(y, X).fit()
vif = [variance_inflation_factor(X.values, i) for i in range(1, 4)]
```

| 항목 | x1, x2, x3 모두 | x2 제거 (x1, x3) |
| --- | --- | --- |
| x1 계수 (참값 2) | 2.521 (표준오차 0.504) | 1.941 (0.097) |
| x2 계수 (참값 0) | −0.574 (0.490, p = 0.244) | — |
| R² / 수정 R² | 0.8823 / 0.8787 | 0.8807 / — |
| AIC / BIC | 274.04 / 284.46 | 273.46 / 281.28 |

- VIF: x1 = 27.01, x2 = 27.01, x3 = 1.00. 공차는 0.037, 0.037, 0.999.
- x2 를 넣어도 R² 는 0.8807 → 0.8823 으로 거의 안 변하지만 x1 의 표준오차는 약 5 배(0.097 → 0.504)로 커졌다. AIC·BIC 는 모두 작은 모델이 낫다고 가리켰다.
- 같은 시나리오를 300 번 반복 추출(시드 100~399)하면 x1 계수의 평균은 두 모델 모두 약 2.00(불편)이지만 표준편차는 0.513(x2 포함) 대 0.108(x2 제외)이었다. 공선성은 편향이 아니라 분산을 키운다.
- 영향점: 첫 관측치를 `x1 = 4`, `y` 를 +10 으로 일부러 바꾸자 레버리지 0.806(2(p+1)/n = 0.08 을 임시 기준으로 잡음; SSCC 가이드는 레버리지 기준의 한 예로 2k/n, k 는 절편 포함 모수 수를 든다), Cook 거리 0.468 로 모든 관측치 중 최대였다.
- 정규방정식으로 직접 푼 `(XᵀX)⁻¹Xᵀy` 는 statsmodels 계수와 소수 셋째 자리까지 일치했다. 수정 R² 식도 같은 값(0.8787)이다.
- 이 시뮬레이션은 시드 의존이다. 수치는 형태를 보이기 위한 것이다.

## 언제 쓰나 / 주의

- 연속형 반응변수를 몇 개 설명변수로 설명·예측하고 계수 효과를 해석해야 할 때 쓴다. 이진 결과는 [로지스틱 회귀](/develop-wiki/knowledge/data-analytics/logistic-regression-odds-ratio/)를 쓴다.
- 계수의 "다른 변수 고정" 해석은 설명변수들이 서로 독립적으로 움직일 수 있을 때만 현실적이다. 공선성이 높으면 이 해석이 무의미해진다.
- 상관은 인과가 아니다. 회귀계수는 관찰자료에서 인과 효과가 아니라 조건부 연관이다.
- 자동 변수 선택은 표본에 과적합하기 쉽다. 검증 자료나 교차검증으로 확인한다 → [과적합과 규제](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/)
- 영향점은 자동 삭제하지 않는다. 입력 오류인지 실제 극단값인지 확인한 뒤 판단한다.
- 평가 지표(RMSE·MAE)는 [회귀 평가 지표](/develop-wiki/knowledge/machine-learning/regression-metrics-rmse-mae-r2/)에서 다룬다.

## 검증 범위

- 읽은 것: statsmodels 문서(regression 개요, `variance_inflation_factor`, `OLSInfluence`, `info_criteria`), SSCC R 회귀진단 가이드의 VIF 절. 계산식은 직접 실행으로 대조했다.
- **ISLR(James 등)은 직접 읽지 못했다**(서버 접속 거부·PDF 용량 초과). VIF·레버리지·Cp/AIC/BIC 절의 문구는 확인하지 않았고, 정의는 계산 결과와 위 문서로 뒷받침했다.
- 미확인: VIF 5·10 기준의 원 출처(문헌 비판 포함), Cook 거리·레버리지 기준값, AIC/BIC 정의식의 교과서 출처(statsmodels 문서에는 식이 없고 Burnham & Anderson 2002 를 가리킨다), 전진·후진·단계적 선택의 문헌 정의(일반 개념으로 기술).
- 잔차 진단(Breusch-Pagan, Durbin-Watson 등)은 이름·용도만 문서로 확인했고, 이 노트의 표에는 해당 검정 수치를 싣지 않았다.
- 수험 교재에서 쓰는 통계량 이름이 도구마다 다를 수 있다(예: 공차, 분산팽창지수).

---
title: 로지스틱 회귀와 오즈비 (Logistic Regression & Odds Ratio)
aka: [Logistic Regression, Logit, Odds, Odds Ratio, OR, 로짓 모형, Maximum Likelihood, Hosmer-Lemeshow]
category: data-analytics
group: statistics
level: intermediate
summary: 이진 결과의 확률을 로짓 변환으로 선형식에 연결하고, 계수의 지수를 오즈비로 읽는 로지스틱 회귀의 추정(최대가능도)·임계값·적합도 점검을 직접 계산으로 확인한다.
tags: [logistic-regression, odds-ratio, logit, mle, classification, glm, hosmer-lemeshow]
related: [data-analytics/linear-regression-diagnostics-multicollinearity, data-analytics/categorical-data-contingency-chi-square, data-analytics/estimation-hypothesis-testing-errors-pvalue, machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/gradient-descent-loss-optimizers, machine-learning/overfitting-bias-variance-regularization]
sources:
  - https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression
  - https://www.statsmodels.org/stable/generated/statsmodels.discrete.discrete_model.Logit.html
  - https://support.sas.com/documentation/cdl/en/statug/67523/HTML/default/statug_logistic_details32.htm
updatedAt: 2026-11-23
---

## 개요

- 반응변수가 0/1(구매 여부, 부도 여부)일 때 선형회귀를 그대로 쓰면 예측이 0~1 을 벗어나고 오차 가정도 어긋난다. 로지스틱 회귀는 확률 `p` 를 직접 모델링하지 않고 **로짓(log-odds)** `ln(p/(1−p))` 를 설명변수의 선형식으로 둔다.
- 역변환은 시그모이드(로지스틱 함수) `p = 1/(1 + e^(−η))` 이다. scikit-learn 문서는 이를 "선형 모델이지만 분류용"이라고 설명하고, 베르누이 분포와 로짓 연결을 쓰는 일반화선형모형(GLM)의 특수한 경우로 소개한다.
- 계수는 최대가능도 추정(MLE)으로 구한다(statsmodels `Logit.fit` 이 MLE 이다). 선형회귀처럼 닫힌 해가 없어 반복 알고리즘을 쓴다.

## 시험 범위 대응

- ADP 실기 통계 영역 > 상관·회귀(로지스틱), 빅데이터분석기사 3과목 > 분석기법(로지스틱 회귀분석), 4과목 평가 지표와 연결된다. ADsP 출제범위 항목에는 로지스틱 회귀가 직접 이름으로 나오지 않는다(분류분석 하위로 다루는 교재가 많을 수 있으나 이는 확인하지 않았다).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 오즈 | odds | 사건 확률 대 비사건 확률의 비 `p/(1−p)` |
| 로짓 | logit, log-odds | 오즈의 자연로그. 모형에서 선형식과 같다 |
| 오즈비 | odds ratio (OR) | 두 조건의 오즈의 비. 설명변수 1 단위 증가에 대해 `exp(β)` |
| 최대가능도 추정 | MLE | 관측 자료의 가능도(로그가능도)를 최대로 하는 계수를 고르는 방법 |
| 임계값 | threshold, cutoff | 예측 확률을 클래스 라벨로 바꾸는 기준. scikit-learn 의 기본은 0.5 |
| 결정 경계 | decision boundary | 예측 확률이 임계값과 같아지는 설명변수 위의 점들 |

## 계수 읽기

- 모형: `ln(p/(1−p)) = β₀ + β₁x₁ + … + β_k x_k`.
- `x₁` 이 1 늘면 **로그 오즈가 β₁ 늘고, 오즈는 `exp(β₁)` 배**가 된다. 이것이 오즈비다. `exp(β) > 1` 이면 오즈 증가, `< 1` 이면 감소, `= 1` 이면 무관하다.
- 확률 자체의 변화량은 고정되지 않는다. 같은 β 라도 `p` 가 0.5 부근일 때 확률이 크게, 0 이나 1 부근일 때 작게 움직인다(아래 계산).
- 오즈비는 상대위험(risk ratio)이 아니다. 사건이 드물 때(p 가 작을 때) 두 값이 비슷해질 뿐이며, 흔한 사건에서는 오즈비가 상대위험보다 1 에서 더 멀다.
- 2×2 표에서는 `OR = (a·d)/(b·c)` 이고, 로지스틱 회귀(설명변수가 이진 하나)의 `exp(β)` 와 같다 → [범주형 자료 분석](/develop-wiki/knowledge/data-analytics/categorical-data-contingency-chi-square/)
- 계수의 신뢰구간은 로그 오즈 척도에서 만들고 `exp` 로 변환한다. 구간이 1 을 포함하는지가 "계수 = 0" 검정과 대응한다.

## 최대가능도 추정과 규제(regularization)

- 관측 `yᵢ ∈ {0,1}` 의 로그가능도는 `Σ[yᵢ ln p̂ᵢ + (1−yᵢ) ln(1−p̂ᵢ)]` 이고, 이 부호를 바꾼 값이 로그 손실(log loss, 이진 교차엔트로피)이다. scikit-learn 의 목적함수는 가중 평균 로그 손실에 `r(w)/(S·C)` 벌점을 더한 형태다.
- scikit-learn 문서에 따르면 규제는 기본으로 켜져 있고(문서는 이를 통계보다 머신러닝에서 흔한 관행이라고 쓴다), `C` 는 규제 강도의 역수다. 규제 없는 통계적 MLE 는 `C = np.inf` 로 얻는다. 같은 데이터라도 도구 기본값 때문에 계수가 다를 수 있다.
- 완전 분리(어떤 변수로 클래스가 완벽히 갈림)가 있으면 규제 없는 MLE 는 발산한다. 이 노트에서 직접 실험하지는 않았다.

## 직접 계산

Python 3.15, numpy 2.5.5, statsmodels 0.15.0, 시드 고정(`default_rng(1)`, n = 500). 참 모형 `logit(p) = −0.5 + 0.8·x + 1.0·g` (x 연속, g 는 0/1).

| 항목 | 추정 | `exp(추정)` | 95% 구간(오즈비) |
| --- | --- | --- | --- |
| 절편 | −0.254 | 0.776 | 0.589 ~ 1.022 |
| x | 0.860 | 2.364 | 1.868 ~ 2.992 |
| g | 0.502 | 1.651 | 1.133 ~ 2.408 |

- **오즈비 = exp(계수) 검증.** 추정 모형으로 `x = 0.3` 과 `x = 1.3`(g = 0)의 예측 확률을 구해 오즈의 비를 직접 나누면 2.364092…, `exp(0.860394…)` 도 2.364092… 로 일치했다. g 에 대해서도 1.651393 으로 일치.
- **확률 변화는 일정하지 않다.** 같은 x 1 단위 증가라도 `x: 0.3 → 1.3` 에서는 확률이 +0.203, `x: −3 → −2` 에서는 +0.066 만 늘었다. 오즈비는 같아도 확률 차이는 위치에 따라 다르다.
- **2×2 표 예.** 30/70 대 10/90 의 오즈비는 `(30·90)/(70·10) = 3.857`.
- **결정 경계.** `β₀ + β₁x + β₂g = 0` 에서 `x = −(β₀ + β₂g)/β₁`. 임계값 0.5 일 때 g=0 이면 x ≈ 0.295, g=1 이면 x ≈ −0.288. 임계값은 설명변수 공간의 직선(초평면)이다. 임계값을 0.5 가 아닌 값으로 두면 경계가 평행 이동한다.
- **임계값 영향(같은 모형, 같은 자료).**

| 임계값 | 정확도 | 재현율 | 정밀도 |
| --- | --- | --- | --- |
| 0.3 | 0.624 | 0.952 | 0.573 |
| 0.5 | 0.644 | 0.641 | 0.641 |
| 0.7 | 0.566 | 0.206 | 0.718 |

  임계값을 올리면 정밀도가 오르고 재현율이 떨어진다. 임계값은 모형이 아니라 비용 구조로 정한다 → [분류 평가 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/)
- **선형회귀와 비교.** 같은 0/1 자료에 OLS 를 적합하면 예측값이 −0.060 ~ 1.019 로 확률 범위를 벗어났다.
- **Hosmer-Lemeshow.** 예측 확률 순으로 10 개 집단을 나눠 관측·기대 사건 수의 Pearson 카이제곱을 계산했다. 값 4.90, 자유도 8(= g − 2), p = 0.768 로 적합 부족 증거 없음(모형이 참이므로 기대한 결과). 집단 나누기는 `qcut` 으로 직접 구현해 SAS 의 블록 규칙과는 세부가 다르다.
- 모든 값은 시드 의존이다.

## 확장(이름만)

- **다항(multinomial) 로지스틱**: 범주가 셋 이상이고 순서가 없을 때. scikit-learn 은 K 개 클래스에 K 개의 가중치 벡터를 쓴다(필요한 K−1 이 아닌 과잉 모수화).
- **순서형(ordinal) 로지스틱**: 범주에 순서가 있을 때. 이 노트에서는 원 출처를 읽지 않았다.
- 이들 확장 모형의 오즈비 해석은 이진 모형과 같지 않으므로 별도 확인이 필요하다.

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 선형회귀 vs 로지스틱 | 선형: `y` 의 평균을 선형식으로. 로지스틱: 로짓을 선형식으로, MLE 로 추정, 출력은 확률 |
| 오즈 vs 확률 | 확률 0.75 ↔ 오즈 3. 오즈 = p/(1−p) |
| 오즈비 vs 상대위험 | 오즈비는 오즈의 비, 상대위험은 확률의 비. 드문 사건에서만 근사 |
| 로짓 vs 로지스틱 함수 | 로짓은 오즈의 로그, 로지스틱(시그모이드)은 그 역함수 |

## 언제 쓰나 / 주의

- 이진 결과를 예측하고 변수별 효과(오즈비)를 설명해야 할 때. 해석 가능성이 중요한 분야(의료·신용)에서 기준선 모델로 쓴다.
- 설명변수의 다중공선성은 선형회귀와 마찬가지로 계수를 불안정하게 한다 → [선형회귀 진단](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/)
- 클래스가 심하게 불균형이면 0.5 임계값이 부적절하다. 정확도만 보지 않는다.
- Hosmer-Lemeshow 는 집단 수·표본 크기에 민감하다. SAS 문서는 이 검정이 복제 없는 연속 설명변수 상황에서 Pearson·deviance 검정의 대안으로 쓰인다고 설명한다. 한 번의 p 값으로 모형을 합격시키지 말고 보정 곡선·분류 지표를 함께 본다.
- 선형성 가정은 로짓에 대한 것이다. 비선형이면 항을 추가하거나 변환한다.

## 검증 범위

- 읽은 것: scikit-learn User Guide 로지스틱 회귀 절(정의·목적함수·규제 기본값·다항 모수화; 문서 마지막 약 8천 자는 읽지 못함), statsmodels `Logit` API 페이지, SAS LOGISTIC 문서의 Hosmer-Lemeshow 절(구성과 자유도).
- **ISLR 는 읽지 못했다**(접속 불가). Hosmer & Lemeshow(2000) 원전과 1980 원 논문, 1997 비교 논문(검정력 한계)은 직접 읽지 못해 이 노트에서 그 주장은 서술하지 않았다.
- 미확인: 순서형·다항 확장의 상세, 오즈비 vs 상대위험의 수치 관계(일반 개념으로만 기술), 사건이 흔할 때 오즈비가 더 극단적이라는 서술의 문헌 출처, MLE 의 반복 알고리즘 종류.
- 실행한 것: 위 표의 모든 수치(statsmodels `Logit`, numpy). 실행 안 한 것: scikit-learn `LogisticRegression` 적합, 완전 분리 사례.

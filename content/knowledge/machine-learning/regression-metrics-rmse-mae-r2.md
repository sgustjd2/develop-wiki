---
title: 회귀 평가 지표 — MSE·RMSE·MAE·MAPE·R²
aka: [Regression Metrics, MSE, RMSE, MAE, MAPE, sMAPE, R-squared, Adjusted R², Explained variance, 결정계수]
category: machine-learning
group: evaluation
level: intermediate
summary: 연속값 예측의 오차를 재는 MSE·RMSE·MAE·MAPE 와 설명력 지표 R²·수정 R² 의 정의, 단위, 이상값 민감도, 음수 R² 의 의미를 직접 계산으로 구분한다.
tags: [regression, metrics, rmse, mae, mape, r2, evaluation, scikit-learn]
related: [machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/overfitting-bias-variance-regularization, machine-learning/data-split-cross-validation-leakage, data-analytics/linear-regression-diagnostics-multicollinearity, data-analytics/outlier-detection-methods]
sources:
  - https://scikit-learn.org/stable/modules/model_evaluation.html
updatedAt: 2026-11-23
---

## 개요

- 회귀 평가는 **오차의 크기**를 재는 지표(MSE·RMSE·MAE·MAPE)와 **분산을 얼마나 설명하나**를 재는 지표(R²)로 나뉜다.
- 오차 지표는 값이 작을수록, R² 는 1 에 가까울수록 좋다. 단위·이상값 반응·0 근처 값 처리가 지표마다 달라 업무 목적에 맞게 고른다.
- 지표는 새 데이터(검증·테스트)에서 잰다 → [데이터 분할](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/).

## 시험 범위 대응

ADsP·ADP 데이터분석(기초 통계분석 안에서 다룰 수 있으나 회귀분석·모형 평가는 항목명에 없음) / ADP 실기(모델 구축의 회귀, 모델 평가·선택) / 빅데이터분석기사 3과목 분석기법의 회귀분석, 4과목 빅데이터 결과 해석(평가 지표, 분석모형 진단).

## 핵심 용어

y_i 실제값, ŷ_i 예측값, n 표본 수, ȳ 평균. 식은 scikit-learn 문서를 따른다.

| 한국어 | 영어 | 식 | 단위·성질 |
| --- | --- | --- | --- |
| 평균제곱오차 | MSE | `(1/n) Σ (y − ŷ)²` | 타깃 단위의 제곱. 큰 오차를 크게 벌함 |
| 평균제곱근오차 | RMSE | `√MSE` | 타깃과 같은 단위 |
| 평균절대오차 | MAE | `(1/n) Σ \|y − ŷ\|` | 타깃과 같은 단위. 이상값에 상대적으로 덜 민감 |
| 중앙절대오차 | median absolute error | `median(\|y_i − ŷ_i\|)` | 이상값에 강건 |
| 최대오차 | max error | `max \|y − ŷ\|` | 최악의 경우 |
| 평균절대백분율오차 | MAPE | `(1/n) Σ \|y − ŷ\| / max(ε, \|y\|)` | 상대 오차. sklearn 은 **비율**(0.5=50%)로 반환 |
| 평균제곱로그오차 | MSLE | `(1/n) Σ (ln(1+y) − ln(1+ŷ))²` | 지수적 성장 타깃에 적합, 과소예측을 더 크게 벌함 |
| 결정계수 | R² | `1 − Σ(y−ŷ)² / Σ(y−ȳ)²` | 최댓값 1, **음수 가능** |
| 설명 분산 | explained variance | `1 − Var(y−ŷ)/Var(y)` | 예측의 체계적 편향(평균 오프셋)을 반영하지 않아 R² 가 보통 더 선호됨 |
| 수정 R² | adjusted R² | `1 − (1−R²)(n−1)/(n−k−1)` | 설명변수 k 개 수에 대한 벌점. sklearn 에는 없음 |

- sMAPE 는 정의가 여러 가지라 이 노트에서는 한 형태(`2|y−ŷ|/(|y|+|ŷ|)` 의 평균, %)로 직접 계산해 보였다. scikit-learn 문서에는 없고 정의는 문헌마다 다를 수 있다.
- 수정 R² 식은 일반 통계 교재의 표준형이며 이번에 scikit-learn 이 아닌 직접 계산으로만 확인했다.

## R² 읽는 법

- "평균만 예측하는 모형"의 R² 는 0. 그보다 나쁘면 **음수**가 된다(scikit-learn).
- 훈련 데이터에서 변수를 추가하면 R² 는 (선형 모형에서) 내려가지 않는다. 수정 R² 는 쓸모없는 변수 추가에 벌점을 준다.
- R² 가 높다고 모형이 적절한 것은 아니다. 잔차 패턴을 본다 → [회귀 진단](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/).
- AIC·BIC 는 모형 복잡도에 벌점을 준 적합도 기준(작을수록 좋음)으로, 같은 데이터로 적합한 모형끼리 비교한다. 정의와 비교 방법은 통계 노트를 본다. 이 노트에서 식은 다루지 않는다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1, numpy 2.5.5).

**1. 문서 예제**(`y=[3,−0.5,2,7]`, `ŷ=[2.5,0,2,8]`): MAE 0.5, MSE 0.375, RMSE 0.612, R² 0.9486, 설명 분산 0.9572. 문서값(0.5, 0.375, 0.948, 0.957)과 일치. 설명 분산이 R² 보다 큰 것은 잔차 평균이 0 이 아니기 때문이다(잔차 평균 −0.25).

**2. 이상값 하나의 영향.** `y=[10,12,14,16,18,20]`, 예측 오차가 모두 ±1: MAE=RMSE=1.0. 마지막 예측만 29 로 바꾸면(오차 9) MAE 2.333, RMSE 3.786, 중앙절대오차 1.0. 큰 오차 하나가 RMSE 를 더 크게 끌어올린다.

**3. MAPE 의 비대칭.** 실제 100 에서 예측 50 이든 150 이든 같은 절대오차 50 이라 MAPE 는 둘 다 0.5 다(sklearn 확인). 그러나 분모가 실제값이라 **과대예측의 오차는 상한이 없고(예측 300 이면 2.0), 과소예측은 최대 1.0(100%)** 이다(산술). sMAPE(위 정의)는 같은 두 예측에서 과소예측(50) 66.7%, 과대예측(150) 40.0% 로 방향별로 다르다. 어느 쪽이 "공정"한지는 정의에 달려 있다. 실제값이 0 이면 MAPE 는 분모가 ε 라서 값이 터진다(`[0,10]` vs `[1,10]` → 2.25e15).

**4. R² 음수.** `y=[1..5]`: 평균 예측 R²=0.0, 순서를 뒤집은 예측 R²=−3.0. 훈련 평균(2)을 `[10,11,12]` 테스트에 쓰면 R² = −121.5. 훈련·테스트의 분포가 다르면 매우 나빠진다.

**5. 수정 R².** n=30 에 신호 변수 1 개와 무의미한 변수를 추가(seed 0): 변수 1 개 R² 0.687 / 수정 0.675, 5 개 0.743 / 0.690, 15 개 0.856 / 0.702. R² 는 계속 오르지만 수정 R² 는 거의 정체한다. 훈련 R² 이므로 표본 외 성능은 아니다.

## 헷갈리는 구분

| 쌍 | 구분 |
| --- | --- |
| MSE vs RMSE | RMSE 는 제곱근을 씌워 타깃 단위로 돌린 값. 순위는 같다 |
| RMSE vs MAE | 같은 모형에서 RMSE ≥ MAE. 차이가 클수록 큰 오차가 섞여 있음 |
| R² vs 상관계수² | 단순회귀(절편 포함, 훈련)에서는 같지만, 일반 모형·테스트에서는 R² 가 음수일 수 있어 다르다 |
| 설명 분산 vs R² | 잔차 평균이 0 이면 같다(scikit-learn). 아니면 R² 가 편향을 벌한다 |
| 결정계수 vs 수정 R² | 후자는 변수 개수 보정 |

## 언제 쓰나 / 주의

| 상황 | 지표 |
| --- | --- |
| 큰 오차가 특히 나쁨 | MSE, RMSE |
| 이상값이 섞인 데이터, 해석이 쉬운 평균 오차 | MAE, 중앙절대오차 |
| 규모가 다른 계열 비교 | MAPE(0 근처 값 없을 때), 또는 기준선 대비 점수 |
| 설명력 한눈에 | R², 수정 R² |

- 기준선과 비교한다. scikit-learn 의 `DummyRegressor`(평균·중앙값 예측)와 비슷하면 모형이 쓸모없다는 신호다(문서 설명).
- 점수 하나로 잔차의 구조(이분산, 추세)를 알 수 없다. 잔차 그림을 같이 본다.
- 분산이 큰 타깃은 로그 변환 후 평가하면 RMSLE 가 된다. 변환 전후 지표를 섞어 비교하지 않는다.
- 교차검증 점수는 sklearn 에서 오차를 음수로 돌려준다(`neg_mean_squared_error`; 높을수록 좋음 규칙).

## 검증 범위

- 읽음: scikit-learn 모델 평가 문서의 회귀 지표 절(식·예제값·R² 음수 가능·MAPE 비율 표기·Dummy 추정기).
- 실행: 위 1~5 모든 계산. 5 번의 무의미 변수는 seed 의존이다.
- 미확인: sMAPE 의 표준 정의(문헌별 상이, 1차 출처 미확인), 수정 R² 식의 1차 출처, AIC·BIC 식(다루지 않음), "상관계수²=R²" 의 조건은 선형 모형에 대한 일반 지식으로 이번에 직접 실행하지 않았다.

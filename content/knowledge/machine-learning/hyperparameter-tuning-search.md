---
title: 하이퍼파라미터 튜닝 — 그리드·랜덤·베이지안 탐색 (Hyperparameter Tuning)
aka: [Hyperparameter, Grid Search, Random Search, Bayesian Optimization, GridSearchCV, RandomizedSearchCV, 초매개변수, 하이퍼파라미터 최적화, 매개변수 최적화]
category: machine-learning
group: paradigm
level: intermediate
summary: 학습으로 정해지지 않는 설정값(하이퍼파라미터)을 교차검증 점수로 찾는 방법이다. 파라미터와의 용어 충돌, 그리드·랜덤·베이지안·조기 중단 탐색의 차이, 검증 세트 오염을 피하는 법을 정리한다.
tags: [hyperparameter, grid-search, random-search, bayesian-optimization, successive-halving, sklearn, model-selection]
related: [machine-learning/data-split-cross-validation-leakage, machine-learning/overfitting-bias-variance-regularization, machine-learning/gradient-descent-loss-optimizers, machine-learning/svm-margin-kernel, machine-learning/gradient-boosting-xgboost-lightgbm, machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/lift-gain-chart-ks-model-comparison]
sources:
  - https://scikit-learn.org/stable/modules/grid_search.html
  - https://www.jmlr.org/papers/v13/bergstra12a.html
  - https://arxiv.org/abs/1206.2944
  - https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html
  - https://d2l.ai/chapter_linear-regression/generalization.html
updatedAt: 2026-11-23
---

## 개요

- 모델에는 **학습으로 정해지는 값**(선형 회귀의 계수, 신경망의 가중치)과 **학습 전에 사람이 정하는 값**(규제 강도 α, 트리 깊이, 학습률, 은닉층 수)이 있다. 뒤쪽이 하이퍼파라미터이고, 이 값을 고르는 일이 튜닝이다.
- 하이퍼파라미터는 학습 데이터로 직접 최적화되지 않는다(학습 오차를 줄이는 쪽으로 정하면 복잡도를 최대로 올려 과대적합한다). 그래서 **검증 점수**(보통 교차검증)로 후보를 비교한다.
- 방법은 후보를 어떻게 뽑느냐의 차이다: 격자 전수(그리드), 무작위 표집(랜덤), 지금까지의 결과를 보고 다음 후보를 고르는 순차 최적화(베이지안), 가망 없는 후보를 일찍 버리는 방식(조기 중단·successive halving).

## 시험 범위 대응

- 빅데이터분석기사 4과목 "분석모형 평가 및 개선 > 개선 > 매개변수 최적화".
- ADP 실기 출제 방향의 "모델 구축(회귀·분류·군집화, 초매개변수 조율)".
- 공식 범위는 항목 이름만 공개돼 있어, "매개변수 최적화"가 하이퍼파라미터 탐색을 뜻하는지는 이 노트에서 교재 내용으로 확인하지 못했다(필자 해석).

## 용어 충돌 표

| 한국어 | 영어 | 통계/ML 에서의 뜻 | 주의 |
| --- | --- | --- | --- |
| 모수 | (population) parameter | 모집단의 미지 상수(평균 μ, 분산 σ² 등). 추정·검정의 대상 | "모수 유의성 검정"의 모수 = 회귀계수 등 |
| 매개변수 / 파라미터 | (model) parameter | 학습으로 맞추는 값: 회귀 계수, 신경망 가중치 | d2l 은 학습 알고리즘이 데이터로 조정하는 "손잡이"라 부른다 |
| 초매개변수 / 하이퍼파라미터 | hyperparameter | 학습 전에 정하는 설정값: `C`, `alpha`, `max_depth`, 학습률 | sklearn 문서는 추정기가 직접 학습하지 않고 생성자에 넘기는 값으로 정의 |
| 매개변수 최적화 | parameter optimization / tuning | **문맥 의존**: 학습 중 가중치 최적화(경사하강법)일 수도, 하이퍼파라미터 탐색일 수도 | 이 노트는 후자를 "튜닝", 전자를 [경사하강법](/develop-wiki/knowledge/machine-learning/gradient-descent-loss-optimizers/)으로 구분 |

- sklearn 탐색 문서 자체도 정의에서는 "hyper-parameters"라 쓰고 이후에는 "parameter search", "parameter grid" 처럼 같은 대상을 **parameters** 로 부른다. 도구 이름(`param_grid`, `best_params_`)에 나오는 param 은 하이퍼파라미터다.
- 수험서의 "모수 vs 매개변수 vs 초매개변수" 구분은 교재마다 다를 수 있어 이 표는 sklearn·d2l 정의에 기준한다.

## 탐색 방법

### 그리드 탐색
- 각 하이퍼파라미터에 후보 값을 나열하고 **모든 조합**을 평가한다. sklearn `GridSearchCV(param_grid)`; 리스트 안의 딕셔너리 여러 개로 "커널별로 다른 격자"도 가능.
- 비용: 조합 수 × 폴드 수. 예: 5 개 하이퍼파라미터 × 값 5 개 → 5⁵ = 3,125 조합 × 5-겹 = 15,625 번 학습(산술). 차원이 늘면 지수적으로 커진다.

### 랜덤 탐색
- 후보를 분포에서 `n_iter` 번 뽑는다. sklearn `RandomizedSearchCV`; `scipy.stats` 분포(`loguniform`, `randint` 등), 리스트는 균등 추출.
- sklearn 이 드는 장점: 예산(`n_iter`)을 파라미터 수와 무관하게 정할 수 있고, 성능에 영향 없는 파라미터를 추가해도 효율이 떨어지지 않는다. 연속형은 연속 분포로 줘야 `n_iter` 를 늘릴수록 촘촘해진다.
- Bergstra & Bengio(JMLR 13, 2012): 같은 예산에서 무작위 시도가 격자 시도보다 효율적이라고 이론·실험으로 보였다. 이유로 대부분의 데이터에서 **소수의 하이퍼파라미터만 중요하고 어느 것이 중요한지는 데이터마다 다르다**는 점을 든다. 신경망에서 무작위 탐색이 훨씬 적은 계산으로 격자와 같거나 더 좋았다고 보고했다. 논문은 무작위 탐색을 순차적 방법을 평가할 기준선으로 권한다.
- 직관(산술): 중요한 파라미터 1 개 + 무관한 1 개일 때 3×3 격자 9 번은 중요한 파라미터를 3 값으로만 시험하지만, 무작위 9 번은 9 개 서로 다른 값을 시험한다.

### 베이지안 최적화 (Snoek, Larochelle & Adams, 2012)
- 하이퍼파라미터 → 검증 성능 함수를 **가우시안 과정**으로 모델링하고, 지금까지의 관측으로 다음에 시험할 후보를 고른다(탐험과 활용 사이 균형). 평가가 비싼 모델(수 시간 학습)에서 시도 횟수를 줄이려는 방법이다.
- 논문은 GP 사전분포·추론 방식의 선택이 성패를 좌우함을 지적하고, 실험 시간이 변하는 점과 다중 코어 병렬을 다룬 방법을 제안한다. 초록에서 LDA·구조적 SVM·합성곱 신경망에서 전문가 수준 이상이라고 주장한다(arXiv 초록 확인, 본문은 읽지 않음).
- sklearn 은 베이지안 최적화를 내장하지 않는다(탐색 문서에 없음). 외부 라이브러리가 필요하며 이 노트에서 실행하지 않았다.

### 조기 중단형: successive halving
- sklearn `HalvingGridSearchCV`/`HalvingRandomSearchCV`(실험적, `enable_halving_search_cv` import 필요). 모든 후보를 적은 자원(보통 표본 수)으로 시작해 라운드마다 자원을 `factor` 배로 늘리고 후보 수를 `factor` 분의 1 로 줄인다. `factor` 는 보통 3. `n_candidates_i = n_candidates // factor^i`.
- 예(산술): 후보 27 개, factor 3 → 27 → 9 → 3 → 1.
- 다중 지표 `scoring` 은 halving 에서 지원하지 않는다. 학습 도중 점수가 안 오르면 멈추는 모델 내 조기 종료(예: `MLPClassifier(early_stopping=True)`)와는 별개 개념이다 → [과대적합·규제](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/).

### 모델 전용 CV
- `LassoCV`, `RidgeCV`, `ElasticNetCV`, `LogisticRegressionCV` 는 규제 경로를 효율적으로 계산한다. `LassoLarsIC` 는 AIC/BIC 로 α 를 고른다. 랜덤 포레스트·그래디언트 부스팅은 OOB 추정으로 별도 검증 세트 없이 평가 가능한 경우가 있다(sklearn 문서).

## 검증 세트 오염 주의

- 튜닝에 쓴 CV 점수는 후보를 많이 시험할수록 낙관적이 된다. Cawley & Talbot 의 선택 편향 논의와 sklearn 중첩 CV 예제의 설명대로, **튜닝 점수를 최종 성능으로 보고하지 않는다**([분할·교차검증·누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)).
- 개발 세트로 `GridSearchCV` 를 돌리고 평가 세트는 한 번도 보지 않은 채 최종 평가한다(sklearn 문서 권고). 더 엄밀하게는 중첩 CV.
- 전처리·변수 선택·리샘플링도 하이퍼파라미터를 가질 수 있다. `Pipeline` 으로 묶어 `단계명__파라미터` 형식으로 탐색하면 폴드마다 안에서 처리된다.
- 튜닝에 쓰는 지표를 과제에 맞게 정한다(불균형이면 정확도 대신 PR·F1 등). 기본 `scoring` 은 분류기는 정확도, 회귀는 R² 다(문서).
- 다중 지표를 쓰면 `refit` 으로 어떤 지표로 `best_estimator_` 를 만들지 지정해야 한다.

## 직접 계산 (Python 3.15, scikit-learn 1.9.1, seed 0)

유방암 데이터(`load_breast_cancer`), 층화 75/25 분할, 표준화 + SVC(RBF), 5-겹 CV, 훈련 75% 에서만 탐색.

| 방법 | 후보 수 | 최적 (C, gamma) | CV 점수 | 테스트 정확도 |
| --- | --- | --- | --- | --- |
| 그리드 (C: 1e-2…1e3 6 값 × gamma: 1e-5…1 6 값) | 36 | (100, 0.001) | 0.9859 | 0.958 |
| 랜덤 (`loguniform`, n_iter=12) | 12 | (5.55, 0.0377) | 0.9859 | 0.972 |

- 후보 3 분의 1 로 CV 점수는 같았고 테스트 정확도는 달랐다. 테스트 143 개 중 2 개 차이라 의미 있는 우열이 아니다. 같은 CV 점수에 서로 다른 설정이 나온다는 점이 핵심이다. 여러 설정이 비슷하게 좋은 경우가 흔하다(필자 관찰).
- 순수 잡음(레이블 무작위 50×20)에서 SVC 그리드(C 13 값 × gamma 11 값)의 `best_score_` 평균 0.628 vs 중첩 CV 0.540. 후보가 많을수록 우연히 높은 점수가 선택된다(→ [누수 노트](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)).

## 언제 쓰나 / 주의

- 하이퍼파라미터가 2~3 개이고 학습이 싸면 그리드. 4 개 이상이거나 연속값이 많으면 랜덤부터. 학습이 매우 비싸면 베이지안·halving 을 검토(필자 정리, 원문 권고는 아님).
- 범위는 로그 척도로 잡는 경우가 많다(`C`, `gamma`, 학습률). 최적값이 범위 경계에 붙으면 범위를 넓혀 다시 탐색한다.
- 탐색 전에 하이퍼파라미터 영향력을 먼저 이해한다: [SVM](/develop-wiki/knowledge/machine-learning/svm-margin-kernel/)의 C·gamma, [부스팅](/develop-wiki/knowledge/machine-learning/gradient-boosting-xgboost-lightgbm/)의 학습률·트리 수, 학습률·모멘텀은 [최적화](/develop-wiki/knowledge/machine-learning/gradient-descent-loss-optimizers/).
- 지표 선택은 [분류 평가 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/)·[모형 비교](/develop-wiki/knowledge/machine-learning/lift-gain-chart-ks-model-comparison/).
- 튜닝으로 얻는 개선은 데이터 품질·변수 설계보다 작은 경우가 많다는 말은 흔히 하지만 이 노트에서 출처로 확인하지 않았다.

## 검증 범위

- 읽음: sklearn 하이퍼파라미터 탐색 사용자 가이드, Bergstra & Bengio JMLR 초록 페이지, Snoek 등 arXiv 초록, sklearn 중첩 CV 예제, d2l 일반화 절.
- 논문 본문은 읽지 않았다. Bergstra 의 "소수 파라미터만 중요" 결과와 Snoek 의 성능 주장은 초록 수준이다. 베이지안 최적화 라이브러리와 Hyperband 는 확인·실행하지 않았다.
- 실행: 위 그리드·랜덤 비교와 잡음 데이터 실험. 한 데이터·한 seed 결과이므로 방법 우열의 근거가 아니다.

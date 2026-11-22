---
title: 그래디언트 부스팅 — XGBoost·LightGBM·CatBoost
aka: [Gradient Boosting, GBDT, GBM, XGBoost, LightGBM, CatBoost, HistGradientBoosting, Shrinkage, 그래디언트 부스팅 트리]
category: machine-learning
group: ensemble
level: advanced
summary: 앞 모형이 남긴 오차(손실의 음의 기울기)를 다음 트리가 맞추도록 순차로 더하는 부스팅이다. XGBoost 는 규제·2차 근사·희소성 처리, LightGBM 은 히스토그램·GOSS·EFB·leaf-wise 로 속도를 낸다.
tags: [gradient-boosting, xgboost, lightgbm, catboost, gbdt, shrinkage, histogram, ensemble, supervised]
related: [machine-learning/ensemble-bagging-boosting-stacking, machine-learning/decision-tree-gini-entropy-pruning, machine-learning/gradient-descent-loss-optimizers, machine-learning/overfitting-bias-variance-regularization, machine-learning/hyperparameter-tuning-search, data-analytics/missing-values-handling-mechanisms, machine-learning/model-interpretation-feature-importance-shap-pdp]
sources:
  - https://scikit-learn.org/stable/modules/ensemble.html
  - https://xgboost.readthedocs.io/en/stable/tutorials/model.html
  - https://xgboost.readthedocs.io/en/stable/faq.html
  - https://arxiv.org/abs/1603.02754
  - https://papers.nips.cc/paper_files/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html
  - https://lightgbm.readthedocs.io/en/stable/Features.html
  - https://arxiv.org/abs/1706.09516
updatedAt: 2026-11-23
---

## 개요

- 부스팅은 모형을 순차로 더해 간다. 그래디언트 부스팅은 "다음 모형을 어떻게 고르나"를 함수 공간의 경사 하강으로 푼다: 현재 앙상블 F 의 손실을 가장 빨리 줄이는 방향(손실의 음의 기울기)을 새 트리가 근사한다(sklearn 문서의 Friedman 2001 설명).
- 제곱 오차에서는 음의 기울기가 잔차 `y − F(x)` 와 같아서 "잔차를 맞추는 트리를 더한다"로 이해하면 된다.
- 표 형식 데이터에서 강한 기본 모형이다. XGBoost·LightGBM·CatBoost 는 같은 뼈대를 빠르게·정규화해 구현한 라이브러리다.

## 시험 범위 대응

- 공식 출제범위에 "그래디언트 부스팅"·XGBoost 항목은 직접 없다. 관련: 빅데이터분석기사 3과목 > 분석기법 적용 > 고급 분석기법 > 앙상블 분석, 4과목 > 분석모형 평가 및 개선 > 분석모형 융합, ADP 실기 > 모델 구축·초매개변수 조율.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 가법 모형 | additive model | `F_m = F_{m−1} + 새 트리`로 단계마다 더해 가는 구조 |
| 의사 잔차 | pseudo-residual | 손실의 음의 기울기. 제곱 오차에서는 잔차 |
| 학습률 / 축소 | learning rate / shrinkage | 새 트리의 기여에 곱하는 ν (0 < ν ≤ 1). 작을수록 트리가 더 필요 |
| 트리 수 | n_estimators | 더하는 트리 수. sklearn 히스토그램판은 `max_iter` |
| 부표본 | subsample | 트리마다 표본의 일부만 복원 없이 사용 (Friedman 2002 인용) |
| 히스토그램 방식 | histogram-based | 연속 특성을 정수 구간(bin)으로 묶어 분할 후보를 구간 경계로 제한 |
| 레벨별 / 잎별 성장 | level-wise / leaf-wise | 같은 깊이를 모두 분할 / 손실 감소가 가장 큰 잎부터 분할 |
| 조기 종료 | early stopping | 검증 손실이 더 줄지 않으면 트리 추가를 멈춤 |

## 알고리즘 뼈대 (sklearn 문서)

1. 초기 모형: 제곱 오차는 평균, 절대 오차는 중앙값, 이진 로그 손실은 로그 오즈, 다중 클래스는 클래스 사전확률.
2. 단계 m: 현재 F 의 음의 기울기에 회귀 트리 `h_m` 을 적합.
3. 갱신: `F_m = F_{m−1} + ν·h_m` (축소, `learning_rate`).
- 문서 권고: 학습률은 0.1 이하로 작게 두고 조기 종료와 함께 쓴다. 작은 학습률은 더 많은 트리가 필요하다.
- `subsample`(예: 0.5)과 `max_features` 로 무작위성을 넣으면 분산이 줄고 속도가 빨라질 수 있다.
- 손실: 회귀 `squared_error`·`absolute_error`·`huber`·`quantile`, 분류 `log_loss`·`exponential`(이진 전용, AdaBoost 유사, 라벨 잡음에 덜 견고).
- 트리 크기는 `max_depth` 또는 `max_leaf_nodes`(최선 우선 성장)로 제한한다. 다중 클래스는 반복마다 클래스 수만큼 트리를 만든다.

## XGBoost (Chen & Guestrin, KDD 2016)

공식 문서의 정식화(식은 문서를 따름):

- 목적: `obj = Σ l(y_i, ŷ_i) + Σ ω(f_k)`, 복잡도 `ω(f) = γT + ½λΣ w_j²` (T = 잎 수, w = 잎 점수).
- 단계 t 에서 `l` 을 이전 예측 주변에서 **2차 테일러 근사**: `Σ [g_i f_t(x_i) + ½ h_i f_t(x_i)²] + ω(f_t)`, g·h 는 손실의 1·2차 미분.
- 잎 j 에서 `G_j = Σ g_i`, `H_j = Σ h_i` 라 하면 최적 잎 값 `w_j* = −G_j / (H_j + λ)`, 구조 점수 `obj* = −½ Σ G_j²/(H_j+λ) + γT`.
- 분할 이득: `½ [G_L²/(H_L+λ) + G_R²/(H_R+λ) − (G_L+G_R)²/(H_L+H_R+λ)] − γ`. γ 는 분할의 최소 비용 역할을 한다.

논문 초록에서 확인한 특징: 희소 데이터를 위한 **희소성 인식(sparsity-aware)** 알고리즘, 근사 학습을 위한 가중 분위수 스케치, 캐시 접근 패턴·압축·샤딩을 고려한 확장성 설계. 공식 FAQ: 트리 부스터는 결측값(그리고 희소 행렬의 비존재 항목)을 **결측으로 취급해 분할마다 최선의 방향을 학습**하고, 선형 부스터는 0 으로 취급한다. 따라서 희소 행렬을 밀집 행렬로 바꾸면 0 이 진짜 값이 되어 결과가 달라질 수 있다.

## LightGBM (Ke 외, NIPS 2017)

논문 초록: 기존 구현은 분할점을 찾을 때 모든 특성에 대해 모든 표본을 훑어 큰 데이터에서 느리다. 두 기법으로 해결한다.
- **GOSS(Gradient-based One-Side Sampling):** 기울기가 작은 표본의 상당수를 제외하고 나머지로 정보 이득을 추정한다(초록 서술). "큰 기울기 표본은 모두 유지"하는 세부는 논문 본문 알고리즘 수준이며 본문은 읽지 못했다.
- **EFB(Exclusive Feature Bundling):** 동시에 0 이 아닌 값을 거의 갖지 않는 특성을 묶어 특성 수를 줄인다. 최적 묶음은 NP-난해이고 탐욕 근사를 쓴다.
- 저자들은 여러 공개 데이터에서 기존 GBDT 대비 최대 20배 이상 학습이 빠르고 정확도는 거의 같다고 보고했다(논문의 주장).

공식 문서(Features 페이지, 이 페이지에는 GOSS·EFB 서술이 없음):
- **히스토그램**: 연속값을 구간으로 묶어 히스토그램 생성은 O(#data), 분할 탐색은 O(#bins). 형제 노드는 부모 히스토그램에서 빼서 얻는다.
- **leaf-wise 성장**: 레벨별 대신 손실 감소가 가장 큰 잎을 분할한다. 같은 잎 수에서 보통 손실이 더 낮지만, **데이터가 작으면 과대적합할 수 있다**. `max_depth` 로 깊이를 제한할 수 있다.
- **범주형 특성**: 원-핫 대신 범주를 두 집합으로 나눈다. 기울기/헤시안 누적값으로 정렬해 최적 분할을 찾는다.

## CatBoost (한 줄)

Prokhorenkova 외의 논문 초록에 따르면 기존 그래디언트 부스팅의 목표 누출에서 오는 예측 이동(prediction shift)을 줄이는 순열 기반 **순서형 부스팅(ordered boosting)** 과 범주형 특성 처리 알고리즘을 제안한다. 세부 알고리즘은 읽지 않았다.

## scikit-learn HistGradientBoosting

LightGBM 에서 영감을 받은 구현(문서). 입력을 최대 `max_bins=255` 구간으로 한 번만 묶고, 히스토그램으로 분할 탐색을 `O(n_features × n)` 으로 줄인다. 문서는 수만 표본 이상에서 고전 GB 보다 "자릿수 단위로 빠를 수" 있고, 작은 표본에서는 고전판이 낫다고 한다. 결측값을 분할마다 왼쪽·오른쪽 중 이득이 큰 쪽으로 보내는 방식으로 네이티브 지원하고, 범주형 특성도 직접 받는다. 표본이 10,000 개를 넘으면 조기 종료가 기본으로 켜진다. 단조 제약(`monotonic_cst`)·상호작용 제약도 있다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1). **xgboost·lightgbm 은 이 환경에서 import 가 실패해(libomp 부재) 실행하지 않았다.** 아래는 sklearn 만 사용했다.

**(1) 잔차 부스팅 직접 구현 = sklearn.** `make_friedman1(400, noise=1, seed 0)`, 트리 깊이 2, ν=0.1, M=50. 초기값 = y 평균, 단계마다 `DecisionTreeRegressor(max_depth=2)` 를 잔차에 적합해 `F += 0.1·예측`. 시험 MSE 4.5882 로 `GradientBoostingRegressor(n_estimators=50, learning_rate=0.1, max_depth=2)` 와 같고 예측 최대 차이 7×10⁻¹⁵.

```python
F = np.full(len(y), y.mean())
for m in range(50):
    tree = DecisionTreeRegressor(max_depth=2).fit(X, y - F)   # 제곱 오차: 음의 기울기 = 잔차
    F += 0.1 * tree.predict(X)
```

**(2) 학습률·트리 수.** 같은 데이터, 시험 MSE(낮을수록 좋음).

| 학습률 ν | 50 트리 | 500 트리 |
| --- | --- | --- |
| 1.0 | 8.32 | 8.87 |
| 0.1 | 4.59 | 3.18 |
| 0.01 | 16.07 | 4.83 |

ν=1 은 트리를 더해도 나아지지 않는다(과적합). ν=0.01 은 50 트리로 모자라 500 트리에서야 ν=0.1 의 50 트리 수준에 가깝다. ν=0.1 에서 시험 MSE 가 가장 낮은 반복은 556 회(3.164), 600 회에서 3.182 로 거의 평평해졌다. 분할 seed 하나의 결과다.

**(3) HistGradientBoosting.** `make_classification(20000, 20, informative 8)`: 정확도 0.963(100 반복, 조기 종료 기본), 같은 데이터 고전 `GradientBoostingClassifier` 0.939. 한 번 잰 학습 시간은 0.44초 대 3.65초였으나 기계 의존 값이라 참고만 한다. 특성 값의 10%를 NaN 으로 만들어도 별도 대치 없이 학습되어 정확도 0.945.

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 배깅/랜덤 포레스트 vs 그래디언트 부스팅 | 독립 트리를 평균(분산 감소)하는 것과 순차로 잔차를 맞추는 것의 차이. 부스팅은 학습률·트리 수에 민감 |
| AdaBoost vs 그래디언트 부스팅 | AdaBoost 는 표본 가중치를 올려 오분류에 집중. 그래디언트 부스팅은 임의의 미분 가능 손실의 기울기를 맞춘다(지수 손실이면 AdaBoost 와 유사, 문서) |
| 학습률(ν) vs 경사 하강법의 학습률 | 부스팅의 ν 는 새 트리 기여의 축소 계수. 신경망의 학습률과 역할은 비슷하나 대상이 함수 공간 |
| XGBoost 의 λ·γ vs 트리 깊이 제한 | λ 는 잎 값 L2 규제, γ 는 분할 최소 이득. `max_depth` 는 구조 제한. 서로 다른 장치 |
| level-wise vs leaf-wise | 같은 잎 수라도 leaf-wise 는 불균형하고 깊은 트리가 나올 수 있다 |

## 언제 쓰나 / 주의

- 쓰는 곳: 표 형식 정형 데이터의 분류·회귀에서 우선 시도할 모형, 결측·범주형이 섞인 큰 데이터(히스토그램 계열).
- 과대적합: 학습률을 낮추고 조기 종료, `subsample`, 잎 크기·깊이 제한을 함께 쓴다 → [하이퍼파라미터 탐색](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)
- leaf-wise(LightGBM)는 작은 데이터에서 과대적합하기 쉽다(문서).
- 결측: 라이브러리마다 "결측을 분할 방향으로 학습"하는 방식이라 별도 대치가 필요 없는 경우가 있으나, 결측이 정보를 담는 경우(비무작위 결측)는 해석에 주의한다 → [결측값 처리](/develop-wiki/knowledge/data-analytics/missing-values-handling-mechanisms/)
- 해석: 불순도·이득 기반 중요도는 한계가 있다 → [모델 해석](/develop-wiki/knowledge/machine-learning/model-interpretation-feature-importance-shap-pdp/)
- 시계열처럼 훈련 범위 밖 외삽은 트리 계열이 못 한다(구간별 상수).
- 속도 수치는 데이터·하드웨어 의존이다. 논문의 "20배"는 저자 실험 조건에서의 보고다.

## 검증 범위

- 읽은 것: scikit-learn 앙상블 절의 그래디언트 부스팅·HistGradientBoosting 서술, XGBoost 공식 문서 "Introduction to Boosted Trees"(목적식·2차 근사·최적 잎 값·이득식)와 FAQ(결측·희소), XGBoost 논문 arXiv 초록, LightGBM NeurIPS 2017 초록과 공식 Features 페이지, CatBoost 논문 arXiv 초록.
- 직접 계산: sklearn 만 사용(Python 3.15, scikit-learn 1.9.1, 위 (1)~(3)). 표는 seed 0 단일 분할이다. 학습 시간은 참고용이다.
- **실행하지 않음:** xgboost, lightgbm, catboost. 해당 절은 문서·논문 초록 근거만이다.
- 읽지 못한 것: Friedman(2001) 원문(Project Euclid 페이지가 비어 있었음, sklearn 문서의 요약에 의존), XGBoost 논문 본문(PDF 가 텍스트로 열리지 않아 식은 공식 문서 기준), LightGBM 논문 본문(GOSS 증명·EFB 알고리즘), CatBoost 논문 본문, 공식 LightGBM 파라미터 튜닝 문서(`num_leaves` 지침).
- 미확인: XGBoost·LightGBM·CatBoost 의 최신 기본값과 버전별 차이, 세 라이브러리의 실측 성능 비교.

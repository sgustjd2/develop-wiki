---
title: 과대적합·과소적합, 편향-분산, 규제 (Overfitting, Bias-Variance, Regularization)
aka: [Overfitting, Underfitting, Bias-Variance Tradeoff, Regularization, L1 Lasso, L2 Ridge, Elastic Net, Early Stopping, 과적합]
category: machine-learning
group: paradigm
level: intermediate
summary: 학습 오차는 낮고 새 데이터 오차는 높은 과대적합을 편향-분산 분해로 설명하고, L1·L2·Elastic Net 규제와 조기 종료가 어떻게 복잡도를 억제하는지(Lasso 가 0 을 만드는 이유 포함) 계산으로 보인다.
tags: [overfitting, bias-variance, regularization, lasso, ridge, elastic-net, early-stopping, learning-curve]
related: [machine-learning/data-split-cross-validation-leakage, machine-learning/hyperparameter-tuning-search, machine-learning/gradient-descent-loss-optimizers, machine-learning/decision-tree-gini-entropy-pruning, machine-learning/deep-learning-training-batchnorm-dropout, machine-learning/ensemble-bagging-boosting-stacking, data-analytics/feature-selection-dimensionality-reduction, data-analytics/linear-regression-diagnostics-multicollinearity]
sources:
  - https://scikit-learn.org/stable/modules/learning_curve.html
  - https://scikit-learn.org/stable/modules/linear_model.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.neural_network.MLPClassifier.html
  - https://d2l.ai/chapter_linear-regression/generalization.html
  - https://d2l.ai/chapter_linear-regression/weight-decay.html
  - https://en.wikipedia.org/wiki/Bias%E2%80%93variance_tradeoff
updatedAt: 2026-11-23
---

## 개요

- **과대적합(overfitting)**: 학습 데이터에는 잘 맞지만 새 데이터에서 오차가 큰 상태. **과소적합(underfitting)**: 학습 데이터에도 못 맞는 상태.
- d2l 의 판별: 학습·검증 오차가 모두 높고 차이가 작으면 모델이 너무 단순한 것, 학습 오차가 검증 오차보다 훨씬 낮아 격차가 크면 과대적합. 격차가 있다고 항상 해로운 것은 아니고, 일반화 오차를 낮추는 데 걸림돌일 때 문제다.
- 대응은 세 갈래: 데이터를 늘리거나, 모델 복잡도를 낮추거나, **규제**로 복잡도를 제한한다.

## 시험 범위 대응

- 빅데이터분석기사 4과목 "분석모형 평가 및 개선 > 개선 > 과대적합 방지", "분석모형 진단".
- ADP 실기 "모델 구축·평가"와 인접. ADsP 에는 직접 항목 없음(분류분석의 모형 평가와 인접).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 일반화 오차 | generalization error | 데이터 분포 전체에 대한 기대 오차. 테스트 세트로 추정 |
| 편향 | bias | 학습 집합이 달라질 때의 평균 예측과 참 함수의 차이(단순한 가정에서 오는 체계적 오차) |
| 분산 | variance | 학습 집합이 달라질 때 예측이 흔들리는 정도 |
| 축소 불가능 오차 | irreducible error | 데이터 잡음 σ². 어떤 모델도 못 줄임 |
| 규제 | regularization | 모델 복잡도에 벌점을 줘 과대적합을 억제하는 것 |
| 가중치 감쇠 | weight decay | L2 규제를 경사 갱신 쪽에서 표현한 말(d2l) |
| 조기 종료 | early stopping | 검증 성능이 더 이상 좋아지지 않으면 학습을 멈춘다 |

## 편향-분산 분해

가정: y = f(x) + ε, ε 는 평균 0·분산 σ² 이고 x 와 독립, 학습 집합 D 는 같은 분포에서 뽑는다. 고정한 점 x 에서 제곱 오차의 기대값은

`E[(y − f̂(x))²] = (Bias[f̂(x)])² + Var[f̂(x)] + σ²`

- 이 분해는 ISLR(James 등)·ESL(Hastie 등)에 실려 있고, 이 노트는 Wikipedia 가 인용한 형태를 확인했다(교재 PDF 는 읽지 못함).
- **제곱 오차 손실**에서의 식이다. 0-1 손실 등에는 그대로 적용되지 않는다(필자 주의, 이 노트에서 확인하지 않음).
- sklearn 문서의 해석: 편향이 크면 모델이 참 함수를 담기에 너무 단순, 분산이 크면 학습 집합이 바뀔 때 크게 변한다. 둘은 대개 상충하며(trade-off), 알고리즘·하이퍼파라미터 선택으로 균형을 맞추고, 데이터를 더 모으면 분산이 줄어든다.

| | 학습 점수 | 검증 점수 | 진단 |
| --- | --- | --- | --- |
| 과소적합(고편향) | 낮음 | 낮음 | 모델을 키우거나 변수 추가, 규제 완화 |
| 과대적합(고분산) | 높음 | 낮음 | 데이터 추가, 모델 축소, 규제 강화 |
| 양호 | 높음 | 높음 | |

도구: 검증 곡선(하이퍼파라미터 하나를 바꾸며 학습·검증 점수), 학습 곡선(학습 표본 수를 바꾸며 점수). 학습 곡선에서 학습·검증 점수가 낮은 값에서 수렴하면 데이터를 더 모아도 이득이 작고, 학습 점수가 훨씬 높으면 데이터를 늘리면 일반화가 좋아질 가능성이 크다(sklearn 문서의 예 해석).

## 직접 계산 (Python 3.15, numpy/scikit-learn 1.9.1, seed 0)

**1. 분해 검증.** f(x) = sin(2πx), σ = 0.3(σ² = 0.09), 학습 20 점, 다항식 차수별로 2,000 개 학습 집합을 뽑아 x ∈ [0.05, 0.95] 50 점에서 평균.

| 차수 | 편향² | 분산 | 편향²+분산+σ² |
| --- | --- | --- | --- |
| 1 | 0.152 | 0.033 | 0.276 |
| 3 | 0.003 | 0.026 | 0.119 |
| 9 | 0.223 | ≈1707 | ≈1707 |

차수 1 은 편향이, 차수 9 는 분산이 지배한다. 차수 9 의 분산이 이렇게 큰 것은 20 점에 10 개 계수를 맞추는 불안정성 때문이다(수치 자체는 평가 구간과 시드에 민감한 값이라 크기보다 방향을 본다).

**2. 학습 vs 테스트 오차(MSE).**

| n | 차수 | 학습 | 테스트 |
| --- | --- | --- | --- |
| 20 | 1 | 0.156 | 0.287 |
| 20 | 3 | 0.084 | 0.106 |
| 20 | 9 | 0.064 | 4.084 |
| 200 | 9 | 0.078 | 0.092 |

차수 9 는 n=20 에서 학습 오차 0.064 로 가장 낮지만 테스트 오차가 4.08 로 폭발. 표본을 200 으로 늘리면 같은 모델이 0.092 로 내려온다(d2l: 데이터가 적을수록 과대적합이 쉽다).

**3. 릿지(L2)로 분산 억제.** 9차 다항식 + 표준화 + `Ridge(alpha)`, 1,000 학습 집합: alpha 1e-6 → 편향² 0.0023, 분산 2.53 / 1e-3 → 0.0009, 0.088 / 0.1 → 0.032, 0.085 / 10 → 0.150, 0.063. alpha 가 커질수록 분산은 줄고 편향은 커진다. 규제 강도가 편향-분산 조절 손잡이다.

## 규제

### 식 (sklearn 사용자 가이드 표기)

| 모델 | 목적 함수 |
| --- | --- |
| Ridge (L2) | min ‖Xw − y‖² + α‖w‖₂² |
| Lasso (L1) | min (1/(2n))‖Xw − y‖² + α‖w‖₁ |
| Elastic Net | min (1/(2n))‖Xw − y‖² + αρ‖w‖₁ + α(1−ρ)/2 ‖w‖₂² (ρ = `l1_ratio`) |

- 표기가 서로 다르다(릿지에는 1/(2n) 이 없음). 같은 α 값이 라이브러리·모델마다 같은 강도가 아니다. 문서 간 α 를 그대로 옮기지 않는다.
- d2l 의 L2 표기는 `L(w) + (λ/2)‖w‖²`, 미니배치 SGD 에서 매 갱신마다 가중치가 (1 − ηλ) 배로 줄어 "가중치 감쇠"라 부른다.
- 용어 충돌: 한국어 "정규화"는 min-max 척도 변환(normalization)을 가리키기도 하고 규제(regularization)를 가리키기도 한다. 이 노트는 regularization 을 "규제"로만 쓴다. 척도 변환은 [척도 변환](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/).

### Lasso 가 계수를 정확히 0 으로 만드는 이유
- sklearn 문서: Lasso 는 계수를 정확히 0 으로 만들 수 있고 비영 계수가 적은 해를 선호한다.
- 직관(1변수, 직교 설계, 필자 유도): `0.5(w − z)² + λ|w|` 의 해는 소프트 임계 `sign(z)·max(|z| − λ, 0)`, 릿지 `0.5(w − z)² + 0.5λw²` 의 해는 `z/(1+λ)`. z = 1, λ = 1.5 이면 Lasso 0, 릿지 0.4. |z| ≤ λ 인 계수는 L1 이 **0 으로 잘라 내고**, L2 는 비율만 줄인다. L1 벌점은 0 에서 꺾여 있어 0 이 최적점이 될 수 있다.
- d2l: L1 은 소수 변수에 가중치를 몰고 나머지를 0 으로 비워 변수 선택에 유용, L2 는 많은 변수에 가중치를 분산해 단일 변수의 측정 오류에 강건할 수 있다.

**직접 계산.** 100×10, 참 계수 [3, −2, 1.5, 0 … 0], 잡음 표준편차 1.

| α | Lasso 계수(앞 3개 / 나머지 7개) | 릿지(α×100) 나머지 7개 |
| --- | --- | --- |
| 0.1 | 3.08, −1.99, 1.27 / 모두 0 | −0.09 ~ 0.12 (0 아님) |
| 0.5 | 2.53, −1.49, 0.77 / 모두 0 | −0.09 ~ 0.15 (0 아님) |
| 2.0 | 0.64, 0, 0 / 모두 0 | −0.11 ~ 0.10 (0 아님), 앞 3개 0.91, −0.6, 0.33 |

Lasso 는 무관한 7 개를 정확히 0 으로, 릿지는 작게만 만든다. 릿지 열은 `Ridge(alpha = α×100)` 이고 두 모델의 α 는 같은 강도가 아니다(위 표기 차이). 의미 있는 비교는 "정확히 0 인가"뿐이다.

### Elastic Net
- L1 + L2. 상관된 변수가 있을 때 sklearn 문서는 Lasso 는 그중 하나를 임의로 고르는 경향, Elastic Net 은 둘 다 고르는 경향이 있다고 설명한다.
- 직접 계산: z 와 거의 같은(상관 ≈ 1) 두 변수 + 무관 변수, α=0.1 → Lasso `[0.19, 1.71, 0]`, Elastic Net(l1_ratio 0.5) `[0.91, 0.99, 0]`. 하나에 몰리는 것과 나눠 갖는 것의 차이가 보인다.

### 조기 종료
- 반복 학습에서 검증 점수가 개선되지 않으면 멈춘다. sklearn `MLPClassifier`: `early_stopping=True` 이면 학습 데이터의 `validation_fraction`(기본 0.1)을 따로 떼고, 검증 점수가 `tol`(기본 1e-4) 이상 좋아지지 않는 상태가 `n_iter_no_change`(기본 10) 에폭 이어지면 멈춘다. 켜지 않으면 *학습 손실*을 기준으로 멈춘다(기본값 False).
- 다른 L2 항 `alpha`(기본 1e-4)와는 별개다.

### 그 밖의 방법(링크)
- 트리: [가지치기](/develop-wiki/knowledge/machine-learning/decision-tree-gini-entropy-pruning/). 신경망: [드롭아웃·배치 정규화](/develop-wiki/knowledge/machine-learning/deep-learning-training-batchnorm-dropout/). 여러 모델의 평균으로 분산을 줄이는 [앙상블](/develop-wiki/knowledge/machine-learning/ensemble-bagging-boosting-stacking/). 변수 줄이기: [변수 선택](/develop-wiki/knowledge/data-analytics/feature-selection-dimensionality-reduction/). 다중공선성에 대한 릿지는 [회귀 진단](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/).

## 언제 쓰나 / 주의

- 변수가 많고 표본이 적거나 변수가 상관돼 있을 때 규제를 쓴다. 규제 강도(α, C)는 하이퍼파라미터이므로 교차검증으로 고른다([튜닝](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)).
- 규제 모델은 계수 크기가 벌점 대상이므로 변수 **척도를 먼저 맞춘다**(필자 정리, 위 식에서 따름).
- 규제는 편향을 키우는 대가로 분산을 줄인다. 과소적합이면 규제를 줄인다.
- 검증 점수로 규제 강도를 고르면 그 점수는 낙관적이다 → 별도 테스트·[중첩 CV](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/).
- Lasso 가 고른 변수를 "유일하게 중요한 변수"로 해석하지 않는다. sklearn 문서도 정확한 변수 복원은 표본 수·상관·α 선택 조건이 맞을 때만이라 하고, 교차검증으로 고른 α 는 무관한 변수를 일부 남기는 경향이 있다고 적는다.

## 검증 범위

- 읽음: sklearn 학습 곡선·선형 모델(7,900자 미확인 끝부분 제외)·`MLPClassifier` 문서, d2l 일반화·가중치 감쇠 절, Wikipedia 편향-분산 항목(ISLR p.34·ESL p.223 인용 확인).
- ISLR·ESL 본문은 읽지 못했다(PDF 추출 불가). 식은 Wikipedia 서술로 확인했다. 위 표의 편향²·분산은 직접 계산했지만 그 합이 테스트 오차와 일치하는지는 따로 검증하지 않았다.
- 실행하지 않음: 신경망 조기 종료 실험, 교차검증 기반 α 선택, 0-1 손실의 분해.

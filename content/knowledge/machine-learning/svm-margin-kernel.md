---
title: 서포트 벡터 머신 — 마진과 커널 (SVM)
aka: [Support Vector Machine, SVM, SVC, SVR, Maximum Margin, Soft Margin, Hinge Loss, Kernel Trick, RBF Kernel, 서포트벡터머신]
category: machine-learning
group: supervised
level: intermediate
summary: 두 클래스 사이 여백(마진)이 가장 넓은 경계를 찾고, 커널로 비선형 경계까지 확장하는 분류·회귀 모형이다. C 와 gamma 가 복잡도를 정하고 스케일링이 사실상 필수다.
tags: [svm, margin, kernel, rbf, hinge-loss, support-vector, svr, supervised]
related: [machine-learning/overfitting-bias-variance-regularization, machine-learning/hyperparameter-tuning-search, machine-learning/gradient-descent-loss-optimizers, data-analytics/scaling-encoding-transformation-derived-features, machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/neural-network-mlp-backpropagation-activation]
sources:
  - https://scikit-learn.org/stable/modules/svm.html
  - https://scikit-learn.org/stable/whats_new/v1.9.html
updatedAt: 2026-11-23
---

## 개요

- 선형으로 갈라지는 두 클래스에는 경계가 무수히 많다. SVM 은 두 클래스에서 경계까지의 최소 거리(마진)가 가장 큰 경계를 고른다.
- 경계를 결정하는 것은 경계에 가장 가까운(또는 마진 안에 들어온) 일부 훈련 점, 서포트 벡터뿐이다. 나머지 점을 움직여도 경계는 그대로다.
- 데이터가 완벽히 갈리지 않으면 일부 위반을 허용하는 소프트 마진을 쓰고, 선형으로 안 갈리면 커널로 고차원 특성 공간에서 선형 경계를 찾는다.

## 시험 범위 대응

- 빅데이터분석기사 3과목 > 분석기법 적용 > 서포트벡터머신, ADsP·ADP 데이터분석 > 정형 데이터 마이닝 > 분류분석, ADP 실기 > 모델 구축(분류·회귀)·초매개변수 조율.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 마진 | margin | 결정 경계와 가장 가까운 훈련 점 사이 거리의 두 배에 해당하는 여백 폭 (선형 경우 2/‖w‖) |
| 서포트 벡터 | support vector | 쌍대 문제에서 계수 α_i 가 0 이 아닌 훈련 점. 예측식에는 이 점들만 들어간다 |
| 하드 마진 | hard margin | 위반 없이 완전히 분리하는 경계. 선형 분리 가능해야 존재 |
| 소프트 마진 | soft margin | 슬랙 변수 ζ 로 일부 위반을 허용하되 벌점을 부과 |
| C | C | 위반 벌점의 크기. 규제의 역수 역할(sklearn 문서: inverse regularization) |
| 힌지 손실 | hinge loss | `max(0, 1 − y·f(x))` (y 는 −1/+1) |
| 커널 | kernel | 두 점의 고차원 내적을 직접 매핑 없이 계산하는 함수 K(x, x') |
| gamma | γ | RBF 등 커널에서 한 훈련 점의 영향 범위를 정하는 값 |
| ε-튜브 | ε-insensitive tube | SVR 에서 오차를 벌점 없이 허용하는 폭 |

## 최대 마진과 소프트 마진

sklearn 문서의 SVC 정식화(원문 식을 다시 쓴 요약):

- 원 문제: `min ½‖w‖² + C·Σ ζ_i`, 조건 `y_i(wᵀφ(x_i) + b) ≥ 1 − ζ_i, ζ_i ≥ 0`.
- 슬랙 ζ_i 는 점 i 가 마진을 침범한 정도. ζ=0 이면 마진 밖(올바른 쪽), 0<ζ≤1 이면 마진 안에서 올바른 쪽, ζ>1 이면 오분류.
- 같은 문제를 힌지 손실로 쓰면 `½‖w‖² + C·Σ max(0, 1 − y_i f(x_i))`. 문서는 `LinearSVC` 가 이 형태를 직접 최적화한다고 쓴다(다만 `LinearSVC` 의 기본 loss 는 `squared_hinge` 이고, `loss='hinge'` 일 때 위 식과 같다). 커널 트릭이 필요한 커널 트릭이 필요한 `SVC` 는 쌍대 형태로 푼다.
- 쌍대 문제: `min ½αᵀQα − eᵀα`, `0 ≤ α_i ≤ C`, `yᵀα = 0`, `Q_ij = y_i y_j K(x_i, x_j)`. 예측: `sign(Σ_{i∈SV} y_i α_i K(x_i, x) + b)`.

C 의 효과(문서): C 가 낮으면 결정면이 매끄럽고(위반을 더 용인), C 가 높으면 훈련 점을 모두 맞히는 쪽으로 간다. 하드 마진은 C → ∞ 의 극한으로 이해할 수 있다(필자 해석).

## 커널 트릭

| 커널 | 식 | 파라미터 |
| --- | --- | --- |
| 선형 | `⟨x, x'⟩` | 없음 |
| 다항 | `(γ⟨x, x'⟩ + r)^d` | degree d, coef0 r, gamma |
| RBF(가우시안) | `exp(−γ‖x − x'‖²)` | gamma > 0 |
| 시그모이드 | `tanh(γ⟨x, x'⟩ + r)` | gamma, coef0 |

- 커널은 φ(x) 를 명시적으로 계산하지 않고 `K(x, x') = ⟨φ(x), φ(x')⟩` 만 계산한다. 쌍대 문제와 예측식이 내적으로만 쓰이기 때문에 가능한 방법이다. 힌지 손실의 원 문제 형태에는 내적이 없어 커널 트릭을 못 쓴다는 것이 문서의 설명이다.
- RBF 의 gamma: 클수록 한 점의 영향이 가까운 이웃에만 미친다(경계가 구불구불, 과대적합 위험). 작으면 영향이 넓어 경계가 매끄럽다.
- 표본 수에 대한 계산량: libsvm 기반 구현은 표본 수의 2~3제곱에 비례하는 범위(문서). 선형이고 데이터가 크면 `LinearSVC` 가 거의 선형으로 확장된다.

## SVR (회귀)

- ε-SVR: 예측이 목표값에서 ε 이내면 벌점이 없고(튜브 안), 밖으로 벗어난 만큼만 `C` 로 벌점을 준다. 원 문제 `min ½‖w‖² + C·Σ(ζ_i + ζ_i*)`.
- 튜브 안의 점은 서포트 벡터가 되지 않으므로 ε 이 클수록 서포트 벡터가 줄어드는 경향이 있다(구조에서 읽히는 성질).

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1).

**(1) 선형 SVM 손계산.** 점 (0,0), (1,0) = 클래스 −1, (3,3), (4,3) = 클래스 +1. 가장 가까운 두 반대 클래스 점은 (1,0) 과 (3,3), 차이 벡터 d = (2,3), |d|² = 13. 두 점이 마진 경계 위에 놓이는 해는 `w = 2d/|d|² = (4/13, 6/13) ≈ (0.3077, 0.4615)`, 마진 폭 `2/‖w‖ = |d| = √13 ≈ 3.606`.
- `SVC(kernel='linear', C=1e6)` 결과: w = (0.3077, 0.4615), b = −1.3077, 서포트 벡터 (1,0)·(3,3), 마진 폭 3.606. 손계산과 일치. 서포트 벡터에서 f(x) = −1, +1 이고 그 외 점의 힌지 손실은 0.

**(2) C 변화.** `make_moons(300, noise=0.3, seed 0)`, 70/30 층화 분할, `SVC(gamma=1)`.

| C | 서포트 벡터 수 | 훈련 정확도 | 시험 정확도 |
| --- | --- | --- | --- |
| 0.01 | 210 | 0.857 | 0.767 |
| 0.1 | 124 | 0.895 | 0.867 |
| 1 | 67 | 0.933 | 0.922 |
| 10 | 45 | 0.948 | 0.933 |
| 1000 | 40 | 0.948 | 0.933 |

C 가 작을수록 위반을 허용해 서포트 벡터가 많아지고 경계가 단순해진다.

**(3) gamma 변화.** 같은 데이터, `C=1`.

| gamma | 서포트 벡터 수 | 훈련 | 시험 |
| --- | --- | --- | --- |
| 0.01 | 143 | 0.843 | 0.756 |
| 0.1 | 93 | 0.848 | 0.744 |
| 1 | 67 | 0.933 | 0.922 |
| 10 | 109 | 0.933 | 0.956 |
| 100 | 196 | 0.986 | 0.922 |

gamma 가 너무 작으면 과소적합, 너무 크면 훈련 점수는 오르지만 시험 점수가 내려가는 과대적합 경향이 보인다(gamma=10 의 시험 0.956 은 단일 분할이라 우연일 수 있다). 값은 이 분할·seed 의 결과다.

**(4) 스케일링.** 위 데이터에 표준편차 1000 짜리 무의미한 잡음 특성을 한 개 덧붙이면 기본 `SVC()` 시험 정확도 0.444, `StandardScaler` 파이프라인 0.833(seed 고정 단일 분할). 큰 스케일 특성이 거리를 독점한다.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
clf = make_pipeline(StandardScaler(), SVC(C=1.0, gamma="scale"))
```

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 하드 vs 소프트 마진 | 하드는 위반 0 허용(분리 가능할 때만), 소프트는 슬랙으로 위반 허용. 실무 기본은 소프트 |
| C vs gamma | C 는 위반 벌점(어느 모양이든 규제 강도), gamma 는 RBF 의 영향 범위(경계의 곡률). 둘이 함께 복잡도를 정한다 |
| `SVC` vs `LinearSVC` | `SVC` 는 libsvm 기반이라 커널 지원·쌍대 형태, `LinearSVC` 는 liblinear 기반 선형 전용으로 대용량에 유리 |
| 마진(여백 폭) vs 마진(점의 신뢰도) | 여기서는 경계 사이 여백. 일부 문헌은 점별 `y·f(x)` 를 마진이라 부른다 |
| `decision_function` vs `predict_proba` | 전자는 경계까지의 부호 있는 거리형 점수, 후자는 사후 보정한 확률 |

## 언제 쓰나 / 주의

- 쓰는 곳: 중소규모 데이터, 특성이 많은(고차원) 분류, 표본보다 특성이 많은 경우(문서: 이때도 효과적). 서포트 벡터만 쓰므로 메모리가 효율적이다.
- 스케일링 필수: 문서는 SVM 이 스케일 불변이 아니므로 [0,1]·[−1,+1] 범위나 표준화로 맞추고 테스트에도 같은 변환을 적용하라고 한다 → [스케일링](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/)
- 하이퍼파라미터: C 와 gamma 는 `GridSearchCV` 로 지수 간격 값을 탐색하라고 문서가 권한다 → [하이퍼파라미터 탐색](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)
- 특성이 표본보다 훨씬 많으면 커널과 규제항 선택이 과대적합을 막는 데 결정적이다(문서).
- **확률 출력.** SVM 은 확률 추정을 직접 제공하지 않는다. `probability=True` 는 내부 5겹 교차 검증을 더해 Platt 스케일링(점수에 로지스틱 회귀를 적합)으로 확률을 만들며 비용이 크다. 문서의 주의: `predict` 와 `predict_proba` 의 argmax 가 어긋날 수 있고, Platt 방법에는 이론적 문제가 알려져 있으니 신뢰도 점수만 필요하면 `decision_function` 을 쓰라. `SVC(probability=True)` 의 `probability` 매개변수는 1.9 에서 deprecated(스레드 안전하지 않아서, 1.11 에서 제거 예정)다(1.9 릴리스 노트로 확인, svm 사용자 가이드 본문은 아직 이를 언급하지 않는다). 이 환경에서도 FutureWarning 이 나왔고 `CalibratedClassifierCV(SVC(), ensemble=False)` 가 대안으로 안내됐다. 내가 만든 200점 예에서는 두 argmax 가 어긋나는 점이 0 개였다(문서가 말한 현상을 재현하지 못함).
- 대용량(수십만 이상)에서는 커널 SVM 훈련이 느리다. 선형 근사나 다른 모델(트리 앙상블, 신경망)을 검토한다.
- 다중 클래스는 이분류 SVM 을 조합해 처리한다(sklearn 세부 방식은 이 노트에서 다루지 않음).

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드 "Support Vector Machines" 절(장단점, SVC·SVR 정식화, 커널 식, C·gamma 설명, 스케일링, 확률·Platt 주의, 복잡도, libsvm·liblinear 사용).
- 직접 계산: 선형 SVM 손계산 일치, C·gamma 표, 스케일링 비교, 확률 argmax 비교(Python 3.15, scikit-learn 1.9.1). 표의 수치는 분할·seed(0) 고정 단일 실행이다.
- 읽지 못한 것: Chang & Lin 의 LIBSVM 논문(ACM TIST 2011)과 실용 가이드(서버 오류로 열람 실패), Cortes & Vapnik 원 논문, Platt 원 논문. libsvm 은 sklearn 문서가 사용 사실을 밝힌 범위에서만 언급했다.
- 미확인: 다중 클래스 처리 세부, 마진 폭 `2/‖w‖` 유도의 원 문헌 서술(손계산·수치로 일치만 확인).

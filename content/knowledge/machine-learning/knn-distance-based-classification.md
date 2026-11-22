---
title: k-최근접 이웃 (k-NN)
aka: [k-Nearest Neighbors, KNN, Instance-Based Learning, Lazy Learning, 사례 기반 학습, 게으른 학습]
category: machine-learning
group: supervised
level: beginner
summary: 새 점과 가장 가까운 k 개의 훈련 표본을 찾아 분류는 다수결, 회귀는 평균으로 예측하는 방법이다. 거리에 전적으로 의존하므로 스케일링과 거리 척도 선택이 결과를 좌우한다.
tags: [knn, distance, lazy-learning, instance-based, scaling, curse-of-dimensionality, supervised]
related: [machine-learning/learning-paradigms-supervised-unsupervised-reinforcement, machine-learning/overfitting-bias-variance-regularization, machine-learning/hyperparameter-tuning-search, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/feature-selection-dimensionality-reduction, machine-learning/clustering-kmeans-hierarchical-dbscan]
sources:
  - https://scikit-learn.org/stable/modules/neighbors.html
  - https://scikit-learn.org/stable/modules/ensemble.html
  - https://www.stat.berkeley.edu/~breiman/bagging.pdf
updatedAt: 2026-11-23
---

## 개요

- 학습 단계에서 하는 일이 거의 없다. 훈련 데이터를 저장해 두었다가, 예측할 때 질의 점과 가까운 k 개를 찾아 라벨을 모은다.
- 분류는 이웃들의 다수결, 회귀는 이웃 라벨의 평균이다(sklearn `KNeighborsClassifier`, `KNeighborsRegressor`).
- 모수를 추정하지 않는 비모수 방식이라 결정 경계가 매우 불규칙한 문제에서 잘 맞는 경우가 있다(sklearn 문서). 대신 "가깝다"의 정의가 곧 모형이다.

## 시험 범위 대응

- 공식 출제범위에 k-NN 이라는 항목은 직접 없다. 관련: ADsP 데이터분석 > 정형 데이터 마이닝 > 분류분석(분류 기법의 하나로 수험서에서 다루는 경우가 많으나 공식 항목명에는 없음), 빅데이터분석기사 3과목 > 분석기법 적용, ADP 실기 > 모델 구축(분류·회귀).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 게으른 학습 | lazy learning | 학습 때 일반화 모형을 만들지 않고 예측 때 계산을 몰아서 하는 방식 |
| 사례(인스턴스) 기반 학습 | instance-based learning | 훈련 표본 자체를 기억해 예측에 쓰는 방식. sklearn 문서는 "non-generalizing" 방법이라 부른다 |
| 비모수 | non-parametric | 분포·함수 형태를 가정한 모수를 추정하지 않음 |
| k | n_neighbors | 참조할 이웃 수. 사용자가 정하는 하이퍼파라미터 |
| 가중 투표 | weights='distance' | 이웃의 기여를 거리의 역수에 비례하게 하는 옵션. 기본은 `uniform`(동일 가중) |
| 거리 척도 | metric | 두 점이 얼마나 먼지 정의하는 함수 |
| 차원의 저주 | curse of dimensionality | 차원이 커지면 "가까운 이웃"이 의미 없어지고 탐색도 비효율해지는 현상 |

## 거리 척도

두 점 x, z (특성 d 개) 사이:

| 척도 | 식 | 비고 |
| --- | --- | --- |
| 맨해튼 (L1) | `Σ \|x_i − z_i\|` | 이상값 영향이 상대적으로 작다 |
| 유클리드 (L2) | `√Σ (x_i − z_i)²` | 가장 흔한 기본값 |
| 민코프스키 (Lp) | `(Σ \|x_i − z_i\|^p)^(1/p)` | p=1 맨해튼, p=2 유클리드를 포함하는 일반형. sklearn 의 `minkowski` |
| 코사인 거리 | `1 − cos(x, z)` | 벡터 방향만 비교(크기 무시). 텍스트·임베딩에서 흔함 |
| 마할라노비스 | `√((x−z)ᵀ S⁻¹ (x−z))` | 특성 간 공분산 S 를 반영해 단위와 상관을 함께 보정 |

- 위 식은 정의 수준의 일반 수학이며, 구현 지원 여부는 sklearn 문서로 확인했다: KDTree 는 유클리드·맨해튼·민코프스키·체비쇼프, BallTree 는 거기에 마할라노비스·해밍·자카드 등이 추가되고, 코사인은 brute 방식에서 `cosine_distances` 로 계산한다. 마할라노비스의 공분산 인자 지정법은 이 노트에서 확인하지 않았다(미확인).
- 범주형·이진 특성에는 해밍·자카드 같은 척도를 쓴다(지원 목록은 문서 확인).

## k 와 가중치

- sklearn 문서: 최적 k 는 데이터에 크게 의존한다. 일반적으로 k 가 크면 잡음의 영향이 줄지만 분류 경계가 덜 뚜렷해진다.
- k=1 은 (같은 점에 다른 라벨이 없다면) 훈련 데이터에 대한 정확도가 완전하다(자기 자신이 이웃). 훈련 점수로는 k 를 고를 수 없다. 교차 검증으로 정한다 → [하이퍼파라미터 탐색](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)
- 이분류에서 동률을 피하려고 홀수 k 를 쓰는 관행이 있다(필자 경험칙이며 sklearn 문서의 권고는 아님).
- 거리 가중(`weights='distance'`)은 가까운 이웃에 더 큰 영향을 준다.

## 스케일링

- 거리 기반이라 단위가 큰 특성이 거리를 독점한다. sklearn 이웃 문서에는 k-NN 에 스케일링하라는 명시 문장이 없었다. 아래 직접 계산으로 효과를 확인한 것이며 거리 기반 방법의 일반 원리다.
- 스케일러는 훈련 데이터로만 적합하고, `Pipeline` 으로 교차 검증 안에 넣어 정보 누출을 막는다 → [스케일링·인코딩](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/)
- 범주형은 원-핫 등으로 바꾸되, 더미 변수 수가 늘면 거리 해석이 달라진다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1).

**(1) 스케일링 전후, 4개 점.** 나이(세)와 소득(원): A(25, 5천만), B(30, 5.2천만), C(45, 9천만), D(50, 9.2천만). 라벨 A·B=0, C·D=1. 질의 (26세, 8.8천만).

| | 질의→A | 질의→B | 질의→C | 질의→D | 1-NN |
| --- | --- | --- | --- | --- | --- |
| 원단위 거리 | 3,800만 | 3,600만 | 200만 | 400만 | 클래스 1 (C) |
| 표준화 후 거리 | 1.90 | 1.84 | 1.85 | 2.34 | 클래스 0 (B) |

- 원단위에서는 나이 차이(1~19)가 소득 차이(수백만 원) 앞에서 사실상 무시된다. 표준화하면 두 특성이 비슷한 비중을 가져 가장 가까운 점이 바뀌었다. 어느 쪽이 "맞는지"는 문제에 달렸고, 요점은 스케일링이 예측을 뒤집을 수 있다는 것이다.

**(2) 와인 데이터(178행, 13특성), 5겹 층화 교차 검증 정확도, `random_state=0`으로 분할 고정.**

| k | 스케일링 없음 | StandardScaler 파이프라인 |
| --- | --- | --- |
| 1 | 0.719 | 0.955 |
| 5 | 0.663 | 0.961 |
| 11 | 0.691 | 0.966 |
| 25 | 0.725 | 0.983 |

- 값은 분할 seed 에 따라 달라지는 단일 실행 결과다. 격차의 크기(약 0.25~0.3)가 요점이다.

**(3) 차원의 저주(균일 난수 500점, seed 0).** 질의 점에서 가장 가까운 점 거리 ÷ 가장 먼 점 거리: 2차원 0.024, 10차원 0.177, 100차원 0.737, 1000차원 0.904. 차원이 커질수록 "가까운 점"과 "먼 점"의 구분이 사라진다.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
model = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=5, weights="distance"))
```

## 탐색 알고리즘

- 무식한 전수 비교(`brute`)는 O(D·N²) 형태로 N 이 커지면 비현실적. KD 트리는 저차원(D < 20 정도)에서 빠르고, 차원이 커지면 비효율해진다. Ball 트리는 고차원에서 KD 트리보다 나을 수 있으나 데이터 구조에 달렸다(문서).
- `algorithm='auto'` 는 희소 입력, 사전 계산 거리, D > 15, k ≥ N/2 같은 경우 brute 를 고른다(문서).
- 질의 시간이 O(N) 급이라, 데이터가 많고 응답 지연이 중요한 서비스에는 근사 이웃 탐색을 따로 검토한다(필자 판단, 이 노트에서 다루지 않음).

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| k-NN vs k-means | k-NN 은 라벨이 있는 지도학습 분류·회귀, k-means 는 라벨 없이 군집을 만드는 비지도학습. 둘의 k 는 이웃 수 vs 군집 수로 의미가 다르다 → [군집](/develop-wiki/knowledge/machine-learning/clustering-kmeans-hierarchical-dbscan/) |
| 게으른 학습 vs 느린 학습 | "게으른"은 학습 단계가 없다는 뜻이고, 예측 때 비용이 든다는 뜻이다 |
| k-NN 회귀 vs 선형 회귀 | k-NN 은 이웃 평균(구간별 상수에 가까움), 선형 회귀는 전역 직선. k-NN 은 훈련 범위 밖 외삽을 못 한다 |

## 언제 쓰나 / 주의

- 쓰는 곳: 소규모·저차원 데이터의 빠른 기준선, 결정 경계가 복잡한 경우, 추천·유사 항목 검색의 단순 버전.
- 불리한 곳: 고차원(특성이 많고 대부분 무관), 대용량, 예측 지연 제약.
- 무관한 특성이 거리를 오염시킨다. 특성 선택·차원 축소가 효과적일 때가 많다 → [특성 선택·차원 축소](/develop-wiki/knowledge/data-analytics/feature-selection-dimensionality-reduction/)
- 클래스 불균형이면 다수 클래스가 이웃을 독점한다. `weights='distance'`·재표집을 검토한다.
- 모델 크기 = 데이터 크기. 개인정보가 담긴 훈련 표본을 모델이 그대로 품는다는 점도 고려한다.
- 앙상블 문서에 `BaggingClassifier(KNeighborsClassifier(), max_samples=0.5, max_features=0.5)` 예가 있다. 다만 배깅은 훈련 집합을 흔들면 예측기가 크게 변하는 불안정한 방법에서 효과가 크다는 것이 Breiman(1996)의 요지이고, k-NN 은 상대적으로 안정적이라 배깅 이득이 작을 수 있다(필자 추론) → [앙상블](/develop-wiki/knowledge/machine-learning/ensemble-bagging-boosting-stacking/)

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드 "Nearest Neighbors" 절(분류·회귀, 가중, 알고리즘, 차원의 저주, k 선택, 지원 거리 목록)과 앙상블 절의 배깅 예.
- 직접 계산: 위 세 표(Python 3.15, scikit-learn 1.9.1). (1)은 결정적, (2)는 분할 seed 고정 단일 실행, (3)은 난수 seed 0.
- 미확인: 마할라노비스 거리의 sklearn 인자 지정법, 코사인 거리에서 트리 사용 여부, "k-NN 에 스케일링 필요"를 명시한 1차 문서(sklearn 이웃 문서에는 없음, 위 직접 계산으로 현상만 확인), 홀수 k 관행의 출처.

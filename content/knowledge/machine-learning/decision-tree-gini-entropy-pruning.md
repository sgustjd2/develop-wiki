---
title: 의사결정나무 — 분할 기준·가지치기 (Decision Tree)
aka: [Decision Tree, CART, ID3, C4.5, CHAID, Gini Impurity, Information Gain, Cost-Complexity Pruning, 결정 트리]
category: machine-learning
group: supervised
level: intermediate
summary: 특성 하나씩 "예/아니오" 조건으로 데이터를 나누는 분류·회귀 모형이다. 불순도(지니·엔트로피·분산)로 분할을 고르고, 과대적합은 정지 규칙과 비용-복잡도 가지치기로 막는다.
tags: [decision-tree, cart, gini, entropy, pruning, classification, regression, supervised]
related: [machine-learning/ensemble-bagging-boosting-stacking, machine-learning/gradient-boosting-xgboost-lightgbm, machine-learning/overfitting-bias-variance-regularization, machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/model-interpretation-feature-importance-shap-pdp]
sources:
  - https://scikit-learn.org/stable/modules/tree.html
  - https://scikit-learn.org/stable/modules/ensemble.html
  - https://en.wikipedia.org/wiki/Decision_tree_learning
updatedAt: 2026-11-23
---

## 개요

- 루트에서 시작해 "특성 j 가 임계값 t 이하인가?" 같은 질문으로 데이터를 둘로 나누고, 나뉜 부분에서 같은 일을 반복해 잎(leaf)에 예측값을 둔다.
- 분류 잎은 클래스 비율(또는 다수 클래스), 회귀 잎은 평균(또는 중앙값)을 낸다.
- 규칙을 사람이 읽을 수 있고 스케일링이 필요 없지만, 가만히 두면 훈련 데이터를 외울 만큼 깊어진다. 그래서 "어떻게 나누나"와 "어디서 멈추거나 자르나"가 이 모형의 전부다.

## 시험 범위 대응

- ADsP 데이터분석 > 정형 데이터 마이닝 > 분류분석, 빅데이터분석기사 3과목 > 분석기법 적용 > 의사결정나무, ADP 실기 > 모델 구축(분류·회귀)·초매개변수 조율에 해당한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 노드 / 잎 | node / leaf | 노드는 분할 지점, 잎은 더 나누지 않는 말단으로 예측값을 가진다 |
| 불순도 | impurity | 한 노드에 여러 클래스가 섞인 정도를 재는 값(지니·엔트로피) 또는 회귀의 퍼짐(분산) |
| 지니 불순도 | Gini impurity | 클래스 비율 p_k 에 대해 `Σ p_k(1 − p_k)` (= `1 − Σ p_k²`) |
| 엔트로피 | entropy | `−Σ p_k log p_k` (sklearn 계산에서는 log2 로 확인됨, 아래 직접 계산) |
| 정보 이득 | information gain | 분할 전 엔트로피 − 분할 후 자식 엔트로피의 가중 평균 |
| 이득비 | gain ratio | 정보 이득이 값의 가짓수가 많은 특성에 유리한 점을 보정한 기준(C4.5 계열) |
| 가지치기 | pruning | 이미 자란 트리의 가지를 잘라 단순하게 만드는 일 |
| 사전 가지치기 | pre-pruning (early stopping) | 자라는 도중 깊이·표본 수 조건으로 멈추게 하는 일 |
| 사후 가지치기 | post-pruning | 끝까지 키운 뒤 잘라 내는 일. 비용-복잡도 가지치기가 대표 |
| `ccp_alpha` | complexity parameter α | 잎 하나당 부과하는 벌점. 클수록 더 많이 자른다 |

## 분할 기준

노드 m 의 데이터를 특성 j·임계값 t 로 둘로 나눌 때, sklearn 은 자식 불순도의 표본 수 가중 평균 `G = (n_왼/n)·H(왼) + (n_오/n)·H(오)` 가 가장 작은 분할을 고른다. 가능한 모든 특성과 이웃 값 사이 중간점을 탐욕적(greedy)으로 훑는다(`splitter='best'`).

| 기준 | 대상 | H 의 정의 | 비고 |
| --- | --- | --- | --- |
| 지니 | 분류 | `Σ p(1−p)` | sklearn 기본 |
| 엔트로피 / 정보 이득 | 분류 | `−Σ p log p` | 엔트로피 최소화는 트리의 로그 손실 최소화와 같다고 sklearn 문서가 설명 |
| 이득비 | 분류 | 정보 이득을 보정 | C4.5. 정확한 분모 식은 이 노트에서 확인하지 않음(미확인) |
| 카이제곱 | 분류 | 분할과 목표 변수의 독립성 검정 | CHAID. 다지(多枝) 분할 가능(Wikipedia 요약) |
| 분산 감소(MSE) | 회귀 | 노드 평균 둘레의 제곱 오차 평균 | 잎 예측 = 평균 |
| MAE | 회귀 | 중앙값 둘레의 절대 오차 평균 | 잎 예측 = 중앙값, MSE 보다 느림 |

- 지니와 엔트로피는 대부분 비슷한 분할을 고른다. 아래 예에서도 같은 분할이 나왔다(일반화한 주장은 아님).
- sklearn 은 Poisson 편차(비음수 카운트 목표)도 회귀 기준으로 제공한다.

### 알고리즘 계보

| 이름 | 특징 (sklearn 문서·Wikipedia 기준) |
| --- | --- |
| ID3 (Quinlan, 1986) | 범주형 특성만, 정보 이득 최대 특성으로 다지 분할, 끝까지 키운 뒤 가지치기 |
| C4.5 | ID3 확장. 연속형 특성을 구간으로 나눠 처리, 규칙(if-then) 변환, 이득비 사용(이득비 귀속은 이 노트의 출처로는 확인하지 못했다, 미확인) |
| C5.0 | Quinlan 의 후속판. 독점 라이선스 |
| CART (Breiman 외, 1984) | **이진** 분할, 분류·회귀 모두 가능, 규칙 집합은 만들지 않음. 지니와의 연결은 Wikipedia(Gini impurity 항목)에서만 확인했고, sklearn 문서는 CART 를 정보 이득으로 서술한다 |
| CHAID (Kass, 1980) | 다지(multi-level) 분할. 카이제곱 기준은 알고리즘 이름에서 읽은 것이고 원 문헌(Kass 1980)은 읽지 않았다 |

- sklearn 의 `DecisionTreeClassifier`·`Regressor` 는 CART 를 최적화한 구현이다. 범주형 특성을 직접 받지 않는다(문서 서술 기준, 버전에 따라 바뀔 수 있다. 원-핫·순서 인코딩 필요).
- 수험서에서 "CART=지니, C4.5=엔트로피(이득비), CHAID=카이제곱"으로 짝짓는 정리는 위 자료와 어긋나지 않는다. 단 원 문헌(Breiman 1984, Quinlan 책)은 직접 읽지 않았다.

## 정지 규칙과 가지치기

### 사전 가지치기(정지 규칙)

- `max_depth`, `min_samples_split`, `min_samples_leaf`, `min_impurity_decrease` 등으로 성장을 막는다.
- sklearn 문서 조언: 먼저 `max_depth=3` 으로 모양을 보고 늘린다. `min_samples_leaf=5` 가 무난한 시작점이다. `min_samples_split` 은 표본 가중치를 무시하므로 가중치를 쓰면 `min_weight_fraction_leaf` 나 `min_impurity_decrease` 를 쓴다.

### 사후 가지치기: 최소 비용-복잡도 (Minimal Cost-Complexity)

- 트리 T 의 비용: `R_α(T) = R(T) + α·|잎 수|`. R(T) 는 잎 불순도의 표본 비율 가중합(sklearn 은 오분류율 대신 불순도를 쓴다).
- 내부 노드 t 의 유효 α: `α_eff(t) = (R(t) − R(T_t)) / (|T_t 의 잎 수| − 1)`. 이 노드를 잎으로 바꿔도 비용이 같아지는 α 다.
- 가장 작은 α_eff 의 노드("가장 약한 연결")부터 자르고, 남은 최소 α_eff 가 `ccp_alpha` 를 넘으면 멈춘다. 근거: Breiman 외 (1984) 3장(문서 인용).
- `cost_complexity_pruning_path` 로 α 후보 목록을 얻고, 그 α 들을 교차 검증으로 비교해 고른다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1). 특성 x = 1…10, 라벨 y = 0,0,0,0,1,0,1,1,1,1.

| 항목 | 손계산 | sklearn |
| --- | --- | --- |
| 루트 지니 | 1 − (0.5² + 0.5²) = 0.5 | 0.5 |
| 루트 엔트로피 | −2·0.5·log2 0.5 = 1.0 | 1.0 |
| 분할 x ≤ 4.5: 가중 지니 | (4/10)·0 + (6/10)·(1 − (5/6)² − (1/6)²) = 0.1667 | 선택된 임계값 4.5 |
| 같은 분할의 정보 이득 | 1.0 − (6/10)·0.6500 = 0.61 | — |
| 분할 x ≤ 5.5: 가중 지니 / 이득 | 0.32 / 0.278 | 후보 중 열세 |

- x ≤ 6.5 도 가중 지니 0.1667 로 같다. sklearn 은 4.5 를 골랐다(동률일 때 선택 규칙은 구현 세부).
- 오른쪽 자식(6개, 1이 5개)의 지니는 0.2778, 엔트로피는 0.6500 이 출력과 일치했다. 지니 기준과 엔트로피 기준 모두 같은 임계값 4.5.
- 끝까지 키운 트리는 잎 4개. `cost_complexity_pruning_path` 의 α = [0, 0.0833, 0.3333], 총 불순도 R = [0, 0.1667, 0.5].
  - 손계산: (0.1667 − 0)/(4 − 2) = 0.0833 → 잎 2개 트리. (0.5 − 0.1667)/(2 − 1) = 0.3333 → 잎 1개. 일치.
  - 해당 α 로 `ccp_alpha` 를 주면 잎 수가 4 → 2 → 1 로 줄었다.
- 회귀 예: y = 1, 1.2, 0.9, 3, 3.2, 2.8 (x=1…6). `max_depth=1` 은 임계값 3.5 를 골랐고 잎 값은 1.0333 / 3.0, 루트 MSE 0.9881 → 자식 0.0156, 0.0267 (분산 감소).

```python
from sklearn.tree import DecisionTreeClassifier
m = DecisionTreeClassifier(criterion="gini", max_depth=1).fit(X, y)  # X: (10,1)
path = DecisionTreeClassifier(random_state=0).fit(X, y).cost_complexity_pruning_path(X, y)
print(path.ccp_alphas, path.impurities)
```

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 정보 이득 vs 이득비 | 이득은 값이 많은 특성(예: ID 열)에 유리해 보이기 쉽다. 이득비는 그 편향을 줄이려는 보정이다 |
| 사전 vs 사후 가지치기 | 사전은 자라는 중 멈춤(깊이·표본 수), 사후는 다 키운 뒤 자름(ccp_alpha) |
| `ccp_alpha` vs `min_impurity_decrease` | 전자는 키운 트리에서 잎당 벌점으로 자르고, 후자는 분할마다 최소 개선량을 요구해 못 나누게 한다 |
| 지니 불순도 vs 지니 계수 | 이름은 같지만 불평등 지표인 지니 계수와 별개 양이다. 트리의 지니는 "무작위로 라벨을 붙일 때 틀릴 확률" 계열 값 |

## 언제 쓰나 / 주의

- 쓰는 곳: 규칙 설명이 중요한 분류·회귀, 스케일링·정규화 없이 빠른 기준선, 앙상블의 기본 학습기.
- 과대적합: 깊이 제한·`min_samples_leaf`·가지치기 중 하나는 거의 항상 필요하다.
- 불안정: 데이터가 조금 바뀌면 구조가 크게 달라질 수 있다. 앙상블로 완화한다(sklearn 문서) → [앙상블](/develop-wiki/knowledge/machine-learning/ensemble-bagging-boosting-stacking/)
- 탐욕적 분할이라 최적 트리를 보장하지 않는다(최적 트리 탐색은 NP-완전이라고 문서가 설명).
- 구간별 상수 예측: 부드럽지 않고 훈련 범위 밖 외삽에 약하다. XOR·패리티 같은 개념은 표현하기 어렵다.
- 우세 클래스 편향: 불균형이면 클래스 가중치나 균형 맞추기가 필요하다.
- 변수 중요도의 한계: 트리 기반 불순도 중요도(MDI)는 훈련 데이터로 계산되고 고유값이 많은 특성에 유리해 오도할 수 있다고 sklearn 앙상블 문서가 경고하며 순열 중요도를 대안으로 권한다 → [모델 해석](/develop-wiki/knowledge/machine-learning/model-interpretation-feature-importance-shap-pdp/)
- 특성 수가 표본에 비해 많으면 더 쉽게 과대적합한다. 차원 축소·특성 선택을 먼저 고려한다(문서 팁).

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드의 트리 절(분할 기준·CART/ID3/C4.5 설명·비용-복잡도 가지치기·단점·팁)과 앙상블 절의 변수 중요도 경고, Wikipedia 결정 트리 항목의 알고리즘·공식 요약(보조).
- 직접 계산: 위 표의 모든 수치(Python 3.15, scikit-learn 1.9.1). 데이터는 결정적이며 seed 의존 없음(`random_state=0`).
- 읽지 못한 것: Breiman 외 (1984) 원서, Quinlan 의 ID3·C4.5 원 문헌, ISLR 8장(PDF 가 내려받기 제한을 넘어 열람 못 함). CART·ID3·C4.5·CHAID 서술은 sklearn 문서와 Wikipedia 요약에 기댄다.
- 미확인: 이득비(gain ratio)의 정확한 식, CHAID 의 세부 병합 절차, 수험서별 용어 차이.

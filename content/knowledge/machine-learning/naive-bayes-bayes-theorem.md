---
title: 나이브 베이즈 (Naive Bayes)
aka: [Naive Bayes, Gaussian NB, Multinomial NB, Bernoulli NB, Complement NB, Laplace Smoothing, 라플라스 평활화, 단순 베이즈]
category: machine-learning
group: supervised
level: beginner
summary: 베이즈 정리에 "특성들이 클래스가 주어지면 서로 독립"이라는 단순 가정을 얹어 클래스별 사후확률을 곱으로 계산하는 분류기다. 빠르고 텍스트에 강하지만 확률 값 자체는 믿기 어렵다.
tags: [naive-bayes, bayes-theorem, conditional-independence, laplace-smoothing, text-classification, supervised]
related: [data-analytics/bayesian-inference-prior-posterior, machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/text-mining-tfidf-tokenization, data-analytics/imbalanced-data-resampling-smote]
sources:
  - https://scikit-learn.org/stable/modules/naive_bayes.html
  - https://scikit-learn.org/stable/modules/ensemble.html
updatedAt: 2026-11-23
---

## 개요

- 목표는 특성 x 가 주어졌을 때 클래스 y 의 사후확률 `P(y | x)` 를 구해 가장 큰 클래스를 고르는 것이다.
- 베이즈 정리로 `P(y | x) ∝ P(y)·P(x | y)` 로 바꾸고, 결합 확률 `P(x | y)` 를 "클래스가 주어지면 특성들은 서로 독립"이라는 가정(조건부 독립)으로 특성별 확률의 곱으로 쪼갠다. 이 가정이 "naive(순진한)"의 뜻이다.
- sklearn 문서가 쓰는 결정 규칙: `ŷ = argmax_y P(y) ∏ P(x_i | y)`. `P(y)` 는 훈련 집합에서 클래스의 상대 빈도.

## 시험 범위 대응

- 공식 출제범위에 "나이브 베이즈" 항목은 직접 없다. 관련: 빅데이터분석기사 3과목 > 분석기법 적용 > 고급 분석기법 > 베이지안 기법, ADsP 데이터분석 > 정형 데이터 마이닝 > 분류분석(분류 기법의 하나로 수험서에서 다루는 경우가 많음), ADP 실기 > 모델 구축(분류).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 사전확률 | prior, P(y) | 특성을 보기 전 클래스의 확률 (훈련 집합의 클래스 비율로 추정) |
| 가능도 | likelihood, P(x \| y) | 클래스가 y 일 때 특성 x 가 관측될 확률 |
| 사후확률 | posterior, P(y \| x) | 특성을 본 뒤 클래스의 확률 |
| 조건부 독립 | conditional independence | 클래스를 알면 한 특성이 다른 특성에 추가 정보를 주지 않는다는 가정 |
| 평활화 | smoothing | 관측 횟수 0 인 사건에 확률 0 이 배정되지 않도록 횟수에 상수를 더하는 일 |
| 라플라스 평활화 | Laplace smoothing | α=1 인 평활화. α<1 이면 Lidstone 평활화 (sklearn 문서) |

## 변형

| 클래스 (sklearn) | 특성 가정 | 어울리는 입력 |
| --- | --- | --- |
| `GaussianNB` | 클래스별 정규분포, 평균·분산을 최대가능도로 추정 | 연속형 |
| `MultinomialNB` | 다항분포, 평활화된 `θ_yi = (N_yi + α) / (N_y + α·n)` | 단어 빈도 등 횟수 |
| `BernoulliNB` | 이진(있다/없다). 특성이 **없는 경우도** 명시적으로 벌점에 반영 | 이진 단어 출현 |
| `ComplementNB` | 다항 NB 의 변형. 각 클래스의 **보완(그 클래스가 아닌 문서들)** 통계로 가중치를 만들고 "가장 안 맞는 보완"의 클래스를 고름 | 불균형 텍스트 |
| `CategoricalNB` | 특성마다 범주형 분포, `(N_tic + α) / (N_c + α·n_i)` | 범주형(0…n_i−1 로 인코딩) |

- `ComplementNB` 는 표준 다항 NB 가 불균형 데이터에 특히 적합하도록 고친 판본이라고 sklearn 문서가 설명한다.
- α 가 클수록 사전 영향이 커져 추정이 균등 분포 쪽으로 당겨진다(식에서 읽히는 성질).

## 라플라스 평활화가 필요한 이유

- 훈련에서 어떤 클래스에 특정 값이 한 번도 안 나오면 `P(x_i | y) = 0` 이고, 곱 전체가 0 이 되어 다른 특성이 아무리 강해도 그 클래스가 배제된다.
- 평활화는 모든 값의 횟수에 α 를 더해(분모에는 가능한 값 수 × α) 0 을 없앤다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1). 8행 범주형 데이터: 특성 (전망: 0=맑음/1=비, 바람: 0=약/1=강), 라벨 1=경기함.

| 클래스 | 행 (전망, 바람) |
| --- | --- |
| 0 (4행) | (0,1) (1,1) (1,1) (0,1) |
| 1 (4행) | (0,0) (1,0) (1,0) (0,0) |

질의: 전망=0, 바람=0, α=1 (라플라스).

- 클래스 1: `0.5 × (2+1)/(4+2) × (4+1)/(4+2) = 0.5 × 0.5 × 0.8333 = 0.20833`
- 클래스 0: `0.5 × (2+1)/(4+2) × (0+1)/(4+2) = 0.5 × 0.5 × 0.1667 = 0.04167`
- 정규화: 사후확률 클래스 1 = 0.20833 / (0.20833 + 0.04167) = **0.8333**
- sklearn `CategoricalNB(alpha=1, min_categories=2)` 의 `predict_proba` = [0.1667, 0.8333]. 손계산과 일치.
- 평활화를 거의 끈(α=1e-10) 경우 클래스 0 의 `바람=0` 항이 0 에 가까워 사후확률이 [0.00000000003, 1.0] 로 극단이 된다. 손계산·sklearn 모두 같은 결과.

**확률 보정이 나쁜 모습(필자 실험).** 클래스에 약하게 관련된 한 특성 f = y + 잡음(표준편차 1.5, n=2000, seed 0)을 만들고, 같은 특성을 5번 복제해 5개 특성으로 넣었다.

| 입력 | GaussianNB 정확도 | GaussianNB 로그 손실 | 로지스틱 회귀 로그 손실 | 평균 \|p − 0.5\| (NB / LR) |
| --- | --- | --- | --- | --- |
| 특성 1개 | 0.618 | 0.633 | 0.633 | 0.139 / 0.139 |
| 같은 특성 5개 복제 | 0.619 | 1.037 | 0.633 | 0.362 / 0.139 |

- 복제 특성은 새 정보가 없는데 독립 가정 때문에 같은 증거를 5번 곱한다. 분류 정확도는 거의 그대로지만 확률은 극단으로 치우쳐 로그 손실이 나빠졌다. 로지스틱 회귀는 영향이 없다.
- 극단적으로 상관된 특성을 일부러 만든 시연이다. 실제 데이터에서의 정도는 데이터에 따라 다르다.

```python
from sklearn.naive_bayes import CategoricalNB
m = CategoricalNB(alpha=1.0, min_categories=2).fit(X, y)
m.predict_proba([[0, 0]])   # [[0.1667, 0.8333]]
```

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 나이브 베이즈 vs 베이지안 추론 | 나이브 베이즈는 베이즈 정리로 분류하는 한 모형. 모수의 사전·사후분포를 다루는 일반 틀은 [베이지안 추론](/develop-wiki/knowledge/data-analytics/bayesian-inference-prior-posterior/) |
| 사전확률 vs 평활화 α | 사전확률 P(y) 는 클래스 비율, α 는 특성값 횟수에 더하는 값. 서로 다른 것 |
| 분류 정확도 vs 확률 품질 | 순위·분류는 괜찮아도 `predict_proba` 값은 보정이 나쁘다 |
| 다항 NB vs 베르누이 NB | 다항은 단어 **횟수**, 베르누이는 **출현 여부**이며 없는 단어도 계산에 들어간다 |

## 언제 쓰나 / 주의

- 쓰는 곳: 스팸 필터·문서 분류처럼 특성이 많고 훈련 데이터가 적을 때, 매우 빠른 기준선. sklearn 문서도 문서 분류와 스팸 필터링에서 잘 작동해 왔고 필요한 파라미터를 추정하는 데 적은 데이터로 충분하며 다른 방법보다 훨씬 빠를 수 있다고 쓴다.
- 문서의 경고: 좋은 분류기이지만 "나쁜 추정기"여서 `predict_proba` 확률을 심각하게 받아들이면 안 된다. 확률이 필요하면 보정(calibration)을 별도로 한다 → [분류 평가](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/)
- 독립 가정이 크게 깨지는(상관 높은) 특성은 제거하거나 합친다.
- `GaussianNB` 는 정규분포 가정이 안 맞는 특성(심한 치우침)에 약하다. 변환을 고려한다.
- 훈련에 없던 값은 평활화를 쓰지 않으면 확률 0 문제를 일으킨다.
- 텍스트에서 TF-IDF 를 입력으로 쓸 때의 처리는 [텍스트 마이닝](/develop-wiki/knowledge/machine-learning/text-mining-tfidf-tokenization/) 참고.

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드 "Naive Bayes" 절(정의, 결정 규칙, 다섯 변형의 식, 평활화, 강점·"bad estimator" 경고).
- 직접 계산: 8행 예의 손계산과 `CategoricalNB` 일치, 평활화 끈 경우, 복제 특성 실험(Python 3.15, scikit-learn 1.9.1, seed 0). 복제 실험의 수치는 seed·잡음 설정에 의존한다.
- 읽지 못한 것: 나이브 베이즈가 왜 분류에서 잘 작동하는지에 대한 이론적 분석 문헌, `ComplementNB` 원 논문.
- 미확인: `ComplementNB` 의 가중치 정규화 세부, 수험서가 쓰는 "나이브 베이즈 = 사전×가능도/증거" 표기와 sklearn 표기의 대응(수학적으로 같은 식임은 위 식으로 확인).

---
title: 앙상블 — 배깅·랜덤 포레스트·부스팅·보팅·스태킹
aka: [Ensemble Learning, Bagging, Random Forest, Voting, AdaBoost, Stacking, Out-of-Bag, 분석모형 융합, 모형 결합]
category: machine-learning
group: ensemble
level: intermediate
summary: 여러 모형의 예측을 합쳐 단일 모형보다 안정적이고 정확한 결과를 얻는 방법의 묶음이다. 배깅·랜덤 포레스트는 분산을, 부스팅은 편향을 줄이는 쪽이며, 보팅·스태킹은 서로 다른 모형을 결합한다.
tags: [ensemble, bagging, random-forest, oob, voting, adaboost, stacking, boosting, supervised]
related: [machine-learning/decision-tree-gini-entropy-pruning, machine-learning/gradient-boosting-xgboost-lightgbm, machine-learning/overfitting-bias-variance-regularization, machine-learning/data-split-cross-validation-leakage, machine-learning/model-interpretation-feature-importance-shap-pdp, machine-learning/lift-gain-chart-ks-model-comparison]
sources:
  - https://scikit-learn.org/stable/modules/ensemble.html
  - https://www.stat.berkeley.edu/~breiman/bagging.pdf
  - https://www.stat.berkeley.edu/~breiman/randomforest2001.pdf
updatedAt: 2026-11-23
---

## 개요

- 앙상블은 여러 기본 학습기(base estimator)를 만들고 예측을 합친다. 학습기들이 서로 다른 실수를 하면 합칠 때 일부가 상쇄된다(sklearn 문서의 설명).
- 합치는 방식이 둘로 갈린다. **병렬(독립)** 로 만들어 평균·투표하는 배깅·랜덤 포레스트, **순차(앞의 실수를 보정)** 로 만드는 부스팅. 서로 다른 종류의 모형을 합치는 보팅·스태킹은 별도 계열이다.
- 효과의 조건은 두 가지다: 개별 학습기가 무작위보다 충분히 낫고(성능), 학습기들 사이 오류가 서로 덜 닮았을 것(다양성).

## 시험 범위 대응

- 빅데이터분석기사 3과목 > 분석기법 적용 > 고급 분석기법 > 앙상블 분석, 4과목 > 분석모형 평가 및 개선 > 분석모형 융합, 실기 > 모형 평가 > 모형 결합, ADsP·ADP 정형 데이터 마이닝 > 분류분석.
- "분석모형 융합"은 공식 항목명이다. 이 노트에서는 모형을 결합해 성능·안정성을 높이는 일반 개념(앙상블 전반)으로 정리한다. 수험서가 이 용어를 어디까지 포괄하는지에 대한 공개 1차 출처는 확인하지 못했다(미확인).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 기본 학습기 | base estimator / weak learner | 앙상블을 이루는 개별 모형. 부스팅에서는 약한(단순한) 학습기 |
| 부트스트랩 | bootstrap | 훈련 집합에서 복원 추출로 같은 크기의 표본을 만드는 일 |
| 배깅 | bagging (bootstrap aggregating) | 부트스트랩 표본마다 학습기를 만들고 평균(회귀)·다수결(분류)로 합침 |
| 페이스팅 | pasting | 복원 없는 부분 표본으로 같은 일 |
| 랜덤 서브스페이스 / 패치 | random subspaces / patches | 특성의 부분집합 / 표본·특성 모두의 부분집합으로 학습기를 만듦 |
| 랜덤 포레스트 | random forest | 부트스트랩 + 분할마다 특성 일부만 무작위 후보로 쓰는 트리의 앙상블 |
| OOB(out-of-bag) | out-of-bag | 한 트리의 부트스트랩 표본에 뽑히지 않은 관측. 그 트리의 검증용으로 쓴다 |
| 하드 보팅 / 소프트 보팅 | hard / soft voting | 예측 라벨의 다수결 / 예측 확률의 (가중)평균의 argmax |
| 부스팅 | boosting | 학습기를 순차로 만들되 앞 학습기의 오류를 겨냥해 다음을 학습 |
| 스태킹 | stacking | 기본 학습기들의 예측을 입력으로 하는 메타 학습기(final estimator)를 학습 |

## 배깅과 랜덤 포레스트

**배깅(Breiman, 1996).** 훈련 집합의 부트스트랩 복제본으로 예측기를 여러 개 만들어 평균(수치) 또는 다수결(범주)로 합친다. Breiman 의 요지는 "핵심 요소는 예측 방법의 불안정성"이다. 훈련 집합을 조금 흔들었을 때 예측기가 크게 변한다면 배깅이 정확도를 높일 수 있다. 분산을 줄이는 방법이라 가지를 깊게 키운 트리처럼 복잡하고 분산이 큰 학습기에 맞고, 이미 안정적인 학습기에는 이득이 작다(sklearn 문서도 강하고 복잡한 기본 학습기에 맞는다고 설명).

**랜덤 포레스트(Breiman, 2001).** 트리마다 부트스트랩 표본을 쓰고, **각 분할에서 특성의 무작위 부분집합** 안에서만 최적 분할을 고른다. 논문 초록의 핵심 문장 두 가지:
- 포레스트의 일반화 오차는 트리 수가 늘면 어떤 한계로 수렴한다.
- 일반화 오차는 개별 트리의 강도(strength)와 트리들 사이의 상관(correlation)에 좌우된다.
→ 특성을 무작위로 제한하는 목적은 트리 간 상관을 낮추는 것이다. 논문은 이 방식의 오류율이 AdaBoost 와 견줄 만하고 잡음에는 더 강건하다고 보고했다.
- sklearn 문서: 분류는 `max_features="sqrt"`, 회귀는 `1.0`(전체)을 경험적으로 좋은 값으로 안내한다(실제 기본값도 분류 `"sqrt"`, 회귀 `1.0` 으로 API 에서 확인). 트리의 확률 예측을 평균하는 것이 Breiman 원래의 투표와 다르다.
- 표본·특성 두 가지 무작위성이 분산을 줄이는 대신 편향이 약간 늘 수 있다(문서). ExtraTrees 는 임계값까지 무작위로 뽑는다.

**OOB 오차.** 부트스트랩 표본에 한 관측이 들어갈 확률은 약 `1 − (1 − 1/n)^n → 1 − 1/e ≈ 63.2%`, 나머지 약 36.8% 가 그 트리의 OOB 다. 각 관측을 자기가 OOB 인 트리들로만 예측해 합치면 별도 검증 집합 없이 일반화 오차를 추정할 수 있다(`oob_score=True`). Breiman(2001)은 OOB 로 오차·강도·상관·변수 중요도를 추정한다.

## 보팅

| 방식 | 규칙 | 조건 |
| --- | --- | --- |
| 하드 | 개별 예측 라벨의 최빈값(동률은 정렬 순서상 앞 라벨) | 라벨만 있으면 됨 |
| 소프트 | 클래스 확률의 (가중) 평균의 argmax | 모든 모형이 `predict_proba` 지원 |
| 회귀 | 예측값의 평균 | — |

- 다수결이 이기는 조건의 산술: 정확도 p = 0.6 인 학습기를 **서로 독립**이라고 가정하면 다수결 정확도는 n=1 → 0.600, n=3 → 0.648, n=11 → 0.754, n=101 → 0.979(이항 분포 계산). 실제로는 같은 데이터로 학습해 오류가 상관되므로 이만큼 오르지 않는다. 다양성 없이는 이득이 없다.

## 부스팅(AdaBoost)

- sklearn 문서: 약한 학습기를 순차로 재가중 데이터에 적합한다. 처음 표본 가중치는 1/N, 오분류된 표본의 가중치는 올리고 맞힌 표본은 내려 다음 학습기가 어려운 사례에 집중한다. 최종 예측은 가중 다수결(분류) 또는 가중합(회귀). 기본 약한 학습기는 깊이 1 트리(stump)다.
- `AdaBoostClassifier` 는 SAMME(Zhu 외, 2009)를 구현하고 `learning_rate` 가 각 학습기 기여를 줄인다.
- 문서는 AdaBoost 를 Freund & Schapire(1995)의 것으로 인용하고, 널리 인용되는 JCSS 논문은 1997년판이다(원문 본문은 읽지 못했다). 정확한 가중치 갱신식은 이 노트에 싣지 않았다(미확인).
- 그래디언트 부스팅 계열(XGBoost 등)은 [그래디언트 부스팅](/develop-wiki/knowledge/machine-learning/gradient-boosting-xgboost-lightgbm/)에서 다룬다.

## 스태킹

- 기본 학습기들을 병렬로 적합하고, `final_estimator` 가 그 예측을 입력으로 학습한다(Wolpert, 1992 인용).
- sklearn 은 과대적합을 막으려 메타 학습기를 **교차 검증 방식의 표본 밖 예측**(`cross_val_predict`)으로 훈련한다. 같은 표본의 학습 예측을 그대로 쓰면 정보 누출이다 → [데이터 분할·교차 검증·누출](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)
- `stack_method='auto'` 는 `predict_proba` → `decision_function` → `predict` 순으로 쓴다. 층을 여러 개 쌓을 수도 있다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1). 데이터: `make_classification(600, 20, n_informative=5, n_redundant=3, flip_y=0.05, random_state=0)`. 5겹×3회 반복 층화 교차 검증 정확도(평균 ± 표준편차).

| 모형 | 정확도 |
| --- | --- |
| 단일 결정 트리(가지치기 없음) | 0.828 ± 0.029 |
| 배깅(트리 100개) | 0.882 ± 0.026 |
| 랜덤 포레스트(100) | 0.886 ± 0.027 |
| AdaBoost(stump 100) | 0.842 ± 0.037 |

- 랜덤 포레스트 `random_state` 4개(0~3)에서 평균 정확도 0.883~0.889 → 트리 무작위성에 따른 흔들림이 약 0.006. 위 비교는 이 데이터·설정의 결과로 일반 순위가 아니다. 특히 AdaBoost 는 stump 기본 설정이라 트리 깊이를 키우면 결과가 달라진다.
- OOB: 300 트리 `oob_score_` 0.897, 같은 설정 교차 검증 0.890. 가까운 값이다.
- 부트스트랩 고유 표본 비율을 n=1000 으로 200회 시뮬레이션: 0.633 (이론 0.632).

보팅·스태킹(같은 데이터): 로지스틱 회귀(표준화) 0.863, 가우시안 NB 0.848, k-NN(표준화) 0.849.

| 결합 | 정확도 |
| --- | --- |
| 하드 보팅 | 0.864 |
| 소프트 보팅 | 0.869 |
| 스태킹(메타 = 로지스틱) | 0.872 |

결합이 가장 좋은 개별 모형(0.863)보다 소폭 높다. 모형들이 비슷한 오류를 내면 이득이 작다는 점이 수치로 보인다. 이 차이는 표준편차(약 0.02~0.03)에 비해 작아 유의하다고 단정할 수 없다.

```python
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=300, oob_score=True, random_state=0).fit(X, y)
print(rf.oob_score_)
```

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 배깅 vs 부스팅 | 배깅은 독립·병렬로 분산을 줄이고, 부스팅은 순차로 앞 오류를 보정해 주로 편향을 줄인다(스태킹은 편향 감소로 서술, 문서) |
| 배깅 vs 랜덤 포레스트 | 랜덤 포레스트 = 배깅 + 분할마다 특성 무작위 제한 |
| 하드 vs 소프트 보팅 | 소프트는 확률을 쓰므로 확신도를 반영하지만 모든 모형에 확률이 있어야 한다 |
| 보팅 vs 스태킹 | 보팅은 고정 규칙으로 합치고, 스태킹은 합치는 법을 메타 학습기가 학습 |
| 앙상블 vs 분석모형 융합 | 공식 항목 "분석모형 융합"은 모형 결합을 가리키는 시험 용어. 이 노트에서는 앙상블과 같은 범주로 다룬다 |
| OOB 오차 vs 교차 검증 오차 | OOB 는 부트스트랩 구조로 공짜로 얻는 추정, 교차 검증은 별도 분할로 계산. 값이 비슷하지만 같은 것은 아니다 |

## 언제 쓰나 / 주의

- 쓰는 곳: 단일 트리가 불안정할 때(랜덤 포레스트), 표 형식 데이터의 강한 기본 모형, 서로 성격이 다른 모형을 합쳐 마지막 성능을 쥐어짤 때(스태킹).
- 비용: 학습·추론 시간과 메모리가 학습기 수에 비례하고, 단일 트리의 해석 가능성을 잃는다. 랜덤 포레스트의 불순도 기반 변수 중요도는 훈련 데이터로 계산되고 고유값이 많은 특성에 유리해 오도할 수 있다는 sklearn 경고가 있다 → [모델 해석](/develop-wiki/knowledge/machine-learning/model-interpretation-feature-importance-shap-pdp/)
- 다양성이 없으면 이득이 없다. 같은 알고리즘·같은 특성·같은 데이터로 만든 학습기의 합은 거의 단일 모형과 같다.
- 스태킹은 구조가 복잡하고 누출 위험이 있다. 교차 검증 안에 전체 파이프라인을 넣어 평가한다.
- 부스팅은 잡음 라벨에 민감할 수 있다(문서는 지수 손실 그래디언트 부스팅이 라벨 잡음에 덜 견고하다고 언급).
- 모형 결합의 성과 비교는 [리프트·이득·KS](/develop-wiki/knowledge/machine-learning/lift-gain-chart-ks-model-comparison/) 같은 지표로 한다.

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드 앙상블 절(배깅·랜덤 포레스트·보팅·스태킹·AdaBoost·그래디언트 부스팅 서술, 단 문서가 100,000자를 넘어 마지막 46자는 읽지 못함), Breiman(1996) 배깅 기술 보고서의 초록·서론(PDF 텍스트 직접 추출), Breiman(2001) 초록·OOB 서술(PDF 텍스트 직접 추출).
- 직접 계산: 이항 다수결 산술, 교차 검증 비교표, RF seed 4개, OOB, 부트스트랩 비율, 보팅·스태킹(Python 3.15, scikit-learn 1.9.1). 표는 데이터 seed 0 단일 데이터셋의 결과이고 RF 는 seed 의존(위 폭 참고).
- 읽지 못한 것: Freund & Schapire(1997, JCSS) 본문, Wolpert(1992) 원문, Breiman(1996) 본문 중 실험 절. 이들은 sklearn 문서 서술과 서지로만 참조했다.
- 미확인: AdaBoost 가중치 갱신식, "분석모형 융합"의 수험서 범위.

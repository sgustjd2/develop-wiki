---
title: 분석 모형 해석 — 변수 중요도·PDP·SHAP·LIME
aka: [Model Interpretation, Feature Importance, Permutation Importance, Partial Dependence Plot, PDP, ICE, SHAP, LIME, Shapley value, Interpretable ML]
category: machine-learning
group: operations
level: intermediate
summary: 모형이 왜 그렇게 예측하는지 읽는 방법을 내재적 해석(선형·트리)과 사후 해석(순열 중요도·PDP/ICE·SHAP·LIME)으로 나누고, 불순도 중요도의 편향과 PDP 의 가정 한계를 직접 계산으로 보인다.
tags: [interpretability, feature-importance, permutation-importance, pdp, ice, shap, lime, shapley, xai]
related: [machine-learning/ensemble-bagging-boosting-stacking, machine-learning/decision-tree-gini-entropy-pruning, machine-learning/model-deployment-monitoring-drift, machine-learning/overfitting-bias-variance-regularization, data-analytics/linear-regression-diagnostics-multicollinearity, machine-learning/classification-metrics-confusion-matrix-roc]
sources:
  - https://scikit-learn.org/stable/modules/permutation_importance.html
  - https://scikit-learn.org/stable/modules/partial_dependence.html
  - https://scikit-learn.org/stable/auto_examples/inspection/plot_permutation_importance.html
  - https://scikit-learn.org/stable/auto_examples/inspection/plot_linear_model_coefficient_interpretation.html
  - https://christophm.github.io/interpretable-ml-book/shapley.html
  - https://christophm.github.io/interpretable-ml-book/pdp.html
  - https://christophm.github.io/interpretable-ml-book/lime.html
  - https://arxiv.org/abs/1705.07874
  - https://arxiv.org/abs/1602.04938
updatedAt: 2026-11-23
---

## 개요

예측 성능이 좋아도 "왜"를 못 설명하면 검증·규제 대응·개선이 어렵다. 해석 방법은 크게 둘이다. **내재적 해석**은 모형 구조 자체가 읽힌다(선형 회귀 계수, 짧은 의사결정나무). **사후(post-hoc) 해석**은 이미 학습된 임의 모형을 바깥에서 들여다본다(순열 중요도, PDP·ICE, SHAP, LIME). 또 설명 범위가 **전역**(모형 전체)인지 **국소**(예측 하나)인지 구분해야 한다.

## 시험 범위 대응

빅데이터분석기사 4과목 "분석결과 해석 및 활용 → 해석(분석모형 해석, 비즈니스 기여도 평가)" 에 대응한다. 공식 출제범위는 항목명만 있고 세부 기법 목록은 없다(PDP·SHAP·LIME 은 이 노트 필자가 해석 방법으로 정리한 것).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 변수 중요도 | feature importance | 모형 예측에 변수가 기여하는 정도를 나타내는 수치. **정의가 방법마다 다르다** |
| 불순도 기반 중요도 | impurity-based (MDI) | 트리 분할에서 변수가 줄인 불순도의 합(평균). 학습 데이터 통계로 계산 |
| 순열 중요도 | permutation importance | 변수 하나를 섞었을 때 점수가 떨어진 정도 |
| 부분 의존도 | partial dependence (PDP) | 다른 변수를 평균내(주변화) 한 변수에 따른 평균 예측 곡선 |
| 개별 조건부 기대 | individual conditional expectation (ICE) | 표본마다 한 줄씩 그린 변수-예측 곡선. 평균하면 PDP |
| 샤플리 값 | Shapley value | 협력 게임 이론의 공정 분배. 변수 값이 예측을 평균에서 얼마나 움직였는지 |
| SHAP | SHapley Additive exPlanations | 샤플리 값에 기반한 가법적 변수 기여 설명(Lundberg & Lee 2017) |
| LIME | Local Interpretable Model-agnostic Explanations | 예측 주변에서 단순한 모형으로 근사해 설명(Ribeiro 등 2016) |
| 전역·국소 설명 | global / local explanation | 모형 전체의 경향 / 개별 예측의 이유 |
| 블랙박스 | black box | 내부를 직접 해석하기 어려운 모형 |

## 내재적 해석

- **선형 모형**: 계수 = 다른 변수를 고정했을 때의 효과. scikit-learn 예제가 지적하는 함정: (1) 계수는 변수의 단위에 의존하므로 표준편차를 곱하거나 표준화해 비교한다, (2) 상관이 큰 변수 쌍은 계수가 불안정하다(예제의 AGE·EXPERIENCE), (3) 부호가 단순 상관과 반대일 수 있다(조건부 vs 주변 효과), (4) 계수는 인과가 아니라 데이터상의 연관이다. → [회귀 진단·다중공선성](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/)
- **트리**: 규칙을 그대로 읽을 수 있다 → [의사결정나무](/develop-wiki/knowledge/machine-learning/decision-tree-gini-entropy-pruning/). 깊어지거나 앙상블이 되면 개별 규칙 해석이 어렵다 → [앙상블](/develop-wiki/knowledge/machine-learning/ensemble-bagging-boosting-stacking/).

## 변수 중요도의 종류

| 방법 | 계산 | 주의 |
| --- | --- | --- |
| 불순도 기반(MDI) | 학습 시 분할 통계 | 고유값이 많은 변수(보통 수치형)에 **강하게 치우침**. 과대적합 모형이면 예측력 없는 변수도 높게 나옴 |
| 순열 중요도 | `i_j = s − (1/K) Σ s_(k,j)` (s: 기준 점수, s_(k,j): 변수 j 를 k 번째 섞은 점수) | 모형·점수 지표에 의존. 상관 변수는 서로 대신해 **둘 다 과소평가**됨 |
| 계수 크기(표준화 후) | 선형 모형 | 선형·가법 가정 안에서만 |

- 순열 중요도는 Breiman(2001, *Random Forests*)을 scikit-learn 문서가 참고문헌으로 든다. 임의 모형·임의 지표에 쓰고 **검증(테스트) 데이터**로 계산하면 일반화에 중요한 변수를 보여 준다. 학습 데이터에서만 중요한 변수는 과대적합 신호일 수 있다.
- 중요도는 "변수 자체"가 아니라 "그 모형이 쓰는 정도"다. 모형 성능이 낮으면 해석도 의미가 약하다.
- 상관 변수가 있으면 군집으로 묶어 대표 하나를 쓰는 방법이 문서에 제안된다.

## PDP 와 ICE

- PDP: `pd(x_S) = E_(X_C)[f(x_S, X_C)]`, 표본으로는 `(1/n) Σ f(x_S, x_C^(i))`. ICE 는 그 표본별 곡선이고 **PDP = ICE 의 평균**(scikit-learn 문서). PDP 개념은 Friedman(2001)에서 비롯되는 것으로 알려져 있으나 원문을 확인하지는 않았다.
- 가정: 관심 변수가 나머지 변수와 독립. 상관이 크면 비현실적 조합(키는 큰데 몸무게는 작은 표본)을 평균에 넣게 된다. 교호작용이 있으면 상반된 효과가 평균에서 상쇄돼 평평한 PDP 가 나올 수 있다 → ICE 로 확인.
- 시각화는 보통 1~2 변수까지. 분포가 얇은 구간은 과해석하지 않도록 rug·히스토그램을 함께 본다(Molnar).

## SHAP 와 LIME

**샤플리 값**(Molnar 해설). 변수 j 의 값 `φ_j = Σ_S [|S|!(p−|S|−1)!/p!] (val(S∪{j}) − val(S))`. 네 성질: 효율성(기여의 합 = 예측 − 평균 예측), 대칭성, 더미(영향 없는 변수는 0), 가법성. 정확 계산은 변수 수에 지수적이어서 근사(몬테카를로 등)를 쓴다.

**SHAP**(Lundberg & Lee 2017): 가법적 변수 기여 측도의 한 부류를 정의하고 그 안에서 바람직한 성질을 만족하는 해가 유일함을 보이며, 기존 설명 방법 여섯 개를 이 틀로 통합한다고 초록에 쓴다. 계산 효율 개선 방법(예: 트리 전용 알고리즘)은 이 노트에서 읽지 않았다.

**LIME**(Ribeiro 등 2016): 예측 하나 주변을 교란해 표본을 만들고 근접도 가중으로 단순 모형(희소 선형 등)을 맞춰 설명한다. 한계(Molnar): 이웃 크기(커널 폭) 선택이 어렵고, 비슷한 점의 설명이 크게 다를 수 있으며, 표본 추출이 변수 상관을 무시해 비현실적 표본을 만든다.

shap·lime 패키지는 이 환경에 없어 **실행하지 않았다**. 아래 샤플리 계산은 정의 식을 직접 구현한 것이다.

## "해석"과 "비즈니스 기여도 평가"의 구분

공식 범위에는 두 항목이 나란히 있으나 정의는 공개 1차 출처에서 확인하지 못했다. 필자의 구분(수험 교재의 정의와 다를 수 있음):

| 구분 | 묻는 것 | 예 |
| --- | --- | --- |
| 모형 해석 | 모형이 **무엇을 근거로** 예측하나 | 변수 중요도, PDP, SHAP |
| 비즈니스 기여도 | 모형을 **적용했을 때** 목표 지표가 얼마나 나아지나 | 이탈 방지 비용 대비 효과, A/B 시험 결과, 모형 도입 전후 비교 |

모형 해석이 "중요 변수"라고 말해도 그 변수를 바꾸면 결과가 변한다는 **인과** 주장은 아니다. 인과·효과는 실험이나 인과 추론이 필요하다.

## 직접 계산

Python 3.15, scikit-learn 1.9.1, numpy 2.5.5 (seed 고정, 값은 seed·표본 의존).

- **MDI 편향**: 합성 분류 데이터(N=1,000; x1 연속 유효, x2 이진 유효, noise 연속 무관). 랜덤 포레스트 학습 정확도 1.0, 테스트 0.788. MDI: x1 0.505, x2 0.210, noise **0.285**(이진인 유효 변수 x2 보다 큼). 테스트 순열 중요도(30회): x1 0.161±0.029, x2 0.152±0.025, noise 0.013±0.016. **학습 데이터**로 계산하면 noise 도 0.181 로 커진다(과대적합 신호). 손으로 구현한 순열(x1, 30회) 0.155 가 `permutation_importance` 0.161 과 근접(섞는 난수가 달라 같은 값은 아님).
- **PDP·ICE**: 교호작용이 있는 데이터(y ≈ 2·x0·[x1>0]) 로 그래디언트 부스팅 학습. `partial_dependence` 값과 직접 평균낸 값이 소수 셋째 자리까지 일치하고 PDP = ICE 평균(`np.allclose` True). x0 를 −1.5→1.5 로 올릴 때 ICE 증가량은 x1>0 인 표본에서 평균 7.13, x1≤0 에서 0.01, PDP 는 3.87. 평균 하나가 두 집단의 상반된 반응을 가린다(절대 수치는 모형 적합 오차를 포함).
- **샤플리 값**: 선형 모형 `f = 2x1 − x2 + 4x3`, 배경 500 표본, 설명 대상 x=(1, 3, 2). 정의 식을 모든 부분집합에 대해 합산한 값(2.0319, −1.9759, −4.1137)이 `계수 × (x − 평균)` 과 일치하고, 합(−4.0577)이 `f(x) − 평균 예측` 과 같다(효율성 확인). 선형 모형·주변 평균 가치함수에서만 이 닫힌 형태가 성립.

## 언제 쓰나 / 주의

- 모형 점검(누수 변수 발견), 이해관계자 설명, 규제 대응, 변수 선택 힌트.
- 중요도 순위를 변수 선택 근거로 쓸 때는 **검증 데이터**로 계산하고 여러 방법을 비교한다. 불순도 중요도만 믿지 않는다.
- 상관이 큰 변수 묶음에서는 어느 방법이든 개별 변수 해석이 불안정하다.
- 사후 설명은 모형의 **근사 설명**이다. 설명이 그럴듯해도 모형의 실제 계산과 같다는 보장은 없다. LIME 은 반복 실행 시 값이 달라질 수 있다.
- 중요도·PDP 는 인과 효과가 아니다. 개인정보·공정성 이슈가 있는 변수는 해석 결과로 공정성을 보증하지 못한다.
- 운영 중 성능·분포 변화는 [모형 모니터링](/develop-wiki/knowledge/machine-learning/model-deployment-monitoring-drift/) 에서 다룬다.

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드(순열 중요도, PDP·ICE), 예제 2건(순열 중요도 비교, 선형 모형 계수 해석; 페이지가 길어 앞부분만), Molnar *Interpretable Machine Learning* 의 샤플리·PDP·LIME 장, arXiv 초록(SHAP, LIME).
- 읽지 못함: Breiman 2001, Friedman 2001, Lundberg & Lee·Ribeiro 본문, Molnar 의 SHAP 장·ICE 장. SHAP 의 구체 알고리즘(Kernel/Tree SHAP) 은 미확인.
- "비즈니스 기여도 평가"의 공식 정의, 수험 교재식 분류는 미확인.
- 실행: sklearn 순열 중요도·PDP, 샤플리 정의의 직접 구현. 실행 안 함: shap, lime 패키지.

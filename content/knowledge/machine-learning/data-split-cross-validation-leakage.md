---
title: 데이터 분할·교차검증·데이터 누수 (Train/Validation/Test, Cross-validation, Leakage)
aka: [Train/Validation/Test Split, Holdout, k-fold CV, Stratified, GroupKFold, TimeSeriesSplit, Nested CV, Data Leakage, 데이터 분할, 교차 검증]
category: machine-learning
group: paradigm
level: intermediate
summary: 학습·검증·테스트 분할과 k-겹·층화·그룹·시계열 교차검증, 중첩 교차검증의 쓰임, 전처리·그룹·시간·타깃 누수가 점수를 얼마나 부풀리는지 계산으로 보인다.
tags: [cross-validation, holdout, leakage, nested-cv, groupkfold, timeseriessplit, sklearn]
related: [machine-learning/hyperparameter-tuning-search, machine-learning/overfitting-bias-variance-regularization, machine-learning/classification-metrics-confusion-matrix-roc, data-analytics/imbalanced-data-resampling-smote, data-analytics/feature-selection-dimensionality-reduction, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/time-series-stationarity-arima]
sources:
  - https://scikit-learn.org/stable/modules/cross_validation.html
  - https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html
  - https://scikit-learn.org/stable/modules/grid_search.html
  - https://www.jmlr.org/papers/v11/cawley10a.html
  - https://d2l.ai/chapter_linear-regression/generalization.html
updatedAt: 2026-11-23
---

## 개요

- 모델이 **본 적 없는 데이터**에서 얼마나 맞히는지(일반화 성능)를 재려면, 학습에 쓰지 않은 데이터로 평가해야 한다. 학습 데이터로 평가하면 외워도 만점이 나온다(sklearn 문서의 "방법론적 실수").
- 분할 방식은 세 가지 질문으로 정한다. (1) 튜닝도 하는가(검증 세트 필요)? (2) 데이터가 적은가(교차검증)? (3) 표본이 독립인가(그룹·시간 구조)?
- **누수(leakage)**는 평가 데이터의 정보가 학습 과정에 새어 들어가는 것이다. 점수는 오르지만 현실 성능은 오르지 않는다.

## 시험 범위 대응

- 빅데이터분석기사 3과목 "분석모형 설계 > 분석 환경 구축 > 데이터 분할", 4과목 "분석모형 평가 및 개선 > 교차 검증".
- ADP 실기의 "모델 평가·선택". ADsP 필기 항목에는 직접 항목 없음(분류분석의 모형 평가와 인접).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 훈련(학습) 세트 | training set | 모델 매개변수를 맞추는 데이터 |
| 검증 세트 | validation set | 하이퍼파라미터·모델 선택에 쓰는 데이터 |
| 테스트 세트 | test set | 최종 성능 보고에만 쓰는 데이터. 선택에 쓰지 않는다 |
| 홀드아웃 | holdout | 데이터를 한 번 나눠 한쪽을 평가에 쓰는 방식 |
| k-겹 교차검증 | k-fold CV | k 개 폴드로 나눠 k 번 학습·검증하고 점수를 평균 |
| 층화 | stratified | 폴드마다 클래스 비율을 유지 |
| 그룹 분할 | group split | 같은 그룹(환자·사용자)을 훈련·검증에 나눠 넣지 않는다 |
| 중첩 교차검증 | nested CV | 안쪽 루프로 튜닝, 바깥 루프로 성능 추정 |
| 데이터 누수 | data leakage | 평가 시점에는 알 수 없는 정보가 학습에 쓰이는 것 |

## 분할 방식

| 방식 | 절차 | 쓸 때 | 주의 |
| --- | --- | --- | --- |
| 홀드아웃 (훈련/테스트) | 한 번 분할(`train_test_split` 은 기본 셔플) | 데이터 많음, 튜닝 없음 | 분할 운에 따라 점수가 흔들림 |
| 훈련/검증/테스트 | 검증으로 튜닝, 테스트는 마지막 1회 | 튜닝 있음, 데이터 충분 | 학습 데이터가 줄어듦(sklearn 문서) |
| k-겹 CV | 폴드 k 개, 각 폴드가 한 번씩 검증 | 데이터 적음 | 비용 k 배. 정수 `cv` 면 분류기는 자동으로 층화 |
| 층화 k-겹 | 폴드별 클래스 비율 유지 | 불균형·희귀 클래스 | 폴드가 균질해져 점수 분산이 작게 보일 수 있음(문서) |
| 그룹 k-겹 | 그룹 단위로 폴드 배정 | 사람·기기당 표본 여러 개 | 층화와 같이 쓰려면 `StratifiedGroupKFold`(분할 불균형 가능) |
| 시계열 분할 | 과거로 학습, 바로 뒤를 검증 | 시간 순서 데이터 | 미래로 학습 금지. 학습 세트가 계속 커짐 |
| LOO(하나 남기기) | n 개 폴드 | 극소량 | sklearn 은 분산이 크고 k-겹(5·10)이 보통 낫다고 안내 |

- sklearn 정수 `cv` 는 셔플 없이 순서대로 나눈다. 클래스별로 정렬된 데이터면 셔플이 필요하고, 시간 순서 데이터는 셔플이 점수를 부풀린다(문서).
- `cross_val_predict` 의 폴드 밖 예측은 시각화·블렌딩용이며 일반화 오차의 올바른 측정이 아니다(문서).
- 세트 비율(예: 6:2:2, 7:3)에 표준은 없다. 데이터 양과 목적으로 정하며 이 노트는 특정 비율을 권하지 않는다.

```python
from sklearn.model_selection import GroupKFold, TimeSeriesSplit, cross_val_score
cross_val_score(model, X, y, cv=GroupKFold(5), groups=subject_id)  # 같은 사람은 한쪽에만
cross_val_score(model, X, y, cv=TimeSeriesSplit(5))                # [0..k] 학습 → [k+1] 검증
```

## 중첩 교차검증 (Cawley & Talbot 2010)

- 같은 CV 점수로 하이퍼파라미터를 고르고 그 점수를 성능으로 보고하면 **낙관적으로 편향**된다. Cawley & Talbot(JMLR 11, 2010)은 모델 선택 기준의 분산이 작은 것이 편향 없음만큼 중요하며, 선택 과정의 과대적합이 알고리즘 간 차이만큼 큰 성능 저하를 낼 수 있다고 보고한다.
- 절차: 안쪽 루프(`GridSearchCV`)에서 튜닝, 바깥 루프(`cross_val_score`)에서 "튜닝 과정까지 포함한 모델"의 일반화 오차를 추정(sklearn 예제 설명).

```python
inner = GridSearchCV(svc, param_grid, cv=inner_cv)
nested = cross_val_score(inner, X, y, cv=outer_cv)   # 이것이 보고할 성능
```

- 효과 크기는 데이터 크기와 모델 안정성에 따른다(sklearn 예제). 같은 예제는 iris 에서 차이가 평균 0.0076 으로 작았다고 보여 준다.
- 최종 배포용 모델은 중첩 CV 가 끝난 뒤 전체 훈련 데이터로 다시 튜닝·학습한다(필자 정리).

## 누수 유형

| 유형 | 무엇이 새나 | 예 |
| --- | --- | --- |
| 전처리 누수 | 평가 폴드의 통계(평균·분산·상위 변수) | 전체로 표준화·결측 대체·변수 선택 후 CV |
| 타깃 누수 | 예측 시점에 없는 정보, 타깃에서 파생된 변수 | 결과 후에 기록되는 열, 타깃을 가공한 열 |
| 시간 누수 | 미래 정보 | 셔플 CV 로 시계열 평가, 미래 값으로 만든 파생변수 |
| 그룹 누수 | 같은 개체의 다른 표본 | 한 환자의 표본이 훈련·검증에 모두 |
| 리샘플링 누수 | 복제·합성 표본이 검증에 포함 | 분할 전 오버샘플링([불균형 노트](/develop-wiki/knowledge/data-analytics/imbalanced-data-resampling-smote/)) |
| 튜닝 누수 | 테스트 세트로 선택 | 테스트 점수 보고 모델 바꾸기 (d2l: 하이퍼파라미터 선택이 끝나기 전엔 테스트 세트를 건드리지 않는다) |

sklearn 문서의 권고: 표준화·변수 선택 같은 전처리는 **훈련 데이터로만 fit**하고 검증·테스트에는 transform 만 한다. `Pipeline` 으로 묶으면 CV 폴드마다 올바르게 처리된다.

## 직접 계산 (Python 3.15, scikit-learn 1.9.1, seed 고정)

1. **변수 선택 누수.** 순수 잡음(60×1000, 무작위 이진 레이블)에서 `SelectKBest(k=10)` 를 전체에 먼저 적용 후 5-겹 CV 정확도 0.80 / 0.78 / 0.93, 파이프라인 안에서 선택하면 0.48 / 0.55 / 0.65 (seed 0·1·2). 신호가 없는데도 0.8~0.9 가 나온다.
2. **그룹 누수.** 60 명 × 10 표본, 사람마다 고유 오프셋이 있고 레이블은 사람 단위로 무작위. 랜덤 포레스트 정확도(seed 0 한 건): 셔플 KFold 0.962, `GroupKFold` 0.580. 새로운 사람에게는 사실상 일반화하지 못하는데, 같은 사람 표본이 양쪽에 있어 외운 값이 높게 나온 것이다.
3. **시간 누수.** 추세 있는 랜덤워크의 다음 값 예측(랜덤 포레스트, 직전 3개 값 입력). R²: 셔플 KFold 0.969, `TimeSeriesSplit` 0.684. 차이의 일부는 트리가 추세 밖 값을 외삽하지 못하는 데서 온다(분해해서 확인하지는 않았다).
4. **타깃 누수.** 타깃에 작은 잡음을 더한 열을 특성에 추가: 로지스틱 정확도 0.754 → 1.000.
5. **표준화 누수는 작다.** 유방암 데이터(`load_breast_cancer`)·SVC 5-겹: 전체 표준화 0.9754, 파이프라인 0.9771. 평균·분산 정도의 누수는 영향이 작을 수 있지만, 안 일어나게 하는 비용이 거의 없으므로 파이프라인을 쓴다.
6. **중첩 CV.** 레이블이 무작위인 50×20 데이터 5 개에서 SVC 그리드(C 13 × gamma 11) 선택. 그리드의 `best_score_` 평균 0.628, 중첩 CV 평균 0.540(진짜 정확도는 0.5 근처). 바깥에서 재지 않은 점수가 부풀려졌다. 데이터 5 개짜리 실험이라 값 자체는 우연 변동이 크다.

## 언제 쓰나 / 주의

- 튜닝 없는 최종 평가: 훈련/테스트 + 필요 시 CV. 튜닝 있음: 훈련/검증/테스트 또는 CV 내 튜닝 + 별도 테스트. 모델 *절차* 비교: 중첩 CV([튜닝](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)).
- 데이터 구조를 먼저 묻는다: 한 개체에 표본이 여러 개? 시간 순서? 그렇다면 무작위 분할은 부적절하다.
- 층화는 평가의 안정성을 올리지만 불확실성을 숨길 수 있다(sklearn 문서). 반복 CV 로 변동을 같이 본다.
- 테스트 세트는 한 번만 본다. 여러 번 보고 고치면 그 순간부터 검증 세트다.
- 점수가 "너무 좋으면" 먼저 누수를 의심한다. 특성 중요도 1위가 타깃과 거의 같은지 본다([해석](/develop-wiki/knowledge/machine-learning/model-interpretation-feature-importance-shap-pdp/)).
- 과대적합 진단은 [편향-분산·규제](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/), 지표는 [분류 평가 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/).

## 검증 범위

- 읽음: sklearn 교차검증 사용자 가이드, 중첩 CV 예제, 그리드 탐색 가이드, Cawley & Talbot JMLR 초록 페이지(논문 본문은 읽지 않음), d2l 일반화 절.
- 위 결과는 모두 직접 실행한 값이며 seed 고정. 그룹·시간 실험은 장난감 합성 데이터다.
- 미확인: 훈련/검증/테스트 권장 비율의 출처, 시계열 CV 의 gap·최대 훈련 크기 옵션 사용법, 층화 그룹 분할의 세부 동작.

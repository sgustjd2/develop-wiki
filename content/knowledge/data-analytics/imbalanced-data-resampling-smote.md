---
title: 불균형 데이터 처리와 SMOTE (Imbalanced Data, Resampling)
aka: [Class Imbalance, Resampling, Undersampling, Oversampling, SMOTE, Class Weight, Threshold Moving, 불균형 데이터]
category: data-analytics
group: preprocessing
level: intermediate
summary: 소수 클래스가 드물면 정확도가 착시를 만든다. 언더·오버샘플링, SMOTE, 클래스 가중치, 임계값 조정의 차이와 리샘플링을 학습 데이터에만 적용해야 하는 이유를 계산으로 보인다.
tags: [imbalance, smote, oversampling, class-weight, threshold, leakage, metrics]
related: [machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/data-split-cross-validation-leakage, machine-learning/knn-distance-based-classification, data-analytics/outlier-detection-methods, data-analytics/scaling-encoding-transformation-derived-features, machine-learning/hyperparameter-tuning-search]
sources:
  - https://www.jair.org/index.php/jair/article/view/10302
  - https://imbalanced-learn.org/stable/over_sampling.html
  - https://imbalanced-learn.org/stable/references/generated/imblearn.over_sampling.SMOTE.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.utils.class_weight.compute_class_weight.html
  - https://scikit-learn.org/stable/modules/classification_threshold.html
  - https://scikit-learn.org/stable/modules/model_evaluation.html
updatedAt: 2026-11-23
---

## 개요

- 사기 탐지·불량 검출·희귀 질환처럼 관심 클래스(양성)가 전체의 몇 % 이하인 데이터를 **불균형 데이터**라 한다.
- 문제는 두 겹이다. (1) 평가: 다수 클래스만 찍어도 정확도가 높아 보인다. (2) 학습: 손실이 다수 클래스에 지배돼 소수 클래스를 놓치는 쪽으로 학습된다.
- 대응은 세 층위다: **데이터**(리샘플링), **학습**(클래스 가중치), **결정**(임계값 조정). 그리고 무엇을 쓰든 **평가 지표를 먼저 바꾼다**.

## 시험 범위 대응

- 빅데이터분석기사 2과목 "분석 변수 처리 > 불균형 데이터 처리".
- ADsP·ADP 필기 출제범위에는 직접 항목 없음(관련: 분류분석 평가 지표).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 다수/소수 클래스 | majority / minority class | 표본이 많은 쪽 / 적은 쪽 |
| 언더샘플링 | undersampling | 다수 클래스 표본을 덜어 낸다 |
| 오버샘플링 | oversampling | 소수 클래스 표본을 늘린다 |
| 무작위 오버샘플링 | random oversampling | 소수 표본을 복원추출로 복제한다 |
| SMOTE | Synthetic Minority Over-sampling Technique | 소수 표본과 그 이웃 사이를 보간해 합성 표본을 만든다 |
| 클래스 가중치 | class weight | 클래스별 손실 가중치를 달리한다(데이터는 그대로) |
| 임계값 이동 | threshold moving | 확률을 클래스로 바꾸는 기준(기본 0.5)을 옮긴다 |

## 평가 지표부터

- 양성 1% 데이터에서 항상 "음성"을 내는 분류기: 정확도 0.99, 재현율 0, 균형 정확도 0.5(직접 계산).
- 균형 정확도(balanced accuracy) = 클래스별 재현율의 평균. sklearn 문서는 불균형 데이터에서 점수가 부풀려지는 것을 피한다고 설명한다. 이진이면 ½(TP/(TP+FN) + TN/(TN+FP)).
- 정밀도·재현율·F1, PR 곡선·평균정밀도(AP). AP 는 무작위 예측일 때 값이 **양성 비율**과 같아서 불균형일수록 기준선이 낮다(sklearn 문서). 지표 정의는 [분류 평가 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/).
- 리샘플링한 데이터에서 잰 지표는 현실 분포의 성능이 아니다. 평가는 **원래 분포의 테스트 데이터**로 한다.

## 방법

### 1. 언더샘플링 / 무작위 오버샘플링
- 언더: 빠르지만 다수 클래스 정보를 버린다. 오버(복제): 정보는 보존하지만 같은 표본이 반복돼 과대적합하기 쉽다.

### 2. SMOTE (Chawla, Bowyer, Hall, Kegelmeyer, JAIR 16, 2002)
- 소수 클래스 표본을 **복제하지 않고 새로 합성**한다. 소수 표본 하나와 같은 클래스의 k 최근접 이웃 하나를 고르고, 둘을 잇는 선분 위의 점을 새 표본으로 삼는다(imbalanced-learn 문서: "표본과 그 k 최근접 이웃 사이 보간").
- imbalanced-learn 문서 2.2절의 식은 `x_new = x_i + λ(x_zi − x_i)`, λ 는 [0, 1] 범위 난수. 구현 기본 k = 5(imbalanced-learn `SMOTE.k_neighbors`).
- 원 논문 초록: 소수 클래스 오버샘플링을 다수 클래스 언더샘플링과 결합했고, C4.5·Ripper·나이브 베이즈에서 ROC 기준으로 언더샘플링 단독보다 좋았다고 보고한다.
- 변형(imbalanced-learn 문서): SMOTENC(연속+범주 혼합), Borderline-SMOTE(경계 표본만 사용), ADASYN(오분류되는 점 근처에 더 합성).
- 한계(같은 문서): SMOTE 가 이상치와 정상치를 잇는 보간을 만들 수 있어 결정 경계가 나빠질 수 있다. 잡음 표본에도 민감할 것이다(필자 추론, 문서 문장은 아님). 거리 기반이라 변수 척도를 먼저 맞춰야 한다(필자 추론, 거리 계산 방식에서 비롯).

```python
# imbalanced-learn 이 설치돼 있다면(이 노트에서는 미설치라 실행하지 않음)
from imblearn.pipeline import make_pipeline   # sklearn Pipeline 아님에 주의
from imblearn.over_sampling import SMOTE
pipe = make_pipeline(SMOTE(k_neighbors=5, random_state=0), LogisticRegression())
```

### 3. 클래스 가중치
- sklearn `class_weight='balanced'` 의 가중치: `n_samples / (n_classes × 클래스별 개수)`. 문서 예 y=[1,1,1,1,0,0] → 클래스 0: 1.5, 클래스 1: 0.75.
- 990:10 데이터 → 다수 0.505, 소수 50(직접 계산). 소수 표본 하나의 손실이 99배 크게 반영된다.
- 데이터를 늘리지 않으므로 복제 과대적합이 없고 파이프라인 누수 걱정도 적다.

### 4. 임계값 조정
- `predict` 는 확률 0.5 기준(결정 함수 0 기준)이다. 문서는 이 고정 기준이 대부분의 용도에 이상적이지 않다고 한다.
- `TunedThresholdClassifierCV` 는 교차검증으로 기준을 골라 지정한 지표를 최대화한다(기본 scoring 은 균형 정확도). **확률 출력과 ROC/PR 곡선은 그대로**이고 레이블만 바뀐다.
- 훈련에 쓴 데이터로 임계값을 `prefit` 방식으로 튜닝하지 말라는 경고가 문서에 있다.

## 리샘플링은 학습 데이터에만

- 검증·테스트 폴드에 합성·복제 표본이 섞이면 같은(혹은 거의 같은) 표본이 학습과 평가에 동시에 들어가 점수가 부풀려진다.
- 올바른 순서: 먼저 분할 → 학습 분할에만 리샘플링 → 원래 분포 그대로의 검증·테스트로 평가. 교차검증이면 폴드마다 학습 부분에만 적용한다(imbalanced-learn 의 파이프라인 사용).
- 일반적 누수 유형: [데이터 분할·교차검증·누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/).

## 직접 계산 (Python 3.15, scikit-learn 1.9.1, seed 고정)

데이터: `make_classification(n_samples=5000, weights=[0.97,0.03], class_sep=0.8)`, 층화 70/30 분할(테스트 양성 비율 0.034), 로지스틱 회귀. SMOTE 는 imbalanced-learn 이 없어 위 식대로 직접 구현했다(k=5, 학습 분할의 양성만 사용, 학습 양성 118 → 다수와 같은 수).

| 방법 | 정확도 | 균형 정확도 | 재현율 | 정밀도 | AP |
| --- | --- | --- | --- | --- | --- |
| 기본 | 0.966 | 0.500 | 0.000 | 0.000 | 0.242 |
| class_weight=balanced | 0.672 | 0.669 | 0.667 | 0.067 | 0.119 |
| 무작위 오버샘플링 | 0.677 | 0.663 | 0.647 | 0.066 | 0.116 |
| 무작위 언더샘플링 | 0.697 | 0.644 | 0.588 | 0.065 | 0.106 |
| SMOTE(직접 구현) | 0.679 | 0.683 | 0.686 | 0.070 | 0.112 |
| 임계값 조정(기본 모델, 기준 0.071) | 0.889 | 0.659 | 0.412 | 0.134 | — |

- 기본 모델은 정확도 0.966 이지만 양성을 하나도 못 찾았다(착시).
- 가중치·리샘플링은 재현율을 올리는 대신 정밀도가 크게 낮다(0.07). 이 데이터는 클래스가 많이 겹쳐서이며, 방법 간 차이는 한 번의 seed 결과라 우열의 근거가 아니다.
- AP 가 기본 모델에서 더 높게 나온 점에 유의: 가중·리샘플링은 모델 자체(확률 순위)를 바꾸지만 임계값 조정은 순위를 바꾸지 않는다.

**누수 실험.** 순수 잡음(양성 30 / 음성 570)에서 랜덤 포레스트 재현율을 5-겹으로 측정. 소수 표본을 분할 **전에** 570 개로 복제하면 재현율 1.000, 폴드 안에서 학습 부분만 복제하면 0.000. 신호가 없는데 1.0 이 나온 것은 복제본이 검증 폴드에 들어간 탓이다.

## 언제 쓰나 / 주의

- 순서 제안(원문 권고 아님): 지표 교체 → 클래스 가중치/임계값 조정(간단·누수 적음) → 부족하면 리샘플링.
- 확률 값을 그대로 쓰는 용도(위험 점수, 보정된 확률)에서는 가중·리샘플링이 확률을 왜곡한다. 필요하면 별도 보정이 필요하다(보정 방법은 이 노트 범위 밖, 미확인).
- 이상 탐지처럼 양성이 극단적으로 드물면 분류 대신 [이상값 탐지](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/) 접근이 나을 수 있다.
- 거리 기반 모델([KNN](/develop-wiki/knowledge/machine-learning/knn-distance-based-classification/))과 SMOTE 는 척도에 민감하다.
- 리샘플링 비율·k 도 하이퍼파라미터이므로 [튜닝](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/) 시 폴드 안에서 처리한다.

## 검증 범위

- 읽음: SMOTE JAIR 초록 페이지(서지·초록), imbalanced-learn 과표본화 사용자 가이드·`SMOTE` API 페이지, sklearn `compute_class_weight`·임계값 조정·모델 평가 문서.
- **SMOTE 원 논문 본문은 읽지 못했다**(PDF 추출 불가). 보간식·k=5 는 imbalanced-learn 문서의 설명과 기본값에 근거하고, 원 논문의 증폭 비율 표기·범주형 처리 방식은 미확인.
- 실행: 위 표(직접 구현 SMOTE 포함)와 누수 실험. imbalanced-learn 라이브러리, 비용 민감 학습의 다른 변형, 확률 보정은 실행하지 않았다.

---
title: 분류 평가 지표 — 혼동행렬·정밀도·재현율·F1·ROC·AUC
aka: [Confusion Matrix, Precision, Recall, Sensitivity, Specificity, F1, MCC, ROC, AUC, PR curve, 분류 성능 평가]
category: machine-learning
group: evaluation
level: intermediate
summary: 혼동행렬에서 정확도·정밀도·재현율(민감도)·특이도·F1·MCC 를 유도하고, 임계값을 움직여 그리는 ROC·AUC 와 PR 곡선, 다중 분류 평균(micro·macro·weighted)을 직접 계산한 값으로 구분한다.
tags: [classification, metrics, confusion-matrix, roc, auc, precision, recall, f1, evaluation]
related: [machine-learning/regression-metrics-rmse-mae-r2, machine-learning/lift-gain-chart-ks-model-comparison, machine-learning/cluster-validation-silhouette-elbow, machine-learning/data-split-cross-validation-leakage, data-analytics/imbalanced-data-resampling-smote, ui-ux/search-quality-metrics-mrr-ndcg, ui-ux/mcnemar-test-paired-proportions]
sources:
  - https://scikit-learn.org/stable/modules/model_evaluation.html
  - https://people.inf.elte.hu/kiss/11dwhdm/roc.pdf
updatedAt: 2026-11-23
---

## 개요

- 분류 모형의 예측을 실제와 대조해 세는 표가 **혼동행렬**이고, 지표 대부분은 그 네 칸의 비율이다.
- 지표마다 "무엇을 틀리는 것을 더 나쁘게 보는가"가 다르다. 클래스 불균형, 오류 비용에 따라 고른다.
- 확률·점수를 내는 모형은 임계값에 따라 혼동행렬이 달라진다. 임계값을 훑은 곡선이 ROC·PR 이다.

## 시험 범위 대응

ADsP·ADP 데이터분석(분류분석; 평가 지표는 항목명에 직접 없음) / ADP 실기(모델 평가·선택) / 빅데이터분석기사 4과목 빅데이터 결과 해석(분석모형 평가: 평가 지표).

## 핵심 용어

양성(positive)을 관심 클래스로 둔다. TP=양성을 양성으로, FN=양성을 음성으로, FP=음성을 양성으로, TN=음성을 음성으로.

| 한국어(교재 표기) | 영어 | 식 | 비고 |
| --- | --- | --- | --- |
| 정확도 | accuracy | (TP+TN)/전체 | 불균형에서 쉽게 높아짐 |
| 정밀도 | precision, PPV | TP/(TP+FP) | 양성 예측 중 맞은 비율 |
| 재현율, 민감도, 참양성률 | recall, sensitivity, TPR | TP/(TP+FN) | 실제 양성 중 찾은 비율. **세 이름은 같은 값** |
| 특이도, 참음성률 | specificity, TNR | TN/(TN+FP) | 실제 음성 중 맞춘 비율 |
| 거짓양성률 | FPR | FP/(FP+TN) = 1 − 특이도 | ROC 의 x 축 |
| F1 | F1 | 2TP/(2TP+FP+FN) | 정밀도·재현율의 조화평균 |
| Fβ | F-beta | (1+β²)TP / ((1+β²)TP + FP + β²FN) | β>1 이면 재현율 중시 |
| 균형 정확도 | balanced accuracy | (TPR + TNR)/2 (이진) | 클래스별 재현율의 평균 |
| 매튜스 상관계수 | MCC | (TP·TN − FP·FN)/√((TP+FP)(TP+FN)(TN+FP)(TN+FN)) | 이진에서 −1~+1 |

식은 scikit-learn 문서를 따랐다. F1 식은 문서의 Fβ 형태에서 β=1 을 대입했다.

## 헷갈리는 구분 (한국 교재 용어 충돌)

| 헷갈리는 쌍 | 구분 |
| --- | --- |
| 재현율 = 민감도 = TPR | 이름만 다르고 같은 값. 의료·통계는 민감도, 정보검색·머신러닝은 재현율 |
| 정확도 vs 정밀도 | accuracy 는 전체 중 맞은 비율, precision 은 **양성 예측** 중 맞은 비율. 번역에서 두 단어를 뒤바꿔 쓰는 자료가 있으므로 영어 정의로 확인(교재별 실태는 확인하지 않음) |
| 정밀도 vs 재현율 | 분모가 다르다. 정밀도=예측 양성(TP+FP), 재현율=실제 양성(TP+FN) |
| 특이도 vs 거짓양성률 | 합이 1. ROC 는 FPR(=1−특이도) 를 쓴다 |
| 정밀도 vs 특이도 | 분모가 다르다. 정밀도는 예측 양성 기준, 특이도는 실제 음성 기준 |
| 오분류율 | 1 − 정확도 |
| 향상도(lift) | 분류 평가 지표가 아니라 이익도표에서 쓰는 비율. 연관규칙의 lift 와도 다름 |

## ROC·AUC

- ROC 곡선: 임계값을 바꿔 가며 x=FPR, y=TPR 을 찍은 곡선. 무작위 분류는 대각선이고 그 아래 면적이 0.5 다(Fawcett 2006).
- AUC: 곡선 아래 면적. 모형이 **무작위 양성을 무작위 음성보다 높게 점수 매길 확률**과 같고 Wilcoxon 순위합 검정과 동치다(Fawcett 2006). 임계값 하나를 고르지 않고 순위 능력만 본다.
- Fawcett 은 ROC 가 클래스 분포 변화에 둔감하다고 설명한다. TPR·FPR 은 각각 한 열(양성 열, 음성 열)만 쓰는 비율이기 때문이다. 정확도·정밀도·lift·F 점수는 두 열을 같이 쓰므로 양성:음성 비율이 바뀌면 값이 변한다.
- scikit-learn `roc_auc_score` 는 이진 점수 또는 다중 분류의 OvR/OvO 를 지원한다.
- 지니 계수는 `2·AUC − 1` (Fawcett 이 Breiman 등을 인용해 "대각선과 곡선 사이 면적의 두 배"라고 설명).

## PR 곡선과 불균형

- PR 곡선: x=재현율, y=정밀도. 양성이 매우 드물 때 ROC 는 FPR 분모(음성 수)가 커서 FP 가 많아도 FPR 이 작게 보인다(산술 설명이며 출처는 없다).
- 평균 정밀도 `AP = Σ (R_n − R_{n−1}) P_n`. 무작위 모형의 AP 는 양성 비율이다(scikit-learn). 선형 보간으로 PR 면적을 구하면 낙관적일 수 있다는 점도 문서가 언급한다.

## 다중 분류 평균

| average | 계산 |
| --- | --- |
| micro | 모든 표본·레이블을 합쳐 한 번에 계산. 다중 분류(단일 레이블)에서 모든 클래스를 포함하면 정확도와 같다 |
| macro | 클래스별 값의 단순 평균 |
| weighted | 클래스별 값을 지지도(실제 표본 수)로 가중 평균 |

- macro F1 은 클래스별 F1 의 평균이며, macro 정밀도·macro 재현율의 조화평균이 아니다(scikit-learn 문서).

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1).

**1. 불균형 이진 분류.** 1000건, 양성 50: TP=40, FN=10, FP=30, TN=920.

| 지표 | 값 |
| --- | --- |
| 정확도 | 0.960 |
| 정밀도 | 0.571 |
| 재현율 | 0.800 |
| 특이도 / FPR | 0.968 / 0.032 |
| F1 / F2 / F0.5 | 0.667 / 0.741 / 0.606 |
| 균형 정확도 / MCC | 0.884 / 0.656 |

- 전부 음성이라고 답해도 정확도는 0.95 다. 정확도 0.96 은 이 모형이 이긴 정도가 작다.

**2. 임계값.** 점수 `[.95,.9,.8,.7,.6,.55,.5,.4,.3,.2]`, 실제 `[1,1,0,1,1,0,0,1,0,0]`.

| 임계값 | 정밀도 | 재현율 | FPR |
| --- | --- | --- | --- |
| 0.75 | 0.667 | 0.4 | 0.2 |
| 0.50 | 0.571 | 0.8 | 0.6 |
| 0.35 | 0.625 | 1.0 | 0.6 |

임계값을 낮추면 재현율은 오르고(단조 비감소), 정밀도는 단조가 아니다. 이 점수의 AUC 는 0.8. 문서의 작은 예(`y=[1,1,2,2]`, 점수 `[.1,.4,.35,.8]`)는 AUC 0.75 이고, 양성·음성 쌍 4개 중 3쌍에서 양성 점수가 높아 쌍 비교 값과도 같았다.

**3. ROC AUC vs AP(로지스틱 회귀, make_classification 20000건, seed 0).** 양성 비율 50% → AUC 0.715, AP 0.712(기준선 0.5). 양성 비율 2% → AUC 0.664, AP 0.082(기준선 0.026). AUC 는 큰 변화가 없는데 AP 는 기준선 대비 낮다. 이 계산은 두 지표가 다른 정보를 준다는 것만 보이며, 일반화 증거가 아니다.

**4. 다중 분류(3클래스, 실제 6/3/1).** 혼동행렬 `[[5,1,0],[1,2,0],[0,0,1]]`. micro P=R=F1=0.800(정확도와 같음), macro 0.833, weighted 0.800. 클래스별 재현율 0.833/0.667/1.0. 지지도가 1인 클래스의 만점이 macro 를 끌어올린다.

## 언제 쓰나 / 주의

| 상황 | 쓰는 지표 |
| --- | --- |
| 클래스가 균형, 오류 비용이 비슷 | 정확도, F1 |
| 놓치면 안 되는 양성(질병·사기) | 재현율, F2, 임계값을 낮춤 |
| 양성 예측에 대한 후속 비용이 큼(스팸 차단) | 정밀도, F0.5 |
| 양성이 매우 드묾 | PR 곡선, AP, MCC, 균형 정확도 |
| 임계값과 무관한 순위 능력 | ROC AUC |

- 최종 임계값은 오류 비용으로 정한다. 0.5 는 기본값일 뿐이다.
- AUC 가 같아도 곡선 모양(낮은 FPR 구간)이 다를 수 있다.
- 지표는 **훈련에 쓰지 않은 데이터**로 잰다 → [데이터 분할과 교차검증](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/). 불균형 처리는 [불균형 데이터](/develop-wiki/knowledge/data-analytics/imbalanced-data-resampling-smote/).
- 두 모형의 비교는 점수 차이가 우연인지 검정이 필요하다 → [모형 비교](/develop-wiki/knowledge/machine-learning/lift-gain-chart-ks-model-comparison/), [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/).
- 순위 평가(검색)는 별도 지표를 쓴다 → [MRR·nDCG](/develop-wiki/knowledge/ui-ux/search-quality-metrics-mrr-ndcg/).

## 검증 범위

- 읽음: scikit-learn 모델 평가 문서(정확도·균형 정확도·혼동행렬·Fβ·평균 방식·AP·MCC·ROC AUC 부분), Fawcett(2006) ROC 입문 논문 PDF(클래스 skew 둔감성, AUC=순위 확률·Wilcoxon, 지니 계수).
- 실행: 위 1~4 모든 계산.
- 미확인: 정밀도=PPV 표기의 1차 출처(표준 용어로 쓰이나 직접 확인하지 않음), 한국 교재별 용어 번역 실태(교재 본문은 근거로 쓰지 않음), AUC 해석에서 "불균형 시 ROC 가 낙관적"이라는 주장의 원문 근거(scikit-learn 문서에서 해당 서술을 찾지 못함; 위 3번은 필자의 계산 예). 임계값 조정 도구(`TunedThresholdClassifierCV` 등)는 문서 본문을 읽지 못했다.

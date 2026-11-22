---
title: 이익도표·향상도 곡선·KS 통계량과 모형 비교
aka: [Gain Chart, Cumulative Gains, Lift Chart, Lift Curve, KS statistic, Kolmogorov-Smirnov, 모형 비교, 이익도표, 향상도 곡선]
category: machine-learning
group: evaluation
level: intermediate
summary: 점수 순으로 정렬한 상위 구간에서 양성을 얼마나 모으는지 보는 이익도표·향상도 곡선, 두 점수 분포의 최대 차이를 재는 KS 통계량, 그리고 같은 분할·같은 지표로 모형을 비교하는 절차를 손으로 계산한 표로 정리한다.
tags: [lift, gain, ks-statistic, model-comparison, scorecard, targeting, evaluation]
related: [machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/association-rules-apriori-fp-growth, machine-learning/data-split-cross-validation-leakage, machine-learning/regression-metrics-rmse-mae-r2, ui-ux/mcnemar-test-paired-proportions, ui-ux/cochrans-q-test-paired-binary, data-analytics/nonparametric-tests-rank-based]
sources:
  - https://mlwiki.org/Cumulative_Gain_Chart
  - https://scikit-plot.readthedocs.io/en/stable/metrics.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html
  - https://people.inf.elte.hu/kiss/11dwhdm/roc.pdf
  - https://scikit-learn.org/stable/modules/model_evaluation.html
updatedAt: 2026-11-23
---

## 개요

- 마케팅 타깃팅이나 신용평가처럼 "점수가 높은 순으로 일부만 고르는" 업무에서는, 전체 분류 정확도보다 **상위 x% 를 골랐을 때 양성을 얼마나 모으나**가 중요하다.
- 이익도표(gain chart)와 향상도 곡선(lift chart)이 그것이고, 두 점수 분포의 분리도를 한 숫자로 요약하는 것이 KS 통계량이다.
- 용어와 정의는 자료마다 조금씩 다르다. 이 노트는 확인된 정의를 쓰고 갈리는 부분을 표시한다.

## 시험 범위 대응

ADsP·ADP 데이터분석(분류분석 평가) / ADP 실기(모델 평가·선택) / 빅데이터분석기사 4과목 빅데이터 결과 해석(평가 지표, 최종모형 선정). 이익도표·KS 통계량이라는 이름은 공식 출제범위 항목명에 직접 나와 있지 않다(공식 출제범위에 직접 항목 없음. 관련: 평가 지표, 분석모형 융합·최종모형 선정).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 이익도표(누적 이익) | gain chart, cumulative gains | 점수 내림차순으로 정렬해 상위 비율 p 를 골랐을 때 **전체 양성 중 잡은 비율**(TPR)을 p 에 대해 그린 곡선 |
| 향상도 | lift | 상위 p 안의 양성 비율 ÷ 전체 양성 비율. 곡선 기준으로는 `TPR / p` |
| 구간(십분위) 향상도 | decile lift | 구간별(예: 10%씩) 양성 비율 ÷ 전체 양성 비율 |
| 선택 비율 | predicted positive rate(ppr), support | `(TP+FP)/N`. 이 노트의 p |
| KS 통계량 | Kolmogorov-Smirnov statistic | 두 경험적 누적분포 사이 거리의 최댓값 |
| 지니 계수 | Gini | `2·AUC − 1`(Fawcett 가 Breiman 등과 Hand & Till 을 인용해 설명한 관계) |

- mlwiki 가 소개하는 정의: gain chart 는 y=tpr, x=support(예측 양성 비율), lift chart 는 y=`tpr/ppr`. scikit-plot 은 "누적 이득 그래프는 이진 분류기의 효과를 판단하는 데 쓴다"고만 적고 식은 적지 않는다.
- 이익도표 용어는 자료마다 y 축(양성 중 잡은 비율, 선택 구간 안 양성 비율, 양성 건수)이 다를 수 있다. 확인한 것은 위 정의뿐이다.

## 만드는 법

1. 점수(양성 확률)로 전체를 **내림차순** 정렬한다.
2. 상위 p 를 순서대로 늘려 가며 누적 양성 수를 센다.
3. 이익도표: x=p, y=누적 양성/전체 양성. 무작위 선택은 대각선이다.
4. 향상도 곡선: y=이익/p. 무작위는 y=1 이다.
5. 이상적인 모형은 이익도표가 1 에 닿을 때까지 직선으로 올랐다 수평이 된다.

## ROC 와의 관계

- 이익도표의 y 는 ROC 의 y 와 같은 TPR 이다. x 만 FPR 에서 **선택 비율 (TP+FP)/N** 으로 바뀐다.
- ROC 는 양성:음성 비율이 변해도 곡선이 유지되지만, 선택 비율·lift 는 두 열을 같이 쓰는 지표라 비율이 변하면 달라진다(Fawcett 2006은 lift 를 이 유형으로 분류). 즉 **서로 다른 양성 비율의 데이터에서 얻은 lift 를 비교하면 안 된다.**
- 양성이 드문 업무에서는 이 곡선이 "상위 5% 에서 몇 배 잡히는가"를 직접 답해 준다.

## KS 통계량 (신용평가 관점)

- 두 표본 KS(scipy 문서): 양쪽 경험적 누적분포 함수의 차이의 최댓값(절댓값). 귀무가설은 두 분포가 같다는 것.
- 점수를 양성/음성(예: 부실/정상)으로 나눠 각각의 누적분포를 그리면 `KS = max_s |F_양성(s) − F_음성(s)|`. 점수 컷을 움직여 TPR 과 FPR 을 구하면 같은 값은 **`max_s |TPR(s) − FPR(s)|`** 이다(필자가 정의에서 연결한 것이며 scipy 계산과 일치함만 확인했다)(TPR=양성 점수가 컷 이상인 비율, FPR=음성의 같은 비율. ROC 의 대각선에서 가장 먼 수직 거리).
- 값이 클수록 두 집단의 점수 분리가 잘 된 것(0~1). 신용평가에서 이 정의가 널리 쓰이는 것으로 알려져 있으나 **실무 기준값(몇 이상이 좋다)은 공개 1차 출처를 찾지 못해 적지 않는다.** 문헌·기관마다 정의(점수 방향, 부실을 양성으로 두는지)나 단위(%)가 다를 수 있다.
- KS 는 한 점수 컷의 값 하나만 본다. 곡선 전체의 순위 능력은 AUC·Gini 가 요약한다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1, scipy 1.18.1).

**1. 손으로 구한 이익·향상도 표.** 20건을 점수 내림차순으로 놓은 실제 레이블 `[1,1,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0]`, 양성 7, 전체 양성 비율 0.35. 2건씩 10구간.

| 상위 | 건수 | 누적 양성 | 이익(양성 중 비율) | 누적 lift | 구간 lift |
| --- | --- | --- | --- | --- | --- |
| 10% | 2 | 2 | 0.286 | 2.857 | 2.86 |
| 20% | 4 | 3 | 0.429 | 2.143 | 1.43 |
| 30% | 6 | 4 | 0.571 | 1.905 | 1.43 |
| 40% | 8 | 5 | 0.714 | 1.786 | 1.43 |
| 50% | 10 | 5 | 0.714 | 1.429 | 0.00 |
| 60% | 12 | 6 | 0.857 | 1.429 | 1.43 |
| 70% | 14 | 6 | 0.857 | 1.224 | 0.00 |
| 80% | 16 | 6 | 0.857 | 1.071 | 0.00 |
| 90% | 18 | 7 | 1.000 | 1.111 | 1.43 |
| 100% | 20 | 7 | 1.000 | 1.000 | 0.00 |

- 상위 20% 를 고르면 양성의 3/7 = 42.9% 를 잡고, 누적 lift 는 `0.429/0.2 = 2.14`. 무작위는 20%, lift 1.
- 구간 lift 는 상위 구간이 높고 아래로 갈수록 내려가는 것이 정상이지만, 표본이 작아 단조롭지 않다(5·7·8·10 구간 0, 6·9 구간 1.43). 구간 수를 늘리면 더 흔들린다.
- 같은 점수로 ROC 를 그리면 **KS = max(TPR−FPR) = 0.56**, AUC = 0.802, Gini = 2·0.802 − 1 = 0.604. `scipy.stats.ks_2samp(양성 점수, 음성 점수).statistic` 도 0.56 으로 같았다.

**2. 같은 분할에서 두 모형 비교.** `make_classification(1500, 12 변수, 양성 15%)`, 같은 5겹 층화 분할에서 두 모형을 같은 AUC 로 평가(seed 고정).

| 겹 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| 로지스틱 | 0.738 | 0.726 | 0.802 | 0.660 | 0.806 |
| 랜덤포레스트 | 0.953 | 0.968 | 0.950 | 0.965 | 0.960 |
| 차이 | 0.215 | 0.243 | 0.148 | 0.305 | 0.154 |

차이 평균 0.213, 표준편차 0.065, 대응 t 검정 p = 0.0019. 5겹의 학습 데이터가 겹쳐 겹 간 독립이 아니므로 p 값은 낙관적일 수 있다(일반 지식, 이번에 1차 출처 미확인). 겹별 차이가 모두 같은 방향이라는 점도 함께 본다.

## 모형 비교 절차

1. **같은 분할**: 훈련·검증 분할(또는 교차검증 겹)을 모든 후보에 동일하게 쓴다 → [데이터 분할](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/). 데이터 누수가 없게 전처리도 분할 안에서 한다.
2. **같은 지표**: 업무 목적에 맞는 지표 하나를 사전에 정한다(AUC, 상위 10% lift, KS, F1 …). 사후에 유리한 지표를 고르지 않는다.
3. **같은 조건**: 임계값·클래스 비율·변수 집합을 맞추거나 차이를 명시한다.
4. **불확실성**: 겹별 점수 분포를 본다. 차이가 겹 간 변동보다 큰지 확인한다.
5. **검정**: 같은 표본에서 이진 예측의 정오를 비교하면 [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/), 세 모형 이상이면 [Cochran Q](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/), 겹별 점수는 대응 비모수 검정을 쓸 수 있다 → [비모수 검정](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/).
6. **단순 모형 기준선**: 복잡한 모형이 단순 기준선보다 확실히 나은지 확인한다.

## 언제 쓰나 / 주의

- 이익도표·lift: 캠페인 대상 선정, 심사 대상 우선순위. 예산상 상위 몇 %만 처리할 때.
- KS: 신용평가 점수표처럼 점수 분리도를 하나의 숫자로 보고해야 할 때. 단독으로 모형을 평가하지 않는다.
- 훈련 데이터에서 만든 곡선은 낙관적이다. 검증·테스트 데이터로 그린다.
- 구간 lift 는 표본이 적으면 흔들린다. 구간 수를 줄이거나 신뢰구간을 같이 본다.
- 연관규칙의 lift(독립 대비 동시 발생 배수)와 이름이 같지만 별개 개념이다 → [연관규칙](/develop-wiki/knowledge/machine-learning/association-rules-apriori-fp-growth/).
- 회귀 모형은 다른 지표를 쓴다 → [회귀 지표](/develop-wiki/knowledge/machine-learning/regression-metrics-rmse-mae-r2/).

## 검증 범위

- 읽음: mlwiki "Cumulative Gain Chart"(gain·lift 정의, 2차 자료), scikit-plot 문서(함수 설명만, 식 없음), scipy `ks_2samp` 문서(통계량 정의), Fawcett(2006) PDF(lift 가 클래스 비율에 민감, Gini), scikit-learn 모델 평가 문서(균형 정확도=Youden J 언급).
- 실행: 위 1·2 표 전체(1 은 손으로 계산한 값을 코드로 재확인).
- 미확인: 이익도표·향상도 곡선의 학술 1차 출처(찾지 못함), 신용평가에서 KS 의 공식 정의·기준값, 국내 교재의 정의(교재는 근거로 쓰지 않음). KS = max(TPR − FPR) 는 정의로부터의 필자 연결이며 scipy 계산이 일치함만 확인했다. 겹 간 의존을 보정하는 검정(예: Nadeau-Bengio)은 읽지 않았다.

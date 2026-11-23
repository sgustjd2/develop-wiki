---
title: 확률 보정 (Probability Calibration)
aka: [Calibration, Reliability Diagram, Calibration Curve, Brier Score, ECE, Platt Scaling, Isotonic Regression, Temperature Scaling, 신뢰도 곡선]
category: machine-learning
group: evaluation
level: intermediate
summary: 분류기의 예측 확률이 실제 빈도와 맞는지 신뢰도 곡선·Brier 점수·로그 손실·ECE 로 재고, Platt·isotonic·temperature scaling 으로 고치는 방법을 보정 전후 직접 계산과 함께 정리한다.
tags: [calibration, reliability-diagram, brier-score, log-loss, ece, platt-scaling, isotonic-regression, temperature-scaling, scikit-learn]
related: [machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/naive-bayes-bayes-theorem, machine-learning/svm-margin-kernel, machine-learning/ensemble-bagging-boosting-stacking, machine-learning/data-split-cross-validation-leakage, machine-learning/model-deployment-monitoring-drift]
sources:
  - https://scikit-learn.org/stable/modules/calibration.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.calibration.calibration_curve.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.metrics.brier_score_loss.html
  - https://arxiv.org/abs/1706.04599
  - https://www.cs.cornell.edu/~alexn/papers/calibration.icml05.crc.rev3.pdf
updatedAt: 2026-11-23
---

## 개요

- 분류기가 "양성일 확률 0.8"이라고 낼 때, 그렇게 말한 사례의 약 80% 가 실제 양성이면 **보정이 잘 된** 모형이다(scikit-learn 사용자 가이드의 정의).
- 순위를 잘 매기는 것(AUC)과 확률이 맞는 것(보정)은 다르다. 확률을 **그대로 쓰는** 곳(비용 기대값 계산, 위험 점수, 임계값 선택, 다른 모형 입력)에서는 보정이 필요하다.
- 방법: (1) 보정 상태를 재고 (2) 안 맞으면 별도 자료로 **보정기(calibrator)** 를 맞춰 출력 확률을 변환한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 보정 | calibration | 예측 확률과 실제 빈도의 일치 |
| 신뢰도 곡선 | reliability diagram, calibration curve | 예측 확률을 구간(bin)으로 나눠 구간 평균 예측(x)과 구간 양성 비율(y)을 그린 것. 대각선이 이상적 |
| Brier 점수 | Brier score | 확률과 결과(0/1) 차이의 제곱평균. 낮을수록 좋음 |
| 로그 손실 | log loss, negative log-likelihood | 정답 클래스에 준 확률의 −log 평균 |
| ECE | expected calibration error | 구간별 정확도와 확신도의 절댓값 차이를 구간 크기로 가중 평균(Guo 2017) |
| MCE | maximum calibration error | 구간별 격차의 최댓값(Guo 2017) |
| Platt 스케일링 | Platt scaling, sigmoid | 점수에 로지스틱 함수를 적합: p = 1/(1+exp(A·f+B)) |
| 등위 회귀 | isotonic regression | 단조 증가하는 계단 함수를 적합 |
| 온도 스케일링 | temperature scaling | 로짓을 하나의 스칼라 T 로 나눈 뒤 softmax |

## 측정

### 신뢰도 곡선과 `calibration_curve`

- 예측을 bin 으로 나눠 구간 평균 예측과 구간 양성 비율을 비교한다. scikit-learn `calibration_curve(y_true, y_prob, n_bins=5, strategy='uniform')`: `'uniform'` 은 폭이 같은 bin, `'quantile'` 은 표본 수가 같은 bin. 큰 `n_bins` 는 더 많은 자료가 필요하고, 빈 bin 은 반환되지 않는다.
- 곡선만으로는 각 구간에 자료가 몇 개인지 모른다. 사용자 가이드는 히스토그램을 함께 보이고, Guo 등도 신뢰도 도표가 구간별 표본 비율을 보여 주지 않는다고 지적한다.

### 점수

| 지표 | 식 | 비고 |
| --- | --- | --- |
| Brier | (1/N) Σ (yᵢ − p̂ᵢ)² (이진, 반으로 나눈 꼴) | scikit-learn `brier_score_loss`: strictly proper scoring rule. 다중 클래스는 [0, 2], 이진은 [0, 1] 로 스케일(`scale_by_half`) |
| 로그 손실 | −(1/N) Σ log p̂(yᵢ) | 확신 있게 틀리면 크게 벌 |
| ECE | Σₘ (\|Bₘ\|/n) \|acc(Bₘ) − conf(Bₘ)\| | bin 수·방식에 따라 값이 달라진다 |

- scikit-learn 문서의 주의: Brier 와 로그 손실은 **보정, 변별력(resolution), 자료 고유의 불확실성**이 섞인 값이다. 낮은 Brier 가 곧 더 나은 보정은 아니다(더 변별력 있지만 덜 보정됐을 수 있다). 그래서 신뢰도 곡선·ECE 와 함께 본다.
- 이진 예: `y=[0,1,1,0]`, `p=[0.1,0.9,0.8,0.3]` 이면 Brier = (0.01+0.01+0.04+0.09)/4 = 0.0375 (문서 예와 일치, `scale_by_half=False` 면 0.075).
- ECE 는 scikit-learn 문서에 없다. 이 노트의 ECE 는 Guo 등(2017)의 식을 따라 **10 개 등폭 bin 으로 직접 구현**했다(논문은 M=15 를 씀). 구현 방식에 따라 값이 다르니 보고서에 bin 방식을 적는다.

## 보정 방법

| 방법 | 가정·특징 | 쓸 때 |
| --- | --- | --- |
| Platt(sigmoid) | 점수→확률이 시그모이드 모양, 매개변수 2 개(A, B)를 최대우도로 적합. 단조라 순위·AUC 유지 | 자료가 적을 때, 왜곡이 시그모이드형일 때 |
| Isotonic | 단조 증가만 가정, 계단 함수. 어떤 단조 왜곡도 고칠 수 있으나 과적합 쉬움, 동점이 생겨 AUC 가 바뀔 수 있음 | 보정 자료가 충분(문서: 약 1000 개 이상) |
| Temperature | 로짓/T 에 softmax. T 는 보정 자료에서 로그 손실 최소화로 맞춤. 최댓값 위치가 안 변해 **정확도 불변** | 신경망 등 다중 클래스. 매개변수 1 개 |

- scikit-learn `CalibratedClassifierCV(estimator, method='sigmoid'|'isotonic'|'temperature', cv=..., ensemble=...)` (기본값은 method='sigmoid', cv=None(5겹), ensemble='auto': `FrozenEstimator` 면 False, 아니면 True. 'temperature' 는 scikit-learn 1.8 이상). 이미 학습한 모형은 `FrozenEstimator` 로 감싸 보정 자료만으로 보정기를 맞춘다. 다중 클래스의 sigmoid·isotonic 은 클래스별 일대다로 보정한 뒤 합이 1 이 되게 정규화한다(Zadrozny & Elkan 2002 방식, 문서 서술).
- **보정은 학습에 쓰지 않은 자료로 해야 한다.** 학습 자료에서는 모형이 더 확신하기 때문에, 그 출력으로 맞춘 보정기는 0/1 에 치우친다(사용자 가이드).
- 어떤 모형이 어떻게 틀리나(최대 마진·랜덤 포레스트·배깅의 0·1 근처 서술은 사용자 가이드, 나머지 모형별 서술은 Niculescu-Mizil & Caruana 2005 논문): 부스팅 트리·SVM 같은 최대 마진류는 확률을 0·1 에서 밀어내 **시그모이드형 왜곡**, 나이브 베이즈는 독립 가정 탓에 0·1 쪽으로 밀어 **과신**. 신경망·배깅 트리는 편향이 적다고 한다. 로지스틱 회귀는 모형이 맞으면 대체로 잘 보정된다. 논문의 8 개 과제 실험에서는 보정 후 부스팅 트리·랜덤 포레스트·SVM 이 가장 좋은 확률을 냈다.
- 현대 신경망: Guo 등(2017, ICML)은 깊이·너비·가중치 감쇠·배치 정규화가 ECE 와 관련이 있고 현대 신경망이 과거보다 보정이 나쁘다고 보고하며, 단일 매개변수 **온도 스케일링**이 대부분 자료에서 잘 된다고 권한다.
- SVM 의 `probability=True` 는 내부에서 Platt 방식을 쓰며 한계가 있다 → [SVM 노트의 확률 출력 주의](/develop-wiki/knowledge/machine-learning/svm-margin-kernel/).

## 직접 계산: 보정 전후

환경: scikit-learn 1.9.1, 합성 이진 자료(`make_classification`, 20000 건, 특성 20 개, 정보 특성 4 개, 클러스터 2, 라벨 노이즈 3%), 학습 8000 / 보정 6000 / 시험 6000, seed 고정. ECE 는 10 등폭 bin(필자 구현). 단일 분할이라 작은 차이는 우연일 수 있다.

| 모형 | Brier | 로그 손실 | ECE | AUC |
| --- | --- | --- | --- | --- |
| GaussianNB 원본 | 0.1867 | 0.7001 | 0.1387 | 0.8075 |
| GaussianNB + sigmoid | 0.1676 | 0.5073 | 0.0490 | 0.8075 |
| GaussianNB + isotonic | 0.1620 | 0.4865 | 0.0181 | 0.8156 |
| GaussianNB + temperature | 0.1662 | 0.5021 | 0.0565 | 0.8075 |
| RandomForest 원본 | 0.0598 | 0.2252 | 0.0329 | 0.9706 |
| RandomForest + sigmoid | 0.0582 | 0.2080 | 0.0169 | 0.9706 |
| RandomForest + isotonic | 0.0582 | 0.2078 | 0.0119 | 0.9705 |
| LogisticRegression 원본 | 0.1928 | 0.5764 | 0.1195 | 0.7765 |
| LogisticRegression + sigmoid | 0.1939 | 0.5771 | 0.1207 | 0.7765 |
| LogisticRegression + isotonic | 0.1766 | 0.5302 | 0.0174 | 0.7765 |

읽는 법:
- **나이브 베이즈**: 신뢰도 곡선(10 bin)에서 구간 평균 예측 0.04 → 실제 양성 0.23, 0.99 → 0.94. 양 끝에서 과신이다. 보정 후 Brier·로그 손실·ECE 가 모두 줄었다. sigmoid 보다 isotonic 이 좋았다(보정 자료 6000).
- **랜덤 포레스트**: 0.15 → 0.07, 0.85 → 0.92 처럼 예측이 안쪽에 몰린 **과소 확신**(사용자 가이드가 설명하는 모양과 같은 방향)이다. 이미 ECE 가 낮아 개선 폭이 작다.
- **로지스틱 회귀**는 이 자료에서 **잘 보정되지 않았다**(ECE 0.12). 이 자료가 선형 모형에 맞지 않기 때문이라고 짐작하지만(AUC 0.78 로 낮음) 원인을 따로 검증하지는 않았다. "로지스틱은 보정이 좋다"는 말은 모형이 자료에 맞을 때의 이야기다. sigmoid 는 효과가 없고 isotonic 은 고쳤다 → 왜곡이 시그모이드가 아니라는 뜻으로 읽을 수 있다.
- **AUC**: sigmoid·temperature 는 같고, isotonic 은 NB 에서 0.8075→0.8156 으로 바뀌었다(동점·계단 때문, 문서가 경고한 점). 보정은 변별력을 키우는 방법이 아니다.
- **잘못된 자료로 보정**: RandomForest 를 학습 자료에서 isotonic 보정하면 시험 Brier 0.0598 → 0.0707, 로그 손실 0.2252 → 0.8743 로 **나빠졌다**. 학습 출력은 과신이라 보정기가 극단값을 믿게 된다.
- **보정 자료 크기**(GaussianNB, 10 회 반복 평균 Brier, sigmoid vs isotonic): 100 건 0.1712 vs 0.1725, 300 건 0.1686 vs 0.1658, 1000 건 0.1679 vs 0.1631, 3000 건 0.1675 vs 0.1624. 100 건에서는 같고(isotonic 이 약간 나쁨), 300 건부터 isotonic 이 앞섰다. 문서의 "약 1000 이상"과 같은 방향이나 임계점은 자료마다 다르다.

## 헷갈리는 구분

| 구분 | 내용 |
| --- | --- |
| 보정 vs 변별력 | 보정은 확률 값의 정확성, 변별력은 순위 능력. 단조 변환은 AUC 를 유지하지만 확률은 바꾼다 |
| 정확도 vs 확신도 | 90% 확신으로 90% 맞으면 보정됨. 정확도가 높아도 확신도가 어긋나면 비보정 |
| Brier vs ECE | Brier 는 보정+변별력의 합성, ECE 는 보정 격차만(bin 의존) |
| Platt vs temperature | temperature 는 Platt 의 한 매개변수 확장판(Guo). 다중 클래스에 자연스러움 |
| 확률 vs 점수 | SVM `decision_function` 은 확률이 아니다. 확률이 필요하면 보정 |

## 언제 쓰나 / 주의

- 확률을 임계값이 아니라 **값으로** 쓸 때(위험 점수, 비용 계산, 다중 모형 결합), 클래스 불균형에서 임계값을 고를 때([분류 평가 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/)), [나이브 베이즈](/develop-wiki/knowledge/machine-learning/naive-bayes-bayes-theorem/) 같이 과신하는 모형을 쓸 때.
- 순위·분류만 쓰면 보정이 필수는 아니다.
- 보정 자료를 따로 떼야 하므로 [자료 분할·교차검증](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)의 누수에 주의한다. `CalibratedClassifierCV` 의 `cv` 에서(ensemble=True 일 때, 문서) 어떤 분할이든 모든 클래스가 학습·시험 양쪽에 있어야 한다(문서).
- 분포가 바뀌면 보정이 깨진다. 운영 중에는 보정 상태도 모니터링한다 → [모델 운영·드리프트](/develop-wiki/knowledge/machine-learning/model-deployment-monitoring-drift/).
- 신뢰도 곡선·ECE 는 bin 수·방식에 따라 달라진다. 비교할 때는 같은 설정으로 하고 bin 별 표본 수를 같이 본다.
- 이 노트의 계산은 합성 이진 자료 하나다. 다중 클래스·신경망의 temperature scaling 은 직접 실행하지 않았다.

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드 "Probability calibration"(정의·방법·한계), `calibration_curve`·`brier_score_loss` API 문서, Guo et al. 2017 본문(ECE·MCE·NLL·온도 스케일링 정의), Niculescu-Mizil & Caruana 2005(ICML) 초록·서론·방법 절 일부.
- 직접 계산: Python 3.15, scikit-learn 1.9.1 (스크래치 `r12/ra/n4.py`).
- 미확인: Niculescu-Mizil & Caruana 의 쪽수·실험 세부, Platt(1999)·Zadrozny & Elkan(2002) 원문, Guo 의 온도 스케일링 실험 수치 재현, Brier 분해(Murphy 1973), 신뢰도 곡선의 신뢰구간, 로지스틱 회귀 ECE 가 높은 정확한 원인.

---
title: 손실 함수와 경사하강법·최적화 알고리즘 (Loss, Gradient Descent, Momentum, RMSProp, Adam)
aka: [Loss Function, Gradient Descent, SGD, Mini-batch, Learning Rate, Momentum, RMSProp, Adam, Convex vs Non-convex, 경사 하강법, 옵티마이저]
category: machine-learning
group: paradigm
level: intermediate
summary: 손실 함수(MSE·MAE·교차엔트로피·힌지)를 줄이도록 가중치를 갱신하는 경사하강법의 배치·미니배치·확률적 변형, 학습률의 영향, 모멘텀·RMSProp·Adam 갱신식, 볼록·비볼록과 안장점을 계산으로 보인다.
tags: [gradient-descent, sgd, loss-function, learning-rate, momentum, rmsprop, adam, convexity, optimization]
related: [machine-learning/neural-network-mlp-backpropagation-activation, machine-learning/deep-learning-training-batchnorm-dropout, machine-learning/overfitting-bias-variance-regularization, machine-learning/hyperparameter-tuning-search, machine-learning/svm-margin-kernel, machine-learning/regression-metrics-rmse-mae-r2, machine-learning/classification-metrics-confusion-matrix-roc, data-analytics/logistic-regression-odds-ratio]
sources:
  - https://d2l.ai/chapter_optimization/optimization-intro.html
  - https://d2l.ai/chapter_optimization/convexity.html
  - https://d2l.ai/chapter_optimization/gd.html
  - https://d2l.ai/chapter_optimization/sgd.html
  - https://d2l.ai/chapter_optimization/momentum.html
  - https://d2l.ai/chapter_optimization/rmsprop.html
  - https://d2l.ai/chapter_optimization/adam.html
  - https://www.ruder.io/optimizing-gradient-descent/
  - https://arxiv.org/abs/1412.6980
  - https://scikit-learn.org/stable/modules/model_evaluation.html
updatedAt: 2026-11-23
---

## 개요

- **손실 함수**는 "예측이 얼마나 틀렸나"를 숫자 하나로 만든 목적 함수이고, **최적화**는 그 값을 줄이는 매개변수를 찾는 절차다. 신경망·로지스틱 회귀·선형 SVM 등 대부분의 모델이 같은 틀로 학습한다(선형 회귀 같은 일부는 닫힌 해도 있음).
- **경사하강법(GD)**: 현재 위치에서 손실이 가장 가파르게 줄어드는 방향(기울기의 반대)으로 조금씩 이동한다.
- d2l 이 강조하듯 최적화의 목표는 *학습 오차*를 줄이는 것이고 딥러닝의 목표는 *일반화 오차*를 줄이는 것이어서 둘은 다르다. 과대적합은 따로 관리한다([과대적합·규제](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/)).

## 시험 범위 대응

- 빅데이터분석기사 3과목 "분석기법 적용 > 인공신경망"·"딥러닝 분석", 4과목 "개선 > 매개변수 최적화"(이 항목이 학습 중 가중치 최적화를 뜻하는지 하이퍼파라미터 탐색을 뜻하는지는 [튜닝 노트](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)의 용어 표 참고).
- ADsP·ADP 필기 범위에 경사하강법 직접 항목 없음. 인공신경망·SVM·로지스틱 회귀의 학습 방법으로 인접.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 손실 함수 | loss function | 예측과 정답의 차이를 점수화한 함수. 학습 중 줄이는 대상 |
| 비용 함수 / 목적 함수 | cost / objective | 손실의 평균(+규제항). 교재마다 loss 와 cost 의 구분이 다를 수 있음 |
| 경사(기울기) | gradient | 손실을 각 매개변수로 편미분한 벡터 |
| 학습률 | learning rate (η) | 한 번 갱신에서 기울기 방향으로 가는 보폭 |
| 에폭 | epoch | 전체 학습 데이터를 한 번 훑는 단위 |
| 배치 크기 | batch size | 한 번 갱신에 쓰는 표본 수 |
| 볼록 함수 | convex function | 두 점을 잇는 선분이 함수 그래프 위에 있는 함수. 지역 최솟값이 곧 전역 최솟값 |
| 안장점 | saddle point | 기울기가 0 이지만 최솟값도 최댓값도 아닌 점 |

## 손실 함수

| 손실 | 식 (n 개 표본) | 쓰임 | 성질 |
| --- | --- | --- | --- |
| MSE | (1/n) Σ (yᵢ − ŷᵢ)² | 회귀 | 큰 오차를 제곱으로 강하게 벌함 (이상값에 민감, 필자 설명) |
| MAE | (1/n) Σ \|yᵢ − ŷᵢ\| | 회귀 | 오차 크기에 비례, 0 에서 미분 불가 |
| 이진 교차 엔트로피(로그 손실) | −(1/n) Σ [yᵢ log pᵢ + (1−yᵢ) log(1−pᵢ)] | 분류(확률 출력) | 확신하며 틀릴수록 크게 벌함 |
| 다중 클래스 교차 엔트로피 | −(1/n) Σᵢ Σₖ yᵢₖ log pᵢₖ | 다중 분류 | one-hot 정답 |
| 힌지 | max(0, 1 − y·f(x)), y ∈ {−1, +1} | 마진 기반(SVM) | 마진 1 이상 맞히면 0 |

- MSE·MAE 정의는 sklearn 지표 문서에서, 교차 엔트로피는 d2l 이 분류의 일반적 손실로 소개한 것과 sklearn `log_loss` 로 확인했다. 힌지·로그 손실 식은 sklearn 문서 해당 절을 직접 읽지 못해 표준 정의로 적었고, 아래 직접 계산에서 `hinge_loss`·`log_loss` 함수와 값이 일치함을 확인했다.
- 지표(평가용)와 손실(학습용)은 다를 수 있다. 정확도는 미분 불가라 학습 손실로 쓰기 어렵다(필자 설명) → [회귀 지표](/develop-wiki/knowledge/machine-learning/regression-metrics-rmse-mae-r2/), [분류 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/).
- 로지스틱 회귀의 손실은 교차 엔트로피 → [로지스틱 회귀](/develop-wiki/knowledge/data-analytics/logistic-regression-odds-ratio/). SVM 은 힌지 → [SVM](/develop-wiki/knowledge/machine-learning/svm-margin-kernel/).

**직접 계산.** y=[1,0,1], p=[0.9,0.2,0.4] → 교차 엔트로피 0.4149(= (0.105+0.223+0.916)/3). y=[2,3,5], ŷ=[2.5,3,3] → MSE 1.417, MAE 0.833. y=[1,−1,1], 점수 [2.0,0.3,−0.5] → 힌지 0.9333. 모두 sklearn 함수와 일치.

## 경사하강법

### 갱신식 (d2l)
- 1차원: `x ← x − η f′(x)`. 다차원: `x ← x − η ∇f(x)`.
- 학습: `w ← w − η ∇L(w)`.

### 배치·확률적·미니배치 (Ruder 2016, d2l)

| 방식 | 한 번 갱신에 쓰는 표본 | 특징 |
| --- | --- | --- |
| 배치 GD | 전체 n 개 | 기울기가 정확하지만 한 단계가 O(n) 비용, 데이터가 메모리를 넘으면 곤란, 온라인 학습 불가 |
| 확률적 GD (SGD) | 1 개 | 한 단계 O(1), 갱신이 매우 흔들림(분산 큼). 잡음이 나쁜 지역 최솟값을 벗어나는 데 도움이 되기도 함 |
| 미니배치 GD | 소수(Ruder: 흔히 50~256) | 분산을 줄이고 행렬 연산으로 효율적. 실무에서 "SGD"는 보통 미니배치 GD 를 뜻함 |

- d2l: 균일하게 뽑은 한 표본의 기울기는 평균적으로 전체 기울기의 좋은 추정이다(불편 추정). 하지만 최솟값 근처에서도 잡음이 남아 고정 학습률로는 정밀한 수렴이 어렵고, 학습률을 줄여 가는 스케줄(구간 상수·지수 감쇠·다항 감쇠)이 쓰인다.
- 직접 계산(f(w) = 평균 제곱오차의 기울기, 1000 표본, 2000 번 추출): 배치 크기 1 → 기울기 표준편차 8.20, 32 → 1.63, 1000(복원추출이라 완전 배치는 아님) → 0.29. 평균은 모두 약 −5.5~−5.9 로 거의 같다. 배치가 클수록 같은 방향을 더 안정적으로 가리킨다.

### 학습률의 영향 (직접 계산)

f(x) = x², 기울기 2x, 시작 x = 10, 10 번 갱신. 갱신이 `x ← (1 − 2η) x` 로 정리되므로 매 단계 곱해지는 비율이 `1 − 2η`.

| η | 단계당 배율 (1 − 2η) | 10 번 후 x | 해석 |
| --- | --- | --- | --- |
| 0.05 | 0.9 | 3.4868 | 너무 작음: 느림 |
| 0.2 | 0.6 | 0.0605 | 양호 |
| 0.5 | 0 | 0 | 이 함수에서 한 번에 0 |
| 0.9 | −0.8 | 1.0737 | 부호가 번갈아 흔들리며 수렴 |
| 1.0 | −1.0 | 10 | 영원히 ±10 진동, 수렴 안 함 |
| 1.1 | −1.2 | 61.92 | 발산 |

- `|1 − 2η| < 1`, 즉 `0 < η < 1` 이면 수렴한다. 곡률(f″ = 2)이 클수록 허용 학습률이 작아진다(이차함수의 일반 성질, 필자 정리). η=0.05·0.2·1.1 의 수치는 d2l 본문 값(3.49, 0.060, 61.9)과 같다.
- 학습률은 가장 먼저 조정하는 하이퍼파라미터이고 Ruder 도 너무 작으면 느리고 너무 크면 진동·발산한다고 정리한다.

### 볼록 vs 비볼록, 지역 최솟값, 안장점
- d2l: 볼록 함수에서는 지역 최솟값이 전역 최솟값이다(귀류법으로 증명). 이계도함수가 0 이상(헤시안이 양의 준정부호)이면 볼록. 최솟값이 유일하거나 존재한다는 보장은 아니다(예: eˣ 는 최솟값 없음).
- 선형 회귀(MSE)·로지스틱 회귀(교차 엔트로피)는 볼록 문제(필자 일반 지식, 이 노트에서 증명·인용 확인 안 함). 신경망은 대체로 비볼록이어서 지역 최솟값이 많고, 고차원에서는 안장점이 지역 최솟값보다 흔하다(d2l: 헤시안 고유값 중 음수가 있기 쉬워서). Ruder 는 안장점 주변의 평평한 구간(기울기 ≈ 0)을 지역 최솟값보다 큰 장애물로 소개한다.
- 직접 계산: f = x cos(0.15πx), 시작 10, η = 2 로 10 번 → x = −1.528(전역 최솟값이 아닌 곳에서 멈춤, d2l 본문과 같은 값). f = x² − y² 의 원점 기울기는 (0, 0) 이지만 최솟값이 아니다.
- 전역 최솟값을 반드시 찾을 필요는 없고 근사해로도 충분한 경우가 많다(d2l).
- 기울기 소실: 평평한 구간에서 기울기가 거의 0(d2l: tanh(4) 의 기울기 ≈ 0.0013).

## 모멘텀·RMSProp·Adam

| 방법 | 갱신식 (g_t = 미니배치 기울기) | 아이디어 |
| --- | --- | --- |
| 모멘텀 (d2l) | `v_t = β v_{t−1} + g_t`, `x_t = x_{t−1} − η v_t` | 과거 기울기의 지수 이동 합(누설 평균). 일관된 방향은 가속, 진동은 상쇄 |
| RMSProp (d2l) | `s_t = γ s_{t−1} + (1−γ) g_t²`, `x_t = x_{t−1} − η g_t / √(s_t + ε)` | 좌표별로 기울기 제곱의 이동평균으로 나눠 보폭을 자동 조절. Adagrad 의 누적합(학습률이 계속 줄어듦)을 이동평균으로 바꿈 |
| Adam (d2l) | `v_t = β₁ v_{t−1} + (1−β₁) g_t`, `s_t = β₂ s_{t−1} + (1−β₂) g_t²`, `v̂_t = v_t/(1−β₁ᵗ)`, `ŝ_t = s_t/(1−β₂ᵗ)`, `x_t = x_{t−1} − η v̂_t / (√ŝ_t + ε)` | 모멘텀(1차 모멘트) + RMSProp(2차 모멘트) + 초기 편향 보정 |

- Adam 은 Kingma & Ba 가 ICLR 2015 에서 제안했다. 초록: 낮은 차수 모멘트의 적응적 추정에 기반한 1차 방법, 구현이 쉽고 메모리가 적으며 기울기의 대각 스케일 변화에 불변, 하이퍼파라미터의 해석이 직관적이라 조정이 거의 필요 없다고 주장한다(주장은 논문 저자의 것).
- 기본값: Ruder 는 β₁ = 0.9, β₂ = 0.999, ε = 1e-8 을 제안값으로 적는다. d2l 은 ε = 1e-6, 실험 η = 0.01 을 쓴다. ε 를 제곱근 안에 넣는지 밖에 넣는지도 RMSProp(안)과 Adam(밖)이 d2l 에서 다르다. **구현·교재마다 ε 의 위치와 값이 다르다.**
- 모멘텀 β=0.9 이면 최근 약 10 개 기울기를 평균하는 셈이고(1/(1−β)), RMSProp 의 γ=0.9 도 약 10 단계 기억(d2l).
- 모멘텀의 수렴 조건(볼록 이차함수, 곡률 λ): `0 < ηλ < 2 + 2β`. GD 의 `0 < ηλ < 2` 보다 넓다(d2l).
- Ruder 의 결론: 희소 데이터에는 적응형 방법(Adagrad·RMSprop·Adam)이 낫고, RMSprop·Adadelta·Adam 이 비슷하게 동작하며 Adam 이 "전체적으로 최선일 수 있다"고 쓴다. 순수 SGD + 학습률 감쇠도 좋은 해에 닿지만 느리고 초기화·스케줄에 민감하다. 이 평가는 2016 년 개관이며 이후 연구는 확인하지 않았다.

**직접 계산 — 조건수가 나쁜 문제.** f = 0.1x₁² + 2x₂², 시작 (−5, −2), 20 번 갱신.

| 방법 | 결과 (x₁, x₂) |
| --- | --- |
| GD, η = 0.4 | (−0.94, −0.0001): x₂ 는 수렴, x₁ 은 느림 |
| GD, η = 0.6 | x₂ ≈ −1673: **발산** |
| 모멘텀 η = 0.6, β = 0.5 | (0.0072, 0.0026): 둘 다 수렴 |

(d2l 본문 수치와 일치.) 같은 문제에서 Adam(η=0.1, β₁=0.9, β₂=0.999, ε=1e-8, 위 표의 식을 직접 구현)은 200 번 후 (≈0.0001, ≈−0.0001). Adam 의 첫 갱신 크기는 기울기 크기 1e-3, 1, 1e3 에서 모두 ≈ η 로 같았다(편향 보정으로 `v̂/√ŝ ≈ ±1`). 이것이 "기울기 스케일에 둔감"의 한 모습이다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 손실 함수 vs 평가 지표 | 학습에서 줄이는 값 vs 보고하는 값. 같을 수도, 다를 수도 |
| 에폭 vs 반복(iteration) | 에폭 = 전체 1회 통과, 반복 = 갱신 1회(= 데이터 수 ÷ 배치 크기 번이 1 에폭) |
| 배치 GD vs "배치 크기" | 배치 GD 는 전체 사용, 미니배치의 배치 크기는 그 일부(용어 혼용 주의) |
| 학습률 vs 규제 강도 | 둘 다 하이퍼파라미터지만 학습률은 이동 보폭, 규제는 목적 함수 자체를 바꿈 |
| 정규화(규제) vs 정규화(척도) | 규제는 손실에 벌점, 척도 정규화는 입력 변환. 기울기 방법은 변수 척도에 민감 → [척도 변환](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/) |

## 언제 쓰나 / 주의

- 경사 기반 학습은 손실이 (거의 모든 곳에서) 미분 가능해야 한다. 신경망 구조와 기울기 계산은 [MLP·역전파](/develop-wiki/knowledge/machine-learning/neural-network-mlp-backpropagation-activation/), 배치 정규화·드롭아웃 등은 [딥러닝 학습 기법](/develop-wiki/knowledge/machine-learning/deep-learning-training-batchnorm-dropout/).
- 처음엔 Adam 같은 적응형 기본값을 쓰고, 학습률부터 조정하는 것이 흔한 출발점이다(필자 정리, 원문 권고는 Ruder 의 "Adam 이 전체적으로 최선일 수 있다" 수준).
- 학습 손실이 줄지 않으면 학습률·배치 크기·기울기 폭주/소실·데이터 척도를 의심한다.
- 시드·초기화에 따라 비볼록 문제의 최종 해가 달라진다. 비교는 여러 시드로.

## 검증 범위

- 읽음: d2l 12장(최적화 개요·볼록성·GD·SGD·모멘텀·RMSProp·Adam 절), Ruder 2016 개관 본문, Kingma & Ba arXiv 초록, sklearn 모델 평가 문서(MSE/MAE 절).
- **Adam 원 논문의 Algorithm 1 본문은 읽지 못했다**(HTML·PDF 추출 불가). 갱신식은 d2l 표기를 따랐고 기본값 일부는 Ruder 의 서술이다. 원 논문의 α 기본값과 ε 위치는 미확인.
- sklearn 의 힌지·로그 손실 절 본문은 읽지 못함(함수 출력으로 값만 대조). 볼록성 증명 외에 "선형·로지스틱 회귀 손실이 볼록"은 이 노트에서 출처 확인 안 함.
- 직접 계산: 학습률 표, 모멘텀·Adam 비교, 손실 값, 배치별 기울기 분산(Python 3.15, numpy 2.5.5). 딥러닝 프레임워크 옵티마이저(PyTorch 등)는 실행하지 않았다.

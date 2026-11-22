---
title: 딥러닝 학습 기법 — 배치 정규화·드롭아웃·초기화·규제
aka: [Batch Normalization, Dropout, Weight Decay, Early Stopping, Xavier/He Initialization, Gradient Clipping, Transfer Learning, Fine-tuning, Epoch, Batch, Iteration]
category: machine-learning
group: deep-learning
level: intermediate
summary: 신경망 학습을 안정시키고 과대적합을 줄이는 기법(배치 정규화, 드롭아웃, 가중치 감쇠, 조기 종료, 초기화, 기울기 클리핑, 학습률 스케줄, 증강, 전이학습)과 에폭·배치·이터레이션 용어를 구분한다.
tags: [deep-learning, batch-norm, dropout, regularization, initialization, gradient-clipping, transfer-learning]
related: [machine-learning/deep-learning-architectures-cnn-rnn-transformer-terms, machine-learning/overfitting-bias-variance-regularization, machine-learning/gradient-descent-loss-optimizers, machine-learning/neural-network-mlp-backpropagation-activation, machine-learning/hyperparameter-tuning-search]
sources:
  - https://arxiv.org/abs/1502.03167
  - https://jmlr.org/papers/v15/srivastava14a.html
  - https://d2l.ai/chapter_multilayer-perceptrons/dropout.html
  - https://d2l.ai/chapter_multilayer-perceptrons/numerical-stability-and-init.html
  - https://d2l.ai/chapter_linear-regression/weight-decay.html
  - https://d2l.ai/chapter_convolutional-modern/batch-norm.html
  - https://d2l.ai/chapter_optimization/lr-scheduler.html
  - https://d2l.ai/chapter_computer-vision/fine-tuning.html
  - https://d2l.ai/chapter_computer-vision/image-augmentation.html
  - https://d2l.ai/chapter_linear-regression/linear-regression-scratch.html
  - https://arxiv.org/abs/1211.5063
  - https://arxiv.org/abs/1502.01852
  - https://docs.pytorch.org/docs/2.15/nn.init.html
updatedAt: 2026-11-23
---

## 개요

깊은 신경망은 두 가지로 어렵다. (1) 층을 거치며 기울기가 사라지거나 폭발해 학습이 안 되고, (2) 매개변수가 많아 훈련 데이터에 과대적합된다. 이 노트의 기법은 (1) 안정화(초기화, 배치 정규화, 기울기 클리핑, 학습률 스케줄)와 (2) 일반화(드롭아웃, 가중치 감쇠, 조기 종료, 데이터 증강, 전이학습)로 나뉜다. 일반 개념은 [과대적합·규제](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/), 최적화 알고리즘은 [경사하강법](/develop-wiki/knowledge/machine-learning/gradient-descent-loss-optimizers/) 을 본다.

## 시험 범위 대응

빅데이터분석기사 3과목 "딥러닝 분석", 4과목 "과대적합 방지·매개변수 최적화" 와 연결된다. 배치 정규화·드롭아웃 같은 개별 기법명은 공식 출제범위 항목에 직접 나오지 않는다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 에폭 | epoch | 훈련 데이터 전체를 한 번 훑는 단위 |
| 배치(미니배치) | (mini)batch | 한 번의 매개변수 갱신에 쓰는 훈련 예제 묶음 |
| 배치 크기 | batch size | 미니배치 하나의 예제 수 |
| 이터레이션 | iteration | 미니배치 하나로 기울기를 계산해 갱신하는 1회 단계 |
| 배치 정규화 | batch normalization | 미니배치 통계로 층 입력을 표준화한 뒤 학습되는 γ, β 로 크기·이동을 조정 |
| 드롭아웃 | dropout | 학습 중 유닛을 확률 p 로 무작위 제거 |
| 가중치 감쇠 | weight decay | 가중치 크기를 제한. L2 규제와 같은 벌점 |
| 조기 종료 | early stopping | 검증 오차가 개선되지 않으면 학습을 멈추고 최적 시점의 매개변수를 쓰는 방법 |
| 기울기 클리핑 | gradient clipping | 기울기 노름이 임계값을 넘으면 크기를 줄이는 처리 |
| 전이학습 | transfer learning | 큰 데이터로 사전학습한 모형을 다른 과제에 재사용 |
| 미세조정 | fine-tuning | 사전학습 매개변수를 작은 학습률로 목표 데이터에 맞춰 추가 학습 |

## 에폭·배치·이터레이션

d2l 기준으로 한 에폭은 훈련 데이터 전체를 한 번 쓰는 것이고, 미니배치마다 손실·기울기를 구해 한 번 갱신한다. 에폭 수와 학습률은 하이퍼파라미터다([튜닝](/develop-wiki/knowledge/machine-learning/hyperparameter-tuning-search/)). 에폭당 이터레이션 수는 `예제 수 / 배치 크기`이고, 나누어떨어지지 않으면 마지막 작은 배치를 쓰느냐 버리느냐에 따라 올림 또는 내림이다(d2l 은 나누어떨어진다고 가정하며, 올림·내림 처리는 프레임워크 설정의 문제로 이 노트에서는 공식 문서를 확인하지 않았다).

- 예: 1,050 건, 배치 100 → 에폭당 11 이터레이션(마지막 50건 배치 포함) 또는 10(버림). 10 에폭이면 110 또는 100.

## 안정화 기법

**초기화.** d2l 은 역전파가 층별 행렬을 곱하므로 기울기가 0 으로 사라지거나 한없이 커질 수 있다고 설명한다. 시그모이드는 입력이 매우 크거나 작으면 기울기가 거의 0 이다. 모든 가중치를 같은 값으로 시작하면 같은 층의 유닛이 똑같이 움직여 하나처럼 된다(대칭), 그래서 무작위 초기화가 필요하다.

- Xavier/Glorot(Glorot & Bengio 2010): 분산 `2 / (n_in + n_out)`. 순전파는 1/n_in, 역전파는 1/n_out 을 요구하므로 절충한 값(d2l).
- He/Kaiming(He 등 2015): ReLU 계열을 반영해 유도. PyTorch 문서의 `kaiming_normal_` 은 std = gain/√fan(기본 fan_in)이며 ReLU 의 gain 값(√2)은 이 문서 페이지에서 직접 확인하지 못했다. 논문 본문도 읽지 못했다(초록만).

**배치 정규화**(Ioffe & Szegedy 2015). 초록은 층 입력 분포가 앞 층 매개변수 변화로 계속 달라지는 문제(내부 공변량 이동)를 줄이려 층 입력을 정규화한다고 한다. 보고된 효과는 더 큰 학습률 허용, 초기화 민감도 감소, 규제 효과다. d2l 식: `BN(x) = γ ⊙ (x − μ_B) / σ_B + β` (σ_B² 에 작은 ε 가 더해짐).

- 학습 때는 현재 미니배치 통계, 예측 때는 학습 후(구현에서는 학습 중 이동평균으로) 모은 고정 통계를 쓴다. 드롭아웃처럼 **두 모드의 동작이 다르다**.
- 합성곱 층은 채널별로 배치와 공간 위치 전체에서 통계를 구한다.
- 배치 크기 1 인 완전연결층에서는 평균을 빼면 전부 0 이 되어 학습이 안 된다(d2l). 배치에 독립적인 layer normalization 이 대안이다.
- d2l 은 "내부 공변량 이동 감소"가 효과의 타당한 설명이 아닌 것으로 보인다고 쓴다. 효과의 실제 기제는 이 노트에서 더 확인하지 않았다.

**기울기 클리핑**(Pascanu, Mikolov, Bengio 2013). 초록은 RNN 의 기울기 폭발에 대해 기울기 노름 클리핑을 제안한다고 한다. 임계값 c 를 넘으면 `g ← g · c/‖g‖` 로 방향은 유지하고 크기만 줄이는 형태가 일반적이다(식은 직접 계산 절 참고, 논문 본문 대조 안 함). 기울기 소실에는 같은 논문이 정규화 항(soft constraint)을 제안하고, 구조적으로는 [LSTM·GRU](/develop-wiki/knowledge/machine-learning/deep-learning-architectures-cnn-rnn-transformer-terms/) 가 쓰인다.

**학습률 스케줄**(d2l). 고정 학습률은 크면 발산, 작으면 느리거나 나쁜 해에 머문다. 종류: 인자(factor) 감쇠, 정해진 에폭에서 줄이는 다단계(multi-factor), 코사인 감쇠, 웜업(초기에 학습률을 서서히 올림). d2l 은 코사인이 항상 낫지는 않다고 쓴다.

## 일반화 기법

**드롭아웃**(Srivastava 등 2014). 학습 중 유닛과 연결을 무작위로 제거해 유닛이 서로에 지나치게 의존하는 것을 막는다. 테스트 때는 가중치를 줄인 단일 전체 네트워크로 얇은 네트워크들의 평균을 근사한다(논문 초록). 현대 구현(d2l)은 반대로 학습 때 살아남은 활성값을 `h/(1−p)` 로 키워 기댓값을 유지하고(`E[h'] = h`), 테스트 때는 아무것도 하지 않는다. 두 방식은 스케일을 맞추는 시점만 다르다. d2l 예시는 p = 0.5 이며, 입력층에 가까울수록 p 를 낮추는 것이 흔하다고 쓴다.

**가중치 감쇠.** 손실에 `(λ/2)‖w‖²` 를 더한다(d2l). SGD 갱신은 `w ← (1 − ηλ) w − η·기울기` 형태로 매 단계 w 를 0 쪽으로 줄인다. L2 규제와 같은 벌점이지만 옵티마이저에 따라 정확히 동치는 아닐 수 있다(d2l). 편향은 보통 규제하지 않는다. L1 은 일부 가중치를 0 으로 만들어 변수 선택 성격이 있다.

**조기 종료.** 검증 오차가 일정 횟수(patience) 동안 개선되지 않으면 멈추고 최적 시점의 매개변수를 쓴다. 검증 집합이 필요하다. Goodfellow 등 *Deep Learning* 7장에서 가져온 설명이나 해당 페이지가 잘려 읽혀 **세부 서술은 미확인**이다.

**데이터 증강.** 훈련 이미지에 뒤집기·자르기·색 변화를 무작위로 적용해 학습 예제를 다양하게 한다(d2l). 보통 **훈련 데이터에만** 적용하고 평가는 무작위 없이 한다.

**전이학습·미세조정**(d2l 절차). (1) 큰 데이터로 원천 모형 사전학습 (2) 출력층을 뺀 구조·매개변수를 복사 (3) 목표 클래스 수에 맞는 새 출력층을 무작위 초기화 (4) 목표 데이터로 학습하되 복사된 층은 작은 학습률(출력층은 더 큰 학습률, 예: 10 배)로 미세조정. 복사된 층을 동결하는 방법도 있다. 목표 데이터가 적을 때 쓴다.

## 헷갈리는 구분

| 쌍 | 구분 |
| --- | --- |
| 배치 vs 에폭 | 배치는 한 번 갱신하는 묶음, 에폭은 전체 한 바퀴 |
| 배치 크기 vs 이터레이션 | 이터레이션 수 = 예제 수 / 배치 크기 |
| 정규화(normalization) 3종 | 입력 min-max 스케일링 / 배치 정규화(층 입력 표준화) / 규제(regularization, L1·L2). 모두 "정규화"로 번역될 수 있음 |
| 가중치 감쇠 vs 드롭아웃 | 감쇠는 값의 크기 제한, 드롭아웃은 유닛 무작위 제거 |
| 학습 모드 vs 평가 모드 | 배치 정규화·드롭아웃은 모드별 동작이 다르다 |
| 전이학습 vs 미세조정 | 전이학습은 재사용 전반, 미세조정은 사전학습 가중치를 추가 학습하는 방식 |

## 직접 계산

Python 3.15, numpy 2.5.5 (seed 고정, 값은 난수에 의존).

- 에폭·이터레이션: 60,000 건·배치 128 → 올림 469, 버림 468. 1,050 건·배치 100·10 에폭 → 110(올림).
- 드롭아웃 스케일링: h = 2.0 인 활성 100만 개, p = 0.3 → 제거 비율 0.29999, 스케일 후 평균 2.00003, 스케일 안 하면 1.40(= 2.0·0.7). 스케일링이 기댓값을 유지함을 확인.
- 초기화 실험(폭 256 의 50층 순전파, 입력 표준정규 512 행, 출력 표준편차): ReLU 에서 σ=0.01 → 2.5e-48, Xavier(√(2/(n+n))) → 1.1e-08, He(√(2/n)) → 0.63, 표준정규(σ=1) → 1.0e+53. tanh 에서는 Xavier 0.091, He 0.56. ReLU 에는 He 가 층을 거쳐도 크기를 유지했다(이 설정에서의 결과이며 일반 증명이 아님).
- 시그모이드 도함수 최댓값이 0.25 이므로 10 개 곱은 9.5e-07 로 줄어든다.
- 클리핑: 기울기 (3, 4) 의 노름 5, c=1 → (0.6, 0.8).
- 감쇠 계수: η=0.1, λ=0.01 → 단계당 0.999, 100 단계 뒤 0.905.

## 언제 쓰나 / 주의

- 깊은 CNN 은 배치 정규화, 과대적합에는 드롭아웃·가중치 감쇠·증강·조기 종료를 조합한다. 데이터가 적으면 전이학습이 첫 후보다.
- 배치 정규화는 배치 크기가 작거나 시퀀스 모형에서 문제가 될 수 있다. 추론 시 이동평균 통계가 학습 분포와 달라지면 성능이 떨어질 수 있다.
- BN 논문 초록은 배치 정규화가 규제 효과가 있어 경우에 따라 드롭아웃이 불필요할 수 있다고 한다. 항상 그런 것은 아니므로 검증 점수로 확인한다.
- 기법을 하나씩 넣고 검증 점수로 확인한다. 증강·전이학습은 검증 데이터에 누수가 없게 분할 후 적용 → [데이터 분할·누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/).
- 훈련 시 검증 집합을 조기 종료에 쓰면 그 집합으로 낸 점수는 낙관적이다. 최종 평가는 따로 둔 테스트 집합으로 한다.

## 검증 범위

- 읽은 것: Ioffe & Szegedy 초록, Srivastava 등 JMLR 초록, Pascanu 등 초록, He 등 초록(arXiv 1502.01852), d2l 의 드롭아웃·수치 안정성/초기화·가중치 감쇠·배치 정규화·학습률 스케줄·미세조정·이미지 증강·선형회귀 구현 절, PyTorch `nn.init` 문서.
- 읽지 못한 것: 각 논문 본문(He 논문 PDF 는 텍스트 추출 실패), Glorot & Bengio 원문, Goodfellow 등 7.8 절 본문(페이지 잘림 — 조기 종료 서술은 불완전 확인).
- 미확인: He 초기화 분산 `2/n` 의 논문 내 표기, 기울기 클리핑 식의 논문 내 정확한 형태, 에폭당 이터레이션의 올림·내림 기본 동작, 코사인 감쇠 수식.
- 실행은 numpy 시뮬레이션만이며 딥러닝 프레임워크 학습은 실행하지 않았다.

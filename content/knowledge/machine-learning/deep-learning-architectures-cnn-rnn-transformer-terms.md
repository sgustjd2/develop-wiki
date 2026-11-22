---
title: 딥러닝 구조별 용어 — CNN·RNN·트랜스포머·생성 모형
aka: [CNN, RNN, LSTM, GRU, Transformer, Autoencoder, VAE, GAN, Convolutional Neural Network]
category: machine-learning
group: deep-learning
level: intermediate
summary: 합성곱 신경망(CNN)·순환 신경망(RNN, LSTM, GRU)·어텐션 기반 트랜스포머·오토인코더/VAE/GAN 의 핵심 용어와 구조 차이를, 출력 크기 식을 직접 검산해 정리한다.
tags: [deep-learning, cnn, rnn, lstm, gru, transformer, attention, gan, autoencoder]
related: [machine-learning/neural-network-mlp-backpropagation-activation, machine-learning/deep-learning-training-batchnorm-dropout, machine-learning/text-mining-tfidf-tokenization, machine-learning/gradient-descent-loss-optimizers]
sources:
  - https://d2l.ai/chapter_convolutional-neural-networks/why-conv.html
  - https://d2l.ai/chapter_convolutional-neural-networks/padding-and-strides.html
  - https://d2l.ai/chapter_convolutional-neural-networks/pooling.html
  - https://d2l.ai/chapter_recurrent-modern/lstm.html
  - https://d2l.ai/chapter_recurrent-modern/gru.html
  - https://d2l.ai/chapter_attention-mechanisms-and-transformers/attention-scoring-functions.html
  - https://arxiv.org/abs/1706.03762
  - https://arxiv.org/abs/1406.2661
  - https://arxiv.org/abs/1312.6114
updatedAt: 2026-11-23
---

## 개요

딥러닝 구조는 "입력의 어떤 성질을 가정하느냐"로 갈린다. CNN 은 이미지처럼 **이웃 값이 의미를 갖고 위치가 바뀌어도 같은 패턴**이라는 가정, RNN 은 **순서가 있는 데이터**, 트랜스포머는 순서 정보를 위치 표시로 넣되 **모든 위치쌍을 어텐션으로 직접 연결**하는 방식이다. 오토인코더·VAE·GAN 은 예측이 아니라 데이터의 표현·생성이 목적이다. 이 노트는 용어를 구분하는 데 집중하고, 학습 기법은 [딥러닝 학습 기법](/develop-wiki/knowledge/machine-learning/deep-learning-training-batchnorm-dropout/), 기본 MLP 는 [신경망·역전파](/develop-wiki/knowledge/machine-learning/neural-network-mlp-backpropagation-activation/) 를 본다.

## 시험 범위 대응

빅데이터분석기사 3과목 "분석기법 적용 → 고급 분석기법 → 딥러닝 분석", ADP 실기 "기계학습 영역" 에 대응한다(항목명만 있고 세부 구조 목록은 공식 범위에 없음).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 합성곱 | convolution | 작은 가중치 배열을 입력 위에 밀며 겹치는 값의 가중합을 구하는 연산. 딥러닝 라이브러리의 "합성곱"은 엄밀히는 커널을 뒤집지 않는 상호상관(cross-correlation)이다 |
| 필터·커널 | filter, kernel | 학습되는 가중치 배열. 같은 커널을 모든 위치에 재사용한다 |
| 특성 맵 | feature map | 은닉 표현의 한 채널. 공간 위치마다 학습된 특성 값을 가진 2차원 격자 |
| 채널 | channel | 텐서의 세 번째 축(RGB 등). 은닉층에도 채널이 있다 |
| 패딩 | padding | 입력 가장자리에 (보통 0 인) 값을 덧붙여 출력이 줄어드는 것을 막는 처리 |
| 스트라이드 | stride | 커널이 한 번에 이동하는 행·열 수. 1 보다 크면 출력 해상도가 줄어든다 |
| 풀링 | pooling | 창(window) 안의 값을 최댓값(max) 또는 평균(average)으로 요약. 학습 가중치가 없고 채널별로 따로 적용된다 |
| 은닉 상태 | hidden state | RNN 이 시점마다 갱신해 넘기는 요약 벡터 |
| 게이트 | gate | 0~1 값(시그모이드)으로 정보를 얼마나 통과시킬지 곱해 조절하는 장치 |
| 어텐션 | attention | 질의(query)와 키(key)의 유사도로 가중치를 만들어 값(value)의 가중 평균을 구하는 연산 |
| 인코더·디코더 | encoder, decoder | 입력을 잠재 표현으로 압축하는 부분 / 잠재 표현에서 출력을 복원·생성하는 부분 |
| 잠재 공간 | latent space | 오토인코더 등이 데이터를 압축해 표현하는 저차원 공간 |

## CNN

d2l 은 합성곱을 두 가정에서 도출한다. 위치가 달라도 같은 패턴은 같은 반응을 내야 한다(**평행이동 불변성**, d2l 용어. 엄밀하게는 입력이 이동하면 표현도 같이 이동하는 equivariance 에 가깝다)와 앞쪽 층은 좁은 이웃만 봐야 한다(**지역성**). 완전연결층에 이 두 제약을 걸면 같은 커널을 재사용하는 합성곱이 되어 매개변수가 크게 준다.

**출력 크기 식** (d2l 표기: 입력 n, 커널 k, 전체 패딩 p, 스트라이드 s, 높이·너비 각각):

`출력 = floor((n − k + p + s) / s)`

흔한 교재 표기는 한쪽 패딩을 P 로 쓴 `floor((n − k + 2P)/s) + 1` 이며 p = 2P 이면 같은 식이다.

- 스트라이드 1 에서 p = k − 1 이면 크기가 유지된다("same" 패딩). 커널이 홀수이면 양쪽 대칭 패딩이 가능하다.
- 풀링은 채널 수를 바꾸지 않는다. 출력 채널 수 = 입력 채널 수. 풀링 창을 스트라이드 기본값으로 쓰는 프레임워크가 많다(d2l 설명).
- 특성 맵 하나는 필터 하나가 만든다. 출력 채널 수 = 필터 개수.

## RNN·LSTM·GRU

**RNN** 은 시점 t 의 은닉 상태를 입력 x_t 와 이전 은닉 상태 h_(t−1) 로 계산해 순서를 처리한다. 긴 순서에서는 시간을 거슬러 기울기를 곱하는 과정에서 기울기가 사라지거나 폭발하기 쉽다(→ [학습 기법](/develop-wiki/knowledge/machine-learning/deep-learning-training-batchnorm-dropout/)).

**LSTM**(Hochreiter & Schmidhuber, 1997, *Neural Computation*; d2l 도 이렇게 소개)은 기억 셀 C_t 를 두고 세 게이트가 제어한다(d2l 식).

- 입력 게이트 I_t: 후보 값을 얼마나 셀에 더할지
- 망각 게이트 F_t: 이전 셀을 얼마나 유지할지
- 출력 게이트 O_t: 셀이 출력에 얼마나 영향을 줄지
- 후보 셀 `C~_t = tanh(…)`, 셀 `C_t = F_t ⊙ C_(t−1) + I_t ⊙ C~_t`, 은닉 상태 `H_t = O_t ⊙ tanh(C_t)`

**GRU** 는 게이트를 둘로 줄인다(d2l 식). 리셋 게이트 R_t 가 후보 계산에서 과거를 얼마나 쓸지, 업데이트 게이트 Z_t 가 `H_t = Z_t ⊙ H_(t−1) + (1 − Z_t) ⊙ H~_t` 로 과거 유지와 후보 교체의 비율을 정한다. 별도 기억 셀이 없다.

## 어텐션·트랜스포머

- Vaswani 등(2017, arXiv 1706.03762)의 트랜스포머는 **순환과 합성곱을 쓰지 않고 어텐션만으로** 시퀀스 변환 모형을 구성했다.
- 스케일드 닷 프로덕트 어텐션(d2l 식): `softmax(Q Kᵀ / √d) V`. Q·K 가 평균 0 분산 1 이고 독립이면 내적의 분산이 d 이므로 √d 로 나눠 소프트맥스 입력 크기를 제어한다.
- 장점은 모든 위치쌍을 한 층에서 직접 연결해 순차 계산 의존이 없다는 점이고, 비용은 위치쌍 수에 비례하는 연산·메모리(시퀀스 길이 제곱)다. 후자는 일반적 성질로 이해하되 본 노트에서 원문 확인은 하지 않았다.

## 오토인코더·VAE·GAN

- **오토인코더**: 입력을 잠재 표현으로 압축(인코더)했다 복원(디코더)하도록 학습한다. 차원 축소·노이즈 제거·이상 탐지에 쓰인다. 정답 라벨이 필요 없다.
- **VAE**(Kingma & Welling, 2013, "Auto-Encoding Variational Bayes"): 연속 잠재변수를 가진 확률 모형에서 변분 하한을 **재매개변수화**해 확률적 경사법으로 최적화하는 방법. 잠재 공간에서 표본을 뽑아 새 데이터를 생성할 수 있다.
- **GAN**(Goodfellow 등, 2014): 생성자 G 와 판별자 D 가 minimax 게임을 한다. 이상적 균형은 G 가 학습 분포를 재현하고 D 가 모든 입력에 1/2 을 출력하는 경우다(논문 초록).

## 헷갈리는 구분

| 쌍 | 구분 |
| --- | --- |
| 합성곱 vs 상호상관 | 수학적 합성곱은 커널을 뒤집는다. 라이브러리는 뒤집지 않지만 이름은 합성곱 |
| 패딩 P(한쪽) vs p(전체) | 식에 따라 `2P` 또는 `p`. 표기 확인 필수 |
| 은닉 상태 vs 기억 셀 | LSTM 에는 둘 다 있고 GRU·RNN 에는 은닉 상태뿐 |
| 오토인코더 vs VAE | VAE 는 잠재 표현을 확률분포로 다루고 생성에 쓴다 |
| 특성 맵 vs 필터 | 필터는 가중치, 특성 맵은 그 필터를 입력에 적용한 결과 |

## 직접 계산

Python 3.15, numpy 2.5.5 로 직접 계산했다(딥러닝 프레임워크는 쓰지 않음).

- d2l 출력 크기 식을 패딩한 입력 위로 창을 밀며 세는 방식과 비교: 임의 조건(n 5~40, k 1~5, p 짝수 0~6, s 1~4) 2000 개에서 불일치 0건. 예: n=224, k=7, p=6, s=2 → 112. n=8, k=3, s=3 → 2.
- 파라미터 수: 3→16 채널 3×3 합성곱은 16·3·3·3+16 = 448 개. 32×32×3 입력을 32×32×16 으로 보내는 완전연결층은 50,348,032 개.
- 4×4 입력과 2×2 커널 [[1,0],[0,−1]] 의 상호상관 출력 3×3 을 손으로 확인(첫 칸 1·1+1·(−1)=0).
- 표준정규 난수 d=64 에서 내적 분산 63.98, √d 로 나눈 뒤 0.9996 (seed 0, 표본 10만). 소프트맥스 가중치 행의 합은 1.

## 언제 쓰나 / 주의

- 이미지·격자 구조: CNN. 시계열·텍스트: 과거에는 RNN 계열, 현재 대규모 모형은 트랜스포머가 흔하다. 소규모 정형 데이터는 딥러닝보다 [트리 앙상블](/develop-wiki/knowledge/machine-learning/ensemble-bagging-boosting-stacking/) 이 대안이 된다.
- 딥러닝은 데이터·연산 비용이 크고 해석이 어렵다 → [모형 해석](/develop-wiki/knowledge/machine-learning/model-interpretation-feature-importance-shap-pdp/).
- 풀링을 쓰면 위치 정보가 거칠어진다. 층·필터 수·패딩 선택은 경험적이다.
- GAN 은 학습이 불안정할 수 있다(논문의 minimax 구조에서 오는 일반적 어려움으로 알려져 있으나 본 노트에서 원문 확인하지 않음).

## 검증 범위

- d2l.ai 의 위 6개 페이지(합성곱 동기, 패딩·스트라이드, 풀링, LSTM, GRU, 어텐션 점수 함수)와 arXiv 초록 3건(Vaswani 2017, Goodfellow 2014, Kingma & Welling 2013)을 읽었다. 원 논문 본문(LSTM 원문 포함)은 읽지 않았다.
- 미확인: LSTM 1997 원 논문의 원래 구조(이 노트의 식은 d2l 의 현대형이며 1997 년 원형과 같은지는 확인하지 않았다. 망각 게이트는 후속 연구(Gers 등 2000)에서 추가된 것으로 알려져 있으나 이것도 2차 확인이다), 트랜스포머의 다중 헤드·위치 인코딩 세부, 오토인코더 정의의 1차 출처(d2l 해당 장 미확인), GAN 학습 불안정성의 원문 근거.

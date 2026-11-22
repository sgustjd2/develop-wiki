---
title: 신경망·다층 퍼셉트론과 역전파 (MLP, Backpropagation)
aka: [Multilayer Perceptron, MLP, Artificial Neural Network, ANN, Perceptron, Backpropagation, Activation Function, 인공신경망, 다층 퍼셉트론]
category: machine-learning
group: supervised
level: intermediate
summary: 가중합과 비선형 활성화를 층층이 쌓아 비선형 함수를 학습하는 모형이다. 순전파로 예측하고 역전파(연쇄 법칙)로 기울기를 구해 가중치를 갱신하며, 출력층 활성화는 문제 유형이 정한다.
tags: [neural-network, mlp, perceptron, backpropagation, activation, relu, softmax, universal-approximation, supervised]
related: [machine-learning/gradient-descent-loss-optimizers, machine-learning/deep-learning-architectures-cnn-rnn-transformer-terms, machine-learning/deep-learning-training-batchnorm-dropout, machine-learning/overfitting-bias-variance-regularization, machine-learning/svm-margin-kernel, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/logistic-regression-odds-ratio]
sources:
  - https://scikit-learn.org/stable/modules/neural_networks_supervised.html
  - https://d2l.ai/chapter_multilayer-perceptrons/mlp.html
  - https://d2l.ai/chapter_multilayer-perceptrons/backprop.html
  - https://en.wikipedia.org/wiki/Universal_approximation_theorem
updatedAt: 2026-11-23
---

## 개요

- 퍼셉트론은 입력의 가중합에 임계 함수를 씌워 두 클래스를 가르는 가장 단순한 신경망이다. 직선(초평면) 하나로만 가를 수 있다.
- 다층 퍼셉트론(MLP)은 입력층 → 은닉층(하나 이상) → 출력층으로 연결하고, 각 뉴런이 `활성화(Σ w·x + b)` 를 계산한다. 비선형 활성화가 층 사이에 있어야 선형 모형을 넘는다. 활성화 없이 선형 층만 쌓으면 합성도 하나의 선형 변환이라 얻는 것이 없다(d2l).
- 학습은 손실을 줄이는 방향으로 가중치를 갱신하는 일이고, 기울기는 역전파로 효율적으로 구한다.

## 시험 범위 대응

- 빅데이터분석기사 3과목 > 분석기법 적용 > 인공신경망(및 고급 분석기법 > 딥러닝 분석), ADsP·ADP 데이터분석 > 정형 데이터 마이닝 > 분류분석, ADP 실기 > 모델 구축·초매개변수 조율.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 가중치 / 편향 | weight / bias | 입력에 곱하는 학습 계수 / 더하는 상수 항. sklearn 은 `coefs_`, `intercepts_` |
| 은닉층 | hidden layer | 입력과 출력 사이에서 표현을 학습하는 층 |
| 활성화 함수 | activation function | 가중합에 적용하는 비선형 함수 |
| 순전파 | forward propagation | 입력에서 출력 방향으로 중간값과 손실을 순서대로 계산 |
| 역전파 | backpropagation | 출력에서 입력 방향으로 연쇄 법칙을 적용해 모든 가중치의 기울기를 계산 |
| 손실(비용) 함수 | loss | 예측과 정답의 차이를 재는 값(분류 교차 엔트로피, 회귀 제곱 오차 등) |
| 기울기 소실 | vanishing gradient | 층을 거슬러 갈수록 기울기가 0 에 가까워져 앞쪽 층이 학습되지 않는 현상 |
| 에포크 | epoch | 훈련 데이터 전체를 한 번 훑는 단위 (용어 정의, 이 노트 출처에는 없음) |
| 가중치 감쇠 / L2 규제 | weight decay / alpha | 가중치 제곱합에 벌점을 부과. sklearn 은 `alpha` |

## 활성화 함수와 출력층

| 함수 | 식 | 범위 | 특징 (d2l 서술 기준) |
| --- | --- | --- | --- |
| 시그모이드 | `1/(1+e^−z)` | (0, 1) | 미분 최댓값 0.25, 양쪽 끝에서 기울기가 0 에 가까움. 은닉층에서는 ReLU 로 대체되는 추세. 이분류 출력 확률에는 쓰임 |
| tanh | `(e^z − e^−z)/(e^z + e^−z)` | (−1, 1) | 원점 대칭. 미분 `1 − tanh²` 최댓값 1 |
| ReLU | `max(0, z)` | [0, ∞) | 미분이 0 또는 1. 기울기 소실을 줄여 최적화가 쉬움 |
| 소프트맥스 | `e^{z_i} / Σ_l e^{z_l}` | 합이 1 | 다중 클래스 출력용 |
| 항등 | `z` | 실수 | 회귀 출력용 |

**출력층 선택(sklearn MLP 문서):** 이분류는 로지스틱(0.5 임계), 다중 클래스는 소프트맥스, 회귀는 항등. 다중 레이블은 클래스별 로지스틱을 쓴다. 분류 손실은 교차 엔트로피, 회귀 손실은 제곱 오차(둘 다 L2 항 `α/(2n)·‖W‖²` 포함). 은닉층 활성화의 선택 인자는 API 문서에 있으나 이 노트에서는 확인하지 않았다(문서 절에는 tanh 식만 있었음).

## 순전파·역전파

d2l 의 은닉층 1개 MLP(가중치 감쇠 포함): `z = W1·x`, `h = φ(z)`, `o = W2·h`, 손실 `L = l(o, y)`, 규제 `s = (λ/2)(‖W1‖² + ‖W2‖²)`, 목적 `J = L + s`.

역전파는 출력에서 입력으로 연쇄 법칙을 적용한다:

- `∂J/∂W2 = (∂J/∂o)·hᵀ + λ·W2`
- `∂J/∂h = W2ᵀ·(∂J/∂o)`
- `∂J/∂z = (∂J/∂h) ⊙ φ'(z)`  (⊙ 는 원소별 곱)
- `∂J/∂W1 = (∂J/∂z)·xᵀ + λ·W1`

- 순전파에서 계산한 중간값을 역전파가 재사용하므로 훈련 중에는 저장해 두어야 한다. 그래서 훈련이 추론보다 메모리를 훨씬 쓰고, 층·배치가 클수록 부담이 커진다(d2l).
- 갱신은 경사 하강형: `W ← W − ε·∇Loss`. 최적화기(SGD·Adam·L-BFGS)의 차이는 [경사 하강법·최적화기](/develop-wiki/knowledge/machine-learning/gradient-descent-loss-optimizers/)에서 다룬다.
- 역전파를 널리 알린 문헌으로 Rumelhart, Hinton, Williams(1986)가 자주 인용된다. 이 노트에서는 그 원문을 읽지 않았다.

### 기울기 소실의 직관

- 역전파의 기울기에는 층마다 활성화 미분 `φ'` 가 곱해진다. 시그모이드는 `φ' ≤ 0.25` 라 층이 깊어질수록 곱이 급격히 작아진다. 산술만 보면 0.25^5 ≈ 1×10⁻³, 0.25^10 ≈ 1×10⁻⁶ (가중치 항은 무시한 상한 직관이며 실제 기울기 크기는 아니다).
- ReLU 는 양수 구간에서 `φ' = 1` 이라 이 곱이 줄지 않는다. 초기화·정규화 기법은 [딥러닝 학습 기법](/develop-wiki/knowledge/machine-learning/deep-learning-training-batchnorm-dropout/)에서 다룬다.

## 범용 근사 정리

- 정확한 조건 없이 "신경망은 무엇이든 근사한다"로 요약하면 오해다. 고전 결과(Cybenko 1989 등)의 요지: **은닉층 한 개**, 은닉 뉴런 수는 **충분히 많이**, 활성화는 일정 조건을 만족, 근사 대상은 **컴팩트 집합 위의 연속 함수**, 오차는 그 집합에서의 **균등 근사**(임의의 ε>0 에 대해 오차를 ε 아래로).
- 활성화 조건: Cybenko 는 시그모이드형을 다뤘고, Leshno 외(1993)는 활성화가 다항식이 아니면 성립한다고 보였다(Wikipedia 요약, 보조 출처).
- 정리는 **존재**만 말한다. 필요한 크기, 가중치를 찾는 방법(학습 가능성)은 보장하지 않으며, 훈련 구간 밖에서의 행동도 말하지 않는다. d2l 도 가중치 찾기가 어려운 부분이며 깊은 망이 더 적은 파라미터로 표현할 수 있는 경우가 많다고 쓴다.

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1).

**(1) XOR: 단일 퍼셉트론 vs MLP.** 입력 (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0.

| 모형 | 결과 |
| --- | --- |
| `Perceptron` (선형, 1000 에포크) | XOR 정확도 0.5 (AND 는 1.0) |
| `MLPClassifier((4,), tanh, lbfgs)` seed 0~5 | 6개 seed 모두 [0,1,1,0] 정확도 1.0 (이 작은 설정에서 확인된 것일 뿐 일반 보장은 아님) |
| 손으로 만든 ReLU 망 | 아래 |

손으로 만든 망: `h1 = ReLU(x1 + x2)`, `h2 = ReLU(x1 + x2 − 1)`, 출력 `o = h1 − 2·h2`. (0,0)→0, (0,1)→1, (1,0)→1, (1,1): h1=2, h2=1 → 2−2=0. 계산 결과 [0,1,1,0] 로 XOR 을 정확히 만든다. 단일 층 선형 모형은 한 직선으로 이 네 점을 가를 수 없고, 은닉층의 비선형이 이를 가능하게 한다.

**(2) 역전파 검산.** 은닉 3개 tanh, 출력 시그모이드, 교차 엔트로피(XOR 4점)로 `∂L/∂W1` 을 손으로 쓴 역전파 식으로 계산하고 중심 차분 수치 미분(ε=1e-6)과 비교: 최대 절댓값 차이 6.0×10⁻¹¹. 식이 맞다.

```python
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
clf = make_pipeline(StandardScaler(),
                    MLPClassifier(hidden_layer_sizes=(32, 16), alpha=1e-4, random_state=0))
```

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 퍼셉트론 vs MLP | 퍼셉트론은 단층 선형 분리기, MLP 는 은닉층+비선형으로 비선형 문제도 푼다 |
| 순전파 vs 역전파 | 순전파는 예측·손실 계산, 역전파는 그 손실의 기울기 계산. 가중치 갱신은 최적화기가 한다 |
| 활성화 vs 손실 | 활성화는 층 안의 함수, 손실은 출력과 정답을 비교하는 함수. 소프트맥스+교차 엔트로피가 흔한 짝 |
| 은닉층 많음 vs 노드 많음 | 범용 근사 정리는 한 층에 노드를 늘리는 쪽을 말하고, 실제로는 깊이를 늘리는 쪽이 효율적인 경우가 많다(d2l) |
| 정규화 3종 | `alpha`(L2 규제)·입력 표준화·배치 정규화는 서로 다른 것. 이름이 겹쳐 쓰이니 문맥으로 구분 |

## 언제 쓰나 / 주의

- 쓰는 곳: 특성 사이 복잡한 비선형 관계, 표 형태보다 이미지·음성·텍스트 같은 비정형(이 경우 보통 CNN·Transformer 구조) → [딥러닝 구조 용어](/develop-wiki/knowledge/machine-learning/deep-learning-architectures-cnn-rnn-transformer-terms/)
- 스케일링 필수: sklearn 문서는 MLP 가 특성 스케일에 민감하니 `StandardScaler` 를 훈련 데이터로 적합해 적용(파이프라인 권장)하라고 한다.
- 비볼록 손실: 은닉층이 있으면 극솟값이 여럿이라 무작위 초기값에 따라 검증 정확도가 달라진다(문서). 재현성을 위해 seed 를 고정하되, 여러 seed 로 분산을 본다.
- 하이퍼파라미터: 은닉 뉴런·층 수, 반복 횟수, `alpha`(보통 `10^−1 … 10^−6` 범위를 GridSearchCV 로 탐색하라는 문서 예). 작게 시작하라는 조언이 있다.
- 해석이 어렵고, 표 형식 데이터에서는 트리 앙상블이 더 낫거나 비슷한 경우도 흔하다(필자의 일반 경험, 이 노트에서 검증하지 않음) → [앙상블](/develop-wiki/knowledge/machine-learning/ensemble-bagging-boosting-stacking/)
- 솔버 선택(문서): 작은 데이터는 L-BFGS 가 빠르고 나은 해를 주는 경우가 많고, 큰 데이터에서는 Adam 이 견고하며, 잘 튜닝된 학습률의 SGD(모멘텀)가 더 나을 수도 있다. L-BFGS 는 미니배치 학습을 지원하지 않는다.
- 로지스틱 회귀는 은닉층이 없는 MLP 의 특수한 경우로 볼 수 있다(출력 시그모이드, 교차 엔트로피 손실. 구조적 관찰) → [로지스틱 회귀](/develop-wiki/knowledge/data-analytics/logistic-regression-odds-ratio/)

## 검증 범위

- 읽은 것: scikit-learn 사용자 가이드 "Neural network models (supervised)"(MLP 구조, 출력 활성화, 손실, 솔버, 스케일링·비볼록 경고), d2l.ai 의 MLP 절(은닉층 필요성, 범용 근사 서술, 활성화 함수)과 순전파·역전파 절, Wikipedia 범용 근사 정리 항목(조건 확인용 보조).
- 직접 계산: 단일 퍼셉트론 XOR 실패, MLP 6개 seed, 손으로 만든 ReLU 망, 역전파 수치 검증(Python 3.15, scikit-learn 1.9.1, numpy). 기울기 소실의 0.25^k 는 산술이며 실제 신경망 실험은 하지 않았다.
- 읽지 못한 것: Rumelhart 외(1986), Cybenko(1989)·Hornik(1991)·Leshno 외(1993) 원문, d2l 의 "수치 안정성과 초기화" 절(기울기 소실·폭주 서술). 범용 근사 조건은 Wikipedia 요약에 기댔다.
- 미확인: 은닉층 활성화 선택 인자와 기본값(API 문서 미열람), 에포크·배치 크기의 sklearn 인자 대응.

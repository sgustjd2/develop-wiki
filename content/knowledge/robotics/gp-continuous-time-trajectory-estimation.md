---
title: 가우시안 과정 연속시간 궤적 추정 — 정확히 희소한 정밀도 행렬 (Barfoot·Tong·Särkkä)
aka: [GP Continuous-Time Trajectory Estimation, Exactly Sparse Gaussian Process Regression, STEAM, GP Motion Prior, White-Noise-on-Acceleration Prior, Barfoot-Tong-Sarkka]
category: robotics
group: estimation
level: advanced
summary: 궤적을 시간을 변수로 하는 가우시안 과정으로 두고 선형 SDE 사전을 쓰면, 측정 시각들의 사전 공분산의 역행렬이 블록 3중대각이 된다. 그래서 연속시간 일괄 추정이 측정 수에 선형 비용으로 풀리고, 아무 시각이나 O(1) 로 보간한다.
tags: [robotics, slam, continuous-time, gaussian-process, sde, batch-estimation, sparse, motion-prior, steam]
related: [robotics/continuous-time-batch-estimation-temporal-basis, robotics/spline-fusion-se3-cumulative-bspline, robotics/continuous-time-spline-calibration-kalibr, robotics/factor-graph-slam-optimization, robotics/kalman-filter-ekf, robotics/rolling-shutter-camera-calibration-line-delay, robotics/imu-preintegration]
sources:
  - https://www.roboticsproceedings.org/rss10/p01.pdf
  - https://roboticsproceedings.org/rss10/p01.html
  - https://arxiv.org/abs/1412.0630
updatedAt: 2026-11-23
---

> 출처 메모: Barfoot·Tong·Särkkä, "Batch Continuous-Time Trajectory Estimation as Exactly Sparse Gaussian Process Regression"(RSS X, 2014)의 공개 PDF 전문(9쪽)과, 같은 계열의 확장 투고본 Anderson·Barfoot·Tong·Särkkä(arXiv 1412.0630)의 3.2절(비선형 SDE)·논의·결론을 읽었다. 아래 3·4번 계산은 내가 직접 한 것이다. SE(3) 위 확장과 이후 후속 연구, 출판본 서지는 읽지 못했다.

## 문제

- 롤링 셔터 카메라나 움직이며 스캔하는 라이다는 측정 시각이 전부 다르다. 이산 시각마다 자세를 두면 상태가 측정 수만큼 늘고, 모션 사전(prior)이 없으면 해가 유일하지 않을 수도 있다.
- [Furgale 등의 일괄 추정](/develop-wiki/knowledge/robotics/continuous-time-batch-estimation-temporal-basis/)은 궤적을 **고정 기저 함수**의 가중합으로 근사해 이 문제를 풀었다. 이 논문은 다른 길을 가는 쪽이다. 궤적 자체를 **비모수 가우시안 과정(GP)** 으로 두고 사전 분포로 부드러움을 준다.
- 문제는 비용이다. 희소성을 쓰지 않은 일반 GP 회귀는 측정 시각 M 개의 조밀한 커널 행렬을 풀어야 해서 `O(M³ + M²N)`(N: 추가 질의 시각 수)이 든다고 논문은 적는다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 궤적 GP | trajectory as GP | `x(t) ∼ GP(μ(t), K(t,t′))`, 독립변수가 시간 하나인 1차원 GP |
| 커널 행렬 | kernel matrix | 측정 시각 쌍의 사전 공분산 `K = [K(tᵢ,tⱼ)]` |
| 정밀도(역커널) 행렬 | inverse kernel matrix | `K⁻¹`. 희소하면 MAP 풀이가 빨라진다 |
| LTV SDE | linear time-varying SDE | `ẋ = A(t)x + v(t) + F(t)w(t)`, `w` 는 전력 밀도 `Q_C` 인 백색 잡음 |
| 마르코프 상태 | Markovian state | 현재만 알면 미래가 과거와 독립인 상태. 이 조건이 희소성의 전제 |
| 상수 속도 사전 | white-noise-on-acceleration | `p̈(t) = w(t)`. 상태는 `[p; ṗ]` 로 쌓아야 마르코프 |
| STEAM | simultaneous trajectory estimation and mapping | 이산 자세 사슬 대신 마르코프 궤적을 쓰는 SLAM 의 일반화 |

## 개념

### 1. 사전은 SDE 에서 나온다

사전을 커널 함수로 직접 고르는 대신, 상태가 따르는 선형 SDE `ẋ = A(t)x + v(t) + F(t)w(t)` 를 고른다. 해는 전이 행렬 `Φ` 로 `x(t) = Φ(t,t₀)x(t₀) + ∫Φ(t,s)(v + Fw)ds` 이고, 평균·공분산이 닫힌 꼴로 나온다. 측정 시각 `t₀<t₁<…<t_M` 에서 공분산은 `K = A Q Aᵀ` 로 인수분해된다(Lemma 1). `A` 는 `Φ(tᵢ,tⱼ)` 를 채운 하삼각 행렬, `Q = diag(K₀, Q₁, …, Q_M)` 이고 `Qᵢ = ∫Φ F Q_C Fᵀ Φᵀ ds` 는 구간 `[tᵢ₋₁, tᵢ]` 에서 쌓인 잡음 공분산이다.

### 2. 정밀도 행렬은 정확히 희소하다

`K⁻¹ = A⁻ᵀ Q⁻¹ A⁻¹` 이고 `A⁻¹` 은 주대각과 그 바로 아래 대각(`−Φ(tᵢ,tᵢ₋₁)`)만 0 이 아니다. `Q⁻¹` 은 블록 대각이므로 `K⁻¹` 는 **블록 3중대각**이다(Theorem 1). 근사가 아니라 정확하다. MAP 풀이의 정규방정식

`(K⁻¹ + CᵀR⁻¹C) δx* = K⁻¹(μ − x̄) + CᵀR⁻¹(y − g)`

는 희소 콜레스키로 반복당 `O(M)` 이다. 사전은 연속인데 최적화 항은 인접 상태 쌍마다 하나씩, 총 M+1 개뿐이다. 이산시간 때 쓰던 평활 항(Lu·Milios 류)과 같은 꼴이며, 논문의 기여는 그 항을 **연속시간 모델에서 원리적으로 유도**한다는 점이다. 측정 모델이 선형이면 이 풀이는 고전적 이산시간 평활기(칼만·RTS)와 같다고 논문은 적는다(증명은 생략).

### 3. 마르코프 상태를 써야 희소하다 (직접 계산)

상수 속도 사전의 상태는 위치만이 아니라 `[p; ṗ]` 여야 한다. 논문은 속도를 소거하면 희소성이 사라진다고 적는다. 이를 직접 확인했다. 불균등 시각 6 개(0, 0.7, 1.0, 2.2, 3.0, 3.4 s), `Φ(Δ) = [[1,Δ],[0,1]]`, `Qᵢ = Q_C[[Δ³/3, Δ²/2],[Δ²/2, Δ]]` 로 `K = AQAᵀ` 를 만들어 역행렬을 구했다.

- 위치+속도 상태: `K⁻¹` 의 2×2 블록 중 `|i−j| ≥ 2` 인 것은 전부 0 이었다(블록 3중대각).
- 위치 성분만 뽑은 `K` 의 역행렬: 모든 원소가 0 이 아니었다(조밀). 위치-위치 `K⁻¹` 의 (0,5) 원소가 −0.15 였다(Q_C=1, K₀=I 일 때. Q_C=3 이면 −0.058 로 값이 Q_C 에 의존한다).

### 4. 아무 시각이나 O(1) 보간 (직접 계산)

측정 사이 시각 `tᵢ ≤ τ < tᵢ₊₁` 에서 GP 보간 `x̄(τ) = μ(τ) + K(τ)K⁻¹(x̄ − μ)` 의 `K(τ)K⁻¹` 는 블록 열이 정확히 둘(`tᵢ`, `tᵢ₊₁`)뿐이다.

`x̄(τ) = μ(τ) + Λ(τ)(x̄ᵢ − μᵢ) + Ψ(τ)(x̄ᵢ₊₁ − μᵢ₊₁)`, `Ψ = Q_τ Φ(tᵢ₊₁,τ)ᵀ Qᵢ₊₁⁻¹`, `Λ = Φ(τ,tᵢ) − Ψ Φ(tᵢ₊₁,tᵢ)`

직접 확인한 것은 둘이다.

1. 위 예에서 `K(τ)K⁻¹` 를 조밀 행렬로 계산하니 0 이 아닌 블록 열이 정확히 둘이었고, 식의 `Λ`, `Ψ` 와 일치했다(오차 1e-13 수준).
2. 상수 속도 사전에서 위치 보간 계수가 **3차 에르미트 보간**과 같았다. 구간 `[1.0, 2.2]`, `Q_C = 3` 에서 τ = 1.1, 1.5, 2.0 모두 위치 계수 `(Λ₀₀, Ψ₀₀, Λ₀₁, Ψ₀₁)` 이 에르미트 기저 `(2s³−3s²+1, −2s³+3s², (s³−2s²+s)h, (s³−s²)h)` 와 일치했다. 상수 `Q_C` 값은 결과에 영향이 없었다. 이는 내 확인이지 논문 서술이 아니다. 논문은 "GP 보간이 사전에 맞는 보간 방식을 자동으로 고른다"고만 적는다.

### 5. 비선형 SDE 와 매턴 계열

확장 투고본은 사전을 비선형 `ẋ = f(x,u,w)` 로 넓힌다. 작동점 `x_op(t)` 로 선형화(`F = ∂f/∂x`, `L = ∂f/∂w`, `v = f(x_op,u,0) − F x_op`)한 LTV SDE 를 쓰고 작동점을 매 반복 갱신한다. 평균·공분산을 매번 다시 계산해야 하고 `Φ` 가 해석해로 안 나오면 수치 적분이 필요하다. 매턴 공분산 일부는 선형 SDE 로 정확히 표현되므로(예: `ν = 3/2`) 같은 틀에 들어간다고 두 논문 모두 적는다.

## 헷갈리는 구분

| 항목 | 기저 함수 (Furgale 계열) | GP 사전 (이 노트) |
| --- | --- | --- |
| 궤적 표현 | 기저의 가중합, 계수가 미지수 | 측정 시각의 마르코프 상태가 미지수, 사이는 보간 |
| 부드러움의 출처 | 기저의 차수·매듭 간격 | SDE 의 `Q_C` (모션 모델) |
| 상태 크기 | 매듭 수에 비례 | 측정(또는 선택한 시각) 수에 비례 |
| 사이 시각 | 기저로 평가 | GP 보간(상수 속도 사전이면 에르미트와 같음, 위 4번) |
| 하이퍼파라미터 | 매듭 간격 | `Q_C`, 측정 잡음. 학습 데이터로 맞추거나 로그 증거 최대화 |
| 모델 오차 | 기저가 표현 못 하는 움직임 | 사전이 틀리면 과평활 |

[Spline Fusion](/develop-wiki/knowledge/robotics/spline-fusion-se3-cumulative-bspline/) 은 기저 쪽을 SE(3) 로 옮긴 사례다. 이 논문의 실험은 평면 `[x, y, θ]` 위치와 속도이며, SE(3) 같은 리 군 위 구성은 이 노트가 읽은 범위 밖이다.

## 언제 쓰나

- 측정이 서로 다른 시각에 쏟아지는 센서(롤링 셔터, 이동 스캔 라이다)를 일괄 추정에 넣고, 측정 시각이 아닌 곳에서도 궤적을 읽어야 할 때.
- 부드러움을 매듭 간격이 아니라 **물리적 의미가 있는 잡음 세기**(`Q_C`)로 조절하고 싶을 때. 논문은 `Q_C` 를 가속도에 가우시안을 맞춰 구했다.
- 오도메트리를 사전 평균에 섞지 않고 단항 측정 인자로 분리해 두는 쪽이 낫다고 논문이 주장할 때(사전의 불확실성과 오도메트리 잡음을 구분).

## 주의와 비용

- **마르코프 상태가 전제다.** 사전에 맞는 상태(위치+속도 등)를 쌓지 않고 일부를 소거하면 희소성이 깨진다. 상태 차원은 늘어난다. 논문의 조밀 구현끼리 비교에서 속도를 되살린 쪽은 희소성을 쓰기 전에는 오히려 더 느렸다.
- **희소성은 사전에서 오는 것이지 측정에서 오지 않는다.** 측정이 한 시각의 상태에만 걸린다는 가정이 `CᵀR⁻¹C` 의 블록 대각을 보장한다. 한 측정이 여러 시각에 걸리면 구조가 달라진다. 지도 점이 있으면 `W_ℓx` 의 희소성은 관측 패턴에 달렸다.
- **비선형 사전은 매 반복 비용이 더 든다.** 작동점이 바뀔 때마다 평균·공분산을 다시 적분한다.
- **사전이 데이터와 안 맞으면 과평활.** 하이퍼파라미터를 학습 데이터로 맞추는 경우 데이터 분포에 의존한다.
- 실험은 1 Hz 측정, 17 개 기둥 지표가 있는 실내 평면 한 데이터셋뿐이고, 세 방법의 정확도는 비슷하다고 논문이 밝힌다(성능 이득은 계산 시간).

## 검증 범위

- 읽은 것: RSS 2014 논문 전문(식 1~41, 실험 IV, 논의 V), arXiv 1412.0630 의 3.2절(비선형 SDE)·4절 일부·논의·결론.
- 직접 계산: 3·4번의 희소 구조와 보간 계수(Python, numpy).
- 미확인: 복잡도 그림(그림 5)의 수치, 비선형 SDE 실험(arXiv 4절)의 수치, SE(3) 확장 논문, 이후 라이다·라디오 응용 연구, Autonomous Robots 출판본 서지(arXiv 표지는 투고 표기).
- 초안(`research/drafts`)의 서술은 쓰지 않았다.

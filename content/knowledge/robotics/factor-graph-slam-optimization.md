---
title: 그래프 SLAM 최적화 — 포즈 그래프·팩터 그래프 (g2o·GTSAM)
aka: [Pose Graph Optimization, Factor Graph, g2o, GTSAM, Nonlinear Least Squares SLAM, iSAM2]
category: robotics
group: estimation
level: advanced
summary: 그래프 SLAM 의 백엔드는 포즈를 변수로, 오도메트리·루프 클로저를 오차 항으로 둔 비선형 최소제곱 문제를 선형화해 반복 푼다. g2o 는 그래프 최적화 프레임워크, GTSAM 은 팩터 그래프와 증분 추론 라이브러리다.
tags: [robotics, slam, pose-graph, factor-graph, g2o, gtsam, least-squares, loop-closure, optimization]
related: [robotics/slam-concepts, robotics/icp-ndt-scan-matching, robotics/kalman-filter-ekf, robotics/rotation-representations, robotics/particle-filter-mcl, robotics/robot-localization-ekf-fusion]
sources:
  - https://github.com/RainerKuemmerle/g2o/blob/master/doc/g2o.tex
  - https://github.com/RainerKuemmerle/g2o
  - http://ais.informatik.uni-freiburg.de/publications/papers/kuemmerle11icra.pdf
  - https://gtsam.org/tutorials/intro.html
  - http://robots.stanford.edu/papers/thrun.graphslam.pdf
updatedAt: 2026-11-19
---

> 출처 메모: g2o 는 저장소의 공식 문서 소스(`doc/g2o.tex`, 1~3장·견고화·라이브러리 구조)를 읽었다. GTSAM 은 공식 입문 튜토리얼 페이지를 읽었다. ICRA 2011 g2o 논문 PDF 와 GTSAM 의 Bayes tree·iSAM2 원 논문, Dellaert & Kaess 의 팩터 그래프 해설은 읽지 않았다. 아래 수식은 g2o 문서와 같은 표기를 쓴다.

## 문제

[SLAM](/develop-wiki/knowledge/robotics/slam-concepts/)의 프런트엔드([스캔 매칭](/develop-wiki/knowledge/robotics/icp-ndt-scan-matching/) 등)는 연속 포즈 사이의 상대 변환과, 이전에 지난 곳을 다시 본 **루프 클로저** 를 만든다. 오도메트리를 이어 붙이면 오차가 쌓이므로 루프 클로저가 들어오면 전체 궤적을 한꺼번에 고쳐야 한다. 칼만 필터는 현재 상태 하나만 갱신하지만, 궤적 전체를 두고 과거 포즈까지 다시 맞추는 것이 **그래프 최적화** 다.

## 해법: 최소제곱 문제로 쓴다

g2o 문서의 형식화는 이렇다. 변수 벡터 x(포즈 등)와 제약 k 마다 측정 z_k, 정보행렬 Ω_k, 오차 함수 e_k(x_k, z_k) 가 있고 목표는 다음이다.

`F(x) = Σ_k e_kᵀ Ω_k e_k`,  `x* = argmin F(x)`.

정보행렬(공분산의 역)이 클수록 그 제약을 더 믿는다. 제약마다 연결되는 변수가 일부이므로 그래프 구조가 된다. 노드=변수, 간선=제약이다. GTSAM 은 같은 문제를 **팩터 그래프**(변수와 팩터로 이루어진 이분 그래프)로 표현한다. 팩터는 측정이나 사전 지식에서 오는 확률적 제약이고, 그래프 전체의 곱이 결합 분포이며 이를 최대화한 해가 가장 그럴듯한 해다. 그래프 자체는 해를 갖지 않고, 해는 별도의 `Values` 객체에 담긴다.

### 반복 풀이

좋은 초기값 x̆ 가 있으면 오차를 1차 테일러 전개 `e(x̆ + Δx) ≈ e + J Δx` 한다. 그러면 `F` 가 Δx 의 이차식이 되고 다음 선형 시스템을 푼다.

`H Δx = −b`,  `H = Σ Jᵀ Ω J`,  `b = Σ Jᵀ Ω e`,  `x ← x̆ + Δx`

가우스-뉴턴은 이 단계를 반복한다. 레벤버그-마쿼트(LM)는 `(H + λI) Δx = −b` 로 감쇠 λ 를 두고, 새 오차가 줄면 λ 를 줄이고 아니면 해를 되돌려 λ 를 키운다. H 는 제약으로 연결된 블록에만 0 이 아닌 값을 가진 **희소 행렬** 이라 희소 촐레스키(CSparse, CHOLMOD)나 PCG 로 푼다. GTSAM 튜토리얼의 예시는 LM 을 쓴다.

두 가지 실무 주의가 g2o 문서에 있다.

- **게이지 자유도**: 전체 궤적을 같이 옮겨도 오차가 같으므로 한 노드는 고정(fixed)해야 한다. 안 하면 H 가 특이하다.
- **견고화**: 오차 제곱은 이상치 하나의 영향이 크다. 오차가 작을 때는 제곱, 클 때는 선형으로 바꾸는 후버 함수로 가중치를 줄일 수 있고, 간선별로 켜고 끌 수 있다. 문서는 후버가 볼록이라 새 국소 최소를 만들지 않는 장점을 든다.

### 증분 갱신

GTSAM 튜토리얼은 새 측정이 들어올 때마다 전체를 다시 푸는 대신 **iSAM** 으로 증분 추론한다고 소개한다. 이는 베이즈 트리를 유지하며 필요한 변수만 재선형화하고, iSAM2 는 언제 무엇을 재선형화할지 스스로 판단한다고 한다.

### 직접 해 보기

2D 위치만 있는 포즈 그래프(회전 없음, 선형 문제라 가우스-뉴턴 한 번에 최적)로 구현해 확인했다. 한 변 10 m 정사각형을 4구간 도는 오도메트리에 매 구간 (+0.3, −0.1) m 편향을 넣으면 끝점이 (1.2, −0.4) 어긋난다. 시작점과 같다는 루프 클로저(정보량 100, 오도메트리는 1)를 더하고 첫 포즈를 고정해 풀자 포즈가 (0,0) (10.00,−0.00) (10.00,10.00) (0.00,10.00) (0,0) 으로 돌아왔고 루프 오차는 0.003 m 였다. 편향이 모든 구간에 균일했기에 정확히 복원된 이상적 예다.

```ts
// e = x_j - x_i - z,  J_i = -I, J_j = +I.  H dx = -J^T W e.
for (const { i, j, z, w } of edges) for (let a = 0; a < 2; a++) {
  const e = x0[j][a] - x0[i][a] - z[a];
  H[2*i+a][2*i+a] += w; H[2*j+a][2*j+a] += w; H[2*i+a][2*j+a] -= w; H[2*j+a][2*i+a] -= w;
  b[2*i+a] += w * e;    b[2*j+a] -= w * e;
}
// 게이지 고정: 앵커 노드의 행·열을 단위행렬로 바꾼 뒤 가우스 소거로 H dx = -b 를 푼다
```

## 언제 쓰나

- 라이다·시각 SLAM 의 백엔드(루프 클로저 후 궤적 보정), 번들 조정.
- 오도메트리와 GNSS 같은 여러 센서를 **스무딩** 으로 합칠 때(필터보다 과거까지 되돌려 정합).
- 센서 보정 파라미터를 상태로 넣어 함께 추정할 때.

## 주의/비용

- **초기값이 나쁘면 국소 최소**에 빠진다. 선형화는 초기 추정 근처에서만 유효하다.
- **잘못된 루프 클로저 한 개가 지도를 망친다.** 견고 커널과 후보 검증 같은 대책이 필요하다. 이 노트는 그중 후버 커널만 g2o 문서로 확인했다.
- 회전은 비선형이라 매니폴드 위의 갱신이 필요하다(g2o 문서에 별도 장이 있음, [회전 표현](/develop-wiki/knowledge/robotics/rotation-representations/)). 위의 2D 위치 예제처럼 쉽게 풀리지 않는다.
- 규모가 커지면 H 도 커진다. 희소 솔버 선택이 속도를 좌우하며(g2o 는 솔버를 교체할 수 있게 설계됐다), 실시간이면 증분 방식이나 키프레임·서브맵으로 규모를 줄인다.
- 정보행렬(공분산) 설정이 틀리면 해가 한쪽 센서에 끌려간다. 오도메트리와 루프 클로저의 상대 신뢰도 조정이 실무에서 가장 흔한 튜닝 지점이다.
- 두 라이브러리의 사용법(클래스·API)은 배포판마다 달라 여기서는 다루지 않았다. g2o 는 BSD 라이선스이나 일부 모듈이 LGPL 이라는 점이 README 에 있다.

---
title: 인증 가능 견고 기하 인식과 STRIDE — 희소 SDP 완화를 큰 규모로 푸는 전용 솔버
aka: [STRIDE, SpecTrahedral pRojected gradIent Descent along vErtices, Sparse Semidefinite Relaxation, SSR, Certifiable Outlier-Robust Geometric Perception, Lasserre Hierarchy for Robust Estimation]
category: robotics
group: estimation
level: advanced
summary: TLS 견고 추정을 이진 변수 다항식 최적화로 쓰고 희소 SDP 로 완화한 뒤, 전용 솔버 STRIDE 로 풀어 전역 최적성을 인증한다. GNC·RANSAC 해는 인증하거나 지역해에서 꺼낸다.
tags: [robotics, robust-estimation, certifiable, sdp, polynomial-optimization, lasserre, truncated-least-squares, outliers, solver]
related: [robotics/tls-binary-cloning-sdp-relaxation, robotics/gnc-teaser-robust-estimation, robotics/se-sync-certifiable-pose-graph, robotics/gnc-pose-graph-optimization, robotics/loop-closure-outlier-rejection, robotics/rotation-representations]
sources:
  - https://arxiv.org/abs/2109.03349
  - https://arxiv.org/abs/2105.14033
  - https://arxiv.org/abs/2006.06769
  - https://github.com/MIT-SPARK/CertifiablyRobustPerception
  - https://github.com/MIT-SPARK/STRIDE
updatedAt: 2026-11-23
---

> 출처 메모: Yang·Carlone, "Certifiably Optimal Outlier-Robust Geometric Perception: Semidefinite Relaxations and Scalable Global Optimization"(IEEE T-PAMI 2022, arXiv 2109.03349v2)의 PDF 를 텍스트로 추출해 1~6장(서론, 예비지식, 다항식 최적화 변환, 희소 SDP 완화, STRIDE, 실험), 7·8장 일부를 직접 읽었다(2026-11-23). 증명·보충 자료(부록 대부분)는 읽지 않았다. 논문 표 2(시간 비교)는 추출 시 칸이 섞여 개별 수치를 읽지 못했다. 저장소는 GitHub API 와 README 로만 확인했고 코드를 실행하지 않았다.

## 문제

[QUASAR](/develop-wiki/knowledge/robotics/tls-binary-cloning-sdp-relaxation/)는 이상치에 견고한 회전 탐색을 SDP 로 완화해 전역 최적을 인증할 수 있음을 보였지만, 범용 SDP 솔버로는 대응 100 개에 수백~천 초가 걸렸다. [GNC·TEASER](/develop-wiki/knowledge/robotics/gnc-teaser-robust-estimation/)는 빠르지만 최적성을 보장하지 않는다. [SE-Sync](/develop-wiki/knowledge/robotics/se-sync-certifiable-pose-graph/)는 이상치가 없는 문제의 SDP 를 저랭크 방식으로 빠르게 풀었는데, 이상치가 들어오면 SDP 가 커져 그 방식이 맞지 않는다.

이 논문이 묻는 것은 두 가지다.

1. 회전 탐색에 한정하지 않고 **여러 기하 문제를 같은 틀로** 인증 가능하게 만들 수 있는가.
2. 그 틀이 만드는 큰 SDP 를 **실제로 풀 수 있는가**.

논문은 인증 가능 알고리즘을 다음처럼 정의한다. 다항 시간에 돌고, 흔한 입력에서는 전역 최적해와 인증서를 내며, 최악 입력에서는 실패를 선언하되 준최적성 척도를 준다.

## 해법

### 1. 견고 추정을 다항식 최적화(POP)로

측정 `z_i` 와 모델 `x` 에 대해 `min_x Σ ρ(r(x,z_i), β_i) + ψ(x)` 를 푼다. 논문은 `r²` 과 `ψ` 가 다항식이고 제약 집합이 다항식 등식·부등식으로 표현되면, TLS·최대 합의·Geman-McClure·Tukey biweight·L1·Huber·적응형(Barron) 비용이 모두 POP 로 바뀐다고 보인다(명제 4). 앞의 넷은 Black-Rangarajan 쌍대성으로 측정마다 슬랙 변수를 하나 두고, 나머지는 변수 변환으로 다항식을 만든다.

TLS 는 QUASAR 와 같은 이진 변수 식을 쓴다. `min(a,b) = min_{θ∈{±1}} (1+θ)/2·a + (1−θ)/2·b` 이므로:

```
min_{x∈X, θ∈{±1}^N}  Σ_i [ (1+θ_i)/2 · r(x,z_i)²/β_i²  +  (1−θ_i)/2 ] + ψ(x)
```

`θ_i = +1` 이 내점, `−1` 이 이상치다. `θ_i² − 1 = 0` 이 다항식 등식이라 변수 `d+N` 개의 POP 가 된다. 논문은 TLS 를 선호하는 이유로, 이상치를 아예 버리므로 다른 비용보다 견고한 경우가 많고, 적응형 비용은 차수가 높아 SDP 가 감당 불가로 커진다는 점을 든다(비고 8).

논문이 다루는 문제는 여섯 가지다: 단일 회전 평균, 다중 회전 평균, 점군 정합, 메시 정합, 절대 자세 추정(PnP), 범주 수준 물체 자세·형상 추정.

### 2. Lasserre 계층과 크기 폭발

POP 에 `[x]_κ`(차수 κ 이하 단항식 벡터)를 만들고 모멘트 행렬 `X_κ = [x]_κ [x]_κᵀ` 의 랭크 1 제약을 버리면 SDP(LAS)가 된다. 정리 2(Lasserre 계층)에 따라 값은 κ 가 커지면 `p*` 에 아래에서 수렴하고, 해가 랭크 1 이면 완화가 정확하다(인증서). TLS 목적함수는 `θ_i r²` 때문에 3차이므로 κ ≥ 2 가 필요하다.

문제는 크기다. 논문 예: `d=10, N=100, κ=2` 에서 최대 블록 `n1 = 6216`, 모멘트 등식 `m_mom = 12,649,561` 개. `d=100, N=100` 이면 `n1 ≈ 2×10⁴`, `m_mom ≈ 1.4×10⁸`. 논문은 "기존 솔버로는 가망이 없다"고 쓴다.

### 3. 희소 완화(SSR)

목적식과 제약에 나오는 단항식이 `[x]²`, `θ_i·[x]²`, `θ_i²` 세 종류뿐이라는 점을 이용해 기저를 줄인다.

```
v(x) = [1 ; x ; θ ; θ ⊗ x],   n1 = (1 + d)(1 + N)
```

이 기저의 모멘트 행렬 `X_v = v vᵀ` 에 모멘트 제약(반복된 단항식 같게), 중복 등식 제약, 국소화 행렬 제약을 더하면 SDP(SSR)가 된다. 정리 9 는 Lasserre 와 같은 형태다: 값은 하한이고, 랭크 1 이면 완화가 정확하다.

- 크기: 단일 회전 평균(`d=9`)에서 `N=200` 일 때 Lasserre 는 `n1 > 20,000`, `m_mom > 10⁸`, SSR 는 `n1 ≈ 2,000`, `m_mom ≈ 10⁶` 으로 논문이 정리한다(약 10배·100배 감소).
- 정확성은 **이론이 아니라 실험**으로 확인한 것이다. 논문은 희소 완화가 정확하려면 밀집 완화가 먼저 정확해야 하고, 그래도 희소 기저가 정확할지는 돌려 봐야 안다고 쓴다. 기저를 `[[x]²; θ]` 로 바꾼 희소 완화는 "정확과 거리가 멀다"고 한다(비고 10).
- 다중 회전 평균처럼 `d` 가 큰 문제는 기저를 더 줄이는 방법을 부록에 두었다(읽지 않음).

### 4. 인증서: 상대 준최적성

SDP 해 `X_v*` 의 최대 고유벡터를 `v`, 라운딩 함수를 `v ← v/v₁, x = Π_X(v_x), θ = sgn(v_θ)` 로 잡아 실행 가능한 TLS 해를 얻는다. 그 비용 `p̂` 에 대해(`f*` 는 SDP 의 최적값, 즉 하한) `f* ≤ p* ≤ p̂` 이므로

```
η_s = |f* − p̂| / (1 + |f*| + |p̂|)
```

가 준최적성 척도다. 랭크는 수치적으로 불안정하므로(둘째 고윳값 10⁻³ 이 정확한지 판단하기 어렵다고 논문이 쓴다) 이 연속 지표를 쓴다. 논문 실험은 `η_s < 1e−3` 이면 전역 최적으로 판정했다. `η_s = 0` 이면 그 해가 전역 최적이고 완화가 정확하다. 임의의 실행 가능 해(예: GNC 가 낸 해)에 `p̂` 를 넣어 같은 지표를 계산할 수 있다.

SDP 쪽 정확도는 별도로 KKT 잔차 `η_max = max(η_p, η_d, η_g)`(원 실행가능성, 쌍대 실행가능성, 쌍대성 간격의 상대값)로 잰다.

### 5. STRIDE

SSR 의 SDP 는 `n1` 은 수천 이하지만 `m` 이 수십만~수백만이고 최적해가 랭크 1 이라 퇴화(degenerate)다. 논문은 내점법(IPM)이 `m` 약 5만 이하까지, 일차 방법(SDPNAL+ 등)은 느린 수렴으로 중간 정확도에 그친다고 정리하고, Burer-Monteiro 저랭크 분해는 `m = O(n1)` 인 단일 블록에 맞아 여기엔 쓸 수 없다고 한다.

STRIDE(SpecTrahedral pRojected gradIent Descent along vErtices)는 두 걸음을 번갈아 낸다. 정점(vertex)은 스펙트라헤드론의 랭크 1 점을 뜻한다.

- **짧은 PGD 걸음**: `X̄ = Π_FP(X^k − σ_k C)`. 실행 가능 집합(스펙트라헤드론)으로의 투영을 쌍대 문제로 바꿔 L-BFGS 로 푼다. 이 걸음이 전역 수렴을 보장하는 뼈대다.
- **긴 랭크 1 걸음**: `X_v` 의 고유분해에서 상위 `r` 개 고유벡터를 라운딩하고, 각각에서 비선형 계획(NLP, 논문은 Manopt 의 trust-region)으로 지역 탐색해 비용이 가장 낮은 해를 고른 뒤 랭크 1 로 다시 올린다(lifting).
- **선택**: 랭크 1 후보의 목적값이 PGD 후보보다 `ε` 이상 낮을 때만 채택한다. 그래서 랭크 1 걸음은 목적값을 확실히 낮출 때만 쓰이고, 이 덕에 정리 11(Slater 조건 하 전역 수렴)이 성립한다고 논문이 쓴다(증명은 부록, 미확인).

```ts
// STRIDE 의 한 반복 (개념도, 논문 알고리즘 1 을 직접 단순화)
function strideStep(X: Sdp, sigma: number, r: number, eps: number) {
  const Xpgd = projectOntoSpectrahedron(sub(X, scale(C, sigma)));   // 짧은 걸음 (L-BFGS)
  const cands = topEigvecs(Xpgd.moment, r).map(round);               // 라운딩
  const best = argmin(cands.map(nlpLocalSearch), cost);              // 지역 탐색
  const Xrank1 = lift(best);                                         // 랭크 1 로 올림
  return cost(Xrank1) <= cost(Xpgd) - eps ? Xrank1 : Xpgd;           // 확실히 낮을 때만
}
```

### 6. 휴리스틱을 안전장치로

GNC·RANSAC 해를 라운딩 역방향(lifting)으로 올려 STRIDE 의 초기값 `X0` 으로 쓴다. 그 해가 이미 전역 최적이고 완화가 정확하면 STRIDE 는 PGD 한 걸음으로 **인증서만** 만든다. 지역해였다면 STRIDE 가 `η_s > 0` 으로 이를 감지하고 탈출한다(비고 12). 쌍대 초기값은 ADMM+ 로 만든다(상세 부록, 미확인).

## 논문이 보고한 것

실험 설정: 12코어 i9-7920X, 128GB RAM, 시뮬레이션은 설정당 20회 몬테카를로. STRIDE 는 `tol=1e−6, r=3, ε=1e−12, σ_k=10`, 최대 5회 반복. 비교 대상은 MOSEK 과 SDPNAL+(기본 설정), `m > 50,000` 이면 MOSEK 은 제외.

| 문제 | 크기 | 논문 관찰 |
| --- | --- | --- |
| 단일 회전 평균 `N=30` (`n1=310, m=30,016`) | 이상치 0~90% | 완화 정확. STRIDE 는 MOSEK 과 비슷한 정확도로 약 100배(최대 270배) 빠름 |
| 단일 회전 평균 `N=100` (`n1=1010, m=310,016`) | 최대 95% | 완화 정확. MOSEK 실행 불가. SDPNAL+ 는 `η_max` 약 1e−3 에 그치고 약 40배 느림, STRIDE 는 약 1e−8 |
| 다중 회전 평균(2D 격자 10×10, 루프 클로저 10) | 최대 80% | 완화 정확. MOSEK 대비 약 20배(최대 40배) 빠름. SDPNAL+ 는 실패 |
| 다중 회전 평균(20×20, 루프 클로저 20) | 최대 80% | 거의 정확. 비율별로 1~2회는 `η_s < 1e−3` 미달(완화가 느슨한 것으로 추정) |
| 점군 정합 `N=20` | 최대 80% | 완화 정확. 약 5배 빠름. 80% 에서 STRIDE 가 정확도에 한 번 미달 |
| 점군 정합 `N=100` | 최대 90% | STRIDE 만 인증 성공. 90% 에서 20회 중 17회 인증, 3회 실패 |
| 절대 자세 `N=20` | 최대 60% | 완화 정확. 70% 에서는 MOSEK 이 높은 정확도로 풀어도 해가 랭크 1 이 아니라 라운딩 해가 크게 틀림 |
| 범주 수준(자동차, `N=12, K=9`) | 최대 60% | 완화 정확. 논문 본문은 MOSEK 대비 약 10배 빠르다고 쓰지만 표 2 수치(MOSEK 454 s, STRIDE 88~196 s)로는 약 2~5배다 |

추가로 논문이 쓴 것:

- **휴리스틱 안전장치**: 단일 회전 평균에서 이상치 80% 일 때 GNC 가 여러 번 실패했지만 STRIDE 해는 항상 맞고 최적이었다. 점군 정합에서도 GNC 가 실패하는 구간(60~80%, N=20 / 90%, N=100)에서 지역해를 탈출했다.
- **인증만 하는 경우**: 휴리스틱이 이미 최적이면 STRIDE 는 인증만 하며, 탈출까지 하는 경우보다 2~5배 빠르다(표 2 해설).
- **실제 데이터 시연**: 3DMatch 스캔 매칭(FPFH 대응을 ROBIN 으로 걸러 이상치가 적은 상태에서 `η_s < 1e−6`), SPEED 위성 자세(키포인트 11개, 이상치 2~5개, 1분 이내 인증), ApolloScape 차량 자세·형상.
- 논문 스스로 "실시간과는 거리가 멀다"고 쓰고, 목표는 문제별 최신 기법을 이기는 것이 아니라 일반적인 인증 틀을 보이는 것이라고 밝힌다.

## 언제 쓰나

- 안전이 중요한 곳에서 **기준해와 인증서**가 필요할 때: 벤치마크 정답 만들기, 자율주행·우주 로봇의 오프라인 검증, 현장 데이터의 실패 사례 분석.
- 빠른 방법(GNC·RANSAC·[TEASER++](/develop-wiki/knowledge/robotics/gnc-teaser-robust-estimation/))을 먼저 돌리고, 결과가 TLS 의 전역 최적인지 **사후 확인**할 때. 논문이 제안하는 사용법이다.
- 회전 탐색 말고 PnP, 점군·메시 정합, 형상 추정까지 같은 틀(`다항식 변환 → 희소 완화 → STRIDE`)로 한꺼번에 다루고 싶을 때.
- 새 문제에 적용할 때의 순서는 논문의 조언을 따른다. 밀집 Lasserre 로 먼저 정확한지 소규모에서 보고, 그다음 희소 기저를 찾는다.

## 주의/비용

- **실시간이 아니다.** 논문 표 2 의 범위는 초~수천 초이고 저자도 실시간이 아니라고 쓴다. 로봇 루프에서 매 프레임 쓰는 용도가 아니다.
- **완화의 정확성은 이론이 아니라 경험적 관찰**이다. 논문 내 사례에서도 문제·크기별로 갈린다: 절대 자세는 `N=20` 에서 70% 이상치에 느슨해졌고(`N=100` 에서는 대부분 정확), 20×20 회전 평균은 간헐적으로 실패했다. 측정이 적을수록 일찍 느슨해진다고 논문이 각주로 적는다. 랭크 1 이 아니면 인증 실패로 처리해야 한다.
- **STRIDE 자체도 실패할 수 있다.** 5회 반복 안에 정확도에 못 미친 경우가 보고됐다. 인증서가 없으면 "최적 아님"이 아니라 "확인 못 함"이다.
- **전역 최적 ≠ 정답.** 이상치가 매우 많으면 TLS 의 전역 최적도 틀린 해가 된다. 단일 회전 평균 `N=30`, 이상치 90% 에서 인증된 최적해의 회전 오차가 약 100° 였다. 논문은 이를 TEASER 의 "추정 계약"(내점 수와 정확도의 관계)과 연결한다.
- **임계값 `β_i`** 를 사용자가 정해야 한다. 이 값이 TLS 의 정의 자체라 틀리면 인증된 해도 의미가 달라진다.
- **밑바탕 기법의 한계.** 다항식이어야 하므로 기하 투영 오차 대신 점-직선 오차를 쓰는 식의 모델링이 필요하다. 논문은 번들 조정은 변수가 너무 많아 현 SDP 로는 풀 수 없다고 쓴다.
- **구현 환경.** 공개 코드는 MATLAB 기반(SPOTLESS, Manopt 하위 모듈)이다. 저장소 문서에 MOSEK 예제가 있다. 두 저장소의 GitHub API 라이선스 필드가 비어 있고 최상위 목록에서 LICENSE 파일도 찾지 못했다(미확인, 재사용 전에 직접 확인).

## 비교

| | QUASAR (ICCV 2019) | 이 논문의 SSR + STRIDE (T-PAMI 2022) | TEASER++ / GNC |
| --- | --- | --- | --- |
| 대상 | 회전 탐색(Wahba) | 회전 평균, 점군·메시 정합, PnP, 형상 추정 | 정합, 포즈 그래프 등 |
| 완화 | 쿼터니언 복제 + 중복 제약 | 다항식 변환 + 희소 모멘트 기저 `[1;x;θ;θ⊗x]` | SDP 를 직접 풀지 않음 |
| 풀이 | 범용 SDP 솔버 | 전용 STRIDE (PGD + 랭크 1 걸음) | 가중 최소제곱 반복, 최적성은 사후 인증 |
| 최적성 | 랭크 1 이면 인증 | `η_s` 로 인증 | GNC 는 보장 없음, TEASER++ 는 인증기 별도 |
| 속도 | 범용 솔버로 대응 100개에 수백~천 초(QUASAR 논문 보고) | 논문 표 2 기준 초~수천 초 | 빠름 |

QUASAR 노트가 남긴 "느리다"는 문제를 이 논문은 두 방향으로 이었다. 하나는 모델링을 일반화해 문제마다 새 이진 복제를 짜지 않게 한 것이고, 다른 하나는 SDP 풀이를 전용 솔버로 바꿔 범용 솔버가 못 푸는 크기까지 가게 한 것이다. 다만 논문 스스로 실시간까지는 못 갔다고 밝힌다.

## 검증 범위

- 직접 읽음: arXiv 2109.03349v2 의 초록, 1~6장(식 14 TLS 변환, 식 15 희소 기저, 정리 9, 식 23·24, 알고리즘 1, 정리 11, 비고 12, 6.1~6.5 실험 서술), 6.6 요약, 7·8장 일부. arXiv 2105.14033 의 초록(저자·제목 확인).
- 확인한 것: STRIDE 가 이 논문(T-PAMI 2022)의 솔버이며, 솔버의 원형은 Yang·Liang·Carlone·Toh 의 arXiv 2105.14033, SDP 완화의 초기형은 NeurIPS 2020 "One Ring to Rule Them All"(arXiv 2006.06769)임을 논문 본문 서지와 README 로 확인했다. 후자의 본문은 읽지 않았다.
- 읽지 않음/미확인: 부록 전체(명제 4·7 증명, 정리 11 증명, 기저 추가 축소법, ADMM+ 쌍대 초기화, 상대 준최적성의 수치 둔감 판, 메시 정합 실험), 표 2 의 개별 수치(추출 시 섞임), 그림의 정확한 곡선 값. 논문의 증명은 검증하지 않았다. 코드는 실행하지 않았고 라이선스는 미확인이다.

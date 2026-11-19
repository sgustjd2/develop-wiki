---
title: SE-Sync — 전역 최적을 증명하는 포즈 그래프 최적화
aka: [SE-Sync, Certifiably Correct Pose Graph Optimization, SE(d) Synchronization, Semidefinite Relaxation for SLAM, Riemannian Staircase]
category: robotics
group: estimation
level: advanced
summary: SE-Sync 는 포즈 그래프 최대우도 문제를 반정부호(SDP) 완화로 바꿔 저랭크 리만 최적화로 푼다. 잡음이 임계값 아래면 완화가 정확해 전역 최적해를 얻고, 목적값이 하한과 같은지로 최적성을 사후 인증한다.
tags: [robotics, slam, pose-graph, sdp, convex-relaxation, certifiable, riemannian-optimization, global-optimality]
related: [robotics/factor-graph-slam-optimization, robotics/gnc-pose-graph-optimization, robotics/loop-closure-outlier-rejection, robotics/rotation-representations, robotics/isam2-bayes-tree-incremental, robotics/slam-concepts]
sources:
  - https://arxiv.org/abs/1612.07386
  - https://doi.org/10.1177/0278364918784361
  - https://github.com/david-m-rosen/SE-Sync
updatedAt: 2026-11-19
---

> 출처 메모: Rosen·Carlone·Bandeira·Leonard 의 arXiv 1612.07386 v2(2017-02, WAFR 2016 논문의 확장 기술 보고서) PDF 를 텍스트로 추출해 1~6장을 직접 읽었다(2026-11-19). 부록 C(명제 2 증명)는 구조만 보고 세부 증명은 따라가지 않았다. IJRR 2019 저널판(DOI 위)은 읽지 않았다. 저널판에서 알고리즘이 바뀌었을 수 있으므로(예: 안장점 탈출·인증 절차), 아래 설명은 arXiv v2 기준이다.

## 문제

[포즈 그래프 최적화](/develop-wiki/knowledge/robotics/factor-graph-slam-optimization/)는 상대 측정 `x̃_ij ≈ x_i⁻¹ x_j` 로부터 포즈 `x_1 … x_n ∈ SE(d)` 를 추정한다. 회전이 들어가서 문제가 **비볼록**이다.

- 가우스-뉴턴·LM 같은 국소 탐색은 빠르고 희소성을 잘 쓰지만, 잡음이 크지 않아도 나쁜 국소 최솟값에 빠질 수 있다.
- 더 중요한 점: 맞는 답을 찾았어도 **그것이 전역 최적인지 알 방법이 없다.**
- 볼록 완화(SDP 등)는 전역 구조를 잘 잡지만, 일반 SDP 솔버는 변수 차원이 수천을 넘으면 느려 실제 SLAM 크기에 쓰기 어렵다고 논문은 지적한다.

## 해법

### 1. 문제를 회전만의 이차형식으로

- 잡음 모델(식 10): 이동은 등방 가우시안(정밀도 `τ_ij`), 회전은 등방 Langevin 분포(집중도 `κ_ij`).
- 최대우도 문제(문제 1, 식 12): `min Σ κ_ij ‖R_j − R_i R̃_ij‖²_F + τ_ij ‖t_j − t_i − R_i t̃_ij‖²`. 회전 오차를 프로베니우스 노름(chordal) 으로 잰다.
- 회전을 고정하면 이동은 닫힌 해가 있다. 이동을 소거하면 `min_{R ∈ SO(d)^n} tr(Q̃ Rᵀ R)` (문제 3·4). `Q̃` 는 회전 연결 라플라시안 + 이동에서 온 항이다. 이동은 회전을 구한 뒤 식 21 로 복원한다.

### 2. 완화

- `SO(d)` 를 `O(d)` 로 넓힌다(문제 5). 오차가 작으면 해가 여전히 `SO(d)` 쪽에 머문다고 본다.
- 라그랑주 쌍대를 취하면 SDP 가 된다(문제 7): `min tr(Q̃ Z)` s.t. `Z ⪰ 0`, `Z` 의 `d×d` 대각 블록 = 단위행렬.
- **정리 1**: 완화의 최적해 `Z*` 가 `R*ᵀR*`(`R* ∈ SO(d)^n`) 로 인수분해되면 `R*` 가 원래 최대우도 문제의 전역 최적해다.
- **명제 2**: 실제 잡음 없는 데이터로 만든 `Q̄` 에 대해 상수 `β > 0` 가 있어서 `‖Q̃ − Q̄‖₂ < β` 이면 완화의 해가 유일하고 정확하다. 존재 결과일 뿐 `β` 의 닫힌 식은 주지 않는다.

### 3. 큰 SDP 를 빠르게 풀기

- **Burer-Monteiro 저랭크 인수분해**: `Z = YᵀY`, `Y ∈ ℝ^{r×dn}`, `r ≪ dn`. 대각 블록 제약은 각 `Y_i` 가 스티펠 다양체 `St(d, r)` 에 있다는 뜻이 되어, 제약 없는 리만 최적화가 된다(문제 9).
- **명제 3**(Boumal 등의 결과 인용): 문제 9 의 **랭크 부족 2차 임계점**이면 전역 최솟값이고 SDP 의 해다.
- **리만 계단(Riemannian Staircase, 알고리즘 1)**: `r = r_0` 부터 2차 임계점을 찾고, 랭크가 꽉 차 있으면 `Y` 에 0 행을 붙여 `r+1` 로 다시 푼다. 논문은 실제로는 한두 계단이면 된다고 한다.
- 최적화기는 **절단 뉴턴 리만 신뢰영역법**(RTR, Manopt). 정확한 헤시안-벡터 곱만 쓰고 헤시안을 만들지 않는다.

### 4. 반올림과 인증

- **반올림(알고리즘 2)**: `Y*` 의 랭크-`d` 절단 SVD → 블록들의 행렬식 부호 다수결로 방향 맞춤 → 각 블록을 가장 가까운 회전으로 사영.
- **인증**: SE-Sync 는 추정 `x̂` 와 하한 `p*_SDP ≤ p*_MLE` 를 함께 돌려준다. 완화가 정확하면 `F(Q̃ R̂ᵀR̂) = p*_SDP` (식 51) 가 성립한다. 이 등식을 사후에 확인하면 `x̂` 가 전역 최적이라는 **계산적 증명서**가 된다. 정확하지 않으면 차이가 준최적성 상한이 된다(식 50).

```ts
// 사후 인증: 반올림한 해의 목적값과 SDP 하한을 비교한다.
// fRounded = tr(Q R̂ᵀ R̂), lowerBound = p*_SDP = tr(Q Y*ᵀ Y*)
export function certify(fRounded: number, lowerBound: number, relTol = 1e-6) {
  const gap = fRounded - lowerBound;              // ≥ 0 (수치 오차 제외)
  const relGap = gap / Math.max(lowerBound, 1e-12);
  return { certified: relGap <= relTol, relSuboptimalityBound: relGap };
}
```

허용오차 `relTol` 은 내가 정한 예시 값이다. 논문 표 1 의 최대 준최적성 상한은 `10⁻¹²~10⁻¹¹` 수준이었다(그림 2 는 상대값).

## 논문이 보고한 것 (arXiv v2)

- **구현**: MATLAB, Manopt 의 RTR, `r_0 = 5`. 비교 대상은 코달(chordal) 초기화를 받은 가우스-뉴턴.
- **정육면체 시뮬레이션**(한 변 `s` 포즈 격자, 기본 1000 포즈, 루프 확률 0.1, 조건당 50 회): 완화의 정확성은 주로 **회전 잡음**에 달려 있었고, 회전 각도 RMS 오차 약 15° 까지 정확했다. 논문은 이것이 일반 로봇·비전 센서 잡음보다 한 자릿수 크다고 쓴다.
- 무작위 초기화로도 전역 최적에 도달했다(완화가 볼록이므로 초기값이 필요 없음). 코달 초기화는 속도만 높였다.
- **벤치마크**(표 1): sphere·torus·grid(합성), garage·cubicle·rim(실제). 모든 데이터에서 가우스-뉴턴과 같은 목적값에 도달했고, SE-Sync 가 3.3 배(garage, 1661 포즈)에서 15.7 배(rim, 10195 포즈) 빨랐다. 표 1 의 최대 준최적성 상한은 `10⁻¹²~10⁻¹¹` 수준(그림 2 는 상대값).
- 논문은 속도 차이를 정확한 헤시안 사용과 절단 뉴턴(반복마다 야코비안 재분해 불필요)으로 설명한다.

## 언제 쓰나

- 루프 클로저가 많아 국소 최솟값 위험이 있는 **일괄(batch) 포즈 그래프**. 초기값이 나쁘거나 없을 때.
- 결과가 전역 최적인지 **확인해야 하는** 경우: 벤치마크 정답 생성, 다른 솔버 검증, 안전 관련 지도 작성.
- [GNC 포즈 그래프](/develop-wiki/knowledge/robotics/gnc-pose-graph-optimization/)처럼 바깥 루프가 가중 PGO 를 반복해서 푸는 구조의 내부 솔버 후보.

## 주의/비용

- **이상치에 견고하지 않다.** 최대우도가 가우시안·Langevin 잡음을 가정한다. 가짜 루프 클로저 하나가 해를 끌고 가는 문제는 그대로다. 논문도 이상치 대응을 향후 과제로 남겼다([루프 클로저 이상치](/develop-wiki/knowledge/robotics/loop-closure-outlier-rejection/), [GNC](/develop-wiki/knowledge/robotics/gnc-pose-graph-optimization/)와 함께 써야 한다).
- **정확성은 보장이 아니라 조건부다.** 잡음이 임계값을 넘으면 완화가 정확하지 않을 수 있다. 그때 SE-Sync 는 실행 가능한 근사해와 준최적성 상한을 줄 뿐이다. 임계값 `β` 는 계산 가능한 형태로 주어지지 않는다.
- **잡음 모델이 특정하다.** 회전 오차를 chordal 거리로 잰다. 측지(geodesic) 거리 기반 비용이나 완전 공분산(이방성) 정보행렬과는 목적함수가 다르다. 이방성 잡음 처리 여부는 이 판에서 확인하지 못했다.
- **증분(온라인) 용도가 아니다.** [iSAM2](/develop-wiki/knowledge/robotics/isam2-bayes-tree-incremental/)처럼 새 측정마다 조금씩 갱신하는 구조가 아니라 전체 문제를 한 번에 푼다.
- 인증의 신뢰도는 2차 임계점을 얼마나 정밀하게 구했는지에 달려 있다. 논문도 높은 정밀도가 필요하다고 각주에서 강조한다.
- 실험 비교 대상은 MATLAB 가우스-뉴턴 구현이다. C++ 최적화 라이브러리(g2o, GTSAM, Ceres)와의 속도 비교가 아니다.

## 비교

| | 가우스-뉴턴/LM | SE-Sync | GNC + PGO |
| --- | --- | --- | --- |
| 비볼록성 처리 | 국소 탐색 | SDP 완화 + 저랭크 리만 최적화 | 견고 비용만 점진 처리, PGO 는 내부 솔버에 위임 |
| 초기값 | 필요(코달 등) | 불필요(있으면 빨라짐) | 내부 솔버에 따름 |
| 전역 최적 인증 | 없음 | 하한과의 차이로 인증 | 없음 |
| 이상치 | 취약 | 취약 | 대응 |
| 증분 갱신 | iSAM2 등으로 가능 | 일괄 | 일괄 |

## 검증 범위

- 직접 읽음: arXiv v2 본문 1~6장, 알고리즘 1~3, 표 1, 그림 2 캡션.
- 수치(15°, 3.3·15.7 배, 표 1)는 원문 표·본문과 대조했다. 그림에서만 읽을 수 있는 시간 곡선 값은 옮기지 않았다.
- 읽지 않음: IJRR 2019 저널판, 부록 C 증명 세부, 공개 C++ 구현 코드.
- 미확인: GNC 논문이 PGO 솔버로 SE-Sync 를 언급하는지는 확인하지 못했다.

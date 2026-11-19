---
title: 이상치에 견고한 인증 가능 추정 — TLS 의 이진 복제와 SDP 완화 (QUASAR)
aka: [Truncated Least Squares SDP Relaxation, Binary Cloning, QUASAR, Certifiably Robust Estimation, Robust Wahba Problem, Outlier-Robust Rotation Search]
category: robotics
group: estimation
level: advanced
summary: 절단 최소제곱(TLS) 회전 추정을 내점·이상치 이진 변수와 쿼터니언 "복제"로 바꾸면 이차 제약 이차 계획(QCQP)이 되고, 이를 SDP 로 완화해 풀 수 있다. 해가 랭크 1 이면 전역 최적임이 인증된다. 중복 제약이 없으면 완화가 이상치에 금방 느슨해진다.
tags: [robotics, robust-estimation, certifiable, sdp, convex-relaxation, truncated-least-squares, quaternion, rotation-search, outliers]
related: [robotics/gnc-teaser-robust-estimation, robotics/se-sync-certifiable-pose-graph, robotics/gnc-pose-graph-optimization, robotics/loop-closure-outlier-rejection, robotics/rotation-representations, robotics/icp-ndt-scan-matching]
sources:
  - https://arxiv.org/abs/1905.12536
  - https://arxiv.org/abs/2001.07715
updatedAt: 2026-11-19
---

> 출처 메모: Yang·Carlone, "A Quaternion-based Certifiably Optimal Solution to the Wahba Problem with Outliers"(ICCV 2019, arXiv 1905.12536) 의 PDF 를 텍스트로 추출해 본문 전체와 보충 자료 A~D(명제 3~6 증명), E 장 도입부를 직접 읽었다(2026-11-19). 정리 7 의 KKT 기반 증명 세부와 BnB 비교 부록은 읽지 않았다. TEASER(arXiv 2001.07715)는 [GNC·TEASER 노트](/develop-wiki/knowledge/robotics/gnc-teaser-robust-estimation/)에서 다뤘고 여기서는 관계만 쓴다. 아래 수치 실험은 내가 논문 식으로 다시 짠 소규모 재구현이며 논문 수치의 재현이 아니다.

## 문제

[SE-Sync](/develop-wiki/knowledge/robotics/se-sync-certifiable-pose-graph/)는 가우시안 잡음 아래에서 SDP 완화로 전역 최적을 인증한다. 하지만 **이상치**가 섞이면 최소제곱 자체가 틀린 모델이다. [GNC](/develop-wiki/knowledge/robotics/gnc-teaser-robust-estimation/) 같은 견고 비용 방법은 빠르지만 전역 최적을 보장하지 않고, 분기 한정(BnB)은 최악의 경우 지수 시간이다.

질문: 이상치에 견고한 비용(TLS)을 쓰면서도 **다항 시간**에 풀고 **최적성을 인증**할 수 있는가. QUASAR 는 가장 단순한 경우인 회전 탐색(Wahba 문제)으로 이를 보였다.

## 해법

### 1. 견고 Wahba 문제 (식 3)

벡터 쌍 `(a_i, b_i)` 에서 내점은 `b_i = R a_i + ε_i`, 이상치는 임의 벡터다. 비용은 TLS:

```
min_{R ∈ SO(3)} Σ_i min( ‖b_i − R a_i‖² / σ_i² , c̄² )
```

잔차가 임계값을 넘는 측정은 상수 `c̄²` 만 내고 해에 영향이 없다. 임계값 정하는 법(논문 비고 1·2):

- 내점 잡음이 등방 가우시안이면 정규화 잔차가 자유도 3 카이제곱이므로, 원하는 포함 확률 `p` 의 분위수를 `c̄²` 로 쓴다. 실험은 `p = 1 − 10⁻⁴`.
- 잡음 상한 `β_i` 를 알면 `σ_i² c̄² = β_i²`.

### 2. 이진 변수 → 이진 복제 → QCQP (4장)

1. **TLS 를 이진 변수로**: 임의의 스칼라 `x, y` 에 대해 `min(x, y) = min_{θ∈{±1}} ((1+θ)/2) x + ((1−θ)/2) y` (식 12). `θ_i = +1` 이면 내점, `−1` 이면 이상치. Black-Rangarajan 쌍대성의 극단(이진 line process)이라고 논문이 연결한다.
2. **쿼터니언으로**: `R` 대신 단위 쿼터니언 `q ∈ S³`. 회전은 `q ⊗ â ⊗ q⁻¹`.
3. **이진 복제(binary cloning)**: 측정마다 `q_i = θ_i q` 를 새 변수로 둔다. 그러면 `qᵀq_i = θ_i` 이고 혼합 정수 문제가 쿼터니언 `N+1` 개의 문제로 바뀐다(명제 3).
4. **QCQP**: `x = [q; q_1; …; q_N] ∈ ℝ^{4(N+1)}` 로 쌓으면 비용이 `Σ xᵀ Q_i x`(이차), 제약이 `‖q‖² = 1` 과 `q_i q_iᵀ = q qᵀ` (이차 등식)이 된다(명제 4). `q_i q_iᵀ = q qᵀ` 가 `q_i = ±q` 와 동치라는 것도 보충 자료에서 보인다.

### 3. SDP 완화와 중복 제약 (5장)

`Z = x xᵀ` 로 바꾸면 비용은 `tr(QZ)`, 제약은 블록에 대한 선형식, 그리고 `rank(Z) = 1` 하나만 비볼록이다(명제 5). 랭크 제약을 버리면 SDP 다.

- **단순 완화**(식 19): `Z ⪰ 0`, `tr([Z]_qq) = 1`, `[Z]_{q_i q_i} = [Z]_qq`.
- **정리 7**: 잡음·이상치가 없고 평행하지 않은 벡터가 둘 이상이면 단순 완화는 항상 긴밀하다(해가 랭크 1 이고 원 문제의 전역 최적).
- 그러나 이상치가 들어오면 단순 완화는 랭크가 1 보다 커지고, 랭크 1 근사로 반올림한 해도 오차가 컸다(그림 2).
- **QUASAR**(식 20): 비대각 블록이 대칭이라는 **중복 제약** `[Z]_{q q_i} = [Z]_{q q_i}ᵀ`, `[Z]_{q_i q_j} = [Z]_{q_i q_j}ᵀ` 를 더한다. 원 문제에서는 자동으로 성립하는 식이라 해를 바꾸지 않지만 완화를 조인다. 이론 보장은 여전히 정리 7(무잡음·무이상치)뿐이고, 이상치 아래의 긴밀성은 **실험적** 결과다.

### 4. 인증

SDP 해 `Z*` 가 랭크 1 이면(수치적으로 둘째 고윳값이 매우 작으면) 그 해가 원래 비볼록 문제의 전역 최적이다. 논문은 상대 완화 간격 `(f_QCQP − f*_SDP)/f_QCQP`, 랭크(허용오차 10⁻⁶), 안정 랭크(프로베니우스 노름² / 스펙트럼 노름²)로 긴밀성을 판정한다.

```ts
// 인증 판정: SDP 해 Z 의 고윳값으로 랭크 1 여부, 그리고 완화 간격
export function certify(eigsDesc: number[], fRounded: number, fSdp: number, tol = 1e-6) {
  const rankOne = eigsDesc[1] / eigsDesc[0] < tol;
  const gap = (fRounded - fSdp) / fRounded;    // SDP 값은 원 문제 최적값의 하한
  return { certified: rankOne && gap < 1e-6, gap };
}
```

## 논문이 보고한 것

- **단순 완화 vs QUASAR**(N = 40, 무잡음, 40 회): 이상치 10~40% 에서 단순 완화가 느슨해지기 시작하고 40% 이상에서 완전히 무너졌다. QUASAR 는 90% 이상치에서도 랭크 1 해를 냈다.
- **다른 방법과 비교**(σ = 0.01): 0~90% 에서 FGR 은 70% 까지 견디다 90% 에서 무너졌다(80% 에서도 큰 오차가 일부). RANSAC·GORE·QUASAR 는 90% 까지 견뎠다. 91~96%(N = 100)에서 GORE 가 96% 에서 한 번 실패했고 QUASAR 는 모든 시행에서 정확했다고 한다. σ = 0.1 에서는 QUASAR 만 80% 이상치에서 정확했다.
- **긴밀성 표**(표 1): 저잡음 0~96%, 고잡음 0~80%, Bunny 데이터에서 모두 랭크 1. 예외는 **고잡음 + 90% 이상치**(평균 상대 간격 0.033, 평균 랭크 33.33).
- **영상 이어 붙이기**(PASSTA, SURF 대응 70 개 중 46 개 이상치, 66%): QUASAR 로 회전을 구해 `H = K R K⁻¹` 로 정합. MATLAB MSAC 는 잘못 붙였다고 한다.
- **속도**: 범용 SDP 솔버로 대응 100 개에 MOSEK 약 1200 초, SDPNAL+ 약 500 초. 논문 스스로 크기에 따라 나쁘게 늘어난다고 쓴다.

### 직접 확인: 소규모 재구현

보충 자료 식 A32·A34 의 `Q_ii`, `Q_0i` 로 `Q` 를 만들고 cvxpy(Clarabel)로 식 19·20 을 풀었다(Python, `quasar_sdp.py`). N = 12, 단위 벡터, 내점 잡음 σ = 0.01, 이상치는 무작위 단위 벡터, `c̄²` 는 `p = 1 − 10⁻⁴` 의 χ²(3) 분위수(직접 계산 21.108). 비율마다 3 회.

| 이상치 | 단순 완화 회전 오차(°) | 단순 완화 λ₂/λ₁ | QUASAR 회전 오차(°) | QUASAR λ₂/λ₁ |
| --- | --- | --- | --- | --- |
| 0% | 0.03~0.45 | 1.7e−2~2.5e−2 | 0.02~0.50 | 1e−10~7e−9 |
| 25% | 0.17~0.41 | 2.0e−2~1.3e−1 | 0.21~0.37 | 4e−10~2e−8 |
| 50% | 1.2~11.1 | 0.41~0.56 | 0.37~0.81 | 2e−8~4e−8 |
| 75% | 43~167 | 0.81~0.96 | 0.39~0.71 | 4e−8~2e−7 |

- QUASAR 는 모든 경우 랭크 1(완화 간격 ≈ 0, 수치 오차 수준)이었다. 단순 완화는 잡음이 있으면 **이상치 0% 에서도** 랭크 1 이 아니었다(λ₂/λ₁ ≈ 0.02, 간격 약 0.5). 같은 코드로 잡음·이상치를 모두 없애면 단순 완화도 λ₂/λ₁ ≈ 10⁻¹² 로 랭크 1 이 되어 정리 7 과 맞았다(`quasar_noiseless.py`).
- 즉 단순 완화의 긴밀성은 무잡음 조건에 묶여 있고, 중복 제약이 실제 데이터에서 차이를 만든다. 이 실험은 N 이 작고 시행이 적어 논문의 이상치 한계(90~96%)를 확인한 것은 아니다.

## 언제 쓰나

- 대응 기반 회전(또는 TEASER 처럼 회전으로 분리할 수 있는 정합)에서 이상치가 많고, 결과가 **맞는지 증명**이 필요한 경우. 안전이 중요한 초기화, 벤치마크용 기준해.
- GNC·RANSAC 같은 빠른 방법의 결과를 사후 검증하는 기준으로. TEASER++ 는 회전을 GNC 로 풀고 최적성은 별도 인증기로 확인하는 구조를 택했다.
- 이진 복제 + 중복 제약 기법 자체는 다른 TLS 문제(포즈 그래프, 형상 정렬)로 옮길 수 있는 설계 패턴이다. 다만 이 노트는 회전 탐색 결과만 확인했다.

## 주의/비용

- **느리다.** 변수 행렬이 `4(N+1) × 4(N+1)` 이고 중복 제약은 `O(N²)` 개다. 범용 솔버로 대응 100 개에 수백~천 초. 실시간 로봇 루프에는 그대로 쓸 수 없다. 그래서 TEASER++ 같은 실용 구현은 SDP 를 직접 풀지 않는다.
- **이론 보장은 무잡음·무이상치뿐이다.** 이상치 아래의 긴밀성은 실험적 관찰이다. 고잡음 + 90% 이상치에서는 논문에서도 느슨해졌다. 랭크가 1 이 아니면 **인증 실패**로 처리해야지 반올림 해를 믿으면 안 된다.
- **TLS 의 정의 자체가 가정이다.** 인증은 "이 TLS 문제의 전역 최적"을 보장할 뿐, 그 해가 실제 회전이라는 보장은 아니다. `c̄` 를 잘못 잡거나 이상치가 서로 일관된 구조를 이루면(예: 반복 패턴) 전역 최적이 틀린 답일 수 있다.
- 수치 허용오차(랭크 판정 10⁻⁶ 등)를 정해야 한다. 논문이 안정 랭크를 함께 쓴 이유다.

## 비교

| | 최소제곱 SDP(SE-Sync) | TLS + SDP(QUASAR) | GNC | RANSAC | BnB |
| --- | --- | --- | --- | --- | --- |
| 이상치 | 다루지 않음 | 비용에 내장 | 비용에 내장 | 표본 합의 | 합의 최대화 |
| 전역 최적 | 잡음 임계 아래 인증 | 랭크 1 이면 인증(실험적으로 넓게 긴밀) | 보장 없음 | 확률적 | 보장(지수 시간) |
| 시간 | 빠름(전용 리만 최적화) | 느림(범용 SDP) | 빠름 | 이상치 비율에 지수적 | 최악 지수 |
| 초기값 | 불필요 | 불필요 | 불필요 | 불필요 | 불필요 |

## 검증 범위

- 직접 읽음: QUASAR arXiv 본문 전체, 보충 자료 A~D 와 E 도입부.
- 직접 계산: 소규모 SDP 재구현과 χ² 분위수(스크래치 `quasar_sdp.py`, `quasar_noiseless.py`).
- 읽지 않음: 정리 7 의 KKT 증명 세부, BnB 비교 부록, TEASER 의 TLS 회전 SDP 긴밀성 증명, 같은 저자들의 후속 일반화(다른 문제로의 확장)·빠른 전용 솔버 연구.

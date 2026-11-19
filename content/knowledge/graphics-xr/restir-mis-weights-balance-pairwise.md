---
title: ReSTIR 의 재샘플링 MIS 가중치 — 일반화 균형 휴리스틱(Talbot 식)과 쌍별(pairwise) MIS
aka: [Resampling MIS Weights, Generalized Balance Heuristic, Generalized Talbot MIS, Talbot MIS, Pairwise MIS, Defensive Pairwise MIS, Contribution MIS Weights, Canonical Sample, 1/M Weights, 1/Z Weights]
category: graphics-xr
group: rendering
level: advanced
summary: ReSTIR 가 이웃·이전 프레임 표본을 합칠 때 각 표본에 주는 MIS 가중치의 합이 1이어야 편향이 없다. 일반화 균형 휴리스틱(Talbot 식)은 모든 출처의 목표 함수를 서로 평가해 O(M²) 이고, 쌍별 MIS 는 각 표본을 현재 픽셀(정준 표본)하고만 비교해 O(M) 이다.
tags: [rendering, ray-tracing, restir, mis, multiple-importance-sampling, resampling, gris, path-tracing, unbiased]
related: [graphics-xr/restir-reservoir-resampling, graphics-xr/restir-pt-shift-mapping-jacobian, graphics-xr/restir-gi-pt-hit-distance-contract, graphics-xr/gradient-domain-path-tracing, graphics-xr/svgf-ray-tracing-denoising]
sources:
  - https://benedikt-bitterli.me/restir/bitterli20restir.pdf
  - https://graphics.cs.utah.edu/research/projects/gris/sig22_GRIS.pdf
  - https://graphics.cs.utah.edu/research/projects/gris/GRIS_supplemental.pdf
  - https://par.nsf.gov/servlets/purl/10519651
updatedAt: 2026-11-19
---

> 출처 메모: 세 가지를 읽었다. (1) Bitterli 외, "Spatiotemporal Reservoir Resampling for Real-Time Ray Tracing with Dynamic Direct Lighting"(SIGGRAPH 2020) 4장(편향 분석, 1/Z, MIS, Talbot 과의 비교). (2) Lin·Kettunen·Bitterli·Pantaleoni·Yuksel·Wyman, "Generalized Resampled Importance Sampling"(GRIS, SIGGRAPH 2022) 3.2절, 5.5~5.6절, 8장의 MIS 설정, 9.1절 수렴 결과와 **보충 자료 S.1절(Talbot·pairwise MIS 유도)**. (3) Wyman 외, *A Gentle Introduction to ReSTIR: Path Reuse in Real-time*(SIGGRAPH 2023 강의 노트, NSF 공개 사본, 2024-03-04판) 3.4절, 5.3절, 7.1절. pairwise MIS 의 원 제안인 Bitterli 박사논문(GRIS 는 2021, 강의 노트 [7] 은 2022 로 인용)은 **읽지 않았다**. 아래 수치 예는 내가 직접 계산한 것이다.

## 문제

[ReSTIR](/develop-wiki/knowledge/graphics-xr/restir-reservoir-resampling/)는 내 픽셀의 표본에 이웃 픽셀·이전 프레임의 표본을 섞어 재샘플링한다. 그런데 표본마다 **만들어진 분포가 다르다**(이웃은 다른 법선·가림·목표 함수를 가진다). 이것을 무시하면 생기는 일:

- Bitterli 2020 은 RIS 가중치 `W` 의 기댓값이 `|Z(y)|/M · 1/p(y)` 임을 보인다. `Z(y)` 는 표본 y 를 만들 수 있는(PDF 가 0 이 아닌) 출처의 집합이다. 일부 출처가 y 를 못 만들면 `|Z|/M < 1` 이 되어 **결과가 어두워지는 편향**이 생긴다.
- 출처를 섞으려면 MIS 가중치 `m_i` 가 필요하다. 조건은 y 를 만들 수 있는 출처들에 대해 **합이 1**(단위 분할)이다.
- 문제는 ReSTIR 의 입력 표본이 대부분 이미 RIS 를 거친 것이라 **PDF 를 정확히 모른다**는 점이다. 그래서 목표 함수 `p̂_i` 를 PDF 의 대리값으로 쓴다(강의 노트 3.4절).

## 해법

### 0. 용어

- **정준(canonical) 표본**: 내 픽셀의 도메인에서, 항등 이동 사상으로, 내 목표 함수 `p̂` 를 쓰며, `p̂` 의 지지집합을 덮는 표본(GRIS 정의 5.2). 보통 "현재 픽셀이 새로 만든 표본" 이다.
- **`p̂←i(y)`**: 표본 y 를 출처 i 의 도메인으로 되돌려(역 이동 사상) 그곳의 목표 함수를 평가하고 야코비안을 곱한 값. 되돌릴 수 없으면 0. 도메인이 같으면 그냥 `p̂_i(y)`. 이동 사상은 [ReSTIR PT 이동 사상](/develop-wiki/knowledge/graphics-xr/restir-pt-shift-mapping-jacobian/) 노트를 본다.

### 1. 상수 가중치 1/M 과 1/Z (Bitterli 2020)

- **1/M**: 원래 RIS 의 방식. 모든 출처가 y 를 만들 수 있을 때만 비편향이다. GRIS 는 모든 입력이 정준 표본일 때가 중요한 예외라고 적는다.
- **1/Z**: y 를 만들 수 있는 출처 수로 나눈다(알고리즘 6 은 이웃의 `p̂ > 0` 여부를 보고 그 저장소의 M 을 더한다). 편향은 없어지지만, 어떤 출처의 PDF 가 0 은 아니되 아주 작을 때 역 PDF 추정이 **매우 시끄러워진다**고 논문이 1D 예로 보인다.
- **균형 휴리스틱**: `m_z = p_z / Σ p_i`. 편향과 잡음을 함께 해결한다고 논문이 보인다.

### 2. Talbot 식과 그 일반화

- Bitterli 2020 은 자기 방식과 Talbot 2005 를 비교한다. Talbot 은 RIS 가중치를 `p̂ / p_i` 대신 `p̂ / Σ p_i` 로 써서 여러 PDF 를 평균 PDF 하나로 다룬다. 후보가 각자 다른 PDF 를 쓰면 **후보마다 모든 PDF 를 평가해야 하므로 O(M²)** 다. 이 PDF 평가가 광선 추적을 뜻하는 ReSTIR 에서는 감당하기 어렵다고 적는다.
- GRIS 는 이것을 여러 도메인으로 일반화해 **generalized Talbot MIS** 라 부른다(식 36):

  `m_i(y) = p̂←i(y) / Σ_j p̂←j(y)`

  강의 노트는 같은 식을 **일반화 균형 휴리스틱**이라 부르고, 신뢰도 가중 `c_i`(저장소의 M 대신 쓰는 값)를 곱한 형태(`c_i p̂←i / Σ c_j p̂←j`)를 쓴다. 보충 자료 S.1.1 은 이 식이 "재샘플링 가중치 `w_i` 가 유한하게 유계" 라는 조건에서 나온다고 유도한다.
- 비용: 표본 하나의 가중치에 출처 M 개를 다 평가하므로 전체 O(M²). 강의 노트는 후보가 적을 때는 이것으로 시작하고 정확성을 먼저 확인하라고 권한다.

### 3. 쌍별(pairwise) MIS

정준 표본을 기준으로 **각 표본을 정준 표본하고만** 균형 휴리스틱으로 비교한다. 강의 노트 7.1.3절과 GRIS 식 37·38(정준 표본 수 |R| = 1 일 때) 기준:

| 표본 | 균일(uniform) 형 | 방어(defensive) 형 |
| --- | --- | --- |
| 이웃 i ≠ c | `p̂←i / (p̂ + (M−1)·p̂←i)` | `(M−1)/M · p̂←i / (p̂ + (M−1)·p̂←i)` |
| 정준 c | `1/(M−1) · Σ_{j≠c} p̂ / (p̂ + (M−1)·p̂←j)` | `1/M · (1 + Σ_{j≠c} p̂ / (p̂ + (M−1)·p̂←j))` |

- `(M−1)` 배 보정은 모든 기법이 같을 때 가중치가 모두 1/M 이 되게 맞춘 것이다(보충 S.1.2 가 α = M/|R| − 1 로 유도).
- **방어형**은 `p̂←i` 가 근사라서 나쁜 이웃의 가중치가 부풀고 정준 표본이 너무 작은 가중치를 받는 것을 막는다. 정준 표본 가중치의 하한과 이웃 가중치의 상한을 같게 맞춘 것이다(보충 S.1.2, κ = (M−|R|)/M).
- 비용: GRIS 는 O(M²) 에서 O(M·|R|) 로 준다고 적는다.
- GRIS 의 ReSTIR PT 는 **공간 재사용에 방어형 pairwise**, 실시간 판의 **시간 재사용에 generalized Talbot** 을 썼다(|R| = 1). 9.1절 수렴 실험에서 두 방식 모두 점근적 영분산 수렴을 보였고 상수 가중치(1/M)는 그렇지 않았다. Talbot 이 표본당 오차는 낮지만 pairwise 는 6~7배 싸게 비슷한 분산에 도달했다고 보고한다.

### 4. 기여(contribution) MIS

Bitterli 2020 의 비편향 판은 재샘플링에는 상수 `1/M` 을 쓰고, **선택된 표본 하나에만** 균형 휴리스틱 가중치 `c_s` 를 계산해 `W` 를 보정한다. GRIS 는 이를 contribution MIS 라 부른다. 강의 노트는 이것이 직접광에서는 괜찮지만 도메인 차이가 크면(예: 참여 매질) 선택된 표본에 잡음을 많이 더하고, 표본 분포가 목표로 수렴하려면 제대로 된 재샘플링 MIS `m_i` 가 필요하다고 정리한다.

```ts
// pHatFrom[i] = p̂←i(y). index c 는 정준 표본(pHatFrom[c] = p̂(y))
function talbotMIS(pHatFrom: number[], i: number): number {          // O(M) per sample → O(M²)
  const sum = pHatFrom.reduce((s, v) => s + v, 0);
  return sum > 0 ? pHatFrom[i] / sum : 0;
}
function pairwiseMIS(pHatFrom: number[], i: number, c: number, defensive = true): number {
  const M = pHatFrom.length, p = pHatFrom[c];
  const pair = (q: number) => p + (M - 1) * q;                      // 정준과의 쌍별 분모
  if (i !== c) {
    const w = pHatFrom[i] / pair(pHatFrom[i]);
    return defensive ? ((M - 1) / M) * w : w;
  }
  let s = 0;
  for (let j = 0; j < M; j++) if (j !== c) s += p / pair(pHatFrom[j]);
  return defensive ? (1 + s) / M : s / (M - 1);
}
// 이웃 i 의 가중치에는 p̂←i 와 p̂ 두 값만 필요 → 전체 O(M)
```

### 직접 계산

정준 표본 1개 + 이웃 4개(M = 5), `p̂←i` 를 0.1~2.0 에서 무작위로 뽑은 세 경우를 계산했다. 세 방식 모두 가중치 합이 1.000000 이었다. 한 예(`p̂←` = 1.072(정준), 1.906, 0.374, 1.902, 0.692):

| 방식 | 정준 | 이웃 1~4 |
| --- | --- | --- |
| 일반화 균형(Talbot) | 0.180 | 0.320, 0.063, 0.320, 0.116 |
| pairwise(균일) | 0.236 | 0.219, 0.146, 0.219, 0.180 |
| pairwise(방어) | 0.389 | 0.175, 0.116, 0.175, 0.144 |

- 모든 `p̂←` 가 같으면 균일 pairwise 는 모두 0.2(= 1/M), 방어형은 정준 0.36, 이웃 각 0.16 이었다.
- 역 이동 사상 + 목표 함수 평가(`p̂←j(y)`, 광선 추적이 따를 수 있음) 횟수를 세면 균형 휴리스틱은 `M(M−1)`(M = 8 에서 56, 32 에서 992), pairwise 는 `2(M−1)`(8 에서 14, 32 에서 62)이다. 이 셈은 정준 표본의 모든 쌍과 이웃마다 정준 쪽 평가 하나를 센 내 어림이다.

## 언제 쓰나

- **처음 구현·검증할 때**: 일반화 균형 휴리스틱. 강의 노트가 권하듯 느리지만 정확한 것으로 시작해 편향이 없음을 확인한다.
- **공간 재사용처럼 이웃이 많을 때**: 방어형 pairwise. GRIS 의 기본 선택이다.
- **이웃 수가 적은 시간 재사용**(이전 프레임 1개): Talbot 식도 감당할 만하다(GRIS 실시간 판의 선택).
- **비용이 최우선이고 약간의 편향을 받아들이면**: 상수 1/M + 이웃 거절(법선·깊이·재질 차이로 재사용 생략). 강의 노트는 이웃 거절을 Veach 의 컷오프 휴리스틱의 근사로 해석한다.

## 주의/비용

- **`p̂` 는 PDF 가 아니다.** 강의 노트는 `p̂_i` 가 정규화되지 않아 적분값이 픽셀마다 크게 다르면 MIS 가중치가 왜곡될 수 있다고 경고한다.
- **지지집합을 덮어야 한다.** 정준 표본을 반드시 포함해 `p̂` 의 지지집합 전체를 덮어야 비편향이다. 정준 표본 없이 이웃만 섞으면 일부 경로가 아예 빠진다.
- **pairwise 의 수렴 조건.** GRIS 는 정준 표본 수 |R| 가 O(√M) 보다 빨리 늘어야 수렴을 보장한다고 하고, |R| = 1 로 재사용 창만 키우면 수렴하지 않을 수 있다고 적는다.
- **표본 선택에 근거한 거절은 편향을 만든다.** 강의 노트는 도메인(법선·깊이)만 보고 이웃을 거르는 것은 괜찮지만, 개별 표본·가중치를 보고 거르면 조건부 확률로 바뀌어 편향이 된다고 설명한다.
- **비용의 실체는 광선이다.** `p̂←j(y)` 평가가 가시성 광선을 요구하면 O(M²) 와 O(M) 의 차이가 곧 광선 수 차이다.

## 비교

| 방식 | 비편향 | 비용(표본 M 개) | 잡음 성향 | 쓰인 곳 |
| --- | --- | --- | --- | --- |
| 1/M | 모든 출처가 지지집합을 덮을 때만 | O(M) | 낮음, 대신 어두운 편향 | ReSTIR 2020 편향 판 |
| 1/Z | 예 | O(M) | PDF 가 작은 출처가 있으면 큼 | ReSTIR 2020 비편향 판(알고리즘 6, 기여 가중치를 균일하게) |
| 기여 MIS | 예 | O(M) | 도메인 차가 크면 큼 | ReSTIR 2020 의 MIS 판(균형 휴리스틱, 알고리즘 6 과 "analogous") |
| 일반화 균형(Talbot) | 예 | O(M²) | 가장 낮음(표본당) | GRIS 시간 재사용 |
| pairwise(방어) | 예 | O(M × 정준 수) | Talbot 에 근접 | GRIS 공간 재사용 |

## 검증 범위

- 읽은 것: Bitterli 2020 4장, GRIS 본문 3.2·5.5·5.6·8·9.1절과 보충 S.1절, 강의 노트 3.4·5.3·7.1절과 알고리즘 5·7.
- 직접 계산: 무작위 `p̂←` 로 세 가중치의 합(=1) 확인, 동일 `p̂←` 경우, 평가 횟수 어림(Python).
- 미확인: pairwise MIS 원 제안(Bitterli 박사논문)의 원문, Talbot 2005 원문, GRIS 보충 S.1.3 이후의 경계 유도 세부, 각 방식의 실제 GPU 시간 비교(GRIS 는 "6~7배 저렴" 이라는 상대값만 제시).

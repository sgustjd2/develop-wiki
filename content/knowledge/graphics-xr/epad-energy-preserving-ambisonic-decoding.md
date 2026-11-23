---
title: EPAD — 특이값을 1로 바꿔 방향마다 음량을 같게 하는 앰비소닉스 디코더
aka: [EPAD, Energy-Preserving Ambisonic Decoding, Energy-Preserving Decoder, Constant-Energy Ambisonic Panning, Slepian Functions, Hemispherical Ambisonic Decoding]
category: graphics-xr
group: xr
level: advanced
summary: EPAD 는 스피커 방향 구면조화 행렬을 특이값 분해해 특이값을 모두 1로 바꾼 디코더다. 디코더가 열 직교(DᵀD = I)가 되어 어느 방향으로 패닝해도 출력 에너지가 같다. 스피커가 구면조화 개수 이상 있어야 하고, 반구 배치는 Slepian 기저로 그 조건을 낮춘다.
tags: [spatial-audio, ambisonics, decoder, epad, svd, spherical-harmonics, loudspeaker, slepian, xr]
related: [graphics-xr/ambisonics-speaker-decoders-maxre-allrad, graphics-xr/ambisonics-sound-field, graphics-xr/mdap-vbip-multiple-direction-panning, graphics-xr/vbap-dbap-amplitude-panning, graphics-xr/magls-binaural-ambisonics-decoding]
sources:
  - https://doi.org/10.3813/AAA.918490
  - https://dael.euracoustics.org/landing_pages/aaua/65156.html
  - https://pub.dega-akustik.de/DAGA_2012/data/articles/000410.pdf
  - https://link.springer.com/book/10.1007/978-3-030-17207-7
updatedAt: 2026-11-19
---

> 출처 메모: 원전 Zotter·Pomberger·Noisternig, "Energy-Preserving Ambisonic Decoding"(Acta Acustica united with Acustica 98(1), 2012, pp. 37–47)을 EAA 디지털 아카이브(DAEL)에서 내려받아 1~3장, 4장 일부(에너지·폭 척도), 5~7장을 읽었다. 같은 저자들의 DAGA 2012 단신(Pomberger·Zotter, "Ambisonic panning with constant energy constraint")과 Zotter·Frank, *Ambisonics*(Springer 2019, CC BY 4.0) 4.9.2~4.9.8절도 대조했다. 원전의 객관 척도(방향 오차 추정치) 정의식은 읽었지만 그림 값은 이미지라 읽지 못했다. 아래 표는 내가 직접 계산한 것이다.

## 문제

[앰비소닉스](/develop-wiki/knowledge/graphics-xr/ambisonics-sound-field/)를 스피커로 내보내는 흔한 디코더 두 가지는 스피커 배치가 고르지 않으면 **방향에 따라 음량이 달라진다**. 원전은 이것이 디코딩된 에너지의 변동 때문이라고 보고, 특히 거슬리는 결함으로 꼽는다.

- **샘플링 디코더(SAD)**: 스피커 방향에서 구면조화를 그대로 샘플링한다(`D = (4π/L)·Yᵀ`). 스피커가 드문 방향에서 **에너지가 줄어든다**.
- **모드 매칭 디코더(MAD)**: `Y·D = I` 를 풀어 역행렬을 쓴다. 드문 방향에서 작은 특이값이 역수로 커져 **에너지가 늘어나고**, 수치적으로 불안정하다. 원전은 Tikhonov 정규화나 절단 SVD 가 필요하다고 정리한다.

원전은 두 디코더의 에너지 변동 범위가 **구면조화 행렬 `Y` 의 특이값에만** 달려 있음을 보인다. SAD 는 특이값의 제곱, MAD 는 역제곱으로 에너지를 비튼다. 균일 배치(t-디자인)에서는 특이값이 모두 같아 문제가 없다.

## 해법

### 1. 특이값을 없앤 디코더 (원전 5장)

`Y`(크기 K×L, K = (N+1)² 개 구면조화 × L 개 스피커)를 컴팩트 SVD 로 `Y = Û Ŝ V̂ᵀ` 로 나눈다.

| 디코더 | 식 | 에너지에 미치는 항 |
| --- | --- | --- |
| SAD | `(4π/L)·V̂ Ŝ Ûᵀ` | `Ŝ²` |
| MAD | `V̂ Ŝ⁻¹ Ûᵀ` | `Ŝ⁻²` |
| **EPAD** | `V̂ Ûᵀ` | 없음 |

EPAD 는 특이값을 모두 1로 바꾼 것이다. `V̂`, `Û` 의 열이 직교하므로 `DᵀD = I` 가 되고, 디코딩된 에너지 `‖D·φ‖² = ‖φ‖²` 가 패닝 방향과 무관하게 일정하다. 책은 같은 해를 "SAD 에 가장 가까운(프로베니우스 노름) 열 직교 행렬" 로 다시 유도한다. 원전 결론은 이 디코더가 스피커 수만 충분하면 항상 만들 수 있고 수치적으로 안정하다고 적는다.

- **조건**: 스피커가 구면조화 개수 이상이어야 한다. 3D 는 `L ≥ (N+1)²`, 2D 는 `L ≥ 2N+1` (책). 원전 5장 본문의 부등호는 `L ≤ K` 로 인쇄되어 있는데, 같은 논문 6장과 책의 서술로 보아 `L ≥ K` 의 오식으로 읽었다.
- **균일 배치에서는 같은 것.** 스피커가 t ≥ 2N 디자인이면 SAD·MAD·EPAD 가 모두 같다(책 4.9.5절).
- **방향·폭.** 원전은 객관 척도(에너지 벡터 기반 방향 오차, 에너지 폭 `σ_E = 2·arccos‖r_E‖`)를 그림 6 으로 비교하며, EPAD 의 rE 기반 방향 오차 Ê 는 다른 디코더보다 약간 낫고, rV 기반 오차 V̂ 는 SAD·MAD 사이이며, 폭 σ̂E 는 큰 차이가 없다고 적는다(수치는 그림이라 읽지 못함).

```ts
// EPAD 디코더: Y(K×L) 의 SVD 를 받아 특이값을 버린다.
// svd 는 외부 선형대수 라이브러리가 준다고 가정 (U: K×M, V: L×M, 열 직교)
type Mat = number[][];
function epad(U: Mat, V: Mat): Mat {          // 결과 D: L×K = V·Uᵀ
  const L = V.length, K = U.length, M = U[0].length;
  return Array.from({ length: L }, (_, l) =>
    Array.from({ length: K }, (_, k) => {
      let s = 0;
      for (let m = 0; m < M; m++) s += V[l][m] * U[k][m];
      return s;
    }));
}
// 스피커 이득 = D · diag(max-rE 가중) · y_N(패닝 방향)
```

### 2. 반구 배치: Slepian 기저 (원전 6장, 책 4.9.8절)

돔·콘서트홀처럼 아래 스피커가 없으면 `L ≥ (N+1)²` 를 채우기 어렵고, 채우지 못하면 `Y` 의 영공간에 걸친 방향에서 에너지가 샌다. 원전 예(25대 반구, N = 5, K = 36)에서는 남반구와 빠진 스피커 근처에서 에너지가 보존되지 않았다.

1. 반구(조금 아래까지 넓힌 영역)에서 구면조화 곱의 적분, 즉 그람 행렬 `G = ∫ y yᵀ dθ` 를 수치 적분으로 구한다.
2. `G` 를 고유분해해 반구에 에너지가 몰린 새 직교 기저 `v = Uᵀ y`(Slepian 함수)를 얻는다.
3. 반구 에너지가 큰 것만 남긴다. 원전은 천정각 110° 까지 적분하고 에너지 비 β = 0.75 로 잘라 N = 5 에서 24개 함수를 얻었다. 책은 `(N+1)(N+2)/2` 개를 남기고, 차수별 적분 범위(N = 1 에서 115°, N = 5 에서 108° 등)와 그때의 음량 변동(0.2~0.5 dB)을 표 4.1 로 준다.
4. 새 기저에서 다시 EPAD 를 만든다. 스피커 하한이 남긴 함수 수 K̃ 로 내려간다(책 방식이면 `(N+1)(N+2)/2`).

원전의 IEM CUBE(24채널 반구) 적용에서는 기본 EPAD 가 천정 방향에서 에너지가 떨어졌고, 새 기저를 쓰면 변동이 1 dB 아래로 줄었지만 천정 근처 폭이 넓어졌다.

### 직접 계산: 45° 링에서 −90° 스피커 하나 뺀 경우 (2D)

책 그림 4.15·4.16 과 같은 설정(2D, N = 3, 스피커 7대 = 2N+1)을 원형 조화(`[1, √2 cos mφ, √2 sin mφ]`)와 2D max-rE 가중 `cos(nπ/(2N+2))` 로 계산했다. 패닝 방향 1° 간격 360개. 2D 단순 모형이라 원전·책의 3D 결과 재현이 아니다.

| 디코더 | 방향별 에너지 범위 | rE 방향 오차 평균 / 최대 | 반각 `arccos‖rE‖`(원전 폭 σ_E 의 절반) 최소~최대 |
| --- | --- | --- | --- |
| SAD | 6.77 dB | 4.9° / 30.8° | 0.0° ~ 50.3° |
| MAD | 8.64 dB | 12.2° / 138.1° | 15.9° ~ 89.6° |
| EPAD | 0.00 dB | 5.1° / 32.8° | 12.7° ~ 76.0° |
| EPAD, 스피커 하나 더 뺌(L = 6 < 2N+1) | 2.70 dB | 9.4° / 34.4° | 9.3° ~ 66.8° |

- `Y` 의 특이값은 2.83 이 여섯 개, 1.00 이 하나였다. 빠진 스피커가 만든 작은 특이값 하나가 SAD 에선 감쇠, MAD 에선 증폭으로 나타난다.
- EPAD 는 `DᵀD = I` 를 수치로 확인했고 에너지 변동이 0 이었다. 대신 구멍 근처 폭이 SAD 보다 넓다.
- 스피커가 `2N+1` 보다 적어지면 EPAD 도 에너지 보존이 깨진다.

## 언제 쓰나

- 스피커가 거의 구를 덮지만 몇 대 빠졌거나 간격이 조금 고르지 않을 때, **방향별 음량 일정**이 최우선이면.
- 스피커 수가 `(N+1)²`(반구는 `(N+1)(N+2)/2`) 이상인 큰 설비(돔, 콘서트홀 반구 배열).
- 원하는 차수보다 스피커가 모자라면 차수를 낮추거나 [AllRAD](/develop-wiki/knowledge/graphics-xr/ambisonics-speaker-decoders-maxre-allrad/)를 쓴다.

## 주의/비용

- **스피커 수 조건이 빡빡하다.** 책의 ITU 4+5+0(9대) 예에서 EPAD 는 N = 2 까지만 가능했고, 같은 배치의 AllRAD 는 N = 5 를 썼다. 책은 EPAD 의 음량 일정성이 장점이지만, AllRAD 의 작은 방향 오차·좁은 폭·유연성·단순성이 실무에서 더 낫다고 평가한다.
- **방향 사상이 더 출렁인다.** 책의 25채널 반구(mAmbA) 예에서 EPAD 는 음량 변동 0.3 dB(AllRAD 약 1 dB)였지만, 지평선 음원을 위로 끌어올리는 양이 7°(AllRAD 3°)였고 지평선 방향 폭이 약 30° 까지 넓어졌다. 책은 1 dB 미만 방향별 변동은 보통 들리지 않는다고 본다.
- **에너지 보존 ≠ 지각 음량 보존.** 원전 결론은 스피커 신호가 약하게 확률적으로 간섭한다는 가정에서 에너지 척도를 쓴다고 밝히고, 척도의 지각적 타당성은 비공식 청취로만 확인했으며 청취 실험은 진행 중이라고 적었다(2012년 기준).
- **반구 처리의 손잡이.** 적분 범위와 잘라낼 함수 개수(β)는 설계자가 정한다. 너무 좁게 자르면 지평선 근처가 약해진다고 원전이 말한다.
- **max-rE 는 별개.** EPAD 는 디코더 행렬이고, 부엽을 줄이는 차수별 가중은 바깥에서 곱한다.

## 비교

| 디코더 | 불규칙 배치에서 음량 | 방향 오차 | 스피커 수 조건 | 비고 |
| --- | --- | --- | --- | --- |
| SAD | 드문 방향 감쇠 | 보통 | 없음 | 가장 단순 |
| MAD | 드문 방향 증폭, 불안정 | 노트 2D 계산(rE 기준)에서 큼. 원전은 rV 를 정확히 맞춘다고 함 | `L ≥ K`, 불균일 배치에서는 정규화 필요 | 정규화 필요 |
| EPAD | 일정 | 원전: rE 오차 약간 작음, rV 오차는 SAD·MAD 사이 | `L ≥ K` (반구 Slepian 시 완화) | SVD 1회 |
| AllRAD | 약간 변동(예 1 dB) | 작음 | 사실상 없음 | VBAP·상상의 스피커 |

## 검증 범위

- 읽은 것: 원전 Acta Acustica 2012 본문(1~3장, 4장 척도, 5~7장), DAGA 2012 단신 전문, Zotter·Frank 책 4.9.2~4.9.8절.
- 직접 계산: 위 2D 표(Python·NumPy, SVD, max-rE 2D 가중). 3D 결과의 재현이 아니다.
- 미확인: 원전 그림 값(방향 오차·폭의 수치), 원전 4장의 객관 척도 유도 세부, 원전 이후 청취 실험 결과, 원전 5장 부등호가 오식이라는 판단(본문 다른 곳과 책 서술로 추정).

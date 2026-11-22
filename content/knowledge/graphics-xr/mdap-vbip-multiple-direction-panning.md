---
title: MDAP·VBIP — 여러 방향으로 패닝해 폭을 고르게, 이득 제곱으로 방향을 맞추기
aka: [MDAP, Multiple-Direction Amplitude Panning, VBIP, Vector Base Intensity Panning, Spread Angle, Source Spread, rE Vector, rV Vector]
category: graphics-xr
group: xr
level: intermediate
summary: VBAP 는 음원이 스피커 방향에 오면 스피커 하나만 울려 음상 폭과 음색이 위치마다 달라진다. MDAP 는 같은 신호를 원하는 방향 주변 여러 방향으로 동시에 패닝해 폭을 고르게 만들고, VBIP 는 이득의 제곱으로 벡터식을 풀어 에너지 벡터 방향을 맞춘다.
tags: [spatial-audio, panning, mdap, vbip, vbap, loudspeaker, amplitude-panning, xr]
related: [graphics-xr/vbap-dbap-amplitude-panning, graphics-xr/ambisonics-speaker-decoders-maxre-allrad, graphics-xr/epad-energy-preserving-ambisonic-decoding, graphics-xr/ambisonics-sound-field, graphics-xr/spatial-audio, graphics-xr/ambisonic-decoding-constant-angular-spread]
sources:
  - https://research.aalto.fi/en/publications/uniform-spreading-of-amplitude-panned-virtual-sources/
  - https://aaltodoc.aalto.fi/items/454e38fc-4bbc-4be6-ab8b-3f30b0f7fba0
  - https://link.springer.com/book/10.1007/978-3-030-17207-7
updatedAt: 2026-11-24
---

> 출처 메모: Pulkki, "Uniform Spreading of Amplitude Panned Virtual Sources"(IEEE WASPAA 1999, pp. 187–190)는 Pulkki 박사논문(2001) 묶음에 실린 사본의 텍스트판을 Aaltodoc 에서 받아 전체를 읽었다(식 기호 일부가 깨져 구조만 옮겼다). VBIP·MDAP 의 정리와 청취 실험 결과는 Zotter·Frank, *Ambisonics*(Springer 2019, CC BY 4.0) 2.2절(rV·rE 벡터)과 3.1~3.3절을 읽었다. **VBIP 를 처음 제안한 문헌은 읽지 않았다**(책 3.1절은 출처를 달지 않는다). 아래 비교표는 내가 직접 계산한 것이다.

## 문제

[VBAP](/develop-wiki/knowledge/graphics-xr/vbap-dbap-amplitude-panning/)는 음원 방향을 감싸는 스피커 2개(수평) 또는 3개(3D)만 켠다. 그래서 켜지는 스피커 수가 패닝 방향에 따라 1~3개로 바뀐다.

- 음원이 스피커 방향과 정확히 같으면 스피커 하나만 울린다. Pulkki 1999 는 이것이 사실상 "실제 음원" 이라 방향 퍼짐(directional spread)이 가장 작다고 설명한다.
- 스피커 사이에서는 두세 대가 울려 음상이 퍼지고 음색이 바뀔 수 있다.
- 그래서 **움직이는 음원**은 스피커를 지날 때마다 좁아졌다 넓어졌다 하고 음색도 출렁인다. Zotter·Frank 책은 이웃 삼각형의 공통 변을 넘을 때 예상보다 큰 변화가 생긴다고도 적는다.

방향 정확도와 별개로, VBAP 가 맞추는 방향은 진폭 가중 평균인 rV 벡터다. 책은 청취 실험 결과가 이득 제곱 가중인 rE 벡터로 더 잘 예측된다고 보고, 그것을 VBIP 의 동기로 든다.

## 해법

### 1. 두 가지 방향 모형 (책 2.2절)

스피커 방향 단위 벡터 `θ_l`, 이득 `g_l` 에 대해

- `rV = Σ g_l θ_l / Σ g_l` (속도 벡터, 진폭 가중)
- `rE = Σ g_l² θ_l / Σ g_l²` (에너지 벡터, 제곱 가중)

방향은 지각 방향의 예측, 길이 `‖rE‖` 는 음상 폭의 척도다. 책은 폭을 `arccos‖rE‖` 또는 `2·arccos‖rE‖` 로 각도화해 쓴다. 두 스피커 이득이 g2 = 2·g1 이면 rV 는 두 방향 사이의 2/3 지점, rE 는 4/5 지점에 놓인다(책의 예).

### 2. VBIP: 이득 제곱으로 푼 VBAP (책 식 3.4)

VBAP 는 `θ = L·g̃` 를 풀어 `g̃ = L⁻¹θ` 를 얻는다(`L` 은 스피커 방향 행렬). VBIP 는 같은 식을 **이득의 제곱**에 대해 푼다.

1. `g̃² = L⁻¹θ` 로 제곱 이득을 구한다.
2. 성분별 제곱근을 취한다.
3. `‖g‖ = 1` 로 정규화한다.

이렇게 하면 rE 방향이 패닝 방향과 맞는다. 켜지는 스피커 수는 VBAP 와 같으므로 **폭 변동 문제는 그대로**다. 책은 VBAP·VBIP 모두 스피커 방향에서 한 대만, 두 스피커 정중앙에서 두 대만 켜진다고 같은 단락에서 다룬다.

### 3. MDAP: 여러 방향으로 동시에 패닝 (Pulkki 1999)

- 원하는 방향 주변의 **여러 패닝 방향**에 같은 신호를 각각 VBAP 로 패닝해 합친다. 청취자는 여전히 하나의 음원으로 듣고, 패닝 방향들의 평균이 의도한 방향이 된다.
- 패닝 방향들 사이의 가장 큰 각을 **퍼짐 각(spread angle)** 이라 부르고, 이것으로 퍼짐 정도를 조절한다.
- 패닝 방향들이 모두 같은 스피커 쌍(삼각형) 안에 있으면 결과는 보통의 VBAP 와 같다. 즉 VBAP 가 이미 넓은 "스피커 사이" 영역은 더 나빠지지 않고, **스피커 방향 근처만 넓어진다**. 논문 결론의 요지가 이것이다.
- 2D 에서는 패닝 방향 2개면 된다. 3D 에서 항상 스피커 3대 이상을 켜려면 패닝 방향 3개가 필요하다. 스피커 간격이 고르지 않아 두 방향 사이에 스피커가 둘 이상 끼면 일부가 소리를 안 낼 수 있어, 방향을 더 늘리라고 한다.
- 논문은 퍼짐을 바이노럴 모형(HRTF 로 귀 신호를 만들고 ITD·ILD 분포를 계산)으로 시뮬레이션하고 비공식 청취로 확인했다. 5대(0°, ±30°, ±90°) 배치에서 퍼짐 각 20°·30° MDAP 는 스피커 방향의 퍼짐 극소가 사라졌다.

**퍼짐 각 정하기(책 3.2절).** 간격이 360°/L 인 균일 수평 링에서 가상 음원 두 개를 `φs ± α` 에 두고 `α = 0.9 × 180°/L` 로 하면 폭이 패닝 방향과 무관하게 가장 평탄하다고 한다(L = 6 이면 27°). 3D 에서는 주 가상 음원 둘레에 45° 기운 가상 음원 8개를 반 진폭으로 고리처럼 두는 예를 든다.

```ts
type Vec2 = [number, number];
const dir = (a: number): Vec2 => [Math.cos(a), Math.sin(a)];
// 2D VBAP 한 쌍. squared=true 면 VBIP (제곱 이득으로 풀고 제곱근)
function pair(phi: number, a: number, b: number, squared = false): [number, number] | null {
  const [p, l1, l2] = [dir(phi), dir(a), dir(b)];
  const det = l1[0] * l2[1] - l2[0] * l1[1];
  let g1 = (p[0] * l2[1] - l2[0] * p[1]) / det;
  let g2 = (l1[0] * p[1] - p[0] * l1[1]) / det;
  if (g1 < -1e-9 || g2 < -1e-9) return null;            // 이 쌍 밖
  if (squared) [g1, g2] = [Math.sqrt(Math.max(g1, 0)), Math.sqrt(Math.max(g2, 0))];
  return [Math.max(g1, 0), Math.max(g2, 0)];
}
function pan(phi: number, spk: number[], squared = false): number[] { // spk: 각도 오름차순 링
  const g = spk.map(() => 0);
  for (let i = 0; i < spk.length; i++) {
    const j = (i + 1) % spk.length, r = pair(phi, spk[i], spk[j], squared);
    if (r) { g[i] += r[0]; g[j] += r[1]; break; }
  }
  const n = Math.hypot(...g); return g.map((x) => x / n);
}
// MDAP: φ±α 두 방향 VBAP 이득을 더한 뒤 다시 정규화 (합산·정규화 방식은 내 가정)
const mdap = (phi: number, spk: number[], alpha: number) => {
  const a = pan(phi - alpha, spk), b = pan(phi + alpha, spk);
  const g = a.map((x, i) => x + b[i]); const n = Math.hypot(...g);
  return g.map((x) => x / n);
};
```

### 직접 계산: 60° 간격 6채널 링

방위 0°, 60°, …, 300° 스피커 6대, 패닝 방향 1° 간격 360개. MDAP 는 ±27°(= 0.9 × 30°)의 두 VBAP 이득을 **더한 뒤 ‖g‖ = 1 로 정규화**했다(Pulkki 1999 그림이 `‖g‖ = 1` 로 그렸다는 것만 확인했고, 합치는 식은 논문에 없어 내가 정했다).

| 방식 | 폭 `arccos‖rE‖` 최소~최대 | rE 방향 오차 평균 / 최대 | 켜지는 스피커 수 |
| --- | --- | --- | --- |
| VBAP | 0.6° ~ 30.0° | 5.70° / 8.81° | 1~2 |
| VBIP | 5.7° ~ 30.0° | 0.00° / 0.00° | 1~2 |
| MDAP ±27° | 29.3° ~ 30.0° | 0.39° / 1.10° | 2~3 |

- VBIP 는 rE 방향을 정확히 맞추지만 폭은 VBAP 처럼 출렁인다.
- MDAP 는 폭이 거의 일정해지고 rE 방향 오차도 VBAP 보다 작다. 책 그림 3.4 가 보여 주는 경향(폭 평탄, 각도 오차 감소)과 같은 방향이다.
- 0° 패닝에서 VBAP 이득은 (1, 0, …), MDAP 는 0° 스피커 0.862, ±60° 스피커 각 0.359 였다.

## 언제 쓰나

- **MDAP**: 음원이 스피커 배치를 가로질러 움직이는 장면(게임·XR·공연의 객체 기반 렌더링). 위치에 따라 음상 폭·음색이 출렁이는 것이 거슬릴 때.
- **VBIP**: 정지한 음원이 많고, rE 모형으로 예측한 방향을 맞추는 것이 중요할 때. VBAP 와 계산량이 같다.
- **VBAP 그대로**: 가장 날카로운 음상이 필요하거나 청취자가 스피커 사이 넓은 영역에 흩어져 있을 때. 책은 MDAP 가 중심 밖 청취 위치에서도 VBAP 만큼 강건하다고 하지만, 날카로움은 VBAP 가 낫다.
- 앰비소닉스 디코딩 쪽에서 같은 문제를 풀려면 [AllRAD](/develop-wiki/knowledge/graphics-xr/ambisonics-speaker-decoders-maxre-allrad/)를 본다. 책은 AllRAD 를 "MDAP 의 이산 가상 음원을 연속 분포로 바꾼 것" 으로 소개한다.

## 주의/비용

- **폭이 넓어지는 대가.** 책 요약대로 MDAP 는 방향 독립성을 얻는 대신 음상이 넓어지고, 중심 밖 위치의 정위 정확도가 떨어진다.
- **불규칙 배치에서는 최적화가 필요하다.** 책 3.2절은 3D 불규칙 배치에서 가상 음원들의 rV 길이가 서로 달라 합성 벡터가 길이가 긴 쪽으로 휘므로, 방향마다 가상 음원의 각도·가중을 다시 최적화해야 정확하다고 하며 Epain 등의 논문을 가리킨다. 그 논문은 [일정 각 퍼짐 앰비소닉 디코딩](/develop-wiki/knowledge/graphics-xr/ambisonic-decoding-constant-angular-spread/) 노트에서 다룬다(논문이 최적화하는 것은 방향별 창 구경 α 이고 보조 방향은 동심 고리로 고정이라, 책의 "방향·가중 최적화" 요약과 정확히 같지는 않다).
- **계산량.** 패닝 방향 수만큼 VBAP 를 반복한다(2D 2회, 3D 예시는 9회). 이득은 미리 표로 만들어 둘 수 있다.
- **아래쪽 구멍은 그대로.** 책은 아래쪽 스피커가 없는 반구 배치에서 VBAP·VBIP·MDAP 모두 아래 방향 패닝이 수치적으로 불안정하고 의미가 없다고 적는다. [상상의 스피커](/develop-wiki/knowledge/graphics-xr/vbap-dbap-amplitude-panning/)를 넣어 메운다.
- **합산 방식 미확인.** MDAP 가상 음원 이득을 진폭으로 더한 뒤 정규화할지, 다른 방식으로 합칠지 Pulkki 1999 본문은 명시하지 않는다. 위 표의 결과는 내 선택에 의존한다.

## 비교

| 구분 | VBAP | VBIP | MDAP |
| --- | --- | --- | --- |
| 푸는 식 | `θ = L·g` | `θ = L·g²` | 여러 방향 VBAP 합 |
| 맞추는 방향 | rV | rE | 평균 방향 (rV 기반) |
| 켜지는 스피커 | 1~3 | 1~3 | 퍼짐 각에 따라 더 많음 |
| 폭 변동 | 큼 | 큼 | 작음 |
| 조절 손잡이 | 없음 | 없음 | 퍼짐 각 |
| 비용 | 역행렬 1회 | 역행렬 1회 + 제곱근 | VBAP × 방향 수 |

## 검증 범위

- 읽은 것: Pulkki 1999 WASPAA 논문 전문(텍스트판), Zotter·Frank 책 2.2.7~2.2.8절, 3.1~3.3절.
- 직접 계산: 위 6채널 링 표(Python, `‖g‖ = 1` 정규화, MDAP 합산 방식은 내 가정).
- 미확인: VBIP 의 원 제안 문헌과 연도, 책이 인용한 청취 실험 논문들의 원문, Epain 등 논문 본문의 그림 값, Pulkki 1999 의 바이노럴 모형 수치(그림 값은 읽지 못함).

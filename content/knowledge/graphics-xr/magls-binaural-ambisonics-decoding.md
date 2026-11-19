---
title: MagLS — 저차 앰비소닉스를 바이노럴로 디코딩할 때 위상을 버리고 크기를 맞추는 HRTF 전처리
aka: [MagLS, Magnitude Least Squares, Ambisonics Binaural Rendering, Binaural Ambisonics Decoding, Masked MagLS, MMagLS, Low-order HRTF Representation]
category: graphics-xr
group: xr
level: advanced
summary: 저차 앰비소닉스 바이노럴 렌더링은 HRTF 를 구면 조화 계수로 줄여 쓰는데, 단순 최소제곱은 고주파에서 음색이 무너진다. MagLS 는 차단 주파수 위에서 위상을 포기하고 크기만 맞춰 음색 오차를 줄인다.
tags: [spatial-audio, ambisonics, binaural, hrtf, magls, spherical-harmonics, headphones, low-order, xr]
related: [graphics-xr/ambisonics-sound-field, graphics-xr/hrtf-binaural-rendering, graphics-xr/hrtf-interpolation-personalization, graphics-xr/spatial-audio]
sources:
  - https://arxiv.org/abs/2501.18224
updatedAt: 2026-11-19
---

> 출처 메모: Berebi·Brinkmann·Weinzierl·Rafaely, "Ambisonics Binaural Rendering via Masked Magnitude Least Squares"(arXiv 2501.18224, 2025)를 전문 읽었다. 이 논문의 II장이 LS·MagLS 를 요약해 소개하므로 MagLS 의 식은 그 요약을 근거로 쓴다. **MagLS 를 처음 제안한 Schörkhuber·Zaunschirm·Höldrich(DAGA 2018) 원문은 열리지 않아 읽지 못했고**, 지각 평가의 일반 결론은 이 논문이 인용하는 문장에만 의존한다. 위상 보간·시간 정렬 방식(HRIR time alignment), 확산장 제약, 스피커 디코더(max-rE 등)는 다루지 않는다. 아래 수치 실험은 **합성 HRTF**(구형 머리 지연 + 매끄러운 그림자)로 한 단순 확인이며 실측 HRTF·청취 시험이 아니다.

## 문제

[앰비소닉스](/develop-wiki/knowledge/graphics-xr/ambisonics-sound-field/)로 음장을 실어 헤드폰에서 듣게 하려면 **바이노럴 디코딩**이 필요하다. 한 가지 정식화는 음장의 구면 조화(SH) 계수 `a_nm` 과 청자의 HRTF 의 SH 계수 `H_nm` 을 곱해 양 귀의 신호 `p = ã_nm^H H_nm` 을 얻는 것이다(논문 식 (1)). 이 계산은 음원 수와 무관하고 장면·청자 회전도 쉽다.

문제는 차수 `N` 이다. 마이크 배열이나 전송 대역폭 때문에 `N` 이 1~3 으로 낮은 경우가 많고, 그러면 **HRTF 도 같은 저차로 줄여야 한다**. 조밀하게 측정된 HRTF 를 저차 SH 로 투영하는 가장 쉬운 방법은 최소제곱(LS)인데, 낮은 차수에서는 음색 번짐과 위치 오류가 심하다(논문이 인용하는 선행 연구들).

## 해법

### LS, 그리고 LS 가 맞는 주파수

방향 `Ω` 에서 HRTF `h(Ω)` 를 SH 기저 `y(Ω)` 로 맞추는 문제를 손실 `L` 로 쓴다.

```
LS      : L = | h_nmᴴ y − h |²          → h_nm = Y⁺ h   (닫힌 해, 의사역행렬)
MagLS   : L = | |h_nmᴴ y| − |h| |²      → 닫힌 해 없음 (비볼록)
```

LS 는 크기와 위상을 모두 맞추려 하지만 `N ≤ k r`(`k` 는 파수, `r` 은 머리 반지름) 조건이 지켜지는 **차단 주파수 아래**에서만 물리적으로 맞다. 논문 식 (5)는 `f_c = c N / (2π r)` 이다. 머리 반지름 8.75 cm 로 계산하면 `N = 1` 에서 약 624 Hz, `N = 3` 에서 약 1872 Hz 다(논문 평가는 `N = 1` 에서 `f_c = 680 Hz` 를 썼다).

### MagLS: 차단 주파수 위에서는 크기만

MagLS 는 `f_c` 아래에서는 LS 를 쓰고 위에서는 **위상을 무시하고 크기만 맞춘다**. 비볼록이라 닫힌 해가 없으므로 실무 표준은 반복 방식이다. 주파수 빈을 `f_c` 부터 위로 올라가며, **직전 빈에서 복원된 위상**에 **현재 빈의 HRTF 크기**를 붙여 LS 로 푼다(논문 식 (7)).

```
h_nm(f) = Y⁺ · ( |h(f)| ⊙ exp(i · ∠( h_nm(f−1)ᴴ Y )) )
```

논문은 `f_c` 근처에서는 두 해 사이를 페이드하는 것이 일반적이라고 적는다(구체적 페이드 곡선은 이 노트에서 확인하지 않았다). 논문은 이를 음색(coloration) 쪽 오차를 줄이는 최적화라고 설명하며, 음색은 오디오 품질에서 가장 중요한 요소 중 하나라고 인용한다. 대신 **귀 사이 시간차(ITD), 레벨차(ILD), 확산장 상관**의 오차는 남는다고 논문은 지적한다.

```ts
// 의사 코드 (복소 벡터·행렬 연산 라이브러리 가정)
function magLs(Yplus: CMat, Y: CMat, H: CVec[], freqs: number[], fc: number): CVec[] {
  const out: CVec[] = [];
  let prev: CVec | null = null;
  for (let i = 0; i < freqs.length; i++) {
    if (freqs[i] <= fc) {
      prev = matVec(Yplus, H[i]);                       // LS
    } else {
      const phase = angle(matVec(Y, prev!));            // 직전 빈의 복원 위상
      const target = mul(abs(H[i]), expi(phase));       // 현재 크기 + 이전 위상
      prev = matVec(Yplus, target);
    }
    out.push(prev!);
  }
  return out;
}
```

### 직접 확인: 합성 HRTF 로 LS 와 MagLS 비교

구형 머리 모형의 도착 지연과 매끄러운 그림자로 한쪽 귀의 합성 HRTF 를 만들고(실측 아님), 구면 피보나치 격자 500 점에서 `N = 1, 3` 의 LS 와 위 반복식 MagLS 를 비교했다.

| 차수 `N` | `f_c` | `f_c` 이상 크기 오차 RMS(dB) LS | MagLS | `f_c` 이하(둘 같음) |
| --- | --- | --- | --- | --- |
| 1 | 624 Hz | 15.4 | 0.30 | 0.70 |
| 3 | 1872 Hz | 12.6 | 0.23 | 0.32 |

`f_c` 이상에서 LS 는 크기가 크게 어긋나고 MagLS 는 거의 맞는다. 대신 목표 위상과의 차이(귀 하나 기준 중앙값)는 커진다.

| `N` | 500 Hz | 2 kHz | 5 kHz |
| --- | --- | --- | --- |
| 1 | 4° | 93° | 89° |
| 3 | 0° | 24° | 82° |

즉 위상을 포기한 값은 `f_c` 위에서 눈에 띄게 어긋난다. 합성 HRTF 가 매끄러워 MagLS 오차가 비현실적으로 작다. 실측 HRTF 의 귓바퀴 노치는 저차로 표현하기 훨씬 어렵다.

### 확장: 마스크드 MagLS (MMagLS)

논문은 MagLS 가 정중면 위치 지각을 해친다는 점을 보완하려고 손실에 **스펙트로-공간 가중 마스크** `M(Ω, f)` 를 곱한다(식 (8)). 마스크는 귓바퀴 노치 근처의 크기 정확도를 더 중시하도록 만든다(4~20 kHz 범위, 값은 1~4 로 제한, 반대쪽 귀 방향 60° 안은 1). 해는 작은 신경망(약 70k 매개변수)으로 Adam 최적화해 얻는다. KU100 더미 헤드, `N = 1`, 2702 방향 레베데프 격자 평가에서, 정중면 위치 모형 기준 기준선 대비 MagLS 의 극각 오차(PE) 증가는 15°, 사분면 오차(QE) 증가는 10%, MMagLS 는 8°, 4% 였다. 대가는 6~20 kHz 평균 크기 오차가 −8.8 dB 에서 −6.1 dB 로 약간 나빠진 것이다. 학습은 M2 Max 노트북에서 약 2분이라고 한다.

이 결과는 한 데이터(KU100)와 한 차수(`N = 1`)에 대한 **모형 기반** 평가이고 청취 실험이 아니다.

## 언제 쓰나

- 1~3차 앰비소닉스를 **헤드폰으로** 재생하는 앱(360 영상, VR). 같은 앰비소닉스 스트림으로 여러 청자·회전을 처리하는 구조에서 HRTF 를 한 번 전처리해 두면 된다.
- 조밀한 HRTF 를 저차 SH 로 줄여야 하는 모든 파이프라인(전송 대역폭 제한 포함).
- 개인 HRTF 가 있으면 같은 전처리를 [개인화 HRTF](/develop-wiki/knowledge/graphics-xr/hrtf-interpolation-personalization/)에 적용할 수 있다(이 노트는 개인화 효과를 검증하지 않았다).

## 주의/비용

- **저차에서 한계가 남는다.** 논문은 MagLS 도 낮은 차수에서 정중면 위치, ITD·ILD, 확산장 일관성이 나쁘다고 말한다.
- **위상 포기의 대가.** `f_c` 이상에서 양이 간 위상 일관성이 떨어진다. 순수 저주파 음원이나 ITD 가 중요한 콘텐츠는 영향이 클 수 있다.
- **차단 주파수는 머리 크기 가정.** `f_c` 는 머리 반지름에 의존하므로 평균값 가정이 개인과 어긋나면 위에서 "위상을 포기하는 구간" 이 어긋난다.
- **반복 해의 의존성.** 직전 빈의 위상에 의존하는 순차 계산이라 병렬화가 어렵고, 시작 위상이 나쁘면 오류가 위로 전파될 수 있다(구현 시 확인 필요).
- **MMagLS 는 연구 단계.** 학습 기반이고 평가가 단일 데이터셋이다. 논문은 MagLS 를 현재의 사실상 표준이라고 서술한다.
- 이 방식은 **HRTF 를 줄이는 전처리**이고 음장 자체를 개선하지 않는다. 음원 정위는 앰비소닉스 차수의 한계를 그대로 가진다.

## 비교

| 방법 | 손실 | 해 | 차단 주파수 위 거동 | 비고 |
| --- | --- | --- | --- | --- |
| LS | 복소 오차 | 닫힌 해 | 크기·위상 모두 어긋남, 음색 번짐 | 저차에서 품질 낮음 |
| LS + 후처리(대각 보정, 윈도잉) | LS | 닫힌 해 + 필터 | 일부 완화 | 논문이 선행 방법으로 언급 |
| MagLS | 크기 오차 | 반복(비볼록) | 위상을 버리고 크기만 맞춤 | 현재 사실상 표준(논문 서술) |
| MMagLS | 마스크 곱한 크기 오차 | 신경망 최적화 | 노치 구간의 크기를 더 맞춤 | 연구 단계 |

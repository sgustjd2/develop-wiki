---
title: VBIP 의 원 문헌 — Pernaux·Boussard·Jot 1998 이 정의한 Vector Base Intensity Panning
aka: [VBIP, Vector Base Intensity Panning, Pernaux Boussard Jot 1998, VBP, Vector Base Panning, DAFx-98 Genesis]
category: graphics-xr
group: xr
level: advanced
summary: 이 5쪽 DAFx-98 논문이 VBIP 를 도입했다고 쓴다(Epain 2014 도 이를 출처로 인용). VBAP 와 같은 역행렬을 쓰되 그 결과를 이득이 아니라 이득의 제곱으로 읽어 700 Hz 위에서 에너지 벡터 방향을 맞추며, 5.1 배치에서 앰비소닉스와 비교했다.
tags: [spatial-audio, panning, vbip, vbap, ambisonics, energy-vector, "5.1", loudspeaker, xr]
related: [graphics-xr/mdap-vbip-multiple-direction-panning, graphics-xr/vbap-dbap-amplitude-panning, graphics-xr/ambisonic-decoding-constant-angular-spread, graphics-xr/ambisonics-speaker-decoders-maxre-allrad, graphics-xr/spatial-audio]
sources:
  - https://www.dafx.de/paper-archive/1998/PER15.PS.pdf
  - https://www.dafx.de/paper-archive/search?q=Pernaux&w=author&s=relevance
  - https://doi.org/10.3813/AAA.918772
  - https://dael.euracoustics.org/bin/EAA/aaua_dl?document_id=51959
updatedAt: 2026-11-24
---

> 출처 메모: J.-M. Pernaux, P. Boussard, J.-M. Jot, "Virtual Sound Source Positioning and Mixing in 5.1 Implementation on the Real-Time System Genesis", DAFx-98(Barcelona, 1998)를 DAFx 논문 아카이브가 공개한 PDF(5쪽)로 **전문** 읽었다. 텍스트 추출은 식이 깨져, 식이 있는 쪽을 이미지로 렌더링해 눈으로 확인했다. 서지는 아카이브 검색 결과와 Epain·Jin·Zotter 2014 참고문헌 [17] 로 대조했다. 아래 계산은 내가 직접 한 것이다.

## 문제

[MDAP·VBIP 노트](/develop-wiki/knowledge/graphics-xr/mdap-vbip-multiple-direction-panning/)는 VBIP 를 책(Zotter·Frank) 기준으로 설명하고 "처음 제안한 문헌은 읽지 않았다" 고 적었다. 이 노트는 그 빈칸이다. 물을 것은 셋이다. 이름이 원문에서 나왔는가, 식이 책과 같은가, 원문은 무엇을 주장하는가.

## 서지 확인

| 항목 | 아카이브·논문 표지 | Epain 2014 [17] |
| --- | --- | --- |
| 저자 | Jean-Marie Pernaux, Patrick Boussard, Jean-Marc Jot | J.-M. Pernaux, P. Boussard, J.-M. Jot |
| 제목 | Virtual Sound Source Positioning and Mixing in 5.1 Implementation on the Real-Time System Genesis (아카이브 목록은 "5.1." 로 마침표가 붙어 있다) | 같음 (소문자 표기) |
| 학회 | DAFx-98, Barcelona | Proc. Conf. DAFx-98, Barcelona, November 1998 |
| 쪽 | PDF 는 5쪽. 쪽 번호 인쇄는 PDF 에 없음 | 76–80 |

- 소속은 Steria/Digilog(Aix-en-Provence)와 IRCAM(Paris)이다.
- 쪽수 76–80 은 Epain 의 표기만으로 확인했고(5쪽 분량과는 모순이 없다), 이 PDF 자체에서는 확인하지 못했다.

## 원문이 말하는 것

### 이름과 위치

- 서론은 VBAP 와 앰비소닉스의 연결을 보면 "Vector Base Intensity Panning(VBIP)" 이라는 새 방법이 나온다고 쓴다. Gerzon 의 고주파 정위 모형에서 파생했다고 밝힌다. 결론도 Pulkki 의 VBAP 를 변형해 고주파 강도 기반 정위 기준에 맞춘 것을 VBIP 로 "termed" 했다고 쓴다.
- 이름은 이 논문이 직접 붙였다고 쓴다(결론: "thus termed VBIP"). 다만 "이 논문이 처음" 이라는 단정은 이 논문 하나로는 못 하고, 서론과 결론이 새로 도입했다고 쓴 점과 Epain 2014 가 VBIP 의 출처로 이 논문을 인용한 점이 근거다.
- 초록은 VBIP 라는 이름을 쓰지 않고 "Vector Base Panning(VBP)" 만 쓴다. 논문에서 VBP 는 **VBAP(700 Hz 아래)와 VBIP(위)를 합친 주파수 의존 방식** 이라는 총칭이다.

### 식 (2.2.2절)

원문은 2D 에서 스피커 한 쌍(base)을 고르고 두 스피커만 켠다. 쌍 고르는 절차는 Pulkki 1997 을 가리키고 직접 쓰지 않는다. 방위 θ₁, θ₂ 인 쌍, 목표 방위 θ 에 대해(방위는 x 축 앞, y 축 왼쪽 기준):

- 공통: `[G₁ G₂]ᵀ = L⁻¹ [cos θ, sin θ]ᵀ`, `L = [[cos θ₁, cos θ₂], [sin θ₁, sin θ₂]]`
- VBAP(< 700 Hz): 조건 (A) 속도 벡터가 θ 를 가리킴. `G_i = g_i / r_V`, `g_i = G_i / √(ΣG_j²)`
- VBIP(> 700 Hz): 조건 (C) 강도 벡터가 θ 를 가리킴. `G_i = g_i² / r_E`, 즉 **같은 `G` 가 이득이 아니라 이득의 제곱** 으로 읽힌다. 정규화 후 `g_i = √(G_i / ΣG_j)`
- 조건 (E): 제곱 이득의 합이 1(음원 크기가 θ 와 무관하게 일정).

이득 정규화가 "진폭이 아니라 강도(제곱합) 기준" 이라는 서술은 절반만 맞다. VBAP 도 `Σg² = 1` 로 정규화한다. 달라지는 것은 **역행렬 해를 무엇으로 읽느냐** 다. VBAP 는 진폭, VBIP 는 제곱 이득(강도)이다.

원문 식의 흠(이미지로 확인):
- VBAP 의 `L` 행렬 둘째 행이 `[sin θ₁, cos θ₂]` 로 인쇄돼 있다(조건 (A)의 행렬과 그 역행렬 두 곳 모두). 문맥상 `sin θ₂` 의 오타로 읽는다.
- VBIP 의 정규화를 `r_E² ΣG_i² = 1` 로 쓰면서 이어지는 결과식은 `ΣG_i` 로 나눈다. `g_i² = r_E G_i`, `Σg_i² = 1` 에서 `r_E ΣG_i = 1` 이 나오므로 **결과식이 맞고 중간 식의 제곱은 불일치** 다. 내 계산은 결과식을 썼다.

### 5.1 맥락과 Genesis

- 스피커 배치: 정면 중앙 CF, 앞 좌우 LF·RF, 뒤 좌우 LB·RB. 논문은 앞 스피커 각 Φ_F = 45°, 뒤 Φ_B = 50° 로 정했다. Φ_B 는 뒤쪽 축에서 잰 각으로 그림을 읽으면 LB 가 약 130° 다(내 해석). 흔히 쓰이는 5.1 배치(±30°, ±110° 안팎; 일반 지식, 이 노트에서 ITU-R BS.775 는 확인하지 않았다)와 다르다.
- 비교한 네 가지: 저주파 앰비소닉스, 고주파 앰비소닉스, VBAP, VBIP. 앰비소닉스 디코더 계수는 Gerzon 의 HDTV 디코더 논문[8] 에 맡긴다.
- Genesis: Steria/Digilog 가 개발한 실시간 DSP 시스템으로, 기본 구성에서 최대 16개의 아날로그 출력을 낸다. 이 논문에서는 **비교용 구현 플랫폼** 이다. VBIP 가 Genesis 의 기능이라는 서술은 없다.
- 청취 실험: 7명, 비공식. 저주파(베이스 드럼)·중고주파(스네어) 자극, 0°, 22.5°, 90°, 180° 에 고정한 음원(원문 표기 `0°-22,5°-90°-180°`, 하이픈은 구분자이고 소수점은 쉼표)과 회전 음원. 방법을 실시간으로 바꿔 가며 "가장 정위하기 쉬운 것" 을 고르게 했다.

### 주장

- VBAP 는 θ_V = θ 를, VBIP 는 θ_E = θ 를 보장한다(관찰 a).
- 정면 정위가 네 방법 모두 더 낫다(b). 저주파에서는 앰비소닉스만 모든 θ 에서 r_V 를 최적으로 한다(c). 고주파에서는 VBP 쪽이 앰비소닉스보다 r_E 가 높다(d).
- 고정 음원은 VBP 가 정위가 정확하고, 움직이는 음원은 앰비소닉스가 낫다는 응답이 나왔다고 쓴다. 스피커가 덜 "존재" 하는 것처럼 들린다는 이유다. 논문 스스로 r_E·r_V 변동이 커서 움직이는 음원에는 앰비소닉스가 낫겠다고 짚는다.
- 불규칙 배치(5.1)에서 앰비소닉스 디코더 설계는 번거롭고 VBP 는 어떤 배치에도 쉽게 적용된다고 결론짓는다. 앞으로 할 일로 base 선택 알고리즘의 연산량 개선과 더 큰 청취 실험을 든다.

### 5.1 렌더링 외의 내용

- 2.3절: 2D 배치에서 위쪽 음원을 다루는 법. 앰비소닉스는 Z 채널의 에너지를 W 에 합친다(`W = P√(1+2sin²φ)`, 천정이면 모든 스피커가 울림). VBP 는 천정에 가상 스피커를 하나 두고 그 이득을 실제 스피커 N 개에 나눠 준 뒤 정규화한다. 고도 20° 가상 스피커 방식은 세 스피커만 울려 내부 위치에서 상이 "jumpy" 해진다고 설명한다. 이 부분은 [VBAP 노트](/develop-wiki/knowledge/graphics-xr/vbap-dbap-amplitude-panning/)의 상상의 스피커와 같은 계열이다.
- 서론과 초록이 말하는 "새로운 local 패닝 방법" 은 VBIP 를 가리키는 것으로 읽힌다(내 해석).

## 직접 계산: 원문 정의로 5.1 좌-중앙 쌍

논문 식(`G = L⁻¹p`; VBAP `G/‖G‖`, VBIP `√(G/ΣG)`)을 그대로 numpy 로 구현했다. 배치는 논문의 Φ_F = 45°, Φ_B = 50° 해석(0°, ±45°, ±130°)이고, 쌍 선택은 인접 스피커 중 이득이 모두 0 이상인 쌍으로 했다(내 구현). 중앙(0°)–좌(45°) 쌍:

| 목표 θ | VBAP (중앙, 좌) | VBIP (중앙, 좌) | VBAP 의 rE 방향 | VBIP 의 rV 방향 |
| --- | --- | --- | --- | --- |
| 0° | 1.000, 0.000 | 1.000, 0.000 | 0.0° | 0.0° |
| 10° | 0.957, 0.290 | 0.876, 0.482 | 3.5° | 15.7° |
| 22.5° | 0.707, 0.707 | 0.707, 0.707 | 22.5° | 22.5° |
| 35° | 0.290, 0.957 | 0.482, 0.876 | 41.5° | 29.4° |
| 45° | 0.000, 1.000 | 0.000, 1.000 | 45.0° | 45.0° |

- VBIP 는 목표에서 먼 쪽 스피커에 VBAP 보다 이득을 더 준다(10° 에서 좌 스피커 0.482 대 0.290). 쌍의 끝과 가운데(22.5°)에서는 둘이 같다.
- 5개 전체 링을 0.5° 간격으로 훑으면 VBAP 는 rV 방향 오차 0, rE 방향 오차 최대 14.0°. VBIP 는 반대로 rE 오차 0, rV 오차 최대 14.0° 였다. 이 숫자는 이 배치와 내 쌍 선택에서의 값이다.
- r_E 최솟값은 두 방식 모두 0.643 이었다(뒤쪽 130°–(−130°) 쌍 가운데). 논문 그림 3 에서 VBP 곡선의 바닥이 0.6 중반인 것과 눈으로 보아 같은 범위다. 그림 값을 읽어 비교한 것은 아니다.
- 중간 위치의 폭: 같은 쌍에서 5° 일 때 `‖rE‖` 가 VBAP 0.995, VBIP 0.969 다. VBIP 는 스피커 방향 근처에서 폭이 VBAP 보다 일찍 넓어진다.

```ts
// 2D 한 쌍. 논문 2.2.2절: G = L^-1 p, VBAP 는 G/||G||, VBIP 는 sqrt(G/ΣG)
function pairGains(theta: number, t1: number, t2: number, vbip: boolean): [number, number] {
  const [c1, s1, c2, s2] = [Math.cos(t1), Math.sin(t1), Math.cos(t2), Math.sin(t2)];
  const det = c1 * s2 - c2 * s1;
  const G1 = (Math.cos(theta) * s2 - c2 * Math.sin(theta)) / det;
  const G2 = (c1 * Math.sin(theta) - s1 * Math.cos(theta)) / det;
  if (vbip) { const s = G1 + G2; return [Math.sqrt(G1 / s), Math.sqrt(G2 / s)]; }
  const n = Math.hypot(G1, G2);
  return [G1 / n, G2 / n];
}
```

## 기존 MDAP·VBIP 노트와의 대조

- 일치: 역행렬 해를 이득의 제곱으로 읽고 제곱근을 취해 `‖g‖ = 1` 로 정규화한다는 식은 원문과 같다(원문의 `√(G/ΣG)` 와 동치). rE 방향을 맞추고 쌍 선택은 VBAP 와 같다는 점도 같다.
- 차이 1: 원문은 VBIP 를 **700 Hz 위에서만 쓰는 고주파 법칙** 으로 정의하고 VBAP 와 짝을 이뤄 주파수 의존 VBP 를 이룬다고 한다. 기존 노트는 주파수 분할을 말하지 않는다.
- 차이 2: 원문의 동기는 Gerzon 의 속도·에너지 모형이다. 책 3.1절의 "청취 실험이 rE 로 더 잘 예측된다" 는 서술과 결이 같지만, 원문이 인용하는 근거는 Gerzon 1992 다.
- 차이 3: 원문 식은 **2D 한 쌍** 만 다룬다. 3D 삼각형 VBIP 의 식은 원문에 없다(3D VBP 는 Pulkki 1997 을 참조하라고만 한다). 기존 노트의 "1~3개 스피커" 는 책 기준 서술이다.
- 차이 4: 기존 노트의 "정지한 음원에는 VBIP" 는 원문의 청취 결과(고정 음원은 VBP, 움직이는 음원은 앰비소닉스)와 방향이 같다. 단 원문은 7명 비공식 실험이고, MDAP 와의 비교는 없다(MDAP 는 1999년 논문이다).
- 이 노트가 기존 노트를 고치지는 않았다.

## 언제 쓰나

- VBIP 를 쓰는 근거나 이름의 출처를 인용해야 할 때. 또는 5.1 같은 불규칙 배치에서 앰비소닉스 디코더 설계 대신 쌍 기반 패닝으로 가는 이유를 볼 때.
- 구현에서는 [MDAP·VBIP 노트](/develop-wiki/knowledge/graphics-xr/mdap-vbip-multiple-direction-panning/)의 3D·MDAP 확장을, 앰비소닉스 쪽에서의 사용은 [일정 각 퍼짐 디코딩](/develop-wiki/knowledge/graphics-xr/ambisonic-decoding-constant-angular-spread/)을 본다.

## 주의/비용

- 원문은 5쪽 학회 논문이고 청취 실험은 7명 비공식이다. "VBIP 가 더 좋다" 는 결론을 끌어내기에는 약하다. 논문 자신도 더 큰 실험이 필요하다고 한다.
- 위 계산의 쌍 선택·배치 각도는 내 해석이다. 원문은 쌍 선택을 Pulkki 1997 에 맡기고 뒤 스피커 각을 그림으로만 준다.
- 쌍 안쪽에서 VBAP 와 VBIP 는 서로의 방향 모형(rV 대 rE)을 어긋나게 한다. 둘 중 하나만 맞추고 주파수로 나눠 쓰려면 700 Hz 크로스오버 필터가 필요하다. 원문의 앰비소닉스 쪽 처리는 LF·HF 매트릭스 앞의 저역·고역 통과 필터이고, VBP 의 구체적 필터 구현은 원문에 없다.
- 스피커 방향과 일치할 때 한 대만 울리는 문제와 움직이는 음원에서의 폭 변동은 그대로다. 논문도 움직이는 음원에는 앰비소닉스가 낫겠다고 짚는다(원문 "might recommend Ambisonics").

## 검증 범위

- 읽은 것: DAFx-98 PER15 PDF 전문(5쪽, 식 쪽은 이미지로 확인), DAFx 아카이브 검색 결과와 초록, Epain 등 2014 의 3절과 참고문헌 [17].
- 직접 계산: 위 표와 전체 링 sweep(원문 식, 내 배치·쌍 선택).
- 못 읽은 것: 원문이 인용한 Pulkki 1997, Gerzon 1992 두 편, 원문 그림 2·3 의 정확한 값.
- 미확인: 원문 쪽 번호 76–80(Epain 표기만), "VBIP 의 첫 제안" 이라는 서술을 다른 문헌으로 교차 확인하지 못함, Φ_B 의 정확한 기하(그림 해석), Genesis 시스템 자체의 사양(원문의 한 문장 외).

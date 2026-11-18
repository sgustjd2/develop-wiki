---
title: HBAO 와 GTAO — 수평선 기반 앰비언트 오클루전
aka: [HBAO, GTAO, Ground Truth Ambient Occlusion, Horizon-Based Ambient Occlusion, Multibounce AO]
category: graphics-xr
group: rendering
level: advanced
summary: 깊이 버퍼를 높이장으로 보고 각 슬라이스 방향에서 가림 수평선 각도를 찾아 가림을 적분한다. GTAO 는 코사인 가중 적분의 안쪽을 해석식으로 풀고 다중 반사 보정까지 더한다.
tags: [rendering, ambient-occlusion, hbao, gtao, horizon, screen-space, lighting]
related: [graphics-xr/ssao-ambient-occlusion, graphics-xr/shadow-mapping, graphics-xr/pbr-material-model, graphics-xr/image-based-lighting, graphics-xr/reflection-probes-ssr, graphics-xr/foveated-stereo-rendering]
sources:
  - https://developer.download.nvidia.com/presentations/2008/SIGGRAPH/HBAO_SIG08b.pdf
  - https://iryoku.com/downloads/Practical-Realtime-Strategies-for-Accurate-Indirect-Occlusion.pdf
  - https://learnopengl.com/Advanced-Lighting/SSAO
updatedAt: 2026-11-19
---

> 출처 메모: NVIDIA 의 HBAO 발표 슬라이드(Bavoil & Sainz, SIGGRAPH 2008)와 Jimenez 외 2016 "Practical Real-Time Strategies for Accurate Indirect Occlusion" 본문을 PDF 로 직접 읽었다. 슬라이드는 글자가 겹쳐 추출되어 핵심 식(AO = sin h − sin t, 각도 바이어스, 감쇠 함수)만 사용했다. GTAO 논문의 부록(코사인 가중 없는 변형)과 GTSO(스페큘러 오클루전)는 개요만 보았고 구현은 다루지 않는다. 세부 엔진 구현은 확인하지 않았다.

## 문제

[SSAO](/develop-wiki/knowledge/graphics-xr/ssao-ambient-occlusion/)의 구 샘플링 방식은 노이즈가 많고 샘플 수를 늘리면 비싸다. 샘플이 법선 반구 안에서 "깊이 버퍼가 가리는가" 를 점 단위로 묻기 때문이다. 깊이 버퍼를 **높이장**(z = f(x,y))으로 보고, 방향별로 가장 높은 가림물의 각도(수평선)만 찾아 그 사이를 적분하는 편이 정확하고 효율적이다.

## 해법 1: HBAO

HBAO 슬라이드의 구성은 이렇다.

- 화면 평면의 방향 θ 마다, 점 P 에서 그 방향으로 깊이 버퍼를 따라가며(마칭) **수평선 각도 h(θ)** 를 찾는다. 접평면의 각도는 **접선 각 t(θ)** 다.
- 그 방향 슬라이스의 가림 = `sin h − sin t`. 여러 방향의 평균이 AO 다.
- 입력은 깊이와 법선이다. 슬라이드는 보간 법선이 거짓 가림을 만들기 때문에 **면 법선**(ddx/ddy 로 얻음)을 쓴다고 한다.
- **각도 바이어스**: 저폴리 메시에서 접평면 가까운 샘플이 거짓 가림을 만드는 문제를 접선 각에 바이어스(예: 30도)를 더해 무시하는 방식으로 줄인다. 화면 밖 샘플의 거짓 가림에도 가장자리 클램프와 같이 쓴다.
- 샘플 거리에 따른 **감쇠 함수 W(r)** 로 가중해 가림물이 멀수록 영향이 줄고(불연속 방지), 방향 수·샘플 수는 픽셀마다 회전과 지터로 무작위화한다.

## 해법 2: GTAO

GTAO 는 같은 높이장 아이디어를 **코사인 가중 반구 적분의 정확한 형태** 로 정리한다. 차이는 세 가지다.

1. 수평선을 **시야 벡터 ω_o 기준**으로 잡는다. 슬라이스를 ω_o 를 포함한 평면에 두면 초월 함수 수가 줄고 식이 단순해진다.
2. 가시도 V 는 이진 함수(HBAO 의 거리 감쇠 대신)이다. 그러면 슬라이스 안쪽 적분을 두 수평선 각 θ1, θ2 와 법선 각 γ 로 **해석적으로** 풀 수 있다.

   `â = ¼(−cos(2θ1 − γ) + cos γ + 2 θ1 sin γ) + ¼(−cos(2θ2 − γ) + cos γ + 2 θ2 sin γ)`

   그리고 `A = (1/π) ∫₀^π ‖n_x‖ â(φ) dφ`. 바깥 적분만 슬라이스 방향 φ 로 샘플링한다.
3. 얇은 물체가 과하게 어둡게 나오는 문제에 두께 휴리스틱(두께가 화면 폭과 비슷하다고 가정해 최대 수평선 각을 보정)을 쓴다. 깊이 버퍼에서는 두께를 알 수 없기 때문이다.

```ts
const arc = (h: number, g: number) => 0.25 * (-Math.cos(2 * h - g) + Math.cos(g) + 2 * h * Math.sin(g));
export const visibilityArc = (h1: number, h2: number, g: number) => arc(h1, g) + arc(h2, g);
// 가림 없음(수평선 ±90도, γ=0) -> 1,  한쪽 수평선 -45도 -> 0.75,  양쪽 수평선 0 -> 0
```

(직접 실행해 확인: 위 값이 나왔고, 시야에 대해 기울기 α 로 기운 가림 없는 평면에서 수평선을 법선 반구(γ±90도)로 두고 φ 로 적분하면 α=0, 0.5, 1.0 rad 모두 A=1.0000 이었다. 반면 수평선을 시야 벡터 기준 ±90도로 제한하면 같은 평면이 0.94, 0.77 로 줄었다. 즉 해석식 자체는 정확하지만 화면 공간 탐색이 시야에서 90도 이내만 찾는 현실적 제한이 있다는 것은 이 계산에서 나온 관찰이며 논문이 명시한 한계가 아닐 수 있다.)

### 성능 구성

논문은 PS4 에서 1080p 로 약 0.5 ms 를 목표로, 반해상도로 계산하고 픽셀당 슬라이스 방향 1개만 샘플링하되 4x4 이웃을 양방향 필터로 모으고, 6가지 회전을 시간에 걸쳐 번갈아 쓰며 재투영·지수 누적한다. 합치면 픽셀당 유효 방향 4×4×6 = 96 개다.

### 다중 반사 보정

AO 는 "모든 빛이 균일한 환경에서 온다" 고 가정해 주변 표면에서 튕겨 온 빛이 빠진다. 논문은 밝은 표면(알베도 ρ) 주변은 더 밝아야 한다는 점에 착안해, 시뮬레이션으로 AO 가시도 A 와 3회 반사까지의 간접광 G 의 관계를 알베도별 3차 다항식으로 맞추고 계수를 ρ 의 선형식으로 근사했다.

`G(A, ρ) = a(ρ)A³ − b(ρ)A² + c(ρ)A`,  a = 2.0404ρ − 0.3324, b = 4.7951ρ − 0.6417, c = 2.7552ρ + 0.6903

```ts
export const multiBounce = (A: number, rho: number) => {
  const a = 2.0404 * rho - 0.3324, b = 4.7951 * rho - 0.6417, c = 2.7552 * rho + 0.6903;
  return Math.max(A, ((A * a - b) * A + c) * A);
};
```

(A=1 이면 모든 ρ 에서 약 1 로 유지된다. 알베도 0.5 에서 A=0.5 → 0.68, A=0.2 → 0.35; 알베도 0.9 에서 A=0.2 → 0.50. 식의 모양은 논문 식 10 과 같고, 하한 `max(A, G)` 는 이 구현의 방어 코드이다.)

## 비교

| 방식 | 샘플링 대상 | 노이즈 | 특징 |
| --- | --- | --- | --- |
| 구 샘플 SSAO | 법선 반구 안 점 | 큼 | 단순, 거짓 가림·헤일로 |
| HBAO | 슬라이스 방향의 수평선 | 중간 | 각도 바이어스·감쇠 함수로 보정 |
| GTAO | 시야 기준 수평선 + 해석 적분 | 시공간 누적으로 낮춤 | 정확한 코사인 가중, 다중 반사 보정, 두께 휴리스틱 |

## 언제 쓰나

- 전방/지연 렌더링에서 접촉 그림자·구석 어두움을 값싸게 넣을 때. 간접 조명은 [IBL](/develop-wiki/knowledge/graphics-xr/image-based-lighting/)이나 라이트맵이 담당하고 AO 는 그 가림을 보정한다.
- 스페큘러 가림이 필요하면 GTSO 같은 별도 항을 쓰고, 반사는 [프로브·SSR](/develop-wiki/knowledge/graphics-xr/reflection-probes-ssr/)과 함께 본다.

## 주의/비용

- **화면 공간의 한계**: 보이지 않는 면(가려진 뒷면, 화면 밖)은 모른다. 한 장의 깊이만 쓰므로 두꺼운 물체 뒤나 얇은 물체 주변에서 틀린다. GTAO 의 두께 휴리스틱은 완화일 뿐이다.
- 시간 누적(재투영)을 쓰면 움직이는 물체 주변에 잔상이 남을 수 있다. 시간 누적의 부작용 처리는 이 노트에서 확인하지 않았다.
- 메모리 대역폭이 병목이다(논문은 ALU 보다 메모리 접근이 성능을 정한다고 한다). 반해상도 계산이 흔하지만 가장자리 품질은 양방향 업샘플링에 의존한다.
- AO 는 직접광에 곱하면 안 된다. 앰비언트(간접) 항에만 적용하는 것이 원칙이다. 직접광의 가림은 [그림자 맵](/develop-wiki/knowledge/graphics-xr/shadow-mapping/)이 맡는다.
- 다중 반사 보정식은 논문의 시뮬레이션 장면에 맞춘 근사다. 다른 조명 조건에서 정확하다는 보장은 없다.
- VR 에서는 눈마다 계산해야 하고 눈 간 불일치가 불편함을 만들 수 있다([포비티드·스테레오](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)).

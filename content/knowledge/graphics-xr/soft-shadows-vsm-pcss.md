---
title: 소프트 섀도 — PCF·분산 섀도 맵(VSM)·PCSS
aka: [Variance Shadow Maps, VSM, Percentage-Closer Soft Shadows, PCSS, Chebyshev Shadows, Light Bleeding]
category: graphics-xr
group: rendering
level: advanced
summary: PCF 는 깊이 비교 결과를 평균내고, VSM 은 깊이와 깊이 제곱을 필터링해 체비쇼프 부등식으로 가시도 상한을 구하며, PCSS 는 차단체 거리로 반그림자 폭을 추정해 필터 크기를 바꾼다.
tags: [rendering, shadow-mapping, pcf, vsm, pcss, soft-shadows, filtering, light-bleeding]
related: [graphics-xr/shadow-mapping, graphics-xr/cascaded-shadow-maps, graphics-xr/ssao-ambient-occlusion, graphics-xr/pbr-material-model, graphics-xr/shaders-gpu-pipeline]
sources:
  - https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-8-summed-area-variance-shadow-maps
  - https://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
updatedAt: 2026-11-19
---

> 출처 메모: GPU Gems 3 8장(Lauritzen, VSM 해설)과 NVIDIA 의 PCSS 소개 문서(Fernando 2005, 4쪽)를 읽었다. VSM 원 논문(Donnelly & Lauritzen 2006)과 PCSS 의 후속 개선(Poisson 샘플링 최적화 등)은 읽지 못했다. 8장의 합산 영역 표(SAT) 구현부는 이 노트에서 다루지 않는다.

## 문제

[기본 섀도 맵](/develop-wiki/knowledge/graphics-xr/shadow-mapping/)은 픽셀마다 "가려졌나, 아닌가" 의 이진 판정이라 가장자리에 계단이 생긴다. 깊이 값 자체를 하드웨어 필터링(평균)하면 평균 깊이를 하나의 이진 비교에 넣게 되어 틀린 결과가 나온다. 또 실제 그림자는 접촉점에서 선명하고 멀수록 번지는데(면광원), 고정 폭 필터로는 그런 모양이 안 나온다.

## 해법 1: PCF

비교를 먼저 하고 평균을 낸다. 필터 영역의 텍셀마다 깊이 비교를 해 "더 가까운 텍셀의 비율" 로 빛을 줄인다. 필터 영역을 키우면 가장자리가 부드러워진다. 단점은 샘플이 많이 필요하고(비스듬한 면은 넓은 비등방 필터 영역), 비교 때문에 밉맵으로 가속할 수 없다는 점이다. 최악에는 한 픽셀에 영역 안 텍셀을 전부 읽는다. 바이어스 문제도 영역 전체의 깊이 범위에 비례해 악화된다.

## 해법 2: VSM

텍셀에 깊이 대신 **깊이 d 와 깊이 제곱 d²** 를 저장한다. 이 두 값(모멘트 M1, M2)은 선형 필터링이 가능해서 밉맵, 비등방 필터, 분리 가능한 블러, MSAA 를 그대로 쓴다. 영역을 필터링하면 평균 μ=M1 과 분산 σ²=M2−M1² 를 얻고, 셰이딩 깊이 t 가 μ 보다 크면 가림 확률의 상한이 단측 체비쇼프 부등식으로 나온다.

`p_max = σ² / (σ² + (t − μ)²)`  (t ≤ μ 이면 1)

이 값을 그림자 가시도로 쓴다. 상한이라서 빛이 있어야 할 곳이 자기 그림자로 어두워지지 않는 방향으로 틀린다. 평면 가림체와 평면 수신체 한 쌍이면 부등식이 정확해진다는 것이 원 논문의 결과로 8장에 인용돼 있다.

```ts
export function chebyshev(m1: number, m2: number, t: number, minVar = 1e-5): number {
  if (t <= m1) return 1;
  const v = Math.max(m2 - m1 * m1, minVar), d = t - m1;
  return v / (v + d * d);
}
```

(실행 확인: 필터 영역의 절반이 깊이 2, 절반이 깊이 10 인 곳에서 깊이 10 의 수신면은 체비쇼프 0.500 이고 실제 PCF 가시도도 0.5 였다.)

- **바이어스**: 8장은 텍셀을 국소 평면으로 보고 픽셀 범위의 깊이 편미분으로 M2 를 보정(`d² + 0.25(dx² + dy²)`)해 자기 그림자를 막는다. 최소 분산을 아주 작은 값으로 클램프하는 것만으로 충분한 장면도 많다고 한다. 편미분 바이어스는 수치 불안정이 있을 수 있어 주의가 필요하다.
- **빛 번짐(light bleeding)**: 가림체가 둘 이상 겹친 곳에서 이차 수신면에 빛이 새는 결함. 8장은 이를 "표본을 더 안 뽑는 한 완전히 해결할 수 없다" 고 설명한다. 흔한 완화책은 p_max 의 낮은 구간을 잘라 0 으로 두고 나머지를 다시 늘리는 것이다(`linstep(Amount, 1, p)`). 반그림자가 조금 어두워지는 대가가 있다.

(체험: 깊이 2·6·10 이 1/3 씩 섞인 영역에서 t=10 의 체비쇼프는 0.396, 실제 가시도는 0.33. t=6 이면 체비쇼프 1.000 인데 실제는 0.66. 즉 상한이 실제보다 커서 새는 빛이 생긴다. `linstep(0.4, 1, p)` 를 적용하면 0.396 은 0, 0.7 은 0.5 로 정리된다.)

## 해법 3: PCSS

PCSS 는 단일 광원 샘플로 면광원의 부드러운 그림자를 흉내 낸다. 픽셀마다 세 단계다.

1. **차단체 탐색**: 섀도 맵에서 수신점보다 광원에 가까운 텍셀의 깊이를 평균낸다. 탐색 영역 크기는 광원 크기와 수신점의 광원 거리에 따라 정해진다.
2. **반그림자 추정**: 평행 평면 근사로 `w_penumbra = (d_receiver − d_blocker) · w_light / d_blocker`.
3. **필터링**: 위 폭에 비례한 커널로 PCF 한다.

```ts
export const pcss = (dRecv: number, dBlock: number, wLight: number) => ((dRecv - dBlock) * wLight) / dBlock;
```

(광원 폭 0.5, 수신 거리 10: 차단체 거리 8 → 0.125, 2 → 2.0, 9.9 → 0.005. 가림체가 수신면에 붙을수록 선명하고 멀수록 번진다.)

## 비교

| 방식 | 장점 | 약점 |
| --- | --- | --- |
| PCF | 단순, 아티팩트 예측 쉬움 | 샘플 수 = 비용, 밉맵 불가 |
| VSM | 선형 필터로 싸고 부드러움, 바이어스 완화 | 빛 번짐, 수치 안정성, 두 채널 저장 |
| PCSS | 접촉 경화 그림자 | 차단체 탐색 + 큰 필터라 샘플이 많음, 평행 평면 근사 |

## 언제 쓰나

- 부드러운 가장자리가 필요하지만 레이트레이싱을 쓸 수 없는 실시간 장면.
- VSM: 큰 필터 폭이 필요하고 가림체가 단순한 장면. PCSS: 접촉 경화가 인상을 좌우하는 장면(인물 클로즈업 등).
- 캐스케이드별 필터링은 [캐스케이드 섀도 맵](/develop-wiki/knowledge/graphics-xr/cascaded-shadow-maps/)과 같이 쓴다.

## 주의/비용

- VSM 의 빛 번짐은 장면 의존이고 완화 상수(Amount)를 조정해야 한다. 너무 높이면 그림자 세부가 사라진다.
- VSM 은 깊이 두 채널을 정밀하게 저장해야 한다. 부동소수 정밀도가 낮으면 분산이 불안정해 번쩍이는 픽셀이 생길 수 있다(문서가 수치 안정성 이슈를 별도 절로 다룸).
- PCSS 는 차단체 탐색과 필터 두 번의 다중 샘플이라 해상도·샘플 수를 올릴수록 비용이 커진다. 문서의 측정(75 fps, 640x480, 샘플 36+64)은 2005년 GPU 기준일 뿐이다.
- PCSS 의 반그림자 식은 광원·차단체·수신면이 평행하다는 근사를 쓴다. 문서는 실무에서 잘 맞고 개선 여지가 있다고 하며, 근사가 크게 어긋나는 배치에서 어떻게 보이는지는 확인하지 못했다.
- 소프트 섀도는 정확한 면광원 적분이 아니라 지각적으로 그럴듯한 근사다. 물리 기반 조명과의 정합이 필요하면 다른 방법을 검토한다([PBR](/develop-wiki/knowledge/graphics-xr/pbr-material-model/)).

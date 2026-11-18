---
title: 캐스케이드 섀도 맵 (CSM / PSSM)
aka: [Cascaded Shadow Maps, CSM, Parallel-Split Shadow Maps, PSSM, Practical Split Scheme]
category: graphics-xr
group: rendering
level: advanced
summary: 카메라 절두체를 깊이 방향으로 여러 구간으로 나누고 구간마다 독립 섀도 맵을 둬서, 가까운 곳에 해상도를 몰아주는 기법. 분할 위치는 로그·균등 분할을 섞은 실용 분할 식으로 정한다.
tags: [rendering, shadow-mapping, cascaded-shadow-maps, pssm, aliasing, lighting, gpu]
related: [graphics-xr/shadow-mapping, graphics-xr/soft-shadows-vsm-pcss, graphics-xr/forward-vs-deferred-rendering, graphics-xr/foveated-stereo-rendering, graphics-xr/homogeneous-coordinates-mvp]
sources:
  - https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-10-parallel-split-shadow-maps-programmable-gpus
updatedAt: 2026-11-19
---

> 출처 메모: GPU Gems 3 10장(Zhang 외, PSSM)의 본문을 읽었다. 수식은 웹 본문에서 이미지로 빠져 있어, 실용 분할 식은 본문 설명(로그 분할과 균등 분할의 가중 조합, λ=0.5 기본값, 예시 수치)과 일치하게 직접 구현해 확인했다. 게임 엔진별 구현 세부(안정화, 캐스케이드 간 블렌딩, 구면 경계 등)는 읽은 출처에 없어 이 노트에서 다루지 않는다.

## 문제

[그림자 매핑](/develop-wiki/knowledge/graphics-xr/shadow-mapping/)의 깊이맵은 해상도가 유한하다. 넓은 야외 장면을 한 장으로 덮으면 텍셀 하나가 화면에서 크게 보이는 가까운 곳은 계단이 지고, 먼 곳은 해상도가 남는다. 논문은 이를 "원근 에일리어싱" 과 "투영 에일리어싱" 으로 나눈다. 원근 에일리어싱은 거리 z 에 반비례해 커지는 성분(dz/(z·ds))이고, 투영 에일리어싱은 표면 방향에 따라 달라지는 성분이라 장면 분석 없이는 줄이기 어렵다. 표준 섀도 맵에서 에일리어싱 오차는 물체가 카메라에 가까워질수록 쌍곡선처럼 커진다.

## 해법: 구간마다 한 장

1. 카메라 절두체를 뷰 평면에 평행한 분할 평면으로 m 개 구간으로 나눈다.
2. 구간마다 광원의 뷰-투영 행렬을 만든다. 구간 절두체의 경계 상자를 광원 좌표에서 구하면 장면을 몰라도 되는 방식(scene-independent)이고, 그림자를 드리울 물체만 포함하도록 좁히면 해상도를 더 아끼지만 장면 정보가 필요하다.
3. 구간별 섀도 맵(같은 해상도)을 그린다.
4. 셰이딩 때 픽셀이 속한 구간의 맵으로 [그림자 판정](/develop-wiki/knowledge/graphics-xr/shadow-mapping/)을 한다.

### 분할 위치: 실용 분할

가까운 n, 먼 f, 구간 수 m 에 대해 분할 평면은 로그 분할과 균등 분할의 가중 합이다.

- 로그: `C_i^log = n · (f/n)^(i/m)` — 원근 에일리어싱을 이론상 고르게 만든다. 그러나 근거리 구간이 너무 좁아진다(논문의 예: f=1000, n=1, m=3 이면 첫 두 구간이 시야 거리의 1% 와 10% 에 불과).
- 균등: `C_i^uni = n + (f−n)·i/m` — 표준 섀도 맵과 같은 분포라 근거리가 부족하다.
- 실용: `C_i = λ·C_i^log + (1−λ)·C_i^uni`. 논문 구현의 기본은 λ=0.5.

```ts
export function splits(n: number, f: number, m: number, lambda: number): number[] {
  return Array.from({ length: m + 1 }, (_, i) =>
    lambda * n * Math.pow(f / n, i / m) + (1 - lambda) * (n + ((f - n) * i) / m));
}
```

(n=1, f=1000, m=3 으로 실행: λ=0 이면 1, 334, 667, 1000, λ=1 이면 1, 10, 100, 1000, λ=0.5 이면 1, 172, 383.5, 1000.)

전처리로 카메라의 near/far 를 보이는 물체에 최대한 맞춰 조이면 빈 공간이 줄어 같은 해상도가 더 유효하게 쓰인다.

### 구현 변형(논문)

- 구간별 별도 패스로 그리는 방식은 단순하지만 패스가 늘어난다. 논문은 구간 수만큼의 섀도 맵을 한 텍스처로 묶거나 텍스처 배열을 쓰고, 최신 GPU 파이프라인에서는 지오메트리 셰이더·인스턴싱으로 패스를 줄이는 방법을 제안했다.
- 각 구간 맵의 해상도를 다르게 둘 수 있다(논문 구현은 모두 같은 해상도).
- PCF, 분산 섀도 맵 같은 필터링을 구간별로 적용할 수 있다([소프트 섀도](/develop-wiki/knowledge/graphics-xr/soft-shadows-vsm-pcss/)).
- 논문 측정: PSSM(3) 과 PSSM(4) 가 품질과 성능의 균형이 좋았다(2007년경 GeForce 7800 GTX 기준 수치이므로 현재 수치에는 쓰지 않는다).

## 언제 쓰나

- 방향광(해) 하나가 넓은 야외를 비추는 장면. 시야가 멀리까지 열린 3D 앱의 기본 그림자.
- 근접 디테일과 원거리를 한 번에 만족해야 할 때.

## 주의/비용

- **비용이 구간 수에 비례한다.** 구간마다 깊이 패스가 있어 지오메트리를 최대 m 번 다시 그린다. 모바일·XR 에서는 구간 수와 해상도, 그림자를 받는 거리를 줄인다([포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)과는 별개의 최적화다).
- 구간 경계에서 해상도가 갑자기 바뀌어 이음선이 보일 수 있다. 경계 처리(필터 폭 확장, 인접 구간 블렌딩)가 필요하다 — 이 노트가 읽은 출처에는 없는 일반 지식이다.
- 카메라가 움직일 때 구간 투영이 계속 바뀌면 그림자 가장자리가 흔들린다. 텍셀 단위 정렬 같은 안정화가 흔히 쓰이나 출처로 확인하지 못했다.
- 구간 수와 λ 는 장면의 near/far 비율과 시점 높이에 맞춰 조정하는 값이다. 한 번 정한 값이 모든 장면에 맞지 않는다.
- 바이어스는 구간마다 텍셀 크기가 달라 구간별로 따로 조정해야 할 수 있다.
- 스테레오 XR 에서는 두 눈이 같은 구간 맵을 공유하도록 광원 기준으로 구성하되, 눈 위치별 구간 판정과 분할 평면 설정을 점검한다.

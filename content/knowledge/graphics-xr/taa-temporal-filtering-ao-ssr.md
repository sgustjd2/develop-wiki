---
title: TAA 와 시간 필터 — AO·SSR 의 누적과 상호작용
aka: [TAA, Temporal Anti-Aliasing, Temporal Supersampling, History Clamping, Neighborhood Clipping, Temporal Accumulation, Reprojection]
category: graphics-xr
group: rendering
level: advanced
summary: TAA 는 프레임마다 투영을 흔들어(jitter) 얻은 샘플을 속도 벡터로 재투영해 지수 평균으로 쌓고, 이웃 색 범위로 히스토리를 잘라 고스팅을 막는다. AO·SSR 의 확률적 샘플도 같은 원리로 누적하지만 속도 벡터가 틀리는 지점에서 서로 문제를 증폭한다.
tags: [rendering, taa, temporal, reprojection, jitter, ssr, ao, denoising, ghosting]
related: [graphics-xr/gtao-hbao-horizon-ambient-occlusion, graphics-xr/ssao-ambient-occlusion, graphics-xr/reflection-probes-ssr, graphics-xr/hw-ray-traced-shadows-reflections, graphics-xr/forward-vs-deferred-rendering, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/foveated-stereo-rendering]
sources:
  - https://de45xmedrsdbp.cloudfront.net/Resources/files/TemporalAA_small-59732822.pdf
  - https://iryoku.com/downloads/Practical-Realtime-Strategies-for-Accurate-Indirect-Occlusion.pdf
  - https://media.contentapi.ea.com/content/dam/ea/seed/presentations/2019-ray-tracing-gems-chapter-25-barre-brisebois-et-al.pdf
updatedAt: 2026-11-19
---

> 출처 메모: Brian Karis 의 "High Quality Temporal Supersampling"(Unreal Engine 4 의 TAA 발표 슬라이드, 슬라이드에서 확인한 내용만 사용, 연도 표기는 Ray Tracing Gems 25장의 참고문헌 기준 SIGGRAPH 2014 Advances 강의), GTAO 논문(Jimenez 외) 구현 절, Ray Tracing Gems 25장의 반사 시간 누적 절을 직접 읽었다. Salvi 의 GDC 2016 발표와 Yang 외의 TAA 서베이, Stachowiak 의 확률적 SSR 슬라이드는 읽지 못했다. 슬라이드는 발표 자료라 수식 유도 없이 결과 위주다. 아래 실험 수치는 직접 구현한 1차원 모형에서 얻었다.

## 문제

디퍼드 렌더러에서 MSAA 는 비싸고, 삼각형 안쪽의 셰이딩 앨리어싱(스페큘러, 부분 픽셀 디테일)은 건드리지 못한다. FXAA·SMAA 같은 공간 필터는 가장자리의 계단 현상만 줄이고 부분 픽셀 정보가 없어 움직일 때 깜박인다. 한편 AO·SSR 은 샘플 수를 아끼려고 픽셀마다 방향을 바꿔 가며 확률적으로 샘플하므로 노이즈가 생긴다. 이 두 문제를 **프레임에 걸쳐 샘플을 분산**해 푼다.

## 해법

### 1. 정적 장면

- **지터**: 투영 행렬의 오프셋을 프레임마다 서브픽셀만큼 바꿔 같은 픽셀이 매번 다른 위치를 샘플하게 한다. Karis 는 Halton(2,3) 수열을 썼다. 처음 8개는 (0.500, 0.333), (0.250, 0.667), (0.750, 0.111), (0.125, 0.444), (0.625, 0.778), (0.375, 0.222), (0.875, 0.556), (0.063, 0.889) 다. 하드웨어 MSAA 샘플 순서보다 낫다고 한다.
- **누적**: 단순 이동 평균 대신 지수 이동 평균 `s_t = α x_t + (1−α) s_{t−1}` 을 쓴다. 저장은 히스토리 한 장이면 된다. 직접 시뮬레이션한 결과 독립 잡음에 대해 출력 분산이 α/(2−α) 로 줄어, 유효 샘플 수는 (2−α)/α 이다. α=0.5 면 3.0, 0.1 이면 19, 0.05 면 40 개 정도(측정 3.0, 18.9, 40.0).
- **톤 매핑 순서**: 톤 매핑 전(선형 HDR) 평균은 밝은 값이 지배해 샘플 수가 적으면 앨리어싱이 심하다. Karis 는 휘도 가중 `w = 1/(1+luma)` 로 누적하고 역변환해, 톤 매핑 후 누적과 같은 AA 품질을 유지하면서 채도를 보존한다고 소개한다.
- **재구성 필터**: 박스는 움직일 때 불안정해서 가우시안(약 2픽셀 지지)을 쓴다.

### 2. 움직이는 장면

- **재투영**: 현재 픽셀의 히스토리는 속도 버퍼(지터 제거 후)로 찾는다. 속도가 조금만 부정확해도 정지 화면에 줄무늬가 생긴다. 프로시저럴 애니메이션, 스크롤 텍스처, 거의 불투명한 반투명 물체는 속도 벡터를 못 쓰기 쉽다. 움직이는 실루엣은 속도를 팽창해 앞쪽 속도를 쓴다.
- **고스팅 억제**: 히스토리를 현재 프레임 3x3 이웃의 색 범위로 제한한다. 단순 min/max 는 3x3 사각형 아티팩트를 만들어 두 이웃 집합의 min/max 평균으로 둥글리고, 박스를 휘도 방향으로 세운 YCoCg 에서 만든다. 클램프 대신 **클립**(히스토리를 박스의 이웃 평균 쪽으로 선분 교차)을 쓰면 색이 박스 모서리에 몰리지 않는다.
- **반투명**: 히스토리와 속도가 하나뿐이라 TAA 와 잘 안 맞는다. UE4 는 "Responsive AA" 재질 플래그(스텐실)로 작은 입자의 피드백을 줄인다.
- **깜박임**: 클램프가 순간 충격처럼 작용해 톱니 파형을 만든다. 클램프 근처에서 블렌드 비율을 줄이는 방식을 쓰지만 슬라이드는 여러 클램프가 반대로 작용하는 경우는 풀리지 않는 문제라고 한다.

직접 만든 1차원 모형에서 정지 속도 벡터(틀린 속도)로 밝은 점(1.0)이 지나갈 때 점 뒤 2픽셀 이후의 꼬리 밝기를 비교하면, α=0.1 의 단순 누적은 0.081 이 남았고 3픽셀 이웃 클램프는 0.000 이었다.

```ts
export function resolve(cur: number[], hist: number[], x: number, alpha = 0.1): number {
  const n = [cur[Math.max(0, x - 1)], cur[x], cur[Math.min(cur.length - 1, x + 1)]];
  const h = Math.min(Math.max(hist[x], Math.min(...n)), Math.max(...n)); // 이웃 범위로 클램프
  return alpha * cur[x] + (1 - alpha) * h;
}
```

## AO·SSR 과의 상호작용

- **TAA 가 이미 노이즈 필터다.** Karis 는 AO 와 SSR 에서 시간 필터가 공간 필터를 대체해 더 좋고 싸며, 확률적 샘플링이 잘 작동한다고 한다. 거의 완벽한 거울 반사를 레이 마칭 16 스텝으로 얻었다고도 적는다. TAA 는 가장 마지막의 "방화벽" 으로서 TAA 이전 단계(G-버퍼, 조명, 블룸 등)의 입력을 안정화하고 이후 후처리는 안정된 입력을 받는다.
- **자체 누적과 겹친다.** GTAO 는 AO 를 반해상도로, 픽셀당 방향 하나만 샘플하되 4x4 이웃을 양방향 필터로 모으고 6가지 회전을 번갈아 쓰며 재투영한 결과를 지수 누적해 프레임당 1개 샘플로 4x4x6 = 96개 방향을 쓴 효과를 낸다고 한다. 이렇게 AO 가 따로 누적한 뒤 TAA 가 한 번 더 누적하면 유효 지연이 겹쳐 움직임에서 AO 가 늦게 따라온다. 겹치는 구조를 가정하고 각 누적의 α 를 따로 정해야 한다(이 문장은 두 자료에서 읽은 구조로부터의 추론).
- **속도 벡터가 틀리는 곳.** SSR·광선 반사는 반사 이미지가 반사체와 다른 시차로 움직이므로 표면의 모션 벡터를 쓰면 틀린다. Ray Tracing Gems 25장은 반사체 속도와 평균 적중점 재투영을 섞고, 새 프레임 픽셀의 평균·표준편차로 가중치 `w = exp2(-10·luma(dist))` 를 정한 다음 Karis 방식의 클램프를 한다고 소개한다. 편향이 생기고 깜박임이 생길 수 있다고 인정한다.
- **광선 반사는 노이즈가 많아** SSR 보다 필터가 공격적이어야 한다. 25장은 분산 추정으로 양방향 필터 커널을 조절하고 마지막에 TAA 를 건다([광선 반사](/develop-wiki/knowledge/graphics-xr/hw-ray-traced-shadows-reflections/)).

## 언제 쓰나

- 디퍼드 렌더러에서 셰이딩 앨리어싱까지 줄이고 AO·SSR·그림자 샘플을 시간에 걸쳐 분산할 때.
- 노이즈가 있는 확률적 효과(스토캐스틱 투명도, 소프트 그림자)를 싸게 정리할 때.

## 주의/비용

- **고스팅과 흐림이 대가다.** 클램프·클립은 히스토리 오류를 줄이지만 편향을 만든다. 슬라이드는 반투명을 TAA 에 맞지 않는 대상으로 꼽고, 재투영할 때 생기는 확산 흐림은 오차 보상을 시도했지만 결과가 좋지 않았고 고해상도 히스토리는 비싸다고 적는다.
- 속도 버퍼가 모든 움직임(애니메이션, 스크롤, 반투명)을 담아야 한다. 정확도에 대한 요구가 높다.
- 흐림 대응책으로 슬라이드는 텍스처 밉 바이어스, 대비가 낮을 때 필터 커널 축소, 추가 샤픈 필터를 든다. 이 값들은 TAA 를 켠 상태를 전제로 튜닝되므로 TAA 를 끄면 화질이 달라진다(이 문장은 추론).
- VR 에서는 프레임 사이 시점 변화가 크고 양안 렌더링 비용이 있어 TAA 의 지연·고스팅이 더 눈에 띈다(이 판단은 자료에서 읽은 것이 아니므로 자기 헤드셋에서 확인한다). 관련: [재투영과 프레임 예산](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/).
- 슬라이드는 깜박임 방지를 완전히 해결하지 못했고 매우 어려운 문제라고 정리한다. 고정된 정답 설정이 없으므로 장면마다 α 와 클램프 모양을 측정하며 정한다.

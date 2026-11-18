---
title: SSAO — 화면 공간 앰비언트 오클루전
aka: [SSAO, Screen-Space Ambient Occlusion, Ambient Occlusion, AO, HBAO]
category: graphics-xr
group: rendering
level: intermediate
summary: 깊이·법선 버퍼만으로 각 픽셀 주변이 얼마나 막혀 있는지 샘플링해 구석과 접촉부를 어둡게 하는 후처리. 싸고 장면 독립적이지만 화면에 보이는 정보만 쓰는 한계가 있다.
tags: [rendering, ssao, ambient-occlusion, g-buffer, post-processing, lighting]
related: [graphics-xr/shadow-mapping, graphics-xr/forward-vs-deferred-rendering, graphics-xr/pbr-material-model, graphics-xr/image-based-lighting, graphics-xr/rasterization-pipeline, graphics-xr/foveated-stereo-rendering]
sources:
  - https://learnopengl.com/Advanced-Lighting/SSAO
  - https://learnopengl.com/PBR/IBL/Diffuse-irradiance
updatedAt: 2026-11-19
---

## 문제

주변광(앰비언트) 항을 상수로 두면 장면이 납작하다. 현실에서는 벽과 바닥이 만나는 구석, 물체가 바닥에 닿는 부분처럼 **주변 빛이 막힌 곳이 어둡다**. 이것이 앰비언트 오클루전(AO)이다. 정확한 AO 는 모든 방향의 가림을 적분해야 해서 비싸고, 미리 구워 두면(라이트맵·AO 텍스처) 움직이는 물체에는 못 쓴다.

## 해법

**SSAO** 는 화면 공간 정보만으로 근사한다. 각 픽셀마다:

1. 그 점 주변의 법선 방향 **반구** 안에 샘플 점 여러 개를 뿌린다.
2. 각 샘플을 화면에 투영해 깊이 버퍼의 값과 비교한다. 저장된 표면이 샘플보다 카메라에 가까우면 샘플은 기하 "안쪽" 이다. 즉 가려진 방향이다.
3. 가려진 샘플의 비율이 차폐량이고, 앰비언트 항에 곱한다.

LearnOpenGL 의 구현 요점:

- 구(sphere) 샘플링 대신 **법선 방향 반구**를 쓴다. 구는 평평한 벽도 절반이 가려진 것으로 계산해 회색빛으로 뜬다.
- 샘플을 중심 가까이 더 많이 모으도록 스케일을 준다(예: 64 샘플에 `lerp(0.1, 1.0, (i/64)²)`). 가까운 가림이 더 중요하기 때문이다.
- 4x4 무작위 회전 텍스처를 화면에 타일링해 픽셀마다 커널을 돌린다. 적은 샘플로도 띠(banding)가 사라지지만 **노이즈**가 생기고, 이를 단순 블러가 지운다(타일이 규칙적이라 평균이 잘 지운다).
- **범위 검사**: 먼 배경 표면이 가장자리 너머로 보이는 것만으로 앞 물체를 어둡게 만들지 않도록 반경 대비 깊이 차에 따라 기여를 줄인다(`smoothstep`).
- 입력은 뷰 공간 위치(부동소수 텍스처)와 법선, 출력은 단일 채널 AO 텍스처다. 최종 조명 패스에서 앰비언트에 곱한다.

```ts
for (const s of kernel) {                 // 접선 공간 반구 샘플
  const z = samplePointZ(s), scene = sampleSceneZ(s);          // 샘플 위치 vs 저장 깊이
  const range = Math.min(1, radius / Math.max(1e-6, Math.abs(centerZ - scene)));
  if (scene >= z + bias) occ += range;                         // 기하 안쪽이면 가림
}
return 1 - occ / kernel.length;           // 1 = 밝음
```

(`kernel`, `samplePointZ`, `sampleSceneZ` 는 커널과 뷰 공간 z 조회를 가정한 구조. 평면 깊이에서는 1.00, 한쪽에 벽이 있는 가상 코너에서는 약 0.75 가 나왔다. 샘플이 난수라 값은 실행마다 조금 변한다.)

### 샘플 수와 노이즈

한 구석(반구의 일부가 막힌 점)의 차폐율 추정값의 표준편차를 시뮬레이션하면 샘플 수 N 이 4, 16, 64, 256 일 때 약 0.20, 0.10, 0.048, 0.026 이었다. **오차는 1/√N 로 줄어** 샘플을 4배 늘려야 노이즈가 절반이 된다. 그래서 적은 샘플 + 회전 + 블러 조합이 표준이다(LearnOpenGL 도 64 샘플은 필요 이상이라고 설명한다).

## 언제 쓰나

- 지연 렌더링의 G-버퍼가 이미 법선·깊이를 갖고 있을 때, 장면 독립적인 접촉 그림자 효과를 싸게 더할 때([전방/지연](/develop-wiki/knowledge/graphics-xr/forward-vs-deferred-rendering/)).
- 구운 AO 를 쓸 수 없는 동적 장면. 간접광이 단조로운 환경광([IBL](/develop-wiki/knowledge/graphics-xr/image-based-lighting/))과 같이 쓰면 깊이감이 확실히 늘어난다.

## 주의/비용

- **화면 공간의 한계**: 화면에 안 보이는 물체(카메라 뒤, 화면 밖, 앞 물체에 가린 것)는 차폐에 기여하지 못한다. 화면 가장자리에서 AO 가 사라지거나 카메라를 움직이면 어두운 부분이 변한다.
- 후광(halo) 현상. 범위 검사와 블러가 필요하고, 깊이 불연속(실루엣) 가장자리를 가로지르는 블러는 번진다(깊이 인지 블러).
- 반경·바이어스·강도 값은 장면 크기에 묶인다. 반경은 월드 단위로 정하면 장면 척도가 달라질 때 다시 맞춰야 한다.
- 픽셀당 샘플 수 x 해상도만큼의 텍스처 읽기라 대역폭 비용이 크다. XR 에서는 눈마다 계산되고 해상도가 높아 부담이므로 절반 해상도 계산, 샘플 감소를 검토한다([포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)).
- AO 는 직접광 그림자가 아니다. 직접광이 가려지는 것은 [섀도 매핑](/develop-wiki/knowledge/graphics-xr/shadow-mapping/)이 맡고, AO 는 **간접광/앰비언트** 항에만 적용한다. 직접광에까지 곱하면 비현실적으로 어두워진다.
- 금속·유리처럼 반사 중심 재질에서는 효과가 어색할 수 있다. 재질 모델과의 합성은 [PBR](/develop-wiki/knowledge/graphics-xr/pbr-material-model/)에서 앰비언트 항 정의를 확인한다.

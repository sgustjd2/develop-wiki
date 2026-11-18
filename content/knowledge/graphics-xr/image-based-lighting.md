---
title: IBL — 이미지 기반 조명
aka: [Image-Based Lighting, IBL, Irradiance Map, Prefiltered Environment Map, Split-Sum Approximation, Environment Lighting]
category: graphics-xr
group: rendering
level: advanced
summary: HDR 환경 이미지를 광원으로 쓰는 조명. 확산은 방사조도 맵, 반사는 거칠기별 사전 필터 맵과 BRDF LUT(분할합 근사)로 미리 적분해 두고 런타임에는 텍스처 조회만 한다.
tags: [rendering, ibl, pbr, environment-map, irradiance, split-sum, hdr]
related: [graphics-xr/pbr-material-model, graphics-xr/ssao-ambient-occlusion, graphics-xr/shadow-mapping, graphics-xr/shaders-gpu-pipeline, graphics-xr/plane-detection-anchors-spatial-mapping, graphics-xr/gltf-usd-asset-pipeline]
sources:
  - https://learnopengl.com/PBR/IBL/Diffuse-irradiance
  - https://learnopengl.com/PBR/IBL/Specular-IBL
  - https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
  - https://google.github.io/filament/Filament.html
updatedAt: 2026-11-19
---

## 문제

점광원 몇 개로는 현실 같은 조명이 안 나온다. 하늘, 벽, 바닥에서 사방으로 들어오는 빛(환경광)이 재질을 비추기 때문이다. 이 모든 입사광을 픽셀마다 적분하면 너무 비싸다. [PBR](/develop-wiki/knowledge/graphics-xr/pbr-material-model/) 에서 금속·거친 면의 느낌은 대부분 이 환경 반사에서 나온다.

## 해법: 적분을 미리 해 둔다

HDR 환경 이미지(등장방형 파노라마 → 큐브맵)를 "모든 방향에서 오는 빛의 표" 로 본다. 반사 방정식을 확산과 반사로 나눠 각각 **오프라인에서 미리 적분**한다.

### 확산: 방사조도 맵

람베르트 확산에서는 재질 항이 상수여서 입사광의 반구 적분만 남는다. 방향 N 마다 "N 을 중심으로 한 반구에서 오는 빛의 코사인 가중 평균" 을 저장한 작은 큐브맵(LearnOpenGL 예는 면당 32x32)이 방사조도 맵이다. 셰이더는 `texture(irradianceMap, N)` 한 번으로 확산 환경광을 얻는다. 저주파라 해상도가 작아도 된다.

### 반사: 분할합 근사

거울에 가까울수록 시선 방향 의존이 커서 그대로는 미리 계산할 수 없다. Epic 의 Karis 가 UE4 에서 쓴 **분할합(split sum) 근사**는 적분을 두 곱으로 쪼갠다.

1. **사전 필터링된 환경 맵**: 환경을 거칠기 값별로 흐려 큐브맵 밉 레벨에 저장한다(거칠수록 높은 밉). 시선 V = 반사 R = N 이라고 가정해 시선 의존성을 버린다(비스듬한 각도의 길게 늘어진 반사를 포기하는 타협).
2. **BRDF 적분 LUT**: (N·V, roughness) 를 축으로 하는 2D 텍스처에 F0 에 곱할 scale 과 더할 bias 를 저장한다.

`반사 환경광 = prefiltered(R, roughness) x (F0 · scale + bias)` — 런타임 비용은 큐브맵 한 번과 LUT 한 번이다.

### 직접 확인

작은 TS 로 확산 컨볼루션과 LUT 를 구현해 값을 점검했다.

```ts
// 법선 N 주변 반구를 (phi, theta) 로 훑어 코사인x사인 가중으로 모은다
for (let phi = 0; phi < 2*PI; phi += step)
  for (let theta = 0; theta < 0.5*PI; theta += step) {
    const d = toWorld(sphericalToTangent(phi, theta), N);
    sum += env(d) * Math.cos(theta) * Math.sin(theta); n++;
  }
return (PI * sum) / n;
```

- 균일 환경(복사휘도 1)의 결과가 0.9972 로 1 에 가까웠다(step 0.025 이산화 때문에 약 0.3% 모자람). 위쪽만 1, 아래는 0.1 인 환경에서는 위를 향한 면 0.997, 아래를 향한 면 0.100 이 나와 방향별 평균이 맞았다.
- 분할합의 LUT 를 중요도 샘플링(GGX, 4096 샘플)으로 계산하면 (N·V = 1, 거칠기 0.05) 에서 scale+bias = 1.000, (N·V = 0.5, 거칠기 0.5) 에서 0.747, (0.1, 0.5) 에서 0.686, (0.5, 1.0) 에서 0.409 였다. 즉 **거칠고 비스듬할수록 환경 반사가 약해지고** 합이 1 을 넘지 않는다(에너지 보존).

## 언제 쓰나

- 실시간 PBR 의 기본 환경광. 실내외 스카이박스, 제품 뷰어, 게임의 반사 프로브.
- XR/AR 에서는 현실 카메라 이미지로 환경 맵을 추정해 가상 물체를 현실 조명에 어울리게 한다(추정 환경 조명 기능은 플랫폼에 따라 다름).
- glTF 같은 에셋은 재질만 담고 환경광은 뷰어가 가진다. 같은 에셋이 환경에 따라 다르게 보이는 것은 정상이다([에셋 파이프라인](/develop-wiki/knowledge/graphics-xr/gltf-usd-asset-pipeline/)).

## 주의/비용

- **정적 환경만** 정확하다. 환경이 바뀌면(동적 물체, 시간대) 맵을 다시 구워야 한다. 로컬 환경(방 안의 반사)은 위치별 프로브가 필요하고, 단일 무한 환경 맵은 가까운 물체의 반사를 틀리게 만든다.
- 분할합은 근사다. V = R = N 가정으로 비스듬한 각도 반사가 깎이고, 실루엣 근처가 더 어색해진다.
- 큐브맵 밉의 **이음매**(면 경계에서 거친 밉이 끊김)는 이음매 없는 큐브맵 샘플링을 켜야 하고, 밝은 점이 있는 HDR 은 **반딧불(밝은 점 노이즈)** 을 만든다. 샘플링에 밉 레벨을 쓰는 방식으로 줄인다(LearnOpenGL 설명).
- 사전 계산은 시작 시마다 하기엔 비싸다. 환경이 여러 개면 빌드 단계에서 구워 저장한다.
- 환경광은 가림을 모른다. 구석이 밝게 뜨는 문제는 [SSAO](/develop-wiki/knowledge/graphics-xr/ssao-ambient-occlusion/) 등 AO 로 보완하고, 직접광 그림자는 [섀도 매핑](/develop-wiki/knowledge/graphics-xr/shadow-mapping/)이 맡는다.
- HDR 값이 부동소수 텍스처에 담기므로 메모리가 커진다. 모바일·XR 에서는 포맷과 해상도를 줄인다.

---
title: 그림자 매핑 (Shadow Mapping)
aka: [Shadow Map, Shadow Mapping, PCF, Percentage-Closer Filtering, Shadow Acne, Peter Panning, Cascaded Shadow Maps]
category: graphics-xr
group: rendering
level: intermediate
summary: 광원 시점에서 깊이만 그린 텍스처(깊이맵)를 만들고, 화면 픽셀을 광원 공간으로 옮겨 깊이를 비교해 그림자를 판정한다. 바이어스·해상도·필터링이 품질과 비용을 가른다.
tags: [rendering, shadow-mapping, depth-map, pcf, bias, lighting, gpu]
related: [graphics-xr/rasterization-pipeline, graphics-xr/forward-vs-deferred-rendering, graphics-xr/homogeneous-coordinates-mvp, graphics-xr/ssao-ambient-occlusion, graphics-xr/pbr-material-model, graphics-xr/foveated-stereo-rendering]
sources:
  - https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping
  - https://learnopengl.com/Advanced-Lighting/Shadows/Point-Shadows
updatedAt: 2026-11-19
---

## 문제

래스터라이저는 삼각형을 하나씩 칠한다. 한 픽셀을 칠할 때 다른 물체가 광원과 그 점 사이를 가리는지는 알 수 없다. 레이 트레이싱 없이 "광원에서 보이는가" 를 싸게 알아내야 한다.

## 해법

**두 패스**로 푼다.

1. **깊이 패스**: 카메라를 광원 위치에 놓고 장면을 그린다. 색은 필요 없고 깊이만 텍스처(깊이맵)에 저장한다. 즉 "광원에서 각 방향으로 가장 가까운 표면까지의 거리" 표다.
2. **조명 패스**: 화면의 각 조각을 광원 공간 좌표로 변환한다(투영 후 원근 나눗셈을 하고 [-1,1] 을 [0,1] 로 옮겨 깊이맵 좌표를 얻는다). 그 조각의 깊이가 깊이맵에 저장된 값보다 멀면 그 사이에 더 가까운 표면이 있다는 뜻이라 그림자다.

LearnOpenGL 은 방향광에는 평행 광선에 맞는 **직교 투영**, 스포트·점광원에는 원근 투영을 쓴다고 설명한다. 점광원은 큐브맵 깊이로 사방을 덮는다. 비교 자체는 어느 투영이든 같다. 변환 수식은 [동차 좌표·MVP](/develop-wiki/knowledge/graphics-xr/homogeneous-coordinates-mvp/)와 같은 계열이다.

```ts
export function biasFor(nDotL: number, base = 0.005, slope = 0.05): number {
  return Math.max(slope * (1 - nDotL), base);               // 기울기 비례 바이어스
}
export function shadowFactor(map: DepthMap, u: number, v: number, z: number, nDotL: number): number {
  if (z > 1 || u < 0 || u > 1 || v < 0 || v > 1) return 1;   // 광원 프러스텀 밖
  const bias = biasFor(nDotL), cx = Math.floor(u * map.size), cy = Math.floor(v * map.size);
  let lit = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
    lit += z - bias <= map.depthAt(cx + dx, cy + dy) ? 1 : 0;   // 3x3 PCF
  return lit / 9;
}
```

(`DepthMap` 은 `size` 와 `depthAt(x, y)` 를 가진 가상 깊이맵 타입. 합성 깊이맵으로 실행해 밝은 곳 1, 그림자 0, 경계 0.333 으로 PCF 가 단계적으로 나옴을 확인했다.)

## 흔한 아티팩트와 처방

| 증상 | 원인 | 처방 |
| --- | --- | --- |
| **섀도 애크니**(줄무늬 자기 그림자) | 깊이맵 해상도가 유한해 한 텍셀이 표면의 비스듬한 구간을 덮는다. 텍셀 중심 깊이와 조각의 실제 깊이가 어긋난다 | 바이어스. 상수보다 광원과 면의 각도에 비례하는 기울기 바이어스 |
| **피터 패닝**(그림자가 물체에서 떠 보임) | 바이어스 과다 | 바이어스 줄이기, 깊이 패스에서 앞면 컬링(닫힌 물체 한정, 바닥판 같은 단일 평면에는 불가) |
| **프러스텀 밖 거짓 그림자** | 텍스처 랩 모드가 반복 | 경계 클램프(밝은 값)와 `z > 1` 이면 그림자 없음 |
| **계단 모양 가장자리** | 텍셀 해상도 | PCF 필터링, 해상도 증가, 필터링 가능한 변형 |

애크니의 크기는 기하로 가늠할 수 있다. 면이 광원 방향과 이루는 각도가 θ(법선 기준)일 때 한 텍셀 안에서 깊이는 텍셀 폭 x tanθ 만큼 변한다. 텍셀 폭 5 cm 면에서 중심 샘플 기준 반 텍셀 오차는 30도에서 약 1.4 cm, 80도에서 약 14 cm, 85도에서 약 29 cm 로 급격히 커진다(월드 단위 직접 계산). **각도가 클수록 같은 바이어스로는 모자란다**는 것이 기울기 바이어스의 근거다. 합성 계단 깊이맵으로 확인하면 바이어스 0 에서는 텍셀 구간의 90% 에서 자기 그림자가 났고 0.005 에서는 0% 였다.

## 해상도 배분

- 큰 장면에서 한 장의 깊이맵으로 전체를 덮으면 카메라 근처 해상도가 모자란다. 거리별로 구간을 나눠 각 구간에 깊이맵을 두는 **캐스케이드 섀도 맵**이 야외 방향광의 표준적 해법이다(구현·분할 방식은 엔진마다 다르다).
- [전방/지연 렌더링](/develop-wiki/knowledge/graphics-xr/forward-vs-deferred-rendering/)과 무관하게 쓰이지만, 광원이 많으면 깊이 패스가 광원 수만큼 늘어난다.

## 언제 쓰나

- 실시간 앱에서 방향광·스포트·점광원의 그림자. 가장 널리 쓰이는 기본 기법이다.
- 모바일·XR 처럼 예산이 작으면 중요한 광원 하나만 그림자를 만들고 나머지는 굽거나 [SSAO](/develop-wiki/knowledge/graphics-xr/ssao-ambient-occlusion/) 같은 근사로 보완한다.

## 주의/비용

- 깊이 패스가 장면을 한 번 더 그린다. 드로우콜과 정점 비용이 늘고, 점광원 큐브맵은 6면이라 더 크다.
- 바이어스는 장면마다 조정해야 하는 요령이다. 너무 크면 접촉부가 떠 보이고 너무 작으면 줄무늬가 생긴다.
- PCF 의 부드러움은 커널 크기에 비례해 샘플 수(비용)가 늘고, 접촉 경도가 있는 그림자(가까울수록 선명, 멀수록 흐림)는 단순 PCF 로는 안 나온다.
- 스테레오 XR 은 눈마다 조명 패스가 돌아도 깊이맵은 광원 기준이라 공유할 수 있다. 그 대신 눈 위치에 따른 해상도 계산을 주의한다.
- 물리 기반 재질([PBR](/develop-wiki/knowledge/graphics-xr/pbr-material-model/))에서는 그림자가 직접광 항에만 곱해지고 간접광은 다른 방법(AO, 라이트맵)으로 가려야 한다.

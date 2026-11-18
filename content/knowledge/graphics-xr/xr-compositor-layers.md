---
title: XR 컴포지터와 컴포지션 레이어
aka: [XR Compositor, Composition Layers, OpenXR Layers, Quad Layer, Projection Layer, xrEndFrame, Environment Blend Mode]
category: graphics-xr
group: xr
level: intermediate
summary: XR 런타임의 컴포지터가 앱이 제출한 여러 레이어(프로젝션·쿼드·원통 등)를 합성하고 왜곡 보정·재투영을 한다. UI 는 쿼드 레이어로 분리하면 선명하고 싸다. 알파 규칙과 레이어 수 한계가 함정이다.
tags: [xr, openxr, compositor, composition-layers, quad-layer, blend-mode, swapchain]
related: [graphics-xr/openxr-webxr-architecture, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/foveated-stereo-rendering, graphics-xr/passthrough-depth-occlusion, graphics-xr/rasterization-pipeline, graphics-xr/vr-motion-sickness-ux]
sources:
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/xrEndFrame.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XrCompositionLayerQuad.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XrEnvironmentBlendMode.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XrCompositionLayerDepthInfoKHR.html
updatedAt: 2026-11-19
---

## 문제

앱이 렌더링한 한 장의 큰 눈별 이미지에 3D 세계, 메뉴, 텍스트, 컨트롤러 레이저를 전부 그려 넣으면 문제가 생긴다. 이 이미지는 렌즈 왜곡 보정을 위해 한 번 더 샘플링되는데, 작은 UI 글자는 두 번 리샘플링되어 흐려진다. 또 앱이 프레임을 늦게 내면 앱 안에서 모든 것이 같이 늦는다. 합성과 최종 출력은 시스템이 맡는 편이 유리하다.

## 해법: 레이어를 런타임에 넘긴다

OpenXR 에서 앱은 매 프레임 `xrWaitFrame → xrBeginFrame → (렌더링) → xrEndFrame` 을 거치고, `xrEndFrame` 에 **컴포지션 레이어 배열**과 표시 시각, 환경 블렌드 모드를 넘긴다. 합성, 프레임률 보간, 왜곡 보정 같은 세부는 런타임 컴포지터가 처리해 앱의 렌더링 부담을 줄인다(사양의 설명).

| 레이어 | 용도 |
| --- | --- |
| `XrCompositionLayerProjection` | 눈 위치에서 원근 투영으로 렌더링한 세계. 보통 가장 큰 레이어 |
| `XrCompositionLayerQuad` | 공간에 놓인 평면 사각형(위치·자세·크기 m). UI, 2D 콘텐츠용. 두께 없고 앞면만 보인다 |
| 원통·등장방형·큐브 등 | 확장(`XR_KHR_composition_layer_cylinder` 등)으로 제공되는 형태 |

핵심 이득은 **쿼드 레이어 해상도 분리**다. 쿼드는 화면 시야의 작은 부분만 차지하므로 스왑체인 이미지 해상도를 그 크기에 맞출 수 있고, 사양도 UI·HUD 의 가독성이 좋아지고 컴포지터의 왜곡 보정 샘플링이 최적화된다고 설명한다. 월드는 낮은 해상도·고프레임 예산으로 돌리고 텍스트는 별도 레이어로 선명하게 두는 구성이 가능하다.

### 블렌딩 규칙

레이어는 제출 순서대로 쌓인다. 사양의 블렌딩 연산은 다음과 같다.

`Composite = Layer + Composite · (1 − Layer.A)` (초기 Composite 는 0, 모든 값은 **알파 사전 곱** 기준)

- 레이어 텍스처에 알파를 쓰려면 `XR_COMPOSITION_LAYER_BLEND_TEXTURE_SOURCE_ALPHA_BIT` 를 켠다. 꺼져 있거나 텍스처에 알파 채널이 없으면 알파는 1 이다.
- 텍스처가 사전 곱이 아니면 `XR_COMPOSITION_LAYER_UNPREMULTIPLIED_ALPHA_BIT` 를 켜서 런타임이 RGB 에 A 를 곱하게 한다.
- 색상 수차 보정 비트는 폐기돼 효과가 없다.

```ts
export function composite(layers: { color: RGBA; unpremultiplied?: boolean }[]): RGBA {
  let c: RGBA = [0, 0, 0, 0];
  for (const l of layers) {
    const [r, g, b, a] = l.color;
    const p: RGBA = l.unpremultiplied ? [r * a, g * a, b * a, a] : [r, g, b, a];
    c = [0, 1, 2, 3].map((i) => p[i] + c[i] * (1 - p[3])) as RGBA;   // over 연산
  }
  return c;
}
```

불투명 월드(0.2, 0.3, 0.8) 위에 반투명 흰색 HUD(알파 0.5, 비사전곱)를 **월드 → HUD** 순서로 합성하면 (0.6, 0.65, 0.9) 가 나오고, **HUD → 월드** 순서면 불투명 월드가 전부 덮어 (0.2, 0.3, 0.8) 만 남는다. 순서가 결과를 바꾼다. 사전 곱 값인데 비사전곱 플래그를 켜는 실수는 결과를 (0.35, 0.4, 0.65) 로 어둡게 만든다(위 예시 계산).

### 환경 블렌드 모드

`xrEndFrame` 의 `environmentBlendMode` 는 현실과의 합성 방식을 정한다. `OPAQUE` 는 현실을 가리고 RGB 로 해석(알파 무시), `ADDITIVE` 는 현실 위에 더해 어두운 픽셀이 투명해 보이는 시스루 디스플레이용, `ALPHA_BLEND` 는 RGBA 로 현실과 섞는 비디오 패스스루용이다. 기기가 지원하지 않는 모드를 요청하면 오류다([패스스루 깊이](/develop-wiki/knowledge/graphics-xr/passthrough-depth-occlusion/)).

### 깊이 정보 첨부

프로젝션 레이어에 `XrCompositionLayerDepthInfoKHR`(`XR_KHR_composition_layer_depth`)를 붙이면 깊이 이미지와 near/far 평면(미터)을 런타임에 알려 줘 컴포지터가 깊이를 해석할 수 있다. 재투영 품질에 쓰일 수 있는 정보다([재투영](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/)). 깊이 값 범위와 near/far 의미는 반드시 일치시켜야 한다.

## 언제 쓰나

- 메뉴·자막·HUD·웹 뷰 같은 2D 콘텐츠를 선명하게 보여 줄 때(쿼드).
- 월드 해상도를 동적으로 낮춰도 UI 는 유지하고 싶을 때, 또는 월드와 UI 의 갱신 주기를 분리할 때.
- 패스스루 AR 에서 현실 위에 겹치는 레이어 구성.

## 주의/비용

- **레이어 수에 한계**가 있다. `xrEndFrame` 은 레이어 수가 `maxLayerCount` 를 넘으면 `XR_ERROR_LAYER_LIMIT_EXCEEDED` 를 반환한다. 레이어가 많을수록 컴포지터 비용(GPU 대역폭)도 늘어난다.
- 레이어마다 스왑체인이 필요해 메모리가 늘고, 스왑체인 이미지는 취득·해제 순서를 지켜야 한다. 해제하지 않은 스왑체인을 참조하면 `XR_ERROR_LAYER_INVALID` 다.
- `xrEndFrame` 의 `displayTime` 은 `xrWaitFrame` 이 준 값에서 파생해야 한다. 부정확하면 흑색 끌림과 저더가 생긴다. 레이어가 없으면 화면이 지워진다(오류 아님).
- 복구 가능한 오류가 나면 같은 프레임을 다른 인자로 다시 내지 말고 버린다(문서의 조언).
- 확장 레이어(원통 등)는 런타임별 지원이 다르다. Unity 문서도 원통 레이어가 일부 기기에서 지원되지 않는다고 표시한다. 기능 확인 후 폴백(쿼드)을 준비한다.
- 레이어를 쓴다고 지연이 사라지지 않는다. 표시 시각 예측과 앱 프레임 시간이 지연의 본질이다([프레임 예산](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/), [포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)).
- OpenXR 구조는 [OpenXR/WebXR 아키텍처](/develop-wiki/knowledge/graphics-xr/openxr-webxr-architecture/) 노트를 본다.

---
title: 패스스루와 깊이 가림 (Depth Occlusion)
aka: [Passthrough, Depth Occlusion, Environment Depth, Depth Sensing, Mixed Reality Occlusion, Hand Removal]
category: graphics-xr
group: xr
level: advanced
summary: 현실 영상 위에 가상 물체를 합성할 때 기기가 추정한 현실 깊이와 가상 깊이를 픽셀마다 비교해, 현실이 앞이면 가상을 가린다. 깊이 해상도·잡음·지연이 품질과 프라이버시 비용을 정한다.
tags: [xr, mr, passthrough, occlusion, depth-sensing, webxr, openxr, privacy]
related: [graphics-xr/xr-compositor-layers, graphics-xr/plane-detection-anchors-spatial-mapping, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/hand-eye-tracking-interaction, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/rasterization-pipeline]
sources:
  - https://immersive-web.github.io/depth-sensing/
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XrEnvironmentBlendMode.html
updatedAt: 2026-11-19
---

## 문제

패스스루(카메라로 현실을 보여 주는 방식) 위에 가상 물체를 그대로 얹으면 가상 물체가 **항상 맨 앞**에 그려진다. 책상 뒤에 있어야 할 가상 공이 책상 위로 떠 보이고, 손이 가상 물체 앞으로 지나가도 손 위에 물체가 덮인다. 깊이 단서가 깨져 합성감이 사라진다. 현실의 앞뒤 관계를 알아야 한다.

## 해법: 현실 깊이 vs 가상 깊이

기기가 환경 깊이 맵(스테레오·ToF 등으로 추정한 픽셀별 거리)을 제공하면, 가상 물체를 그릴 때 **현실 깊이가 가상 깊이보다 가까운 픽셀은 가상 쪽을 숨긴다**. 깊이 버퍼 테스트와 같은 논리이고, 한쪽 깊이가 센서 데이터일 뿐이다.

```ts
export function virtualVisibility(
  virtualDepthM: number, rawRealDepth: number, rawValueToMeters: number, featherM = 0.05,
): number {
  if (rawRealDepth === 0) return 1;                       // 무효 깊이 = 가리지 않음
  const realM = rawRealDepth * rawValueToMeters;
  const t = (virtualDepthM - realM) / featherM;           // >0: 가상이 현실보다 뒤
  return 1 - Math.min(1, Math.max(0, t));                 // 0 = 가려짐, 1 = 보임
}
```

(깊이를 mm 단위 원시값으로 가정한 시험에서 현실 2 m, 가상 1.5 m → 1(보임), 가상 2.5 m → 0(가림), 경계 근처 2.02 m → 0.60, 무효 픽셀 → 1 이 나왔다. `featherM` 은 경계의 계단과 깜빡임을 줄이는 임의 폭이다.)

### WebXR 깊이 센싱

WebXR 깊이 센싱 모듈은 세션 요청 시 `depth-sensing` 기능과 선호 설정을 넘긴다.

- `usagePreference`: `cpu-optimized`(CPU 가 배열로 읽음) 또는 `gpu-optimized`(텍스처로 셰이더에서 읽음). 가림 렌더링은 GPU 쪽이 자연스럽다.
- `dataFormatPreference`: `luminance-alpha`(16비트, 모든 지원 UA 가 지원), `float32`, `unsigned-short`.
- 깊이 정보 객체의 `rawValueToMeters` 를 곱하면 미터가 되고, **무효 깊이는 0** 이다. `normDepthBufferFromNormView` 는 뷰 정규 좌표를 깊이 버퍼 좌표로 바꾸는 변환이다(깊이 해상도·시야가 색 카메라와 다르기 때문).
- 필수 기능으로 요청했는데 구성을 못 맞추면 세션 요청이 `NotSupportedError` 로 거부된다. 선택 기능이면 조용히 무시된다.

### OpenXR 쪽

OpenXR 에는 기기별 확장이 있다. 예를 들어 `XR_META_environment_depth` 는 깊이 공급자(provider)를 만들고(처음에는 정지 상태) 시작해야 깊이 맵이 생성되며, 지원 시 **손 제거**(켜면 손에 해당하는 깊이 픽셀을 손 뒤의 추정 배경 깊이로 바꿈) 옵션과 지원 여부 질의가 있다. 깊이 맵은 전용 스왑체인으로 앱에 공유된다. 권한이 없으면 생성이 실패할 수 있다. Varjo 확장은 프로젝션 레이어에 깊이 정보를 붙이고 깊이 테스트 범위(예: 0~1 m)를 지정해 **VR 장면 위에 손을 보여 주는** 예를 사양에 싣고 있다. 이처럼 합성 쪽(컴포지터)에서 깊이 비교를 맡기는 방식과, 앱이 셰이더에서 직접 가리는 방식이 모두 존재한다. 환경 블렌드 모드(`ALPHA_BLEND` 는 비디오 패스스루용)와 레이어 순서는 [컴포지터 레이어](/develop-wiki/knowledge/graphics-xr/xr-compositor-layers/) 노트에서 본다.

## 언제 쓰나

- 가상 가구·캐릭터를 실제 방에 놓는 MR/AR 앱(가구 뒤로 숨기, 책상 아래로 들어감).
- 손·물체가 가상 UI 앞에서 자연스럽게 겹쳐 보여야 할 때.
- 평면 정보만으로 충분하면 깊이 맵 없이 [평면 감지와 앵커](/develop-wiki/knowledge/graphics-xr/plane-detection-anchors-spatial-mapping/)로 바닥·벽 정도만 가린다.

## 주의/비용

- **깊이 맵은 거칠고 시끄럽다.** 해상도가 색 영상보다 낮고 경계가 흔들려 가림 가장자리가 울퉁불퉁하다. 위 코드의 feather, 시간 필터, 경계 블러로 완화하고 `rawValueToMeters` 와 무효값 0 을 반드시 처리한다.
- 반사·투명·검은 표면·얇은 물체(철사)에서 깊이가 틀린다. 가림이 사라지거나 번쩍인다.
- **지연 불일치**: 깊이는 색 영상보다 늦거나 다른 시점일 수 있다. 움직이는 손에서 가림 경계가 뒤처진다. 재투영·예측과의 관계는 [프레임 예산](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/)과 같은 관점으로 본다.
- **프라이버시**: 깊이 센싱은 방 구조를 드러낸다. WebXR 명세는 사용자 동의를 받을 것, UA 가 해상도를 낮추거나 값을 양자화하거나 접근을 막을 수 있다는 것, 데이터가 카메라 수준으로 상세하면 카메라 접근과 동등한 동의가 필요하다는 것을 요구한다. 앱은 필요할 때만 요청하고 저장하지 않는다.
- 기기·런타임별 지원이 갈린다. 깊이를 못 받으면 가림 없이도 어색하지 않게 하는 폴백(그림자 접촉, 낮은 불투명도)을 준비한다.
- GPU 비용: 모든 가상 픽셀에서 깊이 텍스처를 읽고 눈마다 반복한다. 모바일 XR 에서는 가려질 가능성이 있는 물체에만 적용하는 최적화를 검토한다([포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)).
- 손 제거를 켜면 손이 깊이 맵에서 빠져 가상 물체가 손 위에 그려진다. 손 뒤 UI 를 다루기는 쉬워지지만, 손이 가상 물체 앞에 있다는 단서가 사라진다. 용도에 따라 고른다([손·시선 추적 상호작용](/develop-wiki/knowledge/graphics-xr/hand-eye-tracking-interaction/)).

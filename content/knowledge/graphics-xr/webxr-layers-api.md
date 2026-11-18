---
title: WebXR Layers API — 컴포지터 레이어를 웹에서 쓰기
aka: [WebXR Layers, XRQuadLayer, XRCylinderLayer, XRProjectionLayer, XRWebGLBinding, depth-sorted-layers, space-warp]
category: graphics-xr
group: xr
level: advanced
summary: WebXR Layers 는 쿼드·실린더·등장방형 같은 레이어를 컴포지터가 직접 합성하게 해 텍스트 선명도, 지연, 전력을 개선한다. 레이어는 별도 해상도를 갖고 앱 프레임률과 무관하게 재투영될 수 있다.
tags: [webxr, xr, layers, compositor, quad-layer, projection-layer, depth-sorting, space-warp, webgl]
related: [graphics-xr/xr-compositor-layers, graphics-xr/openxr-webxr-architecture, graphics-xr/passthrough-depth-occlusion, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/foveated-stereo-rendering, graphics-xr/ktx2-basis-texture-compression]
sources:
  - https://immersive-web.github.io/layers/
  - https://immersive-web.github.io/depth-sensing/
  - https://www.w3.org/TR/webxr/
updatedAt: 2026-11-19
---

> 출처 메모: W3C Immersive Web WG 의 WebXR Layers Module 편집자 초안과 Depth Sensing 모듈 일부를 읽었다. **편집자 초안이라 변경될 수 있고 브라우저·기기 지원 현황은 확인하지 못했다.** 아래 코드는 명세의 인터페이스에서 조립한 예시이며 실제 기기에서 실행해 보지 않았다.

## 문제

WebXR 의 기본 `XRWebGLLayer` 는 앱이 눈 버퍼 하나에 모든 것을 그린다. 그러면 세 가지가 아프다.

- 앱 프레임률이 떨어지면 UI·영상까지 같이 끊긴다.
- 성능이 낮은 기기에서 눈 버퍼 해상도를 줄이면 텍스트가 뭉개진다. 또 텍스트는 눈 버퍼에 한 번, 컴포지터에서 한 번 해서 **두 번 리샘플링**된다.
- 정지된 패널도 매 프레임 다시 그려야 해서 전력을 쓴다.

OpenXR 의 컴포지션 레이어 개념([컴포지터 레이어](/develop-wiki/knowledge/graphics-xr/xr-compositor-layers/))을 웹에서 노출하는 것이 이 모듈이다.

## 해법

명세가 꼽는 이점은 다음과 같다.

| 이점 | 이유 |
| --- | --- |
| 끊김(judder) 감소 | 레이어는 컴포지터의 프레임률(기기 기본 주사율)로 제시된다. 앱이 못 따라가도 컴포지터가 기존 렌더링을 새 자세로 재투영할 수 있다 |
| 가독성 | 정적 실린더·쿼드를 한 번 높은 해상도로 그리고 컴포지터가 한 번만 리샘플링한다. 레이어마다 해상도가 달라서 눈 버퍼는 낮추고 텍스트·지도는 높게 둘 수 있다 |
| 전력 | 렌더링 경로가 짧고 이중 샘플링이 없으며 매 프레임 다시 그릴 필요가 없다 |
| 지연 | 레이어 자세를 프레임 끝에서 샘플링해 재투영할 수 있다 |
| 색 형식 | 일반 WebXR 이 RGB 만 지원하는 것보다 넓다. 압축 텍스처 형식(ETC2, ASTC 확장 사용 시)도 레이어 색 형식으로 허용 |

### 레이어 종류

- `XRProjectionLayer`: 시야 전체를 채우는 레이어. 항상 지원된다. 기기 기본 주사율 근처로 갱신하는 것이 맞다.
- `XRQuadLayer`: 평평한 사각형(앞면만 보이고 두께 없음). 크기는 미터 단위.
- `XRCylinderLayer`: 원통 일부(반지름, 중심각, 종횡비).
- `XREquirectLayer`, `XRCubeLayer`: 360도 이미지·영상.
- 비디오는 `XRMediaBinding` 으로 미디어 레이어를 만든다(여기서는 다루지 않음).

투영 외 레이어는 세션을 요청할 때 `layers` 기능이 필요하고, `immersive-vr`/`immersive-ar` 세션에서만 지원된다. 이미 활성인 세션에 뒤늦게 켤 수 없다.

### 사용 흐름

```ts
const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['layers'] });
const gl = canvas.getContext('webgl2', { xrCompatible: true })!;
const binding = new XRWebGLBinding(session, gl);
const refSpace = await session.requestReferenceSpace('local-floor');

const eyeLayer = binding.createProjectionLayer({ scaleFactor: 0.8 });          // 눈 버퍼는 낮춰서
const hud = binding.createQuadLayer({                                          // 텍스트 패널은 별도 고해상도
  space: refSpace, viewPixelWidth: 1024, viewPixelHeight: 512, layout: 'mono',
  isStatic: true, width: 1.0, height: 0.5,
  transform: new XRRigidTransform({ x: 0, y: 1.4, z: -1.2 }),
});
hud.quality = 'text-optimized';
await session.updateRenderState({ layers: [eyeLayer, hud] });                   // 배열 순서 = 합성 순서

function onFrame(_t: number, frame: XRFrame) {
  session.requestAnimationFrame(onFrame);
  if (hud.needsRedraw) {                                                        // 정적 레이어는 필요할 때만 다시 그린다
    const sub = binding.getSubImage(hud, frame);
    drawText(gl, sub.colorTexture, sub.viewport);
  }
  for (const view of frame.getViewerPose(refSpace)?.views ?? []) {
    const sub = binding.getViewSubImage(eyeLayer, view);                        // 투영 레이어는 뷰별 서브이미지
    drawScene(gl, sub.colorTexture, sub.depthStencilTexture, sub.viewport, view);
  }
}
```

핵심 규칙(명세 기준):

- `layers` 배열의 순서가 합성 순서다(뒤에 오는 것이 위).
- `needsRedraw` 는 컴포지터가 레이어 재투영을 더 못 하거나 자원이 사라졌을 때 켜진다. 다음 프레임에 다시 그리지 않으면 깜빡임 같은 부작용이 있을 수 있다.
- `quality`: `text-optimized`, `graphics-optimized` 힌트는 추가 처리를 일으켜 성능에 영향이 있을 수 있다.
- `layout`: 스테레오 영상은 `stereo-left-right`/`stereo-top-bottom` 로 드로우콜을 줄인다. `default`/`stereo` 레이아웃은 `texture-array` 텍스처 타입이 권장된다.
- 투영 레이어의 `fixedFoveation`(0~1) 으로 컴포지터의 고정 포비에이션 강도를 조절한다(지원 안 하면 null). [포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/) 참고.

### 깊이와 레이어

- `depth-sorted-layers` 기능을 요청하면 투영·쿼드·실린더 레이어가 배열 순서가 아니라 **깊이**로 정렬된다. 쿼드·실린더는 크기·변환·공간으로, 투영 레이어는 `depthStencilTexture` 값으로 정렬하므로 컴포지터가 깊이 값을 쓰는 상태가 된다.
- `space-warp` 기능은 모션 벡터 텍스처와 깊이 텍스처를 함께 내면 컴포지터가 프레임을 외삽·재투영해 앱 프레임률을 낮춰도 부드럽게 보이게 한다. 이때 `deltaPose`(앱이 적용한 이동)를 줄 수 있다.
- 이는 환경 깊이 센싱과는 별개다. 현실 물체에 의한 가림은 [패스스루와 깊이 가림](/develop-wiki/knowledge/graphics-xr/passthrough-depth-occlusion/)의 `depth-sensing` 모듈이 다룬다. 두 기능의 이름이 비슷해 혼동하기 쉽다.

## 언제 쓰나

- 텍스트가 많은 UI(설정 패널, 자막, HUD), 사진·영상 뷰어, 360도 영상.
- 눈 버퍼 해상도를 낮춰야 하는 저사양 기기에서 핵심 요소만 선명하게 유지할 때.
- 앱 프레임률이 흔들려도 UI 가 부드러워야 할 때.

## 주의/비용

- **명세가 아직 편집자 초안이다.** 구현·기기 지원은 브라우저마다 다르다. `layers` 를 선택 기능으로 요청하고 미지원 시 `XRWebGLLayer` 로 되돌아가는 폴백을 만든다.
- 레이어를 많이 두면 컴포지터 작업과 메모리가 늘어난다. 레이어 수와 해상도는 예산으로 관리한다.
- 합성 순서와 깊이 정렬 모드가 달라 결과가 달라진다. 투명한 레이어가 얽히면 디버깅이 어렵다.
- 컴포지터가 레이어를 리샘플링하므로 텍스처 밉·필터링이 중요하다(`mipLevels`). 일부 플랫폼은 밉을 지원하지 않는다고 명세가 적는다.
- 자원이 사라지면 `needsRedraw` 가 켜지고 쿼드·실린더 레이어에는 `redraw` 이벤트가 있다. 이를 처리하지 않으면 레이어 내용이 깨질 수 있다.
- 보안·프라이버시 절(타이밍 정보, 레이어 할당 한도)이 명세에 있으나 이 노트는 상세를 확인하지 않았다.

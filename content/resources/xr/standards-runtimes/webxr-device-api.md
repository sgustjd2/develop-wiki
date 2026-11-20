---
name: WebXR Device API
url: https://immersive-web.github.io/webxr/
docs: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
repo: https://github.com/immersive-web/webxr
stars: 3167
domain: xr
category: standards-runtimes
description: 브라우저에서 VR·AR 기기에 접근하는 W3C 웹 표준 API. immersive-vr·immersive-ar 세션과 입력, 추적 공간을 제공한다.
pricing: free
tags: [webxr, w3c, browser, immersive-web, standard]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
WebXR Device API는 W3C Immersive Web 워킹 그룹이 만드는 브라우저 API로, 웹 페이지가 헤드셋·핸드헬드 AR에 렌더링 프레임을 보내고 포즈·입력을 받게 한다. 렌더링 자체는 WebGL(또는 WebGPU 바인딩 제안)로 직접 하며, 보통 Three.js·Babylon.js·A-Frame 같은 라이브러리가 감싼다.

- 확인 기준: W3C TR 페이지는 Candidate Recommendation Snapshot(2022-03-31)을 표시하고, 사양 저장소는 계속 갱신 중이다(최근 푸시 2026-11). AR, 핸드 트래킹, 히트 테스트, 앵커 등은 별도 모듈 사양이다.
- 브라우저 지원은 기기·플랫폼별로 달라 MDN·caniuse의 호환성 표를 확인해야 한다(이 문서에서 개별 브라우저 지원 현황은 직접 검증하지 않았다).

## 설치
설치할 것은 없다. 보안 컨텍스트(HTTPS 또는 `localhost`)와 지원 브라우저·기기가 필요하다. 개발 중에는 Immersive Web Emulator 같은 에뮬레이터 확장으로 헤드셋 없이 테스트할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `navigator.xr` | 진입점. `isSessionSupported`, `requestSession` |
| `XRSession` | `immersive-vr`, `immersive-ar`, `inline` 세션 |
| `XRReferenceSpace` | `local`, `local-floor`, `bounded-floor`, `unbounded` |
| `XRFrame` / `XRViewerPose` | 프레임마다 뷰 행렬과 포즈 제공 |
| `XRInputSource` | 컨트롤러·손·시선 입력과 Gamepad 매핑 |
| Feature | `requiredFeatures`/`optionalFeatures`로 `hit-test`, `hand-tracking` 등 요청 |
| `XRWebGLLayer` | WebGL 프레임버퍼를 XR 출력에 연결 |

## 기본 사용법
```ts
const gl = canvas.getContext('webgl2', { xrCompatible: true })!;

async function enterVR() {
  if (!(await navigator.xr?.isSessionSupported('immersive-vr'))) return;
  const session = await navigator.xr!.requestSession('immersive-vr', {
    optionalFeatures: ['local-floor', 'hand-tracking'],
  });
  await session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
  const space = await session.requestReferenceSpace('local-floor');

  const onFrame = (_t: number, frame: XRFrame) => {
    session.requestAnimationFrame(onFrame);
    const pose = frame.getViewerPose(space);
    if (!pose) return;
    const layer = session.renderState.baseLayer!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
    for (const view of pose.views) {
      const vp = layer.getViewport(view)!;
      gl.viewport(vp.x, vp.y, vp.width, vp.height);
      // view.projectionMatrix, view.transform 으로 장면 렌더
    }
  };
  session.requestAnimationFrame(onFrame);
}
button.onclick = enterVR; // 사용자 제스처 필요
```
(`XRWebGLLayer`, `XRSession` 등 타입은 `@types/webxr` 같은 타입 정의가 필요하다.)

## 자주 쓰는 패턴
- 세션 시작은 버튼 클릭 같은 사용자 제스처 안에서 호출한다.
- 기능은 `optionalFeatures`로 요청하고 지원 여부를 세션에서 확인해 폴백한다.
- `session.requestAnimationFrame`을 사용한다(`window.requestAnimationFrame` 아님).
- 입력은 `inputSources`와 `select`/`squeeze` 이벤트, 혹은 `gamepad`로 처리한다.
- 직접 쓰기보다 Three.js `renderer.xr`, Babylon `createDefaultXRExperienceAsync` 같은 래퍼를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 설치 없는 링크 배포, 캠페인·교육·제품 뷰어, 빠른 프로토타입.
- 피할 때: 고사양 그래픽·플랫폼 전용 기능이 필요하면 네이티브(OpenXR) 엔진을 쓴다.

## 공식 문서
- [사양](https://immersive-web.github.io/webxr/) · [MDN 가이드](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) · [Immersive Web 샘플](https://immersive-web.github.io/webxr-samples/)
- 라이브러리: [Three.js](/develop-wiki/frontend/animation/threejs/)

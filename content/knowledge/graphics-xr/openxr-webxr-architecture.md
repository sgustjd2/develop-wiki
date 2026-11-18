---
title: OpenXR 아키텍처와 WebXR 세션 흐름
aka: [OpenXR, WebXR, XrInstance, XrSession, XrSpace, XrAction, Reference Space, XRSession, XRFrame, Interaction Profile]
category: graphics-xr
group: xr
level: intermediate
summary: OpenXR 는 Instance·System·Session·Space·Action 으로 기기를 추상화하는 Khronos 표준이고, WebXR 는 같은 개념을 브라우저 세션·참조 공간·입력 소스로 노출한다.
tags: [openxr, webxr, xr, api, session, reference-space, input, khronos, w3c]
related: [graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/hand-eye-tracking-interaction, graphics-xr/coordinate-systems-handedness, graphics-xr/homogeneous-coordinates-mvp, graphics-xr/plane-detection-anchors-spatial-mapping]
sources:
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
  - https://www.khronos.org/openxr/
  - https://www.w3.org/TR/webxr/
  - https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Fundamentals
updatedAt: 2026-11-19
---

## 문제

헤드셋마다 SDK 가 달랐다. 앱을 기기별로 포팅하고, 컨트롤러 입력 매핑도 기기마다 다시 짜야 했다. 웹에서는 그런 네이티브 SDK 를 쓸 수 없다.

## 해법 1: OpenXR (Khronos, 네이티브)

앱과 XR **런타임** 사이의 표준 API. 앱은 런타임을 직접 알 필요 없이 OpenXR 만 호출한다.

| 개념 | 역할 |
| --- | --- |
| `XrInstance` | 런타임과의 연결. 이 단계에서 사용할 **확장(extension)** 을 켠다 |
| `XrSystemId` | 사용할 XR 기기(`xrGetSystem`) |
| `XrSession` | 렌더링 컨텍스트(그래픽 API 바인딩) |
| `XrSpace` | 좌표 기준. 참조 공간 VIEW / LOCAL / STAGE(+1.1 의 LOCAL_FLOOR) 와 액션 공간 |
| `XrAction` / ActionSet | "선택", "잡기" 같은 **의도**. 실제 버튼 매핑은 런타임이 interaction profile 로 해결 |
| 프레임 루프 | `xrWaitFrame` → `xrBeginFrame` → 렌더 → `xrEndFrame` |

### 세션 상태

스펙: 세션 생성 직후 `IDLE`. 런타임이 준비되면 `XR_SESSION_STATE_READY` 이벤트(`xrPollEvent`)가 오고, 앱이 `xrBeginSession` 후 프레임 루프를 돈다. 입력이 가능한 상태는 `FOCUSED`, 입력 포커스를 잃으면 `VISIBLE` 로 내려간다. 앱은 이 이벤트를 받아 일시정지·렌더 중단을 처리해야 한다.

### 공간

참조 공간 정의(스펙 7.1): VIEW 는 머리에 붙은 공간, LOCAL 은 중력 정렬된 세계 고정 원점(+Y 위, +X 오른쪽, -Z 앞), STAGE 는 바닥 기준 룸스케일 영역. 눈 렌더링용 뷰 행렬은 VIEW 공간을 쓰기보다 `xrLocateViews` 를 쓰라고 스펙이 안내한다.

### 액션

앱은 `xrCreateAction` 으로 액션 정의 → `xrSuggestInteractionProfileBindings` 로 "이 컨트롤러에서는 이 버튼" 제안 → `xrAttachSessionActionSets` → 프레임마다 `xrSyncActions` 로 상태를 읽는다. 이 간접층 덕분에 새 컨트롤러가 나와도 앱 코드 변경 없이 런타임이 리매핑한다.

### 확장

핸드 트래킹, 앵커, 패스스루, 포비티드 렌더링 등은 대부분 **확장**이다(`XR_EXT_*`, 벤더 `XR_FB_*`, `XR_MSFT_*`). 사용 가능 여부를 인스턴스 생성 전 `xrEnumerateInstanceExtensionProperties` 로 확인한다.

## 해법 2: WebXR (W3C, 브라우저)

W3C 의 WebXR Device API 는 Candidate Recommendation Draft 단계다(이번에 연 판은 2026-11-09). 세션 흐름은 스펙이 안내하는 순서와 같다:

1. `navigator.xr.isSessionSupported("immersive-vr")` 로 지원 확인 후 진입 버튼을 노출.
2. 사용자 클릭(transient activation) 이벤트 안에서 `navigator.xr.requestSession(...)` 호출 — 스펙이 "user activation 이벤트 내에서 요청" 을 명시한다.
3. WebGL 컨텍스트를 `makeXRCompatible()` 로 준비(스펙은 컨텍스트 생성 시 `xrCompatible` 설정보다 비동기 `makeXRCompatible()` 를 권장).
4. 렌더 레이어 연결 후 `session.requestAnimationFrame` 루프에서 `frame.getViewerPose(refSpace)` 의 `views` 별로 렌더.

```ts
async function enterVR(gl: WebGL2RenderingContext) {
  if (!(await navigator.xr?.isSessionSupported("immersive-vr"))) return;
  await gl.makeXRCompatible();
  const session = await navigator.xr!.requestSession("immersive-vr", {
    optionalFeatures: ["local-floor", "hand-tracking"],
  });
  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
  const refSpace = await session.requestReferenceSpace("local-floor");
  session.requestAnimationFrame(function frame(t, f) {
    const pose = f.getViewerPose(refSpace);
    if (pose) {
      const layer = session.renderState.baseLayer!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
      for (const v of pose.views) {
        const vp = layer.getViewport(v)!;
        gl.viewport(vp.x, vp.y, vp.width, vp.height);
        draw(v.projectionMatrix, v.transform.inverse.matrix);
      }
    }
    session.requestAnimationFrame(frame);
  });
}
```

(위 코드는 스펙·MDN 구조를 참고해 직접 쓴 것으로, 실제 헤드셋/에뮬레이터에서 실행 검증하지 않았다. 타입은 `@types/webxr` 가 필요하다.)

- 참조 공간: `viewer`, `local`, `local-floor`, `bounded-floor`, `unbounded`. 스펙 표에 따르면 `local` 은 즉시 세션에서 기본 포함되고 `local-floor` 등은 사용자 동의를 요구한다.
- `getViewerPose()` 는 추적 수립 전에 null 일 수 있다(스펙 명시).
- `local-floor` 는 required 로 요구하면 미지원 기기에서 세션이 거부된다. optional 로 요청하고 **실제 enabledFeatures 를 확인**한다.

## 대응표

| 개념 | OpenXR | WebXR |
| --- | --- | --- |
| 진입 | `xrCreateInstance`/`xrCreateSession` | `navigator.xr.requestSession()` |
| 프레임 | `xrWaitFrame`/`BeginFrame`/`EndFrame` | `session.requestAnimationFrame` |
| 공간 | `XrSpace` + `xrLocateSpace` | `XRReferenceSpace` + `getPose` |
| 눈 뷰 | `xrLocateViews` | `XRViewerPose.views` |
| 입력 | Action + Binding | `XRInputSource` + `select` 이벤트 |
| 선택 기능 | 확장 | `requiredFeatures`/`optionalFeatures` |
| 보안 | 플랫폼 권한 | 사용자 동의 + Permissions Policy |

## 언제 쓰나

- 여러 기기 대응 네이티브: OpenXR + 엔진(Unity OpenXR 플러그인, Unreal, Godot)이 표준 경로.
- 설치 없는 체험·링크 공유: WebXR. 성능 한계와 기능 지원 편차를 감수.
- 단일 벤더 고유 기능(고급 패스스루 등): 벤더 확장·SDK 를 함께 사용.

## 주의

- OpenXR 도 **확장 지원이 기기마다 다르다.** 표준이라고 모든 기기에서 모든 기능이 되는 것은 아니다.
- WebXR 는 HTTPS 와 사용자 동의가 전제이고, 브라우저·기기 지원이 다르다. 기능 감지와 폴백(2D 모드)을 둔다.
- 세션 이벤트(일시정지, 입력 소스 변경, 세션 종료)를 처리하지 않으면 헤드셋을 벗을 때 앱이 어긋난다.
- 프레임 루프 안에서 할당·동기 로딩을 하지 않는다([프레임 예산](graphics-xr/motion-to-photon-reprojection-frame-budget)).
- 좌표 규약은 둘 다 오른손 Y-up 이지만 엔진 쪽 변환에서 틀리기 쉽다([좌표계](graphics-xr/coordinate-systems-handedness)).

## 개발자에게 왜 중요한가

API 이름은 달라도 "세션 시작 → 공간 선택 → 프레임마다 포즈로 렌더 → 의도 기반 입력" 이라는 골격은 같다. 이 골격을 알면 엔진이 숨긴 것을 디버깅할 수 있고, 새 기기·새 SDK 에도 빠르게 적응한다.

---
name: WebXR 샘플
url: https://immersive-web.github.io/webxr-samples/
docs: https://immersive-web.github.io/webxr/
repo: https://github.com/immersive-web/webxr-samples
domain: xr
category: learning
description: W3C Immersive Web 그룹의 WebXR 공식 샘플 모음. 브라우저에서 VR·AR 세션, 레퍼런스 공간, 입력, hit-test 사용 코드를 직접 실행하며 읽을 수 있다.
pricing: oss
tags: [webxr, w3c, samples, browser, vr, ar]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
WebXR Device API는 브라우저에서 헤드셋과 AR 기기에 접근하는 W3C 표준이다. `immersive-web/webxr-samples`(MIT, 마지막 푸시 2026-11-12)는 그 표준을 만드는 그룹이 유지하는 순수 JS 샘플로, 프레임워크 없이 세션·렌더 루프를 어떻게 구성하는지 보여 준다. 사이트는 GitHub Pages에서 바로 실행되며 헤드셋 브라우저나 에뮬레이터 확장으로 테스트한다.

- 샘플은 최소 구현이라 실제 서비스는 three.js, Babylon.js, A-Frame 같은 라이브러리를 얹는다. 엔진 선택은 [XR 엔진](/develop-wiki/xr/engines/)·표준 항목을 본다.
- 지원은 기기마다 다르다. Quest 브라우저, Android XR의 Chrome 등에서 쓰고, iOS Safari의 지원 범위는 직접 확인한다.

## 이렇게 쓴다
| 샘플 주제 | 배울 것 |
| --- | --- |
| 기본 VR 세션 | `requestSession('immersive-vr')`, 렌더 루프 |
| 입력·컨트롤러 | `XRInputSource`, 시선·집기, 컨트롤러 포즈 |
| AR 세션과 hit-test | `immersive-ar`, 평면 위 배치 |
| 레퍼런스 공간 | `local`, `local-floor`, `bounded-floor` 차이 |
| 레이어·성능 | 프레임버퍼 스케일, 멀티뷰 |

## 예제: three.js로 AR 세션 열기
샘플의 흐름을 three.js로 옮긴 최소 예.

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
scene.add(new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.1, 0.1),
  new THREE.MeshNormalMaterial()
));

document.querySelector('#enter').addEventListener('click', async () => {
  if (!(await navigator.xr?.isSessionSupported('immersive-ar'))) return alert('AR 미지원');
  const session = await navigator.xr.requestSession('immersive-ar', {
    optionalFeatures: ['hit-test', 'local-floor'],
  });
  await renderer.xr.setSession(session);
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
});
```
세션 요청은 반드시 버튼 클릭 같은 사용자 동작 안에서 호출해야 하고 HTTPS(또는 localhost)가 필요하다.

## 학습 순서 제안
1. 샘플 사이트를 헤드셋 브라우저로 열어 동작을 체험한다.
2. 가장 단순한 VR 샘플 코드를 읽고 렌더 루프(`requestAnimationFrame` → `session.requestAnimationFrame`)를 익힌다.
3. 입력과 hit-test 샘플을 자신의 three.js 프로젝트에 이식한다.
4. 기능 지원 확인(`isSessionSupported`)과 폴백 UI를 추가한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 설치 없는 XR 데모, 크로스 플랫폼 웹 경험, 표준 API 학습.
- 피할 때(대안): 고성능 게임은 엔진+OpenXR, 이미지 타깃·얼굴 같은 WebAR 기능은 [8th Wall](/develop-wiki/xr/ar-sdk/8th-wall/). 표준 기초는 [OpenXR 튜토리얼](/develop-wiki/xr/learning/openxr-tutorial/).

## 공식 문서
- [WebXR 샘플](https://immersive-web.github.io/webxr-samples/) · [WebXR Device API 사양](https://immersive-web.github.io/webxr/) · [MDN WebXR](https://developer.mozilla.org/docs/Web/API/WebXR_Device_API)

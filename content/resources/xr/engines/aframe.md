---
name: A-Frame
url: https://aframe.io
docs: https://aframe.io/docs/
repo: https://github.com/aframevr/aframe
stars: 17714
domain: xr
category: engines
description: HTML 태그와 엔티티-컴포넌트 구조로 WebXR VR·AR 장면을 선언하는 MIT 웹 프레임워크. Three.js 위에서 동작한다.
pricing: oss
tags: [webxr, vr, html, three.js, ecs]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
A-Frame은 `<a-scene>`, `<a-entity>` 같은 HTML 요소에 컴포넌트를 붙여 VR 장면을 만드는 프레임워크다. 내부 렌더링은 Three.js를 쓰며, 웹 개발자가 빌드 도구 없이 시작할 수 있도록 설계됐다. 커스텀 컴포넌트로 Three.js API에 직접 접근할 수 있다.

- 확인 기준: 최신 릴리스 v1.8.0(2026-06-24), 의존 Three.js는 npm 메타데이터상 `super-three` 포크 0.184.0. 마지막 푸시가 2026-07이라 활동이 빈번하진 않지만 아카이브는 아니다.

## 설치
CDN 스크립트 한 줄이면 된다.
```html
<script src="https://aframe.io/releases/1.8.0/aframe.min.js"></script>
```
npm 프로젝트라면 `npm install aframe`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Entity | 장면의 객체. 속성 없이는 아무 것도 없는 빈 컨테이너 |
| Component | 엔티티에 동작·모양을 붙이는 모듈(`geometry`, `material`, `light` …) |
| System | 컴포넌트 전체를 관리하는 전역 로직 |
| Primitive | `<a-box>` 처럼 흔한 조합의 축약 태그 |
| 입력 컴포넌트 | `laser-controls`, `hand-tracking-controls`, `cursor` |
| Inspector | 장면을 시각 편집하는 도구(`Ctrl+Alt+I`) |

## 기본 사용법
```html
<a-scene>
  <a-box position="0 1.5 -2" color="#4CC3D9" spin></a-box>
  <a-plane rotation="-90 0 0" width="6" height="6" color="#7BC8A4"></a-plane>
  <a-sky color="#ECECEC"></a-sky>
  <a-entity laser-controls="hand: right"></a-entity>
</a-scene>
<script>
  AFRAME.registerComponent('spin', {
    tick(time, dt) { this.el.object3D.rotation.y += dt * 0.001; }
  });
</script>
```
헤드셋이 있으면 하단 VR 버튼으로 세션에 진입한다.

## 자주 쓰는 패턴
- `<a-assets>`로 모델·텍스처를 미리 로드한 뒤 `src="#id"`로 참조한다.
- 이벤트(`click`, `mouseenter`)를 `cursor`/`raycaster`와 함께 쓴다.
- 복잡한 로직은 컴포넌트로 분리하고 `schema`로 속성을 정의한다.
- 커뮤니티 컴포넌트(물리, 환경, 앵커링)는 npm으로 추가한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 프로토타입, 교육, 단순한 WebXR 체험, HTML에 익숙한 팀.
- 피할 때: 대규모 장면·정밀한 성능 제어는 Babylon.js·PlayCanvas·Three.js 직접 사용이 낫다.

## 공식 문서
- [A-Frame 문서](https://aframe.io/docs/) · [Three.js 항목](/develop-wiki/frontend/animation/threejs/)

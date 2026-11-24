---
name: Babylon.js
url: https://www.babylonjs.com
docs: https://doc.babylonjs.com/features/featuresDeepDive/webXR
repo: https://github.com/BabylonJS/Babylon.js
stars: 26439
domain: xr
category: engines
description: Microsoft가 시작한 Apache-2.0 웹 3D 엔진. WebXR 헬퍼로 브라우저에서 VR·AR 세션, 컨트롤러, 핸드 트래킹을 다룬다.
pricing: oss
tags: [webxr, webgl, webgpu, 3d, javascript]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Babylon.js는 TypeScript로 작성된 웹 3D 엔진으로, WebGL과 WebGPU를 지원한다. 장면 그래프·PBR·물리·에디터(Inspector, Node Material Editor)를 포함하고, **WebXR 기능이 엔진 본체에 통합**되어 `createDefaultXRExperienceAsync` 한 호출로 VR/AR 진입 버튼과 컨트롤러 처리까지 구성된다. Three.js([/develop-wiki/frontend/animation/threejs/](/develop-wiki/frontend/animation/threejs/))가 가벼운 라이브러리라면 Babylon은 도구가 포함된 프레임워크 쪽이다.

- 확인 기준: npm `@babylonjs/core` 9.37.1, Apache-2.0.

## 설치
```bash
npm install @babylonjs/core
```
XR 기능은 `@babylonjs/core`에 포함된다. 로더(glTF)는 `@babylonjs/loaders`를 추가한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Engine` / `WebGPUEngine` | 캔버스 렌더링 엔진 |
| `Scene` | 메시·카메라·조명을 담는 장면 |
| `WebXRDefaultExperience` | 진입 UI, 카메라, 입력, 텔레포트를 묶은 기본 구성 |
| `WebXRFeaturesManager` | 텔레포트·핸드 트래킹·평면 감지·히트 테스트 등 기능 모듈 활성화 |
| `WebXRInput` | 컨트롤러 모델·버튼·축 이벤트 |
| Floor meshes | 텔레포트 가능한 바닥 지정 |

## 기본 사용법
```ts
import { Engine, Scene, FreeCamera, HemisphericLight, MeshBuilder, Vector3 } from '@babylonjs/core';

const canvas = document.querySelector('canvas')!;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
const camera = new FreeCamera('cam', new Vector3(0, 1.6, -3), scene);
new HemisphericLight('light', new Vector3(0, 1, 0), scene);
const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
MeshBuilder.CreateBox('box', { size: 0.5 }, scene).position.set(0, 1, 0);

const xr = await scene.createDefaultXRExperienceAsync({ floorMeshes: [ground] });
xr.input.onControllerAddedObservable.add((c) => console.log('컨트롤러', c.uniqueId));

engine.runRenderLoop(() => scene.render());
```
`await`는 모듈 최상위(ESM)에서 쓰거나 async 함수 안에서 호출한다.

## 자주 쓰는 패턴
- `featuresManager.enableFeature(WebXRFeatureName.HAND_TRACKING, 'latest', ...)`로 핸드 트래킹을 켠다.
- AR은 `sessionMode: 'immersive-ar'` 옵션과 히트 테스트 기능을 조합한다.
- 에뮬레이터(Immersive Web Emulator 같은 브라우저 확장)로 헤드셋 없이 개발한다.
- WebXR은 HTTPS(또는 localhost)에서만 동작한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 설치 없이 링크로 배포하는 XR, 제품 시각화, 풍부한 내장 도구가 필요할 때.
- 피할 때: 고사양 네이티브 성능은 Unity·Unreal, 선언형 마크업으로 빠른 시작은 A-Frame이 맞다.

## 공식 문서
- [WebXR 가이드](https://doc.babylonjs.com/features/featuresDeepDive/webXR) · [시작하기](https://doc.babylonjs.com/setup/starterHelp)

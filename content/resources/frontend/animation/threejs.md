---
name: Three.js
url: https://threejs.org
docs: https://threejs.org/manual/#en/fundamentals
repo: https://github.com/mrdoob/three.js
stars: 119543
domain: frontend
category: animation
description: 장면·카메라·메시·조명으로 브라우저 3D 그래픽을 만드는 JavaScript 라이브러리. WebGL과 WebGPU 렌더러를 제공한다.
pricing: oss
tags: [3d, webgl, webgpu, graphics]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Three.js는 저수준 WebGL·WebGPU API 위에 장면 그래프(Scene), 카메라, 지오메트리, 머티리얼, 조명, 로더를 얹어 브라우저에서 3D를 쉽게 그리게 하는 라이브러리다. 제품 뷰어, 데이터 시각화, 인터랙티브 랜딩, 게임 프로토타입까지 웹 3D의 사실상 기본 도구이며, React Three Fiber 같은 상위 도구도 Three.js 위에 있다. 버전은 `r187`처럼 리비전 번호로 매겨지고 npm에는 `0.187.0`으로 배포된다(이 문서 기준, MIT). 리비전마다 API가 바뀔 수 있어 마이그레이션 가이드를 확인해야 한다.

- 기본 `WebGLRenderer` 외에 `three/webgpu`에서 `WebGPURenderer`와 노드 기반 셰이딩 언어 TSL(`three/tsl`)을 제공한다.

## 설치
```bash
npm install three
npm install -D @types/three   # 타입 정의는 별도 패키지
```

컨트롤·로더 등 부가 모듈은 `three/addons/...` 경로로 import한다(예: `three/addons/controls/OrbitControls.js`).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Scene` | 그릴 객체를 담는 트리의 루트 |
| `PerspectiveCamera` | 시야각·종횡비·near·far로 정의하는 원근 카메라 |
| `WebGLRenderer` / `WebGPURenderer` | 장면을 캔버스에 그림. `setAnimationLoop`로 매 프레임 렌더 |
| `Mesh` = Geometry + Material | 형태(`BoxGeometry`, `BufferGeometry`)와 표면(`MeshStandardMaterial` 등)의 조합 |
| 조명 | `AmbientLight`, `DirectionalLight`, `PointLight`. PBR 머티리얼은 조명이 있어야 보임 |
| `Object3D` 변환 | `position`, `rotation`, `scale`. 부모의 변환을 자식이 상속 |
| 로더 | `GLTFLoader`(glTF/GLB 권장 포맷), `TextureLoader` |
| 컨트롤 | `OrbitControls` 등 마우스·터치로 카메라 조작 |
| `Raycaster` | 마우스 위치로 객체 선택(클릭·hover 판정) |

## 기본 사용법
```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#3b5bdb' }));
scene.add(cube, new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 5, 2);
scene.add(sun);

const controls = new OrbitControls(camera, renderer.domElement);
renderer.setAnimationLoop((t) => { cube.rotation.y = t / 1000; controls.update(); renderer.render(scene, camera); });
```

## 자주 쓰는 패턴
- **창 크기 대응.** `resize` 이벤트에서 `camera.aspect` 갱신 → `camera.updateProjectionMatrix()` → `renderer.setSize()`.
- **고해상도 화면.** `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`로 선명도와 성능을 절충한다.
- **모델은 glTF.** Blender 등에서 GLB로 내보내고 `GLTFLoader`로 불러온다. 용량이 크면 Draco·Meshopt 압축을 쓴다.
- **메모리 해제.** 제거한 객체의 `geometry.dispose()`, `material.dispose()`, `texture.dispose()`를 호출해야 GPU 메모리가 반환된다.
- **성능.** 같은 모양을 많이 그리면 `InstancedMesh`로 드로 콜을 줄인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 프레임워크와 무관하게 브라우저 3D·셰이더 효과·인터랙티브 시각화를 만들 때.
- 피할 때(대안): React 앱에서 3D를 컴포넌트로 다루려면 [React Three Fiber](/develop-wiki/frontend/animation/react-three-fiber/)가 편하다. 2D UI 애니메이션에는 과하다 — [Motion](/develop-wiki/frontend/animation/motion/)·[GSAP](/develop-wiki/frontend/animation/gsap/). 물리 엔진·에디터가 포함된 게임 엔진이 필요하면 별도 엔진을 검토한다.

## 공식 문서
- [기초(매뉴얼)](https://threejs.org/manual/#en/fundamentals) · [장면 만들기](https://threejs.org/manual/#en/creating-a-scene) · [API 문서](https://threejs.org/docs/)
- [예제 모음](https://threejs.org/examples/) · [마이그레이션 가이드](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

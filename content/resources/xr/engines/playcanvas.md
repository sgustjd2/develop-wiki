---
name: PlayCanvas
url: https://playcanvas.com
docs: https://developer.playcanvas.com/user-manual/xr/
repo: https://github.com/playcanvas/engine
stars: 17326
domain: xr
category: engines
description: WebGPU·WebGL2 기반 MIT 웹 그래픽 엔진. 클라우드 에디터와 함께 WebXR VR·AR 세션을 API로 제공한다.
pricing: oss
tags: [webxr, webgpu, webgl2, 3d, engine]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
PlayCanvas 엔진은 MIT 라이선스의 오픈소스 JavaScript 엔진으로, 엔티티-컴포넌트 구조를 쓴다. 별도의 웹 기반 협업 에디터(PlayCanvas Editor, 요금제 있음)가 있지만 엔진은 에디터 없이 npm 코드로도 쓸 수 있다. XR은 `app.xr` API로 세션 시작, 입력 소스, 히트 테스트, 핸드 트래킹을 제공한다.

- 확인 기준: 엔진 v2.24.2(GitHub 릴리스·npm). 에디터 요금제 세부는 확인하지 않았다.

## 설치
```bash
npm install playcanvas
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Application` | 렌더 루프와 서브시스템을 소유 |
| `Entity` + Component | 카메라·모델·스크립트 컴포넌트를 붙이는 객체 |
| `app.xr` | XR 매니저. `isAvailable`, `start`, `end` |
| `XrInput` | 컨트롤러·핸드·시선 입력 소스 |
| XR 타입 | `XRTYPE_VR`, `XRTYPE_AR`, `XRTYPE_INLINE` |
| 공간 | `XRSPACE_LOCALFLOOR` 등 기준 공간 |

## 기본 사용법
```ts
import * as pc from 'playcanvas';

const canvas = document.querySelector('canvas')!;
const app = new pc.Application(canvas);
app.start();

const camera = new pc.Entity('camera');
camera.addComponent('camera', { clearColor: new pc.Color(0.1, 0.1, 0.12) });
app.root.addChild(camera);

const box = new pc.Entity('box');
box.addComponent('render', { type: 'box' });
box.setPosition(0, 1.5, -2);
app.root.addChild(box);

if (app.xr.isAvailable(pc.XRTYPE_VR)) {
  // 반드시 사용자 제스처(클릭) 안에서 호출
  canvas.addEventListener('click', () =>
    app.xr.start(camera.camera!, pc.XRTYPE_VR, pc.XRSPACE_LOCALFLOOR));
}
```
세션 시작은 브라우저 정책상 사용자 제스처가 필요하다.

## 자주 쓰는 패턴
- `app.xr.input.on('add', ...)`로 컨트롤러 등장 시 모델·광선을 붙인다.
- AR은 `XRTYPE_AR`와 `app.xr.hitTest`로 현실 표면에 배치한다.
- glTF/GLB를 로드해 장면을 구성한다.
- 에디터 프로젝트라면 스크립트 컴포넌트에 XR 로직을 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: 가벼운 웹 3D·XR, 팀 협업형 브라우저 에디터가 필요할 때.
- 피할 때: 마크업 중심은 A-Frame, 도구가 더 많은 프레임워크는 Babylon.js가 어울린다.

## 공식 문서
- [XR 사용자 매뉴얼](https://developer.playcanvas.com/user-manual/xr/) · [API 레퍼런스](https://api.playcanvas.com/)

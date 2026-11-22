---
name: React Three Fiber
url: https://r3f.docs.pmnd.rs
docs: https://r3f.docs.pmnd.rs/getting-started/introduction
repo: https://github.com/pmndrs/react-three-fiber
stars: 33881
domain: frontend
category: animation
description: Three.js 장면을 JSX 컴포넌트로 선언하는 React 렌더러. 상태·이벤트·Suspense 같은 React 방식으로 3D를 만든다.
pricing: oss
tags: [3d, react, webgl, three-js]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
React Three Fiber(R3F)는 Three.js 객체를 `<mesh>`, `<boxGeometry>` 같은 JSX 요소로 표현하는 React 커스텀 렌더러다. Three.js의 모든 클래스를 소문자 JSX 태그로 쓸 수 있고, 렌더 루프·리사이즈·포인터 이벤트(raycasting)를 대신 관리한다. Three.js를 감싸 기능을 제한하는 래퍼가 아니라 같은 객체를 React 트리로 다루는 방식이라 Three.js 지식이 그대로 쓰인다. 이 문서는 **v9** 기준이다(npm `@react-three/fiber` `latest` 9.8.2). v9는 React 19(현재 peer 범위 `>=19 <19.4`)와 three 0.156 이상이 필요하다.

- 같은 pmndrs 생태계의 `@react-three/drei`(카메라 컨트롤, 텍스트, 환경맵, 로더 헬퍼 모음)와 함께 쓰는 경우가 대부분이다.

## 설치
```bash
npm install three @react-three/fiber
npm install @react-three/drei      # 선택: 자주 쓰는 헬퍼 컴포넌트
npm install -D @types/three
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `<Canvas>` | 렌더러·장면·카메라를 만들고 부모 크기에 맞춤. 3D 요소는 이 안에서만 |
| JSX 요소 | `<mesh>`, `<meshStandardMaterial>`, `<ambientLight>` 등 Three.js 클래스의 camelCase 이름 |
| `args` | 생성자 인자 (`<boxGeometry args={[1, 1, 1]} />`) |
| 속성 설정 | `position={[0, 1, 0]}`, `rotation-x={Math.PI / 2}`처럼 점·대시 경로로 중첩 속성 지정 |
| `useFrame` | 매 프레임 실행되는 콜백. ref로 객체를 직접 변경(상태 갱신 금지) |
| `useThree` | 렌더러·카메라·장면·크기 등 내부 상태 접근 |
| `useLoader` | 로더를 Suspense와 함께 사용 (`useLoader(GLTFLoader, url)`) |
| 이벤트 | `onClick`, `onPointerOver` 등 — 내부 Raycaster가 처리 |
| `extend` | 기본 목록에 없는 Three.js 클래스(애드온 등)를 JSX로 등록 |

## 기본 사용법
```tsx
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Mesh } from 'three';

function Box() {
  const ref = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  useFrame((_, delta) => { ref.current.rotation.y += delta; });
  return (
    <mesh ref={ref} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : '#3b5bdb'} />
    </mesh>
  );
}

export const Scene = () => (
  <Canvas camera={{ position: [2, 2, 4] }} style={{ height: 400 }}>
    <ambientLight intensity={0.4} />
    <directionalLight position={[3, 5, 2]} intensity={2} />
    <Box />
    <OrbitControls />
  </Canvas>
);
```

## 자주 쓰는 패턴
- **애니메이션은 ref로.** `useFrame` 안에서 `setState`를 호출하면 매 프레임 리렌더된다. ref로 객체 속성을 직접 바꾼다.
- **모델 로딩.** drei의 `useGLTF(url)`을 `<Suspense fallback={...}>` 안에서 쓰고, `npx gltfjsx model.glb`로 GLB를 JSX 컴포넌트로 변환한다.
- **필요할 때만 렌더.** 정적 장면은 `<Canvas frameloop="demand">`로 바뀔 때만 다시 그려 배터리를 아낀다.
- **상태 공유.** 3D와 DOM UI가 함께 쓰는 상태는 [Zustand](/develop-wiki/frontend/state-data/zustand/) 같은 외부 스토어에 두고 `useFrame`에서는 `getState()`로 읽는다.

## 언제 쓰나 / 피할 때
- 쓸 때: [React](/develop-wiki/frontend/framework/react/) 앱 안에 3D 뷰어·인터랙티브 장면을 넣고, 3D 객체를 컴포넌트로 재사용·조합하고 싶을 때.
- 피할 때(대안): React를 쓰지 않거나 렌더 루프를 완전히 직접 통제하려면 [Three.js](/develop-wiki/frontend/animation/threejs/)를 바로 쓴다. React 19 이전 버전 앱은 v8을 써야 한다.

## 공식 문서
- [소개](https://r3f.docs.pmnd.rs/getting-started/introduction) · [설치](https://r3f.docs.pmnd.rs/getting-started/installation) · [훅 API](https://r3f.docs.pmnd.rs/api/hooks)
- [drei](https://github.com/pmndrs/drei) · [릴리스](https://github.com/pmndrs/react-three-fiber/releases)

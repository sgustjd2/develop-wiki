---
title: 동차 좌표와 모델·뷰·프로젝션 행렬
aka: [Homogeneous Coordinates, Model View Projection, MVP Matrix, Clip Space, NDC, Perspective Divide, Projection Matrix]
category: graphics-xr
group: math
level: intermediate
summary: 점을 (x,y,z,1) 4차원으로 표현하면 이동·회전·원근 투영을 모두 4x4 행렬 곱 하나로 쓸 수 있다. 모델→월드→뷰→클립→NDC 변환 체인과 행렬 곱 순서가 3D 렌더링과 XR 카메라의 기본이다.
tags: [math, matrix, projection, camera, mvp, clip-space]
related: [graphics-xr/rasterization-pipeline, graphics-xr/coordinate-systems-handedness, graphics-xr/quaternion-3d-rotation, graphics-xr/foveated-stereo-rendering]
sources:
  - https://learnopengl.com/Getting-started/Coordinate-Systems
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
  - https://www.w3.org/TR/webxr/
updatedAt: 2026-11-19
---

## 문제

3D 이동(translation)은 `p + t` 라는 덧셈이고 회전·스케일은 3x3 행렬 곱이라 서로 다른 연산이다. 여러 변환을 합치려면 그때마다 두 종류를 따로 적용해야 한다. 원근(멀수록 작아짐)은 아예 비선형이다.

## 해법

### 동차 좌표

점을 `(x, y, z, 1)`, 방향 벡터를 `(x, y, z, 0)` 으로 쓴다. 4x4 행렬의 마지막 열이 이동을 담아, 이동도 곱셈이 된다. 방향은 w=0 이라 이동의 영향을 받지 않는다(방향은 위치가 없으니 맞는 동작). 변환을 곱으로 합성할 수 있어 CPU 에서 미리 하나로 합쳐 GPU 에 보낸다.

### 변환 체인

LearnOpenGL 이 설명하는 공간 순서:

```
로컬(모델) ─Model─▶ 월드 ─View─▶ 뷰(카메라) ─Projection─▶ 클립 ─÷w─▶ NDC ─뷰포트─▶ 화면
```

`clip = P · V · M · local` — 오른쪽 변환이 **먼저** 적용된다(열 벡터 규약). 행 벡터 규약(DirectX 계열 수학 라이브러리 일부)은 곱 순서가 반대다. 라이브러리 문서의 행/열 우선과 메모리 배치(column-major)를 확인한다.

- **View**: 카메라의 월드 변환의 **역행렬**. "카메라를 움직이는 것" = "세계를 반대로 움직이는 것".
- **Projection**: 절두체를 클립 공간으로 압축. 원근 투영은 `w` 에 `-z` 를 넣어, GPU 가 `÷w` 하면 멀수록 작아진다.
- **XR 에서**: 눈마다 View·Projection 이 다르다. OpenXR 는 `xrLocateViews` 로 눈별 pose 와 FOV 를 받아 계산하고, WebXR 는 `XRView` 의 `projectionMatrix` 와 `transform` 을 준다(비대칭 FOV 가 일반적이다).

### 직접 확인

```ts
// 열 우선(column-major) 원근 행렬. fovy 라디안
const perspective = (fovy: number, asp: number, n: number, f: number) => {
  const t = 1 / Math.tan(fovy / 2);
  return [t/asp,0,0,0,  0,t,0,0,  0,0,(f+n)/(n-f),-1,  0,0,2*f*n/(n-f),0];
};
const mul = (m: number[], v: number[]) =>
  [0,1,2,3].map(r => m[r]*v[0] + m[4+r]*v[1] + m[8+r]*v[2] + m[12+r]*v[3]);
const P = perspective(Math.PI/2, 1, 0.1, 100);
for (const z of [-0.1, -1, -10, -100]) { const c = mul(P,[0,0,z,1]); console.log(z, c[2]/c[3]); }
```

Node 로 실행한 결과 `-0.1 → -1`, `-1 → 0.8018`, `-10 → 0.98198`, `-100 → 1`. near 면이 -1, far 면이 +1 로 가고(OpenGL 규약) **비선형**이다. 1m 앞에서 이미 깊이의 90%가 소진돼 먼 곳 정밀도가 모자라는 이유다. Vulkan·D3D·WebGPU 는 NDC z 범위가 [0,1] 이라 투영 행렬 3행이 다르다.

## 언제 쓰나

- 카메라·객체 이동 시스템, 씬 그래프(부모 행렬 × 자식 행렬).
- 클릭 위치에서 3D 광선 만들기(피킹): 역 `P·V` 로 NDC → 월드.
- XR 포즈 적용: 기기가 준 pose(위치+쿼터니언)로 View 를 만든다.

## 주의

- **행렬 곱은 교환법칙이 없다.** `T·R` 과 `R·T` 는 다르다. "먼저 회전하고 이동" 이 `T·R`.
- **역행렬 비용**: 매 프레임 일반 역행렬은 비싸다. 강체 변환은 `[Rᵀ | -Rᵀt]` 로 싸게 구한다.
- **법선**은 비균일 스케일에서 모델 행렬의 역전치로 변환(방향 w=0 만으론 부족).
- **부동소수점**: 월드 원점에서 수 km 떨어지면 float32 정밀도(약 7자리)로 떨림이 생긴다. 카메라 기준 상대 좌표(camera-relative rendering) 로 푼다. [부동소수점](cs-fundamentals/number-representation) 참고.
- near 를 0 에 가깝게 잡으면 깊이 정밀도가 무너진다(near 를 키우는 것이 far 를 줄이는 것보다 효과적).
- 회전 표현은 행렬이 아니라 [쿼터니언](graphics-xr/quaternion-3d-rotation) 으로 저장·보간하고, 마지막에 행렬로 변환하는 게 보통이다.

## 개발자에게 왜 중요한가

"모델이 안 보인다" 의 대부분은 체인의 한 단계(순서, 행/열 규약, 좌표계 방향, near/far)가 틀린 것이다. 어느 공간의 좌표인지 변수명에 `worldPos`, `viewPos` 처럼 적어 두면 디버깅이 쉬워진다. 좌표계 방향은 [좌표계 노트](graphics-xr/coordinate-systems-handedness) 참고.

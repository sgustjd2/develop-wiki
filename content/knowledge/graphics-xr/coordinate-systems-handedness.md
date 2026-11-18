---
title: 좌표계(오른손·왼손)와 Y-up·Z-up 변환 함정
aka: [Coordinate System, Handedness, Right-handed, Left-handed, Y-up, Z-up, Winding Order, glTF, Unity, Unreal]
category: graphics-xr
group: math
level: intermediate
summary: 엔진·포맷마다 축 방향과 손 방향이 다르다. 오른손/왼손 변환은 한 축 부호 반전과 쿼터니언·삼각형 감김 순서 보정까지 따라오고, Y-up 과 Z-up 은 -90° 회전 하나로 오간다.
tags: [math, coordinate-system, handedness, gltf, unity, unreal, openxr, webxr]
related: [graphics-xr/homogeneous-coordinates-mvp, graphics-xr/quaternion-3d-rotation, graphics-xr/openxr-webxr-architecture, graphics-xr/rasterization-pipeline]
sources:
  - https://learnopengl.com/Getting-started/Coordinate-Systems
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
  - https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  - https://www.w3.org/TR/webxr/
updatedAt: 2026-11-19
---

## 문제

CAD 에서 내보낸 모델이 누워 있고, Unity 로 가져온 모델이 거울상이며, 안쪽 면이 렌더링된다. 모두 좌표계 규약 불일치다. 3D 에는 "정답" 규약이 없어 도구마다 다르다.

## 규약 정리

| 환경 | 손 | 위 | 앞 | 비고 |
| --- | --- | --- | --- | --- |
| OpenGL / LearnOpenGL | 오른손 | +Y | 카메라가 -Z 를 봄 | LearnOpenGL: "OpenGL 은 관례상 오른손 좌표계" |
| glTF 2.0 | 오른손 | +Y | +Z 가 에셋의 앞 | 단위는 미터 |
| OpenXR | 오른손 | +Y | LOCAL 공간은 +Y up, +X right, -Z forward | 스펙 7.1 절 |
| WebXR | 오른손 | +Y | -Z forward | 단위 미터 |
| Unity | **왼손** | +Y | +Z | 엔진 내부 규약 |
| Unreal | 왼손 | **+Z** | +X | 단위 cm |
| Blender / 많은 CAD | 오른손 | **+Z** | -Y(관습) | |

(Unity·Unreal·Blender 항목은 이 노트 작성 시 각 문서를 직접 열어 확인하지 않은 일반 지식이다. 사용 전 현재 문서로 재확인.)

## 변환

### Y-up ↔ Z-up (둘 다 오른손)

회전 하나로 끝난다. 직접 확인한 매핑: Z-up → Y-up 은 `(x, y, z) → (x, z, -y)`.

```ts
const zUpToYUp = (v: [number, number, number]): [number, number, number] => [v[0], v[2], -v[1]];
// Z-up 의 +Z(위) → [0, 1, 0],  Z-up 의 +Y(앞) → [0, 0, -1]
```

Node 로 실행해 `[0,0,1] → [0,1,-0]`, `[0,1,0] → [0,0,-1]` 을 확인했다(-0 은 부동소수점 부호 0).

### 오른손 ↔ 왼손

한 축 부호를 뒤집으면 거울상이 되므로 **같은 데이터를 다르게 해석하는 것**이 된다. 함께 보정할 것:

1. 위치·방향 벡터: 그 축 성분 부호 반전(예: Z 반전).
2. **쿼터니언**: 반전한 축에 수직인 두 성분의 부호를 뒤집는다(Z 반전이면 `(x,y,z,w) → (-x,-y,z,w)`). 단순히 z 만 뒤집으면 틀린다.
3. **삼각형 감김(winding)**: 거울상은 앞면이 뒷면이 된다. 인덱스 순서를 뒤집거나 컬링 면을 바꾼다.
4. 법선·탄젠트의 부호, 행렬의 행렬식 부호.

## 언제 쓰나 / 어디서 일어나나

- 에셋 임포트(FBX/glTF/USD) 파이프라인, 엔진 간 이식.
- XR: 서로 다른 SDK 의 포즈를 한 씬에 합칠 때. 센서·IMU 는 기기 고유 축을 쓰므로 변환이 필요하다.
- 물리·내비게이션 라이브러리를 다른 엔진 좌표계에 붙일 때.

## 주의

- **"거울상인데 크기는 맞다"** 는 손 방향 오류의 전형. 씬에 비대칭 표식(글자, 화살표) 을 넣어 두면 즉시 보인다.
- 오일러각은 축·순서·단위(도/라디안)·부호 규약이 얽혀 변환이 가장 위험하다. 쿼터니언으로 옮긴 뒤 변환한다.
- 변환을 **경계 한 곳**(임포터, 어댑터 레이어)에만 둔다. 여기저기 `-z` 를 흩뿌리지 않는다.
- 단위(m / cm)도 같이 확인한다. XR 에서는 1 단위=1 미터라는 전제가 깨지면 눈 간격(IPD) 때문에 세계 스케일이 달라 보인다.
- 행렬을 직접 변환할 때는 열/행 우선 규약([MVP 노트](graphics-xr/homogeneous-coordinates-mvp))과 겹쳐 실수하기 쉽다.

## 개발자에게 왜 중요한가

버그가 "보이는 문제" 라 쉬워 보이지만, 위치·회전·감김·법선이 서로 다른 방식으로 틀려 한 번에 한 가지만 고치면 다른 게 어긋난다. 좌표계는 문서화하고(`worldFromHead` 같은 이름 규칙), 변환 코드는 테스트로 고정한다. 쿼터니언 세부는 [쿼터니언 노트](graphics-xr/quaternion-3d-rotation), XR 공간 정의는 [OpenXR·WebXR](graphics-xr/openxr-webxr-architecture) 참고.

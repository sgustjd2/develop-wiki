---
title: 쿼터니언으로 3D 회전
aka: [Quaternion, Slerp, Gimbal Lock, Euler Angles, Axis-Angle, Unit Quaternion]
category: graphics-xr
group: math
level: intermediate
summary: 단위 쿼터니언(x,y,z,w) 은 회전을 4개 숫자로 표현해 오일러각의 짐벌락을 피하고, 합성·보간(slerp)이 안정적이다. XR 기기의 포즈도 쿼터니언으로 온다.
tags: [math, quaternion, rotation, slerp, gimbal-lock, xr]
related: [graphics-xr/homogeneous-coordinates-mvp, graphics-xr/coordinate-systems-handedness, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/motion-to-photon-reprojection-frame-budget]
sources:
  - https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
  - https://en.wikipedia.org/wiki/Gimbal_lock
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
  - https://www.w3.org/TR/webxr/
updatedAt: 2026-11-19
---

## 문제

오일러각(yaw·pitch·roll)은 직관적이지만 세 가지 문제가 있다.

1. **짐벌락**: 두 회전축이 나란해지는 자세(예: pitch ±90°)에서 한 자유도가 사라져 회전이 이상하게 튄다(Wikipedia: gimbal lock 은 다차원 기구에서 축 정렬로 자유도 하나를 잃는 현상).
2. **적용 순서 의존**: XYZ 와 ZYX 가 다른 결과.
3. **보간 불량**: 각 축을 따로 선형 보간하면 경로가 휘고 속도가 불균일하다.

회전 행렬(3x3)은 9개 숫자라 누적 오차로 직교성이 깨지고 보간이 어렵다.

## 해법

### 표현

축 `a`(단위벡터), 각도 `θ` 에 대해 `q = (a·sin(θ/2), cos(θ/2))` = `(x, y, z, w)`. 길이 1 이어야 회전이다(단위 쿼터니언).

- 합성: `q = q2 * q1` (q1 먼저). 교환법칙이 없다.
- 벡터 회전: `v' = q · (v,0) · q⁻¹` (켤레가 곧 역).
- `q` 와 `-q` 는 **같은 회전**(이중 덮개). 보간 전에 내적이 음수면 한쪽 부호를 뒤집어 짧은 경로를 택한다.

```ts
type Q = [number, number, number, number]; // x,y,z,w
const qmul = (a: Q, b: Q): Q => [
  a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
  a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
  a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
  a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2],
];
const axisAngle = (a: [number, number, number], r: number): Q => {
  const s = Math.sin(r / 2); return [a[0]*s, a[1]*s, a[2]*s, Math.cos(r / 2)];
};
const rot = (q: Q, v: [number, number, number]) => {
  const c: Q = [-q[0], -q[1], -q[2], q[3]];
  const r = qmul(qmul(q, [...v, 0] as Q), c); return [r[0], r[1], r[2]];
};
// +X 를 +Y 축으로 90° 회전 → 오른손 좌표계에서 (0,0,-1)
```

Node 로 실행해 `+X` 를 Y 축 90° 회전하면 `(0, 0, -1)` 이 나오는 것(오른손 규칙과 일치)과, identity 와 그 회전의 slerp(t=0.5) 가 정확히 45° 임을 확인했다.

### Slerp

두 회전 사이를 **일정한 각속도**로 보간한다. 각이 매우 작으면(내적 ≈ 1) 0 으로 나누는 문제가 있어 정규화한 선형 보간(nlerp)으로 대체한다.

## 비교

| | 오일러각 | 회전 행렬 | 쿼터니언 |
| --- | --- | --- | --- |
| 크기 | 3 | 9 | 4 |
| 짐벌락 | 있음 | 없음 | 없음 |
| 합성 | 불편 | 곱셈 | 곱셈(16 곱) |
| 보간 | 나쁨 | 어려움 | slerp |
| 사람이 읽기 | 좋음 | 보통 | 나쁨 |
| 정규화 필요 | - | 직교화 | 단위 길이 |

## 언제 쓰나

- 카메라·캐릭터·XR 기기 방향 저장. OpenXR 의 `XrPosef` 는 `XrQuaternionf orientation` 과 `XrVector3f position`, WebXR 의 `XRRigidTransform.orientation` 도 쿼터니언(DOMPointReadOnly)이다.
- 애니메이션 키프레임 보간, 스무딩, 센서 융합 결과 전달.
- 사용자 입력(슬라이더·에디터 표시)은 오일러각, 내부 저장은 쿼터니언으로 나누는 구성이 흔하다.

## 주의

- **정규화**: 곱을 누적하면 길이가 1 에서 벗어난다. 주기적으로 정규화한다.
- 쿼터니언 필드 순서가 라이브러리마다 다르다: `(x,y,z,w)`(OpenXR, WebXR, three.js, Unity) vs `(w,x,y,z)`(일부 수학 라이브러리). 헷갈리면 회전이 엉뚱해진다.
- 오른손/왼손 변환 시 쿼터니언 성분도 바꿔야 한다([좌표계 노트](graphics-xr/coordinate-systems-handedness)).
- 짐벌락이 없다고 모든 문제가 없는 것은 아니다. 360° 이상 회전량(누적 회전수)은 쿼터니언이 기억하지 못한다.
- "보간 = 최단 경로" 이므로 의도적으로 긴 쪽으로 돌려야 하는 연출에는 부호 처리를 직접 해야 한다.

## 개발자에게 왜 중요한가

머리 추적은 초당 수백~수천 번 갱신되는 방향 데이터다. 쿼터니언으로 받아 [재투영](graphics-xr/motion-to-photon-reprojection-frame-budget) 에서 마지막 순간 회전을 보정하고, 예측은 각속도를 적분해 구한다. 변환 체인에 넣을 때는 [MVP 행렬](graphics-xr/homogeneous-coordinates-mvp) 로 바꾼다.

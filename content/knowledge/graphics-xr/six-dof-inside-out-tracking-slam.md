---
title: 6DoF 인사이드-아웃 추적과 VIO·SLAM
aka: [6DoF, Inside-Out Tracking, VIO, Visual-Inertial Odometry, SLAM, IMU, Drift, Relocalization, Loop Closure]
category: graphics-xr
group: tracking
level: advanced
summary: 헤드셋·폰의 카메라와 IMU 만으로 자신의 위치(3축)와 방향(3축)을 추정하는 방식. 프레임 간 움직임을 쌓는 VIO 와 지도를 만들어 위치를 바로잡는 SLAM 의 역할, 드리프트와 실패 조건을 이해하는 것이 핵심이다.
tags: [tracking, slam, vio, 6dof, imu, ar, vr]
related: [graphics-xr/plane-detection-anchors-spatial-mapping, graphics-xr/quaternion-3d-rotation, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/openxr-webxr-architecture]
sources:
  - https://en.wikipedia.org/wiki/Simultaneous_localization_and_mapping
  - https://developers.google.com/ar/develop/anchors
  - https://developer.oculus.com/blog/the-latent-power-of-prediction/
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
updatedAt: 2026-11-19
---

## 문제

3DoF(방향만)는 머리를 돌리는 것만 따라가고 몸을 숙이거나 걸으면 세계가 따라온다. 6DoF 는 위치 3 + 방향 3, 총 6 자유도를 추적한다. 예전엔 방 안에 외부 기준 장치(아웃사이드-인)를 놓았지만, 일반 소비자 기기는 **기기에 달린 센서만으로** 해야 한다(인사이드-아웃).

## 해법

### 센서와 역할

| 센서 | 강점 | 약점 |
| --- | --- | --- |
| IMU (자이로·가속도) | 수백~수천 Hz, 빠른 움직임·방향 | 가속도를 두 번 적분하면 위치 오차가 빠르게 발산 |
| 카메라(들) | 환경 특징점으로 위치 보정 | 프레임레이트 낮음(수십 Hz), 어둡거나 무늬 없으면 실패, 모션 블러 |
| (선택) 깊이/ToF/라이다 | 스케일·평면 | 전력, 거리 한계 |

### VIO 와 SLAM

- **VIO(Visual-Inertial Odometry)**: IMU 로 짧은 구간을 예측하고 카메라 특징점으로 오차를 교정한다. 상대 이동량을 이어 붙이는 방식이라 **드리프트**(조금씩 누적되는 오차)가 있다. 단안 카메라만으로는 절대 스케일을 모르지만 IMU 가 스케일을 준다.
- **SLAM**: 위치를 추정하면서 동시에 **지도**(특징점, 키프레임)를 만든다. 이미 본 장소로 돌아오면 루프 클로저로 누적 오차를 바로잡고, 추적을 잃으면 지도에 대고 재위치(relocalization)한다. Wikipedia 는 SLAM 을 환경 지도를 만들면서 그 안의 위치를 추적하는 문제로 정의한다.
- 현업 기기는 둘을 합쳐 쓴다. 고속 경로는 IMU 융합(저지연), 저속 경로는 비전 보정.

```
IMU 1000Hz ──▶ 예측(방향·위치) ──┐
                                  ├─▶ 융합 필터/최적화 ─▶ pose (쿼터니언+위치)
카메라 30~90Hz ─▶ 특징 추적 ─────┘          ▲
                        지도·루프 클로저 ────┘
```

### 앱이 받는 것

앱은 SLAM 내부를 보지 않고 **pose**(위치+쿼터니언)와 **추적 상태**를 받는다. WebXR 는 추적을 아직 못 잡았을 때 `getViewerPose()` 가 null 을 돌려줄 수 있다고 명시한다(스펙 문구). OpenXR 는 `xrLocateSpace`·`xrLocateViews` 로 시각을 지정해 pose 를 묻고, 위치·방향 각각 유효/추적 중 플래그를 돌려준다.

```ts
// 앱 쪽 방어 코드 예시 (WebXR)
function onFrame(t: number, frame: XRFrame) {
  const pose = frame.getViewerPose(refSpace);
  if (!pose) return showTrackingLostHint();   // 추적 시작 전/상실
  render(pose.views);
}
```

## 언제 쓰나

- 헤드셋 월드락 콘텐츠, 폰 AR(ARCore, ARKit), 실내 위치 기반 오버레이.
- 장소 간 일관성이 필요한 앱(앵커 재현) → 지도 기반 재위치 기능이 있는 플랫폼 활용.

## 주의 / 실패 조건

- **저조도·무늬 없는 벽·반사/유리·빠른 회전 모션 블러**: 특징점이 부족해 추적이 불안정해진다.
- **움직이는 대상**(사람, 달리는 차 안 등): 특징점이 환경 고정이라는 가정이 깨진다.
- 드리프트와 재위치 순간의 **pose 점프**: 앵커가 순간 이동한다. UI 를 pose 에 하드 고정하지 말고 보정을 부드럽게 흡수한다.
- **카메라 접근·프라이버시**: 패스스루·환경 지도는 집 안 사진과 같은 데이터다. 플랫폼마다 권한 모델이 다르다.
- 전력·발열: 카메라와 비전 연산이 상시 돈다. 스탠드얼론 기기에서 추적이 CPU/NPU 예산을 일부 쓴다.
- 지연: pose 는 "측정 시각" 이 있다. 렌더링은 예측으로 "표시 시각" 을 맞춘다([지연·재투영](graphics-xr/motion-to-photon-reprojection-frame-budget)).

## 비교: 3DoF vs 6DoF

| | 3DoF | 6DoF |
| --- | --- | --- |
| 추적 | 방향 | 방향+위치 |
| 센서 | IMU | IMU+카메라 |
| 멀미 | 위치 불일치로 더 유발 | 자연스러운 몸 움직임 반영 |
| 예 | 구형 모바일 VR | 현재 Quest·Vision Pro·폰 AR |

## 개발자에게 왜 중요한가

추적은 앱이 제어할 수 없는 입력이지만, 상실·점프·지연이 있다고 가정하고 설계해야 한다. "추적 상태" 를 UI 로 알리고, 앵커([평면·앵커·공간 맵핑](graphics-xr/plane-detection-anchors-spatial-mapping))를 쓰고, pose 변환은 [쿼터니언](graphics-xr/quaternion-3d-rotation) 으로 다룬다.

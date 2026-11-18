---
title: 포비티드 렌더링과 스테레오 렌더링 최적화
aka: [Foveated Rendering, Fixed Foveated Rendering, FFR, Eye-Tracked Foveated Rendering, ETFR, Variable Rate Shading, Multiview, Single-Pass Stereo, Instanced Stereo, Lens Distortion]
category: graphics-xr
group: xr
level: advanced
summary: 눈마다 따로 그려야 해서 비용이 두 배인 XR 에서, 주변시 해상도를 낮추는 포비티드 렌더링과 한 번의 패스로 두 눈을 그리는 멀티뷰가 GPU·CPU 비용을 줄이는 기본 수단이다.
tags: [xr, vr, foveated-rendering, stereo, multiview, gpu, performance]
related: [graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/forward-vs-deferred-rendering, graphics-xr/hand-eye-tracking-interaction, graphics-xr/homogeneous-coordinates-mvp]
sources:
  - https://developers.meta.com/horizon/documentation/unity/unity-fixed-foveated-rendering
  - https://en.wikipedia.org/wiki/Foveated_rendering
  - https://www.w3.org/TR/webxr/
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
updatedAt: 2026-11-19
---

## 문제

XR 은 눈 두 개에 각각 고해상도(렌즈 왜곡 보정용 오버샘플 포함)를 90Hz 안팎으로 그려야 한다. 단순 계산으로 같은 장면을 두 번, 그것도 모니터보다 훨씬 많은 픽셀로 그린다. 스탠드얼론 기기는 모바일 SoC 의 열·전력 한계까지 있다.

## 해법 1: 포비티드 렌더링

사람 눈은 중심와(fovea)에서만 선명하게 본다. 시선에서 먼 영역은 해상도를 낮춰도 거의 티가 안 난다. 픽셀 셰이딩 비용을 줄이는 방식이다.

| 방식 | 초점 | 필요한 것 | 비고 |
| --- | --- | --- | --- |
| **FFR**(고정) | 화면 중앙 고정 | 하드웨어/드라이버 지원 | 눈이 가장자리를 보면 티 날 수 있음. 아이 트래킹 불필요 |
| **ETFR**(시선 추적) | 실제 시선 | 아이 트래킹 + 권한 | 이득이 크지만 지연이 크면 오히려 보임 |
| VRS(Variable Rate Shading) | 영역별 셰이딩 비율 | GPU 지원 | 구현 수단 중 하나 |

Wikipedia 는 FFR 을 시선 추적 없이 초점을 고정하는 방식으로 구분한다. Meta 의 Unity 문서에서 FFR 은 눈 가장자리의 텍스처를 중앙보다 낮은 해상도로 렌더링하여 픽셀 셰이딩 부하를 줄인다고 설명하고, `OVRManager.foveatedRenderingLevel` 로 단계를 설정한다. 복잡한 프래그먼트 셰이더일수록 이득이 크다.

```ts
// Meta Quest(Unity) 에서 FFR 단계 설정 (개념; 공식 문서의 코드 형태)
// OVRManager.foveatedRenderingLevel = OVRManager.FoveatedRenderingLevel.High;
```

WebXR 에서는 레이어 `fixedFoveation` 속성(0~1)으로 비슷한 힌트를 줄 수 있다(스펙·브라우저 지원은 확인 필요. 본문에서 정확한 속성명 전체를 이번에 검증하지 못함).

## 해법 2: 스테레오 렌더링 최적화

| 방식 | 설명 | 절감 |
| --- | --- | --- |
| 순진한 방식 | 눈마다 씬을 완전히 따로 렌더 | 없음 (CPU 드로 콜 2배) |
| **멀티뷰 / 단일 패스 스테레오** | 한 번의 드로 콜로 두 눈 배열 텍스처에 동시 렌더 | CPU 드로 콜·상태 설정 절반, 지오메트리 처리 공유 |
| 인스턴스 스테레오 | 인스턴싱으로 눈별 버텍스 실행 | 비슷한 효과 |
| 공유 컬링 | 두 눈 프러스텀의 합집합으로 한 번만 컬링 | CPU 컬링 절반 |
| 비대칭 FOV·가림 마스크 | 렌즈 밖 보이지 않는 픽셀 제외(hidden area mesh) | 필 레이트 약간 절약 |

멀티뷰는 보통 버텍스 셰이더에서 "눈 인덱스" 로 눈별 행렬을 고르는 구조다. 눈별 행렬(`view·projection`)은 OpenXR 의 `xrLocateViews`, WebXR 의 `XRView` 가 준다([MVP 노트](graphics-xr/homogeneous-coordinates-mvp)). 비대칭 FOV 투영을 받는다는 점이 모니터용 카메라와 다르다.

```glsl
// 개념: 멀티뷰 버텍스 셰이더 (GL_OVR_multiview2). 컴파일 검증은 하지 않음
#version 300 es
#extension GL_OVR_multiview2 : require
layout(num_views = 2) in;
uniform mat4 uViewProj[2];
in vec3 aPos;
void main() { gl_Position = uViewProj[gl_ViewID_OVR] * vec4(aPos, 1.0); }
```

## 언제 쓰나

- 거의 모든 스탠드얼론 VR: FFR 을 켜 두고 가장자리 품질 저하를 눈으로 확인.
- 프래그먼트 병목일 때(복잡한 PBR 셰이더, 높은 해상도): 포비티드가 효과적. 정점·CPU 병목이면 효과 적음. 그럴 땐 멀티뷰·컬링·배칭([렌더 경로](graphics-xr/forward-vs-deferred-rendering)).
- 시선 추적 기기: ETFR 로 중심 해상도를 올리고 주변을 더 공격적으로 낮춤.

## 주의 / 비용

- 저해상도 영역의 **앨리어싱·모자이크**가 대비 높은 텍스트·얇은 선에서 보인다. UI 는 별도 레이어로 풀 해상도 제출.
- 포비티드 단계를 높일수록 이득은 늘지만 시각 아티팩트도 늘어난다. 기기와 콘텐츠로 직접 비교.
- ETFR 은 시선 데이터를 쓴다. 대개 플랫폼이 시선을 앱에 노출하지 않고 시스템이 처리하도록 설계하지만, 앱이 시선 값을 받는 API 는 권한·프라이버시 설계가 필요하다([입력 노트](graphics-xr/hand-eye-tracking-interaction)).
- 포스트 프로세싱(블룸·블러) 패스는 포비티드 영역과 맞지 않을 수 있다. 렌더 타깃 포맷·MSAA 와의 호환 조건을 문서로 확인.
- 이득은 장면·셰이더·기기에 달려 있다. 절감률은 반드시 직접 측정한다(이 노트에서 절감률 숫자를 주장하지 않는다).

## 개발자에게 왜 중요한가

XR 성능은 "프레임을 빠르게" 가 아니라 "예산 안에 일정하게" 이다([프레임 예산](graphics-xr/motion-to-photon-reprojection-frame-budget)). 포비티드와 멀티뷰는 코드 한두 줄 설정으로 큰 예산을 되찾는 수단이지만, 병목이 어디인지 먼저 확인해야 효과가 난다.

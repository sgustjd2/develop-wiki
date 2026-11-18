---
title: 핸드·아이 트래킹과 상호작용 모델
aka: [Hand Tracking, Eye Tracking, Gaze, Pinch, Ray Interaction, Direct Touch, Gaze and Pinch, Controller Input]
category: graphics-xr
group: tracking
level: intermediate
summary: 컨트롤러, 손 관절 추적, 시선을 입력으로 쓰는 방식과 각각에 맞는 상호작용(레이, 직접 터치, 시선+핀치). 입력 정확도·피로·프라이버시 제약이 UI 크기와 흐름을 결정한다.
tags: [hand-tracking, eye-tracking, input, interaction, privacy, openxr, webxr]
related: [graphics-xr/plane-detection-anchors-spatial-mapping, graphics-xr/foveated-stereo-rendering, graphics-xr/openxr-webxr-architecture, graphics-xr/vr-motion-sickness-ux]
sources:
  - https://developers.meta.com/horizon/design/hands/
  - https://developer.apple.com/documentation/arkit/handtrackingprovider
  - https://www.w3.org/TR/webxr/
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
updatedAt: 2026-11-19
---

## 문제

2D 앱의 입력은 포인터 하나(마우스·터치)로 단순하다. XR 은 입력 후보가 여럿이고, 기기마다 있거나 없다. 컨트롤러는 정확하지만 손에 들어야 한다. 손은 자연스럽지만 촉감·버튼이 없다. 시선은 빠르지만 "본다 ≠ 선택한다" 문제(Midas touch)가 있다.

## 해법: 입력 종류

| 입력 | 데이터 | 장점 | 한계 |
| --- | --- | --- | --- |
| 컨트롤러 | 6DoF pose, 버튼·트리거·조이스틱·햅틱 | 정밀, 촉각, 신뢰 | 손에 들어야 함 |
| 핸드 트래킹 | 손 관절 pose(수십 개 관절) + 제스처(핀치) | 도구 없이, 직접 조작 | 가림·조명 영향, 촉각 없음, 피로 |
| 아이 트래킹 | 시선 광선·고정 지점 | 빠른 타깃팅, 포비티드 렌더링 | 보정 필요, 정확도 한계, **프라이버시** |
| 음성 | 인식 문자열 | 핸즈프리 | 환경 소음, 공공장소 |

핸드 트래킹의 API 는 플랫폼마다 형태가 다르다. Apple 은 visionOS/ARKit 에 `HandTrackingProvider` 를 두고, OpenXR 는 `XR_EXT_hand_tracking` 확장, WebXR 는 `hand-tracking` 선택 기능과 `XRHand` 로 관절 공간을 제공한다(세부 지원 범위는 현재 스펙·문서 재확인 필요).

### 상호작용 모델

1. **레이(원거리 포인팅)**: 컨트롤러 또는 손에서 광선을 쏘아 먼 UI 선택, 핀치/트리거로 확정. 정확도 낮은 손에도 쓸 만하다.
2. **직접 조작(근거리)**: 손가락이 물체/패널에 직접 닿아 터치·잡기. 직관적이지만 팔을 뻗어야 해서 피로(gorilla arm).
3. **시선 + 핀치**: 시선으로 대상을 겨누고 손짓으로 확정. Apple 의 visionOS 가 대표적인 설계이며, 앱에 시선 데이터를 상시 노출하지 않고 선택 순간에만 알려 프라이버시를 지킨다는 것이 공개된 설계 원칙이다(이 점은 이번에 HIG 페이지를 직접 열어 확인하지 못했다).

Meta 의 손 디자인 문서도 손 입력의 유형별 상호작용 선택과 한계를 안내한다.

### 입력 추상화

기기별 분기 코드를 줄이려면 **의도 단위**(선택, 잡기, 이동)로 추상화한다. OpenXR 의 action 시스템(`select`, `grab` 같은 액션을 정의하고 기기별 바인딩을 매핑)이 이 목적의 표준 설계이고, WebXR 는 `XRInputSource` 와 `select`/`squeeze` 이벤트로 비슷한 추상을 준다. 자세한 구조는 [OpenXR·WebXR](graphics-xr/openxr-webxr-architecture).

```ts
// WebXR: 입력 소스 종류에 상관없이 select 이벤트로 의도 처리
session.addEventListener("select", (e: XRInputSourceEvent) => {
  const src = e.inputSource;                 // src.targetRayMode: "gaze" | "tracked-pointer" | "screen" | "transient-pointer"
  const pose = e.frame.getPose(src.targetRaySpace, refSpace);
  if (pose) pick(pose.transform);            // 광선 기준 선택
});
```

## 언제 쓰나

- 도구가 없는 대중 앱, 키오스크, 가벼운 AR: 핸드 트래킹.
- 정밀 조작·게임·장시간: 컨트롤러.
- 포비티드 렌더링([연결 노트](graphics-xr/foveated-stereo-rendering)), 접근성, 시선 기반 분석: 아이 트래킹(권한·동의 필수).

## 주의

- **타깃 크기**: 손·시선은 포인터보다 부정확하다. 버튼을 충분히 크고 멀리 간격 두고, 호버 피드백을 준다.
- **Midas touch**: 시선만으로 선택하면 보는 것마다 눌린다. 확정 동작을 분리한다.
- **피로**: 팔을 오래 들게 하지 않는다. 주요 UI 는 허리~가슴 높이, 팔을 내린 자세에서 쓰게.
- **프라이버시**: 시선·손 데이터는 의도·건강·신원 추정에 쓸 수 있는 생체 정보다. 필요한 최소만 요청하고, 저장·전송은 피한다. 플랫폼도 권한을 요구한다.
- **추적 실패 대비**: 손이 카메라 시야 밖이거나 가려지면 입력이 끊긴다. 컨트롤러 폴백, 명확한 상태 표시.
- 지연: 입력 → 시각 반응이 느리면 직접 조작 환상이 깨진다([지연 노트](graphics-xr/motion-to-photon-reprojection-frame-budget)).

## 개발자에게 왜 중요한가

입력 방식에 따라 UI 가이드가 다르다. "컨트롤러 기준으로 만든 앱을 손으로 쓰게 하면" 버튼이 너무 작고 확정 방법이 없어 쓸 수 없다. 의도 추상화를 처음부터 설계해야 기기 확장 비용이 낮다.

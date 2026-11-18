---
title: VR 멀미 원인과 UX 가이드
aka: [VR Sickness, Cybersickness, Simulator Sickness, Vection, Vergence-Accommodation Conflict, Teleport Locomotion, Vignette, Comfort]
category: graphics-xr
group: xr
level: intermediate
summary: VR 멀미는 눈이 보는 움직임과 몸이 느끼는 움직임이 어긋날 때 생긴다. 낮은 프레임레이트·지연·인공 이동·카메라 제어가 주 원인이므로 이동 방식, 프레임 안정성, 고정 시각 기준물로 설계 단계에서 줄인다.
tags: [vr, comfort, motion-sickness, ux, locomotion, latency]
related: [graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/foveated-stereo-rendering, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/hand-eye-tracking-interaction]
sources:
  - https://en.wikipedia.org/wiki/Virtual_reality_sickness
  - https://developers.meta.com/horizon/design/comfort
  - https://developer.oculus.com/blog/the-latent-power-of-prediction/
  - https://developers.meta.com/horizon/documentation/native/android/mobile-timewarp-overview
updatedAt: 2026-11-19
---

## 문제

같은 앱이 어떤 사용자에겐 문제없고 어떤 사용자에겐 몇 분 만에 메스꺼움·두통·식은땀을 만든다. 한 번 불쾌감을 겪으면 앱을 다시 안 쓴다. 멀미는 성능 버그이자 UX 버그이고, 사용자마다 민감도가 달라 평균으로 판단하면 놓친다.

## 원인

Wikipedia 의 VR sickness 항목은 주요 원인으로 낮은 프레임레이트, 입력 지연, 수렴-조절 불일치(vergence-accommodation conflict)를 든다. 또 실제 움직임 없이 시각만으로 자기 이동을 느끼는(vection) 것으로도 생긴다고 설명한다. 일반적으로 설명되는 감각 충돌 가설을 기준으로 정리하면:

| 원인 | 메커니즘 | 앱에서 통제 가능? |
| --- | --- | --- |
| 지연·저프레임 | 머리 움직임과 화면 반응이 어긋남 | 예(예산·재투영) |
| 인공 이동(조이스틱) | 시각은 움직이는데 전정감각은 정지 | 예(이동 방식 선택) |
| 가속·회전 | 가속하는 시각 흐름이 강한 vection 유발 | 예 |
| 카메라 제어 | 앱이 머리 방향·높이를 강제로 바꿈 | 예(금지) |
| 수렴-조절 충돌 | 눈은 가까이/멀리 맞추는데 초점면은 고정 | 부분적(너무 가까운 물체 피하기) |
| 시야각·장면 흐름 | 넓은 시야에서 주변 흐름이 클수록 강함 | 예 |
| 장비 부적합 | IPD 불일치, 착용 불량 | 안내 |

## 해법: 설계 가이드

### 1. 기술 기반

- 주사율 유지, 프레임 스파이크 제거. 평균이 아니라 최악 프레임이 중요([프레임 예산](graphics-xr/motion-to-photon-reprojection-frame-budget)).
- 포즈 예측과 재투영 활용. 머리 회전은 100% 1:1 로 반영.
- **절대 카메라를 앱이 흔들거나 회전시키지 않는다**(화면 흔들림 연출 금지, 카메라 효과는 최소).

### 2. 이동 방식

| 방식 | 멀미 | 몰입 | 비고 |
| --- | --- | --- | --- |
| 실제 걷기(룸 스케일) | 최소 | 높음 | 공간 필요 |
| 순간이동(teleport) | 낮음 | 중간 | 보편적 기본값 |
| 대시/블링크 이동 | 낮음~중간 | 중간 | 짧은 암전 이용 |
| 부드러운 이동(스무스) | 높음 | 높음 | **옵션**으로만 |
| 스냅 회전(30°/45°) | 낮음 | 중간 | 부드러운 회전보다 안전 |
| 부드러운 회전 | 높음 | 높음 | 옵션 |

### 3. 시각 보조

- 이동·회전 중 **비네트**(주변시 어둡게)로 시야 흐름 감소.
- **고정 기준물**: 코(nose)나 조종석, 바닥 격자처럼 머리와 함께 움직이는 안정적 프레임을 둔다.
- 지평선·정적 환경 요소를 유지.
- 지나치게 가까운 물체(수 cm)는 수렴-조절 피로 때문에 피하고, Meta 의 컴포트 문서도 콘텐츠를 적절한 거리에 두고 사용자가 머리·몸을 조금만 움직여 볼 수 있게 권장한다.
- UI 를 머리에 **고정(head-locked)** 하면 불편하다. Meta 문서는 카메라에 정적으로 붙여 시야를 가리는 것을 피하고, 콘텐츠가 자유롭게 움직이게 하라고 안내한다. 월드 고정이나 부드럽게 따라오는(lazy follow) UI 를 쓴다.

```ts
// 이동 옵션 예시: 기본 안전값 + 사용자 설정
interface ComfortSettings {
  locomotion: "teleport" | "smooth";
  turn: "snap" | "smooth";
  snapAngleDeg: 30 | 45;
  vignetteOnMove: boolean;
}
const defaults: ComfortSettings = { locomotion: "teleport", turn: "snap", snapAngleDeg: 30, vignetteOnMove: true };
```

### 4. 온보딩과 세션

- 첫 세션은 짧게, 앉은 자세 옵션, 휴식 안내.
- 불쾌감 즉시 중단 방법(항상 보이는 메뉴/버튼).
- 설정에서 이동·회전·비네트 강도를 사용자에게 제공(접근성).

## 언제 쓰나

- 이동이 있는 모든 VR 앱의 기획 단계에서. 특히 1인칭 어드벤처, 차량·비행 시뮬레이션.
- AR/패스스루 앱도 같은 원칙이 일부 적용된다(월드 고정 콘텐츠, 지연 최소화).

## 주의

- **"견딜 만하다" 를 개발자 기준으로 판단하지 않는다.** 개발자는 몰입 경험이 쌓여 둔감해진 집단이다. 외부 테스터로 확인한다.
- 멀미는 기기 성능 문제만이 아니다. 최고 사양에서도 스무스 이동·회전이 불쾌할 수 있다.
- 시야 제한(비네트)은 몰입을 줄인다. 강제 대신 옵션으로.
- 이 노트의 인과 설명은 공개된 문서·개요 수준이며 의학적 조언이 아니다. 개인차·건강 문제 경고 문구는 플랫폼 정책을 따른다.

## 개발자에게 왜 중요한가

멀미는 QA 에서 놓치기 쉽고 리뷰 점수에 직접 영향을 준다. 프레임 안정성, 이동 방식, 카메라 제어 금지는 **코드로 막을 수 있는** 항목이므로, 설계 체크리스트와 자동 프레임 스파이크 테스트로 관리한다.

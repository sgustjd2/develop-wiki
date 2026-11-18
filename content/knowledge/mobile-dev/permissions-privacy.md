---
title: 권한 모델과 프라이버시 (ATT·Privacy Manifest·Android 권한)
aka: [Runtime Permissions, App Tracking Transparency, ATT, Privacy Manifest, Data Safety]
category: mobile-dev
group: platform
level: intermediate
summary: 민감한 자원은 사용자가 맥락 속에서 허용해야 쓸 수 있다. Android 런타임 권한, iOS 의 ATT 와 Privacy Manifest 가 요구하는 설계 원칙과 선언.
tags: [mobile, android, ios, permissions, privacy, att, privacy-manifest]
related: [mobile-dev/store-review-policy, mobile-dev/push-notification-architecture, mobile-dev/background-work-constraints, security/owasp-top-10, security/secrets-management]
sources:
  - https://developer.android.com/training/permissions/requesting
  - https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
  - https://developer.apple.com/documentation/apptrackingtransparency
  - https://developer.apple.com/app-store/review/guidelines/
updatedAt: 2026-11-18
---

## 문제

- 앱이 시작하자마자 권한을 줄줄이 요구하면 사용자는 거부하고, 한 번 거부된 권한은 다시 묻기 어렵다.
- 권한을 거부당하면 기능 전체를 막는 앱은 이탈과 낮은 평점으로 이어진다.
- 서드파티 SDK 가 수집하는 데이터까지 앱의 책임이다. 선언과 실제 수집이 다르면 심사에서 반려된다.

## 해법

### Android 런타임 권한 (공식 가이드 원칙)

1. **맥락 속에서 요청**: 기능을 쓰려는 순간에 요청한다. 시작 시 일괄 요청 금지.
2. **사용자를 막지 않는다**: 이유 설명 화면(rationale)에도 취소 수단을 둔다.
3. **거부해도 쓸 수 있게 점진적으로 기능을 낮춘다**(graceful degradation). 무엇이 막혔는지 구체적으로 알린다.
4. 매번 접근 전에 권한을 **다시 확인**한다. 권한은 사용자가 설정에서 언제든 바꾸고, 시스템이 자동으로 거부·재설정할 수도 있다.
5. 사용자의 결정을 존중한다. 설정으로 보내 설득하려는 반복 요청은 비권장.

```kotlin
val launcher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
    if (granted) startCamera() else showCameraOffNotice()   // 거부해도 앱은 계속 쓸 수 있게
}
fun onScanClicked() = when {
    hasPermission(CAMERA) -> startCamera()
    shouldShowRequestPermissionRationale(CAMERA) -> showWhyCameraDialog { launcher.launch(CAMERA) }
    else -> launcher.launch(CAMERA)
}
```

- 사용자가 같은 권한을 **두 번 거부**하면 시스템 대화상자가 더 이상 뜨지 않는다(영구 거부로 취급). 그래서 맥락 없는 요청으로 기회를 낭비하면 안 된다.
- Android 11+ 위치·마이크·카메라는 **"이번만"** 일회성 허용이 있다. 몇 달 쓰지 않은 앱의 권한은 자동 초기화될 수 있다(Android 11+ 대상 앱).
- 백그라운드 위치는 별도 권한이 필요하고 Google Play 정책이 핵심 기능일 때로 제한한다. 쓰지 않는 권한은 `revokeSelfPermissionOnKill` 로 반납할 수 있다(Android 13+).

### iOS: 사용 목적 문구, ATT, Privacy Manifest

- 카메라·위치·사진 등은 Info.plist 의 **사용 목적 문구**(`NS...UsageDescription`)가 필수이고, 시스템 대화상자에 그대로 보인다. 문구가 불명확하면 심사에서 문제가 된다.
- **ATT(App Tracking Transparency)**: 다른 회사의 앱·웹과 연결해 사용자를 추적(광고 식별자 IDFA 사용 등)하려면 권한을 받아야 한다. `NSUserTrackingUsageDescription` 문구가 필요하고 허용 상태에 따라 IDFA 접근이 결정된다. 추적하지 않는 앱은 요청 자체가 필요 없다.
- **Privacy Manifest**(`PrivacyInfo.xcprivacy`): 앱과 각 SDK 가 선언한다. (1) 추적 여부와 추적 도메인, (2) 수집하는 데이터 유형, (3) **필수 사유 API**(UserDefaults, 파일 타임스탬프, 시스템 부팅 시간, 디스크 공간, 활성 키보드 등)의 사용 사유 코드. Xcode 가 SDK 매니페스트를 합쳐 프라이버시 리포트를 만든다. 사유 코드의 정확한 목록은 Apple 문서에서 확인한다.

| 플랫폼 | 선언·고지 | 사용자에게 묻는 방식 |
| --- | --- | --- |
| Android | manifest 권한 선언 + Play 콘솔 Data safety 양식 | 런타임 대화상자(맥락 요청) |
| iOS | Info.plist 목적 문구 + Privacy Manifest + App Store 개인정보 항목(Privacy Nutrition Label) | 시스템 대화상자, ATT 대화상자 |

## 언제 쓰나

- 새 기능이 민감 자원을 건드릴 때마다: 필요한가, 더 약한 대안이 있는가(사진 선택기·시스템 피커·대략적 위치)부터 따진다. 피커를 쓰면 권한 자체가 필요 없는 경우가 많다.
- SDK 를 추가하거나 버전을 올릴 때: 그 SDK 가 수집·사용하는 데이터와 매니페스트를 확인한다.

## 주의

- 권한 요청 전 "사전 안내 화면"은 이유 설명용이어야지 시스템 대화상자를 흉내 내거나 허용을 강요하면 안 된다.
- 최소 수집 원칙: 필요 없는 권한을 선언하면 심사·사용자 신뢰 모두에서 손해다. 정밀 위치가 필요 없으면 대략적 위치만 요청한다.
- 거부 상태를 모든 진입점에서 처리해야 한다. 한 군데만 처리하면 다른 경로에서 크래시가 난다.
- ATT 를 거부당해도 앱 기능을 막으면 안 된다(심사 지침). 계정 삭제 기능, 개인정보 처리방침 같은 요구는 [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/)에서 다룬다.
- 이 노트의 Apple 쪽 세부(사유 코드 목록, 현재 심사 기준)는 자주 바뀐다. 제출 전 공식 문서로 재확인한다.

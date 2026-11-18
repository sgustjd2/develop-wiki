---
name: Android Core App Quality Guidelines
url: https://developer.android.com/docs/quality-guidelines/core-app-quality
docs: https://developer.android.com/docs/quality-guidelines/core-app-quality
domain: mobile
category: learning
description: Android 앱이 갖춰야 할 최소 품질 기준을 UX·기능·성능·안정성·개인정보·보안·Google Play 항목별 체크리스트와 테스트 절차로 정리한 공식 가이드. 출시 전 자체 점검에 쓴다.
pricing: free
tags: [quality, checklist, android, accessibility, release]
languages: []
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Core App Quality는 "모든 앱이 충족해야 할 최소 품질"을 정의한 Android 공식 체크리스트다. 항목마다 ID(예: `Back_Button_Nav`, `Touch_Target_Size`)와 연결된 **테스트 절차(T-…)** 가 있어, 수동 점검이나 QA 시나리오로 그대로 쓸 수 있다. 태블릿·폴더블·데스크톱·TV·XR 등 폼팩터를 다루는 **Adaptive App Quality** 가이드를 함께 적용하도록 안내한다.

- Google Play 정책은 별도 문서다([Google Play 정책](/develop-wiki/mobile/learning/google-play-developer-policy/)). 이 체크리스트는 정책 준수가 아니라 품질 기준이며, 앱이 Play 노출·랭킹과 연관된다고 공식 문서가 설명한다.
- iOS 대응은 [Apple Human Interface Guidelines](/develop-wiki/mobile/learning/apple-human-interface-guidelines/)와 [App Store 심사 가이드라인](/develop-wiki/mobile/learning/app-store-review-guidelines/).

## 설치
설치할 것은 없다. 점검은 실기기·에뮬레이터에서 하고, 가이드가 권하는 `StrictMode`를 디버그 빌드에서 켜 두면 메인 스레드 디스크·네트워크 접근 같은 문제를 일찍 발견한다.

```kotlin
if (BuildConfig.DEBUG) {
    StrictMode.setThreadPolicy(
        StrictMode.ThreadPolicy.Builder().detectAll().penaltyLog().build()
    )
}
```
메모리 누수는 [LeakCanary](/develop-wiki/mobile/android/leakcanary/), 시작 시간은 [Baseline Profiles & Macrobenchmark](/develop-wiki/mobile/android/baseline-profiles/)로 보완한다.

## 핵심 개념
| 영역 | 점검 내용(공식 목차 기준) |
| --- | --- |
| 사용자 경험 | 사용성(일관된 UX, 앱 전환·절전 복귀), UI(방향·폴드 상태), 시각 품질(그래픽, 줄 길이, 라이트/다크 테마), 탐색(뒤로 가기·제스처, 상태 보존), 알림, 접근성 |
| 기능 | 오디오(포커스·백그라운드 재생), 비디오, 공유, 백그라운드 서비스 |
| 성능·안정성 | 성능, 안정성, SDK, 배터리 |
| 개인정보·보안 | 권한, 데이터·파일, 백업·복원, 신원, 앱 컴포넌트, 네트워킹, WebView, 실행, 암호화 |
| Google Play | 정책, 앱 상세 페이지, 사용자 지원 |
| 테스트 ID | 각 항목에 대응하는 `T-…` 절차 |

## 대표 점검 항목
- **탐색·상태**: 뒤로 가기 버튼과 제스처가 표준대로 동작하고(`Back_Button_Nav`, `Back_Gesture_Nav`), 화면 회전·절전 복귀 뒤 상태가 보존된다(`State_Preservation`).
- **방향·폴드**: 가로/세로, 접힘 상태에서 같은 기능이 제공되고 화면이 앱 창을 채운다(`Display_State_Parity`, `Fullscreen_Display`).
- **시각**: 텍스트·이미지가 왜곡되지 않고, 한 줄 길이는 대략 45~75자로 제한하며, 라이트·다크 테마를 모두 지원한다(`Graphic_Quality`, `Line_Length`, `Theme_Support`). 테마는 [Material Design 3](/develop-wiki/mobile/learning/material-design-3/) 컴포넌트를 쓰면 일관되게 맞추기 쉽다.
- **접근성**: 터치 대상은 **48dp 이상**(`Touch_Target_Size`), 텍스트 대비 비율을 지키고(`Visual_Contrast`), UI 요소에 설명을 제공한다(`Content_Description`).
- **알림**: 알림 품질 규칙을 지키고, 메시징 앱은 `MessagingStyle` 등을 사용한다([FCM](/develop-wiki/mobile/mobile-backend/firebase-cloud-messaging/)).
- **오디오**: 재생 시작 방식, 오디오 포커스 요청·변경 처리, 백그라운드 재생과 알림 스타일을 따른다.
- **개인정보·보안**: 필요한 권한만 요청하고 네트워크·WebView·암호화 규칙을 지킨다.

## 자주 쓰는 패턴
- **릴리스 게이트**: 체크리스트를 QA 시나리오와 CI 계측 테스트로 옮긴다([Espresso](/develop-wiki/mobile/mobile-testing/espresso/), [Robolectric](/develop-wiki/mobile/mobile-testing/robolectric/)).
- **접근성 자동 검사**: Compose·Espresso의 접근성 검사로 터치 대상 크기, 대비, 설명 누락을 자동화한다([Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)).
- **폼팩터 점검**: 리사이즈 가능한 에뮬레이터로 분할 화면·폴드·태블릿에서 레이아웃을 확인한다([Android Studio](/develop-wiki/mobile/android/android-studio/)).
- **크래시·ANR 모니터링**: 출시 후에는 Play Console의 Android vitals와 Crashlytics로 안정성을 추적한다([Firebase Crashlytics](/develop-wiki/mobile/mobile-backend/firebase-crashlytics/)).

## 언제 쓰나 / 피할 때
- 쓸 때: 첫 출시 전 자체 점검, QA 시나리오 작성, 품질 지표(vitals) 개선 목표 설정.
- 피할 때: 이 문서를 정책 준수 증빙으로 쓰지 않는다. 공식 설명대로 "최소 품질"이므로 차별화된 UX는 [Android Developers 가이드](/develop-wiki/mobile/learning/android-developers-guides/)의 심화 문서를 따른다.

## 공식 문서
- [Core app quality](https://developer.android.com/docs/quality-guidelines/core-app-quality) · [한국어](https://developer.android.com/docs/quality-guidelines/core-app-quality?hl=ko) · [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality) · [품질 가이드 홈](https://developer.android.com/quality)

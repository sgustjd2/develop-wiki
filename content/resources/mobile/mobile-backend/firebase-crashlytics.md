---
name: Firebase Crashlytics
url: https://firebase.google.com/products/crashlytics
docs: https://firebase.google.com/docs/crashlytics
repo: https://github.com/firebase/firebase-ios-sdk
domain: mobile
category: mobile-backend
description: Firebase의 무료 모바일 크래시 리포팅 서비스. 앱 비정상 종료·ANR·비치명 오류를 수집해 심볼화된 스택 트레이스와 영향 사용자 수로 묶어 보여 준다.
pricing: free
tags: [crash-reporting, stability, firebase, monitoring]
languages: [kotlin, swift, dart]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Crashlytics는 앱에서 발생한 크래시를 기기에서 기록했다가 다음 실행 때 업로드하고, 같은 원인끼리 **이슈**로 묶어 우선순위를 보여 주는 서비스다. 난독화·네이티브 빌드의 스택 트레이스는 업로드된 매핑 파일(R8 mapping)·dSYM으로 사람이 읽을 수 있게 복원한다. Google Analytics와 연결하면 크래시 직전 이벤트(breadcrumb)와 "크래시 없는 사용자 비율"을 볼 수 있다.

- 버전(2026-11-18 확인): Android BoM **35.2.0**(`firebase-crashlytics` 21.1.0), Crashlytics Gradle 플러그인 **3.0.8**, Apple SDK **13.2.0**. 서비스 무료.

## 설치
```kotlin
// 루트 build.gradle.kts
plugins {
    id("com.google.gms.google-services") version "4.6.0" apply false
    id("com.google.firebase.crashlytics") version "3.0.8" apply false
}
// app/build.gradle.kts
plugins {
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
}
dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-crashlytics")
    implementation("com.google.firebase:firebase-analytics")
}
```

iOS: SPM으로 `FirebaseCrashlytics` 추가 → `FirebaseApp.configure()` → Build Phases에 dSYM 업로드용 Run Script(`"${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/run"`)를 추가하고 Debug Information Format을 *DWARF with dSYM File*로 설정한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Issue | 같은 원인(스택 프레임)으로 묶인 크래시 그룹 |
| Fatal / Non-fatal | 앱 종료 크래시 / `recordException`으로 남긴 처리된 오류 |
| ANR | Android 앱 응답 없음 이벤트 수집 |
| Custom key | 크래시 시점 상태(`screen`, `plan`)를 키-값으로 첨부 |
| Log | 크래시 직전 맥락 메시지(`log`) |
| User ID | 특정 사용자 문제 추적용 식별자(개인정보는 넣지 않음) |
| Velocity alert | 짧은 시간에 급증하는 이슈 알림 |
| Mapping / dSYM | 난독화·심볼 복원 파일. 빌드 시 플러그인·스크립트가 업로드 |

## 기본 사용법
```kotlin
import com.google.firebase.Firebase
import com.google.firebase.crashlytics.crashlytics

fun onCheckout(userId: String, cartSize: Int) {
    Firebase.crashlytics.setUserId(userId)
    Firebase.crashlytics.setCustomKey("cart_size", cartSize)
    Firebase.crashlytics.log("checkout started")
    try {
        PaymentClient.pay()
    } catch (e: IOException) {
        Firebase.crashlytics.recordException(e)   // 비치명 오류로 기록
    }
}
```

```swift
import FirebaseCrashlytics

Crashlytics.crashlytics().setCustomValue("onboarding", forKey: "screen")
Crashlytics.crashlytics().record(error: error)
```

설정 확인은 테스트 버튼에서 `throw RuntimeException("Test Crash")`로 강제 종료한 뒤 앱을 다시 실행하면 콘솔에 나타난다.

## 자주 쓰는 패턴
- **수집 동의.** 사용자 동의 전에는 `setCrashlyticsCollectionEnabled(false)`로 끄고, 동의 후 켠다(매니페스트/Info.plist 플래그로 기본값 지정 가능).
- **디버그 빌드 분리.** 디버그에서는 수집을 끄거나 별도 Firebase 프로젝트를 써서 실사용 지표를 오염시키지 않는다.
- **CI에서 심볼 업로드 확인.** R8 mapping·dSYM 업로드가 빠지면 스택 트레이스가 난독화된 채로 남는다.
- **릴리스 모니터링.** 단계적 출시(Play staged rollout, App Store phased release) 중 크래시 없는 사용자 비율을 기준으로 확대 여부를 정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 무료로 바로 쓸 수 있는 모바일 크래시 수집, 이미 Firebase(FCM·Remote Config)를 쓰는 앱.
- 피할 때(대안): 성능 트레이싱·세션 리플레이·백엔드 오류와의 연결까지 한 도구로 보려면 [Sentry](/develop-wiki/backend/observability/sentry/)(모바일 SDK 제공). 데이터 보관 위치·자체 호스팅이 필요하면 Sentry 자체 호스팅.

## 공식 문서
- [Crashlytics 문서](https://firebase.google.com/docs/crashlytics) · [Android 시작하기](https://firebase.google.com/docs/crashlytics/android/get-started) · [Apple 시작하기](https://firebase.google.com/docs/crashlytics/ios/get-started)
- [보고서 맞춤설정](https://firebase.google.com/docs/crashlytics/android/customize-crash-reports)

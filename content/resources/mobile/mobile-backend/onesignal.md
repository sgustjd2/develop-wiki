---
name: OneSignal
url: https://onesignal.com
docs: https://documentation.onesignal.com/docs
repo: https://github.com/OneSignal/OneSignal-Android-SDK
stars: 631
domain: mobile
category: mobile-backend
description: 모바일·웹 푸시, 인앱 메시지, 이메일, SMS를 한 대시보드와 API로 보내는 고객 메시징 서비스. 세그먼트·자동화·A/B 테스트가 필요한 푸시 운영에 쓴다.
pricing: freemium
tags: [push, in-app-message, messaging, segmentation]
languages: [kotlin, swift, typescript, dart]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OneSignal은 푸시 전달 자체는 FCM·APNs를 사용하면서, 그 위에 **사용자·구독 관리, 세그먼트, 예약·자동화(Journeys), 인앱 메시지, 분석**을 얹은 메시징 플랫폼이다. 개발자는 SDK를 넣고 사용자에게 External ID를 붙이기만 하면, 이후 캠페인은 마케팅·운영 담당이 대시보드에서 다룰 수 있다.

- SDK 버전(2026-11-18 확인): Android **5.11.0**, iOS **5.8.1**, React Native `react-native-onesignal` 5.5.17. v5 SDK는 사용자 중심(User Model) API다. SDK 라이선스는 수정 MIT(Modified MIT).
- 무료 플랜이 있고 사용량·기능에 따라 유료 플랜으로 올라간다.

## 설치
Android(`app/build.gradle.kts`):

```kotlin
dependencies {
    implementation("com.onesignal:OneSignal:[5.6.1, 5.99.99]")
}
```

공식 문서가 버전 범위 표기를 쓴다. 재현 가능한 빌드를 원하면 `5.11.0`처럼 고정한다. iOS는 SPM(`OneSignal-XCFramework`)이나 CocoaPods, Flutter·React Native·Unity용 SDK도 있다. FCM 서비스 계정·APNs 키는 OneSignal 대시보드 앱 설정에 등록한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| App ID | OneSignal 앱 식별자. SDK 초기화에 사용 |
| User | 한 사람. 여러 기기·채널 구독을 가질 수 있음 |
| External ID | 내 서비스의 사용자 ID. `login()`으로 연결해 기기 간 사용자 통합 |
| Subscription | 푸시·이메일·SMS 같은 채널별 수신 주소 |
| Tag | 사용자 속성 키-값. 세그먼트 조건에 사용 |
| Segment | 태그·활동·위치 조건으로 만든 대상 그룹 |
| In-App Message | 앱 실행 중 표시하는 메시지. 트리거 조건으로 노출 |
| Journeys | 이벤트 기반 자동 메시지 흐름 |

## 기본 사용법
```kotlin
import android.app.Application
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        OneSignal.Debug.logLevel = LogLevel.WARN
        OneSignal.initWithContext(this, "YOUR_ONESIGNAL_APP_ID")
        CoroutineScope(Dispatchers.IO).launch {
            OneSignal.Notifications.requestPermission(false)
        }
    }
}

// 로그인 직후
fun onSignedIn(userId: String) {
    OneSignal.login(userId)
    OneSignal.User.addTag("plan", "pro")
}
```

`Application` 클래스는 `AndroidManifest.xml`의 `<application android:name=".App">`으로 등록한다.

## 자주 쓰는 패턴
- **로그인·로그아웃 동기화.** 로그인 시 `login(externalId)`, 로그아웃 시 `logout()`으로 기기 구독과 사용자 연결을 맞춘다.
- **권한 요청 시점.** 첫 실행 즉시 요청하기보다 가치 설명 화면 뒤나 인앱 메시지 프롬프트로 요청해 허용률을 높인다.
- **트랜잭션 알림은 REST API.** 주문·결제 알림은 서버에서 External ID를 대상으로 API 호출, 마케팅 알림은 대시보드 세그먼트로 나눈다.
- **딥링크.** 알림 클릭 리스너(`OneSignal.Notifications.addClickListener`)에서 `additionalData`를 읽어 화면을 연다.

## 언제 쓰나 / 피할 때
- 쓸 때: 비개발 직군이 푸시 캠페인을 직접 운영해야 할 때, 푸시·인앱·이메일·SMS를 한 사용자 모델로 묶을 때.
- 피할 때(대안): 단순 트랜잭션 푸시만 필요하고 외부 서비스에 사용자 데이터를 보내기 어렵다면 [Firebase Cloud Messaging](/develop-wiki/mobile/mobile-backend/firebase-cloud-messaging/)을 직접 쓴다.

## 공식 문서
- [문서 홈](https://documentation.onesignal.com/docs) · [Android SDK 설정](https://documentation.onesignal.com/docs/android-sdk-setup)
- [Android SDK 릴리스](https://github.com/OneSignal/OneSignal-Android-SDK/releases) · [iOS SDK 릴리스](https://github.com/OneSignal/OneSignal-iOS-SDK/releases)

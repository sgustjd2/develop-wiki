---
name: Firebase Cloud Messaging
url: https://firebase.google.com/products/cloud-messaging
docs: https://firebase.google.com/docs/cloud-messaging
repo: https://github.com/firebase/firebase-android-sdk
stars: 2580
domain: mobile
category: mobile-backend
description: Google의 무료 푸시 메시지 전송 서비스. Android·iOS(APNs 경유)·웹 기기 토큰으로 알림·데이터 메시지를 보내며, 모바일 앱 푸시 알림의 기본 인프라로 쓴다.
pricing: free
tags: [push, notification, firebase, apns]
languages: [kotlin, swift, dart]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Firebase Cloud Messaging(FCM)은 서버에서 기기로 메시지를 전달하는 크로스플랫폼 푸시 서비스다. 앱은 SDK로 **등록 토큰**을 받아 서버에 저장하고, 서버는 FCM **HTTP v1 API**(OAuth 2.0 서비스 계정 인증)나 Firebase Admin SDK로 토큰·토픽·조건 대상에 메시지를 보낸다. iOS 기기에는 FCM이 APNs를 거쳐 전달한다. 예전 레거시 HTTP/XMPP API는 종료됐다.

- SDK 버전(2026-11-18 확인): Android **Firebase BoM 35.2.0**, Apple **firebase-ios-sdk 13.2.0**. SDK는 Apache-2.0, 서비스는 무료.
- Firebase 문서는 한국어 번역을 제공한다.

## 설치
Firebase 콘솔에서 앱을 등록하고 `google-services.json`(Android) / `GoogleService-Info.plist`(iOS)를 프로젝트에 넣는다.

```kotlin
// 루트 build.gradle.kts
plugins { id("com.google.gms.google-services") version "4.6.0" apply false }

// app/build.gradle.kts
plugins { id("com.google.gms.google-services") }
dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-messaging")
}
```

iOS는 Xcode에서 `https://github.com/firebase/firebase-ios-sdk`를 SPM으로 추가하고 `FirebaseMessaging`을 선택한 뒤, Push Notifications 권한을 켜고 APNs 인증 키(.p8)를 콘솔에 업로드한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Registration token | 앱 설치 인스턴스별 주소. 재설치·데이터 삭제 시 바뀌므로 `onNewToken`으로 갱신 |
| Notification message | `notification` 필드. 앱이 백그라운드면 시스템이 자동 표시 |
| Data message | `data` 키-값만. 앱 코드가 받아 처리 |
| Topic | 기기가 구독하는 이름 기반 그룹(`/topics/news`) |
| Condition | 토픽 조합 대상 (`'a' in topics && 'b' in topics`) |
| HTTP v1 API | `POST https://fcm.googleapis.com/v1/projects/<project-id>/messages:send` |
| Platform override | `android`, `apns`, `webpush` 블록으로 플랫폼별 옵션(우선순위, 사운드, 배지) |
| 우선순위 | Android `high`는 Doze 상태에서도 즉시 전달. 남용 시 우선순위가 낮춰질 수 있음 |

## 기본 사용법
Android 수신 서비스(Manifest에 `com.google.firebase.MESSAGING_EVENT` 인텐트 필터로 등록).

```kotlin
class PushService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // 서버에 토큰 저장 (사용자 ID와 연결)
        TokenUploader.upload(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: return
        NotificationHelper.show(this, title, message.data["body"].orEmpty())
    }
}
```

서버에서 보내는 요청 본문(HTTP v1).

```json
{
  "message": {
    "token": "<기기 토큰>",
    "notification": { "title": "주문 완료", "body": "배송이 시작됐습니다" },
    "data": { "orderId": "1042" },
    "android": { "priority": "high" },
    "apns": { "payload": { "aps": { "sound": "default" } } }
  }
}
```

## 자주 쓰는 패턴
- **권한 요청.** Android 13+는 `POST_NOTIFICATIONS` 런타임 권한, iOS는 `UNUserNotificationCenter.requestAuthorization`이 먼저 필요하다.
- **서버는 Admin SDK.** Node.js·Java·Python·Go Admin SDK가 인증 토큰 발급과 일괄 전송(`sendEach`)을 처리한다.
- **무효 토큰 정리.** 전송 응답의 `UNREGISTERED` 오류 토큰은 DB에서 지운다.
- **딥링크.** `data`에 화면 경로를 넣고 알림 탭 인텐트/`userNotificationCenter(_:didReceive:)`에서 라우팅한다.
- **크로스플랫폼.** Flutter는 `firebase_messaging`, React Native는 `@react-native-firebase/messaging`(커뮤니티, 27.x), Capacitor는 `@capacitor/push-notifications`.

## 언제 쓰나 / 피할 때
- 쓸 때: Android 푸시는 사실상 FCM이 표준 경로다. iOS·웹까지 한 API로 보내고 싶을 때.
- 피할 때(대안): 세그먼트·캠페인·A/B 테스트·이메일·SMS까지 마케팅 도구가 필요하면 [OneSignal](/develop-wiki/mobile/mobile-backend/onesignal/) 같은 서비스(내부적으로 FCM/APNs 사용). iOS만 대상이면 APNs 직접 호출도 가능.

## 공식 문서
- [FCM 문서](https://firebase.google.com/docs/cloud-messaging) · [HTTP v1 API 레퍼런스](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
- [Android 클라이언트 설정](https://firebase.google.com/docs/cloud-messaging/android/client) · [Apple 클라이언트 설정](https://firebase.google.com/docs/cloud-messaging/ios/client)

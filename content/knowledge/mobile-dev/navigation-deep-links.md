---
title: 화면 이동(네비게이션) 패턴과 딥링크 설계
aka: [Navigation, Back Stack, Deep Link, App Links, Universal Links, Deferred Deep Link]
category: mobile-dev
group: architecture
level: intermediate
summary: 화면 스택과 목적지를 상태로 모델링해 이동을 관리하고, 외부 URL 이 앱의 특정 화면으로 안전하게 들어오도록 링크를 설계하는 방법.
tags: [mobile, android, ios, navigation, deep-link, app-links, universal-links]
related: [mobile-dev/mvvm-mvi-udf, mobile-dev/app-lifecycle-process-death, mobile-dev/push-notification-architecture, mobile-dev/permissions-privacy, security/oauth2-oidc-pkce]
sources:
  - https://developer.android.com/training/app-links
  - https://developer.android.com/guide/components/activities/activity-lifecycle
  - https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
updatedAt: 2026-11-18
---

## 문제

- 화면마다 Activity/ViewController 를 직접 띄우면 이동 규칙이 코드 여기저기에 흩어지고, 뒤로 가기·상태 복원이 제각각이 된다.
- 푸시 알림, 이메일 링크, 웹의 "앱에서 열기"로 앱 중간 화면에 바로 진입해야 한다. 이때 로그인 여부, 화면 사이의 선행 조건, 앱이 종료된 상태를 모두 고려해야 한다.
- 링크는 외부에서 오는 **신뢰할 수 없는 입력**이다.

## 해법

### 이동을 상태로 다루기

- 현대 Android 가이드는 **단일 Activity + 화면 교체** 구조를 권장한다. Activity 하나가 컨테이너이고 목적지(Compose destination)를 갈아 끼운다.
- iOS 도 SwiftUI 의 `NavigationStack(path:)` 처럼 경로(path)를 데이터로 들고 있게 하면 "현재 스택"이 곧 상태가 되어 복원·테스트가 쉽다.
- 목적지는 **타입이 있는 라우트**(sealed class, enum)로 정의하고 인자는 최소한(ID)만 싣는다. 객체 전체를 넘기지 말고 ID 로 다시 조회한다(프로세스 종료 후 복원 가능).
- 화면 이동 결정은 UI 로직 쪽(내비게이션 상태 홀더)에 두고, 화면 상태 홀더는 "이동하라는 이벤트"만 올린다. [MVVM·UDF](/develop-wiki/knowledge/mobile-dev/mvvm-mvi-udf/) 참고.

```kotlin
sealed interface Route {
    data object Home : Route
    data class Product(val id: String) : Route          // 인자는 ID 만
    data class Checkout(val cartId: String) : Route
}
// 딥링크 -> Route 변환은 한 곳(파서)에서만
fun parse(uri: Uri): List<Route>? = when {
    uri.pathSegments.firstOrNull() == "p" && uri.pathSegments.size == 2 ->
        listOf(Route.Home, Route.Product(uri.pathSegments[1]))   // 뒤로 가면 Home
    else -> null                                                   // 알 수 없는 링크는 무시/홈
}
```

### 딥링크 종류

| 종류 | Android | iOS | 특징 |
| --- | --- | --- | --- |
| 커스텀 스킴 | `myapp://...` intent filter | URL scheme | 설치 안 됐을 때 대비 불가, 다른 앱이 같은 스킴을 선점할 수 있음 |
| 검증된 웹 링크 | **Android App Links**(`assetlinks.json` 검증) | **Universal Links**(`apple-app-site-association`) | https 링크가 도메인 소유 검증 후 앱으로 바로 열림. 미설치 시 웹으로 폴백 |

Android 공식 문서 기준으로 일반 딥링크는 선택 다이얼로그(disambiguation)를 거칠 수 있고, 검증된 App Links 는 그 다이얼로그 없이 앱이 바로 열린다. 가능하면 자기 도메인의 https 링크(App Links/Universal Links)를 기본으로 쓰고, 스킴은 앱 내부·레거시용으로 둔다.

### 설계 규칙

- 링크 하나 = 한 화면 + **그 화면에 오기 위한 백스택**을 같이 정의한다(위 코드의 `Home` → `Product`).
- 앱이 꺼져 있을 때(콜드 스타트)와 실행 중일 때 모두 같은 진입 경로를 타게 한다. 새 인텐트/`onOpenURL` 도착은 둘 다 발생한다.
- 로그인 필요 화면은 링크를 **보류 목적지**로 저장하고 로그인 후 이어서 이동한다.
- 설치 전 링크를 설치 후에도 이어 주는 디퍼드 딥링크는 OS 기능이 아니라 별도 서비스·스토어 레퍼러에 기대는 방식이라 정확도와 개인정보(추적) 이슈가 있다.

## 언제 쓰나

- 푸시·이메일·QR·공유 링크로 특정 콘텐츠에 진입시키는 모든 앱. 웹 사이트가 있으면 같은 URL 체계를 앱과 공유한다.

## 주의

- **링크 파라미터는 입력 검증 대상이다.** 링크의 값으로 인증 토큰을 받거나, 결제·삭제 같은 동작을 곧바로 실행하지 않는다. 화면을 열기만 하고 확인은 앱 안에서 받는다. 외부 앱이 같은 스킴으로 가로채거나 위조할 수 있다.
- OAuth 리다이렉트에 커스텀 스킴을 쓰면 가로채기 위험이 있으므로 PKCE 와 검증된 링크를 쓴다. [OAuth2·OIDC·PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/) 참고.
- 라우트 인자를 직렬화 가능한 최소 값으로 두지 않으면 프로세스 종료 후 복원이 깨진다.
- 링크 형식을 바꾸면 이미 발송된 푸시·메일의 링크가 깨진다. 이전 형식을 오래 지원하는 호환 계획이 필요하다.
- 탭 구조(하단 탭마다 독립 백스택)를 쓰면 딥링크가 어느 탭의 스택에 쌓일지 규칙을 정해야 한다.

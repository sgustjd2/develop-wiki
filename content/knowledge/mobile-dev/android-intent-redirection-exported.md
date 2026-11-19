---
title: Android intent 리다이렉션과 exported 컴포넌트
aka: [Intent Redirection, Nested Intent, android:exported, IntentSanitizer, Unsafe Intent Launch, PendingIntent]
category: mobile-dev
group: platform
level: advanced
summary: 외부가 통제하는 Intent 를 앱이 그대로 실행해 내부 컴포넌트를 열어 주는 취약점의 원리와, exported 최소화·중첩 Intent 검증·IntentSanitizer 로 막는 방법.
tags: [android, security, intent, exported, mobile, masvs-platform]
related: [mobile-dev/deep-link-security, mobile-dev/mobile-threat-model-masvs, mobile-dev/navigation-deep-links, principles/parse-dont-validate, security/access-control-design, security/owasp-top-10]
sources:
  - https://developer.android.com/privacy-and-security/risks/intent-redirection
  - https://developer.android.com/guide/topics/manifest/activity-element
updatedAt: 2026-11-19
---

딥링크 입력 검증은 [딥링크 보안](/develop-wiki/knowledge/mobile-dev/deep-link-security/)에 있다. 여기서는 **Intent 를 통한 내부 컴포넌트 노출**을 다룬다.

## 문제

- Android 컴포넌트는 `exported` 이면 다른 앱이 시작할 수 있다. 공식 문서에 따르면 `true` 인 Activity 는 어느 앱이든 클래스 이름으로 띄울 수 있다. 인텐트 필터가 없으면 기본값은 `false` 이고, **필터가 있는데도 다른 앱이 시작하게 하려면 명시적으로 `true`** 여야 한다.
- **Intent redirection**: 외부에서 받은 Intent 의 내용 일부 또는 전부를 공격자가 통제할 수 있는 상태에서, 앱이 그 Intent(보통 extras 에 담긴 중첩 Intent)로 새 컴포넌트를 시작하는 취약점이다. 영향으로 공식 문서는 앱 내부 기능 실행, 외부에 공개하지 않은 ContentProvider 같은 비공개 컴포넌트 접근을 든다.

공격자는 노출된 Activity 한 곳에 `extras["next"] = Intent(내부 비공개 화면)` 을 실어 보낸다. 앱은 자기 권한으로 그 Intent 를 시작해 주는 "대리인"이 된다.

## 해법

### 1. 노출 면을 줄인다

- `exported` 는 외부 진입이 필요한 컴포넌트만 `true`. 필터가 있는 컴포넌트마다 정말 외부에서 열려야 하는지 점검한다.
- 외부에 열린 컴포넌트는 입력을 신뢰하지 않는 경계로 취급한다. [Parse, don't validate](/develop-wiki/knowledge/principles/parse-dont-validate/).

### 2. 중첩 Intent 를 실행하지 않는다

가장 확실한 방법은 외부에서 Intent 를 받아 그대로 시작하는 기능을 없애는 것이다. 공식 문서도 중첩 Intent 리다이렉션 기능을 노출하지 말라고 한다. 대신 화면 ID 같은 **값**을 받아 앱이 허용 목록으로 Intent 를 직접 만든다.

```kotlin
// 나쁨: 받은 Intent 를 그대로 실행
startActivity(intent.getParcelableExtra<Intent>("next"))

// 좋음: 값만 받고 허용 목록에서 앱이 직접 만든다
val target = when (intent.getStringExtra("screen")) {
    "orders" -> Intent(this, OrdersActivity::class.java)
    "help"   -> Intent(this, HelpActivity::class.java)
    else     -> null
}
target?.let(::startActivity)
```

### 3. 어쩔 수 없다면 정화·검증

문서가 제시하는 완화책:
- 번들된 정보를 정화한다. URI 권한 플래그(`FLAG_GRANT_READ/WRITE/PERSISTABLE/PREFIX_URI_PERMISSION`)를 확인하거나 지우고, 어디로 가는 Intent 인지 확인한다. `IntentSanitizer` 가 허용 컴포넌트·데이터·타입을 선언적으로 제한한다.
- `resolveActivity` 로 목적지 컴포넌트를 구해 패키지·클래스가 기대값인지 비교한 뒤 시작한다.
- `PendingIntent` 를 쓰면 컴포넌트가 노출되지 않고 대상 Intent 가 불변이 된다.

### 4. 흔한 실수 (문서가 지적)

- `getCallingActivity()` 가 null 이 아닌지로 호출자를 믿는다. 악성 앱이 null 을 줄 수 있다.
- `checkCallingPermission()` 이 모든 문맥에서 동작하고 예외를 던진다고 가정한다. 실제로는 정수를 반환한다.

### 5. 탐지

- Android 12(API 31) 이상을 타깃하면 StrictMode 로 안전하지 않은 Intent 실행을 탐지한다. 조건은 전달받은 Intent 의 extras 에서 중첩 Intent 를 꺼내고, 곧바로 `startActivity`·`startService`·`bindService` 에 넘기는 것이다.
- Android 16 은 Intent 리다이렉션에 대한 기본 보안 강화를 도입했고, 정당한 용례를 위한 옵트아웃 API(`removeLaunchSecurityProtection()`)를 제공한다고 문서에 적혀 있다. 일반 앱은 호환 문제가 거의 없다고 하지만 구체적 동작 범위는 이번에 확인하지 못했다. 옵트아웃은 정말 필요할 때만 쓴다.

## 언제 쓰나

- 딥링크·공유 대상·알림 탭·WebView 브릿지·로그인 콜백 등 외부에서 Activity 가 열리는 모든 Android 앱. 릴리스 전 매니페스트의 `exported`·인텐트 필터 목록을 리뷰 항목으로 둔다.

## 주의·비용

- `exported=false` 로 바꾸면 외부 앱·시스템 연동(위젯, 런처 단축키, 알림 인텐트)이 깨질 수 있다. 어느 호출자가 있는지 먼저 파악한다.
- 허용 목록 방식은 화면이 늘 때마다 코드를 고쳐야 한다. 대신 취약 면이 줄어든다.
- 서드파티 SDK 가 병합 매니페스트로 `exported` 컴포넌트를 추가하기도 한다. 병합 결과를 확인한다.
- 이 취약점은 서버 검증으로 막을 수 없다. 앱 안 코드의 문제이며 점검 기준은 OWASP MASVS 의 PLATFORM 그룹이다. [모바일 위협 모델](/develop-wiki/knowledge/mobile-dev/mobile-threat-model-masvs/).

> 출처 확인 범위: Android 의 intent redirection 위험 문서와 Activity 요소 문서의 `android:exported` 항목을 읽었다. Android 16 기본 보호의 상세 동작, Service·Receiver·Provider 의 exported 기본값 규칙, Android 12 이상의 필터가 있는 컴포넌트의 exported 명시 요건 원문은 읽지 못했다.

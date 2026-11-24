---
name: PostHog
url: https://posthog.com
docs: https://posthog.com/docs/libraries/android
repo: https://github.com/PostHog/posthog
stars: 41081
domain: mobile
category: mobile-backend
description: 제품 분석, 세션 리플레이, 기능 플래그, A/B 테스트, 설문을 한 플랫폼에서 제공하는 오픈소스 제품 분석 도구. Android·iOS·Flutter·React Native SDK가 있고 클라우드 또는 셀프호스팅으로 쓴다.
pricing: oss
tags: [analytics, feature-flags, session-replay, experiments, open-source]
languages: [kotlin, swift, dart, typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
PostHog는 이벤트 수집을 기반으로 퍼널·리텐션 분석, 세션 리플레이, 기능 플래그, 실험, 설문을 묶어 제공하는 제품 분석 플랫폼이다. 모바일 앱에는 SDK로 이벤트를 보내고, 같은 플래그·실험을 웹과 공유할 수 있다.

- **라이선스**: 저장소 루트 LICENSE는 `ee/` 디렉터리 외 코드를 MIT로 둔다(`ee/`는 별도 라이선스). 모바일 SDK 저장소도 같은 패턴이다(GitHub의 자동 판별은 NOASSERTION). 그래서 pricing은 oss로 표기하되 엔터프라이즈 디렉터리 예외가 있다.
- **가격**: 클라우드는 제품별 월 무료 사용량이 있고 초과분은 사용량 과금(종량제)이다. 정확한 한도·단가는 가격 페이지에서 확인한다. 셀프호스팅 방법은 공식 문서에 있다.
- SDK 버전(확인일 기준): Android `com.posthog:posthog-android` **3.77.1**(Maven Central), iOS `posthog-ios` **3.98.0**(GitHub 릴리스).
- 대안: Amplitude·Mixpanel(SaaS 중심, 비오픈소스), 모바일 앱 퍼널은 Firebase Analytics([Firebase Crashlytics](/develop-wiki/mobile/mobile-backend/firebase-crashlytics/)와 함께 쓰는 경우가 많다).

## 설치
```kotlin
dependencies {
    implementation("com.posthog:posthog-android:3.77.1")
}
```
```swift
// Swift Package Manager: https://github.com/PostHog/posthog-ios
```
프로젝트 API 키와 호스트(미국 클라우드 `https://us.i.posthog.com`, EU 클라우드 `https://eu.i.posthog.com`, 또는 셀프호스팅 주소)가 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Event | `capture`로 보내는 사용자 행동. 속성(properties) 포함 |
| Distinct ID | 사용자 식별자. `identify`로 익명 ID와 로그인 계정 연결 |
| Person / Group | 사용자·조직 단위 속성 |
| Autocapture | 화면 보기·생명주기 등 일부 이벤트 자동 수집(SDK 설정) |
| Feature flag | 서버에서 켜고 끄는 기능 스위치. 사용자별 평가 |
| Experiment | 플래그 변형을 나눠 지표 비교(A/B) |
| Session replay | 세션 화면 기록(모바일은 SDK 설정 필요) |
| Opt-out | 사용자 동의 전 수집 중지 |

## 기본 사용법
Android(Kotlin):

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        val config = PostHogAndroidConfig(apiKey = "phc_xxx", host = "https://us.i.posthog.com")
        PostHogAndroid.setup(this, config)
    }
}

PostHog.identify("user-42", userProperties = mapOf("plan" to "free"))
PostHog.capture("checkout_started", properties = mapOf("items" to 3))
if (PostHog.isFeatureEnabled("new-paywall")) { /* 새 UI */ }
```

iOS(Swift):

```swift
let config = PostHogConfig(apiKey: "phc_xxx", host: "https://us.i.posthog.com")
PostHogSDK.shared.setup(config)
PostHogSDK.shared.capture("checkout_started", properties: ["items": 3])
```
키는 예시 값이며 클라이언트용 프로젝트 키만 앱에 넣는다.

## 자주 쓰는 패턴
- **로그인 연동**: 로그인 후 `identify`, 로그아웃 시 `reset`으로 다음 사용자와 섞이지 않게 한다.
- **구독 퍼널**: 페이월 노출 → 구매 시작 → 성공 이벤트를 보내고 구독 서비스 이벤트와 연결한다([RevenueCat](/develop-wiki/mobile/mobile-backend/revenuecat/)).
- **점진적 출시**: 기능 플래그를 비율로 열고 문제 시 앱 업데이트 없이 끈다([Firebase Remote Config](/develop-wiki/mobile/mobile-backend/firebase-remote-config/)와 역할 비교).
- **개인정보**: 동의 전에는 `optOut()` 상태로 시작하고, 민감 텍스트는 리플레이에서 마스킹한다. 스토어의 개인정보 양식도 함께 갱신한다([App Store 심사 가이드라인](/develop-wiki/mobile/learning/app-store-review-guidelines/)).
- **셀프호스팅**: 규제상 데이터를 외부로 내보낼 수 없으면 자체 인프라에 배포한다(운영 부담 있음).

## 언제 쓰나 / 피할 때
- 쓸 때: 분석·플래그·리플레이를 한 도구로 묶고 싶을 때, 오픈소스·셀프호스팅 선택지가 필요할 때.
- 피할 때: 광고 어트리뷰션 중심 분석(전용 MMP), 이벤트 규모가 커서 종량 비용이 부담되는 경우(샘플링·셀프호스팅 비교).

## 공식 문서
- [Android SDK](https://posthog.com/docs/libraries/android) · [iOS SDK](https://posthog.com/docs/libraries/ios) · [가격](https://posthog.com/pricing)

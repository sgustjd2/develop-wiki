---
name: Firebase Remote Config
url: https://firebase.google.com/products/remote-config
docs: https://firebase.google.com/docs/remote-config
repo: https://github.com/firebase/firebase-android-sdk
stars: 2583
domain: mobile
category: mobile-backend
description: 앱 업데이트 없이 서버에서 설정값을 바꾸는 Firebase 무료 서비스. 기능 플래그, 단계적 출시, 사용자 조건별 값, A/B 테스트에 쓴다.
pricing: free
tags: [feature-flag, config, ab-testing, firebase]
languages: [kotlin, swift, dart]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Remote Config는 앱 안에 **기본값**을 두고, 콘솔·API에서 정의한 **서버 템플릿** 값을 가져와 덮어쓰는 키-값 설정 서비스다. 조건(앱 버전, 플랫폼, 국가, 사용자 비율, Analytics 잠재고객)별로 다른 값을 줄 수 있어 스토어 심사 없이 기능을 켜고 끄거나 일부 사용자에게만 노출할 수 있다. 실시간 업데이트 리스너를 쓰면 앱 실행 중에도 변경을 받는다.

- 버전: Android BoM **35.2.0**, Apple SDK **13.2.0**. 서비스 무료. A/B Testing·Personalization과 연동된다.

## 설치
```kotlin
dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-config")
    implementation("com.google.firebase:firebase-analytics")  // 조건·A/B 테스트에 필요
}
```

iOS는 SPM으로 `FirebaseRemoteConfig`를 추가한다. (BoM 34부터 KTX 모듈이 없어지고 Kotlin 확장이 기본 모듈에 들어 있다.)

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 기본값 | 앱에 내장한 값(`setDefaultsAsync`). 네트워크 실패·첫 실행에도 동작 보장 |
| 템플릿 | 서버 측 파라미터·조건 묶음. 버전 기록과 롤백 지원 |
| 조건 | 앱 버전, 플랫폼, 국가, 사용자 백분율, 잠재고객 등으로 값 분기 |
| fetch / activate | 값을 받아 캐시 / 캐시된 값을 실제로 적용. `fetchAndActivate`로 한 번에 |
| 최소 가져오기 간격 | 기본 12시간. 개발 중에는 짧게, 운영은 길게(스로틀링 방지) |
| 실시간 업데이트 | `addOnConfigUpdateListener`로 서버 게시 즉시 변경 키 수신 |
| Rollout | 새 값을 사용자 비율로 점진 배포하고 Crashlytics 지표와 함께 확인 |

## 기본 사용법
```kotlin
import com.google.firebase.Firebase
import com.google.firebase.remoteconfig.ConfigUpdate
import com.google.firebase.remoteconfig.ConfigUpdateListener
import com.google.firebase.remoteconfig.FirebaseRemoteConfigException
import com.google.firebase.remoteconfig.remoteConfig
import com.google.firebase.remoteconfig.remoteConfigSettings

val config = Firebase.remoteConfig

fun initConfig() {
    config.setConfigSettingsAsync(remoteConfigSettings { minimumFetchIntervalInSeconds = 3600 })
    config.setDefaultsAsync(mapOf("new_checkout_enabled" to false, "banner_text" to ""))
    config.fetchAndActivate()

    config.addOnConfigUpdateListener(object : ConfigUpdateListener {
        override fun onUpdate(update: ConfigUpdate) { config.activate() }
        override fun onError(error: FirebaseRemoteConfigException) { /* 로그 */ }
    })
}

fun isNewCheckout(): Boolean = config.getBoolean("new_checkout_enabled")
```

## 자주 쓰는 패턴
- **기본값 우선 설계.** 서버 값이 없어도 안전한 기본값으로 동작하게 만든다. 킬 스위치(`feature_x_enabled`)는 기본 `false`.
- **적용 시점 통제.** 화면 중간에 UI가 바뀌지 않도록 다음 실행이나 화면 진입 시 `activate()`한다.
- **버전 조건.** 특정 앱 버전 이하에만 업데이트 안내 문구를 노출하는 강제 업데이트 패턴에 자주 쓴다.
- **A/B 테스트.** Firebase A/B Testing에서 Remote Config 파라미터를 실험 변수로 지정하고 Analytics 전환 이벤트로 판정한다.
- **비밀값 금지.** 값은 클라이언트로 전달되므로 API 키·비밀 정보를 넣지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모바일 앱의 기능 플래그·점진 출시·문구 변경, 이미 Firebase를 쓰는 앱.
- 피할 때(대안): 서버·웹·모바일 공통 기능 플래그, 세밀한 타기팅 규칙과 감사 로그가 필요하면 전용 기능 플래그 서비스(LaunchDarkly, OpenFeature 호환 도구 등)를 검토한다.

## 공식 문서
- [Remote Config 문서](https://firebase.google.com/docs/remote-config) · [Android 시작하기](https://firebase.google.com/docs/remote-config/android/get-started) · [실시간 업데이트](https://firebase.google.com/docs/remote-config/real-time)
- [로드 전략](https://firebase.google.com/docs/remote-config/loading)

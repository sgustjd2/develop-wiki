---
name: LeakCanary
url: https://square.github.io/leakcanary/
docs: https://square.github.io/leakcanary/getting_started/
repo: https://github.com/square/leakcanary
stars: 30008
domain: mobile
category: android
description: 디버그 빌드에서 메모리 누수를 자동 감지해 누수 경로(leak trace)를 알려 주는 Android 라이브러리. 의존성 한 줄로 Activity·Fragment·ViewModel 누수를 잡는다.
pricing: oss
tags: [memory-leak, debugging, performance, android]
languages: [kotlin, java]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
LeakCanary는 파괴되어야 할 객체(Activity, Fragment, View, ViewModel, 서비스)가 가비지 컬렉션되지 않으면 힙 덤프를 분석해 **무엇이 그 객체를 붙잡고 있는지**(GC root부터의 참조 경로)를 알림과 화면으로 보여 준다. 설치는 의존성 추가만으로 끝나며 코드를 바꿀 필요가 없다.

- 이 문서는 안정 버전 **2.14**(Maven Central) 기준이다. 3.0 알파(`3.0-alpha-9`)가 최신 릴리스지만 알파이므로 제외했다. Apache-2.0.
- 런타임 누수 확인용이며 정적 분석은 아니다. 프로덕션에는 넣지 않는다.

## 설치
```kotlin
dependencies {
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.14")
}
```
`release` 빌드에는 포함되지 않으므로 별도 분기가 필요 없다. 앱을 디버그로 실행하면 런처에 LeakCanary 아이콘이 생긴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `AppWatcher` | 파괴 후 약한 참조로 감시할 객체를 등록하는 진입점. 기본은 Activity·Fragment·View·ViewModel·Service 자동 감시 |
| Retained object | 감시 대상이 일정 시간 뒤에도 GC 안 됨 → 누수 후보 |
| Heap dump / Shark | 임계 개수에 도달하면 힙 덤프를 만들고 Shark 엔진이 분석 |
| Leak trace | GC root → 누수 객체까지 참조 체인, 의심 지점 표시 |
| Application vs Library leak | 앱 코드 누수와 AndroidX·프레임워크의 알려진 누수 분리 표시 |
| `LeakAssertions` | 계측 테스트 중 누수 여부를 단언 |
| `LeakCanary.config` | 임계 개수, 덤프 설정, 무시 규칙 구성 |

## 기본 사용법
의도적으로 누수를 만드는 예(Activity가 정적 필드에 붙잡힘):

```kotlin
object Holder { var activity: Activity? = null }

class LeakyActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Holder.activity = this   // finish() 후에도 해제되지 않음
    }
}
```
화면을 닫고 잠시 기다리면 LeakCanary 알림이 뜨고, trace에 `Holder.activity`가 원인으로 표시된다. 고치려면 `onDestroy`에서 참조를 지운다.

임의 객체를 감시하려면:

```kotlin
AppWatcher.objectWatcher.expectWeaklyReachable(myObject, "MyObject는 닫힌 뒤 해제되어야 함")
```

## 자주 쓰는 패턴
- **계측 테스트에서 단언**: `androidTestImplementation("com.squareup.leakcanary:leakcanary-android-instrumentation:2.14")` 추가 후 `LeakAssertions.assertNoLeaks()`를 호출하거나 `DetectLeaksAfterTestSuccess` 룰을 쓴다.
- **알려진 라이브러리 누수 제외**: `LeakCanary.config`의 `referenceMatchers`로 특정 참조를 무시한다.
- **Compose 화면**: Navigation 목적지 종료 후 ViewModel·코루틴 스코프가 남는지 `AppWatcher`가 확인한다([Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/), [Kotlin Coroutines](/develop-wiki/mobile/android/kotlin-coroutines/)).
- **흔한 원인**: 정적 필드·싱글턴에 Context 보관, 해제하지 않은 리스너·콜백, 종료되지 않는 코루틴·Handler.
- **측정과 병행**: 누수가 아닌 일반 메모리 문제는 Android Studio Memory Profiler로 본다([Android Studio](/develop-wiki/mobile/android/android-studio/)).

## 언제 쓰나 / 피할 때
- 쓸 때: 개발·QA 단계에서 화면 전환 반복 후 메모리 증가·OOM이 의심될 때, 회귀를 CI 계측 테스트에서 막고 싶을 때.
- 피할 때: 프로덕션 빌드(성능 영향·힙 덤프 정보 유출 위험). 프로덕션 메모리는 Play Console vitals·Crashlytics로 본다([Firebase Crashlytics](/develop-wiki/mobile/mobile-backend/firebase-crashlytics/)).

## 공식 문서
- [시작하기](https://square.github.io/leakcanary/getting_started/) · [누수 trace 읽기](https://square.github.io/leakcanary/fundamentals-how-leakcanary-works/) · [LeakCanary 저장소](https://github.com/square/leakcanary)

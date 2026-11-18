---
name: Espresso
url: https://developer.android.com/training/testing/espresso
docs: https://developer.android.com/training/testing/espresso
repo: https://github.com/android/android-test
stars: 1229
domain: mobile
category: mobile-testing
description: AndroidX Test의 View 기반 UI 테스트 프레임워크. 기기·에뮬레이터에서 앱 화면의 뷰를 찾아 조작하고 검증하며, UI 스레드 유휴 상태를 자동으로 기다린다.
pricing: oss
tags: [testing, ui-testing, android, instrumentation]
languages: [kotlin, java]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Espresso는 앱과 같은 프로세스에서 실행되는 **계측(instrumented) 테스트** 용 UI 테스트 API다. 메인 스레드 메시지 큐와 AsyncTask가 비어 있을 때까지 자동으로 기다린 뒤 동작·검증을 수행하므로 `sleep` 없이도 안정적인 테스트를 쓰기 쉽다. XML `View` 기반 화면이 대상이며, Compose 화면은 Compose 테스트 API(`createComposeRule`)를 쓴다.

- 최신 안정판(2026-11-18 확인): `espresso-core` **3.7.0**, `androidx.test.ext:junit` 1.3.0, `androidx.test:runner` 1.7.0. Apache-2.0.
- 언어는 [Kotlin](/develop-wiki/languages/kotlin/)·Java.

## 설치
```kotlin
android {
    defaultConfig { testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner" }
}
dependencies {
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test:runner:1.7.0")
}
```

```bash
./gradlew connectedDebugAndroidTest
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `onView(Matcher)` | 뷰 계층에서 조건에 맞는 뷰 하나 찾기 |
| ViewMatcher | `withId`, `withText`, `isDisplayed`, `hasDescendant` 등 Hamcrest 매처 |
| ViewAction | `click()`, `typeText()`, `replaceText()`, `closeSoftKeyboard()`, `scrollTo()` |
| ViewAssertion | `matches(...)`, `doesNotExist()` |
| `onData` | `AdapterView`(ListView) 항목 조회 |
| `RecyclerViewActions` | `espresso-contrib`의 RecyclerView 항목 스크롤·클릭 |
| Idling Resource | 네트워크·백그라운드 작업처럼 Espresso가 모르는 비동기를 기다리게 등록 |
| Espresso-Intents | 발생한 Intent 검증·외부 Activity 응답 스텁 |
| `ActivityScenario` | 테스트용 Activity 실행·생명주기 제어 |

## 기본 사용법
```kotlin
@RunWith(AndroidJUnit4::class)
class LoginTest {
    @get:Rule val rule = ActivityScenarioRule(LoginActivity::class.java)

    @Test fun loginShowsWelcome() {
        onView(withId(R.id.email)).perform(typeText("kim@example.com"), closeSoftKeyboard())
        onView(withId(R.id.password)).perform(typeText("pass1234"), closeSoftKeyboard())
        onView(withId(R.id.submit)).perform(click())
        onView(withId(R.id.welcome)).check(matches(withText("환영합니다")))
    }
}
```

필요한 import: `androidx.test.espresso.Espresso.onView`, `androidx.test.espresso.action.ViewActions.*`, `androidx.test.espresso.assertion.ViewAssertions.matches`, `androidx.test.espresso.matcher.ViewMatchers.*`.

## 자주 쓰는 패턴
- **애니메이션 끄기.** 테스트 기기의 개발자 옵션 애니메이션 배율을 0으로 하거나 `testOptions { animationsDisabled = true }`로 흔들림을 줄인다.
- **비동기 대기.** 코루틴·네트워크 작업은 Idling Resource를 등록하거나 테스트에서 디스패처를 주입해 동기화한다.
- **Compose 혼합 화면.** 한 테스트에서 Espresso(`onView`)와 Compose 규칙(`composeTestRule.onNodeWithText`)을 함께 쓸 수 있다.
- **Robot 패턴.** 화면별 동작을 함수로 묶어 테스트 가독성을 높인다.
- **기기 매트릭스.** Gradle Managed Devices나 Firebase Test Lab에서 여러 API 레벨로 돌린다.

## 언제 쓰나 / 피할 때
- 쓸 때: View 기반 네이티브 Android 앱의 UI 테스트, 앱 내부 상태에 접근하는 화이트박스 테스트.
- 피할 때(대안): Compose 전용 화면은 Compose 테스트 API([Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)). iOS와 공통 시나리오, 앱 밖 시스템 UI 조작이 필요하면 [Maestro](/develop-wiki/mobile/mobile-testing/maestro/)나 UI Automator.

## 공식 문서
- [Espresso 가이드](https://developer.android.com/training/testing/espresso) · [AndroidX Test 릴리스](https://developer.android.com/jetpack/androidx/releases/test)
- [Android 테스트 개요](https://developer.android.com/training/testing)

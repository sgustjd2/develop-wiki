---
name: Robolectric
url: https://robolectric.org
docs: https://robolectric.org/getting-started/
repo: https://github.com/robolectric/robolectric
stars: 6103
domain: mobile
category: mobile-testing
description: 에뮬레이터 없이 JVM 로컬 단위 테스트에서 Android 프레임워크(Activity, Resources, Context)를 시뮬레이션해 UI·Android 의존 코드를 빠르게 검증하는 테스트 프레임워크.
pricing: oss
tags: [unit-test, jvm, android, testing, junit]
languages: [kotlin, java]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Robolectric은 실제 기기나 에뮬레이터 대신 JVM에서 Android SDK의 실제 구현 코드를 로드해 `Activity`, `Resources`, `SharedPreferences` 같은 클래스를 동작시킨다. 로컬 테스트(`src/test`)로 돌기 때문에 빠르고 CI에서 안정적이며, 계측 테스트(`src/androidTest`)가 필요한 범위를 줄여 준다.

- 이 문서는 **Robolectric 4.18.1**(Maven Central 최신, 2026-11-18 릴리스) 기준이다. 저장소 LICENSE는 MIT 문구이나 GitHub API는 라이선스를 자동 판별하지 못해 NOASSERTION으로 표시한다.
- Compose UI 테스트, [Roborazzi](/develop-wiki/mobile/mobile-testing/roborazzi/)의 스크린샷 테스트, [Espresso](/develop-wiki/mobile/mobile-testing/espresso/) 테스트를 JVM에서 실행하는 기반으로도 쓰인다.

## 설치
```kotlin
android {
    testOptions { unitTests.isIncludeAndroidResources = true }
}
dependencies {
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.18.1")
}
```
공식 가이드는 `isIncludeAndroidResources = true`를 설정해 리소스·매니페스트를 테스트에서 읽도록 안내한다. 필요한 Android SDK 아티팩트는 처음 실행할 때 내려받는다(오프라인 CI는 사전 캐싱).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@RunWith(RobolectricTestRunner::class)` | JUnit4 러너. 테스트마다 Android 환경을 구성 |
| `@Config(sdk = [...])` | 시뮬레이션할 API 레벨, 앱 클래스, 수식자(qualifiers) 지정 |
| `ActivityScenario` / `Robolectric.buildActivity` | 화면 생명주기를 제어하며 Activity 실행 |
| Shadow | 프레임워크 클래스의 동작을 대체·관찰하는 객체(`Shadows.shadowOf(...)`) |
| Looper 모드 | 기본 PAUSED. `shadowOf(Looper.getMainLooper()).idle()`로 메시지 큐 진행 |
| `@GraphicsMode(NATIVE)` | 네이티브 그래픽 렌더링으로 실제 픽셀 캡처 가능(스크린샷 테스트용) |
| 리소스 수식자 | `@Config(qualifiers = "ko-night-w360dp")`처럼 로케일·다크 모드·화면 폭 지정 |

## 기본 사용법
```kotlin
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class GreetingTest {
    @Test fun showsName() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val text = activity.findViewById<TextView>(R.id.greeting).text
                assertEquals("안녕하세요", text.toString())
            }
        }
    }
}
```
`MainActivity`와 `R.id.greeting`은 앱이 정의한 가정이다. Compose는 `createAndroidComposeRule<MainActivity>()`를 같은 방식으로 쓴다.

## 자주 쓰는 패턴
- **Compose 화면 테스트**: JVM에서 `composeTestRule.onNodeWithText("저장").performClick()` 후 상태를 검증한다([Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)).
- **Hilt·DI 교체**: `@HiltAndroidTest` + `HiltAndroidRule`로 가짜 모듈을 주입한다([Hilt](/develop-wiki/mobile/android/hilt/)).
- **WorkManager·Room**: `work-testing`·인메모리 Room DB와 함께 데이터·작업 로직을 로컬에서 검증한다([WorkManager](/develop-wiki/mobile/android/workmanager/)).
- **API 레벨 매트릭스**: 중요 로직은 `@Config(sdk = [28, 34])`로 여러 레벨에서 실행한다.
- **한계 인식**: 실제 렌더링·센서·GPU·OEM 동작은 시뮬레이션이 아니므로 핵심 흐름은 실기기 테스트로 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Android 클래스에 의존하지만 에뮬레이터까지는 과한 로직(뷰 모델+UI 연결, 리소스·로케일 처리), 빠른 CI 피드백이 필요할 때.
- 피할 때: GPU·카메라·권한 시스템 UI·실제 렌더링 품질을 검증해야 할 때(실기기·[Espresso](/develop-wiki/mobile/mobile-testing/espresso/)), 순수 Kotlin 로직(일반 JUnit으로 충분).

## 공식 문서
- [시작하기](https://robolectric.org/getting-started/) · [Robolectric 사이트](https://robolectric.org) · [저장소](https://github.com/robolectric/robolectric)

---
name: Paparazzi
url: https://cashapp.github.io/paparazzi/
docs: https://cashapp.github.io/paparazzi/
repo: https://github.com/cashapp/paparazzi
stars: 2642
domain: mobile
category: mobile-testing
description: 에뮬레이터·실기기 없이 JVM 에서 Android 뷰·Compose 화면을 렌더링해 스냅샷을 찍고 기준 이미지와 비교하는 Cash App 의 스크린샷 테스트 라이브러리.
pricing: oss
tags: [screenshot-test, snapshot, compose, layoutlib, visual-regression]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Paparazzi 는 Android 의 layoutlib(Android Studio 프리뷰가 쓰는 렌더러)으로 화면을 그려 PNG 로 저장하는 라이브러리다. 일반 JUnit 테스트로 돌아가므로 에뮬레이터 없이 빠르게 UI 회귀를 잡을 수 있다. Gradle 플러그인이 기준 이미지 기록(record)과 검증(verify) 작업을 제공한다.

- 이 문서는 저장소 최신 릴리스 **2.0.0-alpha05.1**(2026-09-28, Maven Central `release` 도 동일) 기준이다. 2.0 은 아직 알파이며, 직전 1.x 마지막 안정판은 1.3.5(2024-11)다. 제품에 쓸 때는 어느 쪽을 쓸지 정하고 버전을 고정한다. Apache-2.0.
- 대안: Robolectric 위에서 동작하는 [Roborazzi](/develop-wiki/mobile/mobile-testing/roborazzi/)는 Activity 흐름까지 캡처할 수 있다. 실제 기기에서 확인하려면 [Espresso](/develop-wiki/mobile/mobile-testing/espresso/).

## 설치
모듈 `build.gradle.kts` 의 plugins 블록에 선언한다.
```kotlin
plugins {
    id("app.cash.paparazzi") version "2.0.0-alpha05.1"
}
```
기록된 스냅샷은 기본적으로 `src/test/snapshots` 에 저장된다. 공식 문서는 이 폴더를 Git LFS 로 관리하길 권한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Paparazzi` 규칙 | JUnit Rule. `deviceConfig`(예: `PIXEL_5`), `theme` 등을 지정 |
| `snapshot` | 뷰 또는 `@Composable` 람다를 렌더링해 이미지로 기록·비교 |
| `recordPaparazziDebug` | 현재 렌더 결과를 기준(golden) 이미지로 저장 |
| `verifyPaparazziDebug` | 테스트를 실행해 기록된 이미지와 비교 |
| 실패 산출물 | 비교 실패 시 `build/paparazzi/failures` 에 차이 이미지 저장 |

## 기본 사용법
```kotlin
class LaunchViewTest {
  @get:Rule
  val paparazzi = Paparazzi(
    deviceConfig = DeviceConfig.PIXEL_5,
    theme = "android:Theme.Material.Light.NoActionBar"
  )

  @Test
  fun launchComposable() {
    paparazzi.snapshot {
      MyComposable()   // 직접 만든 컴포저블
    }
  }
}
```
```bash
./gradlew :app:recordPaparazziDebug   # 기준 이미지 생성
./gradlew :app:verifyPaparazziDebug   # PR 에서 회귀 검증
```
`:app` 은 모듈 이름 예시다. `testDebug` 를 실행하면 `build/reports/paparazzi/` 에 HTML 리포트가 생성된다. 뷰 기반 화면은 `paparazzi.inflate<LaunchView>(R.layout.launch)` 로 만든 뷰를 `snapshot(view)` 에 넘긴다.

## 자주 쓰는 패턴
- **PR 에서 verify**: CI 에서 `verifyPaparazziDebug` 를 돌려 의도하지 않은 UI 변경을 막는다.
- **디바이스·테마 조합**: 여러 `deviceConfig`·다크 테마로 같은 컴포저블을 반복 캡처한다.
- **Lottie**: 백그라운드 스레드에서 실행되면 예외가 날 수 있어, 공식 문서는 `LottieTask.EXECUTOR` 를 `Executor(Runnable::run)` 으로 설정하라고 안내한다.
- **`LocalInspectionMode`**: Paparazzi 가 전역으로 켜지 않는다. 지도 같은 컴포저블은 `CompositionLocalProvider` 로 `LocalInspectionMode` 를 `true` 로 감싸 프리뷰용 경로를 타게 한다.
- **Jetifier**: 사용 중이면 `gradle.properties` 에 `android.jetifier.ignorelist=android-base-common,common` 를 추가하라고 안내한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 컴포넌트·디자인 시스템의 시각적 회귀를 빠르게 검증할 때.
- 피할 때(대안): 사용자 입력·내비게이션 흐름 테스트는 Roborazzi(Robolectric)나 계측 테스트가 맞다. 기기별 렌더링 차이를 실측해야 하면 실기기 테스트.

## 공식 문서
- [문서 사이트](https://cashapp.github.io/paparazzi/) · [저장소](https://github.com/cashapp/paparazzi)

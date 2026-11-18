---
name: Roborazzi
url: https://takahirom.github.io/roborazzi/
docs: https://github.com/takahirom/roborazzi
repo: https://github.com/takahirom/roborazzi
stars: 1083
domain: mobile
category: mobile-testing
description: Robolectric 위에서 에뮬레이터 없이 Android·Compose 화면의 스크린샷을 찍고 기준 이미지와 비교하는 스크린샷 테스트 도구. Gradle 플러그인이 record·verify·compare 작업을 제공한다.
pricing: oss
tags: [screenshot-test, robolectric, compose, visual-regression]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Roborazzi는 [Robolectric](/develop-wiki/mobile/mobile-testing/robolectric/)의 네이티브 그래픽 모드(RNG)를 활용해 JVM 테스트에서 실제 픽셀 이미지를 캡처하고, 저장해 둔 기준(golden) 이미지와 비교한다. UI 변경이 의도치 않은 시각적 회귀를 만들었는지 PR에서 잡는 용도다.

- 이 문서는 **Roborazzi 1.79.0**(Maven Central 최신, 2026-11-12 릴리스) 기준이다. Apache-2.0.
- 비슷한 도구 **Paparazzi**(Cash App, Apache-2.0)는 Robolectric 없이 layoutlib으로 렌더링한다. 저장소 최신은 `2.0.0-alpha05.1`(알파)이며 Maven의 안정 릴리스는 1.3.5다. Robolectric으로 실제 Activity 흐름까지 캡처하려면 Roborazzi, 가벼운 단일 컴포저블 렌더링은 Paparazzi가 흔한 선택이다.

## 설치
루트 `build.gradle.kts`에 플러그인을 선언하고 모듈에 적용한다.

```kotlin
// 루트
plugins { id("io.github.takahirom.roborazzi") version "1.79.0" apply false }

// 모듈
plugins { id("io.github.takahirom.roborazzi") }
dependencies {
    testImplementation("io.github.takahirom.roborazzi:roborazzi:1.79.0")
    testImplementation("io.github.takahirom.roborazzi:roborazzi-compose:1.79.0")
    testImplementation("io.github.takahirom.roborazzi:roborazzi-junit-rule:1.79.0")
    testImplementation("org.robolectric:robolectric:4.18.1")
}
```
Robolectric의 `unitTests.isIncludeAndroidResources = true`도 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@GraphicsMode(NATIVE)` | 실제 렌더링을 켜는 Robolectric 설정(스크린샷 필수) |
| `captureRoboImage(path)` | 뷰·Compose 노드·루트 화면을 PNG로 저장 |
| `recordRoborazziDebug` | 현재 화면을 기준 이미지로 저장/갱신 |
| `verifyRoborazziDebug` | 기준과 비교해 다르면 테스트 실패 |
| `compareRoborazziDebug` | 변경 전/후/차이 이미지를 만들어 리포트 |
| 허용 오차 | 비교 임계값으로 렌더링 미세 차이 허용 |
| 리포트 | 변경 이미지를 모아 보여 주는 결과 출력, CI 아티팩트로 활용 |

## 기본 사용법
```kotlin
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w360dp-h640dp-xxhdpi")
class ProfileScreenshotTest {
    @get:Rule val composeRule = createComposeRule()

    @Test fun profile() {
        composeRule.setContent { ProfileScreen(name = "홍길동") }
        composeRule.onRoot().captureRoboImage("src/test/screenshots/profile.png")
    }
}
```
`ProfileScreen`은 앱이 정의한 컴포저블 가정이다. 처음에는 `./gradlew recordRoborazziDebug`로 기준을 만들고, 이후 CI에서 `./gradlew verifyRoborazziDebug`를 실행한다.

## 자주 쓰는 패턴
- **PR 워크플로**: `verify` 실패 시 `compare` 리포트를 아티팩트로 올려 리뷰어가 변경 이미지를 확인하고, 의도된 변경은 `record`로 갱신해 커밋한다.
- **상태 매트릭스**: 라이트/다크, 큰 글씨, 언어(`qualifiers`)별로 같은 화면을 캡처한다.
- **Preview 일괄 캡처**: `@Preview` 컴포저블을 모아 자동 캡처하는 확장 모듈을 쓴다(공식 README 참고).
- **기준 이미지 관리**: PNG가 커지므로 Git LFS 또는 별도 저장소를 고려한다.
- **일관성**: 플랫폼별 폰트·렌더링 차이를 피하려면 로컬과 CI에서 같은 OS·JDK로 기준을 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인 시스템 컴포넌트, 화면 레이아웃 회귀를 빠르게 감시할 때, 에뮬레이터 비용 없이 CI에서 스크린샷을 비교할 때.
- 피할 때: 애니메이션·GPU 효과·실제 기기 렌더링 확인(실기기 테스트), 이미지 비교가 자주 흔들려 유지 비용이 큰 화면. iOS 쪽 대응은 [swift-snapshot-testing](/develop-wiki/mobile/mobile-testing/swift-snapshot-testing/).

## 공식 문서
- [README·시작하기](https://github.com/takahirom/roborazzi) · [문서 사이트](https://takahirom.github.io/roborazzi/) · [Paparazzi](https://cashapp.github.io/paparazzi/)

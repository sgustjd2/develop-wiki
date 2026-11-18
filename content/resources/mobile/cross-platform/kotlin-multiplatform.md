---
name: Kotlin Multiplatform (Compose Multiplatform)
url: https://kotlinlang.org/multiplatform/
docs: https://kotlinlang.org/docs/multiplatform/get-started.html
repo: https://github.com/JetBrains/compose-multiplatform
stars: 19490
domain: mobile
category: cross-platform
description: Kotlin 코드를 Android·iOS·데스크톱·웹에서 공유하는 JetBrains 기술. 비즈니스 로직만 공유하거나 Compose Multiplatform으로 UI까지 공유할 수 있다.
pricing: oss
tags: [kmp, cross-platform, compose, expect-actual]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kotlin Multiplatform(KMP)은 Kotlin 컴파일러가 JVM 바이트코드, Kotlin/Native(iOS 프레임워크), JS·Wasm으로 각각 컴파일하는 성질을 이용해 **공통 코드를 한 번 쓰고 플랫폼별 코드는 필요한 곳만** 쓰게 한다. 네트워킹·저장소·도메인 로직만 공유하고 UI는 SwiftUI·Compose로 각자 만들 수도 있고, **Compose Multiplatform**으로 UI까지 공유할 수도 있다.

- 버전: Kotlin **2.4.21**(2.5.0 RC 진행 중), Compose Multiplatform **1.12.2**(1.13 베타). 둘 다 Apache-2.0.
- Compose Multiplatform은 Android의 [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/) API를 iOS·데스크톱·웹으로 넓힌 것으로, iOS 지원은 1.8.0부터 안정 단계다.
- Room 3.0, kotlinx.coroutines, Ktor, kotlinx.serialization 등 주요 라이브러리가 KMP를 지원한다. 언어는 [Kotlin](/develop-wiki/languages/kotlin/).

## 설치
- [KMP 웹 마법사](https://kmp.jetbrains.com)나 IntelliJ IDEA / Android Studio의 Kotlin Multiplatform 플러그인으로 프로젝트를 만든다.
- iOS 타깃 빌드·실행에는 macOS와 [Xcode](/develop-wiki/mobile/ios/xcode/)가 필요하다.

```bash
./gradlew :composeApp:assembleDebug      # Android
./gradlew :shared:allTests               # 공통·플랫폼 테스트
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Target | 컴파일 대상: `androidTarget`/Android 라이브러리, `iosArm64`, `iosSimulatorArm64`, `jvm`, `wasmJs` |
| Source set | `commonMain`(공통), `androidMain`, `iosMain` 등. 계층 구조로 `appleMain` 같은 중간 세트 자동 생성 |
| `expect` / `actual` | 공통 코드에서 선언하고 플랫폼별로 구현하는 메커니즘 |
| Kotlin/Native | LLVM 기반 네이티브 컴파일. iOS용 `.framework`를 만들어 Swift에서 import |
| Swift export / Obj-C 헤더 | Kotlin API를 Swift에서 부르는 방식. 기본은 Obj-C 헤더 경유 |
| Compose Multiplatform | `@Composable` UI를 iOS(UIKit 위 캔버스)·데스크톱·웹에서 렌더링 |
| Compose Hot Reload | 데스크톱 타깃에서 상태 유지 UI 수정 반영 |

## 기본 사용법
`expect`/`actual`과 공통 로직.

```kotlin
// commonMain
expect fun platformName(): String

class Greeting {
    fun greet(): String = "안녕하세요, ${platformName()}!"
}

// androidMain
actual fun platformName(): String = "Android ${android.os.Build.VERSION.SDK_INT}"

// iosMain
import platform.UIKit.UIDevice
actual fun platformName(): String =
    UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
```

```kotlin
// shared/build.gradle.kts (일부)
kotlin {
    iosArm64(); iosSimulatorArm64()
    jvm()
    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.11.0")
        }
    }
}
```

Swift에서는 생성된 프레임워크를 import 해 `Greeting().greet()`를 호출한다.

## 자주 쓰는 패턴
- **로직부터 공유.** 기존 네이티브 앱이라면 네트워크·캐시·검증 로직을 `shared` 모듈로 옮기고 UI는 그대로 두는 방식이 위험이 작다.
- **`expect`/`actual`은 최소로.** 플랫폼 차이는 인터페이스 + DI로 주입하는 편이 테스트하기 쉽다.
- **비동기 API를 Swift에 노출.** `suspend`·`Flow`는 Swift async/AsyncSequence로 쓰기 위해 SKIE 같은 도구나 래퍼를 둔다.
- **로컬 DB.** Room 3.0([Android Jetpack](/develop-wiki/mobile/android/android-jetpack/)) 또는 SQLDelight를 `commonMain`에서 쓴다.
- **UI 공유 범위 선택.** 일부 화면만 Compose Multiplatform으로 만들고 iOS에서 `ComposeUIViewController`로 SwiftUI/UIKit 앱에 끼울 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Android 팀이 Kotlin 자산을 iOS로 넓힐 때, UI는 네이티브로 두고 로직만 공유하고 싶을 때, 데스크톱 앱까지 Kotlin으로 만들 때.
- 피할 때(대안): 팀이 웹 React 중심이면 [React Native](/develop-wiki/mobile/cross-platform/react-native/), UI를 처음부터 하나로 만들고 iOS 경험이 적은 팀이면 [Flutter](/develop-wiki/mobile/cross-platform/flutter/). C#/.NET 조직이면 [.NET MAUI](/develop-wiki/mobile/cross-platform/dotnet-maui/).

## 공식 문서
- [KMP 시작하기](https://kotlinlang.org/docs/multiplatform/get-started.html) · [Compose Multiplatform](https://kotlinlang.org/docs/multiplatform/compose-multiplatform.html)
- [Compose Multiplatform 릴리스](https://github.com/JetBrains/compose-multiplatform/releases) · [Kotlin 릴리스](https://kotlinlang.org/docs/releases.html)

---
name: Android Studio
url: https://developer.android.com/studio
docs: https://developer.android.com/studio/intro
domain: mobile
category: android
description: IntelliJ 기반의 공식 Android 개발 환경과 Gradle 빌드 체계(AGP). 에뮬레이터·Compose 미리보기·프로파일러·Gemini 보조를 포함하며 Android 앱 빌드의 기본 도구다.
pricing: free
tags: [toolchain, gradle, agp, emulator]
languages: [kotlin, java]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Android Studio는 JetBrains IntelliJ IDEA 위에 Android 전용 기능을 얹은 Google의 공식 개발 환경이다. 실제 빌드는 **Gradle + Android Gradle Plugin(AGP)** 이 맡기 때문에 CI에서는 Studio 없이 `./gradlew`만으로 같은 빌드를 재현한다.

- 현재 안정판: **Android Studio Rabbit 2 | 2026.2.2 Patch 1**.
- 빌드 체계: **AGP 9.5.1**(최소 Gradle 9.6.0, JDK 17, 최대 API 37 지원). Gradle 최신은 9.9.1.
- Gemini in Android Studio와 원하는 에이전트를 붙이는 AI 기능, Android Device Streaming(원격 실기기), Live Edit, APK Analyzer를 포함한다.
- 언어는 [Kotlin](/develop-wiki/languages/kotlin/)·Java·C/C++.

## 설치
[developer.android.com/studio](https://developer.android.com/studio)에서 받는다(Windows·macOS·Linux·ChromeOS). 여러 채널(Stable/Beta/Canary)을 병행 설치하려면 JetBrains Toolbox를 써도 된다. 처음 실행 시 SDK·플랫폼 도구·에뮬레이터 이미지를 SDK Manager로 받는다.

```bash
./gradlew assembleDebug          # 디버그 APK
./gradlew bundleRelease          # Play 배포용 AAB
./gradlew connectedAndroidTest   # 기기/에뮬레이터 계측 테스트
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `settings.gradle.kts` | 모듈 목록과 플러그인·의존성 저장소(`google()`, `mavenCentral()`) |
| `build.gradle.kts` (모듈) | `android { namespace, compileSdk, defaultConfig { minSdk, targetSdk } }` |
| Version catalog | `gradle/libs.versions.toml`에 의존성·플러그인 버전을 모아 관리. 새 템플릿 기본값 |
| Build type / Product flavor | debug·release 구성, 무료·유료 같은 변형. 조합이 build variant |
| AGP | Android 빌드 로직(리소스 처리, D8/R8, 서명, AAB 패키징)을 제공하는 Gradle 플러그인 |
| R8 | 코드 축소·난독화·최적화. release에서 `isMinifyEnabled = true` |
| Emulator / AVD | 휴대폰·태블릿·폴더블·Wear OS·TV 가상 기기 |
| Profiler / Layout Inspector | CPU·메모리·에너지 분석, Compose 재구성 횟수 확인 |

## 기본 사용법
버전 카탈로그와 모듈 빌드 파일 예.

```toml
# gradle/libs.versions.toml
[versions]
agp = "9.5.1"
kotlin = "2.4.21"

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
```

```kotlin
// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}
android {
    namespace = "com.example.app"
    compileSdk = 36
    defaultConfig { applicationId = "com.example.app"; minSdk = 24; targetSdk = 36 }
    buildTypes { release { isMinifyEnabled = true } }
}
```

(`compileSdk`·`targetSdk`는 설치한 SDK와 Play의 최신 타깃 요구 사항에 맞춘다.)

## 자주 쓰는 패턴
- **Gradle 래퍼 고정.** `gradle/wrapper/gradle-wrapper.properties`를 커밋해 모든 개발자·CI가 같은 Gradle을 쓴다. AGP를 올릴 때 최소 Gradle 버전 표를 확인한다.
- **AGP Upgrade Assistant.** Tools → AGP Upgrade Assistant가 DSL 변경을 자동으로 고친다. AGP 9로 올릴 때 특히 유용하다.
- **빌드 속도.** Build Analyzer로 느린 태스크를 찾고, `org.gradle.configuration-cache=true`로 구성 캐시를 켠다.
- **Baseline Profile.** 앱 시작·스크롤 성능을 위해 Macrobenchmark로 프로필을 생성해 함께 배포한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 네이티브 Android, [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/), Android 쪽 [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/) 개발. 크로스플랫폼 프레임워크도 Android SDK·에뮬레이터 설치에 사실상 필요하다.
- 피할 때(대안): IntelliJ IDEA(Android 플러그인)로 같은 프로젝트를 열 수 있다. 빌드만 필요하면 Studio 없이 Gradle CLI.

## 공식 문서
- [Android Studio 소개](https://developer.android.com/studio/intro) · [릴리스 노트](https://developer.android.com/studio/releases)
- [빌드 구성](https://developer.android.com/build) · [AGP 릴리스 노트·호환성 표](https://developer.android.com/build/releases/gradle-plugin)

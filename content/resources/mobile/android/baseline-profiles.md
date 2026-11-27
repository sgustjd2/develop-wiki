---
name: Baseline Profiles & Macrobenchmark
url: https://developer.android.com/topic/performance/baselineprofiles/overview
docs: https://developer.android.com/topic/performance/baselineprofiles/overview
repo: https://github.com/androidx/androidx
stars: 6153
domain: mobile
category: android
description: 앱 시작·스크롤 경로의 코드를 설치 시 미리 컴파일하게 하는 Baseline Profile과, 그 효과를 실기기에서 측정하는 Macrobenchmark. Android 앱 성능 최적화의 공식 도구 쌍이다.
pricing: oss
tags: [performance, startup, benchmark, jetpack, profile]
languages: [kotlin]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Android는 앱 첫 실행 때 코드를 JIT/인터프리트로 돌리다 나중에 컴파일한다. **Baseline Profile**은 "이 클래스·메서드는 시작과 핵심 사용자 흐름에서 쓴다"는 목록(`baseline-prof.txt`)을 APK/AAB에 넣어 설치 시점에 미리 AOT 컴파일하게 한다. 공식 문서는 코드 실행 속도가 첫 실행부터 크게 개선된다고 설명한다. **Macrobenchmark**는 별도 테스트 모듈에서 실제 앱을 구동해 시작 시간·프레임 시간을 측정하고 프로필 생성도 맡는다.

- 이 문서는 `androidx.benchmark:benchmark-macro-junit4` **1.5.0**, Baseline Profile Gradle 플러그인 `androidx.baselineprofile` **1.5.0**(안정), `androidx.profileinstaller:profileinstaller` **1.4.1** 기준이다(1.6.0-alpha01은 알파라 제외). Apache-2.0.
- 앱 코드 외에 Compose 같은 라이브러리도 자체 프로필을 포함해 배포된다([Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)).

## 설치
Android Studio의 **Baseline Profile Generator** 모듈 템플릿이 가장 빠르다. 직접 구성하면:

```kotlin
// 앱 모듈 build.gradle.kts
plugins { id("androidx.baselineprofile") }
dependencies {
    implementation("androidx.profileinstaller:profileinstaller:1.4.1")
    "baselineProfile"(project(":baselineprofile"))
}
// :baselineprofile 모듈(com.android.test)
plugins { id("androidx.baselineprofile") }
dependencies { implementation("androidx.benchmark:benchmark-macro-junit4:1.5.0") }
```
벤치마크 수치는 에뮬레이터보다 실기기에서 재는 것이 권장된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Baseline Profile | 사전 컴파일할 클래스/메서드 규칙 파일. 앱·라이브러리 모두 제공 가능 |
| `BaselineProfileRule` | 사용자 여정(JUnit 테스트)을 실행해 프로필을 수집 |
| `MacrobenchmarkRule` | `measureRepeated`로 지표를 반복 측정 |
| Metric | `StartupTimingMetric`, `FrameTimingMetric`, `TraceSectionMetric` 등 |
| `CompilationMode` | `None()`, `Partial()`, `Full()`로 컴파일 상태를 고정해 비교 |
| `StartupMode` | `COLD`/`WARM`/`HOT` 시작 유형 |
| ProfileInstaller | Play 외 설치·구형 환경에서 프로필 컴파일을 돕는 런타임 |
| Startup Profile | 시작 클래스 배치를 DEX에서 최적화(R8 연계) |

## 기본 사용법
프로필 수집:

```kotlin
@RunWith(AndroidJUnit4::class)
class ProfileGenerator {
    @get:Rule val rule = BaselineProfileRule()

    @Test fun generate() = rule.collect(packageName = "com.example.app") {
        pressHome()
        startActivityAndWait()
        // 대표 사용자 흐름: 목록 스크롤 등
    }
}
```

효과 측정:

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule val rule = MacrobenchmarkRule()

    @Test fun startupPartial() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD,
        compilationMode = CompilationMode.Partial(),
    ) { pressHome(); startActivityAndWait() }
}
```

## 자주 쓰는 패턴
- **릴리스 빌드에서 측정**: 벤치마크는 minify된 릴리스 계열(`benchmark` 빌드 타입)로, 디버거 없이 돌린다.
- **프로필은 CI에서 재생성**: 주요 화면이 바뀔 때 프로필을 갱신하고 저장소에 커밋하거나 빌드 단계에서 생성한다([Fastlane](/develop-wiki/mobile/mobile-testing/fastlane/) 등과 함께).
- **`None` vs `Partial` 비교**: 프로필 적용 전/후 시작 시간을 같은 기기에서 비교해 개선폭을 확인한다.
- **라이브러리 프로필**: Compose·AndroidX는 자체 프로필을 포함하므로 앱 프로필이 이를 보완한다.
- **Perfetto 트레이스**: 결과의 트레이스 파일을 Android Studio에서 열어 병목을 추적한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 콜드 스타트·첫 스크롤 지연이 지표(Play Console Android vitals)에서 문제일 때, 성능 회귀를 CI에서 막고 싶을 때.
- 피할 때: 성능 문제의 원인이 네트워크·알고리즘인 경우(프로파일러·시스템 트레이스가 먼저), 에뮬레이터만으로 수치를 판단하려는 경우(실기기 필요).

## 공식 문서
- [Baseline Profiles 개요](https://developer.android.com/topic/performance/baselineprofiles/overview) · [Macrobenchmark 개요](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview) · [Baseline Profile 생성](https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile)

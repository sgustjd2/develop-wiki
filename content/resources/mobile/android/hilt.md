---
name: Hilt
url: https://dagger.dev/hilt/
docs: https://developer.android.com/training/dependency-injection/hilt-android
repo: https://github.com/google/dagger
stars: 17687
domain: mobile
category: android
description: Dagger 위에 Android 구성요소(Application·Activity·ViewModel)별 컴포넌트를 미리 정의해 둔 공식 의존성 주입 라이브러리. 컴파일 타임에 그래프를 검증하며 Koin 같은 런타임 DI와 비교된다.
pricing: oss
tags: [dependency-injection, dagger, android, jetpack]
languages: [kotlin, java]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Hilt는 Dagger 2를 Android에 맞게 감싼 의존성 주입(DI) 라이브러리다. `Application`, `Activity`, `Fragment`, `ViewModel` 같은 Android 클래스마다 컴포넌트와 스코프가 이미 정해져 있어, 직접 컴포넌트를 짜는 보일러플레이트가 없다. 의존성 그래프는 **컴파일 타임**에 검증되므로 누락된 바인딩은 빌드 오류로 드러난다.

- 이 문서는 **Hilt/Dagger 2.60.1**(Maven Central 최신), `androidx.hilt:hilt-navigation-compose` 1.4.0 기준이다. Apache-2.0.
- 비교: **Dagger** 단독은 Android 외 JVM에서도 쓰지만 컴포넌트를 직접 정의한다. **Koin**(4.2.2, Apache-2.0)은 코드 생성 없이 Kotlin DSL로 그래프를 구성하고 런타임에 해석하는 서비스 로케이터형 DI라 설정이 가볍고 KMP를 지원하지만, 바인딩 누락이 실행 중에야 드러난다. 화면 수가 많고 모듈 경계를 엄격히 검증하고 싶으면 Hilt, 작은 앱·KMP 공유 코드면 Koin이 흔한 선택이다.

## 설치
KSP로 어노테이션 처리를 한다(`app/build.gradle.kts`):

```kotlin
plugins {
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}
dependencies {
    implementation("com.google.dagger:hilt-android:2.60.1")
    ksp("com.google.dagger:hilt-compiler:2.60.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.4.0") // Compose의 hiltViewModel()
}
```

루트 `build.gradle.kts` 또는 버전 카탈로그에 `com.google.dagger.hilt.android` Gradle 플러그인 버전(2.60.1)을 선언한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@HiltAndroidApp` | `Application`에 붙여 Hilt 코드 생성을 시작하는 진입점 |
| `@AndroidEntryPoint` | Activity·Fragment·Service 등에 필드/생성자 주입을 허용 |
| `@Inject constructor` | 생성자 주입 대상 표시. 가장 단순한 바인딩 방법 |
| `@Module` + `@InstallIn` | 직접 생성할 수 없는 타입(인터페이스, 외부 라이브러리 객체)의 바인딩을 어느 컴포넌트에 둘지 지정 |
| `@Binds` / `@Provides` | 인터페이스→구현 연결 / 팩토리 함수로 객체 생성 |
| `SingletonComponent` | 앱 수명 컴포넌트. `@Singleton` 스코프와 짝 |
| `@HiltViewModel` | ViewModel에 생성자 주입. `hiltViewModel()` 또는 `by viewModels()`로 획득 |
| `@Qualifier` | 같은 타입의 바인딩을 이름으로 구분 |
| `@EntryPoint` | Hilt가 관리하지 않는 클래스(ContentProvider 등)에서 그래프에 접근 |

## 기본 사용법
```kotlin
@HiltAndroidApp
class App : Application()

interface UserRepository { suspend fun name(): String }

class UserRepositoryImpl @Inject constructor(
    private val api: UserApi,
) : UserRepository { override suspend fun name() = api.me().name }

@Module @InstallIn(SingletonComponent::class)
abstract class DataModule {
    @Binds abstract fun repo(impl: UserRepositoryImpl): UserRepository
}

@HiltViewModel
class ProfileViewModel @Inject constructor(repo: UserRepository) : ViewModel()

@AndroidEntryPoint
class MainActivity : ComponentActivity() { /* setContent { ProfileScreen() } */ }

@Composable
fun ProfileScreen(vm: ProfileViewModel = hiltViewModel()) { /* ... */ }
```

외부 라이브러리 객체는 `@Provides`로 만든다.

```kotlin
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton fun okHttp(): OkHttpClient = OkHttpClient()
}
```

## 자주 쓰는 패턴
- **Retrofit/Room 제공 모듈**: `@Provides @Singleton`으로 `Retrofit`, `AppDatabase`, DAO를 노출하고 Repository는 `@Binds`로 인터페이스에 연결한다.
- **Dispatcher 주입**: `@Qualifier annotation class IoDispatcher`로 `CoroutineDispatcher`를 주입하면 테스트에서 교체하기 쉽다([Kotlin Coroutines](/develop-wiki/mobile/android/kotlin-coroutines/)).
- **ViewModel 인자**: 화면 인자는 `SavedStateHandle`을 생성자에 받으면 Hilt가 채워 준다.
- **WorkManager 연동**: Worker에 `@HiltWorker` + `@AssistedInject`를 쓴다([WorkManager](/develop-wiki/mobile/android/workmanager/)).
- **테스트 교체**: `hilt-android-testing`의 `@HiltAndroidTest`, `@TestInstallIn`으로 모듈을 가짜로 바꾼다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 팀원이 만드는 중·대형 Android 앱, 바인딩 누락을 빌드에서 잡고 싶을 때, Jetpack(ViewModel·Navigation·WorkManager)과 통합할 때.
- 피할 때: 빌드 시간(KSP 처리)이 부담되는 아주 작은 앱, Kotlin Multiplatform에서 iOS와 그래프를 공유해야 할 때(Koin·kotlin-inject 검토), 수동 생성자 주입으로 충분한 경우.

## 공식 문서
- [Hilt 시작하기](https://developer.android.com/training/dependency-injection/hilt-android) · [Hilt 사이트](https://dagger.dev/hilt/) · [Jetpack과 Hilt](https://developer.android.com/training/dependency-injection/hilt-jetpack) · [Koin](https://insert-koin.io)

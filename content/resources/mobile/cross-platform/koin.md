---
name: Koin
url: https://insert-koin.io
docs: https://insert-koin.io/docs/quickstart/kotlin
repo: https://github.com/InsertKoinIO/koin
stars: 10028
domain: mobile
category: cross-platform
description: Kotlin 용 경량 의존성 주입 프레임워크. 코드 생성 없이 DSL 로 모듈을 선언하며 Android, Compose, Ktor, Kotlin Multiplatform 을 지원한다.
pricing: oss
tags: [kotlin-multiplatform, dependency-injection, android, compose]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Koin 은 `module { single { ... } }` 같은 Kotlin DSL 로 의존성을 선언하고 런타임에 해석하는 서비스 로케이터 겸 DI 프레임워크다. 어노테이션 프로세서가 필요 없어 설정이 가볍고, Kotlin Multiplatform 공통 코드에서도 쓸 수 있다. 컴파일 타임 검증이 필요하면 Dagger/Hilt(안드로이드 전용) 또는 Koin 의 컴파일 타임 도구(Koin Annotations)를 검토한다.

- 최신 릴리스 **4.2.2**(2026-06-15), Apache-2.0.
- [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/) 에서는 `koin-core`, Compose Multiplatform 에서는 `koin-compose` 계열 아티팩트를 쓴다(그룹 `io.insert-koin`).

## 설치
```kotlin
// commonMain 의존성 (버전은 BOM 또는 4.2.2 로 통일)
implementation("io.insert-koin:koin-core:4.2.2")
// Compose 사용 시
implementation("io.insert-koin:koin-compose:4.2.2")
```
Android 전용 기능(`androidContext`)은 `koin-android` 를 추가한다. 정확한 아티팩트 구성은 공식 설정 문서를 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `module { }` | 정의(definition)를 모으는 단위 |
| `single` / `factory` | 싱글톤 / 요청마다 새 인스턴스 |
| `get()` | 모듈 정의 안에서 다른 의존성 해석 |
| `startKoin { modules(...) }` | 컨테이너 시작 |
| `by inject()` / `get<T>()` | 사용처에서 주입 |
| `KoinComponent` | 일반 클래스에서 `inject` 사용 |
| `koinInject<T>()` | Compose 에서 의존성 가져오기 |
| `verify()` | 모듈 정의의 누락된 의존성을 테스트에서 검사 |

## 기본 사용법
```kotlin
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.koin.core.context.startKoin
import org.koin.dsl.module

interface Repo { fun load(): String }
class RepoImpl : Repo { override fun load() = "data" }
class Presenter(private val repo: Repo) { fun show() = repo.load() }

val appModule = module {
    single<Repo> { RepoImpl() }
    factory { Presenter(get()) }
}

class Screen : KoinComponent {
    private val presenter: Presenter by inject()
    fun render() = presenter.show()
}

fun main() {
    startKoin { modules(appModule) }
    println(Screen().render())
}
```

## 자주 쓰는 패턴
- **KMP 초기화.** 공통 `initKoin()` 함수를 만들고 Android `Application`, iOS 진입점에서 각각 호출한다. 플랫폼 차이는 `expect/actual` 모듈로 분리한다.
- **ViewModel 주입.** Koin 의 viewModel 정의/Compose 통합 API 로 ViewModel 을 생성한다(아티팩트 이름은 버전 문서 확인).
- **테스트 교체.** 테스트용 모듈을 만들어 `loadKoinModules` 로 덮어쓰거나 `checkModules`/`verify` 로 그래프를 검증한다.
- **스코프.** 화면·세션 단위 객체는 `scope` 로 수명을 제한한다.
- **런타임 실패 인지.** 정의 누락은 실행 중에 발견되므로 CI 에서 `verify` 테스트를 돌린다.

## 언제 쓰나 / 피할 때
- 쓸 때: KMP·Compose 앱에서 간단한 DI 가 필요할 때, 코드 생성을 피하고 싶을 때.
- 피할 때(대안): 컴파일 타임 보장이 필수인 대형 안드로이드 앱은 Hilt. 소규모는 수동 생성자 주입.

## 공식 문서
- [Kotlin 퀵스타트](https://insert-koin.io/docs/quickstart/kotlin) · [GitHub](https://github.com/InsertKoinIO/koin)

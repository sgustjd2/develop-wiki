---
name: Kotlin Coroutines (kotlinx.coroutines)
url: https://kotlinlang.org/docs/coroutines-overview.html
docs: https://kotlinlang.org/docs/coroutines-guide.html
repo: https://github.com/Kotlin/kotlinx.coroutines
stars: 13818
domain: mobile
category: android
description: Kotlin의 구조적 동시성 라이브러리. suspend 함수·코루틴 스코프·Flow로 비동기 작업과 데이터 스트림을 다루며, Android의 Jetpack 라이브러리가 기본 비동기 모델로 쓴다.
pricing: oss
tags: [async, concurrency, flow, coroutines]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
kotlinx.coroutines는 Kotlin 언어의 `suspend` 기능 위에 코루틴 빌더(`launch`, `async`), 디스패처, 취소, 그리고 콜드 스트림 `Flow`/핫 스트림 `StateFlow`·`SharedFlow`를 제공하는 JetBrains 공식 라이브러리다. 부모 스코프가 끝나면 자식 작업도 함께 취소되는 **구조적 동시성**이 핵심이다.

- 최신 안정판 **1.11.0**(2026-05-08, Kotlin 2.2.20 기반 빌드). Apache-2.0. JVM·Android·Native·JS·Wasm 멀티플랫폼.
- Android에서는 `viewModelScope`, `lifecycleScope`, Room·DataStore·Paging이 모두 코루틴·Flow API를 노출한다.
- 언어는 [Kotlin](/develop-wiki/languages/kotlin/).

## 설치
```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.11.0")
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `suspend` 함수 | 스레드를 막지 않고 일시 중단될 수 있는 함수 |
| `CoroutineScope` | 코루틴의 수명 범위. 스코프 취소 시 자식 모두 취소 |
| `launch` / `async` | 결과 없는 작업 / `Deferred` 결과를 `await()` 하는 작업 |
| Dispatcher | `Dispatchers.Main`(UI), `IO`(블로킹 I/O), `Default`(CPU 연산) |
| `withContext` | 블록을 다른 디스패처에서 실행하고 결과를 돌려받음 |
| `Job` / `SupervisorJob` | 작업 핸들. Supervisor는 자식 하나의 실패가 형제를 취소하지 않음 |
| `Flow` | 수집할 때 실행되는 콜드 비동기 스트림. `map`·`filter`·`combine` 연산자 |
| `StateFlow` | 항상 현재 값을 가진 핫 스트림. UI 상태 노출에 사용 |
| `SharedFlow` | 여러 구독자에게 이벤트를 방송하는 핫 스트림 |
| `stateIn` / `shareIn` | 콜드 Flow를 스코프 안에서 핫 스트림으로 변환 |

## 기본 사용법
```kotlin
@OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class) // debounce, mapLatest
class SearchViewModel(private val repo: SearchRepository) : ViewModel() {
    private val query = MutableStateFlow("")

    val results: StateFlow<List<Item>> = query
        .debounce(300)
        .distinctUntilChanged()
        .mapLatest { q -> if (q.isBlank()) emptyList() else repo.search(q) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun onQueryChange(q: String) { query.value = q }
}

class SearchRepository(private val api: Api) {
    suspend fun search(q: String): List<Item> = withContext(Dispatchers.IO) { api.search(q) }
}
```

병렬 호출과 테스트.

```kotlin
suspend fun loadHome(api: Api) = coroutineScope {
    val user = async { api.user() }
    val feed = async { api.feed() }
    Home(user.await(), feed.await())
}

@Test fun loadsHome() = runTest {
    val home = loadHome(FakeApi())
    assertEquals("kim", home.user.name)
}
```

## 자주 쓰는 패턴
- **디스패처는 저장소 계층에서.** 호출하는 쪽이 스레드를 신경 쓰지 않도록 `withContext(Dispatchers.IO)`를 데이터 계층 함수 안에 둔다(main-safe).
- **`GlobalScope` 금지.** 수명이 분명한 스코프(`viewModelScope`, 주입받은 스코프)를 쓴다.
- **최신 요청만 유지.** 검색어처럼 연속 입력은 `mapLatest`/`collectLatest`로 이전 작업을 취소한다.
- **예외 처리.** `launch` 안의 예외는 부모로 전파된다. 개별 작업 실패를 격리하려면 `supervisorScope`, Flow는 `catch` 연산자.
- **취소 협조.** CPU 루프에서는 `ensureActive()`나 `yield()`를 호출해 취소에 반응하게 한다. 1.11부터 `CoroutineDispatcher`를 컨텍스트 키로 쓰는 방식은 deprecated(`ContinuationInterceptor` 사용).

## 언제 쓰나 / 피할 때
- 쓸 때: Android·KMP의 모든 비동기 작업, 콜백 API를 `suspendCancellableCoroutine`·`callbackFlow`로 감쌀 때.
- 피할 때(대안): 기존 RxJava 코드가 많으면 `kotlinx-coroutines-rx3` 브리지로 점진 이전한다. 오래 걸리는 백그라운드 작업(앱 종료 후에도 실행)은 코루틴이 아니라 WorkManager가 맡는다.

## 공식 문서
- [코루틴 가이드](https://kotlinlang.org/docs/coroutines-guide.html) · [Flow](https://kotlinlang.org/docs/flow.html) · [API 레퍼런스](https://kotlinlang.org/api/kotlinx.coroutines/)
- [Android의 코루틴 모범 사례](https://developer.android.com/kotlin/coroutines/coroutines-best-practices) · [Android의 Flow](https://developer.android.com/kotlin/flow)

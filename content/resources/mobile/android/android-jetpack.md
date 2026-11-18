---
name: Android Jetpack
url: https://developer.android.com/jetpack
docs: https://developer.android.com/jetpack/androidx/explorer
repo: https://github.com/androidx/androidx
stars: 6140
domain: mobile
category: android
description: Google이 제공하는 AndroidX 라이브러리 모음. ViewModel·Lifecycle, Room, Navigation 등 Android 앱 아키텍처의 기본 부품을 버전별로 독립 배포한다.
pricing: oss
tags: [androidx, architecture, viewmodel, room, navigation]
languages: [kotlin, java]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Android Jetpack은 `androidx.*` 패키지로 배포되는 라이브러리 묶음이다. OS 버전과 분리돼 Google Maven에서 개별 버전으로 받으며, 생명주기·상태 보존·로컬 DB·화면 이동처럼 거의 모든 앱이 필요한 문제를 표준화한다. 이 항목은 아키텍처의 핵심인 **Lifecycle/ViewModel, Room, Navigation**을 묶어 정리한다.

| 라이브러리 | 최신 안정 버전 (2026-11-18 확인) |
| --- | --- |
| `androidx.lifecycle` (ViewModel 등) | 2.11.0 |
| `androidx.room` (Room 2.x) | 2.8.5 |
| `androidx.room3` (Room 3.0, 2026-07 안정화) | 3.0.3 |
| `androidx.navigation` (Navigation 2, Compose 포함) | 2.10.2 |
| `androidx.navigation3` (Navigation 3) | 1.2.1 |

언어는 [Kotlin](/develop-wiki/languages/kotlin/)(대부분 Java에서도 사용 가능, 단 Room 3은 Kotlin 코드 생성 전용).

## 설치
```kotlin
// app/build.gradle.kts
plugins { id("com.google.devtools.ksp") }
dependencies {
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.11.0")
    implementation("androidx.room3:room3-runtime:3.0.3")
    ksp("androidx.room3:room3-compiler:3.0.3")
    implementation("androidx.navigation3:navigation3-runtime:1.2.1")
    implementation("androidx.navigation3:navigation3-ui:1.2.1")
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ViewModel` | 화면 상태를 보관. 화면 회전 같은 구성 변경에도 유지되고 `viewModelScope`로 코루틴 실행 |
| `SavedStateHandle` | 프로세스 종료 후 복원이 필요한 작은 상태 저장 |
| Lifecycle | `STARTED`/`RESUMED` 같은 상태를 노출. Compose에서는 `collectAsStateWithLifecycle` |
| Room `@Entity` / `@Dao` / `@Database` | SQLite 테이블·쿼리·DB 진입점을 어노테이션으로 선언, 컴파일 시 SQL 검증 |
| Room 3.0 | 패키지 `androidx.room3`. KSP 필수, DAO는 `suspend` 또는 `Flow` 반환, `SQLiteDriver` 기반으로 KMP·웹(JS/Wasm) 지원 |
| Navigation 2 | `NavHost` + 문자열/타입 안전 경로 기반 그래프 |
| Navigation 3 | 개발자가 소유한 back stack(`SnapshotStateList`)을 `NavDisplay`가 관찰해 화면을 그리는 Compose 전용 방식 |

## 기본 사용법
Room 3 DAO와 ViewModel, Navigation 3를 연결한 최소 예.

```kotlin
@Entity data class Todo(@PrimaryKey(autoGenerate = true) val id: Long = 0, val title: String)

@Dao interface TodoDao {
    @Query("SELECT * FROM Todo ORDER BY id DESC") fun observeAll(): Flow<List<Todo>>
    @Insert suspend fun insert(todo: Todo)
}

class TodoViewModel(private val dao: TodoDao) : ViewModel() {
    val todos: StateFlow<List<Todo>> = dao.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    fun add(title: String) = viewModelScope.launch { dao.insert(Todo(title = title)) }
}
```

```kotlin
data object TodoList
data class TodoDetail(val id: Long)

@Composable
fun AppNav() {
    val backStack = remember { mutableStateListOf<Any>(TodoList) }
    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = { key ->
            when (key) {
                is TodoList -> NavEntry(key) { Button(onClick = { backStack.add(TodoDetail(1)) }) { Text("상세") } }
                is TodoDetail -> NavEntry(key) { Text("항목 ${key.id}") }
                else -> NavEntry(Unit) { Text("알 수 없는 화면") }
            }
        },
    )
}
```

## 자주 쓰는 패턴
- **UI 상태는 `StateFlow` 하나로.** ViewModel이 `stateIn(..., WhileSubscribed(5_000))`으로 노출하고 화면은 `collectAsStateWithLifecycle()`로 수집한다.
- **Room 스키마 내보내기.** Room Gradle 플러그인(`id("androidx.room3")`)과 `room3 { schemaDirectory("$projectDir/schemas") }`로 스키마 JSON을 저장소에 커밋해 자동 마이그레이션에 쓴다.
- **Room 2 → 3 이전.** 패키지·좌표가 달라 두 버전을 한 앱에 공존시킬 수 있다. `runInTransaction` → `withWriteTransaction`, Cursor 쿼리 → `useReaderConnection` 으로 바뀐다.
- **Navigation 3 선택 기준.** 적응형(리스트-상세) 레이아웃과 back stack 직접 제어가 필요하면 Navigation 3, 기존 `NavHost` 코드가 많으면 Navigation 2 유지.

## 언제 쓰나 / 피할 때
- 쓸 때: 사실상 모든 네이티브 Android 앱. Google의 [앱 아키텍처 가이드](https://developer.android.com/topic/architecture)가 이 라이브러리들을 전제로 한다.
- 피할 때(대안): 로컬 DB를 iOS와 공유하려면 Room 3(KMP)이나 SQLDelight를 [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/)에서 쓴다.

## 공식 문서
- [Jetpack 라이브러리 탐색기](https://developer.android.com/jetpack/androidx/explorer) · [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [Room 가이드](https://developer.android.com/training/data-storage/room) · [Room 3 릴리스 노트](https://developer.android.com/jetpack/androidx/releases/room3) · [Navigation 3](https://developer.android.com/guide/navigation/navigation-3)

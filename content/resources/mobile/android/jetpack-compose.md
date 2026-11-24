---
name: Jetpack Compose
url: https://developer.android.com/compose
docs: https://developer.android.com/develop/ui/compose
repo: https://github.com/androidx/androidx
stars: 6149
domain: mobile
category: android
description: Android의 공식 선언형 UI 툴킷. Kotlin 함수(@Composable)로 화면을 기술하고 상태 변화에 따라 다시 그리며, 새 Android 앱 UI의 기본 선택지다.
pricing: oss
tags: [ui, declarative, android, material3]
languages: [kotlin]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Jetpack Compose는 XML 레이아웃과 `View` 대신 `@Composable` Kotlin 함수로 UI를 만드는 Android 툴킷이다. 상태가 바뀌면 그 상태를 읽은 컴포저블만 다시 실행(recomposition)한다. Material 3 컴포넌트, 애니메이션, 미리보기, 테스트 API가 함께 제공된다.

- 이 문서는 **Compose BOM 2026.09.00** 기준이다(포함: `compose-ui` 1.12.x, `material3` 1.4.0). Apache-2.0, AndroidX 저장소에서 개발.
- 같은 API를 iOS·데스크톱·웹으로 넓힌 것이 [Compose Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/)이다. 언어는 [Kotlin](/develop-wiki/languages/kotlin/).

## 설치
Android Studio의 **Empty Activity** 템플릿이 Compose 프로젝트를 만든다. 직접 추가할 때(`app/build.gradle.kts`):

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")   // Kotlin 2.0+ Compose 컴파일러 플러그인
}
android { buildFeatures { compose = true } }
dependencies {
    val bom = platform("androidx.compose:compose-bom:2026.09.00")
    implementation(bom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.13.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
    androidTestImplementation(bom)
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

BOM을 쓰면 개별 Compose 라이브러리 버전을 적지 않아도 서로 맞는 버전이 선택된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@Composable` | UI를 내보내는 함수. 다른 컴포저블 안에서만 호출 가능 |
| Recomposition | 읽은 상태가 바뀌면 해당 컴포저블을 다시 실행 |
| `remember` / `rememberSaveable` | 재구성 사이 값 유지 / 화면 회전·프로세스 재생성까지 유지 |
| `mutableStateOf` | 관찰 가능한 상태. 값이 바뀌면 읽은 곳을 다시 그림 |
| State hoisting | 상태를 호출자로 올리고 `value` + `onValueChange`를 내려 재사용성 확보 |
| `Modifier` | 크기·여백·클릭·그리기를 체이닝으로 지정. 순서가 의미를 가짐 |
| Layout | `Column`, `Row`, `Box`, `LazyColumn`(지연 목록), `Scaffold` |
| Side effect | `LaunchedEffect`, `DisposableEffect`, `rememberCoroutineScope` |
| `CompositionLocal` | 트리 아래로 테마·의존성을 암묵적으로 전달 (`MaterialTheme`) |

## 기본 사용법
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { MaterialTheme { Counter() } }
    }
}

@Composable
fun Counter(modifier: Modifier = Modifier) {
    var count by rememberSaveable { mutableIntStateOf(0) }
    Column(modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("탭 ${count}회", style = MaterialTheme.typography.headlineSmall)
        Button(onClick = { count++ }) { Text("더하기") }
    }
}

@Preview(showBackground = true)
@Composable
private fun CounterPreview() = MaterialTheme { Counter() }
```

## 자주 쓰는 패턴
- **ViewModel 상태 수집.** `val ui by viewModel.uiState.collectAsStateWithLifecycle()` — 화면이 보이지 않으면 수집을 멈춘다([Android Jetpack](/develop-wiki/mobile/android/android-jetpack/)의 lifecycle-runtime-compose).
- **목록은 `LazyColumn` + `key`.** `items(list, key = { it.id })`로 항목 식별자를 주면 재정렬 시 상태가 섞이지 않는다.
- **비싼 계산은 `remember(key)` / `derivedStateOf`.** 자주 바뀌는 상태에서 파생값을 만들 때 불필요한 재구성을 줄인다.
- **테스트.** `createComposeRule()`로 `onNodeWithText("더하기").performClick()` 후 `assertIsDisplayed()`.
- **기존 View와 혼용.** View 안에 `ComposeView`, Compose 안에 `AndroidView`.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 Android 앱·화면, Wear OS·Android TV UI, 디자인 시스템을 코드로 관리할 때.
- 피할 때(대안): 대규모 XML View 앱은 화면 단위로 점진 이전한다. iOS까지 한 코드로 만들려면 [Compose Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/)이나 [Flutter](/develop-wiki/mobile/cross-platform/flutter/).

## 공식 문서
- [Compose 개요](https://developer.android.com/develop/ui/compose) · [BOM 매핑](https://developer.android.com/develop/ui/compose/bom) · [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [Compose 테스트](https://developer.android.com/develop/ui/compose/testing) · [Compose 릴리스 노트](https://developer.android.com/jetpack/androidx/releases/compose)

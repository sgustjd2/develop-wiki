---
name: Coil
url: https://coil-kt.github.io/coil/
docs: https://coil-kt.github.io/coil/getting_started/
repo: https://github.com/coil-kt/coil
stars: 11968
domain: mobile
category: android
description: Kotlin 코루틴 기반 이미지 로딩 라이브러리. Coil 3부터 Compose Multiplatform(Android·iOS·데스크톱·웹)을 지원하며 Compose의 AsyncImage로 쓴다.
pricing: oss
tags: [image-loading, compose, coroutines, kotlin-multiplatform]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Coil(Coroutine Image Loader)은 원격·로컬 이미지를 비동기로 불러와 메모리·디스크에 캐시하고 화면에 표시하는 라이브러리다. 코루틴과 Kotlin을 중심으로 설계돼 가볍고, Jetpack Compose의 `AsyncImage` 컴포저블이 기본 진입점이다. Glide·Picasso의 현대적 대안으로 쓰인다.

- 이 문서는 **Coil 3.6.3** 기준이다(Maven Central 최신, Apache-2.0). 아티팩트 그룹은 `io.coil-kt.coil3`이다. Coil 2.x의 `io.coil-kt:coil-compose`와 패키지 이름이 다르다.
- Coil 3은 **네트워크 엔진을 별도 아티팩트로 분리**했다. 원격 URL을 불러오려면 `coil-network-okhttp`(또는 Ktor)를 반드시 추가해야 한다.

## 설치
```kotlin
dependencies {
    implementation("io.coil-kt.coil3:coil-compose:3.6.3")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.6.3") // http(s) URL 로딩에 필요
}
```
GIF·SVG·비디오 프레임은 `coil-gif`, `coil-svg`, `coil-video` 같은 별도 모듈을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `AsyncImage` | URL·파일·리소스를 받아 그리는 컴포저블 |
| `SubcomposeAsyncImage` / `rememberAsyncImagePainter` | 로딩·오류 상태별 UI 지정 / Painter로 직접 사용 |
| `ImageLoader` | 캐시·네트워크·디코더 설정을 담은 싱글턴 |
| `ImageRequest` | 모델, 크기, 변환, 캐시 정책 등 요청 단위 옵션 |
| Memory / Disk cache | 메모리 캐시와 디스크 캐시. 기본 크기는 자동 계산 |
| `SingletonImageLoader` | 앱 전역 로더를 지정하는 팩토리 |
| Fetcher / Decoder / Interceptor | 새 데이터 타입·형식·요청 가공을 확장하는 지점 |

## 기본 사용법
```kotlin
@Composable
fun Avatar(url: String) {
    AsyncImage(
        model = url,
        contentDescription = "프로필 사진",
        contentScale = ContentScale.Crop,
        modifier = Modifier.size(64.dp).clip(CircleShape),
    )
}
```

요청 옵션이 필요하면 `ImageRequest`를 쓴다.

```kotlin
AsyncImage(
    model = ImageRequest.Builder(LocalPlatformContext.current)
        .data(url)
        .crossfade(true)
        .build(),
    contentDescription = null,
)
```

## 자주 쓰는 패턴
- **플레이스홀더/오류 이미지**: `placeholder`, `error` 파라미터에 `Painter`를 넘긴다.
- **전역 설정**: `SingletonImageLoader.setSafe { ctx -> ImageLoader.Builder(ctx)... .build() }`로 캐시 크기·네트워크 클라이언트를 지정하고, 앱의 `OkHttpClient`를 공유한다([Retrofit + OkHttp](/develop-wiki/mobile/android/retrofit-okhttp/)).
- **목록 성능**: `LazyColumn`에서 `AsyncImage`에 고정 크기 Modifier를 주면 디코딩 크기를 요청 크기로 줄인다.
- **미리보기·테스트**: `LocalAsyncImagePreviewHandler`로 Preview에서 가짜 이미지를 표시한다.
- **View 시스템**: 레거시 화면은 `coil-android` 계열 확장(`ImageView.load(url)`)을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Compose 앱, Kotlin Multiplatform에서 이미지 로딩 코드를 공유할 때.
- 피할 때(대안): 이미 Glide 파이프라인과 커스텀 모듈이 깊게 박힌 대형 View 기반 앱(마이그레이션 비용), Java 전용 코드베이스.

## 공식 문서
- [시작하기](https://coil-kt.github.io/coil/getting_started/) · [Compose](https://coil-kt.github.io/coil/compose/) · [Coil 2→3 업그레이드](https://coil-kt.github.io/coil/upgrading_to_coil3/)

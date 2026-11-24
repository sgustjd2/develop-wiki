---
name: Retrofit + OkHttp
url: https://lysine.dev/retrofit/
docs: https://lysine.dev/retrofit/
repo: https://github.com/square/retrofit
stars: 43944
domain: mobile
category: android
description: OkHttp는 HTTP 클라이언트, Retrofit은 그 위에서 REST API를 어노테이션 인터페이스로 선언하게 해 주는 타입 안전 래퍼. Android 네트워킹의 사실상 표준 조합이다.
pricing: oss
tags: [http, rest, networking, okhttp, retrofit]
languages: [kotlin, java]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
**OkHttp**는 연결 풀링, HTTP/2, TLS, 캐시, 재시도를 처리하는 HTTP 클라이언트이고, **Retrofit**은 `@GET`·`@POST` 같은 어노테이션이 붙은 인터페이스를 런타임에 구현해 OkHttp 호출로 바꿔 주는 라이브러리다. 직렬화는 컨버터(kotlinx.serialization, Moshi, Gson 등)에 맡긴다.

- 이 문서는 **Retrofit 3.0.0**, **OkHttp 5.5.1**(Maven Central 최신) 기준이다. 둘 다 Apache-2.0. OkHttp 5는 Android 5.0(API 21)+, Java 8+가 필요하다.
- 문서 사이트는 `square.github.io`에서 `lysine.dev`로 옮겨 가는 중이다(저장소 homepage 필드 기준). 기존 `square.github.io/retrofit` 주소는 확인 시점에 404였다.
- 대안: **Ktor Client**(Kotlin Multiplatform용), iOS 쪽은 `URLSession`. Android 전용이면 Retrofit이 가장 흔하다.

## 설치
```kotlin
dependencies {
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:3.0.0")
    implementation(platform("com.squareup.okhttp3:okhttp-bom:5.5.1"))
    implementation("com.squareup.okhttp3:okhttp")
    debugImplementation("com.squareup.okhttp3:logging-interceptor")
}
```
컨버터 아티팩트의 버전은 Retrofit 본체와 맞춘다(Maven Central에서 확인할 것). `AndroidManifest.xml`에 `INTERNET` 권한이 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 서비스 인터페이스 | HTTP 메서드·경로를 어노테이션으로 선언한 인터페이스 |
| `@Path` `@Query` `@Body` `@Header` | 경로 치환, 쿼리, 본문(컨버터로 직렬화), 헤더 |
| `suspend` 함수 | 코루틴에서 바로 호출. 실패 시 예외 |
| Converter | 응답/요청 본문을 객체로 변환 (kotlinx-serialization, Moshi, Gson …) |
| `Interceptor` | 요청·응답을 가로채는 훅. 인증 헤더, 로깅, 재시도 |
| `Authenticator` | 401 응답을 받았을 때 토큰을 갱신해 재요청 |
| 캐시 / 타임아웃 | `Cache`, `connectTimeout`·`readTimeout`·`callTimeout` |

## 기본 사용법
```kotlin
@Serializable data class Repo(val name: String)

interface GitHubApi {
    @GET("users/{user}/repos")
    suspend fun repos(@Path("user") user: String, @Query("per_page") n: Int = 30): List<Repo>
}

val client = OkHttpClient.Builder()
    .addInterceptor { chain ->
        chain.proceed(chain.request().newBuilder().header("Accept", "application/vnd.github+json").build())
    }
    .build()

val api = Retrofit.Builder()
    .baseUrl("https://api.github.com/")
    .client(client)
    .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
    .build()
    .create(GitHubApi::class.java)
```
`Json.asConverterFactory`는 `kotlinx.serialization.json.Json`의 확장이다. 호출은 코루틴 안에서 `api.repos("octocat")`로 한다.

## 자주 쓰는 패턴
- **인증 토큰 주입**: 인터셉터로 `Authorization` 헤더를 붙이고, 만료는 `Authenticator`에서 갱신한다.
- **오류 매핑**: `HttpException`(상태 코드)과 `IOException`(네트워크)을 Repository에서 도메인 오류로 변환한다.
- **로깅은 디버그만**: `HttpLoggingInterceptor`는 `debugImplementation`으로 두고 헤더의 민감 정보는 `redactHeader`로 가린다.
- **DI로 단일 인스턴스**: `OkHttpClient`는 앱 전체에서 공유해야 연결 풀·캐시 효과가 난다([Hilt](/develop-wiki/mobile/android/hilt/)).
- **이미지 로더와 공유**: [Coil](/develop-wiki/mobile/android/coil/)에 같은 `OkHttpClient`를 넘기면 풀을 재사용한다.
- **페이징**: 서버 페이지 응답을 [Paging 3](/develop-wiki/mobile/android/paging-3/)의 `PagingSource`에서 호출한다.

## 언제 쓰나 / 피할 때
- 쓸 때: JSON REST API를 호출하는 Android/JVM 앱, 인터셉터·캐시·인증 흐름을 세밀히 제어해야 할 때.
- 피할 때(대안): iOS와 코드를 공유하는 KMP 프로젝트(Ktor), GraphQL(Apollo Kotlin), 실시간 양방향 통신(OkHttp WebSocket은 가능하지만 gRPC·Ktor 검토).

## 공식 문서
- [Retrofit](https://lysine.dev/retrofit/) · [OkHttp](https://lysine.dev/okhttp/) · [OkHttp 저장소](https://github.com/square/okhttp)

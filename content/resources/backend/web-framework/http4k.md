---
name: http4k
url: https://www.http4k.org
docs: https://www.http4k.org/guide/reference/core/
repo: https://github.com/http4k/http4k
stars: 2794
domain: backend
category: web-framework
description: 서버와 클라이언트를 모두 'Request 를 받아 Response 를 돌려주는 함수'로 다루는 Kotlin HTTP 툴킷. 서버 엔진을 바꿔 끼우고 인메모리로 테스트하기 쉬운 함수형 스타일이다.
pricing: oss
tags: [kotlin, http, functional, routing, filter, testing]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
http4k 는 순수 Kotlin 으로 작성된 HTTP 툴킷이다. 핵심 아이디어는 서버와 클라이언트가 모두 `HttpHandler`(Request → Response 함수)라는 점이다. 라우팅·인증·로깅은 `Filter` 로 감싸 `then` 으로 조립하고, 같은 핸들러를 Jetty·Netty·Undertow·Apache·Helidon 같은 서버 엔진이나 서버리스, GraalVM 네이티브에 올릴 수 있다.

- 이 문서는 Maven Central 의 `http4k-core` **6.61.0.0** 기준이다. GitHub 에는 6.64.0.0 이 올라와 있는데, 2026-10-01 부터 Maven Central 은 약 분기마다, `maven.http4k.org` 는 1~2주 주기로 배포한다는 공지가 README 에 있다. 의존성은 BOM 으로 맞춘다.
- **라이선스 주의**: 커뮤니티 에디션(core 등)은 Apache-2.0 이다. `pro/` 디렉터리와 `org.http4k.pro` 아티팩트는 별도 상용 라이선스이고 Enterprise(LTS·지원)는 유료다. 저장소 라이선스 파일이 혼합이라 GitHub 가 SPDX 를 판별하지 못한다.
- 같은 Kotlin 의 대안: 코루틴 기반 [Ktor](/develop-wiki/backend/web-framework/ktor/), JVM 풀스택 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/), [Micronaut](/develop-wiki/backend/web-framework/micronaut/).

## 설치
Gradle(Kotlin DSL)에서 BOM 으로 버전을 맞춘 뒤 필요한 모듈을 고른다.
```kotlin
dependencies {
    implementation(platform("org.http4k:http4k-bom:6.61.0.0"))
    implementation("org.http4k:http4k-core")
    // 서버 엔진이 필요하면 예: implementation("org.http4k:http4k-server-jetty")
}
```
`http4k-core` 만으로도 JDK 내장 서버로 동작한다. 모듈 목록은 Maven Central 의 `org.http4k` 에서 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `HttpHandler` | `(Request) -> Response` 함수. 서버·클라이언트 공통 |
| `Filter` | 핸들러를 감싸는 횡단 관심사(인증, 로깅, 지연 측정). `Filter.then(handler)` 로 결합 |
| `routes` / `bind` | 경로·메서드와 핸들러를 묶는 라우팅 DSL. 중첩 가능 |
| `asServer` | 핸들러를 서버 엔진(`Jetty(8000)` 등)에 올림 |
| Lens | 요청·응답 값을 타입 안전하게 추출·주입하는 도구 |
| http4k-connect / http4k-ai | 클라우드·AI 백엔드 클라이언트와 Fake 구현 모음 |

## 기본 사용법
```kotlin
val app: HttpHandler = routes(
    "/hello/{name}" bind GET to { req: Request ->
        Response(OK).body("Hello, ${req.path("name")}!")
    },
    "/fail" bind POST to { Response(INTERNAL_SERVER_ERROR) }
)

fun main() {
    app.asServer(Jetty(8000)).start()   // http4k-server-jetty 모듈 필요
}
```
라우트에 맞지 않는 요청은 404 로 처리된다. 필터는 이렇게 붙인다.
```kotlin
val secured: HttpHandler =
    ServerFilters.BasicAuth("my realm", "user", "password").then(app)
```

## 자주 쓰는 패턴
- **인메모리 테스트**: 핸들러는 함수이므로 서버를 띄우지 않고 `app(Request(GET, "/hello/kim"))` 처럼 직접 호출해 검증한다.
- **서버 엔진 교체**: `asServer(Jetty(...))` 를 다른 엔진으로 바꿔 배포 환경에 맞춘다.
- **필터 체인**: 인증·로깅·CORS 같은 공통 기능을 `Filter` 로 만들어 `then` 으로 쌓는다.
- **클라이언트도 같은 타입**: 외부 API 호출 핸들러를 같은 `HttpHandler` 로 만들면 Fake 로 교체해 통합 테스트가 쉬워진다.

## 언제 쓰나 / 피할 때
- 쓸 때: 함수형 스타일과 서버 없는 빠른 테스트를 원하는 Kotlin 서비스, 서버리스·네이티브 이미지로도 배포할 때.
- 피할 때(대안): 어노테이션·DI·자동 구성이 풍부한 생태계가 필요하면 Spring Boot, 코루틴 중심 비동기 API 는 Ktor. 상용 pro 모듈이 필요한지 도입 전에 확인한다.

## 공식 문서
- [http4k 사이트](https://www.http4k.org) · [Core 레퍼런스](https://www.http4k.org/guide/reference/core/) · [배포 채널 안내](https://www.http4k.org/distribution/) · [저장소](https://github.com/http4k/http4k)

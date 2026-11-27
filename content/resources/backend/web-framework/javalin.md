---
name: Javalin
url: https://javalin.io
docs: https://javalin.io/documentation
repo: https://github.com/javalin/javalin
stars: 8380
domain: backend
category: web-framework
description: Jetty 위에 얹은 가벼운 Java·Kotlin 웹 프레임워크. 어노테이션 대신 람다 핸들러로 라우트를 정의하며 JSON·WebSocket·테스트 도구를 라이브러리 형태로 제공한다.
pricing: oss
tags: [jetty, lambda, rest, websocket, lightweight]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Javalin 은 [Java](/develop-wiki/languages/java/) 와 [Kotlin](/develop-wiki/languages/kotlin/) 양쪽을 같은 API 로 지원하는 웹 프레임워크로, "프레임워크라기보다 라이브러리"를 지향한다. 핸들러는 `ctx -> ...` 형태의 람다이고, 컨테이너나 어노테이션 스캔 없이 `Javalin.create(...)` 로 서버 객체를 만들어 `start(port)` 로 띄운다. 서버는 Jetty 이고 HTTP 와 WebSocket 을 다룬다.

현재 메이저는 7.x(최신 7.2.4, 2026-10)로, Java 17 이상과 Jetty 12 이상이 필요하며 라이선스는 Apache-2.0 이다. 7 에서는 라우트를 `Javalin.create()` 의 `config.routes` 안에서 정의해야 하고 `start()` 뒤에는 추가할 수 없다. 서블릿 패키지는 `javax.servlet.*` 에서 `jakarta.servlet.*` 로 바뀌었다. 6.x 에서 올라오면 마이그레이션 가이드를 먼저 읽는다.

## 설치
Gradle(Kotlin DSL):
```kotlin
dependencies {
    implementation("io.javalin:javalin:7.2.4")
    // Jackson, Logback, 테스트 도구를 한 번에 포함하는 묶음
    // implementation("io.javalin:javalin-bundle:7.2.4")
}
```
Maven 도 `io.javalin:javalin` 좌표를 쓴다. 핵심 모듈만으로는 JSON 매퍼(Jackson)가 따로 필요할 수 있으므로 처음에는 `javalin-bundle` 이 편하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Javalin.create { config -> }` | 서버 생성과 설정. 라우트는 `config.routes` 에 등록 |
| `Context` (`ctx`) | 요청·응답 객체. `pathParam`, `queryParam`, `bodyAsClass`, `json`, `status`, `result` |
| 경로 변수 | `{name}` 은 슬래시를 제외, `<name>` 은 슬래시 포함 |
| before / after | `config.routes.before(...)`, `after(...)`. 매칭된 요청에만 쓰려면 `beforeMatched`/`afterMatched` |
| `apiBuilder` | `path("/users") { get(...) }` 식 중첩 라우팅과 `crud()` |
| 예외·에러 핸들러 | `config.routes.exception(...)`, `config.routes.error(404, ...)`, `ForbiddenResponse` 같은 응답 예외 |
| JSON 매퍼 | 기본은 Jackson. `config.jsonMapper(...)` 로 교체(Gson 예제 제공) |

## 기본 사용법
Kotlin:
```kotlin
import io.javalin.Javalin

data class NewTodo(val title: String)
data class Todo(val id: Int, val title: String)

fun main() {
    val todos = mutableListOf<Todo>()

    Javalin.create { config ->
        config.routes.get("/") { ctx -> ctx.result("Hello World") }

        config.routes.get("/todos/{id}") { ctx ->
            val id = ctx.pathParam("id").toInt()
            val todo = todos.find { it.id == id }
            if (todo == null) ctx.status(404) else ctx.json(todo)
        }

        config.routes.post("/todos") { ctx ->
            val body = ctx.bodyAsClass(NewTodo::class.java)
            val todo = Todo(todos.size + 1, body.title)
            todos += todo
            ctx.status(201).json(todo)
        }
    }.start(7070)
}
```
Java 에서도 같은 형태다.
```java
var app = Javalin.create(config -> {
    config.routes.get("/", ctx -> ctx.result("Hello World"));
}).start(7070);
```
예제의 `todos` 는 동시 요청에서 안전하지 않은 단순 메모리 리스트이므로 실제 코드에서는 저장소 계층으로 바꾼다.

## 자주 쓰는 패턴
- **중첩 라우팅**: `config.routes.apiBuilder { path("/users") { get(UserController::getAllUsers); path("/{id}") { get(UserController::getUser) } } }`. `path()` 는 앞의 `/` 를 자동으로 붙인다.
- **에러 응답**: 예외로 `throw ForbiddenResponse("Off limits!")` 처럼 던지면 클라이언트가 JSON 을 받아들일 때 `title`, `status`, `type`, `details` 필드가 있는 JSON 이 나간다. 임의 예외는 `config.routes.exception(NullPointerException::class.java) { e, ctx -> ... }` 로 처리한다.
- **WebSocket**: `config.routes.ws("/websocket/{path}") { ws -> ws.onConnect {...}; ws.onMessage { ctx -> ctx.send(ctx.messageAsClass(User::class.java)) } }`. 경로는 고유해야 하고, 업그레이드 요청에는 `beforeMatched` 가 실행되지 않으므로 권한 검사는 `wsBeforeUpgrade` 에서 한다.
- **JSON 설정**: `config.jsonMapper(JavalinJackson().updateMapper { it.setSerializationInclusion(JsonInclude.Include.NON_NULL) })`.
- **테스트**: Javalin 은 라이브러리라 서버를 코드로 띄울 수 있다. `javalin-bundle` 에 포함된 테스트 도구의 `JavalinTest.test(app) { server, client -> client.get("/users").code }` 형태로 실제 소켓 없이 호출한다. 튜토리얼 예제는 6.x 기준이므로 7.x 에서는 API 이름을 확인한다.
- **업로드 주의**: 7.2.3 이하에서는 `uploadedFile.filename()` 이 클라이언트가 보낸 이름(`../` 포함 가능)을 그대로 돌려주므로 파일 저장 경로에 직접 쓰지 않는다. 이후 버전은 파일 이름만 돌려준다.

## 언제 쓰나 / 피할 때
- 쓸 때: 작은 REST API·내부 도구·마이크로서비스를 DI 컨테이너 없이 빠르게 만들 때, 같은 코드 스타일로 Java 와 Kotlin 을 섞을 때, 구조를 직접 정하고 싶을 때.
- 피할 때(대안): 자동 구성·데이터 접근·보안 생태계가 필요한 대형 서비스는 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/). 코루틴 중심 Kotlin 서버는 [Ktor](/develop-wiki/backend/web-framework/ktor/), 컴파일 시점 DI·네이티브 이미지가 목표이면 [Micronaut](/develop-wiki/backend/web-framework/micronaut/) 이나 [Quarkus](/develop-wiki/backend/web-framework/quarkus/) 가 맞다.

## 공식 문서
- [문서](https://javalin.io/documentation) · [테스트 튜토리얼](https://javalin.io/tutorials/testing) · [Javalin 6→7 마이그레이션](https://javalin.io/migration-guide-javalin-6-to-7)

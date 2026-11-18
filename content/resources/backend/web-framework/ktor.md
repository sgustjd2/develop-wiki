---
name: Ktor
url: https://ktor.io
docs: https://ktor.io/docs/welcome.html
repo: https://github.com/ktorio/ktor
stars: 14570
domain: backend
category: web-framework
description: JetBrains가 만든 코루틴 기반 Kotlin 서버·클라이언트 프레임워크. 플러그인을 골라 설치하는 방식으로 가벼운 Kotlin HTTP API를 만들 때 쓴다.
pricing: oss
tags: [coroutines, jetbrains, plugins, async]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ktor 는 JetBrains 가 관리하는 [Kotlin](/develop-wiki/languages/kotlin/) 비동기 웹 프레임워크로, 핸들러가 코루틴(`suspend`) 안에서 실행된다. 라우팅·직렬화·인증·CORS·검증 같은 기능은 모두 **플러그인**으로 분리돼 있고, 필요한 것만 `install(...)` 한다. 서버 엔진은 Netty·CIO·Jetty·Tomcat 중 고른다. 같은 프로젝트에 HTTP 클라이언트(`ktor-client`)도 있어 Kotlin Multiplatform 에서 공유된다.

현재 버전은 3.6.x(최신 3.6.1)다. 어노테이션·DI·자동 구성이 많은 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 와 달리 Kotlin DSL 코드로 구성을 명시적으로 적는다.

## 설치
프로젝트 생성기([start.ktor.io](https://start.ktor.io)), IntelliJ IDEA 의 Ktor 마법사, Ktor CLI 중 하나로 만든다.
```bash
brew install ktor          # Ktor CLI (Windows: winget install JetBrains.KtorCLI)
ktor new                   # 대화형으로 프로젝트·플러그인 선택
./gradlew run              # http://0.0.0.0:8080
```
직접 추가할 때는 `build.gradle.kts` 에 `io.ktor:ktor-server-core`, `ktor-server-netty`, `ktor-server-content-negotiation`, `ktor-serialization-kotlinx-json` 과 Kotlin serialization Gradle 플러그인을 넣는다. 공식 문서는 Ktor 버전 카탈로그(`ktorLibs.*`) 표기를 기본으로 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `embeddedServer` | 엔진·포트·모듈을 코드로 지정해 서버 시작. 설정 파일(`application.conf`/`yaml`) 방식도 있다 |
| `Application` 모듈 | `fun Application.module()` 확장 함수. 플러그인 설치와 라우팅을 묶는 단위 |
| 플러그인 | `install(ContentNegotiation)`, `install(StatusPages)`, `install(Authentication)` 등 |
| `routing { }` | `get`, `post`, `route("/todos") { ... }` DSL 로 라우트 트리 구성 |
| `call` | `ApplicationCall`. `call.parameters`, `call.receive<T>()`, `call.respond(...)` |
| kotlinx.serialization | `@Serializable` data class 와 `json()` 컨버터로 JSON 변환 |
| `testApplication` | 실제 소켓 없이 앱을 띄워 클라이언트로 호출하는 테스트 환경 |

## 기본 사용법
```kotlin
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import java.util.concurrent.ConcurrentHashMap

@Serializable data class NewTodo(val title: String)
@Serializable data class Todo(val id: Int, val title: String)

val todos = ConcurrentHashMap<Int, Todo>()

fun Application.module() {
    install(ContentNegotiation) { json() }
    routing {
        get("/todos/{id}") {
            val todo = call.parameters["id"]?.toIntOrNull()?.let { todos[it] }
                ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(todo)
        }
        post("/todos") {
            val input = call.receive<NewTodo>()
            val todo = Todo(todos.size + 1, input.title)
            todos[todo.id] = todo
            call.respond(HttpStatusCode.Created, todo)
        }
    }
}

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}
```

## 자주 쓰는 패턴
- **라우트 분리**: `fun Route.todoRoutes() { route("/todos") { ... } }` 확장 함수로 파일을 나누고 `routing { todoRoutes() }` 로 합친다.
- **미들웨어 역할**: 공통 처리는 `createApplicationPlugin` / `createRouteScopedPlugin` 으로 커스텀 플러그인을 만든다. 로깅 `CallLogging`, CORS `CORS`, 인증 `Authentication`(JWT·OAuth·세션) 플러그인이 제공된다.
- **검증**: `RequestValidation` 플러그인에 `validate<NewTodo> { if (it.title.isBlank()) ValidationResult.Invalid("title is required") else ValidationResult.Valid }` 를 등록하고, `StatusPages` 에서 `RequestValidationException` 을 400 으로 바꾼다.
- **DB 연동**: 공식 튜토리얼은 JetBrains 의 Exposed(`exposed-jdbc`·`exposed-dao`)로 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 에 연결하고, 리포지토리 메서드를 `suspend` 로 만든 뒤 `withContext(Dispatchers.IO)` 안에서 트랜잭션을 열어 블로킹 JDBC 호출이 요청 처리 스레드를 막지 않게 한다.
- **테스트**: `ktor-server-test-host` 의 `testApplication` 으로 모듈을 띄우고 내장 클라이언트로 호출한다.
  ```kotlin
  @Test fun create() = testApplication {
      application { module() }
      val client = createClient { install(ContentNegotiation) { json() } }
      val res = client.post("/todos") { contentType(ContentType.Application.Json); setBody(NewTodo("a")) }
      assertEquals(HttpStatusCode.Created, res.status)
  }
  ```
  테스트 클라이언트의 `ContentNegotiation` 은 클라이언트 쪽 플러그인(`io.ktor.client.plugins.contentnegotiation`)이다.

## 언제 쓰나 / 피할 때
- 쓸 때: Kotlin 코루틴으로 비동기 I/O 를 쓰는 가벼운 API 서버, Android·KMP 클라이언트와 모델·직렬화 코드를 공유할 때, 프레임워크 구성을 코드로 명시하고 싶을 때.
- 피할 때(대안): 트랜잭션·보안·배치·메시징까지 표준화된 통합이 필요한 대규모 JVM 서비스는 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/), 네이티브 이미지·빠른 기동이 우선인 JVM 서비스는 [Quarkus](/develop-wiki/backend/web-framework/quarkus/).

## 공식 문서
- [Welcome](https://ktor.io/docs/welcome.html) · [프로젝트 생성](https://ktor.io/docs/server-create-a-new-project.html) · [Routing](https://ktor.io/docs/server-routing.html) · [Serialization](https://ktor.io/docs/server-serialization.html) · [Request validation](https://ktor.io/docs/server-request-validation.html) · [Testing](https://ktor.io/docs/server-testing.html) · [DB 연동](https://ktor.io/docs/server-integrate-database.html)

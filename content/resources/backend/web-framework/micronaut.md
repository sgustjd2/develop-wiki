---
name: Micronaut
url: https://micronaut.io
repo: https://github.com/micronaut-projects/micronaut-core
stars: 6438
docs: https://docs.micronaut.io/latest/guide/
domain: backend
category: web-framework
description: 컴파일 타임 DI·AOP 로 시작 시간과 메모리를 줄인 JVM 마이크로서비스 프레임워크. Java·Kotlin·Groovy 와 GraalVM 네이티브를 지원한다.
pricing: oss
tags: [jvm, microservices, graalvm, compile-time-di]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Micronaut 은 리플렉션과 런타임 프록시 대신 컴파일 시점에 의존성 주입·AOP·설정 메타데이터를 생성한다. 그래서 시작이 빠르고 메모리가 적으며 GraalVM 네이티브 이미지와 잘 맞는다. HTTP 서버/클라이언트, 데이터 접근(Micronaut Data), 메시징(Kafka·RabbitMQ·NATS 등), 클라우드 연동 모듈을 BOM 으로 맞춰 배포한다.

현재 플랫폼 5.2.7(2026-11-18), 문서 최신판 5.2.x. Micronaut 5 는 JDK 25 를 기준으로 하며(Groovy 5, Kotlin 2.3 기준선), 4.10.x 도 병행 유지보수된다. Spring 계열 대안은 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/), 같은 컴파일 타임 접근은 [Quarkus](/develop-wiki/backend/web-framework/quarkus/) 다.

## 설치
```bash
sdk install micronaut          # SDKMAN 으로 mn CLI 설치
mn create-app hello-world      # Gradle 기본, --build maven 으로 Maven
cd hello-world && ./gradlew run
```
CLI 대신 [Micronaut Launch](https://launch.micronaut.io) 웹/`curl` 로도 프로젝트를 만든다. 5.x 는 JDK 25 기준이므로 JDK 버전을 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@Controller` | HTTP 컨트롤러. `@Get`, `@Post`, `@Body`, `@PathVariable` |
| `@Singleton` 등 | `jakarta.inject` 기반 빈, 컴파일 타임에 해석 |
| `@Serdeable` | Micronaut Serde 로 JSON 직렬화 대상 표시 |
| `@Valid` / `@Validated` | Bean Validation(`micronaut-validation`) 으로 요청 검증 |
| `@ServerFilter` | `@RequestFilter`/`@ResponseFilter` 메서드로 필터 작성 |
| `@Client` | 선언적 HTTP 클라이언트 |
| Micronaut Data | 컴파일 타임 리포지토리(JDBC/JPA/R2DBC) |

## 기본 사용법
```java
@Serdeable
record Todo(@NotBlank String title, boolean done) {}

@Controller("/todos")
class TodoController {
    private final Map<Long, Todo> todos = new ConcurrentHashMap<>();

    @Get("/{id}")
    Optional<Todo> read(@PathVariable Long id) {
        return Optional.ofNullable(todos.get(id));   // 비어 있으면 404
    }

    @Post
    @Status(HttpStatus.CREATED)
    Todo create(@Body @Valid Todo todo) {
        todos.put((long) (todos.size() + 1), todo);
        return todo;
    }
}
```
`@Valid` 를 쓰려면 validation 모듈이 클래스패스에 있어야 하고, 컨트롤러에는 `@Validated` 가 필요한 경우가 있다.

## 자주 쓰는 패턴
- **필터**: `@ServerFilter("/**")` 클래스에 `@RequestFilter` 메서드를 두면 라우트 실행 전에 호출된다. 구 `HttpServerFilter` 도 남아 있다.
- **DB**: Micronaut Data 의 `@JdbcRepository` 인터페이스로 CRUD 를 선언하고, 마이그레이션은 Flyway·Liquibase 모듈을 쓴다. 영속성 계층은 [Hibernate](/develop-wiki/backend/orm-query/hibernate-orm/) 도 선택 가능.
- **설정**: `application.yml` 과 환경 변수, `@ConfigurationProperties` 로 타입 안전한 설정.
- **네이티브**: GraalVM 로 네이티브 이미지를 만든다([GraalVM](/develop-wiki/backend/runtime-language/graalvm/)).
- **테스트**: `@MicronautTest` 로 임베디드 서버를 띄우고 `@Inject @Client("/") HttpClient client; client.toBlocking().retrieve(HttpRequest.GET("/todos/1"))` 로 호출한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 시작 시간·메모리가 중요한 JVM 마이크로서비스/서버리스, GraalVM 네이티브, Java·Kotlin·Groovy 를 섞는 팀.
- 피할 때(대안): 가장 넓은 생태계와 인력 풀이 필요하면 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/). 5.x 는 JDK 25 기준이라 구버전 JDK 환경이면 4.10.x 를 쓴다.

## 공식 문서
- [사용자 가이드](https://docs.micronaut.io/latest/guide/) · [Micronaut Launch](https://launch.micronaut.io) · [Guides](https://guides.micronaut.io)

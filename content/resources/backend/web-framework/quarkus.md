---
name: Quarkus
url: https://quarkus.io
docs: https://quarkus.io/guides/
repo: https://github.com/quarkusio/quarkus
stars: 16007
domain: backend
category: web-framework
description: 빌드 시점 처리로 기동 시간과 메모리를 줄인 Java 서버 프레임워크. Jakarta EE·MicroProfile API로 컨테이너·네이티브 이미지용 서비스를 만들 때 쓴다.
pricing: oss
tags: [jakarta-ee, microprofile, native-image, cloud-native]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Quarkus 는 Red Hat 이 주도하는 [Java](/develop-wiki/languages/java/) 서버 프레임워크로, 어노테이션 스캔·DI 그래프 구성 같은 작업을 런타임이 아니라 **빌드 시점**에 끝내 기동 시간과 메모리 사용을 줄인다. API 는 Jakarta REST(`@Path`), CDI(`@Inject`, `@ApplicationScoped`), Bean Validation, JPA 같은 표준을 따르고, 기능은 "확장(extension)"으로 추가한다. [GraalVM](/develop-wiki/backend/runtime-language/graalvm/)(Mandrel) 으로 네이티브 실행 파일을 만들 수 있고, [Kotlin](/develop-wiki/languages/kotlin/) 도 공식 지원한다.

현재 안정 버전은 **3.40.x**(LTS, 최신 3.40.1.2)이며 3.33 도 LTS 로 패치가 나온다. 4.0 은 2026-11 기준 CR(Release Candidate) 단계라 정식 버전이 아니다. JDK 17 이상이 필요하다.

[Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 와 같은 영역이며, Quarkus 쪽은 Jakarta/MicroProfile 표준 API 와 개발 모드(라이브 리로드·Dev Services)가 특징이다.

## 설치
```bash
# Quarkus CLI (SDKMAN, Homebrew, JBang 등으로 설치) 사용
quarkus create app org.acme:todo --extension='rest-jackson,hibernate-validator'
cd todo
quarkus dev              # 또는 ./mvnw quarkus:dev — http://localhost:8080, 코드 변경 즉시 반영
```
CLI 없이 Maven 플러그인(`mvn io.quarkus.platform:quarkus-maven-plugin:3.40.1.2:create`)이나 [code.quarkus.io](https://code.quarkus.io) 로도 만든다. 네이티브 빌드는 `quarkus build --native`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 확장 | `quarkus extension add <이름>` 으로 추가하는 기능 모듈(`rest`, `rest-jackson`, `hibernate-orm-panache`, `oidc` 등) |
| Quarkus REST | Jakarta REST 구현. `@Path`, `@GET`, `@POST`, `@PathParam`, 반환값 자동 JSON 직렬화(`rest-jackson`) |
| CDI(ArC) | 빌드 시점에 해석되는 DI. `@ApplicationScoped` 빈을 `@Inject` 또는 생성자로 주입 |
| 설정 | `application.properties` + `%dev.`/`%test.`/`%prod.` 프로파일 접두사, `@ConfigProperty` 주입 |
| 개발 모드 | `quarkus dev`. 핫 리로드, Dev UI(`/q/dev-ui`), 연속 테스트 |
| Dev Services | 개발·테스트에서 DB·Kafka 등 URL 을 지정하지 않으면 컨테이너를 자동으로 띄워 연결 |
| 네이티브 이미지 | GraalVM/Mandrel 로 AOT 컴파일한 단일 실행 파일 |

## 기본 사용법
```java
package org.acme;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Path("/todos")
public class TodoResource {
    public record NewTodo(@NotBlank String title) {}
    public record Todo(int id, String title) {}

    private static final Map<Integer, Todo> TODOS = new ConcurrentHashMap<>();

    @GET @Path("/{id}")
    public Todo get(@PathParam("id") int id) {
        Todo todo = TODOS.get(id);
        if (todo == null) throw new NotFoundException();
        return todo;
    }

    @POST
    public Response create(@Valid NewTodo input) {
        Todo todo = new Todo(TODOS.size() + 1, input.title());
        TODOS.put(todo.id(), todo);
        return Response.status(Response.Status.CREATED).entity(todo).build();
    }
}
```
`rest-jackson` 이 있으면 JSON 입출력이 자동 처리되고, `hibernate-validator` 확장이 있으면 `@Valid` 위반 시 400 과 검증 보고서가 응답된다.

## 자주 쓰는 패턴
- **계층 분리**: 비즈니스 로직은 `@ApplicationScoped` 서비스 빈에 두고 리소스에서 주입한다. 리소스는 기본적으로 싱글턴 스코프다.
- **필터(미들웨어 역할)**: Jakarta REST `ContainerRequestFilter`/`ContainerResponseFilter` 를 `@Provider` 로 등록하거나, Quarkus REST 의 `@ServerRequestFilter` 메서드 어노테이션을 쓴다. 인증은 `oidc`·`smallrye-jwt` 확장과 `@RolesAllowed`.
- **DB 연동**: `hibernate-orm-panache` + `jdbc-postgresql` 확장을 넣고 `PanacheEntity` 를 상속한 엔티티에서 `persist()`·`findById()` 를 쓴다. 쓰기 메서드에는 `@Transactional` 을 붙인다. ORM 자체는 [Hibernate ORM](/develop-wiki/backend/orm-query/hibernate-orm/) 이다. Docker·Podman 이 있으면 Dev Services 가 개발·테스트용 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 컨테이너를 띄운다.
- **리액티브**: Mutiny(`Uni`/`Multi`) 반환 타입과 Hibernate Reactive 로 논블로킹 스택을 구성할 수 있다. 블로킹 코드와 섞을 때는 실행 스레드(`@Blocking`/`@NonBlocking`) 규칙을 확인한다.
- **테스트**: `@QuarkusTest` 가 앱을 띄우고 REST Assured 로 호출한다. 빈 교체는 `@InjectMock` 등을 쓴다.
  ```java
  @QuarkusTest
  class TodoResourceTest {
      @Test void createRejectsBlank() {
          given().contentType("application/json").body("{\"title\":\"\"}")
              .when().post("/todos").then().statusCode(400);
      }
  }
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: 쿠버네티스·서버리스처럼 기동 시간과 메모리가 비용인 환경의 JVM 서비스, 네이티브 이미지 배포, Jakarta EE·MicroProfile 표준을 유지하면서 현대적 개발 모드를 원할 때.
- 피할 때(대안): Spring 생태계(Spring Security·Data·Batch 등)에 이미 깊이 의존하면 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/). 리플렉션·동적 클래스 로딩에 의존하는 라이브러리는 네이티브 빌드에서 추가 설정이 필요하다. Kotlin 코루틴 중심의 가벼운 서버는 [Ktor](/develop-wiki/backend/web-framework/ktor/).

## 공식 문서
- [Getting Started](https://quarkus.io/guides/getting-started) · [REST + JSON](https://quarkus.io/guides/rest-json) · [Validation](https://quarkus.io/guides/validation) · [Hibernate ORM with Panache](https://quarkus.io/guides/hibernate-orm-panache) · [Testing](https://quarkus.io/guides/getting-started-testing) · [Dev Services for DB](https://quarkus.io/guides/databases-dev-services) · [전체 가이드](https://quarkus.io/guides/)

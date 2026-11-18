---
name: Spring Boot
url: https://spring.io/projects/spring-boot
repo: https://github.com/spring-projects/spring-boot
stars: 81880
docs: https://docs.spring.io/spring-boot/index.html
domain: backend
category: web-framework
description: 자동 구성과 내장 서버로 Spring 애플리케이션을 바로 실행하게 해 주는 JVM 프레임워크. Java·Kotlin 엔터프라이즈 API 서버에 쓴다.
pricing: oss
tags: [spring, jvm, enterprise, di]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Spring Boot 는 Spring Framework 애플리케이션을 설정 파일 없이 바로 실행하게 해 주는 프레임워크다. 클래스패스에 있는 의존성을 보고 빈을 자동 구성(auto-configuration)하고, 톰캣 같은 서블릿 컨테이너를 내장해 `java -jar` 하나로 서버를 띄운다. "스타터" 의존성 하나가 관련 라이브러리 묶음을 가져온다.

현재 안정 버전은 **Spring Boot 4.1**(4.1.2)이며 Spring Framework 7 위에서 동작한다. Java 17 이상(27까지 호환)이 필요하고, 내장 컨테이너는 Tomcat 11 / Jetty 12.1(Servlet 6.1)이다. 4.x 는 모듈이 잘게 나뉘어 웹 MVC 스타터 이름이 `spring-boot-starter-webmvc` 가 됐다.

## 설치
[start.spring.io](https://start.spring.io) 에서 Spring Web MVC·Validation 을 골라 프로젝트를 받거나, 빌드 파일에 스타터를 추가한다.
```kotlin
// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "4.1.2"
    id("io.spring.dependency-management") version "1.1.7"
}
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
}
```
```bash
./gradlew bootRun        # Maven 은 ./mvnw spring-boot:run
```
Maven 3.6.3+, Gradle 8.14+ 또는 9.x 가 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@SpringBootApplication` | 설정·자동 구성·컴포넌트 스캔을 한 번에 켜는 메타 애너테이션 |
| 스타터 | `spring-boot-starter-*` 의존성 묶음. 버전은 Boot BOM 이 관리 |
| 자동 구성 | 클래스패스·프로퍼티를 보고 빈을 등록. 직접 정의한 빈이 있으면 물러난다 |
| DI 컨테이너 | `@Component`/`@Service`/`@Repository` 빈을 생성자 주입으로 연결 |
| `@RestController` | 메서드 반환값을 JSON 등으로 직렬화해 응답 본문에 쓰는 컨트롤러 |
| 외부 설정 | `application.properties`/`.yaml`, 환경 변수, 프로필(`spring.profiles.active`) |
| Actuator | `/actuator/health`, 메트릭 등 운영 엔드포인트(`spring-boot-starter-actuator`) |

## 기본 사용법
```java
package com.example.todo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
@RestController
@RequestMapping("/todos")
public class TodoApplication {
    record Todo(long id, String title) {}
    record NewTodo(@NotBlank String title) {}
    private final Map<Long, Todo> todos = new ConcurrentHashMap<>();

    @GetMapping("/{id}")
    ResponseEntity<Todo> get(@PathVariable long id) {
        return ResponseEntity.of(Optional.ofNullable(todos.get(id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    Todo create(@Valid @RequestBody NewTodo body) {
        var todo = new Todo(todos.size() + 1, body.title());
        todos.put(todo.id(), todo);
        return todo;
    }

    public static void main(String[] args) {
        SpringApplication.run(TodoApplication.class, args);
    }
}
```
기본 포트는 8080 이다. `title` 이 비어 있으면 `@Valid` 검증이 실패해 400 이 반환된다.

## 자주 쓰는 패턴
- **계층 분리**: `@RestController` → `@Service` → `@Repository` 로 나누고 생성자 주입을 쓴다. 단일 생성자는 `@Autowired` 가 필요 없다.
- **검증·에러 응답**: `spring-boot-starter-validation` + `@Valid` 로 Bean Validation 을 켜고, `@RestControllerAdvice` + `@ExceptionHandler` 로 예외를 공통 응답(ProblemDetail 등)으로 바꾼다.
- **미들웨어 역할**: 서블릿 `Filter` 빈이나 Spring MVC `HandlerInterceptor` 로 요청 전후 처리를 넣는다. 인증·인가는 Spring Security 스타터를 쓴다.
- **DB 연동**: `spring-boot-starter-data-jpa` 로 `JpaRepository` 인터페이스만 선언하면 CRUD 가 생긴다. `spring.datasource.*` 프로퍼티로 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 등에 연결하고, 스키마는 Flyway·Liquibase 로 관리한다.
- **테스트**: `@WebMvcTest(TodoController.class)` 는 MVC 계층만 띄우는 슬라이스 테스트다. `MockMvcTester` 로 AssertJ 스타일 검증을 하고, 협력 빈은 `@MockitoBean` 으로 대체한다. 전체 컨텍스트는 `@SpringBootTest` + `@AutoConfigureMockMvc`. Boot 4 에서 `@WebMvcTest` 의 패키지는 `org.springframework.boot.webmvc.test.autoconfigure` 다.
- **관측성**: Actuator + Micrometer 로 메트릭·트레이스를 노출하고 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 로 내보낼 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Java·Kotlin 엔터프라이즈 API, 트랜잭션·보안·배치·메시징 등 Spring 생태계 통합이 필요한 서비스, 대규모 팀의 표준 스택.
- 피할 때(대안): 메모리·기동 시간이 아주 중요한 작은 서비스는 GraalVM 네이티브 이미지 빌드를 검토하거나 Go([Gin](/develop-wiki/backend/web-framework/gin/)) 같은 경량 스택을 고려한다. .NET 조직이라면 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/).

## 공식 문서
- [레퍼런스 문서](https://docs.spring.io/spring-boot/index.html) · [첫 애플리케이션](https://docs.spring.io/spring-boot/tutorial/first-application/index.html) · [시스템 요구 사항](https://docs.spring.io/spring-boot/system-requirements.html) · [테스트](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html) · [Spring Initializr](https://start.spring.io)

---
name: Helidon
url: https://helidon.io
repo: https://github.com/helidon-io/helidon
stars: 3846
docs: https://helidon.io/docs/latest
domain: backend
category: web-framework
description: Oracle 이 주도하는 Java 마이크로서비스 라이브러리. 가상 스레드 기반 Níma WebServer 로 스레드당 요청 방식의 단순한 코드를 쓴다.
pricing: oss
tags: [jvm, virtual-threads, microservices, oracle]
languages: [java]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Helidon 은 Java SE 프로그램으로 동작하는 마이크로서비스 라이브러리 모음이다. 핵심 WebServer 는 가상 스레드를 전제로 처음부터 만들어져, 리액티브 서버에 가까운 처리량을 스레드당 요청의 동기식 코드로 얻는다. 설정, 보안, 헬스·메트릭, 텔레메트리, DB 클라이언트, gRPC, WebSocket 등을 모듈로 제공한다. 라이선스 Apache-2.0.

버전 정책이 바뀌었다. Helidon 27(2026-09-22)부터 JDK 릴리스 주기(Tip & Tail)에 맞추며 최소 Java 가 해당 JDK 와 같다(27 은 Java 27 필수). Helidon 4 는 LTS 로 4.5.x 가 계속 나오고, 다음 LTS 는 Helidon 29 다. MicroProfile(MP) 은 Helidon 27 에서 분리되어 별도 릴리스 전까지 27 에서 쓸 수 없으므로 MP/CDI/JAX-RS 앱은 4.5.x 에 머문다. [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/), [Micronaut](/develop-wiki/backend/web-framework/micronaut/) 이 비교 대상이다.

## 설치
```bash
helidon init --batch -Dflavor=se -Dapp-type=quickstart
cd quickstart-se && mvn clean install
java -jar target/quickstart-se.jar
curl http://localhost:8080/greet
```
Helidon CLI 대신 [Helidon Starter](https://helidon.io/starter) 로 만들어도 된다. 요구 사항은 Java 27(Helidon 27 기준)과 Maven 3.8+ 이며 Gradle 도 가능하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `WebServer` | `WebServer.builder().port(8080).routing(...).build().start()` |
| `HttpRouting` | `.get/.post/...(path, (req, res) -> ...)` 로 핸들러 등록 |
| `HttpService` | `routing(HttpRules)` 를 구현해 접두사 아래 라우트를 묶는 단위 |
| `Filter` | `addFilter((chain, req, res) -> chain.proceed())` 인터셉터형 |
| 경로 패턴 | `/foo/{var}`, `/foo/{id:\d+}`, `/foo/*`. 경로 매칭은 정확 일치 |
| 미디어 지원 | `helidon-http-media-json`(JsonObject), `json-binding`, `jackson` 모듈 |
| Declarative | `@RestServer.Endpoint`, `@Http.GET` 애너테이션 모델(프리뷰 기능) |

## 기본 사용법
```java
import io.helidon.http.Status;
import io.helidon.json.JsonObject;
import io.helidon.webserver.WebServer;

public class Main {
    public static void main(String[] args) {
        WebServer.builder()
                .port(8080)
                .routing(r -> r
                        .get("/todos/{id}", (req, res) -> {
                            String id = req.path().pathParameters().first("id").orElseThrow();
                            res.send(JsonObject.builder().set("id", id).build());
                        })
                        .post("/todos", (req, res) -> {
                            JsonObject body = req.content().as(JsonObject.class);
                            res.status(Status.CREATED_201)
                               .send(JsonObject.builder().set("title", body.string("title")).build());
                        }))
                .build()
                .start();
    }
}
```
JSON 을 쓰려면 `io.helidon.http.media:helidon-http-media-json` 의존성이 필요하다. `JsonObject` 의 `builder().set(..)`, `string(..)` 사용법은 공식 WebServer 문서의 JSON 예제를 따랐다.

## 자주 쓰는 패턴
- **서비스 분리**: `routing.register("/todos", new TodoService())` 로 `HttpService` 구현체를 접두사 아래에 붙인다.
- **오류 처리**: 핸들러에서 예외를 던지고 `error(Type, handler)` 에러 라우팅으로 응답을 만든다.
- **관측**: 기본으로 `/observe/health`, `/observe/metrics`(Prometheus 형식) 를 제공한다. 설정은 `application.yaml`.
- **DB**: Helidon Data(JDBC) 선언형/명령형 모델, 또는 `DbClient`.
- **테스트**: `helidon-webserver-testing-junit5` 의 `@ServerTest`(서버 기동) 또는 `@RoutingTest`(포트 없이 `DirectClient`)와 `@SetUpRoute` 정적 메서드로 라우팅을 구성한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 가상 스레드 위의 단순한 코드로 경량 Java 마이크로서비스를 만들 때, Oracle·Jakarta EE 계열 환경.
- 피할 때(대안): MicroProfile 이 필요하면 Helidon 4.5.x 에 머물거나 [Quarkus](/develop-wiki/backend/web-framework/quarkus/). 가장 넓은 생태계는 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/). Helidon 27 은 Java 27 이라 JDK 업그레이드 부담이 있다.

## 공식 문서
- [Helidon 문서](https://helidon.io/docs/latest) · [Get Started](https://github.com/helidon-io/helidon/blob/main/docs/get-started.md) · [WebServer](https://github.com/helidon-io/helidon/blob/main/docs/modules/webserver/webserver.md) · [27 업그레이드 가이드](https://github.com/helidon-io/helidon/blob/main/docs/guides/upgrade/27.md)

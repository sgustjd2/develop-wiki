---
name: Eclipse Vert.x
url: https://vertx.io
docs: https://vertx.io/docs/vertx-core/java/
repo: https://github.com/eclipse-vertx/vert.x
stars: 14684
domain: backend
category: web-framework
description: JVM 위에서 동작하는 이벤트 루프 기반 리액티브 툴킷. 논블로킹 HTTP 서버·이벤트 버스·Verticle 배포 모델로 적은 스레드에서 많은 동시 연결을 처리할 때 쓴다.
pricing: oss
tags: [jvm, reactive, event-loop, verticle, event-bus]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Vert.x 는 Eclipse 재단의 JVM 이벤트 기반·논블로킹 애플리케이션 툴킷이다. 소수의 **이벤트 루프 스레드**가 비동기 이벤트를 처리하고, 코드는 **Verticle** 이라는 배포 단위에 담는다. 웹 서버만이 아니라 TCP·UDP·DNS·파일 시스템, 클러스터 간 **이벤트 버스**까지 한 코어(`vertx-core`)에서 제공한다. 프레임워크라기보다 라이브러리 모음에 가까워 필요한 모듈(`vertx-web`, DB 클라이언트 등)을 골라 쓴다.

라이선스는 Eclipse Public License 2.0 과 Apache License 2.0 의 이중 라이선스(택일)다. 공식 문서 기준 2026-11 최신 안정 버전은 5.2.3 이며, Maven Central 에 5.2.3 이 최신으로 올라 있다. 5.x 에서는 `Future` 기반 API 가 중심이다. [Java](/develop-wiki/languages/java/)·[Kotlin](/develop-wiki/languages/kotlin/) 등을 지원한다(Kotlin 은 `vertx-lang-kotlin` 모듈).

## 설치
```xml
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-core</artifactId>
  <version>5.2.3</version>
</dependency>
```
라우팅이 필요하면 `vertx-web` 을 추가한다. 프로젝트 골격은 [start.vertx.io](https://start.vertx.io) 에서 Maven·Gradle 로 만들 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Vertx` | 런타임 진입점. `Vertx.vertx()` 로 생성 |
| 이벤트 루프 | 이벤트를 처리하는 스레드. 블로킹 코드를 실행하면 안 된다 |
| Verticle | 배포 단위. `VerticleBase` 를 상속하고 `start()` 가 `Future` 를 반환 |
| `Future` | 비동기 결과. `compose`·`onSuccess`·`onFailure` 로 연결 |
| 이벤트 버스 | Verticle 간(클러스터 포함) 메시지 `send`·`publish`·`consumer` |
| 워커 Verticle | `ThreadingModel.WORKER` 로 배포해 블로킹 작업을 이벤트 루프 밖에서 실행 |
| `DeploymentOptions` | 인스턴스 수, 스레딩 모델 등 배포 설정 |

## 기본 사용법
HTTP 서버를 띄우는 Verticle(공식 문서의 구조 기반):
```java
import io.vertx.core.*;
import io.vertx.ext.web.Router;

public class MainVerticle extends VerticleBase {
  @Override
  public Future<?> start() {
    Router router = Router.router(vertx);
    router.get("/hello").handler(ctx -> ctx.response().end("hello"));
    return vertx.createHttpServer()
      .requestHandler(router)
      .listen(8888);
  }
}
```
배포와 이벤트 버스:
```java
Vertx vertx = Vertx.vertx();
vertx.deployVerticle(new MainVerticle())
  .onSuccess(id -> System.out.println("deployed " + id))
  .onFailure(Throwable::printStackTrace);

vertx.eventBus().consumer("news.uk.sport", message -> System.out.println(message.body()));
vertx.eventBus().send("news.uk.sport", "Yay! Someone kicked a ball");
```
`Router` 는 `vertx-web` 모듈에 있다.

## 자주 쓰는 패턴
- **비동기 연결**: `Future` 의 `compose` 로 순서 있는 비동기 단계를 이어 붙이고 `onSuccess`·`onFailure` 로 결과를 처리한다.
- **다중 인스턴스**: `new DeploymentOptions().setInstances(16)` 와 팩토리 `() -> new MyVerticle()` 로 같은 Verticle 을 여러 이벤트 루프에 분산 배포한다.
- **블로킹 격리**: JDBC 같은 블로킹 호출은 `setThreadingModel(ThreadingModel.WORKER)` 로 배포한 워커 Verticle 로 옮긴다.
- **이벤트 버스 분리**: 서비스 간 통신을 주소 문자열 기반 메시지로 분리하고 필요하면 클러스터 모드로 확장한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 많은 동시 연결을 적은 스레드로 처리하는 JVM 서비스, 이벤트 버스로 가벼운 서비스 분리가 필요할 때, 풀스택 프레임워크 없이 필요한 모듈만 조합하고 싶을 때.
- 피할 때(대안): 비동기 모델이 낯설거나 CRUD 중심 생산성이 우선이면 [Quarkus](/develop-wiki/backend/web-framework/quarkus/)나 [Micronaut](/develop-wiki/backend/web-framework/micronaut/), Kotlin 이면 [Ktor](/develop-wiki/backend/web-framework/ktor/) 가 구조가 더 갖춰져 있다. 이벤트 루프를 막는 블로킹 코드를 실수로 쓰면 성능이 급격히 떨어진다.

## 공식 문서
- [문서 홈](https://vertx.io/docs/) · [Vert.x Core(Java)](https://vertx.io/docs/vertx-core/java/) · [프로젝트 생성기](https://start.vertx.io)

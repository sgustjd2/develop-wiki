---
name: Actix Web
url: https://actix.rs
docs: https://actix.rs/docs/
repo: https://github.com/actix/actix-web
stars: 24965
domain: backend
category: web-framework
description: Tokio 기반 런타임 위에서 extractor·매크로 라우팅으로 핸들러를 작성하는 Rust 웹 프레임워크. 처리량이 중요한 Rust HTTP 서버에 쓴다.
pricing: oss
tags: [async, tokio, extractor, http2]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Actix Web 은 [Rust](/develop-wiki/languages/rust/) 웹 프레임워크로, 워커 스레드마다 단일 스레드 Tokio 런타임을 띄우는 `actix-rt` 위에서 동작한다. 핸들러는 일반 `async fn` 이고, 인자 타입(`web::Path`, `web::Json`, `web::Data` 등 extractor)으로 무엇을 꺼낼지 선언한다. `#[get("/")]` 같은 라우트 매크로와 `App::new().route(...)` 빌더 방식을 모두 지원하며, HTTP/1.x·HTTP/2·TLS·WebSocket 을 다룬다.

라이선스는 `MIT OR Apache-2.0` 이중 라이선스다. 현재 메이저는 4.x(crates.io 최신 4.20.0)이고 MSRV 는 Rust 1.89 다. 같은 Rust 진영의 [Axum](/develop-wiki/backend/web-framework/axum/) 은 tower 미들웨어 생태계를 그대로 쓰는 반면, Actix Web 은 자체 `Service`/`Transform` 미들웨어 체계를 쓴다.

## 설치
```bash
cargo new todo-api && cd todo-api
cargo add actix-web@4
cargo add serde --features derive
cargo run          # http://127.0.0.1:8080
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `HttpServer` | 워커(기본 CPU 코어 수)를 띄우고 각 워커에서 `App` 팩토리 클로저를 실행 |
| `App` | 라우트·상태·미들웨어 등록. `.service()`, `.route()`, `.app_data()`, `.wrap()` |
| extractor | 핸들러 인자 타입. `Path`, `Query`, `Json`, `Form`, `Data`, `HttpRequest` 등 |
| `web::Data<T>` | 앱 상태. 내부가 `Arc` 라 워커 간 공유된다. 변경이 필요하면 `Mutex` 등을 안에 둔다 |
| `Responder` | 반환 타입 트레이트. `HttpResponse`, `String`, `web::Json<T>` 등이 구현 |
| `web::scope` | 경로 접두사 묶음. 스코프 단위로 미들웨어·상태 지정 |
| 에러 | `ResponseError` 를 구현한 타입을 `Result<_, E>` 로 반환하면 응답으로 변환 |

## 기본 사용법
```rust
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Deserialize)]
struct NewTodo { title: String }

#[derive(Serialize, Clone)]
struct Todo { id: usize, title: String }

struct AppState { todos: Mutex<Vec<Todo>> }

#[get("/todos/{id}")]
async fn get_todo(path: web::Path<usize>, data: web::Data<AppState>) -> impl Responder {
    let id = path.into_inner();
    match data.todos.lock().unwrap().iter().find(|t| t.id == id) {
        Some(t) => HttpResponse::Ok().json(t.clone()),
        None => HttpResponse::NotFound().finish(),
    }
}

#[post("/todos")]
async fn create_todo(body: web::Json<NewTodo>, data: web::Data<AppState>) -> impl Responder {
    let mut todos = data.todos.lock().unwrap();
    let todo = Todo { id: todos.len() + 1, title: body.into_inner().title };
    todos.push(todo.clone());
    HttpResponse::Created().json(todo)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = web::Data::new(AppState { todos: Mutex::new(vec![]) });
    HttpServer::new(move || App::new().app_data(state.clone()).service(get_todo).service(create_todo))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
```
상태는 `HttpServer::new` 바깥에서 한 번 만들어 복제해야 모든 워커가 같은 데이터를 본다. 본문 JSON 이 `NewTodo` 로 역직렬화되지 않으면 핸들러가 호출되지 않고 400 이 나간다.

## 자주 쓰는 패턴
- **라우트 구성**: `web::scope("/api/v1").configure(todo_routes)` 처럼 `fn(&mut web::ServiceConfig)` 함수로 모듈별 라우트를 분리한다.
- **미들웨어**: `.wrap(middleware::Logger::default())`(로그 출력에는 `env_logger` 등 필요), `DefaultHeaders`, `Compress`, `ErrorHandlers` 가 내장돼 있다. 간단한 커스텀 미들웨어는 `middleware::from_fn(async fn)` 으로 만든다. `wrap()` 을 여러 번 부르면 마지막에 등록한 것이 먼저 실행된다.
- **검증**: 기본은 serde 역직렬화 실패 = 400 이다. `web::JsonConfig::default().limit(4096).error_handler(...)` 로 크기 제한과 에러 응답 형식을 바꾸고, 값 규칙(길이·범위)은 `validator` 같은 크레이트나 핸들러 안에서 확인한다.
- **DB 연동**: [SQLx](/develop-wiki/backend/orm-query/sqlx/) `PgPool` 을 `web::Data` 로 등록하고 핸들러에서 `data.get_ref()` 로 쿼리한다. 블로킹 드라이버(Diesel 동기 API 등)는 `web::block` 으로 별도 스레드풀에서 실행한다.
- **테스트**: 서버를 띄우지 않고 서비스를 초기화해 요청을 보낸다.
  ```rust
  #[actix_web::test]
  async fn get_missing() {
      let app = test::init_service(App::new().app_data(state()).service(get_todo)).await;
      let req = test::TestRequest::get().uri("/todos/1").to_request();
      let resp = test::call_service(&app, req).await;
      assert_eq!(resp.status(), 404);
  }
  ```
  `state()` 는 테스트용 `web::Data<AppState>` 를 만드는 보조 함수다. JSON 응답은 `test::call_and_read_body_json` 으로 바로 역직렬화한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Rust 로 만드는 고처리량 HTTP API, 매크로 라우팅과 내장 미들웨어·WebSocket(`actix-ws`)을 한 프레임워크에서 쓰고 싶을 때, 이미 Actix 생태계(`actix-session`, `actix-files` 등)를 쓰는 코드베이스.
- 피할 때(대안): tower/hyper 미들웨어와 gRPC(tonic)를 함께 쓰려면 [Axum](/develop-wiki/backend/web-framework/axum/). Rust 학습 비용이 부담이고 처리량 요구가 크지 않으면 [Gin](/develop-wiki/backend/web-framework/gin/)(Go)·[FastAPI](/develop-wiki/backend/web-framework/fastapi/)(Python)가 개발 속도 면에서 유리하다.

## 공식 문서
- [Getting Started](https://actix.rs/docs/getting-started) · [Extractors](https://actix.rs/docs/extractors) · [Middleware](https://actix.rs/docs/middleware) · [Testing](https://actix.rs/docs/testing) · [docs.rs API](https://docs.rs/actix-web/latest/actix_web/)

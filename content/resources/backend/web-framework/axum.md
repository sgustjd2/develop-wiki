---
name: Axum
url: https://docs.rs/axum
repo: https://github.com/tokio-rs/axum
stars: 27899
docs: https://docs.rs/axum/latest/axum/
domain: backend
category: web-framework
description: Tokio 팀이 관리하는 Rust 웹 프레임워크. tower 미들웨어와 extractor 기반 핸들러로 비동기 HTTP API를 만들 때 쓴다.
pricing: oss
tags: [tokio, tower, async]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Axum 은 Tokio 비동기 런타임과 hyper 위에서 동작하는 Rust 웹 프레임워크다. 핸들러는 평범한 `async fn` 이고, 매개변수 타입(extractor)이 요청에서 무엇을 꺼낼지 결정한다. 자체 미들웨어 시스템 대신 tower 의 `Service`/`Layer` 를 그대로 써서 tower-http 의 타임아웃·트레이싱·압축 등을 재사용한다. 문서 기준 최신은 **0.8.x**(0.8.9)다.

매크로보다 타입 시스템으로 라우팅을 표현하는 편이라 컴파일 타임에 핸들러 시그니처 오류가 잡힌다.

## 설치
```bash
cargo new todo-api && cd todo-api
cargo add axum
cargo add tokio --features full
cargo add serde --features derive
cargo add tower-http --features trace   # 선택: 미들웨어
```
`#[tokio::main]` 을 쓰려면 tokio 의 `macros`·`rt-multi-thread`(또는 `full`) 기능이 필요하다. `Json`·`Query`·`Form` extractor 는 axum 기본 기능에 포함된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Router` | `.route(path, method_router)` 로 경로와 핸들러를 연결. `.nest()`, `.merge()` 로 조합 |
| 경로 문법(0.8) | 파라미터는 `/{id}`, 나머지 전체는 `/{*rest}` |
| 핸들러 | `async fn` 이며 반환 타입이 `IntoResponse` 를 구현하면 된다 |
| Extractor | `Path<T>`, `Query<T>`, `Json<T>`, `State<S>`, `HeaderMap` 등. 본문을 소비하는 extractor 는 마지막 인자 |
| State | `.with_state(state)` 로 공유 상태를 주입. 요청마다 clone 되므로 무거운 값은 `Arc` 로 감싼다 |
| 미들웨어 | tower `Layer`. `.layer()` 는 전체, `.route_layer()` 는 매칭된 라우트에만 적용 |
| 서버 | `axum::serve(listener, app)` 에 `tokio::net::TcpListener` 를 넘긴다 |

## 기본 사용법
```rust
use axum::{extract::{Path, State}, http::StatusCode, routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Clone, Serialize, Deserialize)]
struct Todo { id: u32, title: String }
#[derive(Deserialize)]
struct NewTodo { title: String }
type Db = Arc<Mutex<Vec<Todo>>>;

async fn get_todo(Path(id): Path<u32>, State(db): State<Db>) -> Result<Json<Todo>, StatusCode> {
    let todos = db.lock().unwrap();
    todos.iter().find(|t| t.id == id).cloned().map(Json).ok_or(StatusCode::NOT_FOUND)
}

async fn create_todo(State(db): State<Db>, Json(input): Json<NewTodo>) -> (StatusCode, Json<Todo>) {
    let mut todos = db.lock().unwrap();
    let todo = Todo { id: todos.len() as u32 + 1, title: input.title };
    todos.push(todo.clone());
    (StatusCode::CREATED, Json(todo))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/todos", post(create_todo))
        .route("/todos/{id}", get(get_todo))
        .with_state(Db::default());
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

## 자주 쓰는 패턴
- **라우터 분리**: 기능별 `fn routes() -> Router<AppState>` 를 만들고 `Router::new().nest("/api", api::routes())` 로 합친다.
- **tower-http 미들웨어**: 여러 layer 는 `tower::ServiceBuilder` 로 묶으면 위에서 아래 순서로 요청을 본다.
  ```rust
  let app = app.layer(tower_http::trace::TraceLayer::new_for_http());
  ```
- **함수 미들웨어**: `middleware::from_fn(auth)` 로 `async fn auth(req: Request, next: Next) -> Result<Response, StatusCode>` 를 등록한다. 조기 반환으로 401 등을 돌려줄 수 있다.
- **검증·에러**: 내장 검증기가 없다. serde 역직렬화 실패는 extractor 가 4xx 로 거절하고, 추가 규칙은 직접 검사하거나 커스텀 extractor 를 만든다. 앱 에러 타입에 `IntoResponse` 를 구현해 `?` 로 전파하는 방식이 흔하다.
- **DB 연동**: sqlx·SeaORM 등의 커넥션 풀(`PgPool` 은 내부적으로 `Arc`)을 상태 struct 에 넣고 `State` 로 꺼낸다. 데이터베이스는 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 이 흔하다.
- **테스트**: `Router` 가 tower `Service` 이므로 서버 없이 `tower::ServiceExt::oneshot` 으로 요청을 넣어 응답을 검사한다(dev-dependency 로 `tower` 를 `util` 기능과 함께 추가: `cargo add --dev tower --features util`).
- **관측성**: `tracing` + `TraceLayer` 로 요청 스팬을 남기고, [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 로 내보낼 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Rust 로 만드는 고성능·저지연 API, tokio 생태계(tonic gRPC, sqlx 등)와 묶는 서비스, 타입으로 요청 계약을 강하게 표현하고 싶을 때.
- 피할 때(대안): 팀에 Rust 경험이 없고 빠른 반복이 중요하면 Go([Gin](/develop-wiki/backend/web-framework/gin/))나 Python([FastAPI](/develop-wiki/backend/web-framework/fastapi/))이 진입 비용이 낮다. 0.x 버전이라 메이저 업데이트마다 마이그레이션이 필요할 수 있다.

## 공식 문서
- [docs.rs API](https://docs.rs/axum/latest/axum/) · [미들웨어](https://docs.rs/axum/latest/axum/middleware/index.html) · [extract 모듈](https://docs.rs/axum/latest/axum/extract/index.html) · [예제 모음(GitHub)](https://github.com/tokio-rs/axum/tree/main/examples) · [CHANGELOG](https://github.com/tokio-rs/axum/blob/main/axum/CHANGELOG.md)

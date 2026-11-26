---
name: Rocket
url: https://rocket.rs
repo: https://github.com/rwf2/Rocket
stars: 25815
docs: https://rocket.rs/guide/v0.5/
domain: backend
category: web-framework
description: 매크로 기반 라우팅과 요청 가드로 타입 안전한 Rust 웹 앱을 만드는 프레임워크. 비동기, JSON·폼·템플릿·DB 풀 지원.
pricing: oss
tags: [async, macros, request-guards, tokio]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Rocket 은 `#[get]`, `#[post]` 같은 속성 매크로로 라우트를 선언하고, 핸들러 인자의 타입(요청 가드)이 파싱·검증·인가를 맡는 Rust 프레임워크다. 0.5 부터 안정 Rust 와 tokio 비동기 위에서 동작한다. 설정은 `Rocket.toml` 과 환경 변수(`ROCKET_*`)로 한다.

저장소는 `SergioBenitez/Rocket` 에서 `rwf2/Rocket` 으로 옮겼다. 0.5.2(2026-10-23), 0.5.3(2026-11-18)이 오랜 공백 뒤에 나왔다(0.5.1 은 2024-05). 같은 Rust 진영의 [Axum](/develop-wiki/backend/web-framework/axum/), [Actix Web](/develop-wiki/backend/web-framework/actix-web/) 이 더 흔하다.

## 설치
```toml
# Cargo.toml
[dependencies]
rocket = { version = "0.5", features = ["json"] }
```
```bash
cargo run     # 기본 http://127.0.0.1:8000
```
crates.io 상 0.5.3, 최소 Rust 1.89, 라이선스 `MIT OR Apache-2.0`(GitHub 는 NOASSERTION 으로 표시).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 라우트 매크로 | `#[get("/path/<param>")]`, `#[post("/", data = "<body>")]` |
| 요청 가드 | `FromRequest` 구현 타입을 인자로 받으면 자동 검사. 실패 시 다음 라우트·캐처로 이동 |
| `Json<T>` | serde 로 본문 역직렬화/응답 직렬화 (`json` feature) |
| Responder | 반환 타입. `(Status, Json<T>)`, `Option<T>`(None → 404) 등 |
| Fairing | 시작·요청·응답 훅(미들웨어에 해당) |
| `State<T>` / `manage` | 앱 전역 상태 주입 |
| Catcher | `#[catch(404)]` 로 에러 응답 커스터마이즈 |

## 기본 사용법
```rust
#[macro_use] extern crate rocket;

use rocket::http::Status;
use rocket::serde::{json::Json, Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Todo {
    title: String,
    done: bool,
}

#[get("/todos/<id>")]
fn read(id: u32) -> Option<Json<Todo>> {
    (id == 1).then(|| Json(Todo { title: "demo".into(), done: false }))
}

#[post("/todos", data = "<todo>")]
fn create(todo: Json<Todo>) -> (Status, Json<Todo>) {
    (Status::Created, todo)
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![read, create])
}
```
`<id>` 가 `u32` 로 파싱되지 않으면 라우트가 매칭되지 않아 404 로 넘어간다.

## 자주 쓰는 패턴
- **검증**: `rocket::form::Form` 과 `#[field(validate = len(1..))]` 같은 필드 검증, JSON 은 serde 타입으로 구조 검증한다.
- **미들웨어**: `Fairing` 트레이트를 구현해 `.attach(...)` 한다. 인증은 보통 요청 가드(`FromRequest`)로 만든다.
- **DB**: `rocket_db_pools`(0.3.0, sqlx·deadpool 등 feature 제공)로 풀을 주입한다. 0.3.0 은 드라이버 갱신에 따른 breaking change 가 있으니 changelog 를 읽는다. [SQLx](/develop-wiki/backend/orm-query/sqlx/) 와 함께 쓴다.
- **0.5.3 변경**: 마지막 응답 뒤 연결을 최대 10초 유지(`linger`, 0 이면 이전 동작), 본문 읽기 실패 시 응답 중단, 의존성 보안 업데이트.
- **테스트**: `rocket::local::blocking::Client::tracked(rocket())` 로 `client.get("/todos/1").dispatch()` 하고 `response.status()` 를 단언한다. 서버를 띄우지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 매크로 중심의 읽기 쉬운 선언형 API 를 선호하는 Rust 웹 앱, 요청 가드로 인가·파싱을 타입에 담고 싶을 때.
- 피할 때(대안): tower 미들웨어 생태계와 널리 쓰이는 선택이 필요하면 [Axum](/develop-wiki/backend/web-framework/axum/). 릴리스 간격이 길었던 이력이 있으니 장기 계획 시 활동을 확인한다.

## 공식 문서
- [가이드 v0.5](https://rocket.rs/guide/v0.5/) · [API 문서](https://api.rocket.rs/v0.5/rocket/) · [CHANGELOG](https://github.com/rwf2/Rocket/blob/v0.5.3/CHANGELOG.md)

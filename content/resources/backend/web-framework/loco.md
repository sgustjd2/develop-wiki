---
name: Loco
url: https://loco.rs
repo: https://github.com/loco-rs/loco
stars: 9646
docs: https://loco.rs/docs/
domain: backend
category: web-framework
description: Axum 과 SeaORM 위에 만든 Rails 스타일 Rust 풀스택 프레임워크. 제너레이터, 백그라운드 잡, 메일러, 스케줄러를 내장한다.
pricing: oss
tags: [axum, sea-orm, batteries-included, rails-like]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Loco 는 Ruby on Rails 의 관례 중심 개발을 Rust 로 옮긴 프레임워크다. HTTP 계층은 [Axum](/develop-wiki/backend/web-framework/axum/), ORM 은 [SeaORM](/develop-wiki/backend/orm-query/sea-orm/) 을 쓰고, 모델·컨트롤러·워커·메일러·스케줄러·스토리지·캐시와 CLI 제너레이터를 한 묶음으로 준다. 현재 v1.3.1(2026-11-06), 라이선스 Apache-2.0.

Axum 에 직접 조립하는 대신 규약과 제너레이터가 필요한 팀용이다. 1.0 이후 제너레이터는 JSON API 중심이며 서버 렌더링 HTML/HTMX 뷰는 React SPA 프론트엔드로 대체되었다.

## 설치
```bash
cargo install loco
cargo install sea-orm-cli     # DB 가 필요할 때만
loco new                      # 앱 이름, 앱 유형, DB, 워커 방식을 대화형으로 선택
cargo loco start              # 기본 포트 5150
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Hooks` / `App` | `src/app.rs` 의 앱 정의. `routes()` 에서 컨트롤러를 등록 |
| 컨트롤러 | `Routes::new().prefix(..).add("/", get(handler))` 로 라우트 구성 |
| `format::*` | `format::json`, `format::text` 등 응답 헬퍼 |
| 모델 | SeaORM 엔티티 + 마이그레이션. `cargo loco generate model` |
| 미들웨어 | YAML 의 `server.middlewares.*` 로 켜는 내장 13종 + 커스텀 `MiddlewareLayer` |
| 워커·스케줄러 | 백그라운드 작업(Redis 큐 또는 in-process), 크론 대체 스케줄러 |
| 환경 설정 | `config/development.yaml`, `production.yaml`, `test.yaml` |

## 기본 사용법
수동으로 만든 컨트롤러(공식 문서의 형태):
```rust
// src/controllers/example.rs
use loco_rs::prelude::*;

async fn hello() -> Result<Response> {
    format::text("hello")
}

async fn echo(Json(body): Json<serde_json::Value>) -> Result<Response> {
    format::json(body)
}

pub fn routes() -> Routes {
    Routes::new()
        .add("/", get(hello))
        .add("/echo", post(echo))
}
```
`src/controllers/mod.rs` 에 `pub mod example;` 을 추가하고, `src/app.rs` 의 `routes()` 에서 `AppRoutes::with_default_routes().add_route(controllers::example::routes())` 로 등록한다. `cargo loco routes` 로 등록 결과를 확인한다(`/_ping`, `/_health`, `/_readiness` 가 기본 포함).

## 자주 쓰는 패턴
- **제너레이터**: `cargo loco generate scaffold posts title:string! user:references` 로 엔티티·마이그레이션·컨트롤러·테스트를 생성하고 `cargo loco db migrate && cargo loco db entities` 로 반영한다. 제너레이터는 디버그 빌드에서만 존재한다.
- **검증**: `validator::Validate` 를 derive 한 타입을 `JsonValidate<T>` 로 받으면 실패 시 400, `JsonValidateWithMessage<T>` 는 필드별 오류를 JSON 으로 돌려준다.
- **미들웨어**: `server.middlewares.cors.enable: true` 처럼 YAML 로 켠다. 기본 활성 미들웨어는 키를 쓰면 `enable` 을 명시해야 한다. `cargo loco middleware --config` 로 상태를 본다.
- **조건 조회**: `query::condition().eq(col, v).contains(..).build()` 로 SeaORM 조건을 만든다.
- **테스트**: `testing` feature 의 `request::<App, _, _>(|request, ctx| async move { ... })` 가 앱을 테스트 환경으로 띄워 axum-test 클라이언트를 준다. DB 가 필요하면 `request_with_create_db`.

## 언제 쓰나 / 피할 때
- 쓸 때: Rails 같은 규약·제너레이터·잡·메일러를 Rust 로 한 번에 원하는 SaaS·API 백엔드.
- 피할 때(대안): 구성 요소를 직접 고르고 싶으면 [Axum](/develop-wiki/backend/web-framework/axum/) 단독. Rails 자체의 생산성이 목적이면 [Rails](/develop-wiki/backend/web-framework/rails/). 규약과 SeaORM 에 묶이는 점을 감안한다.

## 공식 문서
- [loco.rs](https://loco.rs) · [Add a controller](https://loco.rs/docs/how-to/add-controller) · [Validate requests](https://loco.rs/docs/how-to/validate-requests) · [Request tests](https://loco.rs/docs/how-to/request-tests)

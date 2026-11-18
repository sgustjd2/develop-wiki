---
name: SQLx
url: https://github.com/transact-rs/sqlx
docs: https://docs.rs/sqlx/latest/sqlx/
repo: https://github.com/transact-rs/sqlx
domain: backend
category: orm-query
description: 컴파일 시점에 실제 DB 로 SQL 을 검사하는 Rust 비동기 SQL 툴킷. ORM 없이 SQL 을 직접 쓰면서 타입 안전성을 얻고 싶을 때 쓴다.
pricing: oss
tags: [rust, sql, async, postgresql]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SQLx 는 ORM 이나 쿼리 빌더가 아니라 **SQL 을 그대로 쓰는 비동기 DB 툴킷**이다. `query!`·`query_as!` 매크로가 빌드할 때 `DATABASE_URL` 의 실제 DB(또는 저장해 둔 오프라인 메타데이터)에 SQL 을 준비시켜 문법·컬럼·타입을 검사하므로, 잘못된 SQL 이 컴파일 오류가 된다. PostgreSQL, MySQL/MariaDB, SQLite 를 지원하고 연결 풀·트랜잭션·마이그레이션을 포함한다.

저장소는 `launchbadge/sqlx` 에서 **`transact-rs/sqlx`** 로 옮겨졌다. 2026-11 기준 최신은 **0.9.1** 이며, 0.9 에서는 오프라인 모드가 항상 켜지고 런타임·TLS 기능 플래그 구성이 정리됐다. Rust 의 다른 선택지는 동기 ORM·쿼리 빌더인 **Diesel**(2.4.0)과 SQLx 위의 ORM 인 SeaORM 이다. 웹 계층은 [Axum](/develop-wiki/backend/web-framework/axum/) 과 자주 조합한다.

## 설치
```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.9", features = ["runtime-tokio", "tls-rustls-ring-webpki", "postgres", "macros", "migrate"] }
tokio = { version = "1", features = ["full"] }
```
```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
sqlx database create && sqlx migrate add create_todos
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Pool` | `PgPoolOptions::new().max_connections(5).connect(url)` 로 만드는 연결 풀 |
| `query` / `query_as` | 런타임 함수. `.bind()` 로 파라미터, `FromRow` 로 구조체 매핑 |
| `query!` / `query_as!` | 컴파일 시점 검증 매크로. 결과 필드 타입을 DB 스키마에서 추론 |
| 오프라인 모드 | `cargo sqlx prepare` 로 `.sqlx/` 메타데이터를 저장해 CI 에서 DB 없이 빌드 |
| 마이그레이션 | `migrations/` 의 SQL 파일. `sqlx::migrate!().run(&pool)` 로 앱 시작 시 적용 |
| 실행 메서드 | `fetch_one`, `fetch_optional`, `fetch_all`, `fetch`(스트림), `execute` |

## 기본 사용법
```rust
use sqlx::postgres::PgPoolOptions;

#[derive(Debug, sqlx::FromRow)]
struct Todo { id: i64, title: String, done: bool }

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&std::env::var("DATABASE_URL").unwrap())
        .await?;
    sqlx::migrate!().run(&pool).await?;

    let id: i64 = sqlx::query_scalar("INSERT INTO todos (title) VALUES ($1) RETURNING id")
        .bind("write docs")
        .fetch_one(&pool)
        .await?;

    let todos: Vec<Todo> = sqlx::query_as("SELECT id, title, done FROM todos WHERE done = $1")
        .bind(false)
        .fetch_all(&pool)
        .await?;
    println!("{id} {todos:?}");
    Ok(())
}
```

## 자주 쓰는 패턴
- **컴파일 검증**: 핵심 쿼리는 `sqlx::query_as!(Todo, "SELECT ... WHERE id = $1", id)` 로 바꿔 스키마 변경 시 빌드가 깨지게 한다.
- **CI 빌드**: `cargo sqlx prepare` 결과(`.sqlx/`)를 커밋하고 `SQLX_OFFLINE=true` 로 빌드한다.
- **트랜잭션**: `let mut tx = pool.begin().await?;` → 쿼리에 `&mut *tx` 전달 → `tx.commit().await?`. 커밋 없이 드롭되면 롤백.
- **Axum 상태 공유**: `PgPool` 은 내부가 `Arc` 라 `State` 로 그대로 복제해 핸들러에 넘긴다.
- **테스트**: `#[sqlx::test]` 가 테스트마다 임시 DB 를 만들고 마이그레이션을 적용한다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 을 직접 쓰고 싶은 Rust 비동기 서비스, 스키마와 코드의 불일치를 빌드 단계에서 잡고 싶을 때.
- 피할 때(대안): 쿼리를 Rust 타입 시스템으로 조립하는 ORM·DSL 이 필요하면 Diesel, 엔티티·관계 중심 ORM 이 필요하면 SeaORM.

## 공식 문서
- [README](https://github.com/transact-rs/sqlx) · [API 문서(docs.rs)](https://docs.rs/sqlx/latest/sqlx/) · [sqlx-cli](https://github.com/transact-rs/sqlx/tree/main/sqlx-cli) · [Diesel 가이드](https://diesel.rs/guides/)

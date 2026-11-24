---
name: SeaORM
url: https://www.sea-ql.org/SeaORM/
docs: https://www.sea-ql.org/SeaORM/docs/index/
repo: https://github.com/SeaQL/sea-orm
stars: 9984
domain: backend
category: orm-query
description: SQLx 위에서 동작하는 Rust 비동기 ORM. 엔티티·관계·ActiveModel 로 CRUD 를 다루므로, Rust 웹 서비스에서 SQL 을 일일이 쓰지 않고 관계형 데이터를 다루고 싶을 때 쓴다.
pricing: oss
tags: [rust, orm, async, sqlx, postgresql]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SeaORM 은 Rust 용 비동기 ORM 으로, 쿼리 빌더 **SeaQuery** 와 드라이버 계층 **[SQLx](/develop-wiki/backend/orm-query/sqlx/)** 위에 엔티티 모델을 얹는다. 테이블마다 `Entity`(쿼리 진입점)·`Model`(읽은 행)·`ActiveModel`(변경할 행)을 두고, 관계(1:1, 1:N, N:M)를 엔티티 수준에서 선언한다. PostgreSQL, MySQL, SQLite 를 지원한다.

**2.0 에서 큰 변화**가 있었다. `#[sea_orm::model]` 을 쓰는 새 "dense" 엔티티 형식에서는 관계를 `HasOne`/`HasMany`/`BelongsTo` 필드로 모델 안에 선언하고, N+1 을 피하는 Entity Loader, 중첩 객체를 한 번에 저장하는 ActiveModel 빌더, 엔티티 정의에서 테이블을 자동 생성·동기화하는 Entity First 워크플로가 추가됐다. 비동기 런타임 없이 쓰는 `sea-orm-sync` 크레이트도 생겼다. 1.x 형식의 엔티티도 계속 쓸 수 있다.

라이선스는 MIT OR Apache-2.0(crates.io 표기, GitHub 저장소는 Apache-2.0 로 감지). 2026-11 기준 최신은 **2.0.4**(2026-09-27)이며 SQLx 0.9, Rust 1.94 이상이 필요하다.

## 설치
```toml
# Cargo.toml
[dependencies]
sea-orm = { version = "2", features = ["sqlx-postgres", "runtime-tokio"] }
sqlx = { version = "0.9", features = ["tls-rustls-aws-lc-rs"] }   # TLS 는 sqlx 쪽에서 선택
tokio = { version = "1", features = ["full"] }
```
```bash
cargo install sea-orm-cli
sea-orm-cli migrate init                                  # migration 크레이트 생성
sea-orm-cli generate entity -u $DATABASE_URL -o src/entity   # 기존 DB 에서 엔티티 생성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Entity` | 테이블 단위 진입점. `Entity::find()`, `find_by_id()`, `insert()`, `delete_many()` |
| `Model` | 조회 결과 구조체 (`DeriveEntityModel`) |
| `ActiveModel` | 변경 추적용 구조체. 필드는 `Set(v)` / `NotSet` / `Unchanged` |
| 관계 | 2.0 dense 형식: `HasOne<…>`, `HasMany<…>`, `BelongsTo<…>` 필드 + `#[sea_orm(...)]` 속성 |
| Entity Loader | `Entity::load().with(...)` — 1:1 은 JOIN, 1:N 은 데이터 로더로 묶어 N+1 회피 |
| `DatabaseConnection` | `Database::connect(url)` 로 얻는 연결 풀 |
| Migration | `sea-orm-migration` 크레이트. Rust 코드로 스키마 변경 작성 |
| `DerivePartialModel` | 필요한 컬럼만 고르는 부분 모델 |

## 기본 사용법
```rust
mod todo {
    use sea_orm::entity::prelude::*;

    #[sea_orm::model]
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "todo")]
    pub struct Model {
        #[sea_orm(primary_key)]
        pub id: i32,
        pub title: String,
        pub done: bool,
    }
    impl ActiveModelBehavior for ActiveModel {}
}

use sea_orm::{ActiveModelTrait, ColumnTrait, Database, EntityTrait, QueryFilter, Set};

#[tokio::main]
async fn main() -> Result<(), sea_orm::DbErr> {
    let db = Database::connect(std::env::var("DATABASE_URL").unwrap()).await?;
    let saved = todo::ActiveModel { title: Set("write docs".into()), done: Set(false), ..Default::default() }
        .insert(&db).await?;
    let open = todo::Entity::find().filter(todo::Column::Done.eq(false)).all(&db).await?;
    println!("{} {}", saved.id, open.len());
    Ok(())
}
```

## 자주 쓰는 패턴
- **부분 수정**: 조회한 `Model` 을 `.into_active_model()` 로 바꾸고 바꿀 필드만 `Set` 한 뒤 `.update(&db)`.
- **트랜잭션**: `db.transaction::<_, _, DbErr>(|txn| Box::pin(async move { ... }))` 또는 `let txn = db.begin().await?; ... txn.commit().await?`.
- **페이지네이션**: `Entity::find().paginate(&db, 20)` 의 `fetch_page(n)`, `num_pages()`.
- **Entity First**: `entity-registry`·`schema-sync` 기능을 켜고 `db.get_schema_registry("my_crate::entity::*").sync(&db)` 로 개발 중 테이블을 맞춘다. 운영은 마이그레이션 파일을 쓴다.
- **웹 프레임워크**: [Axum](/develop-wiki/backend/web-framework/axum/) 상태에 `DatabaseConnection` 을 넣어 공유한다(내부가 풀이라 복제 비용이 작다). Loco 프레임워크는 SeaORM 을 기본 ORM 으로 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 관계가 많은 CRUD 중심 Rust API, 다른 언어의 ActiveRecord·ORM 경험을 Rust 로 옮기고 싶을 때, GraphQL(Seaography)까지 엔티티에서 만들고 싶을 때.
- 피할 때(대안): SQL 을 직접 쓰고 컴파일 시점 검증을 원하면 [SQLx](/develop-wiki/backend/orm-query/sqlx/), 동기·컴파일 타임 쿼리 DSL 을 원하면 Diesel.

## 공식 문서
- [문서](https://www.sea-ql.org/SeaORM/docs/index/) · [SeaORM 2.0 소개](https://www.sea-ql.org/blog/2025-10-30-sea-orm-2.0/) · [예제 모음](https://github.com/SeaQL/sea-orm/tree/master/examples) · [API(docs.rs)](https://docs.rs/sea-orm/latest/sea_orm/)
- 언어: [Rust](/develop-wiki/languages/rust/)

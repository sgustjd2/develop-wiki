---
name: Diesel
url: https://diesel.rs
docs: https://diesel.rs/guides/
repo: https://github.com/diesel-rs/diesel
stars: 14271
domain: backend
category: orm-query
description: 컴파일 타임에 쿼리와 스키마 타입을 검증하는 Rust 동기식 ORM·쿼리 빌더. PostgreSQL·MySQL·SQLite 를 타입 안전하게 다루고 싶을 때 쓴다.
pricing: oss
tags: [rust, orm, query-builder, postgresql, mysql, sqlite, migration]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Diesel 은 Rust 의 ORM 겸 쿼리 빌더로, 테이블 구조를 `table!` 매크로(`schema.rs`)로 표현하고 그 위에서 쿼리를 Rust 타입으로 조립한다. 존재하지 않는 컬럼을 쓰거나 타입이 맞지 않으면 런타임이 아니라 컴파일 단계에서 오류가 난다. PostgreSQL, MySQL, SQLite 를 지원하고 마이그레이션은 `diesel_cli` 가 맡는다. 기본 API 는 동기식이며 비동기가 필요하면 별도 크레이트 `diesel-async` 를 쓴다.

라이선스는 MIT OR Apache-2.0(crates.io 표기, GitHub 저장소는 Apache-2.0 로 감지). 2026-11 기준 최신 안정판은 **2.4.0**(2026-11-13)이며 MSRV 는 Rust 1.88.0 이다. 2.4.0 릴리스에는 데이터베이스 뷰 지원, 향상된 enum 지원, 배치 update, MariaDB 전용 백엔드, Rust 로 쓰는 마이그레이션 등이 들어갔다.

## 설치
```toml
# Cargo.toml
[dependencies]
diesel = { version = "2.4.0", features = ["postgres"] }
dotenvy = "0.15"
```
```bash
cargo install diesel_cli --no-default-features --features postgres
echo DATABASE_URL=postgres://user:pass@localhost/diesel_demo > .env
diesel setup                              # DB 생성 + migrations/ 초기화
diesel migration generate create_posts    # up.sql / down.sql 생성
diesel migration run                      # 적용하고 src/schema.rs 갱신
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `schema.rs` | `diesel print-schema` 가 만드는 `table!` 정의. 컬럼 타입이 쿼리 검증의 기준 |
| `Queryable` / `Selectable` | 조회 결과를 구조체로 받는 derive. `Selectable` 은 필드 순서가 아니라 이름으로 컬럼을 고름 |
| `Insertable` | 삽입용 구조체 (`#[diesel(table_name = posts)]`) |
| `AsChangeset` | 부분 수정용 구조체 |
| Query DSL | `posts.filter(...).order(...).limit(...)` 처럼 SQL 을 메서드 체인으로 표현 |
| `Connection` | `PgConnection`, `MysqlConnection`, `SqliteConnection`. 풀은 `r2d2` feature 로 제공 |
| `HasQuery` | 2.4 가이드가 쓰는 derive. `Post::query()` 로 선택 컬럼 지정 없이 바로 조회 |

## 기본 사용법
```rust
use diesel::prelude::*;

mod schema {
    diesel::table! {
        posts (id) {
            id -> Int4,
            title -> Varchar,
            published -> Bool,
        }
    }
}
use schema::posts;

#[derive(Queryable, Selectable, Debug)]
#[diesel(table_name = posts, check_for_backend(diesel::pg::Pg))]
struct Post { id: i32, title: String, published: bool }

#[derive(Insertable)]
#[diesel(table_name = posts)]
struct NewPost<'a> { title: &'a str }

fn main() -> QueryResult<()> {
    let url = std::env::var("DATABASE_URL").expect("DATABASE_URL");
    let mut conn = PgConnection::establish(&url).expect("connect");

    let created: Post = diesel::insert_into(posts::table)
        .values(&NewPost { title: "hello" })
        .returning(Post::as_returning())
        .get_result(&mut conn)?;

    let published: Vec<Post> = posts::table
        .filter(posts::published.eq(true))
        .limit(5)
        .select(Post::as_select())
        .load(&mut conn)?;
    println!("{} {}", created.id, published.len());
    Ok(())
}
```

## 자주 쓰는 패턴
- **수정·삭제**: `diesel::update(posts.find(id)).set(published.eq(true)).execute(&mut conn)`, `diesel::delete(posts.filter(...))`.
- **트랜잭션**: `conn.transaction::<_, diesel::result::Error, _>(|conn| { ...; Ok(()) })` 로 감싼다. 클로저가 `Err` 를 반환하면 롤백된다.
- **관계 조회**: `#[derive(Associations)]` + `#[diesel(belongs_to(User))]` 로 부모-자식을 선언하고 `grouped_by` 로 N+1 없이 묶는다. JOIN 은 `.inner_join(...)`.
- **마이그레이션 내장**: `diesel_migrations` 의 `embed_migrations!` 로 바이너리에 SQL 을 넣고 시작 시 적용한다.
- **비동기 서버**: [Axum](/develop-wiki/backend/web-framework/axum/) 같은 비동기 프레임워크에서는 `diesel-async` + 풀(`deadpool`/`bb8`)을 쓰거나 동기 호출을 `spawn_blocking` 으로 감싼다.

## 언제 쓰나 / 피할 때
- 쓸 때: 쿼리 오류를 컴파일 단계에서 잡고 싶은 Rust 서비스, SQL 에 가까운 DSL 로 복잡한 쿼리를 조립해야 할 때.
- 피할 때(대안): 비동기 우선·엔티티 중심 API 는 [SeaORM](/develop-wiki/backend/orm-query/sea-orm/), SQL 문자열을 그대로 쓰며 컴파일 검증만 원하면 [SQLx](/develop-wiki/backend/orm-query/sqlx/). 컴파일 시간이 길어질 수 있고 `table!` 타입 에러 메시지가 장황한 편이다.

## 공식 문서
- [시작하기 가이드](https://diesel.rs/guides/getting-started.html) · [가이드 모음](https://diesel.rs/guides/) · [API(docs.rs)](https://docs.rs/diesel/latest/diesel/) · [릴리스 2.4.0](https://github.com/diesel-rs/diesel/releases/tag/v2.4.0)
- 언어: [Rust](/develop-wiki/languages/rust/)

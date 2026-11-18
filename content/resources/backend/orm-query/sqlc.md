---
name: sqlc
url: https://sqlc.dev
docs: https://docs.sqlc.dev/en/latest/
repo: https://github.com/sqlc-dev/sqlc
stars: 18469
domain: backend
category: orm-query
description: SQL 스키마와 쿼리 파일을 분석해 타입 안전한 Go·Kotlin·Python·TypeScript 코드를 생성하는 SQL 컴파일러. ORM 없이 SQL 을 직접 쓰면서 타입 검사를 받고 싶을 때 쓴다.
pricing: oss
tags: [sql, codegen, go, postgresql, mysql, sqlite]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
sqlc 는 런타임 라이브러리가 아니라 **코드 생성기**다. 스키마(DDL·마이그레이션 파일)와 이름 주석이 붙은 쿼리(`-- name: GetAuthor :one`)를 읽어 SQL 을 파싱·검사하고, 각 쿼리에 대응하는 함수와 행 구조체를 만든다. 애플리케이션은 생성된 함수를 호출할 뿐이라 실행 시 오버헤드나 리플렉션이 없고, 스키마와 맞지 않는 SQL 은 생성 단계에서 오류가 난다.

DB 엔진은 PostgreSQL, MySQL, SQLite 를 지원한다. Go 생성기가 본체에 내장돼 있고, Kotlin·Python·TypeScript 는 공식 플러그인(`sqlc-gen-kotlin`, `sqlc-gen-python`, `sqlc-gen-typescript`, WASM/프로세스 플러그인)으로 제공되며 커뮤니티 플러그인도 있다. 다만 Go 외 플러그인 저장소는 갱신이 드물어(2026-11 기준 마지막 푸시: Kotlin 2025-11, Python 2025-02, TypeScript 2024-11) 실무 사용은 Go 가 대부분이다.

라이선스는 MIT. 2026-11 기준 최신은 **v1.31.1**(2026-04-22). v1.31.0 에서 `SELECT *`·`RETURNING *` 확장기, SQLite 분석기, `sqlc parse` 서브커맨드 등이 추가됐다.

## 설치
```bash
brew install sqlc
# 또는
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
# 또는 Docker: docker run --rm -v $(pwd):/src -w /src sqlc/sqlc generate
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `sqlc.yaml` | `version: "2"` 설정. 엔진·스키마·쿼리 경로·생성 대상(gen) 지정 |
| 쿼리 주석 | `-- name: <함수명> <:one / :many / :exec / :execrows / :copyfrom / :batchexec>` |
| `Queries` | 생성된 구조체. `New(db)` 로 만들고 `WithTx(tx)` 로 트랜잭션에 묶음 |
| `sqlc.arg()` / `@name` | 파라미터에 이름 부여. `sqlc.narg()` 는 nullable 파라미터 |
| `sqlc.embed()` | JOIN 결과에 다른 테이블 구조체를 통째로 포함 |
| `sql_package` | Go 드라이버 선택: `database/sql` 또는 `pgx/v5` |
| `sqlc vet` / `verify` | 쿼리 린트 규칙, 스키마 변경이 기존 쿼리를 깨는지 검사 |
| overrides | DB 타입 → Go 타입 매핑 변경 (예: `uuid` → `github.com/google/uuid.UUID`) |

## 기본 사용법
```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    schema: "schema.sql"
    queries: "query.sql"
    gen:
      go:
        package: "db"
        out: "internal/db"
        sql_package: "pgx/v5"
```
```sql
-- query.sql   (schema.sql 에 CREATE TABLE authors (id BIGSERIAL PRIMARY KEY, name text NOT NULL, bio text);)
-- name: GetAuthor :one
SELECT * FROM authors WHERE id = $1;

-- name: CreateAuthor :one
INSERT INTO authors (name, bio) VALUES ($1, $2) RETURNING *;
```
`sqlc generate` 후 Go 코드에서:
```go
conn, _ := pgx.Connect(ctx, os.Getenv("DATABASE_URL"))
q := db.New(conn)
a, err := q.CreateAuthor(ctx, db.CreateAuthorParams{
	Name: "Kim", Bio: pgtype.Text{String: "writer", Valid: true},
})
if err != nil { log.Fatal(err) }
got, _ := q.GetAuthor(ctx, a.ID)
fmt.Println(got.Name)
```

## 자주 쓰는 패턴
- **마이그레이션 디렉터리를 스키마로**: `schema` 에 golang-migrate·goose·Atlas 마이그레이션 폴더를 지정하면 up 파일만 읽어 최종 스키마를 계산한다.
- **트랜잭션**: `tx, _ := conn.Begin(ctx); qtx := q.WithTx(tx)` 로 같은 함수를 트랜잭션 안에서 쓴다.
- **동적 필터**: 조건이 선택적이면 `WHERE (sqlc.narg('name')::text IS NULL OR name = sqlc.narg('name'))` 처럼 SQL 로 표현한다. 정말 동적인 쿼리는 쿼리 빌더를 병행한다.
- **CI 검사**: `sqlc diff`(생성 결과가 커밋과 같은지)와 `sqlc vet` 을 파이프라인에 넣는다.
- **인터페이스 생성**: `emit_interface: true` 로 `Querier` 인터페이스를 만들어 테스트 목(mock)에 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 을 직접 쓰는 Go 서비스, DBA 가 검토한 SQL 을 그대로 실행하고 싶을 때, 런타임 리플렉션 없는 성능이 중요할 때.
- 피할 때(대안): 검색 조건이 매우 동적이거나 엔티티 관계 탐색이 많으면 Go ORM 인 [ent](/develop-wiki/backend/orm-query/ent/)·[GORM](/develop-wiki/backend/orm-query/gorm/), Rust 에서 같은 철학이 필요하면 [SQLx](/develop-wiki/backend/orm-query/sqlx/), TypeScript 에서는 [Kysely](/develop-wiki/backend/orm-query/kysely/)·[Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/).

## 공식 문서
- [문서](https://docs.sqlc.dev/en/latest/) · [설치](https://docs.sqlc.dev/en/latest/overview/install.html) · [PostgreSQL 시작하기](https://docs.sqlc.dev/en/latest/tutorials/getting-started-postgresql.html) · [설정 레퍼런스](https://docs.sqlc.dev/en/latest/reference/config.html) · [언어 지원](https://docs.sqlc.dev/en/latest/reference/language-support.html) · [Playground](https://play.sqlc.dev)
- 언어: [Go](/develop-wiki/languages/go/)

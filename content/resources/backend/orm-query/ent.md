---
name: ent
url: https://entgo.io
docs: https://entgo.io/docs/getting-started
repo: https://github.com/ent/ent
stars: 17241
domain: backend
category: orm-query
description: Go 코드로 스키마를 정의하면 정적 타입 클라이언트를 생성하는 Go 엔티티 프레임워크. 엔티티 관계(그래프)가 많은 Go 서비스에서 타입 안전한 ORM 이 필요할 때 쓴다.
pricing: oss
tags: [go, orm, codegen, graph, schema-as-code]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
ent 는 Meta 내부의 엔티티 프레임워크에서 영감을 받아 만든 Go ORM 이다. 스키마를 Go 코드(`Fields()`, `Edges()`)로 선언하고 `go generate` 를 돌리면 엔티티별 빌더·쿼리·조건자(predicate) 코드가 생성된다. 생성 코드라서 `interface{}` 나 문자열 컬럼명 없이 컴파일 시점에 타입이 검사되고, 엣지(관계)를 따라가는 그래프 탐색 쿼리를 자연스럽게 쓸 수 있다.

MySQL, MariaDB, TiDB, PostgreSQL, CockroachDB, SQLite, Gremlin 을 지원한다. 현재는 스키마 마이그레이션 도구 **Atlas** 팀이 개발·유지하며, 버전 관리형 마이그레이션도 Atlas 와 연동한다.

라이선스는 Apache-2.0. 2026-11 기준 최신은 **v0.14.6**(Go 모듈 태그 2026-03-17). 아직 v1 이전이라 마이너 버전에서 생성 코드가 바뀔 수 있다. 커밋은 계속되지만 릴리스 간격은 긴 편이다.

## 설치
```bash
go mod init entdemo
go run -mod=mod entgo.io/ent/cmd/ent new User     # ent/schema/user.go 생성
# 스키마 수정 후
go generate ./ent
go get github.com/mattn/go-sqlite3                 # 예제용 드라이버
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Schema | `ent/schema/*.go` 의 구조체. `ent.Schema` 를 임베드 |
| Fields | `field.String("name")`, `field.Int("age").Positive()`, `.Optional()`, `.Unique()` |
| Edges | 관계. `edge.To("cars", Car.Type)`, 역방향 `edge.From("owner", User.Type).Ref("cars").Unique()` |
| Client | 생성된 진입점. `ent.Open(driver, dsn)`, `client.User.Create()/Query()/Update()` |
| Predicates | 생성된 조건 함수. `user.NameEQ("a")`, `user.AgeGT(18)`, `user.HasCars()` |
| Eager loading | `WithCars()` 로 연관 엔티티를 함께 로드 |
| Hooks / Privacy | 변경 전후 훅, 엔티티 단위 권한 정책 |
| 마이그레이션 | 자동 `client.Schema.Create(ctx)` 또는 Atlas 버전 관리 마이그레이션 |

## 기본 사용법
스키마 정의(`ent/schema/user.go`):
```go
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty(),
		field.Int("age").Positive(),
	}
}
```
생성 후 사용:
```go
client, err := ent.Open("sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
if err != nil { log.Fatal(err) }
defer client.Close()
ctx := context.Background()
if err := client.Schema.Create(ctx); err != nil { log.Fatal(err) }

u, err := client.User.Create().SetName("kim").SetAge(30).Save(ctx)
if err != nil { log.Fatal(err) }
adults, _ := client.User.Query().Where(user.AgeGTE(20)).All(ctx)
_ = client.User.UpdateOne(u).AddAge(1).Exec(ctx)
fmt.Println(len(adults))
```

## 자주 쓰는 패턴
- **그래프 탐색**: `client.User.Query().Where(user.Name("kim")).QueryCars().All(ctx)` 처럼 엣지를 따라 쿼리를 이어 간다.
- **트랜잭션**: `tx, _ := client.Tx(ctx)` 로 받은 `tx.User.Create()...` 를 쓰고 `tx.Commit()`/`tx.Rollback()`.
- **버전 관리 마이그레이션**: 운영에서는 자동 마이그레이션 대신 Atlas 로 마이그레이션 파일을 생성·리뷰·적용한다.
- **GraphQL 연동**: `entgql` 확장으로 [gqlgen](/develop-wiki/backend/api/gqlgen/) 스키마·Relay 페이지네이션·필터를 생성한다.
- **OpenAPI·gRPC**: `entoas`, `entproto` 확장으로 스키마에서 API 정의를 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 엔티티와 관계가 많은 Go 백엔드, 스키마를 코드로 리뷰하고 컴파일 타입 검사를 원할 때, GraphQL API 를 엔티티에서 바로 만들 때.
- 피할 때(대안): SQL 을 직접 쓰고 싶으면 [sqlc](/develop-wiki/backend/orm-query/sqlc/), 코드 생성 없이 빠르게 시작하려면 [GORM](/develop-wiki/backend/orm-query/gorm/).

## 공식 문서
- [시작하기](https://entgo.io/docs/getting-started) · [스키마 필드](https://entgo.io/docs/schema-fields) · [엣지](https://entgo.io/docs/schema-edges) · [버전 관리 마이그레이션](https://entgo.io/docs/versioned-migrations) · [GraphQL 연동](https://entgo.io/docs/graphql)
- 언어: [Go](/develop-wiki/languages/go/)

---
name: gqlgen
url: https://gqlgen.com
docs: https://gqlgen.com/getting-started/
repo: https://github.com/99designs/gqlgen
stars: 10774
domain: backend
category: api
description: GraphQL 스키마(SDL)에서 Go 타입과 리졸버 뼈대를 생성하는 스키마 우선 GraphQL 서버 라이브러리. Go 로 타입 안전한 GraphQL API 를 만들 때 쓴다.
pricing: oss
tags: [graphql, go, codegen, schema-first]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
gqlgen 은 99designs 가 만든 Go [GraphQL](/develop-wiki/backend/api/graphql/) 서버 라이브러리다. **스키마 우선** 방식으로 `.graphqls` 파일에 SDL 을 쓰고 생성기를 돌리면, 스키마에 맞는 Go 모델과 리졸버 인터페이스·실행 코드가 만들어진다. 개발자는 생성된 리졸버 함수 본문만 채우면 되고, 인자·반환 타입이 모두 Go 정적 타입이라 `map[string]interface{}` 를 다룰 일이 없다. 기존 Go 구조체를 스키마 타입에 연결(autobind)할 수도 있다.

라이선스는 MIT. 2026-11 기준 최신은 **v0.17.98**(2026-10-22). 오랫동안 v0.17.x 로 자주 릴리스되고 있으며, 최근 문서는 Go 1.24 의 `tool` 지시어로 생성기를 설치하도록 안내한다.

## 설치
```bash
mkdir example && cd example
go mod init example
go get -tool github.com/99designs/gqlgen   # go.mod 의 tool 의존성으로 추가
go tool gqlgen init                        # gqlgen.yml, graph/schema.graphqls, server.go 생성
go run server.go                           # http://localhost:8080 플레이그라운드
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `gqlgen.yml` | 스키마 경로, 생성 위치(exec·model·resolver), autobind·models 매핑 설정 |
| `schema.graphqls` | SDL 원본. 수정 후 `go tool gqlgen generate` |
| `generated.go` | 실행기(executable schema). 직접 수정하지 않음 |
| `models_gen.go` | 스키마에서 생성된 Go 모델 |
| `*.resolvers.go` | 리졸버 구현 파일. 재생성해도 작성한 본문은 유지 |
| `Resolver` 구조체 | 의존성(DB, 서비스)을 담는 루트. `resolver.go` 에 필드 추가 |
| 필드 리졸버 | `models` 설정에서 `resolver: true` 로 지정하면 해당 필드를 별도 함수로 지연 해석 |
| 디렉티브 | 스키마 디렉티브(`@auth` 등)를 Go 함수로 구현해 미들웨어처럼 사용 |

## 기본 사용법
```graphql
# graph/schema.graphqls
type Todo { id: ID!  text: String!  done: Boolean! }
type Query { todos: [Todo!]! }
type Mutation { createTodo(text: String!): Todo! }
```
`go tool gqlgen generate` 후 생성된 리졸버 채우기:
```go
// graph/resolver.go
type Resolver struct{ todos []*model.Todo }

// graph/schema.resolvers.go
func (r *mutationResolver) CreateTodo(ctx context.Context, text string) (*model.Todo, error) {
	t := &model.Todo{ID: fmt.Sprint(len(r.todos) + 1), Text: text}
	r.todos = append(r.todos, t)
	return t, nil
}

func (r *queryResolver) Todos(ctx context.Context) ([]*model.Todo, error) {
	return r.todos, nil
}
```
생성기 실행을 소스에 기록해 두려면 `resolver.go` 에 `//go:generate go tool gqlgen generate` 를 두고 `go generate ./...` 를 쓴다.

## 자주 쓰는 패턴
- **기존 모델 재사용**: `gqlgen.yml` 의 `autobind` 나 `models:` 에 패키지를 지정해 도메인 구조체를 그대로 GraphQL 타입으로 쓴다.
- **N+1 방지**: 연관 필드를 `resolver: true` 로 분리하고, 요청 단위 DataLoader(예: `vikstrous/dataloadgen`)를 미들웨어로 컨텍스트에 넣는다.
- **인증**: HTTP 미들웨어에서 사용자 정보를 `context` 에 넣고, 리졸버나 `@auth` 디렉티브 구현에서 꺼내 검사한다.
- **쿼리 복잡도 제한**: `handler` 에 `extension.FixedComplexityLimit(n)` 을 추가해 과도한 중첩 쿼리를 막는다.
- **ent 연동**: [ent](/develop-wiki/backend/orm-query/ent/) 의 `entgql` 확장이 gqlgen 용 스키마·리졸버·Relay 페이지네이션을 생성한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Go 로 GraphQL API 를 만들면서 스키마를 계약으로 먼저 합의하고 싶을 때, 정적 타입 리졸버를 원할 때.
- 피할 때(대안): 코드에서 스키마를 조립하고 싶으면 graphql-go 계열 라이브러리, GraphQL 이 꼭 필요하지 않으면 [gRPC](/develop-wiki/backend/api/grpc/)(+[Buf](/develop-wiki/backend/api/buf/))나 REST.

## 공식 문서
- [시작하기](https://gqlgen.com/getting-started/) · [설정 레퍼런스](https://gqlgen.com/config/) · [DataLoader 가이드](https://gqlgen.com/reference/dataloaders/) · [예제](https://github.com/99designs/gqlgen/tree/master/_examples) · [API(pkg.go.dev)](https://pkg.go.dev/github.com/99designs/gqlgen)
- 언어: [Go](/develop-wiki/languages/go/)

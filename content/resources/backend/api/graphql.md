---
name: GraphQL
url: https://graphql.org
docs: https://graphql.org/learn/
repo: https://github.com/graphql/graphql-spec
stars: 14596
domain: backend
category: api
description: 클라이언트가 필요한 필드를 쿼리로 지정해 받는 API 쿼리 언어와 타입 시스템 명세. 여러 화면·클라이언트가 같은 데이터를 다르게 조합할 때 쓴다.
pricing: oss
tags: [graphql, api, schema, apollo]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GraphQL 은 GraphQL Foundation 이 관리하는 API 명세다. 서버는 타입 시스템(SDL)으로 스키마를 공개하고, 클라이언트는 하나의 엔드포인트에 필요한 필드만 담은 쿼리를 보낸다. 응답 모양이 쿼리 모양과 같아 오버페칭·언더페칭이 줄고, 스키마 자체가 문서이자 타입 원천이 된다. 읽기는 `query`, 쓰기는 `mutation`, 실시간 이벤트는 `subscription` 으로 나뉜다.

명세는 언어 중립이고 언어별 구현을 고른다. 참조 구현 **graphql-js**(2026-11 최신 17.1.0, 16.x 도 유지)와 그 위의 서버들이 있다.
| 언어 | 대표 서버 라이브러리 |
| --- | --- |
| TypeScript | Apollo Server(5.x), GraphQL Yoga, Pothos(코드 우선 스키마) |
| Python | Strawberry, Graphene |
| Go | gqlgen(스키마 우선 코드 생성) |
| Rust | async-graphql, Juniper |
| Java/Kotlin | Spring for GraphQL, Netflix DGS |
| C# | Hot Chocolate |

## 설치
TypeScript + Apollo Server 기준.
```bash
npm install @apollo/server graphql
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| SDL | `type`, `input`, `enum`, `interface`, `union` 으로 스키마 선언 |
| 루트 타입 | `Query`, `Mutation`, `Subscription` |
| 리졸버 | 필드 값을 계산하는 함수 `(parent, args, context, info)` |
| 인트로스펙션 | 스키마를 쿼리로 조회. 도구·코드 생성의 기반 |
| 프래그먼트·변수 | 쿼리 재사용과 파라미터화 |
| 페더레이션 | 여러 서비스의 스키마를 하나의 그래프로 합성(Apollo Federation 등) |

## 기본 사용법
```ts
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

const typeDefs = `#graphql
  type Book { id: ID!, title: String!, author: Author! }
  type Author { name: String! }
  type Query { books: [Book!]! }
`
const books = [{ id: '1', title: 'GraphQL 입문', authorName: 'Kim' }]

const resolvers = {
  Query: { books: () => books },
  Book: { author: (book: { authorName: string }) => ({ name: book.authorName }) },
}

const server = new ApolloServer({ typeDefs, resolvers })
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } })
console.log(url)
```
```graphql
query { books { title author { name } } }
```

## 자주 쓰는 패턴
- **N+1 방지**: 리졸버마다 DB 를 부르지 말고 DataLoader 로 요청 내 키를 모아 일괄 조회한다.
- **보안 제한**: 쿼리 깊이·복잡도 제한, 운영에서 인트로스펙션 차단, 허용된 쿼리만 받는 persisted queries 를 적용한다.
- **타입 생성**: GraphQL Code Generator 로 클라이언트 쿼리와 서버 리졸버의 TS 타입을 만든다.
- **인증**: 컨텍스트 생성 함수에서 토큰을 검증하고 리졸버에서 `context.user` 로 권한을 검사한다.
- **오류 처리**: HTTP 상태 대신 응답의 `errors` 배열과 `extensions.code` 로 오류를 구분한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 웹·모바일 등 여러 클라이언트가 같은 도메인을 다른 모양으로 조회할 때, 여러 백엔드를 하나의 API 로 묶는 BFF·게이트웨이.
- 피할 때(대안): 단순 CRUD·HTTP 캐시가 중요하면 REST + [OpenAPI](/develop-wiki/backend/api/openapi/), 서비스 간 내부 통신은 [gRPC](/develop-wiki/backend/api/grpc/), TS 단일 저장소면 [tRPC](/develop-wiki/backend/api/trpc/).

## 공식 문서
- [GraphQL 학습](https://graphql.org/learn/) · [명세](https://spec.graphql.org) · [graphql-js](https://www.graphql-js.org/) · [Apollo Server 문서](https://www.apollographql.com/docs/apollo-server/)

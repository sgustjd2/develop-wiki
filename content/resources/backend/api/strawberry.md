---
name: Strawberry
url: https://strawberry.rocks
docs: https://strawberry.rocks/docs
repo: https://github.com/strawberry-graphql/strawberry
stars: 4733
domain: backend
category: api
description: Python 타입 힌트와 dataclass 로 GraphQL 스키마를 정의하는 코드 우선 GraphQL 라이브러리. FastAPI·Django 등 Python 백엔드에 GraphQL API 를 붙일 때 쓴다.
pricing: oss
tags: [graphql, python, type-hints, code-first, asgi]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Strawberry 는 Python 의 타입 힌트를 스키마 원천으로 쓰는 [GraphQL](/develop-wiki/backend/api/graphql/) 서버 라이브러리다. `@strawberry.type` 을 붙인 클래스가 GraphQL 객체 타입이 되고, 필드 타입은 어노테이션(`str`, `int | None`, `list[Book]`)에서 그대로 추론된다. 별도 SDL 파일이나 스키마 DSL 없이 mypy·pyright 같은 타입 검사기와 IDE 자동 완성을 그대로 활용할 수 있는 **코드 우선** 방식이다. 비동기 리졸버, 구독(WebSocket), DataLoader, Federation, Relay 를 지원한다.

웹 프레임워크 연동은 FastAPI, Django, Flask, Starlette/ASGI, Litestar, Sanic, aiohttp, Quart, Chalice 등을 제공한다.

라이선스는 MIT. 2026-11 기준 최신은 **0.341.2**(2026-11-07)이고 Python 3.11 이상이 필요하다. 아직 0.x 버전이라 마이너 릴리스에서 동작이 바뀌는 경우가 있어 변경 이력(Breaking changes 페이지)을 확인하고 버전을 고정해 쓴다.

## 설치
```bash
pip install "strawberry-graphql[fastapi]"     # FastAPI 연동
pip install "strawberry-graphql[cli]"          # 개발 서버·스키마 내보내기 CLI: strawberry dev app:schema
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@strawberry.type` | 객체 타입. 클래스 어노테이션이 필드 |
| `@strawberry.field` | 메서드를 리졸버 필드로 노출. 인자도 타입 힌트로 정의 |
| `@strawberry.input` | 뮤테이션 입력 타입 |
| `@strawberry.mutation` | 뮤테이션 필드 |
| `strawberry.Schema(query=, mutation=, subscription=)` | 스키마 생성 |
| `Info` | 리졸버의 `info: strawberry.Info` 로 컨텍스트·요청 정보 접근 |
| `DataLoader` | `strawberry.dataloader.DataLoader(load_fn=...)` 로 배치·캐시 |
| Permissions | `BasePermission` 을 상속해 필드 단위 권한 검사 |
| Extensions | 쿼리 깊이 제한, 마스킹, 트레이싱 등 실행 확장 |

## 기본 사용법
FastAPI 에 GraphQL 엔드포인트 붙이기:
```python
import strawberry
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class Book:
    title: str
    author: str

BOOKS = [Book(title="Dune", author="Frank Herbert")]

@strawberry.type
class Query:
    @strawberry.field
    def books(self, author: str | None = None) -> list[Book]:
        return [b for b in BOOKS if author is None or b.author == author]

@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_book(self, title: str, author: str) -> Book:
        book = Book(title=title, author=author)
        BOOKS.append(book)
        return book

schema = strawberry.Schema(query=Query, mutation=Mutation)
app = FastAPI()
app.include_router(GraphQLRouter(schema), prefix="/graphql")
```
Python 의 snake_case 이름은 스키마에서 camelCase(`addBook`)로 바뀐다.

## 자주 쓰는 패턴
- **컨텍스트 주입**: `GraphQLRouter(schema, context_getter=get_context)` 에 FastAPI 의존성을 넘겨 DB 세션·현재 사용자를 `info.context` 로 전달한다.
- **DataLoader**: 요청마다 컨텍스트에서 `DataLoader(load_fn=load_authors)` 를 새로 만들고, 리졸버에서 `await loader.load(id)` 로 N+1 을 막는다.
- **ORM 연동**: [SQLAlchemy](/develop-wiki/backend/orm-query/sqlalchemy/)·[SQLModel](/develop-wiki/backend/orm-query/sqlmodel/) 모델은 별도 `@strawberry.type` 으로 감싸거나 `strawberry.experimental.pydantic` 변환을 쓴다. Django 는 공식 `strawberry-django` 패키지를 쓴다.
- **스키마 내보내기**: (`[cli]` 추가 설치) `strawberry export-schema app:schema > schema.graphql` 로 SDL 을 만들어 클라이언트 코드 생성·리뷰에 쓴다.
- **보안 확장**: `QueryDepthLimiter`, `MaskErrors` 확장으로 과도한 쿼리와 내부 오류 노출을 막는다.

## 언제 쓰나 / 피할 때
- 쓸 때: [FastAPI](/develop-wiki/backend/web-framework/fastapi/)·[Django](/develop-wiki/backend/web-framework/django/) 앱에 타입 안전한 GraphQL API 를 붙일 때, 스키마를 Python 코드와 한 곳에서 관리하고 싶을 때.
- 피할 때(대안): SDL 을 먼저 쓰는 스키마 우선 방식을 원하면 Ariadne, Django 생태계에 오래 정착한 코드베이스면 Graphene-Django 도 있다. GraphQL 이 꼭 필요 없으면 FastAPI 의 REST+[OpenAPI](/develop-wiki/backend/api/openapi/).

## 공식 문서
- [문서](https://strawberry.rocks/docs) · [FastAPI 연동](https://strawberry.rocks/docs/integrations/fastapi) · [DataLoader](https://strawberry.rocks/docs/guides/dataloaders) · [Breaking changes](https://strawberry.rocks/docs/breaking-changes) · [변경 이력](https://github.com/strawberry-graphql/strawberry/blob/main/CHANGELOG.md)
- 언어: [Python](/develop-wiki/languages/python/)

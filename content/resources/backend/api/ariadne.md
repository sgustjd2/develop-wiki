---
name: Ariadne
url: https://ariadnegraphql.org
docs: https://ariadnegraphql.org/server/Docs/intro
repo: https://github.com/mirumee/ariadne
stars: 2350
domain: backend
category: api
description: SDL 로 스키마를 먼저 쓰고 파이썬 함수를 리졸버로 연결하는 스키마 우선 GraphQL 서버 라이브러리. ASGI·WSGI 와 FastAPI·Django·Flask 연동을 제공한다.
pricing: oss
tags: [graphql, python, schema-first, asgi, wsgi, federation]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Ariadne 는 GraphQL SDL(스키마 정의 언어)을 직접 작성하고, 필드마다 파이썬 함수를 바인딩하는 **스키마 우선** 라이브러리다. 타입 힌트로 스키마를 만드는 [Strawberry](/develop-wiki/backend/api/strawberry/) 와 반대 방향이며, 스키마를 프런트엔드·다른 팀과 먼저 합의하는 워크플로에 맞는다. 전역 상태나 레지스트리가 없어 한 코드베이스에서 여러 GraphQL API 를 둘 수 있고, 비동기 리졸버·구독·파일 업로드·Apollo Federation 을 지원한다.

라이선스는 BSD-3-Clause, 최신 안정판은 **1.1.1**(2026-10-07)이며 Python 3.10 이상(3.14 까지)이 필요하다. 같은 계열의 Graphene(코드 우선, MIT)은 마지막 릴리스가 3.4.3(2024-11), 마지막 push 가 2025-09 라서 이 사이트에는 별도 항목으로 올리지 않았다. 기존 Graphene 프로젝트를 유지보수 중이라면 그대로 쓸 수는 있지만 신규 개발은 Ariadne 나 Strawberry 를 권한다.

## 설치
```bash
pip install ariadne uvicorn
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `gql()` | SDL 문자열을 검증해 오류 위치를 알려 주는 헬퍼 |
| `QueryType` / `MutationType` / `SubscriptionType` | 루트 타입에 리졸버를 바인딩하는 객체 |
| `ObjectType("Name")` | 임의 타입의 필드에 리졸버를 바인딩 |
| `make_executable_schema` | SDL 과 바인더들을 합쳐 실행 가능한 스키마 생성 |
| `ariadne.asgi.GraphQL` | 스키마를 ASGI 앱으로 서빙 (GraphiQL 탐색기 내장) |
| 이름 변환 | `camelCase` 필드를 `snake_case` 로 자동 매핑하는 선택 기능 |
| 확장 | OpenTelemetry, SQLAlchemy 2.0 연동 등 |

## 기본 사용법
```python
# example.py — uvicorn example:app
from ariadne import ObjectType, QueryType, gql, make_executable_schema
from ariadne.asgi import GraphQL

type_defs = gql("""
    type Query { people: [Person!]! }
    type Person { firstName: String  lastName: String  fullName: String }
""")

query = QueryType()

@query.field("people")
def resolve_people(*_):
    return [{"firstName": "Gil", "lastName": "Hong"}]

person = ObjectType("Person")

@person.field("fullName")
def resolve_full_name(obj, *_):
    return f'{obj["firstName"]} {obj["lastName"]}'

schema = make_executable_schema(type_defs, query, person)
app = GraphQL(schema, debug=True)
```
`uvicorn example:app` 으로 실행하면 브라우저에서 GraphiQL 이 열린다.

## 자주 쓰는 패턴
- **FastAPI·Starlette 연결**: `GraphQL` ASGI 앱을 `app.mount("/graphql", graphql_app)` 으로 마운트한다.
- **컨텍스트 주입**: `GraphQL(schema, context_value=get_context)` 로 요청 정보·DB 세션을 `info.context` 에 전달한다.
- **스키마 파일 분리**: `.graphql` 파일을 `load_schema_from_path("schema/")` 로 읽는다.
- **비동기 리졸버**: `async def` 리졸버를 그대로 쓰며, N+1 은 DataLoader 패턴으로 묶는다.
- **인증**: 별도 저장소 `ariadne-auth` 의 유틸리티나 컨텍스트에서 사용자 정보를 읽어 필드 단위로 검사한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 스키마 계약을 먼저 설계하는 팀, 기존 SDL 자산을 파이썬으로 구현할 때.
- 피할 때(대안): 파이썬 타입에서 스키마를 자동으로 만들고 싶으면 [Strawberry](/develop-wiki/backend/api/strawberry/). 단순 CRUD API 면 REST 로 충분할 수 있다.

## 공식 문서
- [서버 문서](https://ariadnegraphql.org/server/Docs/intro) · [GitHub README](https://github.com/mirumee/ariadne#readme) · [PyPI](https://pypi.org/project/ariadne/)
- 언어: [Python](/develop-wiki/languages/python/)

---
name: Litestar
url: https://litestar.dev
repo: https://github.com/litestar-org/litestar
stars: 8573
docs: https://docs.litestar.dev/latest/
domain: backend
category: web-framework
description: 의존성 주입·가드·DTO·OpenAPI 3.1 을 내장한 Python ASGI API 프레임워크. msgspec 기반 직렬화와 다양한 모델 타입을 지원한다.
pricing: oss
tags: [asgi, openapi, msgspec, dto, async]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Litestar 는 API 구축에 초점을 둔 의견이 있는(opinionated) ASGI 프레임워크다. 핸들러의 타입 힌트로 요청 검증·직렬화·OpenAPI 문서를 만들고, 의존성 주입·가드·미들웨어·수명주기 훅·플러그인을 계층(앱·라우터·컨트롤러·핸들러)별로 둔다. 모델은 dataclass, TypedDict, msgspec, Pydantic v1/v2, attrs 를 쓸 수 있다.

같은 영역의 [FastAPI](/develop-wiki/backend/web-framework/fastapi/) 와 달리 컨트롤러 클래스, 내장 가드, DTO 계층이 기본 제공된다. 프로젝트는 Starlite 가 이름을 바꾼 것이다.

## 설치
```bash
pip install "litestar[standard]"     # CLI + uvicorn
uv add "litestar[standard]"
litestar run                          # app.py 의 app 을 찾아 실행
```
현재 v2.25.0(2026-10-18), PyPI 메타데이터상 Python `>=3.8,<4.0`, MIT 라이선스.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 라우트 핸들러 | `@get`, `@post` 등으로 장식한 함수. 반환 타입 어노테이션이 필수다 |
| `Controller` | 같은 `path` 아래 핸들러를 클래스로 묶는다 |
| `Provide` | `dependencies={"name": Provide(fn)}` 로 계층별 DI |
| `guards` | 핸들러 실행 전 인가 검사. 실패 시 `NotAuthorizedException` |
| DTO | 입출력 필드를 제어하는 계층(`DTOData`, 필드 제외) |
| 플러그인 | SQLAlchemy(`advanced-alchemy`), OpenAPI UI(Scalar·Swagger·Redoc 등) 확장 |
| 미들웨어 | CORS, CSRF, rate limit, 압축, 세션 내장 |

## 기본 사용법
```python
from dataclasses import dataclass
from litestar import Litestar, get, post
from litestar.exceptions import NotFoundException

@dataclass
class Todo:
    title: str
    done: bool = False

todos: dict[int, Todo] = {}

@get("/todos/{todo_id:int}")
async def read_todo(todo_id: int) -> Todo:
    if todo_id not in todos:
        raise NotFoundException()
    return todos[todo_id]

@post("/todos")
async def create_todo(data: Todo) -> dict[str, int]:
    todo_id = len(todos) + 1
    todos[todo_id] = data
    return {"id": todo_id}

app = Litestar([read_todo, create_todo])
```
`@post` 의 기본 상태 코드는 201 이다. 본문이 `Todo` 에 맞지 않으면 400 응답이 나간다. 문서 UI 는 기본 `/schema` 아래에서 제공된다(경로는 OpenAPIConfig 로 변경).

## 자주 쓰는 패턴
- **컨트롤러**: `class UserController(Controller): path = "/users"` 안에 `@get`/`@post` 메서드를 둔다.
- **DI**: `Litestar([...], dependencies={"db": Provide(provide_session)})` 후 핸들러 인자로 `db` 를 받는다. 계층 아래에서 같은 이름으로 덮어쓸 수 있다.
- **가드**: `@get("/", guards=[is_authorized])`. 가드는 `(connection, handler)` 를 받는 함수다.
- **DB**: [SQLAlchemy](/develop-wiki/backend/orm-query/sqlalchemy/) 연동은 `advanced-alchemy` 패키지의 플러그인이 맡는다.
- **테스트**: `from litestar.testing import TestClient` 로 `with TestClient(app=app) as client:` 후 `client.post("/todos", json={"title": "a"})` 를 호출한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 컨트롤러·가드·DTO 같은 구조를 기본으로 원하는 Python API, msgspec 직렬화 성능과 여러 모델 타입을 함께 써야 할 때.
- 피할 때(대안): 커뮤니티 규모·튜토리얼이 필요하면 [FastAPI](/develop-wiki/backend/web-framework/fastapi/), 관리자·ORM 일체형은 [Django](/develop-wiki/backend/web-framework/django/). 미해결 이슈가 많은 편(약 360건)이라 버전 업그레이드 전 릴리스 노트를 확인한다.

## 공식 문서
- [문서 홈](https://docs.litestar.dev/latest/) · [GitHub README](https://github.com/litestar-org/litestar) · [OpenAPI UI 플러그인](https://docs.litestar.dev/latest/usage/openapi/ui_plugins.html)

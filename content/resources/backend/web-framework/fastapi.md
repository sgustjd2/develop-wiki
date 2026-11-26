---
name: FastAPI
url: https://fastapi.tiangolo.com
repo: https://github.com/fastapi/fastapi
stars: 105057
docs: https://fastapi.tiangolo.com/tutorial/
domain: backend
category: web-framework
description: 타입 힌트와 Pydantic으로 요청 검증과 OpenAPI 문서를 자동 생성하는 Python 비동기 API 프레임워크. JSON API·ML 서빙 서버에 쓴다.
pricing: oss
tags: [asgi, openapi, pydantic, async]
languages: [python]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
FastAPI 는 Starlette(ASGI 웹 계층)와 Pydantic(데이터 검증) 위에 만든 Python API 프레임워크다. 함수 매개변수의 타입 힌트를 읽어 경로·쿼리·본문을 파싱·검증하고, 같은 정보로 OpenAPI 스키마와 Swagger UI(`/docs`)·ReDoc(`/redoc`) 문서를 자동으로 만든다. `async def` 와 일반 `def` 핸들러를 모두 지원한다.

관리자 화면·템플릿까지 갖춘 풀스택이 필요하면 [Django](/develop-wiki/backend/web-framework/django/), JSON API·ML 모델 서빙처럼 API 만 필요하면 FastAPI 가 가볍다.

## 설치
```bash
uv add "fastapi[standard]"           # uv 프로젝트
pip install "fastapi[standard]"      # 가상환경 + pip
```
`standard` extra 에는 `uvicorn[standard]`(서버), `fastapi-cli`(`fastapi` 명령), `httpx`(TestClient), `python-multipart`(폼), `jinja2` 등이 들어 있다. 최소 설치는 `fastapi` 만 받는다.

```bash
fastapi dev main.py     # 개발 서버 (자동 리로드, http://127.0.0.1:8000)
fastapi run main.py     # 운영 모드
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 경로 작업 | `@app.get("/items/{item_id}")` 처럼 메서드·경로 데코레이터를 붙인 함수 |
| 매개변수 해석 | 경로에 있으면 path, 기본 타입이면 query, Pydantic 모델이면 JSON body |
| Pydantic 모델 | `BaseModel` 상속 클래스. 요청 검증과 `response_model` 출력 필터에 쓴다 |
| `Depends` | 의존성 주입. DB 세션·인증 사용자 등을 함수로 정의해 핸들러에 주입 |
| `APIRouter` | 라우트를 모듈 단위로 나누고 `app.include_router(router, prefix=...)` 로 합친다 |
| `HTTPException` | 상태 코드와 메시지로 에러 응답을 즉시 반환 |
| 자동 문서 | `/docs`(Swagger UI), `/redoc`, `/openapi.json` |

## 기본 사용법
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class TodoIn(BaseModel):
    title: str
    done: bool = False

todos: dict[int, TodoIn] = {}

@app.get("/todos/{todo_id}")
async def read_todo(todo_id: int):
    if todo_id not in todos:
        raise HTTPException(status_code=404, detail="not found")
    return todos[todo_id]

@app.post("/todos", status_code=201)
async def create_todo(todo: TodoIn):
    todo_id = len(todos) + 1
    todos[todo_id] = todo
    return {"id": todo_id, **todo.model_dump()}
```
`todo_id` 가 정수가 아니거나 본문에 `title` 이 없으면 FastAPI 가 422 응답과 오류 위치를 돌려준다.

## 자주 쓰는 패턴
- **라우터 분리**: `router = APIRouter(prefix="/todos", tags=["todos"])` 로 파일을 나누고 `app.include_router(router)`.
- **의존성 주입**: DB 세션·현재 사용자를 함수로 만들고 `Annotated[Session, Depends(get_session)]` 형태로 받는다. `yield` 를 쓰면 요청 종료 후 정리 코드가 실행된다.
- **검증 강화**: `Field(min_length=1)`, `Query(max_length=50)` 처럼 제약을 붙이고, 응답은 `response_model` 로 노출 필드를 제한한다.
- **미들웨어**: `@app.middleware("http")` 로 요청·응답을 감싸거나 Starlette 미들웨어(`CORSMiddleware` 등)를 `app.add_middleware()` 로 추가한다.
- **DB 연동**: SQLAlchemy 또는 SQLModel 세션을 `Depends` 로 주입하는 구성이 문서에서 다루는 기본 형태다. DB 는 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 이 흔하다.
- **테스트**: `TestClient` 로 서버 없이 호출한다. 테스트 함수는 일반 `def` 이고 `await` 가 필요 없다.
  ```python
  from fastapi.testclient import TestClient
  client = TestClient(app)

  def test_create():
      res = client.post("/todos", json={"title": "a"})
      assert res.status_code == 201
  ```
  의존성은 `app.dependency_overrides[get_session] = fake_session` 으로 바꿔 끼운다.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 으로 만드는 JSON API, ML·LLM 모델 서빙, OpenAPI 문서와 클라이언트 생성이 중요한 서비스, 타입 힌트 중심 코드베이스.
- 피할 때(대안): 관리자 화면·인증·템플릿·ORM 을 한 번에 원하면 [Django](/develop-wiki/backend/web-framework/django/), CPU 바운드 처리량이 핵심이면 Go([Gin](/develop-wiki/backend/web-framework/gin/))·Rust([Axum](/develop-wiki/backend/web-framework/axum/)) 같은 컴파일 언어를 검토한다.

## 공식 문서
- [튜토리얼](https://fastapi.tiangolo.com/tutorial/) · [First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/) · [Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) · [Testing](https://fastapi.tiangolo.com/tutorial/testing/) · [API 레퍼런스](https://fastapi.tiangolo.com/reference/)

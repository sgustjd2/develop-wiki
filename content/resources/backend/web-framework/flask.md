---
name: Flask
url: https://flask.palletsprojects.com
docs: https://flask.palletsprojects.com/en/stable/
repo: https://github.com/pallets/flask
stars: 75351
domain: backend
category: web-framework
description: Werkzeug(WSGI)와 Jinja 위에 만든 Python 마이크로 웹 프레임워크. 작은 웹 앱·API나 구성 요소를 직접 골라 조립하고 싶을 때 쓴다.
pricing: oss
tags: [wsgi, microframework, jinja, werkzeug]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Flask 는 Pallets 프로젝트의 [Python](/develop-wiki/languages/python/) 웹 프레임워크로, 라우팅·요청/응답(Werkzeug)·템플릿(Jinja)·서명 쿠키 세션(ItsDangerous)·CLI(Click)만 기본으로 제공한다. ORM·폼 검증·인증은 포함하지 않고 Flask-SQLAlchemy, Flask-Login 같은 확장이나 일반 라이브러리를 골라 붙인다. WSGI 기반이며 `async def` 뷰도 쓸 수 있지만 요청마다 스레드에서 이벤트 루프를 돌리는 방식이다.

현재 안정 버전은 3.1.x(최신 3.1.3)이고 Python 3.9 이상을 지원한다. 관리자·ORM 이 포함된 풀스택은 [Django](/develop-wiki/backend/web-framework/django/), 타입 힌트 기반 JSON API 와 ASGI 비동기가 중심이면 [FastAPI](/develop-wiki/backend/web-framework/fastapi/) 가 위치가 겹친다.

## 설치
```bash
python3 -m venv .venv && . .venv/bin/activate
pip install Flask                    # 또는 uv add flask
flask --app app run --debug          # 개발 서버, http://127.0.0.1:5000
```
개발 서버는 운영용이 아니다. 배포는 Gunicorn·Waitress 같은 WSGI 서버로 실행한다(예: `gunicorn 'app:app'`).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Flask(__name__)` | 애플리케이션 객체. 설정(`app.config`)·라우트·확장을 보관 |
| 라우트 | `@app.get("/todos/<int:id>")` 같은 데코레이터. `<int:>` 등 변환기로 타입 지정 |
| `request` | 현재 요청 프록시. `request.args`, `request.form`, `request.get_json()` |
| 응답 | dict/list 를 반환하면 JSON, `(body, status)` 튜플로 상태 코드 지정. `abort(404)` |
| Blueprint | 라우트·템플릿을 모듈 단위로 묶어 `app.register_blueprint(bp, url_prefix=...)` |
| 컨텍스트 | 애플리케이션 컨텍스트(`current_app`, `g`)와 요청 컨텍스트(`request`, `session`) |
| 앱 팩토리 | `create_app()` 함수에서 앱을 만들고 설정·확장을 초기화하는 권장 구조 |

## 기본 사용법
```python
from flask import Flask, abort, request

app = Flask(__name__)
todos: dict[int, dict] = {}

@app.get("/todos/<int:todo_id>")
def read_todo(todo_id: int):
    if todo_id not in todos:
        abort(404)
    return todos[todo_id]

@app.post("/todos")
def create_todo():
    data = request.get_json(silent=True) or {}
    title = data.get("title")
    if not isinstance(title, str) or not title:
        return {"error": "title is required"}, 400
    todo = {"id": len(todos) + 1, "title": title}
    todos[todo["id"]] = todo
    return todo, 201
```
Flask 는 본문 검증을 해 주지 않으므로 예제처럼 직접 확인하거나 검증 라이브러리를 쓴다.

## 자주 쓰는 패턴
- **앱 팩토리 + Blueprint**: `create_app()` 안에서 설정을 읽고 `todos_bp = Blueprint("todos", __name__)` 를 `register_blueprint(todos_bp, url_prefix="/todos")` 로 붙인다. 테스트·환경별 설정이 쉬워진다.
- **요청 전후 처리**: 미들웨어 대신 `@app.before_request`·`@app.after_request`·`@app.teardown_appcontext` 훅을 쓰고, WSGI 수준이면 `app.wsgi_app` 을 감싼다. 에러 응답 형식은 `@app.errorhandler(404)` 로 통일한다.
- **검증**: Pydantic 모델이나 marshmallow 스키마로 `request.get_json()` 을 검증하는 구성이 흔하다. 폼이라면 Flask-WTF.
- **DB 연동**: Flask-SQLAlchemy 확장으로 [SQLAlchemy](/develop-wiki/backend/orm-query/sqlalchemy/) 세션을 요청 생명주기에 묶고, 마이그레이션은 Flask-Migrate(Alembic)를 쓴다. DB 는 [PostgreSQL](/develop-wiki/backend/database/postgresql/)·[SQLite](/develop-wiki/backend/database/sqlite/) 이 흔하다.
- **테스트**: pytest 픽스처로 앱과 테스트 클라이언트를 만든다. 실제 서버 없이 요청을 보낸다.
  ```python
  @pytest.fixture()
  def client():
      app.config.update(TESTING=True)
      return app.test_client()

  def test_create(client):
      res = client.post("/todos", json={"title": "a"})
      assert res.status_code == 201 and res.json["title"] == "a"
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: 작은 웹 서비스·사내 도구·프로토타입, 서버 렌더링(Jinja) 페이지와 간단한 API 를 함께 둘 때, 구성 요소를 직접 고르고 싶을 때.
- 피할 때(대안): 요청 검증·OpenAPI 문서·ASGI 비동기가 기본으로 필요하면 [FastAPI](/develop-wiki/backend/web-framework/fastapi/), 인증·관리자·ORM 을 한 번에 원하면 [Django](/develop-wiki/backend/web-framework/django/).

## 공식 문서
- [Installation](https://flask.palletsprojects.com/en/stable/installation/) · [Quickstart](https://flask.palletsprojects.com/en/stable/quickstart/) · [Blueprints](https://flask.palletsprojects.com/en/stable/blueprints/) · [Testing](https://flask.palletsprojects.com/en/stable/testing/) · [Deploying](https://flask.palletsprojects.com/en/stable/deploying/) · [API](https://flask.palletsprojects.com/en/stable/api/)

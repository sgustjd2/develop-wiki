---
name: SQLAlchemy
url: https://www.sqlalchemy.org
docs: https://docs.sqlalchemy.org/en/21/
repo: https://github.com/sqlalchemy/sqlalchemy
stars: 12304
domain: backend
category: orm-query
description: Python 의 표준적인 SQL 툴킷이자 ORM. Core(SQL 식 빌더)와 ORM(Unit of Work·관계 매핑)을 함께 제공하며 Alembic 으로 마이그레이션한다.
pricing: oss
tags: [python, orm, sql, alembic]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SQLAlchemy 는 두 층으로 나뉜다. **Core** 는 테이블 메타데이터와 SQL 식 언어(`select()`, `insert()`)로 DB 독립적인 SQL 을 만들고, **ORM** 은 그 위에서 클래스와 테이블을 매핑하고 `Session` 이 변경을 추적해 한 번에 플러시하는 Unit of Work 패턴을 구현한다. 2.0 부터 `select()` 중심의 통합 API 와 `Mapped[...]` 타입 힌트 기반 선언이 표준이 됐다.

2026-11 기준 최신은 **2.1.9**(Python 3.11 이상)이고, 2.0 라인(2.0.58)도 패치가 함께 나온다. 스키마 마이그레이션은 같은 저자가 만든 **Alembic** 을 쓴다. [FastAPI](/develop-wiki/backend/web-framework/fastapi/) 에서 가장 많이 쓰는 DB 계층이며, [Django](/develop-wiki/backend/web-framework/django/) 는 자체 ORM 을 쓴다.

## 설치
```bash
uv add sqlalchemy psycopg[binary] alembic     # 또는 pip install ...
uv add "sqlalchemy[asyncio]" asyncpg           # 비동기 사용 시
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Engine | 연결 풀과 방언을 가진 DB 진입점. `create_engine("postgresql+psycopg://...")` |
| `DeclarativeBase` | ORM 모델의 기반 클래스. `metadata` 에 테이블 정보가 모인다 |
| `Mapped[T]` / `mapped_column()` | 타입 힌트로 컬럼과 NULL 여부를 선언 |
| `relationship()` | 객체 간 관계. 로딩 전략은 `selectinload`, `joinedload` 등으로 지정 |
| `Session` | Unit of Work. `add` → `commit` 시 INSERT/UPDATE 를 모아 실행 |
| `select()` | Core·ORM 공통 쿼리 생성. `session.scalars(stmt)` 로 객체 목록 |
| AsyncSession | `create_async_engine` + `AsyncSession` 으로 asyncio 사용 |

## 기본 사용법
```python
from sqlalchemy import ForeignKey, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    posts: Mapped[list["Post"]] = relationship(back_populates="author")

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    author: Mapped[User] = relationship(back_populates="posts")

engine = create_engine("sqlite:///app.db")
Base.metadata.create_all(engine)          # 실습용. 운영은 Alembic

with Session(engine) as session:
    session.add(User(email="a@example.com", posts=[Post(title="hello")]))
    session.commit()
    stmt = select(User).options(selectinload(User.posts)).where(User.email.like("%@example.com"))
    for user in session.scalars(stmt):
        print(user.email, [p.title for p in user.posts])
```

## 자주 쓰는 패턴
- **Alembic 마이그레이션**: `alembic init migrations` → `env.py` 에 `target_metadata = Base.metadata` 지정 → `alembic revision --autogenerate -m "msg"` → `alembic upgrade head`. 자동 생성 결과는 반드시 검토한다.
- **요청당 세션**: FastAPI 에서는 `yield` 하는 의존성으로 요청마다 `Session` 을 열고 닫는다.
- **N+1 방지**: 관계 접근 전에 `selectinload`(컬렉션)·`joinedload`(단건)를 지정한다. `lazy="raise"` 로 의도치 않은 지연 로딩을 오류로 만들 수 있다.
- **비동기**: `AsyncSession` 에서는 지연 로딩이 I/O 를 일으키므로 즉시 로딩을 명시하거나 `AsyncAttrs` 의 `awaitable_attrs` 를 쓴다.
- **대량 처리**: `session.execute(insert(User), [{"email": ...}, ...])` 로 ORM 대량 INSERT.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 백엔드 전반, 여러 DB 를 지원해야 하는 라이브러리, 복잡한 SQL 과 ORM 을 함께 써야 할 때.
- 피할 때(대안): Django 프로젝트는 Django ORM, Pydantic 모델과 테이블을 하나로 합치고 싶으면 SQLModel(SQLAlchemy 기반), 아주 단순한 스크립트는 드라이버 직접 사용.

## 공식 문서
- [문서 (2.1)](https://docs.sqlalchemy.org/en/21/) · [통합 튜토리얼](https://docs.sqlalchemy.org/en/21/tutorial/index.html) · [ORM 퀵스타트](https://docs.sqlalchemy.org/en/21/orm/quickstart.html) · [Alembic](https://alembic.sqlalchemy.org/en/latest/)

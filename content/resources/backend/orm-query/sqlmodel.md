---
name: SQLModel
url: https://sqlmodel.tiangolo.com
docs: https://sqlmodel.tiangolo.com/tutorial/
repo: https://github.com/fastapi/sqlmodel
stars: 18630
domain: backend
category: orm-query
description: SQLAlchemy 와 Pydantic 을 결합해 한 클래스로 DB 테이블과 데이터 검증 모델을 함께 정의하는 Python ORM. FastAPI 앱에서 모델 중복 없이 DB 를 다룰 때 쓴다.
pricing: oss
tags: [python, orm, pydantic, sqlalchemy, fastapi]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SQLModel 은 FastAPI 를 만든 Sebastián Ramírez 가 만든 라이브러리로, `SQLModel` 을 상속한 클래스가 **Pydantic 모델이면서 동시에 SQLAlchemy 테이블**이 되게 한다. `table=True` 를 붙인 클래스는 테이블로 매핑되고, 붙이지 않은 클래스는 요청·응답 스키마로만 쓰인다. 그래서 FastAPI 에서 DB 모델·입력 모델·출력 모델을 상속으로 나눠 중복을 줄일 수 있다. 내부는 [SQLAlchemy](/develop-wiki/backend/orm-query/sqlalchemy/) 2.x 그대로라 세션·엔진·마이그레이션(Alembic)도 SQLAlchemy 방식을 따른다.

라이선스는 MIT. 2026-11 기준 최신은 **0.0.50**(2026-11-13)으로 버전은 아직 0.0.x 다. 최근 변경점:
- Pydantic 2.11+ 와 SQLAlchemy 2.0.14~2.1.x 가 필요하고, 0.0.50 에서 **Python 3.10 지원을 중단**했다(3.11+).
- 0.0.45 부터 `datetime` 필드가 기본으로 **UTC aware 타입**(`DateTime(timezone=True)`)으로 매핑된다. 기존 DB 를 쓰는 앱은 업그레이드 전에 공식 가이드의 마이그레이션 절차를 확인해야 한다.

## 설치
```bash
pip install sqlmodel
# FastAPI 와 함께
pip install sqlmodel "fastapi[standard]"
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `SQLModel, table=True` | 테이블로 매핑되는 모델. 없으면 순수 데이터 모델 |
| `Field()` | `primary_key`, `index`, `unique`, `foreign_key="team.id"`, `default` 등 |
| `Relationship()` | ORM 관계 속성. `back_populates` 로 양방향 연결 |
| `create_engine` | SQLAlchemy 엔진 (SQLModel 에서 재노출) |
| `Session` | 작업 단위. `add`, `commit`, `refresh`, `get`, `delete` |
| `select()` + `session.exec()` | 타입 추론이 잘 되는 조회. 결과는 `.all()`, `.first()`, `.one()` |
| 모델 상속 | `HeroBase` → `Hero(table=True)` / `HeroCreate` / `HeroPublic` 으로 API 스키마 분리 |

## 기본 사용법
```python
from sqlmodel import Field, Session, SQLModel, create_engine, select

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    age: int | None = None

engine = create_engine("sqlite:///app.db", connect_args={"check_same_thread": False})
SQLModel.metadata.create_all(engine)

with Session(engine) as session:
    session.add(Hero(name="Deadpond", age=30))
    session.commit()
    adults = session.exec(select(Hero).where(Hero.age >= 18)).all()
    print([h.name for h in adults])
```

FastAPI 에서 입력·출력 모델 분리:
```python
class HeroCreate(SQLModel):
    name: str
    age: int | None = None

@app.post("/heroes", response_model=Hero)
def create_hero(data: HeroCreate):
    with Session(engine) as session:
        hero = Hero.model_validate(data)
        session.add(hero); session.commit(); session.refresh(hero)
        return hero
```

## 자주 쓰는 패턴
- **세션 의존성**: `def get_session(): with Session(engine) as s: yield s` 를 만들고 `SessionDep = Annotated[Session, Depends(get_session)]` 로 주입한다.
- **부분 수정(PATCH)**: `data.model_dump(exclude_unset=True)` 를 `hero.sqlmodel_update(...)` 에 넘긴다.
- **마이그레이션**: `SQLModel.metadata` 를 Alembic `target_metadata` 로 지정해 autogenerate 한다. `create_all` 은 개발용.
- **비동기**: `sqlmodel[asyncio]` 와 SQLAlchemy `AsyncEngine`·`AsyncSession`(`sqlmodel.ext.asyncio.session`)을 쓴다.
- **복잡한 쿼리**: SQLModel 이 감싸지 않은 기능은 SQLAlchemy API 를 그대로 섞어 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: [FastAPI](/develop-wiki/backend/web-framework/fastapi/) 기반 CRUD API, Pydantic 검증과 DB 모델을 한 곳에서 관리하고 싶을 때, 중소 규모 서비스·프로토타입.
- 피할 때(대안): 복잡한 매핑·고급 SQLAlchemy 기능을 많이 쓰거나 0.x 버전의 변경 위험이 부담스러우면 [SQLAlchemy](/develop-wiki/backend/orm-query/sqlalchemy/) 를 직접 쓴다. Django 앱이면 Django ORM.

## 공식 문서
- [튜토리얼](https://sqlmodel.tiangolo.com/tutorial/) · [FastAPI 와 함께 쓰기](https://sqlmodel.tiangolo.com/tutorial/fastapi/) · [Datetime·타임존](https://sqlmodel.tiangolo.com/advanced/datetime/) · [릴리스 노트](https://sqlmodel.tiangolo.com/release-notes/)
- 언어: [Python](/develop-wiki/languages/python/)

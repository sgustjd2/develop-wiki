---
name: SQL
summary: 관계형 데이터베이스에서 데이터를 정의·조회·변경하는 선언형 질의 언어. ISO/IEC 9075 표준(최신 SQL:2023)이 있지만 PostgreSQL·MySQL·SQLite 등 DB마다 방언이 다르다.
paradigms: [선언형, 집합 기반]
typing: static
execution: interpreted
firstAppeared: 1974
officialSite: https://www.postgresql.org/docs/current/sql.html
docs: https://www.postgresql.org/docs/current/sql-commands.html
useCases: [관계형 DB 조회·변경, 데이터 분석·리포팅, 스키마 정의·마이그레이션, 데이터 웨어하우스 질의]
sources:
  - https://www.postgresql.org/docs/current/features.html
  - https://www.postgresql.org/docs/current/sql.html
  - https://dev.mysql.com/doc/refman/8.4/en/
  - https://www.sqlite.org/lang.html
  - https://www.sqlite.org/stricttables.html
updatedAt: 2026-11-18
---

## 개요
SQL(Structured Query Language)은 1974년 IBM의 SEQUEL에서 출발한 관계형 데이터 질의 언어다. 1986년 ANSI, 1987년 ISO 표준이 되었고 현재 최신판은 **ISO/IEC 9075:2023(SQL:2023)** 이다. "어떻게"가 아니라 "무엇을" 원하는지 집합 단위로 기술하면, DB 엔진의 옵티마이저가 실행 계획을 정한다.

이 사이트는 하나의 DB 제품이 아니라 **언어**로서의 SQL을 다룬다. 공식 사이트·문서 필드는 표준 문서가 유료(ISO)이므로, 표준 준수 현황을 가장 자세히 공개하는 PostgreSQL 문서의 SQL 언어 장을 가리킨다.

분류 필드에 대한 설명:
- **`typing: static`** — 테이블 열은 선언된 타입을 가지며, 쿼리는 실행 전 파싱·분석 단계에서 타입이 결정된다. 단 SQLite는 기본이 유연한 타입(타입 친화도, type affinity)이라 예외이고, `STRICT` 테이블(3.37.0+)로 엄격하게 바꿀 수 있다.
- **`execution: interpreted`** — 컴파일된 실행 파일을 만들지 않고, DB 서버가 문장을 받아 파싱 → 최적화 → 실행 계획 실행 순으로 처리한다. 일부 엔진은 실행 계획을 캐시하거나 JIT(예: PostgreSQL의 LLVM JIT)를 쓰기도 한다.

## 언어의 특징
| 하위 언어 | 내용 | 예 |
| --- | --- | --- |
| DDL | 스키마 정의 | `CREATE`, `ALTER`, `DROP` |
| DML | 데이터 조회·변경 | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| DCL | 권한 | `GRANT`, `REVOKE` |
| TCL | 트랜잭션 | `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT` |

- **NULL 과 3값 논리:** 비교 결과가 참·거짓·알 수 없음(UNKNOWN) 셋이다. `x = NULL` 은 항상 참이 아니므로 `IS NULL` 을 쓴다.
- **집합 연산:** 결과는 순서 없는 행의 집합(멀티셋)이며, 순서가 필요하면 반드시 `ORDER BY` 를 쓴다.
- **분석 기능:** 공통 테이블 식(`WITH`, 재귀 CTE), 윈도 함수(`OVER`), 그룹 집계(`GROUP BY`, `HAVING`).
- **표준의 확장 영역:** JSON(SQL/JSON), 속성 그래프 질의(SQL/PGQ, SQL:2023의 9075-16) 등. 구현 범위는 DB마다 다르다.
- **동시성:** 언어 자체가 아니라 DB의 트랜잭션 격리 수준(`READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE` 등)과 잠금·MVCC 구현이 결정한다.

## 개발 환경 시작하기
SQL을 쓰려면 DB 엔진과 클라이언트가 필요하다. 가장 가벼운 시작은 설치가 거의 필요 없는 SQLite다.

```bash
# SQLite — 파일 하나가 DB (macOS 는 기본 포함)
sqlite3 app.db

# PostgreSQL — Docker 로 실행 후 psql 접속
docker run -d --name pg -e POSTGRES_PASSWORD=devpass -p 5432:5432 postgres
docker exec -it pg psql -U postgres

# MySQL
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=devpass -p 3306:3306 mysql
docker exec -it mysql mysql -u root -p
```
스키마 변경은 애플리케이션 코드와 함께 마이그레이션 도구(Flyway, Liquibase, 또는 ORM의 마이그레이션 기능)로 버전 관리하는 것이 일반적이다. 패키지 매니저 개념은 없고, 확장 기능은 DB별로 설치한다(PostgreSQL `CREATE EXTENSION`).

## 문법 한눈에 보기
아래는 세 DB에서 공통으로 동작하는 표준에 가까운 SQL이다.
```sql
CREATE TABLE users (
  id    INTEGER PRIMARY KEY,
  name  VARCHAR(50) NOT NULL,
  team  VARCHAR(20),
  score INTEGER DEFAULT 0
);

INSERT INTO users (id, name, team, score) VALUES
  (1, 'kim', 'a', 90), (2, 'lee', 'a', 70), (3, 'park', 'b', 85), (4, 'choi', NULL, 60);

UPDATE users SET score = score + 5 WHERE team IS NULL;

-- 팀별 평균과, 팀 안에서의 순위(윈도 함수)
WITH ranked AS (
  SELECT name, team, score,
         RANK() OVER (PARTITION BY team ORDER BY score DESC) AS rnk
  FROM users
)
SELECT team, name, score FROM ranked WHERE rnk = 1 ORDER BY team;

SELECT team, COUNT(*) AS n, AVG(score) AS avg_score
FROM users GROUP BY team HAVING COUNT(*) >= 1 ORDER BY team;

BEGIN;
DELETE FROM users WHERE score < 70;
ROLLBACK;   -- 트랜잭션 취소: 삭제가 반영되지 않음
```

### 방언 차이 (PostgreSQL / MySQL / SQLite)
| 기능 | PostgreSQL | MySQL | SQLite |
| --- | --- | --- | --- |
| 자동 증가 키 | `GENERATED ALWAYS AS IDENTITY` (표준), `serial` | `AUTO_INCREMENT` | `INTEGER PRIMARY KEY` (rowid) |
| 행 수 제한 | `LIMIT n` / 표준 `FETCH FIRST n ROWS ONLY` | `LIMIT n` | `LIMIT n` |
| 업서트 | `INSERT ... ON CONFLICT (...) DO UPDATE`, `MERGE` | `INSERT ... ON DUPLICATE KEY UPDATE` | `INSERT ... ON CONFLICT (...) DO UPDATE` |
| 변경 행 반환 | `RETURNING` | 지원 안 함 | `RETURNING` (3.35.0+) |
| 문자열 연결 | `\|\|` | `CONCAT()` (`\|\|` 는 기본적으로 논리 OR) | `\|\|` |
| 식별자 인용 | `"name"` | `` `name` `` (ANSI_QUOTES 모드면 `"`) | `"name"` (백틱도 허용) |
| 불리언 | `boolean` 타입 | `BOOLEAN` = `TINYINT(1)` 별칭 | 정수 0/1 |
| 타입 검사 | 엄격 | 엄격도는 `sql_mode` 에 따라 다름 | 기본 유연, `STRICT` 테이블로 엄격 |
| JSON | `json`/`jsonb`, 연산자 `->`, `->>` | `JSON` 타입, `->`, `->>` | JSON 함수(`json_extract` 등), `->`, `->>` |

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| 관계형 DB | [PostgreSQL](/develop-wiki/backend/database/postgresql/), [MySQL](/develop-wiki/backend/database/mysql/)/MariaDB, [SQLite](/develop-wiki/backend/database/sqlite/), SQL Server, Oracle |
| 분석·웨어하우스 | DuckDB, BigQuery, Snowflake, ClickHouse(SQL 방언) |
| 쿼리 빌더·ORM | [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/), Prisma, SQLAlchemy, jOOQ |
| 마이그레이션 | Flyway, Liquibase, Atlas |
| 린트·포맷 | SQLFluff, sqlfmt |
| 클라이언트 | psql, mysql, sqlite3, DBeaver, DataGrip |

## 언제 쓰나 / 약점
- **쓸 때:** 구조가 정해진 데이터를 조인·집계·필터링할 때, 여러 행을 원자적으로 바꾸는 트랜잭션이 필요할 때, 분석 쿼리.
- **약점:** 표준은 있지만 실제 이식성은 낮다(위 방언 표 참고). 문자열을 이어 붙여 쿼리를 만들면 SQL 인젝션 위험이 있으므로 항상 파라미터 바인딩을 쓴다. 절차적 로직·복잡한 분기는 표현이 어색해 저장 프로시저(PL/pgSQL 등)나 애플리케이션 코드로 넘긴다.
- **피할 때(대안):** 스키마가 자주 바뀌는 문서형 데이터, 단순 키 조회 위주의 초고속 캐시 등은 문서 DB([MongoDB](/develop-wiki/backend/database/mongodb/))나 키-값 저장소([Redis](/develop-wiki/backend/database/redis/))가 더 맞을 수 있다.

## 공식 문서·학습 자료
- [ISO/IEC 9075 (SQL 표준, 유료)](https://www.iso.org/standard/76583.html)
- [PostgreSQL — SQL 언어](https://www.postgresql.org/docs/current/sql.html) · [SQL 명령 레퍼런스](https://www.postgresql.org/docs/current/sql-commands.html) · [표준 준수 현황](https://www.postgresql.org/docs/current/features.html)
- [MySQL 8.4 레퍼런스 매뉴얼](https://dev.mysql.com/doc/refman/8.4/en/)
- [SQLite SQL 문법](https://www.sqlite.org/lang.html) · [SQLite 데이터 타입](https://www.sqlite.org/datatype3.html)

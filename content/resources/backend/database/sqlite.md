---
name: SQLite
url: https://www.sqlite.org
docs: https://www.sqlite.org/docs.html
repo: https://github.com/sqlite/sqlite
stars: 11122
domain: backend
category: database
description: 서버 없이 애플리케이션에 내장되는 단일 파일 관계형 DB(퍼블릭 도메인). 모바일·데스크톱 앱, 로컬 캐시, 테스트, 소규모 서비스에 쓴다.
pricing: oss
tags: [rdbms, sql, embedded]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
임베디드 관계형 데이터베이스. 별도 서버 프로세스 없이 라이브러리로 앱에 링크되고, DB 전체가 파일 하나에 저장된다. 설정이 필요 없고 파일 복사만으로 옮길 수 있어 모바일 앱·브라우저·CLI 도구의 로컬 저장소로 흔히 쓰인다. 소스 코드는 퍼블릭 도메인이며, 2026-11 기준 최신 버전은 3.54.1(2026-10-16).

GitHub 의 `sqlite/sqlite` 는 공식 Fossil 저장소의 미러다.

## 설치·실행
```bash
brew install sqlite          # macOS (Linux: apt install sqlite3)
sqlite3 app.db               # 파일이 없으면 새로 만든다
```

| CLI 점 명령 | 뜻 |
| --- | --- |
| `.tables` / `.schema users` | 테이블 목록 / DDL |
| `.mode box` / `.headers on` | 출력 형식 |
| `.import --csv data.csv users` | CSV 가져오기 |
| `.backup backup.db` | 온라인 백업 |
| `.quit` | 종료 |

## 데이터 모델
파일 1개 = 데이터베이스 1개(`ATTACH` 로 여러 파일 동시 사용). 타입은 **값에 붙는 동적 타입**이고, 컬럼 타입은 선호(affinity)만 지정한다.

| 저장 클래스 | 내용 |
| --- | --- |
| `NULL`, `INTEGER`, `REAL`, `TEXT`, `BLOB` | 실제 저장되는 5가지 |
| 날짜·시간 | 별도 타입 없음. ISO-8601 `TEXT` 또는 Unix 시간 `INTEGER` 로 저장 |
| JSON | `TEXT`/`BLOB`(JSONB) + `json_*` 함수 |

타입을 엄격히 검사하려면 테이블을 `STRICT` 로 만든다.

## 기본 사용법 (CRUD)
```sql
CREATE TABLE users (
  id    INTEGER PRIMARY KEY,          -- rowid 별칭, 값을 생략하면 자동 할당(삭제된 최댓값은 재사용될 수 있음)
  email TEXT NOT NULL UNIQUE,
  meta  TEXT DEFAULT '{}'
) STRICT;
INSERT INTO users (email, meta) VALUES ('a@example.com', '{"plan":"pro"}') RETURNING id;
SELECT id, email FROM users WHERE meta->>'$.plan' = 'pro';
UPDATE users SET meta = json_set(meta, '$.plan', 'free') WHERE id = 1;
DELETE FROM users WHERE id = 1;
INSERT INTO users (email) VALUES ('a@example.com')
ON CONFLICT (email) DO NOTHING;
```

## 인덱스·쿼리 성능
- B-tree 인덱스, 부분 인덱스(`WHERE`), 표현식 인덱스, 커버링 인덱스를 지원. 전문 검색은 FTS5 가상 테이블.
- 실행 계획: `EXPLAIN QUERY PLAN SELECT ...` — `SCAN`(전체 탐색)인지 `SEARCH ... USING INDEX` 인지 본다.
- 통계 갱신은 `ANALYZE` 또는 `PRAGMA optimize`.

```sql
CREATE INDEX idx_users_plan ON users (meta->>'$.plan');
EXPLAIN QUERY PLAN SELECT * FROM users WHERE meta->>'$.plan' = 'pro';
```

## 트랜잭션·일관성
- 완전한 ACID, 격리 수준은 사실상 `SERIALIZABLE`. 쓰기는 **DB 전체에 한 번에 하나**만 가능하다.
- 기본 롤백 저널 대신 `PRAGMA journal_mode=WAL;` 로 바꾸면 읽기와 쓰기가 동시에 진행된다.
- 복제 기능은 내장되어 있지 않다(Litestream 등 외부 도구 사용).

```sql
BEGIN IMMEDIATE;   -- 처음부터 쓰기 잠금을 잡아 SQLITE_BUSY 를 줄인다
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

## 애플리케이션 연동
| 언어 | 드라이버 / ORM |
| --- | --- |
| TypeScript | `better-sqlite3` / [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/), Prisma |
| Python | 표준 라이브러리 `sqlite3` / SQLAlchemy, [Django](/develop-wiki/backend/web-framework/django/) ORM |
| Go | `mattn/go-sqlite3`(cgo), `modernc.org/sqlite`(순수 Go) |
| Java | `sqlite-jdbc` |

```python
import sqlite3

con = sqlite3.connect("app.db")
con.execute("PRAGMA journal_mode=WAL")
with con:  # 블록이 끝나면 커밋, 예외면 롤백
    con.execute("INSERT INTO users (email) VALUES (?)", ("b@example.com",))
for row in con.execute("SELECT id, email FROM users"):
    print(row)
con.close()
```

## 운영 팁
- 백업: 실행 중인 DB 파일을 그냥 복사하지 말고 `.backup` 명령, `VACUUM INTO 'backup.db'`, 또는 백업 API 를 쓴다.
- 권장 PRAGMA: `journal_mode=WAL`, `foreign_keys=ON`(기본 꺼짐), `busy_timeout=5000`.
- 함정: 외래 키 검사가 기본으로 꺼져 있다. 네트워크 파일 시스템(NFS) 위에서는 잠금이 불안정하다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모바일·데스크톱·CLI 앱의 로컬 저장소, 테스트용 DB, 쓰기 동시성이 낮은 소규모 웹 서비스, 데이터 파일 교환 포맷.
- 피할 때(대안): 여러 서버가 동시에 쓰는 서비스 → [PostgreSQL](/develop-wiki/backend/database/postgresql/)·[MySQL](/develop-wiki/backend/database/mysql/), 대용량 분석 → [DuckDB](/develop-wiki/backend/database/duckdb/).

## 공식 문서
- [문서 목록](https://www.sqlite.org/docs.html) · [SQL 문법](https://www.sqlite.org/lang.html) · [데이터 타입](https://www.sqlite.org/datatype3.html) · [WAL 모드](https://www.sqlite.org/wal.html) · [CLI](https://www.sqlite.org/cli.html) · [언제 쓰나(공식)](https://www.sqlite.org/whentouse.html)

---
name: PostgreSQL
url: https://www.postgresql.org
docs: https://www.postgresql.org/docs/current/
domain: backend
category: database
description: 확장 기능 생태계가 넓은 오픈소스 RDBMS. JSONB, 전문 검색, pgvector 같은 확장으로 관계형 외 용도까지 다룬다.
pricing: oss
tags: [rdbms, sql]
languages: [sql]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
관계형(RDBMS) 데이터베이스. 테이블·행 단위로 데이터를 저장하고 SQL 표준을 폭넓게 따른다. MVCC 기반 트랜잭션, JSONB(문서형 데이터), 전문 검색, 확장(extension) 시스템이 강점이라 범용 OLTP 의 기본 선택지로 많이 쓰인다. 2026-11 기준 안정 버전은 18.x(19는 RC 단계), 라이선스는 BSD 계열인 PostgreSQL License.

## 설치·실행
```bash
docker run --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:18
docker exec -it pg psql -U postgres        # 공식 CLI psql 로 접속
```

| psql 명령 | 뜻 |
| --- | --- |
| `\l` / `\c db` | DB 목록 / DB 전환 |
| `\dt` / `\d users` | 테이블 목록 / 테이블 구조 |
| `\x` | 세로 출력 전환 |
| `\q` | 종료 |

## 데이터 모델
클러스터 → 데이터베이스 → 스키마(기본 `public`) → 테이블. 주요 자료형:

| 분류 | 타입 |
| --- | --- |
| 정수·숫자 | `integer`, `bigint`, `numeric(p,s)` |
| 문자열 | `text`, `varchar(n)` |
| 시간 | `timestamptz`(권장), `date`, `interval` |
| 식별자 | `uuid`, `bigint GENERATED ALWAYS AS IDENTITY` |
| 반정형 | `jsonb`, 배열(`text[]`) |

## 기본 사용법 (CRUD)
```sql
CREATE TABLE users (
  id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  meta  jsonb DEFAULT '{}'
);
INSERT INTO users (email, meta) VALUES ('a@example.com', '{"plan":"pro"}') RETURNING id;
SELECT id, email FROM users WHERE meta->>'plan' = 'pro';
UPDATE users SET meta = meta || '{"plan":"free"}' WHERE id = 1;
DELETE FROM users WHERE id = 1;
-- UPSERT
INSERT INTO users (email) VALUES ('a@example.com')
ON CONFLICT (email) DO NOTHING;
```

## 인덱스·쿼리 성능
| 인덱스 | 용도 |
| --- | --- |
| B-tree (기본) | 등호·범위·정렬 |
| GIN | `jsonb`, 배열, 전문 검색(`tsvector`) |
| GiST / SP-GiST | 지리·범위 타입 |
| BRIN | 시간순으로 쌓이는 대용량 테이블 |

```sql
CREATE INDEX CONCURRENTLY idx_users_meta ON users USING gin (meta);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE meta @> '{"plan":"pro"}';
```
- 부분 인덱스(`WHERE deleted_at IS NULL`), 표현식 인덱스(`lower(email)`)를 지원한다.
- 운영 중 테이블에는 `CONCURRENTLY` 로 잠금을 줄인다.

## 트랜잭션·일관성
- MVCC: 읽기와 쓰기가 서로 막지 않는다. 기본 격리 수준은 `READ COMMITTED`, `REPEATABLE READ`·`SERIALIZABLE` 선택 가능.
- 대부분의 DDL 도 트랜잭션 안에서 롤백된다(단, `CREATE DATABASE`, `CREATE INDEX CONCURRENTLY`, `VACUUM` 등은 트랜잭션 블록 안에서 실행할 수 없다).
- 복제: 스트리밍 복제(물리, 읽기 전용 standby)와 논리 복제(`PUBLICATION`/`SUBSCRIPTION`).

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

## 애플리케이션 연동
| 언어 | 드라이버 / ORM |
| --- | --- |
| TypeScript | `pg`, `postgres`(postgres.js) / [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/), Prisma |
| Python | `psycopg`(v3), asyncpg / SQLAlchemy, [Django](/develop-wiki/backend/web-framework/django/) ORM |
| Go | `pgx/v5` |
| Java | PostgreSQL JDBC / JPA(Hibernate) |

```go
// go get github.com/jackc/pgx/v5
pool, err := pgxpool.New(ctx, "postgres://postgres:secret@localhost:5432/postgres")
if err != nil { log.Fatal(err) }
defer pool.Close()

var email string
err = pool.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", 1).Scan(&email)
```

## 운영 팁
- 백업: 논리 백업 `pg_dump`/`pg_restore`, 물리 백업 `pg_basebackup` + WAL 아카이빙(PITR).
- 지표: `pg_stat_activity`(실행 중 쿼리), `pg_stat_statements` 확장(느린 쿼리 집계), 복제 지연, 테이블 bloat.
- 함정: 연결마다 프로세스가 생기므로 연결 수가 많으면 PgBouncer 같은 풀러를 둔다. 오래 열린 트랜잭션은 VACUUM 을 막아 bloat 을 만든다.
- 메이저 버전 업그레이드는 `pg_upgrade` 또는 논리 복제로 한다(데이터 디렉터리 호환 안 됨).

## 언제 쓰나 / 피할 때
- 쓸 때: 범용 OLTP, 관계·제약조건이 중요한 데이터, JSON 과 관계형을 함께 다룰 때, pgvector·PostGIS 같은 확장이 필요할 때.
- 피할 때(대안): 대용량 분석 집계 → [ClickHouse](/develop-wiki/backend/database/clickhouse/)·[DuckDB](/develop-wiki/backend/database/duckdb/), 임베디드 단일 파일 → [SQLite](/develop-wiki/backend/database/sqlite/), 초저지연 캐시 → [Redis](/develop-wiki/backend/database/redis/).

## 공식 문서
- [매뉴얼(current)](https://www.postgresql.org/docs/current/) · [SQL 명령 레퍼런스](https://www.postgresql.org/docs/current/sql-commands.html) · [인덱스](https://www.postgresql.org/docs/current/indexes.html) · [트랜잭션 격리](https://www.postgresql.org/docs/current/transaction-iso.html) · [Docker 이미지](https://hub.docker.com/_/postgres)

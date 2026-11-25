---
name: DuckDB
url: https://duckdb.org
docs: https://duckdb.org/docs/stable/
repo: https://github.com/duckdb/duckdb
stars: 43348
domain: backend
category: database
description: 프로세스 안에서 실행되는 컬럼형 분석(OLAP) SQL DB. Parquet·CSV·JSON 파일을 바로 질의해 로컬 데이터 분석과 ETL 에 쓴다.
pricing: oss
tags: [olap, sql, embedded, columnar, parquet]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
임베디드 컬럼형(columnar) 분석 데이터베이스. SQLite 처럼 서버 없이 라이브러리로 앱·노트북 안에서 돌지만, 집계·조인 같은 분석 쿼리에 맞게 벡터화 실행 엔진을 쓴다. Parquet·CSV·JSON 파일과 S3 같은 원격 저장소를 테이블처럼 직접 읽을 수 있다. 라이선스는 MIT.

**버전(2026-11 기준):** 2.0.0 LTS(2026-10-21 공개). 새 PEG 파서가 기본이 되고, 단일 화살표 람다(`x -> x + 1`)가 기본 비활성화되어 `lambda x: x + 1` 문법을 쓴다. 2.0 으로 만든 DB 파일은 2.0 이전 버전이 읽지 못한다. 1.5 는 2027-03 까지 지원.

## 설치·실행
```bash
curl https://install.duckdb.org | bash   # CLI (또는 pip install duckdb-cli)
duckdb analytics.duckdb                  # 파일 DB 열기, 인자 없으면 인메모리
```

| CLI 점 명령 | 뜻 |
| --- | --- |
| `.tables` | 테이블 목록 |
| `.mode markdown` / `.mode duckbox` | 출력 형식 |
| `.timer on` | 쿼리 시간 표시 |
| `.quit` | 종료 |

## 데이터 모델
DB 파일 1개(또는 인메모리) → 스키마 → 테이블·뷰. 다른 DB 파일, SQLite, PostgreSQL, MySQL 을 `ATTACH` 로 붙여 함께 질의할 수 있다(확장 사용).

| 분류 | 타입 |
| --- | --- |
| 기본 | `INTEGER`, `BIGINT`, `DOUBLE`, `DECIMAL`, `VARCHAR`, `BOOLEAN` |
| 시간 | `DATE`, `TIMESTAMP`, `TIMESTAMPTZ`, `INTERVAL` |
| 중첩 | `LIST`(`INTEGER[]`), `STRUCT`, `MAP`, `UNION` |
| 반정형 | `JSON`(확장), `VARIANT`(2.0) |

## 기본 사용법 (CRUD)
```sql
-- 파일을 바로 질의
SELECT country, count(*) AS n
FROM 'events/*.parquet'
GROUP BY ALL ORDER BY n DESC LIMIT 10;

CREATE TABLE users AS SELECT * FROM read_csv('users.csv');
INSERT INTO users (id, email) VALUES (100, 'a@example.com');
UPDATE users SET email = 'b@example.com' WHERE id = 100;
DELETE FROM users WHERE id = 100;

-- 결과를 Parquet 으로 내보내기
COPY (SELECT * FROM users) TO 'users.parquet' (FORMAT parquet);
```
`GROUP BY ALL`, `SELECT * EXCLUDE (col)`, `FROM tbl` 단독 사용 같은 편의 문법이 있다.

## 인덱스·쿼리 성능
- 분석 쿼리는 인덱스 대신 **컬럼 저장 + 행 그룹별 min/max 통계(zonemap)** 로 불필요한 블록을 건너뛴다. 자주 거르는 컬럼으로 정렬해 적재하면 효과가 커진다.
- ART 인덱스는 `PRIMARY KEY`/`UNIQUE` 제약과 소수 행을 찾는 점 조회에만 쓰인다.
- 실행 계획: `EXPLAIN` / `EXPLAIN ANALYZE`(연산자별 시간·행 수).
- 메모리보다 큰 데이터는 디스크로 내려 처리하며, `SET memory_limit = '4GB'; SET threads = 8;` 로 자원을 조절한다.

## 트랜잭션·일관성
- MVCC 기반 ACID 트랜잭션(`BEGIN` / `COMMIT` / `ROLLBACK`).
- 하나의 DB 파일은 **한 프로세스만 쓰기 모드로 열 수 있다**. 여러 프로세스는 읽기 전용(`read_only`)으로만 동시 접근 가능.
- 복제·클러스터 기능은 없다. 2.0 부터 CLI 의 `-serve`/`-connect` 로 클라이언트-서버 방식 접속을 지원한다.

## 애플리케이션 연동
| 언어 | 클라이언트 |
| --- | --- |
| Python | `duckdb` (pandas·Polars·Arrow 연동) |
| TypeScript | `@duckdb/node-api`, 브라우저용 DuckDB-Wasm |
| Go | `github.com/duckdb/duckdb-go/v2` |
| Java | DuckDB JDBC |

```python
# pip install duckdb
import duckdb

con = duckdb.connect("analytics.duckdb")
con.execute("CREATE TABLE IF NOT EXISTS t (i INTEGER)")
con.execute("INSERT INTO t VALUES (?)", [42])
print(con.execute("SELECT i FROM t WHERE i > ?", [0]).fetchall())
df = con.sql("SELECT * FROM 'events.parquet' LIMIT 5").df()   # pandas DataFrame
con.close()
```

## 운영 팁
- 백업·이전: `EXPORT DATABASE 'dir' (FORMAT parquet);` / `IMPORT DATABASE 'dir';` — 버전을 올릴 때도 이 방법이 안전하다.
- 원격 파일(S3, HTTP)은 `httpfs` 확장과 시크릿(`CREATE SECRET`)으로 접근한다.
- 함정: 웹 서버처럼 여러 프로세스가 같은 파일에 쓰는 구조에는 맞지 않는다. 행 단위 대량 `INSERT` 반복보다 파일·DataFrame 을 한 번에 적재하는 편이 빠르다.

## 언제 쓰나 / 피할 때
- 쓸 때: 노트북·스크립트에서의 데이터 분석, Parquet/CSV 변환·ETL, 앱 안의 분석 기능, 테스트용 데이터 웨어하우스 대체.
- 피할 때(대안): 동시 쓰기가 많은 OLTP → [PostgreSQL](/develop-wiki/backend/database/postgresql/), 여러 사용자가 공유하는 대규모 분석 서버 → [ClickHouse](/develop-wiki/backend/database/clickhouse/), 앱 로컬 트랜잭션 저장소 → [SQLite](/develop-wiki/backend/database/sqlite/).

## 공식 문서
- [문서(stable)](https://duckdb.org/docs/stable/) · [설치](https://duckdb.org/docs/2.0/installation.html) · [Python 클라이언트](https://duckdb.org/docs/2.0/clients/python/overview.html) · [DuckDB 2.0 발표](https://duckdb.org/2026/10/21/announcing-duckdb-200.html) · [v2.0.0 릴리스](https://github.com/duckdb/duckdb/releases/tag/v2.0.0)

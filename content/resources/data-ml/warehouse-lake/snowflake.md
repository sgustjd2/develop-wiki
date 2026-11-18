---
name: Snowflake
url: https://www.snowflake.com
docs: https://docs.snowflake.com/
domain: data-ml
category: warehouse-lake
description: AWS·Azure·Google Cloud 위에서 동작하는 관리형 클라우드 데이터 플랫폼. 저장과 컴퓨팅(웨어하우스)을 분리해 SQL 분석과 데이터 공유에 쓴다.
pricing: paid
tags: [data-warehouse, cloud, sql, multi-cloud, data-sharing]
languages: [sql, python]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Snowflake 는 SaaS 형태의 데이터 웨어하우스다. 데이터는 중앙 저장소에 한 번 저장하고, 질의는 "가상 웨어하우스" 라는 독립 컴퓨팅 클러스터가 수행한다. 웨어하우스는 크기(XS~)를 골라 켜고 끌 수 있으며 사용한 시간만큼 크레딧이 과금된다. 여러 웨어하우스가 같은 데이터를 서로 간섭 없이 읽을 수 있고, 계정 간 데이터 공유와 Iceberg 테이블 지원이 있다.

체험 계정이 있지만 기본적으로 사용량 기반 유료 서비스다. 한국어 문서가 제공된다. Python 커넥터는 `snowflake-connector-python` 5.2.0(2026-11-04, Apache-2.0).

## 설치
```bash
pip install snowflake-connector-python      # DB-API 커넥터
pip install snowflake-snowpark-python       # DataFrame API (Snowpark)
```
CLI 는 `snow`(Snowflake CLI), 웹 UI 는 Snowsight.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 가상 웨어하우스 | 질의를 실행하는 컴퓨팅. 크기·자동 일시정지·멀티 클러스터 설정 |
| 데이터베이스 / 스키마 / 테이블 | 저장 계층의 이름 공간 |
| 크레딧 | 웨어하우스 실행 시간·서버리스 기능의 과금 단위 |
| Time Travel / Fail-safe | 보존 기간 내 과거 데이터 조회·복구 / 장애 대비 추가 보존 |
| Zero-copy clone | 데이터 복사 없이 테이블·DB 복제 (개발·테스트 환경용) |
| Stage / `COPY INTO` | 파일 적재 위치 / 대량 적재 명령. 연속 적재는 Snowpipe |
| 역할 기반 접근 제어 | 모든 객체 권한을 역할에 부여 |
| Snowpark | Python·Java·Scala DataFrame 코드를 Snowflake 안에서 실행 |

## 기본 사용법
```sql
CREATE WAREHOUSE IF NOT EXISTS dev_wh WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 60 AUTO_RESUME = TRUE;
USE WAREHOUSE dev_wh;

CREATE DATABASE IF NOT EXISTS shop;
CREATE TABLE shop.public.orders (id INT, amount NUMBER(10,2), created_at TIMESTAMP_NTZ);

COPY INTO shop.public.orders FROM @my_stage/orders/ FILE_FORMAT = (TYPE = PARQUET)
  MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;

SELECT * FROM shop.public.orders AT(OFFSET => -60*5);   -- 5분 전 상태 (Time Travel)
CREATE TABLE shop.public.orders_dev CLONE shop.public.orders;
```

Python 에서:
```python
import snowflake.connector

conn = snowflake.connector.connect(account="<account>", user="<user>",
                                   authenticator="externalbrowser",
                                   warehouse="dev_wh", database="shop", schema="public")
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM orders")
print(cur.fetchone())
```

## 자주 쓰는 패턴
- **비용 관리**: 웨어하우스 `AUTO_SUSPEND` 를 짧게, 작업 성격별로 웨어하우스를 나누고 resource monitor 로 크레딧 한도를 건다.
- **개발 환경 복제**: zero-copy clone 으로 운영 DB 를 복제해 변환 코드를 검증.
- **변환 계층**: [dbt](/develop-wiki/data-ml/transform/dbt/)·[SQLMesh](/develop-wiki/data-ml/transform/sqlmesh/) 로 모델을 관리.
- **오픈 포맷 연동**: Iceberg 테이블로 저장해 외부 엔진([Trino](/develop-wiki/data-ml/warehouse-lake/trino/), Spark)과 공유.

## 언제 쓰나 / 피할 때
- 쓸 때: 운영 부담 없는 관리형 웨어하우스, 멀티 클라우드, 부서·회사 간 데이터 공유, 워크로드별 컴퓨팅 분리.
- 피할 때(대안): Google Cloud 중심이면 [BigQuery](/develop-wiki/data-ml/warehouse-lake/bigquery/). 비용 통제를 위해 자체 인프라·오픈소스를 원하면 [Apache Iceberg](/develop-wiki/data-ml/warehouse-lake/apache-iceberg/) + [Trino](/develop-wiki/data-ml/warehouse-lake/trino/). 실시간 집계 대시보드는 [ClickHouse](/develop-wiki/backend/database/clickhouse/).

## 공식 문서
- [문서 홈](https://docs.snowflake.com/) · [시작하기](https://docs.snowflake.com/en/user-guide-getting-started) · [SQL 명령 레퍼런스](https://docs.snowflake.com/en/sql-reference-commands)
- [가상 웨어하우스](https://docs.snowflake.com/en/user-guide/warehouses) · [Python 커넥터](https://docs.snowflake.com/en/developer-guide/python-connector/python-connector) · [Time Travel](https://docs.snowflake.com/en/user-guide/data-time-travel)

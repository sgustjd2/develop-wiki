---
name: Trino
url: https://trino.io
docs: https://trino.io/docs/current/
repo: https://github.com/trinodb/trino
stars: 13549
domain: data-ml
category: warehouse-lake
description: 여러 데이터 소스를 SQL 하나로 질의하는 분산 MPP 쿼리 엔진. 데이터 레이크(Iceberg·Hive)와 운영 DB 를 옮기지 않고 함께 분석할 때 쓴다.
pricing: oss
tags: [query-engine, sql, mpp, federation, lakehouse, presto]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Trino 는 저장소를 갖지 않는 분산 SQL 엔진이다. 커넥터로 Iceberg·Delta·Hive 테이블, PostgreSQL·MySQL, Kafka, Elasticsearch 등을 "카탈로그" 로 붙이고, 하나의 ANSI SQL 질의로 서로 다른 소스를 조인한다. 코디네이터가 계획을 세우고 워커들이 메모리 파이프라인으로 병렬 처리해 대화형 분석에 맞춘다. Presto 에서 갈라져 나온 프로젝트다.

**버전(2026-11 기준):** 484(2026-10-16). 버전 번호는 정수로 매겨진다. 라이선스 Apache-2.0. 관리형으로는 Starburst 등이 있다.

## 설치
```bash
docker run --name trino -d -p 8080:8080 trinodb/trino
docker exec -it trino trino                 # 내장 CLI 접속
```
기본 이미지에는 예제용 `tpch` 카탈로그가 있다. Python 클라이언트는 `pip install trino`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 코디네이터 / 워커 | 질의 파싱·계획·스케줄 / 실제 처리 노드 |
| 커넥터 | 데이터 소스 어댑터 (iceberg, delta_lake, hive, postgresql, ...) |
| 카탈로그 | 커넥터 설정 하나(`etc/catalog/<name>.properties`). `catalog.schema.table` 로 참조 |
| 페더레이션 | 서로 다른 카탈로그 테이블을 한 질의에서 조인 |
| 푸시다운 | 필터·집계 일부를 소스 DB 에 넘겨 전송량 감소 |
| 리소스 그룹 | 사용자·질의별 동시성·메모리 제한 |
| Fault-tolerant execution | 긴 배치 질의를 중간 결과 저장으로 재시도 가능하게 실행 |

## 기본 사용법
```sql
SHOW CATALOGS;
SELECT nationkey, name FROM tpch.tiny.nation LIMIT 5;

-- 레이크 테이블과 운영 DB 조인 (iceberg, pg 카탈로그가 설정됐다고 가정)
SELECT c.segment, sum(e.amount) AS revenue
FROM iceberg.analytics.events e
JOIN pg.public.customers c ON e.customer_id = c.id
WHERE e.event_date >= DATE '2026-11-01'
GROUP BY c.segment;

EXPLAIN ANALYZE SELECT count(*) FROM tpch.sf1.orders;
```

Iceberg 카탈로그 설정 예(`etc/catalog/iceberg.properties`):
```properties
connector.name=iceberg
iceberg.catalog.type=rest
iceberg.rest-catalog.uri=http://rest-catalog:8181
```

Python:
```python
import trino

conn = trino.dbapi.connect(host="localhost", port=8080, user="me", catalog="tpch", schema="tiny")
cur = conn.cursor()
cur.execute("SELECT count(*) FROM nation")
print(cur.fetchone())
```

## 자주 쓰는 패턴
- **오픈 레이크하우스 질의층**: [Apache Iceberg](/develop-wiki/data-ml/warehouse-lake/apache-iceberg/) 테이블 + Trino + BI 도구([Apache Superset](/develop-wiki/data-ml/analytics-bi/apache-superset/))로 웨어하우스를 구성.
- **ETL 없는 탐색**: 운영 DB([PostgreSQL](/develop-wiki/backend/database/postgresql/))를 카탈로그로 붙여 레이크 데이터와 바로 조인해 본 뒤, 자주 쓰는 결과만 테이블로 만든다.
- **성능 확인**: `EXPLAIN ANALYZE` 로 단계별 행 수·시간과 푸시다운 여부를 본다.
- **변환**: dbt-trino 어댑터로 [dbt](/develop-wiki/data-ml/transform/dbt/) 모델을 실행.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 소스를 옮기지 않고 SQL 로 분석, 오픈 테이블 포맷 위의 대화형 질의, 자체 운영하는 레이크하우스.
- 피할 때(대안): 운영 인력 없이 쓰려면 [BigQuery](/develop-wiki/data-ml/warehouse-lake/bigquery/)·[Snowflake](/develop-wiki/data-ml/warehouse-lake/snowflake/). 대규모 Python·ML 변환은 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/). 단일 머신 분석은 [DuckDB](/develop-wiki/backend/database/duckdb/).

## 공식 문서
- [문서 홈](https://trino.io/docs/current/) · [Docker 배포](https://trino.io/docs/current/installation/containers.html) · [SQL 문법](https://trino.io/docs/current/sql.html)
- [커넥터 목록](https://trino.io/docs/current/connector.html) · [Iceberg 커넥터](https://trino.io/docs/current/connector/iceberg.html) · [릴리스 노트](https://trino.io/docs/current/release.html)

---
name: Apache Iceberg
url: https://iceberg.apache.org
docs: https://iceberg.apache.org/docs/latest/
repo: https://github.com/apache/iceberg
stars: 9445
domain: data-ml
category: warehouse-lake
description: 객체 스토리지의 Parquet 파일 묶음을 ACID 트랜잭션·스키마 진화·타임 트래블이 되는 테이블로 다루게 하는 오픈 테이블 포맷. 여러 엔진이 공유하는 레이크하우스에 쓴다.
pricing: oss
tags: [table-format, lakehouse, parquet, acid, time-travel, catalog]
languages: [java, python, sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Iceberg 는 S3·GCS 같은 객체 스토리지에 놓인 데이터 파일을 "테이블" 로 관리하는 메타데이터 규격(스펙)과 라이브러리다. 테이블 상태를 스냅샷 단위의 메타데이터 파일로 기록해, 여러 쓰기 작업 사이의 원자적 커밋, 열 추가·이름 변경 같은 스키마 진화, 과거 스냅샷 조회를 제공한다. Spark·Flink·Trino·DuckDB·Snowflake·BigQuery 등 여러 엔진이 같은 테이블을 읽고 쓸 수 있는 것이 핵심이다.

**버전(2026-11 기준):** Java 구현 1.12.0(2026-09-30), Python 구현 PyIceberg 0.12.0. 라이선스 Apache-2.0.

[Delta Lake](/develop-wiki/data-ml/warehouse-lake/delta-lake/)와 같은 역할의 테이블 포맷이며, Iceberg 는 엔진 중립적인 REST 카탈로그 규격과 숨은 파티셔닝이 특징이다.

## 설치
```bash
pip install "pyiceberg[pyarrow,sql-sqlite]"     # Python 클라이언트 + 로컬 SQL 카탈로그
```
Spark 에서는 `iceberg-spark-runtime` JAR 를 `--packages` 로 추가하고 카탈로그를 설정한다. Trino·Flink 는 Iceberg 커넥터를 설정한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 카탈로그 | 테이블 이름 → 현재 메타데이터 위치를 관리 (REST, Hive, Glue, JDBC/SQL, Nessie·Polaris 등) |
| 메타데이터 파일 / 매니페스트 | 스키마·파티션 정보와 데이터 파일 목록·통계 |
| 스냅샷 | 커밋 시점의 테이블 상태. 타임 트래블·롤백 단위 |
| 숨은 파티셔닝 | `days(ts)` 같은 변환으로 파티션을 정의, 쿼리에 파티션 열을 쓰지 않아도 가지치기 |
| 스키마·파티션 진화 | 데이터 재작성 없이 열·파티션 규칙 변경 |
| 낙관적 동시성 | 커밋 시 충돌을 검사해 여러 작성자 지원 |
| 유지 보수 | 스냅샷 만료, 작은 파일 압축(compaction), 고아 파일 정리 |

## 기본 사용법
PyIceberg 로 로컬 테이블 생성·추가·조회:

```python
import pyarrow as pa
from pyiceberg.catalog.sql import SqlCatalog

catalog = SqlCatalog("local", uri="sqlite:///warehouse/catalog.db",
                     warehouse="file:///tmp/warehouse")
catalog.create_namespace_if_not_exists("shop")

data = pa.table({"id": [1, 2], "amount": [9.5, 20.0]})
table = catalog.create_table_if_not_exists("shop.orders", schema=data.schema)
table.append(data)

print(table.scan(row_filter="amount > 10").to_arrow())
print([s.snapshot_id for s in table.snapshots()])
```

Spark SQL 에서:
```sql
CREATE TABLE lake.shop.events (id BIGINT, ts TIMESTAMP, kind STRING)
USING iceberg PARTITIONED BY (days(ts));

MERGE INTO lake.shop.events t USING updates u ON t.id = u.id
WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *;

SELECT * FROM lake.shop.events VERSION AS OF 1234567890;   -- 스냅샷 id 로 조회
```

## 자주 쓰는 패턴
- **REST 카탈로그 중심 구성**: 엔진마다 같은 REST 카탈로그를 바라보게 해 테이블 정의를 한 곳에서 관리.
- **정기 유지 보수**: `expire_snapshots`, `rewrite_data_files` 프로시저를 스케줄링해 메타데이터·작은 파일 증가를 막는다.
- **CDC 적재**: [Apache Flink](/develop-wiki/data-ml/processing/apache-flink/) 나 Spark 로 upsert(`MERGE INTO`)해 운영 DB 를 레이크에 복제.
- **로컬 분석**: [DuckDB](/develop-wiki/backend/database/duckdb/) 의 iceberg 확장이나 PyIceberg 로 작은 테이블을 바로 읽는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 객체 스토리지 위에 여러 엔진이 공유하는 분석 테이블, 벤더 종속 없는 레이크하우스, 대용량 테이블의 스키마 진화·타임 트래블.
- 피할 때(대안): Databricks·Spark 중심 환경이면 [Delta Lake](/develop-wiki/data-ml/warehouse-lake/delta-lake/)가 통합이 깊다. 운영 부담 없이 SQL 만 쓰려면 [BigQuery](/develop-wiki/data-ml/warehouse-lake/bigquery/)·[Snowflake](/develop-wiki/data-ml/warehouse-lake/snowflake/) 같은 관리형 웨어하우스.

## 공식 문서
- [문서 홈](https://iceberg.apache.org/docs/latest/) · [테이블 스펙](https://iceberg.apache.org/spec/) · [Spark Quickstart](https://iceberg.apache.org/spark-quickstart/)
- [PyIceberg](https://py.iceberg.apache.org/) · [REST 카탈로그 스펙](https://iceberg.apache.org/rest-catalog-spec/) · [유지 보수](https://iceberg.apache.org/docs/latest/maintenance/)

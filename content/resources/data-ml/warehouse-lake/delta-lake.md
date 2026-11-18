---
name: Delta Lake
url: https://delta.io
docs: https://docs.delta.io/latest/
repo: https://github.com/delta-io/delta
domain: data-ml
category: warehouse-lake
description: Parquet 파일 위에 트랜잭션 로그를 두어 ACID·업서트·타임 트래블을 제공하는 오픈 테이블 포맷. Spark·Databricks 중심 레이크하우스에 쓴다.
pricing: oss
tags: [table-format, lakehouse, parquet, acid, spark, time-travel]
languages: [python, java, sql, rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Delta Lake 는 테이블 폴더 안의 `_delta_log/` 트랜잭션 로그(JSON 커밋 + 주기적 체크포인트)로 어떤 Parquet 파일이 현재 테이블에 속하는지 기록하는 테이블 포맷이다. 이 로그 덕분에 원자적 쓰기, 동시 작성 충돌 감지, `MERGE`·`UPDATE`·`DELETE`, 과거 버전 조회가 가능하다. Databricks 가 만들었고 현재 Linux Foundation 프로젝트다.

**버전(2026-11 기준):** Spark 커넥터 4.4.1(2026-10-05), Spark 없이 쓰는 Rust 기반 Python 패키지 `deltalake` 1.6.6. 라이선스 Apache-2.0.

[Apache Iceberg](/develop-wiki/data-ml/warehouse-lake/apache-iceberg/)와 같은 계층의 포맷이며, Delta UniForm 으로 Iceberg 리더가 Delta 테이블을 읽게 할 수도 있다.

## 설치
```bash
pip install deltalake                  # Spark 없이 Python 에서 읽기/쓰기 (delta-rs)
pip install delta-spark                # PySpark 에서 Delta 사용
```
`delta-spark` 버전은 사용하는 Spark 버전과 맞춰야 한다(공식 문서의 호환 표 확인).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 트랜잭션 로그 `_delta_log` | 순서가 매겨진 커밋 기록. 테이블의 단일 진실 원천 |
| 버전 / 타임 트래블 | 커밋마다 버전 증가. `versionAsOf`, `timestampAsOf` 로 조회 |
| `MERGE INTO` | 조건에 따라 업데이트·삽입·삭제하는 업서트 |
| 스키마 강제·진화 | 맞지 않는 쓰기 거부, `mergeSchema` 로 열 추가 |
| `OPTIMIZE` / Z-order·Liquid clustering | 작은 파일 압축, 자주 거르는 열 기준 데이터 배치 |
| `VACUUM` | 보존 기간이 지난 미사용 파일 삭제 |
| Change Data Feed | 버전 간 행 단위 변경분 조회 |

## 기본 사용법
Spark 없이 `deltalake` 로:

```python
import pandas as pd
from deltalake import DeltaTable, write_deltalake

write_deltalake("tmp/orders", pd.DataFrame({"id": [1, 2], "amount": [10, 20]}))
write_deltalake("tmp/orders", pd.DataFrame({"id": [3], "amount": [5]}), mode="append")

dt = DeltaTable("tmp/orders")
print(dt.version())                        # 1
print(dt.to_pandas())
print(DeltaTable("tmp/orders", version=0).to_pandas())   # 타임 트래블
```

PySpark 에서 업서트:
```python
from delta.tables import DeltaTable

target = DeltaTable.forPath(spark, "s3://lake/orders")
(target.alias("t")
   .merge(updates_df.alias("u"), "t.id = u.id")
   .whenMatchedUpdateAll()
   .whenNotMatchedInsertAll()
   .execute())
```

## 자주 쓰는 패턴
- **메달리온 구조**: bronze(원천) → silver(정제) → gold(집계) 테이블을 Delta 로 쌓는다.
- **정기 OPTIMIZE·VACUUM**: 스트리밍 적재로 생긴 작은 파일을 압축하고 오래된 파일을 정리한다.
- **증분 처리**: Change Data Feed 로 바뀐 행만 읽어 하위 테이블을 갱신.
- **로컬 질의**: [Polars](/develop-wiki/data-ml/processing/polars/)(`scan_delta`)·[DuckDB](/develop-wiki/backend/database/duckdb/)(delta 확장)로 Spark 없이 읽는다.

## 언제 쓰나 / 피할 때
- 쓸 때: Spark·Databricks 기반 레이크하우스, 스트리밍과 배치를 같은 테이블에 쓰는 파이프라인, 업서트가 잦은 테이블.
- 피할 때(대안): 여러 벤더 엔진과 REST 카탈로그로 공유하는 것이 우선이면 [Apache Iceberg](/develop-wiki/data-ml/warehouse-lake/apache-iceberg/). 파일 관리 없이 SQL 만 쓰려면 [BigQuery](/develop-wiki/data-ml/warehouse-lake/bigquery/)·[Snowflake](/develop-wiki/data-ml/warehouse-lake/snowflake/).

## 공식 문서
- [문서 홈](https://docs.delta.io/latest/) · [Quickstart](https://docs.delta.io/latest/quick-start.html) · [delta-rs Python 문서](https://delta-io.github.io/delta-rs/)
- [Delta 프로토콜](https://github.com/delta-io/delta/blob/master/PROTOCOL.md) · [릴리스](https://github.com/delta-io/delta/releases)

---
name: Apache Spark
url: https://spark.apache.org
docs: https://spark.apache.org/docs/latest/
repo: https://github.com/apache/spark
stars: 44562
domain: data-ml
category: processing
description: 클러스터에서 대용량 데이터를 배치·스트리밍으로 처리하는 분산 처리 엔진. SQL·DataFrame·ML API 로 TB 이상 데이터의 ETL 과 분석에 쓴다.
pricing: oss
tags: [distributed, batch, streaming, dataframe, sql, pyspark, big-data]
languages: [python, java, sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Spark 는 데이터를 여러 노드에 나눠 메모리 중심으로 처리하는 분산 컴퓨팅 엔진이다. 사용자는 DataFrame/SQL 로 "무엇을" 계산할지 선언하고, Catalyst 옵티마이저가 실행 계획을 세워 클러스터에 작업을 나눈다. 같은 API 로 배치와 구조적 스트리밍(Structured Streaming)을 모두 다룬다.

**버전(2026-11 기준):** 4.3.0(PyPI `pyspark` 2026-10-30). PySpark 4.3 은 Python 3.11 이상이 필요하다. 라이선스 Apache-2.0.

단일 머신에 들어가는 데이터라면 [Polars](/develop-wiki/data-ml/processing/polars/)나 [DuckDB](/develop-wiki/backend/database/duckdb/)가 더 가볍고, Spark 는 데이터가 한 대를 넘거나 이미 Hadoop/레이크하우스 클러스터가 있을 때 쓴다.

## 설치
```bash
pip install pyspark                 # 로컬 모드 포함 (JDK 필요)
pip install "pyspark[connect]"      # Spark Connect 클라이언트 의존성
```
JVM 위에서 동작하므로 로컬에도 JDK 가 있어야 한다. 클러스터 배포는 공식 배포판(spark.apache.org/downloads)이나 Kubernetes·YARN·관리형 서비스(Databricks, EMR, Dataproc)를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `SparkSession` | 모든 API 의 진입점. `spark.read`, `spark.sql` 등을 제공 |
| DataFrame | 스키마가 있는 분산 테이블. 변환은 지연 실행(lazy) |
| 변환 / 액션 | `select`·`filter` 같은 변환은 계획만 쌓고, `show`·`count`·`write` 같은 액션에서 실행 |
| 파티션 | 데이터를 나눈 단위. 병렬도와 셔플 비용을 결정 |
| 셔플 | `groupBy`·`join` 시 노드 간 데이터 재분배. 가장 비싼 연산 |
| Catalyst / AQE | 쿼리 옵티마이저, 런타임 통계로 계획을 조정하는 Adaptive Query Execution |
| Structured Streaming | 스트림을 끝없이 늘어나는 테이블로 보고 같은 DataFrame API 로 처리 |
| Spark Connect | 클라이언트-서버 분리 프로토콜. 얇은 클라이언트에서 원격 클러스터에 접속 |

## 기본 사용법
```python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("orders").getOrCreate()

orders = spark.read.parquet("data/orders/")          # CSV·JSON·테이블 포맷도 가능
daily = (
    orders.filter(F.col("status") == "paid")
          .groupBy(F.to_date("created_at").alias("day"))
          .agg(F.sum("amount").alias("revenue"), F.count("*").alias("n"))
          .orderBy("day")
)
daily.show(5)
daily.write.mode("overwrite").partitionBy("day").parquet("out/daily_revenue/")
```

SQL 로 같은 작업:
```python
orders.createOrReplaceTempView("orders")
spark.sql("""
  SELECT to_date(created_at) AS day, sum(amount) AS revenue
  FROM orders WHERE status = 'paid' GROUP BY 1 ORDER BY 1
""").show()
```

## 자주 쓰는 패턴
- **실행 계획 확인**: `df.explain("formatted")` 로 셔플(Exchange)·조인 전략을 본다.
- **브로드캐스트 조인**: 작은 차원 테이블은 `F.broadcast(dim)` 으로 셔플 없이 조인.
- **파티션 조정**: 출력 파일이 너무 많으면 `coalesce(n)`, 쏠림이 있으면 `repartition("key")`.
- **UDF 최소화**: Python UDF 는 직렬화 비용이 커서 `pyspark.sql.functions` 내장 함수를 먼저 찾는다. 필요하면 Arrow 기반 pandas UDF.
- **테이블 포맷과 함께**: 레이크하우스에서는 [Apache Iceberg](/develop-wiki/data-ml/warehouse-lake/apache-iceberg/)·[Delta Lake](/develop-wiki/data-ml/warehouse-lake/delta-lake/) 커넥터로 ACID 테이블을 읽고 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 한 대 메모리를 넘는 배치 ETL, 레이크하우스 테이블 가공, 대규모 조인·집계, 같은 코드로 배치와 스트리밍을 함께 운영할 때.
- 피할 때(대안): 수 GB 수준 로컬 분석은 [Polars](/develop-wiki/data-ml/processing/polars/)·[DuckDB](/develop-wiki/backend/database/duckdb/). 밀리초 단위 이벤트 처리·상태 기반 스트리밍은 [Apache Flink](/develop-wiki/data-ml/processing/apache-flink/). Python 함수 단위 분산·ML 워크로드는 [Ray](/develop-wiki/data-ml/processing/ray/).

## 공식 문서
- [문서 홈](https://spark.apache.org/docs/latest/) · [Quick Start](https://spark.apache.org/docs/latest/quick-start.html) · [PySpark 시작하기](https://spark.apache.org/docs/latest/api/python/getting_started/index.html)
- [SQL·DataFrame 가이드](https://spark.apache.org/docs/latest/sql-programming-guide.html) · [Structured Streaming](https://spark.apache.org/docs/latest/streaming/index.html) · [Spark Connect](https://spark.apache.org/docs/latest/spark-connect-overview.html)

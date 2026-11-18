---
name: BigQuery
url: https://cloud.google.com/bigquery
docs: https://cloud.google.com/bigquery/docs
domain: data-ml
category: warehouse-lake
description: Google Cloud 의 서버리스 데이터 웨어하우스. 클러스터 관리 없이 SQL 로 TB~PB 데이터를 분석하고, 스캔한 바이트나 슬롯 용량 기준으로 과금된다.
pricing: freemium
tags: [data-warehouse, serverless, sql, gcp, analytics]
languages: [sql, python]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
BigQuery 는 저장과 컴퓨팅이 분리된 Google Cloud 관리형 분석 데이터베이스다. 사용자는 데이터셋·테이블을 만들고 GoogleSQL 로 질의하기만 하면 되고, 노드 수·인덱스·버전 업그레이드는 서비스가 관리한다. 컬럼형 저장 덕분에 질의가 읽는 열만 스캔하며, 외부 테이블(GCS 의 Parquet, Iceberg 테이블)도 질의할 수 있다.

**과금(2026-11 공식 가격 페이지 기준):** 컴퓨팅은 온디맨드(처리한 TiB 당 과금, 매월 첫 1 TiB 무료) 또는 용량 기반(슬롯-시간) 중 선택한다. 스토리지는 매월 첫 10 GiB 무료. 그래서 이 사이트 분류상 freemium 으로 둔다. 한국어 문서가 제공된다.

## 설치
```bash
gcloud init                                      # Google Cloud CLI (bq 명령 포함)
pip install google-cloud-bigquery                # Python 클라이언트 (2026-11 기준 3.47.0)
pip install "google-cloud-bigquery[pandas]"      # DataFrame 변환
```
인증은 `gcloud auth application-default login` 또는 서비스 계정.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 프로젝트 / 데이터셋 / 테이블 | `project.dataset.table` 3단계 이름 |
| GoogleSQL | 표준 SQL 방언. `STRUCT`·`ARRAY` 중첩 타입 지원 |
| 파티셔닝 | 날짜·정수 범위·수집 시간 기준으로 테이블을 나눠 스캔량 절감 |
| 클러스터링 | 최대 4개 열 기준 정렬 저장으로 필터 성능 향상 |
| 슬롯 | 질의 실행 컴퓨팅 단위. 용량 기반 과금의 기준 |
| 구체화된 뷰 / BI Engine | 증분 갱신되는 집계 뷰 / 대시보드용 인메모리 가속 |
| BigQuery ML | `CREATE MODEL` 로 SQL 안에서 모델 학습·예측 |

## 기본 사용법
```sql
-- 파티션 + 클러스터 테이블
CREATE TABLE shop.orders (
  order_id STRING, user_id STRING, amount NUMERIC, created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id;

SELECT DATE(created_at) AS day, SUM(amount) AS revenue
FROM shop.orders
WHERE created_at >= TIMESTAMP('2026-11-01')      -- 파티션 가지치기
GROUP BY day ORDER BY day;
```

Python 에서:
```python
from google.cloud import bigquery

client = bigquery.Client()
sql = "SELECT name, SUM(number) AS n FROM `bigquery-public-data.usa_names.usa_1910_2013` GROUP BY name ORDER BY n DESC LIMIT 5"
for row in client.query(sql).result():
    print(row["name"], row["n"])
```

## 자주 쓰는 패턴
- **비용 미리 보기**: `bq query --dry_run --use_legacy_sql=false '...'` 로 스캔 바이트를 확인하고, `SELECT *` 대신 필요한 열만 고른다.
- **파티션 필터 강제**: 테이블 옵션 `require_partition_filter = TRUE` 로 전체 스캔 질의를 막는다.
- **적재**: `bq load` 나 `LOAD DATA` 로 GCS 의 Parquet·CSV 를 적재, 스트리밍은 Storage Write API.
- **변환 계층**: [dbt](/develop-wiki/data-ml/transform/dbt/) 로 SQL 모델을 관리하고 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/) 로 스케줄링.

## 언제 쓰나 / 피할 때
- 쓸 때: Google Cloud 를 쓰는 조직의 분석 웨어하우스, 운영 인력 없이 대용량 SQL 분석, GA4·광고 데이터 등 Google 서비스 연동.
- 피할 때(대안): 다른 클라우드 중심이거나 멀티 클라우드면 [Snowflake](/develop-wiki/data-ml/warehouse-lake/snowflake/). 자체 인프라에서 오픈 포맷을 직접 관리하려면 [Apache Iceberg](/develop-wiki/data-ml/warehouse-lake/apache-iceberg/) + [Trino](/develop-wiki/data-ml/warehouse-lake/trino/). 작은 데이터는 [DuckDB](/develop-wiki/backend/database/duckdb/).

## 공식 문서
- [문서 홈](https://cloud.google.com/bigquery/docs) · [빠른 시작(콘솔)](https://cloud.google.com/bigquery/docs/quickstarts/query-public-dataset-console) · [GoogleSQL 레퍼런스](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax)
- [가격](https://cloud.google.com/bigquery/pricing) · [파티션 테이블](https://cloud.google.com/bigquery/docs/partitioned-tables) · [Python 클라이언트](https://cloud.google.com/python/docs/reference/bigquery/latest)

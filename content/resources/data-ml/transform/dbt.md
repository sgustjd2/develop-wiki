---
name: dbt
url: https://www.getdbt.com
docs: https://docs.getdbt.com/
repo: https://github.com/dbt-labs/dbt
stars: 14197
domain: data-ml
category: transform
description: SELECT 문으로 작성한 SQL 모델을 의존 순서대로 웨어하우스 테이블·뷰로 빌드하고 테스트·문서화하는 변환 도구. 분석용 데이터 모델링에 쓴다.
pricing: oss
tags: [sql, transformation, analytics-engineering, elt, data-testing]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
dbt(data build tool)는 ELT 의 T 를 맡는다. 분석가가 `SELECT` 문 하나씩을 "모델" 파일로 쓰고 `ref()` 로 다른 모델을 참조하면, dbt 가 의존 그래프를 만들어 웨어하우스에서 순서대로 테이블·뷰를 만든다. 테스트·문서·계보를 코드와 함께 버전 관리해 SQL 변환에 소프트웨어 개발 관행을 적용한다.

**버전·라이선스(2026-11 기준, 변경 많음):**
- **dbt v2.0**(PyPI `dbt` 2.0.12): Rust 로 다시 작성된 엔진(이전 명칭 dbt Fusion). 단일 바이너리로 배포되고 파싱·컴파일이 빠르며 더 엄격한 문법 검사를 한다. `dbt-labs/dbt` 저장소 `main` 의 소스는 Apache-2.0 이지만, 공식 배포판 `dbt` 는 dbt Labs 의 제품 라이선스(dbt v2 license agreement)를 따른다. Apache-2.0 런타임이 필요하면 `dbt-oss` 패키지를 쓴다(둘은 같은 Python 환경에 설치 불가).
- **dbt v1**(`dbt-core` 1.12.7, Apache-2.0): Python 구현은 `1.latest` 브랜치에서 유지된다. 기존 v1 프로젝트와 어댑터(`dbt-postgres` 등)는 계속 이 계열을 쓴다.

## 설치
```bash
# dbt v2 (macOS/Linux)
curl -fsSL https://public.cdn.getdbt.com/fs/install/install.sh | sh -s -- --update
# 또는
python -m pip install dbt          # 제품 라이선스 배포판
python -m pip install dbt-oss      # Apache-2.0 배포판

# dbt v1 (Python, 어댑터 별도)
python -m pip install dbt-core dbt-postgres

dbt --version
dbt init my_project
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 | `models/*.sql` 의 SELECT 문. 파일 이름이 테이블/뷰 이름 |
| `ref()` / `source()` | 다른 모델 / 원천 테이블 참조. 의존 그래프와 환경별 스키마를 자동 처리 |
| materialization | `view`, `table`, `incremental`, `ephemeral` 등 빌드 방식 |
| 데이터 테스트 | `unique`, `not_null`, `accepted_values`, `relationships` 등 YAML 선언 검사 |
| 유닛 테스트 | 고정 입력 행으로 모델 SQL 로직 검증 |
| 시드 / 스냅샷 | CSV 를 테이블로 적재 / 변하는 차원의 이력(SCD2) 보관 |
| Jinja 매크로 | SQL 템플릿·재사용 함수 |
| profile | 웨어하우스 접속 정보(`profiles.yml`) |

## 기본 사용법
```sql
-- models/staging/stg_orders.sql
select id as order_id, customer_id, amount, created_at
from {{ source('shop', 'orders') }}
where status != 'cancelled'
```

```sql
-- models/marts/customer_revenue.sql
{{ config(materialized='table') }}
select customer_id, sum(amount) as revenue, count(*) as orders
from {{ ref('stg_orders') }}
group by customer_id
```

```yaml
# models/marts/schema.yml
models:
  - name: customer_revenue
    columns:
      - name: customer_id
        data_tests: [unique, not_null]
```

```bash
dbt build                          # 모델 실행 + 테스트를 의존 순서대로
dbt build --select customer_revenue+   # 이 모델과 하위 모델만
dbt docs generate
```

## 자주 쓰는 패턴
- **계층 구조**: staging(원천 정리) → intermediate → marts(분석용) 폴더로 나누고 각 계층에 이름 규칙을 둔다.
- **증분 모델**: `materialized='incremental'` + `{% if is_incremental() %}` 조건으로 새 행만 처리.
- **CI 에서 변경분만**: 이전 manifest 와 비교하는 `--select state:modified+` 로 바뀐 모델만 빌드·테스트.
- **오케스트레이션**: [Dagster](/develop-wiki/data-ml/orchestration/dagster/)(dagster-dbt)나 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/)로 스케줄링.

## 언제 쓰나 / 피할 때
- 쓸 때: [BigQuery](/develop-wiki/data-ml/warehouse-lake/bigquery/)·[Snowflake](/develop-wiki/data-ml/warehouse-lake/snowflake/)·[Trino](/develop-wiki/data-ml/warehouse-lake/trino/) 등 웨어하우스 안의 SQL 변환을 팀 단위로 관리, 테스트·문서·계보가 필요한 분석 모델.
- 피할 때(대안): 가상 환경·증분 구간 관리를 엔진이 자동으로 해 주길 원하면 [SQLMesh](/develop-wiki/data-ml/transform/sqlmesh/). 복잡한 Python·ML 변환은 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/)·[Polars](/develop-wiki/data-ml/processing/polars/). 데이터 품질 검증만 필요하면 [Great Expectations](/develop-wiki/data-ml/transform/great-expectations/).

## 공식 문서
- [문서 홈](https://docs.getdbt.com/) · [dbt 설치](https://docs.getdbt.com/docs/local/install-dbt) · [모델](https://docs.getdbt.com/docs/build/models)
- [데이터 테스트](https://docs.getdbt.com/docs/build/data-tests) · [증분 모델](https://docs.getdbt.com/docs/build/incremental-models) · [dbt v2 라이선스](https://www.getdbt.com/dbt-product-license-agreement)

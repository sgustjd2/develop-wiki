---
name: SQLMesh
url: https://github.com/SQLMesh/sqlmesh
docs: https://sqlmesh.readthedocs.io/en/stable/
repo: https://github.com/SQLMesh/sqlmesh
stars: 3367
domain: data-ml
category: transform
description: SQL·Python 모델의 변경을 계획(plan)으로 미리 보여 주고 가상 환경으로 배포하는 데이터 변환 프레임워크. dbt 대안으로 증분·환경 관리가 중요할 때 쓴다.
pricing: oss
tags: [sql, transformation, data-pipeline, sqlglot, virtual-environment]
languages: [sql, python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SQLMesh 는 SQL 을 SQLGlot 으로 파싱해 열 단위 계보와 변경 영향을 이해하는 변환 프레임워크다. 모델을 고치면 `sqlmesh plan` 이 어떤 모델이 직접·간접으로 바뀌는지, 어떤 날짜 구간을 다시 계산할지 보여 주고, 승인하면 실행한다. 개발 환경은 운영 테이블을 가리키는 뷰(가상 데이터 환경)로 만들어, 검증한 결과를 재계산 없이 운영으로 승격할 수 있다.

**버전(2026-11 기준):** 0.236.4(2026-10-22). 저장소가 `TobikoData/sqlmesh` 에서 `SQLMesh/sqlmesh` 로 옮겨졌고, README 기준 Linux Foundation 프로젝트다. 라이선스 Apache-2.0.

## 설치
```bash
pip install sqlmesh                 # 엔진별 extra 예: "sqlmesh[bigquery]", "sqlmesh[snowflake]"
mkdir demo && cd demo
sqlmesh init duckdb                 # DuckDB 예제 프로젝트 생성
sqlmesh plan                        # prod 에 적용할 계획 생성·적용
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 | `MODEL(...)` 헤더 + SELECT 로 정의한 SQL 파일(또는 Python 모델) |
| kind | `FULL`, `VIEW`, `INCREMENTAL_BY_TIME_RANGE`, `INCREMENTAL_BY_UNIQUE_KEY`, `SCD_TYPE_2` 등 |
| plan | 코드 변경과 현재 상태를 비교한 실행 계획. breaking / non-breaking 분류 |
| 가상 데이터 환경 | `dev` 같은 환경을 뷰 계층으로 만들어 저렴하게 격리 |
| 인터벌 | 증분 모델이 처리한 시간 구간을 SQLMesh 가 추적, 빠진 구간만 백필 |
| audit / test | 데이터 검증 규칙 / 고정 입력 기반 유닛 테스트 |
| `@start_date`, `@end_date` | 증분 실행 구간을 넣어 주는 매크로 변수 |

## 기본 사용법
```sql
-- models/daily_revenue.sql
MODEL (
  name analytics.daily_revenue,
  kind INCREMENTAL_BY_TIME_RANGE (time_column order_date),
  start '2026-01-01',
  cron '@daily',
  grain (order_date)
);

SELECT
  order_date,
  SUM(amount) AS revenue
FROM raw.orders
WHERE order_date BETWEEN @start_date AND @end_date
GROUP BY order_date
```

```bash
sqlmesh plan dev                    # dev 환경에 변경 적용 (스키마 접미사 __dev)
sqlmesh fetchdf "select * from analytics__dev.daily_revenue limit 5"
sqlmesh plan                        # 검증 후 prod 승격 (이미 계산된 데이터는 재사용)
sqlmesh run                         # cron 에 따라 밀린 구간 실행
```

## 자주 쓰는 패턴
- **변경 영향 확인**: `sqlmesh plan --explain` 으로 적용 전 동작을 확인하고, 열 단위 계보로 하위 영향을 본다.
- **dbt 프로젝트 실행**: 기존 [dbt](/develop-wiki/data-ml/transform/dbt/) 프로젝트를 SQLMesh 로 불러와 점진적으로 옮길 수 있다.
- **방언 변환**: SQLGlot 기반이라 모델을 한 SQL 방언으로 쓰고 다른 엔진에서 실행할 수 있다.
- **로컬 개발 → 웨어하우스**: 로컬은 [DuckDB](/develop-wiki/backend/database/duckdb/), 운영은 [BigQuery](/develop-wiki/data-ml/warehouse-lake/bigquery/)·[Snowflake](/develop-wiki/data-ml/warehouse-lake/snowflake/) 게이트웨이로 같은 모델을 실행.

## 언제 쓰나 / 피할 때
- 쓸 때: 증분 모델이 많아 구간 관리·백필이 부담일 때, 환경별 재계산 비용을 줄이고 싶을 때, 변경 영향 분석이 중요할 때.
- 피할 때(대안): 넓은 생태계(패키지, 어댑터, 채용 시장)와 관리형 서비스가 우선이면 [dbt](/develop-wiki/data-ml/transform/dbt/). 품질 검증만 필요하면 [Great Expectations](/develop-wiki/data-ml/transform/great-expectations/).

## 공식 문서
- [문서 홈](https://sqlmesh.readthedocs.io/en/stable/) · [CLI Quickstart](https://sqlmesh.readthedocs.io/en/stable/quickstart/cli/) · [모델 kind](https://sqlmesh.readthedocs.io/en/stable/concepts/models/model_kinds/)
- [Plans](https://sqlmesh.readthedocs.io/en/stable/concepts/plans/) · [가상 데이터 환경](https://sqlmesh.readthedocs.io/en/stable/concepts/environments/)

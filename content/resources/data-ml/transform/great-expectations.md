---
name: Great Expectations (GX Core)
url: https://greatexpectations.io
docs: https://docs.greatexpectations.io/docs/core/introduction/
repo: https://github.com/fivetran/great_expectations
stars: 11942
domain: data-ml
category: transform
description: 데이터에 대한 기대(Expectation)를 코드로 선언하고 검증 결과를 기록하는 Python 데이터 품질 라이브러리. 파이프라인 단계마다 데이터 검사를 넣을 때 쓴다.
pricing: oss
tags: [data-quality, validation, testing, data-contract, pandas]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Great Expectations(GX Core)는 "이 열은 null 이 없다", "값은 1~6 사이다" 같은 기대를 Expectation 객체로 선언하고, pandas·Spark DataFrame 이나 SQL 테이블에 대해 검증해 결과(성공 여부, 실패 행 예시, 통계)를 남기는 라이브러리다. 검증 결과는 Data Docs(HTML 보고서)로 볼 수 있다.

**버전(2026-11 기준):** 1.25.0(2026-11-12), Python 3.10~3.14. GitHub 저장소가 `fivetran/great_expectations` 로 옮겨졌다. 0.x 와 1.x 는 API 가 크게 다르므로 오래된 블로그 예제(`ge.from_pandas`, `context.sources`)는 동작하지 않는다. 라이선스 Apache-2.0 (관리형 GX Cloud 는 별도 서비스).

비슷한 도구인 Soda Core 는 2026-11 현재 저장소 라이선스가 Elastic License 2.0(비 OSI)이라 이 항목에서 함께 다루지 않는다.

## 설치
```bash
pip install great_expectations
pip install "great_expectations[postgresql]"    # SQL 데이터 소스 extra 예
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Data Context | 설정·저장소의 진입점. `gx.get_context()` |
| Data Source / Data Asset | 데이터 위치(pandas, Spark, PostgreSQL 등) / 그 안의 테이블·DataFrame |
| Batch Definition / Batch | 검증할 데이터 범위 정의 / 실제 데이터 묶음 |
| Expectation | `gx.expectations.ExpectColumnValuesToNotBeNull` 같은 검증 규칙 클래스 |
| Expectation Suite | 여러 Expectation 의 묶음 |
| Validation Definition | Batch Definition + Suite 조합 |
| Checkpoint | 검증 실행 + 후속 액션(알림, Data Docs 갱신) |

## 기본 사용법
```python
import great_expectations as gx
import pandas as pd

df = pd.DataFrame({"order_id": [1, 2, 3], "qty": [1, 4, 9]})

context = gx.get_context()
source = context.data_sources.add_pandas("orders_src")
asset = source.add_dataframe_asset(name="orders")
batch_def = asset.add_batch_definition_whole_dataframe("all")
batch = batch_def.get_batch(batch_parameters={"dataframe": df})

result = batch.validate(
    gx.expectations.ExpectColumnValuesToBeBetween(column="qty", min_value=1, max_value=6)
)
print(result.success)          # False (9 가 범위를 벗어남)
```

Suite 로 묶어 반복 실행:
```python
suite = context.suites.add(gx.ExpectationSuite(name="orders_suite"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column="order_id"))

vd = context.validation_definitions.add(
    gx.ValidationDefinition(name="orders_check", data=batch_def, suite=suite))
print(vd.run(batch_parameters={"dataframe": df}).success)
```

## 자주 쓰는 패턴
- **파이프라인 게이트**: 적재 직후 Checkpoint 를 돌리고 실패하면 다음 단계를 멈춘다([Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/)·[Dagster](/develop-wiki/data-ml/orchestration/dagster/) task 안에서 실행).
- **경고 수준 분리**: Expectation 의 `severity` 로 차단·경고를 나눈다.
- **SQL 원천 검증**: 웨어하우스 테이블을 Data Asset 으로 등록해 쿼리로 검증(데이터를 가져오지 않음).
- **보고서 공유**: Data Docs 를 정적 사이트로 빌드해 검증 이력을 공유.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 파이프라인에서 데이터 품질 규칙을 코드로 관리, pandas·Spark·SQL 을 같은 규칙 체계로 검증할 때.
- 피할 때(대안): SQL 모델 옆에 간단한 not_null·unique 검사만 필요하면 [dbt](/develop-wiki/data-ml/transform/dbt/) 데이터 테스트나 [SQLMesh](/develop-wiki/data-ml/transform/sqlmesh/) audit 로 충분하다.

## 공식 문서
- [GX Core 소개](https://docs.greatexpectations.io/docs/core/introduction/) · [Try GX Core](https://docs.greatexpectations.io/docs/core/introduction/try_gx) · [Expectation 갤러리](https://greatexpectations.io/expectations/)
- [Checkpoint](https://docs.greatexpectations.io/docs/core/trigger_actions_based_on_results/create_a_checkpoint_with_actions) · [릴리스](https://github.com/fivetran/great_expectations/releases)

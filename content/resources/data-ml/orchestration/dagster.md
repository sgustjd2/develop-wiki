---
name: Dagster
url: https://dagster.io
docs: https://dagster.io/docs
repo: https://github.com/dagster-io/dagster
stars: 16467
domain: data-ml
category: orchestration
description: 테이블·모델 같은 데이터 자산(asset)을 중심으로 파이프라인을 정의하는 Python 오케스트레이터. 계보 추적과 로컬 개발·테스트가 중요한 데이터 플랫폼에 쓴다.
pricing: oss
tags: [orchestration, asset, lineage, pipeline, data-platform]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Dagster 는 "어떤 작업을 실행할지" 보다 "어떤 데이터 자산이 존재해야 하는지" 를 먼저 선언한다. 함수 하나가 테이블·파일·ML 모델 같은 자산 하나를 만들고, 함수 인자로 다른 자산에 대한 의존을 표현하면 Dagster 가 계보 그래프·스케줄·재실행 범위를 계산한다. 웹 UI(Dagster UI)에서 자산 상태, 파티션, 실행 이력을 본다.

**버전(2026-11 기준):** 1.13.30(2026-11-12), Python 3.11~3.14. 프로젝트 생성·실행은 `create-dagster` 와 `dg` CLI 가 기본이다. 라이선스 Apache-2.0 (관리형 서비스 Dagster+ 는 유료).

## 설치
```bash
uvx create-dagster@latest project my-pipeline   # 프로젝트 생성 (uv 사용)
cd my-pipeline && source .venv/bin/activate
dg dev                                         # UI: http://localhost:3000
```
pip 만 쓸 때는 `pip install create-dagster` 후 `create-dagster project ...`, 생성된 폴더에서 `pip install --editable .`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Asset (`@dg.asset`) | 영속 데이터 산출물을 만드는 함수. 인자 이름으로 상위 자산 의존 |
| Definitions | 자산·잡·스케줄·리소스 묶음. `defs/` 폴더는 자동 탐색 |
| Materialization | 자산을 실제로 계산해 저장하는 실행 |
| Resource | DB·API 클라이언트 등 주입 가능한 외부 의존성 |
| Partition | 날짜·지역 등으로 자산을 나눠 부분 실행·백필 |
| Schedule / Sensor / 자동화 조건 | 시간 기반 / 이벤트 기반 / 상위 자산 갱신에 반응하는 선언형 실행 |
| Asset check | 자산 품질 검사 결과를 자산과 함께 기록 |

## 기본 사용법
```python
# src/my_pipeline/defs/assets.py
import dagster as dg
import pandas as pd

@dg.asset
def raw_orders() -> pd.DataFrame:
    return pd.DataFrame({"sku": ["A", "B", "A"], "qty": [1, 2, 3]})

@dg.asset
def sku_totals(raw_orders: pd.DataFrame) -> pd.DataFrame:   # raw_orders 에 의존
    return raw_orders.groupby("sku", as_index=False)["qty"].sum()

@dg.asset_check(asset=sku_totals)
def qty_positive(sku_totals: pd.DataFrame) -> dg.AssetCheckResult:
    return dg.AssetCheckResult(passed=bool((sku_totals["qty"] > 0).all()))
```

```bash
dg check defs                 # 정의 로딩 검증
dg launch --assets "*"        # CLI 로 전체 자산 실행
```

## 자주 쓰는 패턴
- **dbt 통합**: `dagster-dbt` 로 [dbt](/develop-wiki/data-ml/transform/dbt/) 모델 각각을 자산으로 불러와 상·하위 Python 자산과 한 그래프로 관리.
- **일 단위 파티션**: `DailyPartitionsDefinition` 으로 날짜별 실행·백필.
- **리소스로 환경 분리**: 로컬은 DuckDB, 운영은 웨어하우스 리소스를 주입해 같은 자산 코드를 재사용.
- **테스트**: 자산 함수는 일반 함수라 단위 테스트에서 직접 호출하거나 `dg.materialize([...])` 로 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 데이터 플랫폼 전체의 자산 계보·신선도 관리, dbt 와 Python 처리를 한 그래프로 묶을 때, 로컬 개발·테스트 경험이 중요할 때.
- 피할 때(대안): 단순 작업 순서 실행과 넓은 연동 생태계가 우선이면 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/). 함수 몇 개를 가볍게 스케줄링하려면 [Prefect](/develop-wiki/data-ml/orchestration/prefect/).

## 공식 문서
- [문서 홈](https://dagster.io/docs) · [Quickstart](https://dagster.io/docs/getting-started/quickstart) · [Assets 개념](https://dagster.io/docs/guides/build/assets)
- [dg CLI](https://dagster.io/docs/api/clis/dg-cli/dg-cli-reference) · [dbt 통합](https://dagster.io/docs/integrations/libraries/dbt)

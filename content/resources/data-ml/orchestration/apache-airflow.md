---
name: Apache Airflow
url: https://airflow.apache.org
docs: https://airflow.apache.org/docs/apache-airflow/stable/
repo: https://github.com/apache/airflow
stars: 47651
domain: data-ml
category: orchestration
description: Python 코드로 작업 흐름(Dag)을 정의하고 스케줄링·모니터링하는 워크플로 오케스트레이터. 배치 ETL 과 정기 데이터 파이프라인 운영에 쓴다.
pricing: oss
tags: [workflow, scheduler, dag, etl, pipeline]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Airflow 는 작업(task)과 그 의존 관계를 Python 코드로 Dag 로 정의하면, 스케줄러가 정해진 주기나 이벤트에 따라 실행하고 웹 UI 로 실행 이력·재시도·로그를 보여 주는 오케스트레이터다. 실제 데이터 처리는 Spark·DB·클라우드 서비스에 맡기고, Airflow 는 "언제·어떤 순서로" 를 관리한다. 수백 개의 provider 패키지로 외부 시스템 연동을 제공한다.

**버전(2026-11 기준):** 3.4.0(2026-11-06). 3.x 에서 작업 코드는 `airflow.sdk` 의 Task SDK 로 작성하고, API 서버·스케줄러·Dag 프로세서·트리거러가 분리된 구조다. 2026-11 에 Go·Java·TypeScript Task SDK 1.0 도 공개됐다. 라이선스 Apache-2.0.

## 설치
공식 문서는 의존성 고정을 위해 constraints 파일을 함께 쓰도록 안내한다.
```bash
AIRFLOW_VERSION=3.4.0
PYTHON_VERSION="$(python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
pip install "apache-airflow==${AIRFLOW_VERSION}" \
  --constraint "https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"

airflow standalone      # 로컬 개발용: SQLite + 모든 컴포넌트, http://localhost:8080
```
`admin` 비밀번호는 첫 실행 출력에 표시된다. 운영은 공식 Docker Compose·Helm 차트나 관리형 서비스(MWAA, Cloud Composer, Astronomer)를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Dag | 작업과 의존 관계의 그래프. `dags/` 폴더의 Python 파일 |
| Task / Operator | 실행 단위 / 미리 만든 작업 템플릿(`BashOperator`, SQL·클라우드 연산자 등) |
| TaskFlow (`@task`) | Python 함수를 task 로 만들고 반환값을 XCom 으로 자동 전달 |
| Dag Run / 논리 날짜 | Dag 의 실행 한 번 / 그 실행이 담당하는 데이터 구간 |
| Asset | 데이터 산출물 단위. 생산되면 의존 Dag 를 트리거 |
| Connection / Variable | 외부 시스템 접속 정보 / 전역 설정 값 |
| Provider | 외부 연동 패키지(`apache-airflow-providers-*`) |

## 기본 사용법
```python
# dags/daily_sales.py
from datetime import datetime
from airflow.sdk import dag, task

@dag(schedule="@daily", start_date=datetime(2026, 1, 1), catchup=False, tags=["sales"])
def daily_sales():
    @task
    def extract() -> list[dict]:
        return [{"sku": "A", "qty": 3}, {"sku": "B", "qty": 5}]

    @task
    def total(rows: list[dict]) -> int:
        return sum(r["qty"] for r in rows)

    @task
    def report(n: int):
        print(f"total qty = {n}")

    report(total(extract()))

daily_sales()
```
`airflow dags test daily_sales` 로 스케줄러 없이 한 번 실행해 볼 수 있다.

## 자주 쓰는 패턴
- **멱등 작업**: 논리 날짜 구간만 덮어쓰도록 작성해 재시도·백필이 안전하게 한다.
- **무거운 일은 밖에서**: XCom 에는 작은 메타데이터만 넘기고 데이터는 스토리지·DB 에 둔다.
- **데이터 기반 스케줄**: `Asset` 을 `outlets` 로 선언하고 소비 Dag 의 `schedule=[asset]` 로 연결.
- **dbt 연동**: [dbt](/develop-wiki/data-ml/transform/dbt/) 실행을 task 로 감싸 변환 단계를 스케줄링.

## 언제 쓰나 / 피할 때
- 쓸 때: 정해진 주기의 배치 ETL, 여러 시스템을 순서대로 호출하는 파이프라인, 넓은 연동 생태계와 커뮤니티가 필요할 때.
- 피할 때(대안): 데이터 자산·계보 중심 설계는 [Dagster](/develop-wiki/data-ml/orchestration/dagster/), 순수 Python 함수를 가볍게 흐름으로 만들려면 [Prefect](/develop-wiki/data-ml/orchestration/prefect/), YAML 선언형·언어 무관 흐름은 [Kestra](/develop-wiki/data-ml/orchestration/kestra/). 실시간 스트림 처리는 오케스트레이터가 아니라 [Apache Flink](/develop-wiki/data-ml/processing/apache-flink/).

## 공식 문서
- [문서 홈](https://airflow.apache.org/docs/apache-airflow/stable/) · [Quick Start](https://airflow.apache.org/docs/apache-airflow/stable/start.html) · [TaskFlow 튜토리얼](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html)
- [Assets](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/assets.html) · [3.0 업그레이드 가이드](https://airflow.apache.org/docs/apache-airflow/stable/installation/upgrading_to_airflow3.html)

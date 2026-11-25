---
name: Prefect
url: https://www.prefect.io
docs: https://www.prefect.io/docs/v3/
repo: https://github.com/PrefectHQ/prefect
stars: 24241
domain: data-ml
category: orchestration
description: 일반 Python 함수에 데코레이터를 붙여 재시도·캐싱·스케줄이 있는 워크플로로 만드는 오케스트레이터. Python 중심 데이터·ML 파이프라인에 쓴다.
pricing: oss
tags: [workflow, orchestration, python, scheduler, pipeline]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Prefect 는 기존 Python 코드를 거의 바꾸지 않고 `@flow`, `@task` 데코레이터만 붙여 관측·재시도·캐싱·동시 실행을 얻게 하는 워크플로 엔진이다. Dag 를 미리 선언하지 않고 일반 제어문(if, for)이 그대로 흐름이 되며, 실행 상태는 Prefect 서버(셀프 호스팅) 또는 Prefect Cloud 에 기록된다.

**버전(2026-11 기준):** 3.9.3(2026-11-13), Python 3.11 이상. 라이선스 Apache-2.0 (Prefect Cloud 는 무료 티어가 있는 유료 서비스).

## 설치
```bash
pip install -U prefect
prefect server start        # 로컬 UI·API: http://127.0.0.1:4200
```
`prefect cloud login` 으로 Cloud 작업 공간에 연결할 수도 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Flow (`@flow`) | 워크플로 진입 함수. 실행마다 flow run 이 기록됨 |
| Task (`@task`) | flow 안의 작업 단위. 재시도·캐싱·동시 실행(`.submit`, `.map`) |
| Deployment | flow 를 원격·예약 실행 가능하게 등록한 것 |
| `flow.serve()` | 현재 프로세스에서 스케줄 실행을 받는 가장 간단한 배포 방식 |
| Work pool / Worker | 인프라(프로세스, Docker, Kubernetes, 서버리스)별 실행 대기열과 실행기 |
| Block | 자격 증명·스토리지 설정을 저장하는 재사용 설정 객체 |
| 상태(State) | Pending·Running·Completed·Failed 등 실행 상태와 결과 |

## 기본 사용법
```python
import httpx
from prefect import flow, task

@task(retries=3, retry_delay_seconds=10)
def fetch_stars(repo: str) -> int:
    r = httpx.get(f"https://api.github.com/repos/{repo}")
    r.raise_for_status()
    return r.json()["stargazers_count"]

@flow(log_prints=True)
def repo_report(repos: list[str]):
    for repo in repos:
        print(repo, fetch_stars(repo))

if __name__ == "__main__":
    repo_report(["PrefectHQ/prefect", "apache/airflow"])     # 바로 실행
    # repo_report.serve(name="daily", cron="0 9 * * *")       # 스케줄 실행
```

## 자주 쓰는 패턴
- **병렬 실행**: `fetch_stars.map(repos)` 또는 `.submit()` 으로 task 를 동시에 돌리고 결과를 모은다.
- **결과 캐싱**: task 에 `cache_policy` 와 `cache_expiration` 을 지정해 같은 입력의 재계산을 건너뛴다.
- **인프라 분리**: 코드는 그대로 두고 deployment 의 work pool 만 바꿔 로컬→Kubernetes 로 옮긴다.
- **이벤트 트리거**: 자동화(Automation)로 다른 flow 상태나 외부 이벤트에 반응해 실행.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 스크립트·노트북 코드를 빠르게 스케줄·재시도 가능한 파이프라인으로 만들 때, 동적으로 분기하는 흐름.
- 피할 때(대안): 데이터 자산·계보 중심 관리는 [Dagster](/develop-wiki/data-ml/orchestration/dagster/), 대규모 조직의 표준 배치 스케줄러와 provider 생태계가 필요하면 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/), 비 Python 팀과 YAML 로 협업하려면 [Kestra](/develop-wiki/data-ml/orchestration/kestra/).

## 공식 문서
- [문서 홈](https://www.prefect.io/docs/v3/) · [Quickstart](https://www.prefect.io/docs/v3/get-started/quickstart) · [Flows](https://www.prefect.io/docs/v3/concepts/flows)
- [Tasks](https://www.prefect.io/docs/v3/concepts/tasks) · [Deployments](https://www.prefect.io/docs/v3/concepts/deployments) · [Work pools](https://www.prefect.io/docs/v3/concepts/work-pools)

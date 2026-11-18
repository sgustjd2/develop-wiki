---
name: Kestra
url: https://kestra.io
docs: https://kestra.io/docs
repo: https://github.com/kestra-io/kestra
domain: data-ml
category: orchestration
description: YAML 로 흐름(flow)을 선언하는 이벤트 기반 오케스트레이션 플랫폼. 언어에 상관없이 스크립트·SQL·API 호출을 묶는 데이터·인프라 자동화에 쓴다.
pricing: oss
tags: [orchestration, yaml, declarative, event-driven, workflow]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kestra 는 흐름을 코드가 아닌 YAML 로 선언하고, 각 단계(task)는 플러그인 타입으로 지정하는 오케스트레이터다. Python·Node·Shell 스크립트, SQL, HTTP 호출, 클라우드 작업을 같은 흐름에 섞을 수 있고, 웹 UI 의 편집기·토폴로지 뷰에서 흐름을 만들고 실행할 수 있다. 스케줄·웹훅·파일 도착·메시지 같은 트리거로 이벤트 기반 실행을 지원한다.

**버전(2026-11 기준):** 2.0.11(2026-11-17). 2.0 은 새 실행 엔진, 어디서나 실행 가능한 워커, 흐름을 에이전트 도구로 노출하는 기능을 내세운 메이저 버전이며 1.3 계열도 패치가 계속 나온다. 서버는 Java 로 작성됐고 라이선스 Apache-2.0 (Enterprise·Cloud 는 유료).

## 설치
공식 Quickstart 의 로컬 실행 명령:
```bash
docker run --pull=always --rm -it -p 8080:8080 --user=root \
  --name kestra \
  -v kestra_data:/app/storage -v kestra_db:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp \
  kestra/kestra:latest-slim server local
```
`http://localhost:8080` 에서 UI 를 연다. `latest-slim` 은 플러그인 없이 시작해 첫 사용 시 내려받고, `latest` 이미지는 전체 플러그인을 포함한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Flow | `id`, `namespace`, `tasks` 를 가진 YAML 워크플로 |
| Namespace | 흐름·파일·KV·시크릿을 묶는 계층(`company.team`) |
| Task | `type` 으로 플러그인 클래스를 지정하는 실행 단위 |
| Trigger | Schedule(cron), Webhook, Flow(다른 흐름 완료), 파일·메시지 감지 |
| Inputs / Outputs | 실행 매개변수 / task 결과. `{{ outputs.<id>.<key> }}` 로 참조 |
| Namespace Files | 흐름이 쓰는 스크립트·SQL 파일을 Kestra 에 저장 |
| Execution | 흐름 실행 한 번. UI 에서 Gantt·로그·재실행 |

## 기본 사용법
```yaml
id: hello_pipeline
namespace: company.data

inputs:
  - id: city
    type: STRING
    defaults: Seoul

tasks:
  - id: greet
    type: io.kestra.plugin.core.log.Log
    message: "Report for {{ inputs.city }}"

  - id: compute
    type: io.kestra.plugin.scripts.python.Script
    script: |
      print(sum(range(10)))

triggers:
  - id: daily
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "0 9 * * *"
```
UI 의 Flows → Create 에 붙여 넣고 Execute 로 실행한다. 플러그인 타입 이름과 속성은 UI 편집기의 문서 패널이나 플러그인 문서에서 확인한다.

## 자주 쓰는 패턴
- **흐름 간 연결**: `io.kestra.plugin.core.trigger.Flow` 트리거로 상위 흐름이 성공하면 하위 흐름을 실행.
- **Git 으로 관리**: 흐름 YAML 을 저장소에 두고 Git 동기화·CI 배포로 운영한다.
- **스크립트는 컨테이너에서**: 스크립트 task 는 Docker 태스크 러너로 격리 실행해 의존성을 고정한다.
- **dbt·SQL 실행**: dbt CLI 플러그인과 DB 쿼리 플러그인으로 변환 단계를 흐름에 넣는다.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 외 언어·도구가 섞인 파이프라인, 비개발자와 함께 보는 선언형 흐름, 이벤트 기반 자동화.
- 피할 때(대안): Python 코드 안에서 흐름을 정의하고 테스트하려면 [Prefect](/develop-wiki/data-ml/orchestration/prefect/)·[Dagster](/develop-wiki/data-ml/orchestration/dagster/). 기존 Airflow 자산이 많다면 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/).

## 공식 문서
- [문서 홈](https://kestra.io/docs) · [Quickstart](https://kestra.io/docs/getting-started/quickstart) · [Tutorial](https://kestra.io/docs/tutorial)
- [플러그인 목록](https://kestra.io/plugins) · [Kestra 2.0 발표](https://kestra.io/blogs/release-2-0)

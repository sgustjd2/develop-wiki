---
name: Hera
url: https://hera.readthedocs.io/en/stable/
docs: https://hera.readthedocs.io/en/stable/
repo: https://github.com/argoproj-labs/hera
stars: 951
domain: data-ml
category: orchestration
description: Argo Workflows 를 파이썬 코드로 정의하고 제출하는 SDK. 파이썬 함수를 컨테이너 템플릿으로 바꿔 DAG 를 구성하며, Argo 기반 데이터·ML 파이프라인에 쓴다.
pricing: oss
tags: [argo-workflows, python, kubernetes, dag, pipeline, sdk]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Hera 는 [Argo Workflows](/develop-wiki/data-ml/orchestration/argo-workflows/) 용 파이썬 SDK 다. YAML 을 직접 쓰는 대신 파이썬 객체와 컨텍스트 매니저로 `Workflow`, `DAG`, `Steps`, `Container` 를 만들고, `@script` 데코레이터로 파이썬 함수를 그대로 컨테이너 안에서 실행되는 템플릿으로 바꾼다. 오케스트레이션 로직(`>>` 로 의존 순서)과 비즈니스 로직을 분리하고, 완성한 워크플로는 `w.create()` 로 Argo 서버에 제출하거나 `to_yaml()` 로 YAML 을 뽑아 GitOps 에 쓴다.

라이선스는 Apache-2.0, 최신은 **7.2.0**(2026-11-04)이며 Python 3.10 이상(4 미만)이 필요하다. 실행하려면 Kubernetes 에 배포된 Argo Workflows 서버가 있어야 한다. Airflow·Prefect·Dagster 처럼 자체 스케줄러를 갖는 도구가 아니라 Argo 위의 클라이언트 라이브러리라는 점이 다르다.

## 설치
```bash
pip install hera
pip install "hera[yaml]"          # Workflow.to_yaml() 용 PyYAML
pip install "hera[async-client]"  # async_* 메서드용 httpx
pip install "hera[cli]"           # 실험적 CLI (YAML <-> Python 변환)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Workflow` | 워크플로 리소스. `generate_name`, `entrypoint` 지정, `with` 블록으로 템플릿 포함 |
| `@script()` | 파이썬 함수를 Script 템플릿으로 변환. 함수 인자가 파라미터가 됨 |
| `Container` | 이미지와 명령으로 직접 정의하는 템플릿 |
| `DAG` / `Steps` | 의존 그래프 / 순차·병렬 단계 |
| `>>` | 실행 순서 연산자 (`A >> [B, C] >> D`) |
| `global_config` | 서버 `host`, `token`, 기본 이미지 등 전역 설정 |
| `ArgoCLITokenGenerator` | `argo` CLI 로 인증 토큰을 얻는 헬퍼 |

## 기본 사용법
```python
from hera.workflows import DAG, Workflow, script

@script()
def echo(message: str):
    print(message)

with Workflow(generate_name="dag-diamond-", entrypoint="diamond") as w:
    with DAG(name="diamond"):
        A = echo(name="A", arguments={"message": "A"})
        B = echo(name="B", arguments={"message": "B"})
        C = echo(name="C", arguments={"message": "C"})
        D = echo(name="D", arguments={"message": "D"})
        A >> [B, C] >> D

w.create()   # Argo 서버로 제출
```
포트 포워딩한 로컬 서버(`localhost:2746`)에 인증해 쓰는 설정:
```python
from hera.auth import ArgoCLITokenGenerator
from hera.shared import global_config

global_config.host = "http://localhost:2746"
global_config.token = ArgoCLITokenGenerator
```

## 자주 쓰는 패턴
- **GitOps 출력**: `w.to_yaml()` 로 YAML 을 생성해 저장소에 커밋하고 Argo CD 로 배포한다.
- **인증**: 서버가 인증 계층 뒤에 있으면 Bearer 토큰을 `global_config.token` 으로 준다.
- **기존 YAML 이전**: `hera generate python` / `hera generate yaml` 로 상호 변환한다(실험적 기능).
- **컨테이너 이미지 관리**: `@script(image=...)` 로 함수가 실행될 이미지를 지정하고, 필요한 패키지를 이미지에 포함한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Argo Workflows 를 쓰는 팀이 YAML 대신 파이썬으로 파이프라인을 작성하고 싶을 때, 데이터·ML 코드를 컨테이너 단계로 쉽게 나누고 싶을 때.
- 피할 때(대안): Kubernetes 없이 쓰는 파이프라인이면 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/), [Dagster](/develop-wiki/data-ml/orchestration/dagster/), [Prefect](/develop-wiki/data-ml/orchestration/prefect/). 각 단계의 환경 격리가 컨테이너 단위로 필요 없는 가벼운 작업에는 과하다.

## 공식 문서
- [Quick Start](https://hera.readthedocs.io/en/stable/walk-through/quick-start/) · [인증](https://hera.readthedocs.io/en/stable/walk-through/authentication/) · [GitHub README](https://github.com/argoproj-labs/hera#readme)
- 언어: [Python](/develop-wiki/languages/python/)

---
name: Argo Workflows
url: https://argoproj.github.io/workflows/
docs: https://argo-workflows.readthedocs.io/en/latest/
repo: https://github.com/argoproj/argo-workflows
stars: 17110
domain: data-ml
category: orchestration
description: 각 단계를 컨테이너로 실행하는 Kubernetes 네이티브 워크플로 엔진. DAG·단계형 배치 작업, ML 파이프라인, CI 작업을 클러스터 위에서 병렬로 돌릴 때 쓴다.
pricing: oss
tags: [workflow, kubernetes, dag, pipeline, batch, cncf, argo]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Argo Workflows 는 워크플로를 Kubernetes CRD(`Workflow`)로 선언하고, 각 단계를 Pod 로 실행하는 오케스트레이션 엔진이다. 단계 간 의존성은 순차 `steps` 또는 `dag` 로 표현하고, 파라미터·아티팩트(S3·GCS·MinIO 등)를 단계 사이에 넘긴다. 컨테이너만 있으면 언어에 상관없이 단계를 만들 수 있고, 클러스터 자원만큼 병렬 실행이 가능해 대규모 배치·데이터 처리·ML 학습 파이프라인에 쓰인다. Kubeflow Pipelines 의 실행 엔진으로도 쓰인다.

CNCF 졸업 프로젝트(Argo 프로젝트), Apache-2.0. 2026-11 기준 최신 릴리스는 v4.1.6(2026-10-22)이며 v4.0.x 도 패치가 나온다. **v4.0**(2026-02)에서 저장소 내 Python SDK(`argo-workflows` PyPI 패키지)가 제거되고 Python 은 **Hera** 를 권장하게 됐으며, CronWorkflow 의 `schedule`(→ 목록형 `schedules`), `podPriority`(→ `podPriorityClassName`), `synchronization.mutex`·`semaphore`(→ 목록형 `mutexes`·`semaphores`) 같은 폐기 필드가 삭제됐다. 같은 Argo 계열의 배포 도구는 [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/) 다.

## 설치
```bash
kubectl create namespace argo
kubectl apply -n argo -f \
  https://github.com/argoproj/argo-workflows/releases/download/v4.1.6/install.yaml

brew install argo                      # CLI (또는 GitHub 릴리스 바이너리)
kubectl -n argo port-forward svc/argo-server 2746:2746   # UI: https://localhost:2746
```
운영 설치는 공식 Helm 차트(argo/argo-workflows)를 많이 쓰고, 아티팩트 저장소·인증(SSO)·워크플로 아카이브(DB)를 함께 설정한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Workflow | 실행 단위 CRD. `entrypoint` 템플릿부터 실행 |
| Template | 단계 정의. `container`, `script`, `resource`, `steps`, `dag`, `suspend`, `http` 등 |
| steps / dag | 순차·병렬 단계 목록 또는 의존성 그래프 |
| Parameters / Artifacts | 단계 입출력 값과 파일. 아티팩트는 오브젝트 스토리지에 저장 |
| WorkflowTemplate / ClusterWorkflowTemplate | 재사용 가능한 템플릿 라이브러리 |
| CronWorkflow | 크론 일정으로 Workflow 생성 |
| withItems / withParam | 목록만큼 단계를 팬아웃 (map) |
| retryStrategy / synchronization | 재시도 정책, 세마포어·뮤텍스로 동시 실행 제한 |

## 기본 사용법
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: etl-
spec:
  entrypoint: main
  templates:
    - name: main
      dag:
        tasks:
          - { name: extract, template: run, arguments: { parameters: [{ name: cmd, value: "extract" }] } }
          - { name: transform, template: run, dependencies: [extract], arguments: { parameters: [{ name: cmd, value: "transform" }] } }
    - name: run
      inputs: { parameters: [{ name: cmd }] }
      container:
        image: python:3.13-slim
        command: [python, -c]
        args: ["print('{{inputs.parameters.cmd}}')"]
```
```bash
argo submit -n argo etl.yaml --watch
argo list -n argo
argo logs -n argo @latest
argo retry -n argo <workflow-name>
```

## 자주 쓰는 패턴
- **Python 으로 작성**: Hera 로 Python 코드에서 Workflow 를 정의·제출해 YAML 작성 부담을 줄인다.
- **팬아웃/팬인**: 앞 단계 출력(JSON 배열)을 `withParam` 으로 받아 병렬 처리하고 다음 단계에서 집계한다.
- **템플릿 라이브러리**: 공통 단계(데이터 다운로드, 슬랙 알림)를 WorkflowTemplate 으로 두고 `templateRef` 로 참조한다.
- **이벤트 기반 실행**: Argo Events 의 Sensor 로 웹훅·메시지 큐·S3 이벤트가 오면 Workflow 를 생성한다.
- **비용 관리**: `podGC`, `ttlStrategy` 로 끝난 Pod·Workflow 를 정리하고, 노드 셀렉터로 GPU·스팟 노드에 배치한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Kubernetes 를 운영하고 있고 단계마다 다른 컨테이너·자원(GPU 등)이 필요한 배치·ML 파이프라인, 대규모 병렬 작업.
- 피할 때(대안): Python 코드 중심의 데이터 파이프라인·스케줄링·백필 UI 가 중요하면 [Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/)·[Dagster](/develop-wiki/data-ml/orchestration/dagster/)·[Prefect](/develop-wiki/data-ml/orchestration/prefect/). Kubernetes 없이 YAML 로 흐름을 짜려면 [Kestra](/develop-wiki/data-ml/orchestration/kestra/). 장시간 실행되는 애플리케이션 워크플로(주문 처리 등)는 [Temporal](/develop-wiki/backend/messaging/temporal/) 계열이 맞다.
- 주의: 단계마다 Pod 가 뜨므로 아주 짧은 단계가 많으면 오버헤드가 크다. v3 에서 올릴 때 업그레이드 가이드의 제거 필드를 먼저 확인한다.

## 공식 문서
- [문서 홈](https://argo-workflows.readthedocs.io/en/latest/) · [퀵스타트](https://argo-workflows.readthedocs.io/en/latest/quick-start/) · [업그레이드 가이드](https://argo-workflows.readthedocs.io/en/latest/upgrading/) · [Hera](https://hera.readthedocs.io/) · [GitHub 릴리스](https://github.com/argoproj/argo-workflows/releases)

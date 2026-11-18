---
name: Argo Events
url: https://argoproj.github.io/argo-events/
docs: https://argoproj.github.io/argo-events/
repo: https://github.com/argoproj/argo-events
stars: 2720
domain: backend
category: infra-devops
description: 웹훅·메시지 큐·클라우드 이벤트를 받아 Argo Workflows 나 Kubernetes 리소스를 실행하는 이벤트 기반 자동화 프레임워크. Kubernetes 에서 이벤트 트리거를 만들 때 쓴다.
pricing: oss
tags: [kubernetes, event-driven, argo, eventbus, sensor, webhook, cncf]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Argo Events 는 외부 이벤트를 받아 Kubernetes 안에서 동작을 일으키는 이벤트 기반 오케스트레이션 도구다. 구성은 세 단계다. **EventSource** 가 웹훅, Kafka, SQS/SNS, GitHub, Redis Streams, Pub/Sub 등에서 이벤트를 받고, **EventBus**(NATS JetStream 또는 Kafka)가 이를 전달하며, **Sensor** 가 의존하는 이벤트 조건이 맞으면 **Trigger** 로 Argo Workflow 생성, 임의 Kubernetes 리소스 생성·수정, HTTP 호출 등을 실행한다. 여러 이벤트를 AND/OR 로 조합하거나 필터링할 수 있다.

Argo 프로젝트(CNCF 졸업)의 일부이며 라이선스는 Apache-2.0, 최신 릴리스는 **v1.9.11**(2026-07-13)이다. NATS Streaming(STAN) EventBus 는 EOL 로 deprecated 이므로 새 구성은 JetStream 을 쓴다. 대량 이벤트와 Sensor 수평 확장이 필요하면 Kafka EventBus 를 문서가 권장한다. Workflows 와 함께 쓰는 것이 일반적이다([Argo Workflows](/develop-wiki/data-ml/orchestration/argo-workflows/)).

## 설치
```bash
kubectl create namespace argo-events
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-events/stable/manifests/install.yaml
# 검증 웹훅 포함 설치 (선택)
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-events/stable/manifests/install-validating-webhook.yaml
```
EventBus 를 먼저 만든다(예: JetStream).
```yaml
apiVersion: argoproj.io/v1alpha1
kind: EventBus
metadata: { name: default }
spec:
  jetstream:
    version: latest   # 공식 예제 값. 운영에서는 latest 대신 지원되는 NATS 버전을 명시
```
지원 버전 목록은 `kubectl get configmap argo-events-controller-config -o yaml` 로 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| EventSource | 이벤트를 받아 EventBus 로 발행. 한 리소스에 여러 이벤트 정의 가능 |
| EventBus | 이벤트 전달 계층 (JetStream, Kafka; STAN 은 deprecated) |
| Sensor | `dependencies` 로 이벤트 조건을 선언하고 `triggers` 로 동작 정의 |
| Trigger | Kubernetes 리소스 생성(`k8s`), Argo Workflow, HTTP, 메시지 발행 등 |
| 파라미터 매핑 | 이벤트 본문(`dataKey`)을 트리거 리소스 필드(`dest`)에 주입 |
| 필터 | 이벤트 데이터·시간·표현식 기반 필터링 |
| `argo-events lint` | EventSource·Sensor YAML 을 적용 전에 검증하는 도구 |

## 기본 사용법
웹훅을 받아 Argo Workflow 를 만드는 예제다. 먼저 EventSource.
```yaml
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata: { name: webhook }
spec:
  service:
    ports:
      - port: 12000
        targetPort: 12000
  webhook:
    example:
      port: "12000"
      endpoint: /example
      method: POST
```
이어서 Sensor. 요청 본문을 워크플로 파라미터로 넘긴다.
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata: { name: webhook }
spec:
  template:
    serviceAccountName: operate-workflow-sa
  dependencies:
    - name: test-dep
      eventSourceName: webhook
      eventName: example
  triggers:
    - template:
        name: webhook-workflow-trigger
        k8s:
          operation: create
          source:
            resource:
              apiVersion: argoproj.io/v1alpha1
              kind: Workflow
              metadata: { generateName: webhook- }
              spec:
                entrypoint: echo
                arguments:
                  parameters: [{ name: message, value: hello }]
                templates:
                  - name: echo
                    inputs: { parameters: [{ name: message }] }
                    container:
                      image: busybox
                      command: [echo, "{{inputs.parameters.message}}"]
          parameters:
            - src: { dependencyName: test-dep, dataKey: body }
              dest: spec.arguments.parameters.0.value
```
```bash
kubectl -n argo-events port-forward svc/webhook-eventsource-svc 12000:12000
curl -d '{"message":"first"}' -H "Content-Type: application/json" -X POST http://localhost:12000/example
kubectl -n argo-events get workflows
```
Sensor 가 Workflow 를 만들 수 있도록 RBAC(`operate-workflow-sa`)와 Argo Workflows 가 `argo-events` 네임스페이스를 감시해야 한다(공식 빠른 시작 참고).

## 자주 쓰는 패턴
- **GitHub·GitLab 웹훅 → CI 워크플로**: EventSource `github` 로 push/PR 이벤트를 받아 빌드 Workflow 를 만든다.
- **큐·스트림 기반 배치**: SQS, Kafka, Redis Streams 메시지로 데이터 파이프라인을 시작한다.
- **복합 조건**: Sensor `dependencies` 를 여러 개 두고 조건식으로 AND/OR 를 구성한다.
- **스케줄**: `calendar` EventSource 로 cron 형 트리거를 둔다.
- **적용 전 검증**: `argo-events lint 파일.yaml` 로 매니페스트를 검사한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 클러스터 안에서 외부 이벤트에 반응해 워크플로·잡을 시작해야 할 때, Argo Workflows·CD 와 함께 이벤트 기반 자동화를 만들 때.
- 피할 때(대안): 단순 cron 이면 Kubernetes CronJob, 복잡한 상태 머신·내구성 있는 워크플로가 필요하면 Temporal 같은 워크플로 엔진이 낫다.

## 공식 문서
- [문서 홈](https://argoproj.github.io/argo-events/) · [빠른 시작](https://argoproj.github.io/argo-events/quick_start/) · [EventBus(JetStream)](https://argoproj.github.io/argo-events/eventbus/jetstream/)

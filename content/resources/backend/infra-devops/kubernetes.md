---
name: Kubernetes
url: https://kubernetes.io
docs: https://kubernetes.io/docs/home/
repo: https://github.com/kubernetes/kubernetes
stars: 129247
domain: backend
category: infra-devops
description: 여러 노드에 컨테이너를 배포·확장·복구하는 오케스트레이션 플랫폼. 선언형 매니페스트로 서비스를 운영할 때 쓰는 사실상 표준이다.
pricing: oss
tags: [container, orchestration, k8s, cncf, kubectl]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kubernetes(k8s)는 컨테이너를 여러 서버(노드)에 배치하고, 원하는 상태(레플리카 수, 이미지 버전, 설정)를 선언하면 컨트롤러가 실제 상태를 계속 맞춰 주는 오케스트레이션 시스템이다. 장애 난 파드 재시작, 롤링 업데이트, 서비스 디스커버리, 오토스케일링을 기본으로 제공한다. CNCF 졸업(Graduated) 프로젝트이며 Apache-2.0. 2026-11 기준 최신 안정 버전은 1.37.2, 1.38 은 베타 단계다. 마이너 버전은 대략 4개월마다 나오고 최근 3개 마이너가 패치를 받는다.

직접 클러스터를 운영하기보다 EKS·GKE·AKS 같은 매니지드 서비스를 쓰는 경우가 많다. 한국어 공식 문서(kubernetes.io/ko)가 있지만 일부 페이지는 영문보다 늦게 갱신된다.

## 설치
로컬 학습용 클러스터와 CLI.
```bash
# kubectl (macOS)
brew install kubectl
# 로컬 클러스터: kind(Docker 안에 노드를 띄움) 또는 minikube
brew install kind
kind create cluster --name dev
kubectl cluster-info
kubectl get nodes
```
운영 클러스터는 매니지드 서비스, 또는 kubeadm·k3s·Talos 등으로 구성한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Pod | 배포의 최소 단위. 네트워크·볼륨을 공유하는 컨테이너 묶음 |
| Deployment | 무상태 파드의 레플리카 수·롤링 업데이트를 관리 (내부적으로 ReplicaSet) |
| StatefulSet | 고정 이름·전용 볼륨이 필요한 상태 저장 워크로드(DB 등) |
| DaemonSet / Job / CronJob | 노드마다 1개 / 일회성 작업 / 주기 작업 |
| Service | 파드 집합에 고정 이름·가상 IP 를 부여 (ClusterIP, NodePort, LoadBalancer) |
| Ingress / Gateway API | 클러스터 밖 HTTP 트래픽 라우팅. 신규 구성은 Gateway API 가 권장 방향 |
| ConfigMap / Secret | 설정과 비밀값을 파드에 환경 변수·파일로 주입 |
| Namespace | 리소스 이름 공간·권한·쿼터 경계 |
| PersistentVolume(Claim) | 파드 수명과 분리된 스토리지 |
| Probe | liveness·readiness·startup 검사로 재시작과 트래픽 투입 시점을 결정 |
| HPA | CPU·메트릭 기준 레플리카 자동 조정 |

## 기본 사용법
Deployment 와 Service 를 하나의 매니페스트로 선언한다.
```yaml
# api.yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: todo-api }
spec:
  replicas: 3
  selector: { matchLabels: { app: todo-api } }
  template:
    metadata: { labels: { app: todo-api } }
    spec:
      containers:
        - name: api
          image: ghcr.io/example/todo-api:0.1
          ports: [{ containerPort: 3000 }]
          envFrom: [{ secretRef: { name: todo-db } }]
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { memory: 256Mi }
          readinessProbe:
            httpGet: { path: /healthz, port: 3000 }
---
apiVersion: v1
kind: Service
metadata: { name: todo-api }
spec:
  selector: { app: todo-api }
  ports: [{ port: 80, targetPort: 3000 }]
```
```bash
kubectl create secret generic todo-db --from-literal=DATABASE_URL=postgres://...
kubectl apply -f api.yaml
kubectl get pods -l app=todo-api
kubectl rollout status deploy/todo-api
kubectl port-forward svc/todo-api 8080:80
```

## 자주 쓰는 패턴
- **이미지 갱신·롤백**: `kubectl set image deploy/todo-api api=ghcr.io/example/todo-api:0.2` → 문제 시 `kubectl rollout undo deploy/todo-api`.
- **디버깅 순서**: `kubectl get pods` → `kubectl describe pod <name>`(이벤트) → `kubectl logs <pod> --previous` → `kubectl debug` 로 임시 컨테이너 붙이기.
- **requests/limits 설정**: requests 는 스케줄링 기준, 메모리 limit 초과는 OOMKilled. CPU limit 은 스로틀링을 유발하니 신중히.
- **패키징·배포 자동화**: 매니페스트 묶음은 [Helm](/develop-wiki/backend/infra-devops/helm/) 차트나 Kustomize 로 관리하고, Git 기준 동기화는 [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/) 같은 GitOps 도구에 맡긴다.
- **관측성**: 메트릭·트레이스는 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) Collector 를 DaemonSet 이나 사이드카로 배치해 수집한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서비스 여러 개를 여러 노드에서 운영하고 무중단 배포·자가 복구·오토스케일링이 필요할 때, 플랫폼 팀이 공통 배포 기반을 제공할 때.
- 피할 때(대안): 서비스가 한두 개이고 트래픽이 작으면 운영 비용이 이득보다 크다 → [Docker](/develop-wiki/backend/infra-devops/docker/) Compose, Cloud Run·ECS Fargate·Fly.io 같은 서버리스 컨테이너, PaaS. 가벼운 엣지·단일 노드는 k3s.

## 공식 문서
- [문서 홈](https://kubernetes.io/docs/home/) · [한국어 문서](https://kubernetes.io/ko/docs/home/) · [개념](https://kubernetes.io/docs/concepts/) · [kubectl 레퍼런스](https://kubernetes.io/docs/reference/kubectl/) · [버전 스큐·지원 정책](https://kubernetes.io/releases/) · [Gateway API](https://gateway-api.sigs.k8s.io/)

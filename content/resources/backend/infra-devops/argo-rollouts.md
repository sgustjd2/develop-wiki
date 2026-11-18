---
name: Argo Rollouts
url: https://argo-rollouts.readthedocs.io/
docs: https://argo-rollouts.readthedocs.io/en/stable/
repo: https://github.com/argoproj/argo-rollouts
stars: 3626
domain: backend
category: infra-devops
description: Kubernetes 에서 카나리·블루그린 배포와 메트릭 기반 자동 승격·롤백을 제공하는 컨트롤러. Deployment 대신 Rollout 리소스로 점진 배포할 때 쓴다.
pricing: oss
tags: [kubernetes, progressive-delivery, canary, blue-green, argo, cncf]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Argo Rollouts 는 Kubernetes 컨트롤러와 CRD 로, 기본 `Deployment` 의 롤링 업데이트가 못 하는 점진적 배포를 제공한다. `Rollout` 리소스에 카나리 단계(`setWeight`, `pause`)나 블루그린 전략을 선언하면, 컨트롤러가 ReplicaSet 을 나눠 트래픽 비율을 올리고, `AnalysisTemplate` 으로 Prometheus 같은 메트릭을 확인해 승격하거나 롤백한다. NGINX·Istio·Traefik 등 트래픽 라우터와 연동해 파드 수가 아니라 트래픽 가중치로 조절할 수 있다.

Argo 프로젝트(CNCF 졸업)의 일부이며 라이선스는 Apache-2.0, 최신은 **v1.10.2**(2026-11-04)다. GitOps 배포는 [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/) 가 맡고 Rollouts 가 배포 전략을 맡는 조합이 흔하다.

## 설치
```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# kubectl 플러그인 (선택, 시각화·승격 명령용)
brew install argoproj/tap/kubectl-argo-rollouts
kubectl argo rollouts version
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Rollout` | Deployment 를 대체하는 CRD. `spec.strategy` 에 `canary` 또는 `blueGreen` |
| 카나리 `steps` | `setWeight`, `pause`(무기한 또는 `duration`), `analysis` 등 단계 목록 |
| 블루그린 | `activeService` / `previewService` 로 새 버전을 미리 띄운 뒤 전환 |
| `AnalysisTemplate` / `AnalysisRun` | 메트릭 검증 정의 / 실행 인스턴스. 실패 시 자동 롤백 |
| `trafficRouting` | NGINX·Istio·ALB 등으로 트래픽 가중치 조절 |
| 승격·중단 | `promote`, `abort`, `retry` 명령 |

## 기본 사용법
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web
spec:
  replicas: 5
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: example.test/web:1.0.0
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: {}            # 수동 승격 대기
        - setWeight: 60
        - pause: { duration: 60 }
```
```bash
kubectl apply -f rollout.yaml
kubectl argo rollouts set image web web=example.test/web:1.1.0
kubectl argo rollouts get rollout web --watch    # 진행 상황 시각화
kubectl argo rollouts promote web                # 일시 중지 해제
kubectl argo rollouts abort web                  # 중단·롤백
```
처음 만든 Rollout 은 카나리 단계를 건너뛰고 100% 로 올라간다.

## 자주 쓰는 패턴
- **메트릭 기반 자동 롤백**: 카나리 단계 중 `analysis` 로 `AnalysisTemplate`(예: Prometheus 쿼리의 성공률 조건)을 실행한다.
- **트래픽 라우터 연동**: `strategy.canary.trafficRouting` 에 NGINX/Istio 등을 지정해 파드 수와 무관하게 가중치를 조절한다.
- **블루그린 사전 검증**: `previewService` 로 새 버전을 검증한 뒤 `promote` 로 전환한다.
- **Deployment 이전**: `workloadRef` 로 기존 Deployment 를 참조해 점진적으로 옮긴다.
- **대시보드**: `kubectl argo rollouts dashboard` 로 로컬 UI 를 띄운다.

## 언제 쓰나 / 피할 때
- 쓸 때: 위험한 릴리스를 일부 트래픽에 먼저 노출하고 메트릭으로 판단하고 싶은 Kubernetes 서비스.
- 피할 때(대안): 단순한 롤링 업데이트면 기본 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) Deployment 로 충분하다. 서비스 메시 전체 수준의 트래픽 관리가 필요하면 Flagger 같은 대안도 비교한다.

## 공식 문서
- [문서](https://argo-rollouts.readthedocs.io/en/stable/) · [시작하기](https://argo-rollouts.readthedocs.io/en/stable/getting-started/) · [설치](https://argo-rollouts.readthedocs.io/en/stable/installation/)

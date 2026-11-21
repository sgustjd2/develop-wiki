---
name: Argo CD
url: https://argo-cd.readthedocs.io
docs: https://argo-cd.readthedocs.io/en/stable/
repo: https://github.com/argoproj/argo-cd
stars: 24670
domain: backend
category: infra-devops
description: Git 저장소에 선언한 Kubernetes 매니페스트를 클러스터에 계속 동기화하는 GitOps 배포 도구. 배포 상태를 Git 기준으로 관리하고 드리프트를 감지할 때 쓴다.
pricing: oss
tags: [gitops, kubernetes, continuous-delivery, cncf, deployment]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Argo CD 는 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) 클러스터 안에서 동작하는 GitOps 컨트롤러다. Git 저장소(또는 Helm 차트 저장소·OCI 레지스트리)에 있는 매니페스트를 "원하는 상태"로 보고, 클러스터의 실제 상태와 비교해 차이(OutOfSync)를 보여 주거나 자동으로 맞춘다. CI 가 클러스터에 직접 `kubectl apply` 하는 push 방식 대신, 클러스터 안의 Argo CD 가 Git 을 읽어 오는 pull 방식이라 클러스터 자격 증명을 CI 에 둘 필요가 없다. CNCF 졸업 프로젝트(Argo 프로젝트), Apache-2.0. 2026-11 기준 최신 릴리스는 3.6.1.

## 설치
```bash
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# 운영에서는 stable 대신 v3.6.1 처럼 버전 태그로 고정

brew install argocd                                  # CLI
argocd admin initial-password -n argocd              # 초기 admin 비밀번호
kubectl port-forward svc/argocd-server -n argocd 8080:443
argocd login localhost:8080 --insecure
```
공식 Helm 차트(argo/argo-cd)로 설치하는 경우도 많다. 초기 비밀번호를 바꾼 뒤 `argocd-initial-admin-secret` 은 지운다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Application | "어느 저장소의 어떤 경로를 어느 클러스터·네임스페이스에 배포할지"를 정의한 CRD |
| Source | Git 경로(일반 YAML, Kustomize, [Helm](/develop-wiki/backend/infra-devops/helm/), Jsonnet) 또는 Helm 저장소 |
| Sync status | Git 과 클러스터가 같으면 Synced, 다르면 OutOfSync |
| Health status | 리소스 상태(Healthy, Progressing, Degraded …) |
| Sync policy | 수동 또는 automated(+ `prune`: Git 에서 지운 리소스 삭제, `selfHeal`: 수동 변경 되돌림) |
| AppProject | 허용할 저장소·대상 클러스터·리소스 종류를 묶는 권한 경계 |
| ApplicationSet | 템플릿 + 생성기(클러스터 목록, Git 디렉터리, PR 등)로 Application 을 대량 생성 |
| Sync wave / hook | 리소스 적용 순서, 동기화 전후 Job(마이그레이션 등) |

## 기본 사용법
Application 을 YAML 로 선언해 Git 에 함께 둔다.
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: todo-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/deploy.git
    targetRevision: main
    path: apps/todo-api/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: todo
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [CreateNamespace=true]
```
```bash
kubectl apply -n argocd -f todo-api-app.yaml
argocd app get todo-api
argocd app diff todo-api
argocd app sync todo-api        # 수동 동기화
argocd app history todo-api
```

## 자주 쓰는 패턴
- **앱 코드와 배포 저장소 분리**: CI 는 이미지를 빌드·푸시한 뒤 배포 저장소의 이미지 태그만 바꾸는 커밋(또는 PR)을 만든다. 실제 반영은 Argo CD 가 한다. 태그 갱신 자동화에는 Argo CD Image Updater 를 쓰기도 한다.
- **App of Apps / ApplicationSet**: 루트 Application 하나가 다른 Application 들을 관리하게 하거나, ApplicationSet 으로 클러스터·환경별 Application 을 생성한다.
- **환경별 오버레이**: Kustomize `overlays/dev|prod` 나 Helm values 파일을 경로로 나눠 같은 앱을 여러 환경에 배포한다.
- **selfHeal 과 수동 변경**: selfHeal 을 켜면 `kubectl edit` 같은 직접 변경이 되돌려진다. 긴급 대응 시에는 자동 동기화를 잠시 끈다.
- **알림**: Argo CD Notifications 로 동기화 실패·성공을 Slack 등으로 보낸다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 Kubernetes 클러스터·환경의 배포 상태를 Git 으로 감사·롤백하고 싶을 때, 드리프트 감지와 웹 UI 가 필요할 때.
- 피할 때(대안): Kubernetes 를 쓰지 않으면 해당 없음. CLI 중심의 가벼운 GitOps 를 원하면 Flux. 단계별 카나리·블루그린 배포는 Argo Rollouts 를 함께 쓴다. 클러스터가 하나이고 배포가 드물면 [GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/)에서 `helm upgrade` 로 충분할 수 있다.

## 공식 문서
- [문서 홈](https://argo-cd.readthedocs.io/en/stable/) · [시작하기](https://argo-cd.readthedocs.io/en/stable/getting_started/) · [선언적 설정](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/) · [자동 동기화](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/) · [ApplicationSet](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/)

---
name: Flux
url: https://fluxcd.io
docs: https://fluxcd.io/flux/
repo: https://github.com/fluxcd/flux2
stars: 8526
domain: backend
category: infra-devops
description: Git·OCI 저장소의 매니페스트를 Kubernetes 클러스터에 계속 맞춰 주는 CNCF 졸업 GitOps 도구. 컨트롤러 조합과 CLI 중심으로 지속적 배포(CD)를 구성할 때 쓴다.
pricing: oss
tags: [gitops, kubernetes, continuous-delivery, cncf, helm, kustomize]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Flux 는 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) 클러스터 안에서 동작하는 GitOps 컨트롤러 모음이다. **source-controller** 가 Git·Helm 저장소·OCI 레지스트리·S3 버킷에서 아티팩트를 가져오고, **kustomize-controller** 와 **helm-controller** 가 그것을 클러스터에 적용·조정(reconcile)한다. 알림(notification-controller), 이미지 태그 자동 갱신(image-reflector/automation-controller)도 별도 컨트롤러로 붙는다. 기능이 CRD 단위로 나뉘어 있어 필요한 것만 설치할 수 있다.

CNCF 졸업 프로젝트, Apache-2.0. 2026-11 기준 최신 릴리스는 v2.10.0(2026-10-26)으로, 컨트롤러별 object identity 정식화, 알림 API(`Alert`, `Provider`) v1 승격, `HelmRelease` 의 차트 소스로 `OCIRepository` 지원 등이 들어갔다. 지원 Kubernetes 는 최신 3개 마이너(1.35~1.37). 같은 GitOps 계열 [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/) 가 웹 UI 중심이라면 Flux 는 CLI·CRD 중심이다.

## 설치
```bash
brew install fluxcd/tap/flux       # CLI (또는 curl -s https://fluxcd.io/install.sh | sudo bash)
flux check --pre                   # 클러스터 호환성 점검

export GITHUB_TOKEN=<개인 액세스 토큰>
flux bootstrap github \
  --owner=my-org --repository=fleet-infra \
  --branch=main --path=clusters/prod
```
`bootstrap` 은 Flux 컨트롤러를 설치하고 그 매니페스트를 Git 저장소에 커밋해, 이후 Flux 자신도 GitOps 로 관리되게 한다. GitLab·Gitea·일반 Git 용 bootstrap 과 Flux Operator(`FluxInstance` CRD) 방식도 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| GitRepository / OCIRepository / HelmRepository / Bucket | 소스 정의. 주기적으로 가져와 아티팩트로 저장 |
| Kustomization (Flux CRD) | 소스의 경로를 kustomize build 후 적용. `prune`, `dependsOn`, `healthChecks` 지원 |
| HelmRelease | Helm 차트 설치·업그레이드를 선언, 실패 시 롤백·재시도 |
| Reconciliation | `interval` 마다 원하는 상태와 실제 상태를 비교해 맞춤 |
| Image automation | 레지스트리의 새 태그를 감지해 Git 매니페스트의 이미지 태그를 커밋 |
| Alert / Provider | 이벤트를 Slack·Teams·GitHub 커밋 상태 등으로 전송 |

## 기본 사용법
```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata: { name: apps, namespace: flux-system }
spec:
  interval: 1m
  url: https://github.com/my-org/apps
  ref: { branch: main }
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata: { name: todo-api, namespace: flux-system }
spec:
  interval: 10m
  sourceRef: { kind: GitRepository, name: apps }
  path: ./todo-api/overlays/prod
  prune: true
  wait: true
```
```bash
flux get kustomizations
flux reconcile kustomization todo-api --with-source   # 즉시 동기화
flux suspend kustomization todo-api                   # 긴급 시 일시 중지
flux logs --level=error
```

## 자주 쓰는 패턴
- **저장소 구조**: `clusters/<이름>/` 에 클러스터별 진입점, `infrastructure/` 와 `apps/` 를 별도 Kustomization 으로 두고 `dependsOn` 으로 순서를 잡는다.
- **환경별 오버레이**: [Kustomize](/develop-wiki/backend/infra-devops/kustomize/) `base/` + `overlays/` 또는 HelmRelease 의 `valuesFrom` 으로 차이를 표현한다.
- **시크릿**: SOPS(age·KMS)로 암호화한 Secret 을 Git 에 두고 Kustomization 의 `decryption` 으로 복호화한다.
- **OCI 아티팩트 배포**: CI 에서 `flux push artifact` 로 매니페스트를 OCI 레지스트리에 올리고 `OCIRepository` 로 받는다.
- **멀티테넌시**: 테넌트별 ServiceAccount 로 `serviceAccountName` 을 지정해 적용 권한을 제한한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 클러스터를 Git 으로 선언·감사하고 싶을 때, UI 보다 CLI·CRD·자동화를 선호할 때, Helm 차트와 Kustomize 를 함께 GitOps 로 관리할 때.
- 피할 때(대안): 배포 상태를 웹 UI 로 시각화하고 수동 동기화를 자주 쓰면 [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/). Kubernetes 를 쓰지 않으면 해당 없음. 단일 클러스터·드문 배포는 [GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/) 에서 `helm upgrade` 로 충분할 수 있다.
- 주의: v2.10 은 기본 RBAC·알림 API 에 breaking change 가 있어 업그레이드 절차 문서를 먼저 확인한다.

## 공식 문서
- [문서 홈](https://fluxcd.io/flux/) · [GitHub bootstrap](https://fluxcd.io/flux/installation/bootstrap/github/) · [GitHub 릴리스](https://github.com/fluxcd/flux2/releases)

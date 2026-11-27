---
name: Kustomize
url: https://kustomize.io
docs: https://kubectl.docs.kubernetes.io/references/kustomize/
repo: https://github.com/kubernetes-sigs/kustomize
stars: 12223
domain: backend
category: infra-devops
description: 템플릿 없이 기본 YAML 에 패치·오버레이를 겹쳐 환경별 Kubernetes 매니페스트를 만드는 도구. kubectl 에 내장돼 있어 dev·prod 차이를 순수 YAML 로 관리할 때 쓴다.
pricing: oss
tags: [kubernetes, manifests, overlay, patch, gitops, kubectl]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kustomize 는 Kubernetes SIG CLI 가 관리하는 매니페스트 커스터마이즈 도구다. 공통 YAML(**base**)을 그대로 두고, 환경별 **overlay** 에서 이미지 태그·레플리카 수·레이블·패치만 덧씌워 최종 매니페스트를 만든다. `{{ }}` 템플릿이 없어 결과물도 입력도 모두 유효한 Kubernetes YAML 이라는 점이 [Helm](/develop-wiki/backend/infra-devops/helm/) 과의 큰 차이다. `kubectl apply -k` 로 kubectl 에 내장돼 있고, [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/)·[Flux](/develop-wiki/backend/infra-devops/flux/) 도 Kustomize 디렉터리를 바로 배포한다.

Apache-2.0. 2026-11 기준 독립 CLI 최신 릴리스는 kustomize/v5.8.3(2026-10-08). kubectl 에 내장된 버전은 kubectl 버전에 따라 조금 늦을 수 있다(`kubectl version` 으로 확인).

## 설치
```bash
kubectl kustomize ./overlays/prod      # 별도 설치 없이 kubectl 내장 사용
brew install kustomize                 # 독립 CLI (최신 기능)
kustomize version
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| kustomization.yaml | 디렉터리의 진입점. 어떤 리소스를 읽고 무엇을 바꿀지 선언 |
| resources | 포함할 YAML 파일·디렉터리·원격 base |
| base / overlay | 공통 정의와 환경별 변형. overlay 가 base 를 resources 로 참조 |
| patches | 전략적 병합 패치 또는 JSON 6902 패치를 대상(target) 선택자로 적용 |
| images | 이미지 이름·태그·digest 일괄 교체 |
| configMapGenerator / secretGenerator | 파일·리터럴로 ConfigMap·Secret 생성. 내용 해시 접미사로 변경 시 롤링 재시작 유도 |
| namespace / namePrefix / labels | 모든 리소스에 공통 속성 부여 |
| components | 여러 overlay 에서 선택적으로 켜는 재사용 기능 묶음 |

## 기본 사용법
```text
app/
├── base/        (deployment.yaml, service.yaml, kustomization.yaml)
└── overlays/
    └── prod/    (kustomization.yaml, replicas.yaml)
```
`base/kustomization.yaml`:
```yaml
resources: [deployment.yaml, service.yaml]
labels:
  - pairs: { app: todo-api }
```
`overlays/prod/kustomization.yaml`:
```yaml
resources: [../../base]
namespace: todo-prod
images:
  - name: example/todo-api
    newTag: "1.4.2"
patches:
  - path: replicas.yaml          # spec.replicas: 4 를 담은 부분 Deployment
configMapGenerator:
  - name: todo-config
    literals: [LOG_LEVEL=info]
```
```bash
kubectl kustomize overlays/prod        # 결과 미리보기
kubectl diff -k overlays/prod          # 클러스터와 차이
kubectl apply -k overlays/prod
```

## 자주 쓰는 패턴
- **CI 에서 태그 갱신**: `kustomize edit set image example/todo-api=example/todo-api:${SHA}` 로 overlay 의 이미지 태그만 바꿔 커밋한다(GitOps).
- **인라인 패치**: 작은 변경은 `patches` 에 `patch: |-` 로 YAML 을 직접 쓰고 `target: { kind: Deployment, name: todo-api }` 로 대상을 지정한다.
- **Helm 차트 렌더링**: `helmCharts` 필드로 차트를 렌더한 뒤 패치한다(`kustomize build --enable-helm` 필요).
- **원격 base**: `resources` 에 `https://github.com/org/repo//path?ref=v1.2.0` 처럼 태그를 고정해 공유한다.
- **비교·검증**: 렌더 결과를 kubeconform 같은 검증 도구에 파이프로 넘겨 CI 에서 스키마 검사한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 자체 앱 매니페스트를 환경별로 조금씩 다르게 배포할 때, 템플릿 문법 없이 순수 YAML 을 리뷰하고 싶을 때, 서드파티 매니페스트를 포크 없이 수정할 때.
- 피할 때(대안): 많은 사용자가 값만 바꿔 설치하는 배포 패키지·버전 관리·롤백이 필요하면 [Helm](/develop-wiki/backend/infra-devops/helm/). 조건문·반복이 많은 생성 로직이면 [Pulumi](/develop-wiki/backend/infra-devops/pulumi/) 같은 범용 언어 IaC 나 cdk8s.
- 주의: 패치가 쌓이면 최종 결과를 추적하기 어려우므로 `kubectl kustomize` 출력 diff 를 PR 에 함께 보는 습관을 들인다.

## 공식 문서
- [레퍼런스](https://kubectl.docs.kubernetes.io/references/kustomize/) · [Kubernetes 공식 가이드](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/) · [GitHub 릴리스](https://github.com/kubernetes-sigs/kustomize/releases)

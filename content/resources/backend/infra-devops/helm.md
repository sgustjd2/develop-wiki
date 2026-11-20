---
name: Helm
url: https://helm.sh
docs: https://helm.sh/docs/
repo: https://github.com/helm/helm
stars: 30458
domain: backend
category: infra-devops
description: Kubernetes 매니페스트를 템플릿 차트로 묶어 설치·업그레이드·롤백하는 패키지 매니저. 서드파티 소프트웨어 설치와 자체 서비스 배포 템플릿에 쓴다.
pricing: oss
tags: [kubernetes, package-manager, chart, template, cncf]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Helm 은 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) 리소스 YAML 을 Go 템플릿으로 만든 **차트(chart)** 로 묶고, 값(values)만 바꿔 여러 환경에 설치하게 해 주는 패키지 매니저다. 설치된 차트 인스턴스를 **릴리스(release)** 로 추적해 업그레이드·롤백·삭제를 한 명령으로 처리한다. CNCF 졸업 프로젝트, Apache-2.0.

2026-11 기준 최신은 **Helm 4.3.2**. Helm 3 도 3.22.x 로 패치가 계속 나온다. Helm 4 의 주요 변화:
- 새 설치는 server-side apply 가 기본(Helm 3 에서 올라온 릴리스는 기존 방식 유지)
- 플러그인 시스템 재설계(WebAssembly 런타임 선택 가능), post-renderer 도 플러그인으로 지정
- OCI 차트를 digest 로 설치, kstatus 기반 상태 대기
- 플래그 이름 변경: `--atomic` → `--rollback-on-failure`, `--force` → `--force-replace` (옛 이름은 경고와 함께 동작)

## 설치
```bash
brew install helm
# 또는 공식 스크립트 (Helm 4)
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh && ./get_helm.sh
helm version
```
Homebrew·apt 패키지는 커뮤니티 유지 패키지다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Chart | `Chart.yaml`, `values.yaml`, `templates/` 로 이루어진 패키지 |
| Values | 템플릿에 주입하는 설정. `-f values-prod.yaml`, `--set key=val` 로 덮어씀 |
| Release | 클러스터에 설치된 차트 인스턴스. 리비전별 이력이 Secret 으로 저장된다 |
| Repository / OCI registry | 차트 배포처. 최근에는 `oci://` 레지스트리(GHCR, ECR, Docker Hub) 사용이 일반적 |
| Dependencies | `Chart.yaml` 의 `dependencies` 로 하위 차트(예: DB) 포함 |
| Hooks | 설치·업그레이드 전후에 Job(마이그레이션 등) 실행 |

## 기본 사용법
서드파티 차트 설치(OCI 레지스트리, cert-manager 공식 문서의 방식).
```bash
helm install cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.21.3 --namespace cert-manager --create-namespace \
  --set crds.enabled=true
helm list -A
helm history cert-manager -n cert-manager
helm rollback cert-manager 1 -n cert-manager
helm uninstall cert-manager -n cert-manager
```
자체 차트 만들기.
```bash
helm create todo-api        # 기본 골격 생성
helm lint todo-api
helm template todo-api ./todo-api -f values-prod.yaml   # 렌더링 결과만 확인
helm upgrade --install todo-api ./todo-api -n app --create-namespace \
  -f values-prod.yaml --set image.tag=0.2 --rollback-on-failure --wait
```
템플릿 일부(`templates/deployment.yaml`).
```yaml
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          {{- with .Values.resources }}
          resources: {{- toYaml . | nindent 12 }}
          {{- end }}
```

## 자주 쓰는 패턴
- **`helm upgrade --install`**: 설치 여부와 관계없이 같은 명령으로 배포해 CI 스크립트를 단순화한다.
- **환경별 values 파일**: `values.yaml`(기본) + `values-staging.yaml` / `values-prod.yaml` 을 겹쳐 적용한다.
- **변경 미리보기**: `helm template` 이나 helm-diff 플러그인으로 적용 전 차이를 확인한다.
- **차트 배포**: `helm package ./todo-api` → `helm push todo-api-0.1.0.tgz oci://ghcr.io/example/charts`.
- **GitOps 연동**: [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/) Application 의 소스로 Helm 차트를 지정하면 렌더링은 Argo CD 가 하고 Git 이 기준이 된다.

## 언제 쓰나 / 피할 때
- 쓸 때: 공개 차트로 배포되는 소프트웨어(인그레스 컨트롤러, cert-manager, 모니터링 스택) 설치, 여러 환경·여러 서비스에 같은 템플릿을 재사용할 때.
- 피할 때(대안): 템플릿 로직이 거의 없고 환경별 패치만 필요하면 Kustomize(`kubectl apply -k`)가 더 단순하다. 타입이 있는 언어로 매니페스트를 생성하고 싶으면 cdk8s·Pulumi.

## 공식 문서
- [문서 홈](https://helm.sh/docs/) · [설치](https://helm.sh/docs/intro/install/) · [차트 템플릿 가이드](https://helm.sh/docs/chart_template_guide/) · [Helm 4 개요](https://helm.sh/docs/overview/) · [한국어 문서](https://helm.sh/ko/docs/)

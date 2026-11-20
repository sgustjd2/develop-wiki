---
name: GitHub Actions
url: https://github.com/features/actions
docs: https://docs.github.com/en/actions
repo: https://github.com/actions/runner
stars: 6403
domain: backend
category: infra-devops
description: GitHub 저장소 이벤트로 YAML 워크플로를 실행하는 CI/CD 서비스. 테스트·빌드·배포 자동화에 쓰며, 공개 저장소는 무료이고 실행기(runner)는 MIT 오픈소스다.
pricing: freemium
tags: [ci-cd, workflow, github, automation, runner]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GitHub Actions 는 push·pull request·태그·일정(cron)·수동 실행 같은 이벤트가 발생하면 `.github/workflows/*.yml` 에 정의한 작업을 실행하는 GitHub 내장 CI/CD 서비스다. 단계마다 셸 명령을 쓰거나 Marketplace 의 재사용 **액션**(`uses:`)을 불러 쓴다. 서비스 자체는 GitHub 이 운영하는 SaaS 이고, 작업을 실제로 실행하는 에이전트 [actions/runner](https://github.com/actions/runner)는 MIT 라이선스로 공개되어 자체 서버에 설치할 수 있다(2026-11 기준 v2.338.2).

요금(공식 billing 문서 기준):
- 공개 저장소에서 표준 GitHub 호스팅 러너는 무료.
- 비공개 저장소는 플랜별 포함 사용량이 있다. GitHub Free 는 월 $12 상당의 컴퓨트(표준 Linux 기준 약 2,000분), 아티팩트 저장 500MB, 저장소당 캐시 10GB.
- 자체 호스팅 러너는 포함 사용량을 차감하지 않는다.

한국어 공식 문서(docs.github.com/ko)에 빠른 시작과 주요 가이드가 번역돼 있다.

## 설치
설치할 것은 없다. 저장소에 워크플로 파일을 커밋하면 동작한다. 로컬에서 워크플로를 시험하려면 커뮤니티 도구 `act`, 문법 검사는 `actionlint` 를 쓴다. 자체 호스팅 러너는 저장소 Settings → Actions → Runners 에서 안내하는 명령으로 등록하고, Kubernetes 에서는 Actions Runner Controller(ARC)로 운영한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Workflow | `.github/workflows/` 아래 YAML 파일 하나. `on:` 으로 트리거 지정 |
| Job | 같은 러너에서 실행되는 단계 묶음. 기본 병렬, `needs:` 로 순서 지정 |
| Step | `run:`(셸 명령) 또는 `uses:`(액션) 한 개 |
| Action | 재사용 단위. JavaScript·Docker·composite 형식. `owner/repo@버전` 으로 참조 |
| Runner | 작업 실행 머신. GitHub 호스팅(`ubuntu-latest` 등) 또는 자체 호스팅 |
| Matrix | 언어 버전·OS 조합을 자동으로 펼쳐 여러 job 생성 |
| Secrets / Variables | 저장소·환경·조직 단위 비밀값과 일반 변수 (`${{ secrets.X }}`) |
| Environment | `production` 등 배포 대상. 승인자·보호 규칙·전용 시크릿 설정 |
| `GITHUB_TOKEN` / OIDC | 자동 발급 토큰(`permissions:` 로 범위 제한) / 클라우드에 키 없이 인증 |
| Reusable workflow | `workflow_call` 로 다른 워크플로를 함수처럼 호출 |

## 기본 사용법
Node.js 프로젝트를 여러 버전으로 테스트하는 CI.
```yaml
# .github/workflows/ci.yml
name: ci
on:
  push: { branches: [main] }
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [22, 24]
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
```
main 에 머지되면 컨테이너 이미지를 GHCR 에 올리는 job.
```yaml
  image:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v7
      - uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v7
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

## 자주 쓰는 패턴
- **최소 권한**: 워크플로 최상단에 `permissions: contents: read` 를 두고 필요한 job 에서만 넓힌다.
- **액션 버전 고정**: 서드파티 액션은 태그 대신 커밋 SHA 로 고정해 공급망 공격 위험을 줄인다.
- **OIDC 배포**: `permissions: id-token: write` 와 클라우드의 OIDC 신뢰 설정으로 장기 액세스 키 없이 AWS·GCP·Azure 에 배포한다.
- **캐시**: `setup-*` 액션의 `cache:` 옵션이나 `actions/cache` 로 의존성 설치 시간을 줄인다.
- **동시 실행 제어**: `concurrency: { group: deploy-${{ github.ref }}, cancel-in-progress: true }` 로 중복 배포를 막는다.
- **IaC 연동**: PR 에서 [Terraform](/develop-wiki/backend/infra-devops/terraform/)/[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/) plan 을 실행해 결과를 코멘트로 남긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 코드가 GitHub 에 있고 별도 CI 서버 운영 없이 테스트·빌드·릴리스를 자동화하고 싶을 때, 공개 오픈소스 프로젝트.
- 피할 때(대안): GitLab 을 쓰면 GitLab CI/CD, 자체 호스팅 CI 서버가 필요하면 Jenkins·Woodpecker CI, Kubernetes 클러스터 상태를 Git 과 맞추는 배포는 [Argo CD](/develop-wiki/backend/infra-devops/argo-cd/) 같은 GitOps 도구가 더 적합하다. 비공개 저장소에서 빌드 시간이 길면 요금과 자체 호스팅 러너를 비교한다.

## 공식 문서
- [문서 홈](https://docs.github.com/en/actions) · [한국어 빠른 시작](https://docs.github.com/ko/actions/get-started/quickstart) · [워크플로 문법](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) · [요금](https://docs.github.com/en/billing/concepts/product-billing/github-actions) · [보안 강화 가이드](https://docs.github.com/en/actions/reference/security/secure-use) · [actions/runner](https://github.com/actions/runner)

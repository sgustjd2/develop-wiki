---
name: OpenTofu
url: https://opentofu.org
docs: https://opentofu.org/docs/
repo: https://github.com/opentofu/opentofu
stars: 30967
domain: backend
category: infra-devops
description: Terraform 1.5 의 MPL-2.0 코드에서 갈라진 오픈소스 IaC 도구. HCL·provider 를 그대로 쓰면서 오픈소스 라이선스가 필요할 때 쓴다. CNCF Sandbox.
pricing: oss
tags: [iac, hcl, terraform-fork, cncf, provisioning]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenTofu 는 HashiCorp 가 [Terraform](/develop-wiki/backend/infra-devops/terraform/) 라이선스를 BSL 1.1 로 바꾼 뒤(1.6 부터), 마지막 MPL 버전을 기반으로 Linux Foundation 산하에서 만든 포크다. 2025-04 CNCF Sandbox 프로젝트로 채택됐고 라이선스는 MPL-2.0 이다. 2026-11 기준 최신 릴리스는 1.13.9(1.13.x 와 1.12.x 문서가 유지된다). CLI 명령은 `tofu` 로, `terraform` 명령을 대부분 그대로 대체한다.

HCL 문법, provider 프로토콜, state 형식이 호환되어 기존 Terraform 구성을 옮기기 쉽다. provider·module 은 OpenTofu Registry(registry.opentofu.org)에서 받는다. 포크 이후 독자 기능도 생겼다.
- **state·plan 암호화**: 클라이언트 측에서 state 파일을 암호화(pbkdf2, AWS KMS, GCP KMS, Azure Key Vault, OpenBao 등 키 제공자).
- **provider `for_each`**: 리전·계정마다 provider 설정을 반복 생성.
- **OCI 레지스트리**: provider·module 을 OCI 레지스트리에서 배포·설치.

## 설치
```bash
brew install opentofu          # Homebrew core
tofu version
```
deb/rpm 저장소, Snap, Windows, 독립 실행 스크립트 설치도 공식 문서에 있다. 1.10 부터 공식 컨테이너 이미지를 그대로 실행하는 방식은 지원하지 않고, `ghcr.io/opentofu/opentofu:minimal` 에서 바이너리를 복사하는 멀티 스테이지 빌드를 권한다.

## 핵심 개념
Terraform 과 같다(provider, resource, data source, variable, output, module, state, backend). 차이 나는 부분만 정리한다.

| 개념 | 설명 |
| --- | --- |
| `tofu` CLI | `init`, `plan`, `apply`, `import`, `state` 등 Terraform 과 같은 하위 명령 |
| Registry | 기본 주소가 registry.opentofu.org. `hashicorp/aws` 같은 주소는 그대로 동작 |
| `encryption` 블록 | `terraform {}` 안에서 key_provider → method → state/plan 순으로 연결 |
| `.tofu` 파일 | 같은 이름의 `.tf` 보다 우선 적용돼, OpenTofu 전용 설정을 분리할 수 있다 |
| Early evaluation | backend·module source·encryption 설정에 변수·local 을 쓸 수 있다 |

## 기본 사용법
state 를 암호화하는 최소 구성.
```hcl
variable "state_passphrase" {
  type      = string
  sensitive = true
}

terraform {
  encryption {
    key_provider "pbkdf2" "main" {
      passphrase = var.state_passphrase   # 16자 이상
    }
    method "aes_gcm" "main" {
      keys = key_provider.pbkdf2.main
    }
    state {
      method   = method.aes_gcm.main
      enforced = true                     # 암호화 없이 쓰는 것을 막음
    }
  }
}
```
```bash
export TF_VAR_state_passphrase='...'
tofu init
tofu plan -out tfplan
tofu apply tfplan
```
기존 평문 state 를 암호화로 옮길 때는 `method "unencrypted"` 를 `fallback` 으로 두고 한 번 apply 한 뒤 fallback 을 지운다.

## 자주 쓰는 패턴
- **Terraform 에서 이전**: 지원 버전 범위 안의 Terraform 구성이면 `terraform` → `tofu` 로 명령만 바꾸고 `tofu init` 으로 provider 를 다시 받는다. 버전별 이전 절차는 공식 Migrating 가이드를 따른다.
- **멀티 리전 provider**: `provider "aws" { for_each = var.regions; alias = "by_region"; region = each.value }` 처럼 반복 정의.
- **CI 실행**: `opentofu/setup-opentofu` 액션으로 [GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/)에서 plan/apply 를 돌린다.
- **TACOS 연동**: Spacelift·env0·Scalr·Atlantis 같은 IaC 자동화 도구가 OpenTofu 를 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: IaC 도구에 OSI 오픈소스 라이선스가 필요할 때, state 암호화·provider 반복 같은 기능이 필요할 때, Terraform 기반 서비스를 직접 제공할 때.
- 피할 때(대안): HCP Terraform·Terraform Enterprise 와 긴밀히 묶여 있거나, 1.6 이후 Terraform 에만 생긴 기능에 의존한다면 [Terraform](/develop-wiki/backend/infra-devops/terraform/) 을 유지한다. 범용 언어로 쓰고 싶으면 Pulumi.

## 공식 문서
- [문서 홈](https://opentofu.org/docs/) · [설치](https://opentofu.org/docs/intro/install/) · [Terraform 에서 이전](https://opentofu.org/docs/intro/migration/) · [State 암호화](https://opentofu.org/docs/language/state/encryption/) · [OCI 레지스트리](https://opentofu.org/docs/cli/oci_registries/) · [CNCF 프로젝트 페이지](https://www.cncf.io/projects/opentofu/)

---
name: Terraform
url: https://developer.hashicorp.com/terraform
docs: https://developer.hashicorp.com/terraform/docs
repo: https://github.com/hashicorp/terraform
stars: 50311
domain: backend
category: infra-devops
description: HCL 로 클라우드·SaaS 인프라를 선언하고 plan·apply 로 변경하는 IaC 도구. 1.6 부터 BSL 1.1(IBM 소유)이며 MPL-2.0 포크로 OpenTofu 가 있다.
pricing: source-available
tags: [iac, hcl, hashicorp, cloud, provisioning]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Terraform 은 인프라(VPC, DB, DNS, IAM, SaaS 설정 등)를 HCL 코드로 선언하고, 현재 상태와 비교한 **실행 계획(plan)** 을 보여 준 뒤 **적용(apply)** 하는 Infrastructure as Code 도구다. 클라우드별 API 는 **provider** 플러그인이 담당해 AWS·GCP·Azure·Kubernetes·GitHub·Cloudflare 등 수천 개 서비스를 같은 방식으로 다룬다. 2026-11 기준 최신 릴리스는 1.17.2.

## 라이선스
- 1.5.x 까지는 MPL-2.0, **1.6.0 부터 Business Source License 1.1**. 저장소 LICENSE 의 라이선서는 IBM(HashiCorp 인수). 각 버전은 공개 4년 뒤 MPL-2.0 으로 전환된다.
- 추가 사용 허가: 사내 운영 등 프로덕션 사용은 가능하지만, Terraform 을 IBM 의 유료 제품과 경쟁하는 호스팅·임베디드 형태로 제3자에게 제공하는 것은 허용되지 않는다. 따라서 OSI 오픈소스가 아니다.
- 라이선스 변경에 대응해 Linux Foundation 산하에서 만든 포크가 [OpenTofu](/develop-wiki/backend/infra-devops/opentofu/)(MPL-2.0, CNCF Sandbox)다. provider 와 HCL 문법 대부분이 호환된다.
- 관리형 실행 환경 HCP Terraform(구 Terraform Cloud)은 별도 유료 서비스(무료 등급 있음).

## 설치
```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform version
```
Linux 는 HashiCorp apt/yum 저장소, 또는 버전 관리 도구(tfenv, mise, asdf)로 설치한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Provider | 대상 API 를 다루는 플러그인. `required_providers` 로 버전 고정 |
| Resource / Data source | 만들고 관리하는 객체 / 읽기만 하는 기존 객체 |
| Variable / Output / Local | 입력값 / 다른 구성에 넘길 결과 / 내부 계산값 |
| State | 코드와 실제 리소스의 대응표. 팀 작업 시 원격 backend(S3, GCS, HCP 등)에 잠금과 함께 저장 |
| Module | 재사용 가능한 리소스 묶음. Registry 나 Git 에서 가져온다 |
| plan / apply | 변경 계획 확인 / 적용. `-out` 으로 저장한 계획만 적용하는 것이 안전 |
| Workspace | 같은 구성으로 상태를 여러 개 분리(환경 분리에는 디렉터리 분리를 더 많이 씀) |
| import / moved | 기존 리소스를 상태로 가져오기 / 리팩터링 시 주소 변경 기록 |

## 기본 사용법
```hcl
# main.tf
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
  backend "s3" {
    bucket       = "example-tf-state"
    key          = "todo/prod.tfstate"
    region       = "ap-northeast-2"
    use_lockfile = true   # S3 자체 잠금 (DynamoDB 불필요)
  }
}

provider "aws" { region = "ap-northeast-2" }

variable "env" { type = string }

resource "aws_s3_bucket" "uploads" {
  bucket = "todo-uploads-${var.env}"
  tags   = { env = var.env }
}

output "uploads_bucket" { value = aws_s3_bucket.uploads.bucket }
```
```bash
terraform init
terraform fmt && terraform validate
terraform plan -var env=prod -out tfplan
terraform apply tfplan
terraform output uploads_bucket
```

## 자주 쓰는 패턴
- **원격 state + 잠금**: 로컬 `terraform.tfstate` 를 Git 에 올리지 않는다. state 에는 비밀값이 평문으로 남을 수 있으니 저장소 접근 권한을 제한한다.
- **PR 기반 워크플로**: PR 에서 `plan` 결과를 코멘트로 남기고, 머지 후 `apply` 한다([GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/), Atlantis, HCP Terraform).
- **모듈화**: 네트워크·DB·서비스 단위로 모듈을 나누고 환경별 루트 디렉터리에서 호출한다.
- **기존 리소스 편입**: `import` 블록으로 콘솔에서 만든 리소스를 코드로 가져온다.
- **lock 파일 커밋**: `.terraform.lock.hcl` 을 커밋해 provider 버전을 팀 전체에서 고정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 클라우드·SaaS 를 한 도구로 관리할 때, 인프라 변경을 리뷰·이력 관리하고 싶을 때, HCP Terraform 등 HashiCorp 상용 제품을 함께 쓸 때.
- 피할 때(대안): 오픈소스 라이선스가 필요하거나 Terraform 기반 서비스를 제3자에게 제공한다면 [OpenTofu](/develop-wiki/backend/infra-devops/opentofu/). 범용 프로그래밍 언어로 인프라를 쓰고 싶으면 Pulumi·AWS CDK. Kubernetes 안의 리소스는 [Helm](/develop-wiki/backend/infra-devops/helm/)·매니페스트가 더 자연스럽다.

## 공식 문서
- [문서 홈](https://developer.hashicorp.com/terraform/docs) · [설치](https://developer.hashicorp.com/terraform/install) · [언어 레퍼런스](https://developer.hashicorp.com/terraform/language) · [CLI](https://developer.hashicorp.com/terraform/cli) · [Registry](https://registry.terraform.io/) · [LICENSE](https://github.com/hashicorp/terraform/blob/main/LICENSE)

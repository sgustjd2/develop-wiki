---
name: Pulumi
url: https://www.pulumi.com
docs: https://www.pulumi.com/docs/
repo: https://github.com/pulumi/pulumi
stars: 25936
domain: backend
category: infra-devops
description: TypeScript·Python·Go·C#·Java 같은 범용 언어로 클라우드 인프라를 선언하는 IaC 도구. 반복문·함수·테스트 등 프로그래밍 언어 기능으로 인프라를 다루고 싶을 때 쓴다.
pricing: oss
tags: [iac, infrastructure-as-code, cloud, aws, kubernetes, terraform-alternative]
languages: [typescript, python, go, csharp, java]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Pulumi 는 인프라를 HCL 같은 전용 DSL 대신 일반 프로그래밍 언어로 작성하는 Infrastructure as Code 도구다. 프로그램을 실행하면 생성할 리소스 그래프가 만들어지고, Pulumi 엔진이 이전 상태(state)와 비교해 생성·변경·삭제 계획을 세운 뒤 클라우드 API 를 호출한다. AWS·Azure·GCP·Kubernetes·Cloudflare 등 provider 를 제공하며, Terraform provider 를 연결(bridge)해 쓸 수도 있다. YAML 로 쓰는 방식도 지원한다.

CLI·엔진·SDK 는 Apache-2.0 오픈소스이고, 상태 저장·팀 협업·정책 기능의 **Pulumi Cloud** 는 무료 티어가 있는 유료 SaaS 다. 상태는 S3·GCS·Azure Blob·로컬 파일 같은 자체 백엔드에도 둘 수 있다. 2026-11 기준 최신 릴리스는 v3.276.0(2026-11-12). [SST](/develop-wiki/cloud/serverless/sst/) 는 내부 엔진으로 Pulumi 를 쓴다. 선언형 HCL 쪽 대안은 [Terraform](/develop-wiki/backend/infra-devops/terraform/)·[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/).

## 설치
```bash
brew install pulumi/tap/pulumi          # macOS
curl -fsSL https://get.pulumi.com | sh  # Linux/macOS
pulumi version

pulumi login                            # Pulumi Cloud
pulumi login s3://my-state-bucket       # 또는 자체 백엔드
pulumi login --local                    # 로컬 파일(~/.pulumi)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project | `Pulumi.yaml` 이 있는 디렉터리. 이름·런타임(nodejs, python, go, dotnet, java, yaml) 지정 |
| Stack | 같은 프로그램의 독립 인스턴스(dev, prod). 스택마다 설정과 상태가 따로 |
| Resource | 클라우드 객체 하나. `new aws.s3.Bucket(...)` |
| Output / Input | 배포 후에야 알 수 있는 값(Output)과 그 값을 받는 인자. `.apply()`·`pulumi.interpolate` 로 다룸 |
| Config / Secret | `pulumi config set [--secret]` 로 스택별 값 저장, 시크릿은 암호화 |
| Component Resource | 여러 리소스를 묶은 재사용 단위 |
| Automation API | CLI 없이 코드에서 Pulumi 엔진을 호출해 배포를 자동화 |

## 기본 사용법
```bash
mkdir infra && cd infra
pulumi new aws-typescript       # 템플릿으로 프로젝트·dev 스택 생성
pulumi config set aws:region ap-northeast-2
pulumi preview                  # 변경 계획
pulumi up                       # 적용
pulumi stack output bucketName
pulumi destroy                  # 정리
```
`index.ts`:
```ts
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("assets", {
  tags: { env: "dev" },
});

const names = ["api", "worker"].map(
  (n) => new aws.ecr.Repository(`${n}-repo`, { forceDelete: true }),
);

export const bucketName = bucket.id;
export const repoUrls = names.map((r) => r.repositoryUrl);
```

## 자주 쓰는 패턴
- **스택별 설정**: `Pulumi.dev.yaml`, `Pulumi.prod.yaml` 에 리전·인스턴스 크기를 두고 코드에서 `new pulumi.Config().require("size")` 로 읽는다.
- **스택 참조**: `new pulumi.StackReference("org/network/prod")` 로 다른 스택의 Output(VPC id 등)을 가져와 레이어를 나눈다.
- **기존 리소스 가져오기**: `pulumi import` 로 수동 생성한 리소스를 상태에 편입하고 코드를 생성한다.
- **단위 테스트**: 언어 고유 테스트 프레임워크(Jest, pytest, Go test)와 Pulumi mocks 로 리소스 속성을 검증한다.
- **CI**: GitHub Actions 등에서 PR 에는 `pulumi preview`, main 머지 시 `pulumi up --yes`.

## 언제 쓰나 / 피할 때
- 쓸 때: 팀이 이미 TypeScript·Python·Go 에 익숙하고 인프라에도 추상화·테스트·IDE 자동 완성을 쓰고 싶을 때, 앱 코드와 같은 언어로 인프라를 관리하고 싶을 때.
- 피할 때(대안): 선언형 DSL 로 표준화·리뷰를 단순하게 하고 싶거나 Terraform 모듈 자산이 많으면 [Terraform](/develop-wiki/backend/infra-devops/terraform/)/[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/). Kubernetes 매니페스트만 다룬다면 [Helm](/develop-wiki/backend/infra-devops/helm/)·[Kustomize](/develop-wiki/backend/infra-devops/kustomize/) 로 충분하다.
- 주의: 범용 언어라 조건·반복이 과해지면 리뷰가 어려워진다. 상태 백엔드 선택(Cloud vs 자체 버킷)을 처음에 정해 둔다.

## 공식 문서
- [문서 홈](https://www.pulumi.com/docs/) · [시작하기](https://www.pulumi.com/docs/iac/get-started/) · [GitHub 릴리스](https://github.com/pulumi/pulumi/releases)

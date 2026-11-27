---
name: Amazon Web Services (AWS)
url: https://aws.amazon.com/
docs: https://docs.aws.amazon.com/
repo: https://github.com/aws/aws-cli
stars: 17390
domain: cloud
category: hyperscaler
description: Amazon 의 퍼블릭 클라우드. EC2·S3·RDS·IAM·VPC 를 중심으로 수백 개 관리형 서비스를 리전 단위로 제공하며, 서비스 선택지와 레퍼런스가 가장 많은 범용 인프라가 필요할 때 쓴다.
pricing: freemium
tags: [aws, cloud, iaas, ec2, s3, iam, vpc]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
AWS 는 가상 서버·스토리지·DB·네트워크부터 서버리스·AI 까지 관리형 서비스를 API 로 제공하는 퍼블릭 클라우드다. 모든 리소스는 **리전**(예: 서울 `ap-northeast-2`) 안의 여러 **가용 영역(AZ)** 에 만들어지고, 접근은 **IAM** 정책으로 통제한다. 콘솔·CLI·SDK·IaC(CloudFormation, CDK, [Terraform](/develop-wiki/backend/infra-devops/terraform/))가 모두 같은 API 를 호출한다. Google Cloud·Azure 와 같은 하이퍼스케일러이며, 서비스 수와 서드파티 자료가 가장 많은 편이다.

## 설치 (AWS CLI v2)
```bash
# macOS / Linux — 공식 설치 스크립트 (현재 사용자에 설치)
curl -fsSL https://awscli.amazonaws.com/v2/install.sh | bash
aws --version

# 장기 액세스 키 대신 IAM Identity Center(SSO) 프로필 권장
aws configure sso          # 시작 URL·리전·계정·역할 선택 → ~/.aws/config 에 프로필 생성
aws sso login --profile dev
```
Windows 는 MSI 설치 관리자, macOS 는 `.pkg` 설치도 가능하다.

## 핵심 서비스 지도
| 영역 | 서비스 | 한 줄 설명 |
| --- | --- | --- |
| 컴퓨팅 | **EC2** | 가상 머신. 인스턴스 타입·AMI·키 페어·보안 그룹으로 구성 |
| 컴퓨팅 | Lambda / ECS·Fargate / EKS | 함수 실행 / 컨테이너 실행 / 관리형 Kubernetes |
| 스토리지 | **S3** | 객체 스토리지. 버킷 + 키, 정적 파일·백업·데이터 레이크 |
| 스토리지 | EBS / EFS | EC2 블록 볼륨 / 공유 파일 시스템 |
| DB | **RDS**·Aurora | 관리형 PostgreSQL·MySQL 등 관계형 DB |
| DB | DynamoDB / ElastiCache | 키-값·문서 NoSQL / Redis·Valkey·Memcached 호환 캐시 |
| 보안 | **IAM**·IAM Identity Center | 사용자·역할·정책 / 사람용 SSO |
| 네트워크 | **VPC** | 서브넷·라우팅 테이블·인터넷/NAT 게이트웨이·보안 그룹 |
| 네트워크 | Route 53 / CloudFront / ELB | DNS / CDN / 로드 밸런서 |
| 운영 | CloudWatch / CloudTrail | 메트릭·로그·알람 / API 호출 감사 기록 |

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 계정·Organizations | 계정이 과금·격리 단위. 운영/개발을 계정으로 나누고 Organizations 로 묶는다 |
| 리전·AZ | 리전은 지리적 위치, AZ 는 리전 내 독립 데이터센터 묶음. 다중 AZ 배치가 고가용성의 기본 |
| IAM 정책 | JSON 으로 `Effect`·`Action`·`Resource`·`Condition` 지정. 최소 권한 원칙 |
| 역할(Role) | 임시 자격 증명을 발급받는 정체성. EC2·Lambda·CI 는 액세스 키 대신 역할을 쓴다 |
| 자격 증명 체인 | SDK·CLI 는 환경 변수 → 프로필(SSO 포함) → 컨테이너/인스턴스 역할 순으로 자격 증명을 찾는다 |
| 태그 | 비용 배분·자동화·권한 조건에 쓰는 키-값 메타데이터 |

## 기본 사용법
```bash
export AWS_PROFILE=dev                  # SSO 로 만든 프로필
aws sts get-caller-identity             # 현재 누구로 호출하는지 확인

aws s3 mb "s3://$BUCKET_NAME" --region ap-northeast-2
aws s3 cp ./dist "s3://$BUCKET_NAME/site/" --recursive
aws ec2 describe-instances \
  --query 'Reservations[].Instances[].[InstanceId,State.Name]' --output table
```
```ts
// npm install @aws-sdk/client-s3   (AWS SDK for JavaScript v3)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 자격 증명은 코드에 넣지 않는다 — 기본 자격 증명 체인(AWS_PROFILE, 역할 등)을 사용
const s3 = new S3Client({ region: process.env.AWS_REGION });

await s3.send(new PutObjectCommand({
  Bucket: process.env.BUCKET_NAME,
  Key: "hello.txt",
  Body: "hello from sdk v3",
}));
```

## 자주 쓰는 패턴
- **계정 분리 + SSO**: Organizations 로 prod/dev 계정을 나누고, 사람은 IAM Identity Center 로 역할을 맡아(assume) 접근한다. 장기 액세스 키는 만들지 않는다.
- **CI 는 OIDC**: [GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/) 에서 OIDC 로 역할을 맡아 배포한다(시크릿에 키 저장 불필요).
- **3계층 VPC**: 퍼블릭 서브넷(ALB) / 프라이빗 서브넷(앱) / 격리 서브넷(RDS)을 AZ 마다 두고 보안 그룹으로 계층 간 포트만 연다.
- **IaC 로만 변경**: 콘솔은 조회용, 변경은 CloudFormation·CDK·Terraform/[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/)로.
- **비용 가드레일**: AWS Budgets 알림과 비용 배분 태그를 계정 생성 직후 설정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 관리형 서비스 선택지가 많이 필요할 때, 엔터프라이즈 규정 준수·세밀한 IAM 통제가 필요할 때, 레퍼런스·인력 풀이 중요한 조직.
- 피할 때(대안): 프론트엔드·풀스택 웹앱을 빠르게 올리는 것이 목적이면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/)·[Render](/develop-wiki/cloud/paas-edge/render/) 같은 PaaS 가 운영 부담이 적다. 데이터 분석·BigQuery 중심이면 [Google Cloud](/develop-wiki/cloud/hyperscaler/google-cloud/), Microsoft 365·Entra ID 중심 조직이면 [Azure](/develop-wiki/cloud/hyperscaler/azure/), 국내 공공·데이터 주권 요건이면 [NAVER Cloud Platform](/develop-wiki/cloud/hyperscaler/naver-cloud-platform/)을 검토한다.
- 요금: 프리 티어와 종량제가 서비스마다 다르다. 수치는 [요금 페이지](https://aws.amazon.com/pricing/)와 계산기로 직접 확인한다.

## 공식 문서
- [문서 홈](https://docs.aws.amazon.com/) · [CLI 설치](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) · [CLI SSO 설정](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) · [SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/) · [리전 목록](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html) · [Well-Architected](/develop-wiki/backend/learning/aws-well-architected/)

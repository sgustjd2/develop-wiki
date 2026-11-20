---
name: Microsoft Azure
url: https://azure.microsoft.com/
docs: https://learn.microsoft.com/en-us/azure/
repo: https://github.com/Azure/azure-cli
stars: 4666
domain: cloud
category: hyperscaler
description: Microsoft 의 퍼블릭 클라우드. 구독·리소스 그룹 단위로 VM·Blob Storage·Azure SQL·AKS·App Service 를 제공하며, Entra ID·.NET·Microsoft 365 와 엮인 조직에서 주로 쓴다.
pricing: freemium
tags: [azure, microsoft, cloud, az-cli, entra-id, bicep]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Azure 는 Microsoft 가 운영하는 퍼블릭 클라우드로, 모든 리소스를 **구독(subscription)** 아래 **리소스 그룹**에 넣어 관리한다. 인증·권한은 **Microsoft Entra ID**(구 Azure AD) 테넌트와 Azure RBAC 가 맡고, 모든 변경은 Azure Resource Manager(ARM) API 를 거친다. 한국 리전은 Korea Central(`koreacentral`)과 Korea South. Windows·.NET·Microsoft 365 를 쓰는 조직에서 ID 통합이 쉽다.

## 설치 (Azure CLI)
```bash
# macOS (Homebrew, macOS 13 이상) — 2026-11 기준 최신 2.93.0
brew update && brew install azure-cli
az version
az login                                      # 브라우저 로그인
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
az upgrade                                    # CLI·확장 업데이트
```
Windows 는 WinGet·MSI, Linux 는 apt/dnf 저장소로 설치한다. 브라우저의 Azure Cloud Shell 에는 미리 설치돼 있다.

## 핵심 서비스 지도
| 영역 | 서비스 | AWS 대응 |
| --- | --- | --- |
| VM | Virtual Machines, VM Scale Sets | EC2, Auto Scaling |
| 객체 스토리지 | Blob Storage (Storage Account 안) | S3 |
| 관계형 DB | Azure SQL Database, Azure Database for PostgreSQL·MySQL | RDS |
| NoSQL | Azure Cosmos DB | DynamoDB |
| 컨테이너 | AKS, Container Apps | EKS, Fargate |
| 웹·서버리스 | App Service, [Azure Functions](/develop-wiki/cloud/serverless/azure-functions/) | Elastic Beanstalk, Lambda |
| ID·보안 | Microsoft Entra ID, Azure RBAC, Key Vault, 관리 ID | IAM Identity Center, IAM, KMS·Secrets Manager |
| 네트워크 | Virtual Network(VNet), NSG, Application Gateway, Front Door | VPC, 보안 그룹, ALB, CloudFront |
| 운영 | Azure Monitor, Log Analytics | CloudWatch |

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 테넌트 | Entra ID 디렉터리. 사용자·그룹·앱 등록이 여기에 속한다 |
| 관리 그룹 → 구독 → 리소스 그룹 | 정책·RBAC 상속 계층. 구독은 과금·할당량 단위 |
| 리소스 그룹 | 수명 주기를 같이하는 리소스 묶음. 그룹째 삭제 가능 |
| Azure RBAC | 역할(Reader·Contributor·Owner 등)을 범위(scope)에 할당 |
| 관리 ID | 앱에 붙는 Entra 정체성. 비밀 없이 다른 Azure 리소스에 접근 |
| ARM·Bicep | 선언형 배포 템플릿. Bicep 은 ARM JSON 을 간결하게 쓰는 DSL |

## 기본 사용법
```bash
az group create --name rg-demo --location koreacentral
az storage account create --name "$AZURE_STORAGE_ACCOUNT" \
  --resource-group rg-demo --location koreacentral --sku Standard_LRS
az storage container create --name uploads \
  --account-name "$AZURE_STORAGE_ACCOUNT" --auth-mode login
az resource list --resource-group rg-demo --output table
```
```ts
// npm install @azure/identity @azure/storage-blob
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

// 로컬은 az login 세션, Azure 위에서는 관리 ID 를 자동 사용
const client = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  new DefaultAzureCredential(),
);
const blob = client.getContainerClient("uploads").getBlockBlobClient("hello.txt");
const body = "hello from azure sdk";
await blob.upload(body, Buffer.byteLength(body));
```
(Blob 데이터 접근에는 해당 계정에 `Storage Blob Data Contributor` 같은 데이터 역할이 필요하다.)

## 자주 쓰는 패턴
- **리소스 그룹 = 환경·워크로드 단위**: `rg-myapp-prod` 처럼 묶어 RBAC·비용·삭제를 한 번에 다룬다.
- **비밀 없는 접근**: 앱에는 관리 ID 를 붙이고 Key Vault·Storage 에 RBAC 를 준다. 연결 문자열·계정 키는 피한다.
- **CI 는 워크로드 ID 페더레이션**: GitHub Actions OIDC 로 Entra 앱에 로그인해 배포한다.
- **IaC**: Bicep 또는 [Terraform](/develop-wiki/backend/infra-devops/terraform/)(azurerm provider)로 선언하고 `az deployment group what-if` 로 변경을 미리 본다.
- **Azure Policy**: 허용 리전·필수 태그 같은 규칙을 관리 그룹·구독에 걸어 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: Entra ID·Microsoft 365 로 인증을 통합해야 할 때, .NET·Windows Server·SQL Server 워크로드, 하이브리드(온프레미스 연동) 요구가 클 때.
- 피할 때(대안): 서비스 선택지와 서드파티 자료 폭이 우선이면 [AWS](/develop-wiki/cloud/hyperscaler/aws/), 데이터 분석·GKE 중심이면 [Google Cloud](/develop-wiki/cloud/hyperscaler/google-cloud/), 작은 웹앱이면 PaaS.
- 요금: 무료 계정·크레딧 조건은 [가격 페이지](https://azure.microsoft.com/pricing/)에서 확인한다.

## 공식 문서
- [Azure 문서](https://learn.microsoft.com/en-us/azure/) · [한국어 문서](https://learn.microsoft.com/ko-kr/azure/) · [Azure CLI 설치](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) · [리전 목록](https://learn.microsoft.com/en-us/azure/reliability/regions-list) · [Azure Architecture Center](/develop-wiki/backend/learning/azure-architecture-center/)

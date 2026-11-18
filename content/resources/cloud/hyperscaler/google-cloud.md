---
name: Google Cloud
url: https://cloud.google.com/
docs: https://docs.cloud.google.com/docs
domain: cloud
category: hyperscaler
description: Google 의 퍼블릭 클라우드. 프로젝트 단위로 Compute Engine·Cloud Storage·Cloud SQL·GKE·Cloud Run·BigQuery 를 제공하며, 컨테이너·데이터 분석 중심 워크로드에 자주 쓴다.
pricing: freemium
tags: [gcp, google-cloud, cloud, gcloud, bigquery, gke]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Google Cloud 는 Google 인프라 위에서 VM·스토리지·DB·Kubernetes·서버리스·데이터 분석 서비스를 제공하는 퍼블릭 클라우드다. 모든 리소스는 **프로젝트**에 속하고, 권한은 IAM 역할을 조직·폴더·프로젝트·리소스 계층에 붙여 상속시킨다. 서울 리전은 `asia-northeast3`. 문서 사이트는 2026년 기준 `docs.cloud.google.com` 으로 옮겨졌다(기존 `cloud.google.com/...` 경로는 리디렉션).

## 설치 (gcloud CLI)
```bash
# macOS: 아키텍처에 맞는 압축 파일을 내려받아 푼 뒤
./google-cloud-sdk/install.sh     # PATH·자동 완성 설정 (Python 3.10~3.15 필요, 없으면 설치 제안)
gcloud init                       # 브라우저 로그인 + 기본 프로젝트·리전 선택
gcloud auth application-default login   # 로컬 SDK 코드용 ADC 자격 증명
```

## 핵심 서비스 지도
| 영역 | 서비스 | AWS 대응 |
| --- | --- | --- |
| VM | Compute Engine | EC2 |
| 객체 스토리지 | Cloud Storage | S3 |
| 관계형 DB | Cloud SQL (PostgreSQL·MySQL·SQL Server), AlloyDB | RDS·Aurora |
| NoSQL·글로벌 DB | Firestore, Bigtable, Spanner | DynamoDB 등 |
| 컨테이너 | GKE, [Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/) | EKS, Fargate·App Runner |
| 분석 | BigQuery, Pub/Sub, Dataflow | Redshift·Athena, SNS/SQS·Kinesis |
| 보안 | IAM, 서비스 계정, Secret Manager | IAM, Secrets Manager |
| 네트워크 | VPC(글로벌), Cloud Load Balancing, Cloud CDN, Cloud DNS | VPC(리전), ELB, CloudFront, Route 53 |
| 운영 | Cloud Logging, Cloud Monitoring | CloudWatch |

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 리소스 계층 | 조직 → 폴더 → 프로젝트 → 리소스. 정책·IAM 이 위에서 아래로 상속 |
| 프로젝트 | 과금·API 활성화·할당량 단위. `PROJECT_ID` 로 식별 |
| API 활성화 | 서비스를 쓰기 전 `gcloud services enable` 로 프로젝트에서 켜야 한다 |
| 서비스 계정 | 워크로드용 정체성. 키 파일 발급보다 연결된 서비스 계정·Workload Identity Federation 권장 |
| ADC | Application Default Credentials. 클라이언트 라이브러리가 환경에서 자격 증명을 자동 탐색 |
| 글로벌 VPC | VPC 네트워크는 글로벌, 서브넷은 리전 단위 |

## 기본 사용법
```bash
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com storage.googleapis.com

gcloud storage buckets create "gs://$BUCKET_NAME" --location=asia-northeast3
gcloud storage cp ./report.csv "gs://$BUCKET_NAME/reports/"
gcloud compute instances list
```
```ts
// npm install @google-cloud/storage
import { Storage } from "@google-cloud/storage";

// 자격 증명은 ADC 에서 자동 탐색 (로컬: gcloud auth application-default login)
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME!);

await bucket.upload("./report.csv", { destination: "reports/report.csv" });
const [files] = await bucket.getFiles({ prefix: "reports/" });
console.log(files.map((f) => f.name));
```

## 자주 쓰는 패턴
- **환경별 프로젝트**: `myapp-dev`, `myapp-prod` 처럼 프로젝트를 나누고 폴더로 묶어 IAM 을 상속시킨다.
- **키 파일 없는 CI**: GitHub Actions 등 외부 CI 는 Workload Identity Federation 으로 서비스 계정을 가장(impersonate)한다.
- **컨테이너 우선**: 상태 없는 웹·API 는 Cloud Run, 세밀한 제어가 필요하면 GKE 로 시작한다.
- **데이터는 BigQuery 로**: 로그·이벤트를 BigQuery 로 내보내 SQL 로 분석한다.
- **예산 알림**: Cloud Billing 예산과 알림을 프로젝트 생성 시 함께 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: BigQuery 기반 데이터 분석, Kubernetes(GKE)·컨테이너 중심 아키텍처, [Firebase](/develop-wiki/cloud/baas/firebase/)와 함께 쓰는 앱 백엔드.
- 피할 때(대안): 특정 관리형 서비스·레퍼런스 폭이 우선이면 [AWS](/develop-wiki/cloud/hyperscaler/aws/), Microsoft 생태계 조직이면 [Azure](/develop-wiki/cloud/hyperscaler/azure/), 단순 웹 배포만 필요하면 PaaS([Vercel](/develop-wiki/cloud/paas-edge/vercel/), [Render](/develop-wiki/cloud/paas-edge/render/)).
- 요금: 무료 등급·신규 크레딧 조건은 바뀔 수 있으니 [가격 페이지](https://cloud.google.com/pricing)에서 확인한다.

## 공식 문서
- [문서 홈](https://docs.cloud.google.com/docs) · [gcloud CLI 설치](https://docs.cloud.google.com/sdk/docs/install) · [리전·영역](https://docs.cloud.google.com/compute/docs/regions-zones) · [Architecture Center](/develop-wiki/cloud/learning/google-cloud-architecture-center/)

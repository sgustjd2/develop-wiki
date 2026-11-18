---
name: NAVER Cloud Platform
url: https://www.ncloud.com/
docs: https://guide.ncloud-docs.com/docs/home
repo: https://github.com/NaverCloudPlatform/terraform-provider-ncloud
domain: cloud
category: hyperscaler
description: 네이버클라우드의 국내 퍼블릭 클라우드. VPC 기반 Server·Object Storage·Cloud DB·Ncloud Kubernetes Service 와 CLOVA AI 서비스를 제공하며, 국내 리전·한국어 지원·공공 요건이 중요할 때 쓴다.
pricing: paid
tags: [ncp, ncloud, naver-cloud, korea, cloud, vpc]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
NAVER Cloud Platform(NCP, Ncloud)은 네이버클라우드가 운영하는 국내 퍼블릭 클라우드다. 서버·스토리지·DB·네트워크·컨테이너 같은 기본 인프라에 CLOVA OCR·CLOVA Studio·Papago 같은 AI·네이버 API 를 함께 제공하고, 문서·콘솔·지원이 한국어 원문이다. 네트워크 환경은 **VPC** 와 이전 세대인 **Classic** 두 가지가 있고, 새 구성은 VPC 를 기준으로 한다. 공공기관용은 별도 사이트([공공 가이드](https://guide-gov.ncloud-docs.com/))로 운영된다.

## 설치 (Ncloud CLI)
```bash
# 1) 공식 페이지에서 CLI zip 을 내려받는다 (2026-11 기준 1.1.30, JRE 8 포함)
#    https://cli.ncloud-docs.com/docs/guide-clichange
cd ~/Downloads/CLI_1.1.30_20260625/cli_linux
./ncloud                      # 도움말이 나오면 설치 완료

# 2) API 인증키 설정 (콘솔의 인증키 관리에서 발급) → ~/.ncloud/configure 에 저장
./ncloud configure
```
CLI 는 Java 기반이라 JRE 가 필요하다(묶음에 JRE 8 포함). 인증키는 저장소·스크립트에 넣지 말고 각자 `configure` 하거나 `--profile` 로 분리한다.

## 핵심 서비스 지도
| 영역 | 대표 서비스 | AWS 대응 |
| --- | --- | --- |
| Compute | Server, Auto Scaling, Cloud Functions | EC2, Auto Scaling, Lambda |
| Containers | Ncloud Kubernetes Service | EKS |
| Storage | Object Storage, Block Storage, NAS, Archive Storage, Backup | S3, EBS, EFS, Glacier, Backup |
| Database | Cloud DB for MySQL·PostgreSQL·MongoDB 등 | RDS, DocumentDB |
| Networking | VPC, Load Balancer, NAT Gateway, IPsec VPN, Global DNS | VPC, ELB, NAT GW, VPN, Route 53 |
| AI | CLOVA Studio, CLOVA OCR, CLOVA Speech, Papago Translation | Bedrock, Textract, Transcribe, Translate |

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| VPC / Classic | 플랫폼 구분. 문서·API·CLI 명령이 환경별로 나뉜다(예: `vserver` = VPC 서버, `server` = Classic) |
| 리전·존 | VPC 서버 API 는 `KR`·`SGN`·`JPN` 리전 코드를 받는다. 존은 리전 안의 데이터센터 단위 |
| API 인증키 | Access Key ID + Secret Key. 콘솔 마이페이지의 인증키 관리에서 발급 |
| Sub Account | 하위 계정·그룹·정책으로 콘솔·API 권한을 나누는 IAM 성격 기능 |
| 호환 CLI | Object Storage·Ncloud Storage 는 AWS S3 호환, Archive Storage 는 OpenStack Swift 호환 CLI 로 다룬다 |

## 기본 사용법
```bash
./ncloud help                                   # 최상위 명령 목록
./ncloud vserver help                           # VPC 서버 하위 명령
./ncloud vserver getRegionList                  # 사용 가능한 리전
./ncloud vserver getServerInstanceList --regionCode KR
./ncloud vserver getServerInstanceList --regionCode KR --output xml   # 기본 출력은 JSON
./ncloud vserver getServerInstanceList --profile staging              # 다른 프로필 인증키 사용
```
옵션 순서는 자유롭고, List 형식 값은 공백·콤마·옵션 반복으로 넘긴다.

## 자주 쓰는 패턴
- **IaC**: 공식 [Terraform provider](https://registry.terraform.io/providers/NaverCloudPlatform/ncloud/latest)(`NaverCloudPlatform/ncloud`)로 VPC·서버·LB 를 선언한다. [Terraform](/develop-wiki/backend/infra-devops/terraform/)·[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/) 참고.
- **S3 호환 스토리지**: Object Storage 를 AWS CLI·SDK 의 엔드포인트만 바꿔 사용한다(엔드포인트는 Object Storage 가이드에서 확인).
- **컨테이너**: Ncloud Kubernetes Service 에 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) 매니페스트·Helm 차트를 그대로 배포한다.
- **환경 분리**: Sub Account 와 CLI `--profile` 로 운영·개발 인증키를 분리한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 국내 데이터 위치·공공 클라우드 보안 인증 같은 요건이 있을 때, 한국어 기술 지원·계약이 중요할 때, CLOVA 등 네이버 AI·지도 API 와 묶어 쓸 때.
- 피할 때(대안): 글로벌 다중 리전·폭넓은 관리형 서비스가 필요하면 [AWS](/develop-wiki/cloud/hyperscaler/aws/)·[Google Cloud](/develop-wiki/cloud/hyperscaler/google-cloud/)·[Azure](/develop-wiki/cloud/hyperscaler/azure/). 서드파티 도구·커뮤니티 자료는 글로벌 클라우드보다 적다.
- 요금: 서비스별 종량제. 신규 가입 혜택·무료 이용 조건은 [요금 페이지](https://www.ncloud.com/charge/price)에서 확인한다.

## 공식 문서
- [사용 가이드](https://guide.ncloud-docs.com/docs/home) · [API 가이드](https://api.ncloud-docs.com/docs/home) · [CLI 가이드](https://cli.ncloud-docs.com/docs/guide) · [CLI 다운로드](https://cli.ncloud-docs.com/docs/guide-clichange) · [CLI 인증](https://cli.ncloud-docs.com/docs/cli-auth) · [공공 가이드](https://guide-gov.ncloud-docs.com/)

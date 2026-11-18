---
name: Google Cloud Architecture Center
url: https://docs.cloud.google.com/architecture
docs: https://docs.cloud.google.com/architecture/framework
domain: cloud
category: learning
description: Google Cloud 가 운영하는 참조 아키텍처·설계 가이드·모범 사례 모음. Well-Architected Framework, 배포 아키타입, 랜딩 존, 마이그레이션·AI 아키텍처 문서를 찾아볼 때 쓴다.
pricing: free
tags: [gcp, google-cloud, architecture, well-architected, reference-architecture, landing-zone]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Cloud Architecture Center 는 Google Cloud 에서 워크로드를 설계·이전·운영할 때 참고할 **참조 아키텍처, 설계 가이드, 모범 사례**를 모은 공식 문서 허브다. 핵심은 **Google Cloud Well-Architected Framework** 로, 권장 사항을 기둥(pillar)과 교차 관점(perspective)으로 정리한다. 서비스 이름은 Google Cloud 기준이지만 신뢰성 목표 설정·장애 격리·비용 가시성 같은 원칙은 다른 클라우드에도 그대로 쓸 수 있다. 문서는 2026년 `docs.cloud.google.com/architecture` 로 옮겨졌다(기존 `cloud.google.com/architecture` 는 리디렉션). 일부 페이지는 `?hl=ko` 한국어 번역이 있지만 전체가 번역되지는 않았다.

## 구성
| 영역 | 내용 |
| --- | --- |
| Well-Architected Framework | 기둥: 운영 우수성 · 보안·개인정보·규정 준수 · 신뢰성 · 비용 최적화 · 성능 최적화 · 지속 가능성 |
| 교차 관점(perspective) | AI·ML, 금융 서비스 등 특정 기술·업종 관점에서 기둥 원칙을 다시 정리 |
| 배포 아키타입 | zonal · regional · multi-regional · global · hybrid · multicloud 배치 유형 비교 |
| 랜딩 존·엔터프라이즈 기반 | ID 온보딩, 리소스 계층, 네트워크 설계, 보안 통제를 갖춘 초기 환경 구축 |
| 참조 아키텍처 | 워크로드별 구성도와 설계 고려사항(웹앱, 데이터 분석, 에이전트형 AI 등) |
| 신뢰성 가이드 | 영역·리전 장애 범위에 따른 인프라 신뢰성 설계 |
| 마이그레이션 | 온프레미스·타 클라우드에서 Google Cloud 로 이전하는 절차 |
| 보안·규정 준수 | 워크로드 보안 모범 사례 모음 |

## 활용법
1. **배포 아키타입으로 목표 가용성을 먼저 정한다.** 단일 영역으로 충분한지, 리전 장애까지 견뎌야 하는지에 따라 이후 모든 설계가 달라진다.
2. **Well-Architected 기둥 하나를 골라 체크리스트로 쓴다.** 백엔드 개발자라면 신뢰성(사용자 경험 기준 목표 정의, 현실적인 SLO) → 운영 우수성 → 보안 순서가 실무와 가깝다.
3. **비슷한 참조 아키텍처를 찾아 차이만 검토한다.** 처음부터 그리지 말고 구성도·고려사항 표를 가져와 우리 요구와 다른 부분을 표시한다.
4. **팀 환경이면 랜딩 존 가이드로 기반을 먼저 만든다.** 조직·폴더·프로젝트 계층, 공유 VPC, IAM 그룹 설계를 서비스보다 앞서 정한다.

## 다른 클라우드 자료와의 관계
| 자료 | 비고 |
| --- | --- |
| [AWS Well-Architected Framework](/develop-wiki/backend/learning/aws-well-architected/) | 기둥 구성이 거의 같다(운영·보안·신뢰성·성능·비용·지속 가능성) |
| [Azure Architecture Center](/develop-wiki/backend/learning/azure-architecture-center/) | 벤더 중립 클라우드 디자인 패턴 카탈로그가 특히 유용 |
| [The Twelve-Factor App](/develop-wiki/backend/learning/twelve-factor-app/) | 애플리케이션 수준 원칙. 클라우드 아키텍처 문서와 함께 읽으면 좋다 |

## 언제 쓰나 / 피할 때
- 쓸 때: [Google Cloud](/develop-wiki/cloud/hyperscaler/google-cloud/)에서 새 워크로드를 설계하거나 아키텍처 리뷰를 준비할 때, 가용성 목표·리전 배치를 결정할 때, 조직 단위 클라우드 기반(랜딩 존)을 만들 때.
- 피할 때(대안): 특정 서비스의 API·설정 방법이 궁금하면 각 제품 문서([Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/) 등)가 빠르다. 분산 시스템 기초 개념부터 익히려면 [System Design Primer](/develop-wiki/backend/learning/system-design-primer/) 같은 입문 자료가 먼저다.

## 공식 문서
- [Architecture Center 홈](https://docs.cloud.google.com/architecture) · [Well-Architected Framework](https://docs.cloud.google.com/architecture/framework) · [배포 아키타입](https://docs.cloud.google.com/architecture/deployment-archetypes) · [랜딩 존](https://docs.cloud.google.com/architecture/landing-zones) · [인프라 신뢰성 가이드](https://docs.cloud.google.com/architecture/infra-reliability-guide)

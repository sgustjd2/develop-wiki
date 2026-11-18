---
name: AWS Well-Architected Framework
url: https://aws.amazon.com/architecture/well-architected/
docs: https://docs.aws.amazon.com/wellarchitected/latest/framework/framework.html
domain: backend
category: learning
description: AWS 가 정리한 클라우드 아키텍처 모범 사례 모음. 운영 우수성·보안·안정성·성능 효율성·비용 최적화·지속 가능성 6개 기둥으로 워크로드 설계를 점검할 때 쓴다.
pricing: free
tags: [cloud, architecture, aws, best-practices, reliability]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
AWS Well-Architected Framework 는 AWS 솔루션스 아키텍트들이 고객 아키텍처를 검토하며 쌓은 판단 기준을 질문과 모범 사례(best practice) 형태로 정리한 문서다. AWS 서비스 이름이 예시로 많이 나오지만, 장애 격리·복구 목표·변경 관리·비용 가시성 같은 내용은 다른 클라우드나 온프레미스에도 그대로 적용된다.

**2026-11-16 개편:** 기둥(pillar)별로 따로 있던 6개 백서가 하나의 문서로 합쳐졌고, 문서가 두 영역으로 재구성됐다. 계정·조직 단위에서 한 번 정하는 **Cloud Foundations** 와, 워크로드마다 반복 점검하는 **Cloud Workloads** 다. 각 기둥은 관련 모범 사례를 묶은 **capability** 단위로 정리되고, 거의 모든 모범 사례가 새 서식으로 다시 쓰였다. 이전 판(2024-11-06 등)의 질문 ID 나 링크를 참조하던 자료는 새 구조와 어긋날 수 있다.

## 구성
| 영역 | 내용 |
| --- | --- |
| Cloud Foundations | 멀티 계정 환경, ID·접근 관리, 중앙 관측성, 리소스·인벤토리 관리, 보안·컴플라이언스, 클라우드 재무 관리, 네트워킹 |
| 운영 우수성 | 코드형 운영, 관측, 배포 위험 완화, 이벤트 대응과 사후 학습 |
| 보안 | 데이터·시스템 보호, 접근 제어, 보안 이벤트 탐지·대응 |
| 안정성 | 가용성·복구 목표, 서비스 할당량, 분산 시스템 상호작용 설계, 수요 변화 대응, 변경 관리 |
| 성능 효율성 | 자원을 요구사항에 맞게 고르고 수요 변화에 따라 유지 |
| 비용 최적화 | 비용 가시성, 가치를 내지 못하는 비용 제거 |
| 지속 가능성 | 워크로드가 쓰는 에너지·자원 줄이기 |
| 렌즈(Lens) | 서버리스·SaaS·생성형 AI 등 특정 워크로드 유형용 추가 질문 세트 |
| Well-Architected Tool | AWS 콘솔에서 질문에 답하며 워크로드를 검토하고 개선 계획·마일스톤을 남기는 도구(무료) |

## 활용법
1. **설계 원칙과 개념 절부터 읽는다.** 용어(워크로드, 컴포넌트, capability, 트레이드오프)를 먼저 잡아야 각 기둥 문서가 읽힌다.
2. **기둥 하나를 골라 깊게 본다.** 백엔드 개발자라면 안정성 → 운영 우수성 → 보안 순서가 실무와 가장 가깝다. 안정성의 "분산 시스템 상호작용" 절은 타임아웃·재시도·멱등성·우아한 성능 저하를 다룬다.
3. **현재 서비스로 자체 점검한다.** 모범 사례마다 "지킴 / 부분 / 해당 없음"을 표시하고 위험도(높음·중간)를 붙여 백로그로 만든다.
   ```text
   안정성 · 복구 목표 : RTO/RPO 정의 없음            → 높음
   안정성 · 상호작용   : 외부 결제 API 호출에 타임아웃 없음 → 높음
   비용 · 가시성       : 리소스 태그 규칙 없음            → 중간
   ```
4. **AWS 를 쓰면 Well-Architected Tool 로 기록한다.** 같은 질문에 콘솔에서 답하고 마일스톤을 저장해 분기마다 비교한다. 사내 규칙은 커스텀 렌즈로 추가할 수 있다.
5. **워크로드 유형에 맞는 렌즈를 더한다.** 서버리스, 컨테이너, 생성형 AI 같은 렌즈는 기본 질문에 없는 항목을 보완한다.

## 함께 보면 좋은 자료
- Azure Architecture Center 의 Well-Architected·클라우드 디자인 패턴 — 같은 문제를 다른 벤더 관점으로 비교할 수 있다. Google Cloud 도 Architecture Center 와 Well-Architected Framework 를 운영한다.
- [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) · [사가](/develop-wiki/knowledge/distributed-systems/saga/) — 안정성 기둥의 재시도·분산 트랜잭션 주제와 이어진다.
- [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) — 운영 우수성의 관측 항목을 구현하는 표준.
- [The Twelve-Factor App](/develop-wiki/backend/learning/twelve-factor-app/) — 애플리케이션 구조 쪽 원칙. Well-Architected 는 그보다 넓은 운영·조직 범위를 다룬다.

## 언제 쓰나
- 쓸 때: 출시 전 아키텍처 리뷰, 장애 후 재발 방지 항목 정리, 클라우드 계정 구조를 처음 잡을 때(Cloud Foundations), 팀 공통 점검표가 필요할 때.
- 한계: 분량이 많고 AWS 서비스 중심 예시가 섞여 있다. 처음부터 끝까지 읽기보다 기둥·capability 단위로 필요한 곳만 본다. 한국어 번역 페이지는 개편 이전 판 기준이거나 영어로 표시되는 곳이 있어 최신 내용은 영어판을 기준으로 한다.

## 공식 문서
- [프레임워크 문서](https://docs.aws.amazon.com/wellarchitected/latest/framework/framework.html) · [Cloud Foundations](https://docs.aws.amazon.com/wellarchitected/latest/framework/cloud-foundations.html) · [Cloud Workloads(6개 기둥)](https://docs.aws.amazon.com/wellarchitected/latest/framework/workloads.html) · [릴리스 노트](https://docs.aws.amazon.com/wellarchitected/latest/framework/release-notes.html) · [Well-Architected Tool 사용자 가이드](https://docs.aws.amazon.com/wellarchitected/latest/userguide/intro.html) · [렌즈](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses.html)

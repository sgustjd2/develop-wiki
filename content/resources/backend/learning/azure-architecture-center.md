---
name: Azure Architecture Center
url: https://learn.microsoft.com/en-us/azure/architecture/
docs: https://learn.microsoft.com/ko-kr/azure/architecture/
domain: backend
category: learning
description: Microsoft 가 운영하는 클라우드 아키텍처 가이드 모음. 벤더 중립적인 클라우드 디자인 패턴 카탈로그, 아키텍처 스타일, 기술 선택 가이드, 참조 아키텍처를 찾아볼 때 쓴다.
pricing: free
tags: [cloud, architecture, design-patterns, azure, reference-architecture]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Azure Architecture Center 는 Microsoft Learn 안에 있는 아키텍처 문서 허브다. 참조 아키텍처와 예시 워크로드는 Azure 서비스 기준이지만, **클라우드 디자인 패턴**, **아키텍처 스타일**, **안티패턴** 문서는 기술 중립적으로 쓰여 있어 다른 클라우드나 온프레미스 백엔드 설계에도 그대로 참고할 수 있다. 같은 사이트의 Azure Well-Architected Framework(신뢰성·보안·비용 최적화·운영 우수성·성능 효율성 5개 기둥)와 Cloud Adoption Framework 와 연결된다.

Microsoft Learn 문서는 한국어(ko-kr)로 기계 번역돼 전체가 제공된다. 번역 품질이 고르지 않은 곳은 페이지 상단에서 영어 원문으로 전환해 확인한다. 문서는 계속 갱신되며(패턴 카탈로그 2026-11 갱신 확인), 각 페이지에 마지막 수정일이 표시된다.

## 구성
| 영역 | 내용 |
| --- | --- |
| 클라우드 디자인 패턴 | 44개 패턴. 문제 · 고려사항 · 사용 시점 · Azure 예시 순으로 설명하고, 관련 Well-Architected 기둥을 표시 |
| 안티패턴 | 부하가 커질 때 드러나는 흔한 설계 실수(예: Synchronous I/O, Chatty I/O, Retry Storm) |
| 아키텍처 스타일 | N-tier, Web-Queue-Worker, 마이크로서비스, 이벤트 드리븐, Big data, Big compute 비교 |
| 기술 선택 가이드 | 컴퓨팅·데이터 저장소·메시징·AI 서비스 선택용 결정 트리 |
| 모범 사례 | API 설계, 캐싱, 일시적 오류 처리, 모니터링·진단 등 클라우드 앱 공통 주제 |
| 참조 아키텍처·예시 | 기준(baseline) 아키텍처, 솔루션 아이디어, 예시 워크로드 |
| AI 에이전트 오케스트레이션 패턴 | 여러 AI 에이전트를 조율하는 패턴(순차, 동시, 핸드오프 등) |

## 활용법
1. **패턴 카탈로그를 "문제 → 패턴" 사전처럼 쓴다.** 기술 이름이 아니라 겪는 문제(부하 폭증, 느린 외부 의존성, 레거시 교체)로 검색한다.
2. **조합 예시를 익힌다.** 카탈로그가 직접 권하는 조합은 다음과 같다.
   ```text
   Retry + Circuit Breaker              → 일시 장애는 재시도, 지속 장애는 차단
   Queue-Based Load Leveling
     + Competing Consumers              → 큐로 부하를 흡수하고 소비자를 늘려 처리
   Saga + Compensating Transaction      → 여러 서비스에 걸친 작업 실패 시 되돌리기
   ```
3. **아키텍처 스타일 비교표로 출발점을 정한다.** 새 시스템이면 Web-Queue-Worker 같은 단순한 스타일부터 검토하고, 마이크로서비스는 팀·도메인 분리 필요가 분명할 때 고른다.
4. **안티패턴으로 기존 시스템을 점검한다.** 성능 문제가 있을 때 증상별 안티패턴 문서에서 원인 후보와 진단 방법을 찾는다.
5. **Azure 사용자라면** 기술 선택 결정 트리 → 기준 아키텍처 → Well-Architected 서비스 가이드 순서로 내려간다.

## 함께 보면 좋은 자료
- 이 사이트의 지식 노트: [CQRS](/develop-wiki/knowledge/architecture/cqrs/) · [사가](/develop-wiki/knowledge/distributed-systems/saga/) · [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) · [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/) · [이벤트 드리븐](/develop-wiki/knowledge/architecture/event-driven/) · [어댑터 패턴](/develop-wiki/knowledge/design-patterns/adapter/)(Anti-Corruption Layer 의 기반)
- [AWS Well-Architected Framework](/develop-wiki/backend/learning/aws-well-architected/) — 같은 주제의 AWS 판. Google Cloud 도 Architecture Center 와 Well-Architected Framework 를 운영한다.
- [The System Design Primer](/develop-wiki/backend/learning/system-design-primer/) — 패턴을 적용할 시스템 설계 기초.

## 언제 쓰나
- 쓸 때: 분산 시스템 설계 리뷰에서 패턴 이름과 트레이드오프를 공유할 때, 장애·성능 문제의 해법 후보를 찾을 때, Azure 워크로드를 설계할 때.
- 한계: 참조 아키텍처·기술 선택 문서는 Azure 서비스 전제다. 패턴 문서의 예시 코드도 Azure SDK 기준이라 다른 플랫폼에서는 개념만 가져온다.

## 공식 문서
- [Architecture Center 홈(한국어)](https://learn.microsoft.com/ko-kr/azure/architecture/) · [클라우드 디자인 패턴](https://learn.microsoft.com/en-us/azure/architecture/patterns/) · [아키텍처 스타일](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/) · [기술 선택](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/technology-choices-overview) · [안티패턴](https://learn.microsoft.com/en-us/azure/architecture/antipatterns/) · [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/pillars)

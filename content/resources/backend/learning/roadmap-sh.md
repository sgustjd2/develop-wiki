---
name: roadmap.sh
url: https://roadmap.sh
docs: https://roadmap.sh/backend
repo: https://github.com/nilbuild/developer-roadmap
stars: 372685
domain: backend
category: learning
description: 백엔드·DevOps·시스템 설계 등 직군·기술별 학습 순서를 인터랙티브 로드맵으로 보여 주는 사이트. 무엇을 어떤 순서로 배울지 정하고 진도를 표시할 때 쓴다.
pricing: freemium
tags: [roadmap, backend, devops, system-design, career]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
roadmap.sh 는 Kamran Ahmed 가 운영하는 개발자 학습 로드맵 사이트다. 각 로드맵은 주제를 노드로 연결한 다이어그램이고, 노드를 누르면 짧은 설명과 외부 학습 링크가 열린다. 콘텐츠는 GitHub 저장소 `kamranahmedse/developer-roadmap` 에서 커뮤니티 기여로 관리되며, 2026-11 기준 저장소에 로드맵 약 100개가 있고 매일 갱신된다.

**라이선스 주의:** 저장소는 OSI 오픈소스 라이선스가 아니다. 개인 학습 용도 사용만 허용하고, 로드맵 이미지·본문을 블로그·뉴스레터 등 다른 매체에 옮겨 싣는 것은 사전 동의 없이 금지한다(링크 공유는 허용). 로드맵 열람은 무료이고, AI 튜터·AI 생성 코스·커스텀 로드맵 같은 기능은 무료 한도를 넘으면 유료 Pro 플랜이 필요하다.

## 구성
| 기능 | 내용 |
| --- | --- |
| 역할별 로드맵 | Backend, DevOps, Full Stack 등 직군 단위 학습 경로 |
| 기술별 로드맵 | Docker, Kubernetes, PostgreSQL, Go, Rust, Java, Python 등 |
| 개념 로드맵 | System Design, API Design, Software Design & Architecture, Best Practices(API 보안·성능 등) |
| 진도 표시 | 로그인하면 노드별 학습 상태를 표시해 진행률을 본다 |
| 프로젝트 | 로드맵별 실습 과제 목록(예: backend/projects) |
| 질문 | 면접·복습용 문답 카드(예: questions/backend) |
| AI 기능 | AI 튜터 채팅, AI 생성 코스·로드맵 — 무료 한도 후 유료 |

Backend 로드맵이 다루는 범위는 인터넷·HTTP·DNS 기초 → 언어 선택 → Git → 관계형·NoSQL DB(인덱스, 트랜잭션, ORM, N+1, 정규화, 복제·샤딩) → API(REST, GraphQL, gRPC, OpenAPI) → 인증(JWT, OAuth, OpenID, SAML) → 캐시 → 웹 보안 → 테스트 → CI/CD → 아키텍처(모놀리스, 마이크로서비스, SOA, 서버리스, 서비스 메시, Twelve-Factor) → 메시지 브로커(Kafka, RabbitMQ) → 컨테이너 → 웹 서버(Nginx, Caddy 등) → 실시간 통신 → 확장성·관측성까지다. 최근에는 AI 보조 코딩, LLM·RAG·MCP 같은 노드도 추가됐다.

## 활용법
1. **역할 로드맵 하나를 고른다.** 백엔드 입문이면 Backend, 운영까지 보려면 DevOps 를 함께 연다.
2. **이미 아는 노드부터 완료로 표시**해 남은 범위를 눈으로 확인한다. 로드맵이 넓으므로 "전부 배운다"가 아니라 공백을 찾는 용도로 쓴다.
3. **노드 링크는 출발점으로만 쓴다.** 노드 설명은 짧으니, 실제 학습은 공식 문서(이 사이트의 각 항목 "공식 문서" 절)로 이어 간다.
4. **프로젝트 탭으로 손을 움직인다.** 예를 들어 다음 순서로 작은 과제를 묶어 진행한다.
   ```text
   1주차: Todo REST API (CRUD, 입력 검증)        → API·DB 노드
   2주차: JWT 로그인 + 레이트 리밋               → 인증·캐시 노드
   3주차: Docker 이미지 + GitHub Actions 배포   → 컨테이너·CI/CD 노드
   ```
5. **개념 로드맵으로 확장한다.** Backend 를 어느 정도 채웠으면 System Design·API Design 로드맵으로 넘어간다.

## 함께 보면 좋은 자료
- 웹 프레임워크 노드의 실물: [Express](/develop-wiki/backend/web-framework/express/) · [FastAPI](/develop-wiki/backend/web-framework/fastapi/) · [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) · [Gin](/develop-wiki/backend/web-framework/gin/)
- DB 노드의 실물: [PostgreSQL](/develop-wiki/backend/database/postgresql/) · [Redis](/develop-wiki/backend/database/redis/) · [MongoDB](/develop-wiki/backend/database/mongodb/)
- 아키텍처 노드 심화: [헥사고날 아키텍처](/develop-wiki/knowledge/architecture/hexagonal/) · [이벤트 드리븐](/develop-wiki/knowledge/architecture/event-driven/) · [The Twelve-Factor App](/develop-wiki/backend/learning/twelve-factor-app/)

## 언제 쓰나
- 쓸 때: 학습 범위를 정할 때, 팀 온보딩 커리큘럼 초안을 만들 때, 내 지식의 빈 곳을 점검할 때.
- 한계: 노드 설명이 얕고 외부 링크의 품질이 고르지 않다. 로드맵 순서는 하나의 제안일 뿐이며, 콘텐츠를 사내 문서 등에 옮겨 싣는 것은 라이선스상 허용되지 않는다(링크로 공유).

## 공식 문서
- [Backend 로드맵](https://roadmap.sh/backend) · [Backend 프로젝트](https://roadmap.sh/backend/projects) · [Backend 질문](https://roadmap.sh/questions/backend) · [System Design 로드맵](https://roadmap.sh/system-design) · [저장소](https://github.com/kamranahmedse/developer-roadmap) · [라이선스](https://github.com/kamranahmedse/developer-roadmap/blob/master/license)

# 백과사전 본문 1차 작성 — 2026-11-18

## 추가
- backend/database: MySQL, SQLite, MongoDB, Redis(+Valkey), DuckDB, ClickHouse, Elasticsearch(+OpenSearch), Cassandra — 템플릿 B(DB 사용법)
- languages: 14개 언어 페이지 (템플릿 C)
- knowledge: DRY·KISS·YAGNI, 상속보다 합성, 결합도·응집도, 레이어드/클린/헥사고날 비교, CQRS, 이벤트 드리븐, 사가, 멱등성, 트랜잭셔널 아웃박스, 프록시 패턴
## 수정
- 모든 리소스(46)에 공식 문서 기반 본문 + `docs` 필드
- pricing 에 source-available(SSPL·BSL) 추가 → MongoDB
## 사람 확인 필요 (fact-checker 대상)
- 코드 예제는 대부분 실행하지 않음 (C/C++/Swift/SQL 언어 예제만 실행 확인)
- 각 에이전트가 "문서에서 직접 확인 못 함"으로 보고한 세부 API (Lit 생명주기, Playwright 설정 옵션, Eino/LangChain4j 예제 등)
- PHP 8.6 GA(2026-11-19 예정) 후 php 페이지 갱신, C++26 ISO 승인 여부
## 보류/백로그
- Valkey, OpenSearch 별도 항목 / NestJS, Fastify, Prisma, Kysely, Django REST framework
- 지식: 템플릿 메서드, 책임 연쇄, 싱글턴, 이벤트 소싱, CAP/PACELC, 2PC vs 사가

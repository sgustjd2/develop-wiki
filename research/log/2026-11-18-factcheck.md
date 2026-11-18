# 백과사전 팩트체크 — 2026-11-18

6개 영역을 fact-checker 가 독립 검증 (코드 예제는 가능한 범위에서 컴파일·실행).

## 반영한 수정
- knowledge(10개 중 6개 수정): 컴파일 안 되던 TS 예제 2건, Fowler 분류 누락, 근거 없는 수치("참여자 2~3개"), Stripe v1/v2 서술, 아웃박스 릴레이 setInterval 겹침
- backend(11개 중 6개): Spring Boot 예제 400 오류(Jackson 3, record 분리), Hono Node 20+, Django "설정보다 관례" 오기, Gin H 타입, Laravel 테스트 서술, Axum tower util 기능
- database(9개 중 5개): MongoDB 레플리카 셋 접속 문자열, ClickHouse async_insert 기본값(26.3~)·조인 서술, PostgreSQL DDL 롤백 범위, SQLite rowid, MySQL 중복 인덱스 예제
- frontend(13개 중 6개): Preact forwardRef, htmx 4 배포 서술, Svelte 타입 예제·attach 설명, Alpine x-for 규칙, Angular zone/Node 범위, Lit 표현
- ai(13개 중 6개): LangChain 모델 문자열(패키지 불일치), ADK extras(mcp/eval/extensions), MAF 문구 재작성·GitHub 링크, Ollama macOS 설치 서술, vLLM prefix caching 기본값
## 확인 못 한 것 / 사람 확인 필요
- microsoft/agent-framework GitHub 저장소가 404 (일시적일 수 있음, 링크는 Go SDK 로 교체)
- MCP Ruby SDK: 본문엔 있으나 frontmatter languages 에 없음. 공식 SDK 목록 확인 후 맞출 것
- Go, Rust, .NET, PHP, JDK 가 없는 환경이라 해당 예제는 컴파일 못 함 (Gin·Axum·ASP.NET·Laravel·Spring·LangChain4j)
- languages 14개: 재개된 검증 대기

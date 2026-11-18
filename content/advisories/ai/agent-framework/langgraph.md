---
checkedAt: 2026-11-18
latestVersion: 1.2.22
latestReleasedAt: 2026-11-14
versions:
  - version: 1.2.22
    releasedAt: 2026-11-14
    summary: 자식 그래프 스트리밍 버그를 수정하고 메시지 변환 및 상태 업데이트 등의 성능을 개선했다.
    breaking: false
    url: https://github.com/langchain-ai/langgraph/releases/tag/1.2.22
  - version: prebuilt==1.1.2
    releasedAt: 2026-11-14
    summary: call_model 에러 발생 시에만 에러 메시지를 포맷팅하도록 성능을 개선했다.
    breaking: false
    url: https://github.com/langchain-ai/langgraph/releases/tag/prebuilt%3D%3D1.1.2
  - version: checkpointpostgres==3.2.1
    releasedAt: 2026-11-14
    summary: 데이터베이스 읽기 및 잠금 처리 성능을 개선하고 certifi 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/langchain-ai/langgraph/releases/tag/checkpointpostgres%3D%3D3.2.1
  - version: checkpoint==4.3.2
    releasedAt: 2026-11-14
    summary: InMemoryStore 검색 성능을 개선하고 관련 의존성 패키지들을 업데이트했다.
    breaking: false
    url: https://github.com/langchain-ai/langgraph/releases/tag/checkpoint%3D%3D4.3.2
  - version: 1.2.21
    releasedAt: 2026-11-12
    summary: get_subgraphs의 네임스페이스 일치 오류와 서브그래프 네임스페이스 읽기 오류를 수정하고 보안을 위해 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/langchain-ai/langgraph/releases/tag/1.2.21
security:
  - id: GHSA-6hmw-9432-67qq (CVE-2026-115883)
    severity: unknown
    title: Namespace labels containing `.` reach other namespaces in Postgres and SQLite stores
    affected: < 3.1.3
    fixedIn: 3.1.3
    publishedAt: 2026-10-21
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-6hmw-9432-67qq
  - id: GHSA-8prr-f582-jqq3 (CVE-2026-115885)
    severity: unknown
    title: LangGraph CLI prints the registry push token in `langgraph deploy --verbose` output
    affected: ">= 0.4.15, <= 0.4.31"
    fixedIn: 0.4.32
    publishedAt: 2026-10-19
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-8prr-f582-jqq3
  - id: GHSA-3fx2-cqw9-xr3c (CVE-2026-118667)
    severity: unknown
    title: Unencoded identifiers in LangGraph SDK v3 streaming can redirect authenticated GET requests
    affected: ">= 0.4.0, < 0.4.6"
    fixedIn: 0.4.6
    publishedAt: 2026-10-07
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-3fx2-cqw9-xr3c
  - id: GHSA-4hm6-w6qq-w73v (CVE-2026-118668)
    severity: high
    title: LangGraph JavaScript custom authentication may permit cross-user Store access
    affected: ">=0.1.2,<0.15.0"
    fixedIn: ">=0.15.0"
    publishedAt: 2026-09-28
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-4hm6-w6qq-w73v
  - id: GHSA-fvww-7h3r-vfhp (CVE-2026-104873)
    severity: high
    title: LangGraph SDK custom auth silently ignores actions= on resource decorators
    affected: ">= 0.1.45, <= 0.4.3"
    fixedIn: 0.4.4
    publishedAt: 2026-08-28
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-fvww-7h3r-vfhp
  - id: GHSA-47pj-3jcm-6whg (CVE-2026-71433)
    severity: unknown
    title: Namespace prefix matching crosses segment boundaries in Postgres and SQLite stores
    affected: < 3.1.1
    fixedIn: 3.1.1
    publishedAt: 2026-07-30
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-47pj-3jcm-6whg
  - id: GHSA-w39p-vh2g-g8g5 (CVE-2026-48776)
    severity: unknown
    title: Unsafe URL path construction in LangGraph SDK
    affected: <= 0.3.14
    fixedIn: 0.3.15
    publishedAt: 2026-05-22
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-w39p-vh2g-g8g5
  - id: GHSA-fjqc-hq36-qh5p (CVE-2026-48775)
    severity: unknown
    title: Unsafe JSON deserialization in LangGraph checkpoint loading
    affected: <= 4.1.0
    fixedIn: 4.1.1
    publishedAt: 2026-05-22
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-fjqc-hq36-qh5p
  - id: GHSA-g48c-2wqr-h844 (CVE-2026-28277)
    severity: unknown
    title: Unsafe msgpack deserialization in LangGraph checkpoint loading
    affected: <=1.0.9
    fixedIn: 1.0.10
    publishedAt: 2026-03-05
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-g48c-2wqr-h844
  - id: GHSA-mhr3-j7m5-c7c9 (CVE-2026-27794)
    severity: unknown
    title: "ZDI-CAN-28385: LangChain LangGraph BaseCache Deserialization of Untrusted Data Remote Code Execution Vulnerability"
    affected: <4.0.0
    fixedIn: 4.0.0
    publishedAt: 2026-02-23
    url: https://github.com/langchain-ai/langgraph/security/advisories/GHSA-mhr3-j7m5-c7c9
---

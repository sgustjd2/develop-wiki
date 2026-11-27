---
checkedAt: 2026-11-28
latestVersion: v1.1.2
latestReleasedAt: 2026-11-25
versions:
  - version: v1.1.2
    releasedAt: 2026-11-25
    summary: MCP 구독, A2A 에이전트 카드, AWS SigV4 인증, Redis 클러스터 지원을 추가하고 Rust 런타임 사이드카를 제거했다.
    breaking: true
    url: https://github.com/IBM/mcp-context-forge/releases/tag/v1.1.2
  - version: v1.1.1
    releasedAt: 2026-11-10
    summary: 토큰 교환 위임과 CEL 도구 검증 정책, A2A v1 경로 및 보안 강화 기능을 추가했다.
    breaking: true
    url: https://github.com/IBM/mcp-context-forge/releases/tag/v1.1.1
  - version: v1.1.0
    releasedAt: 2026-10-20
    summary: MCP 프로토콜 협상을 기본값으로 설정하고 웹 UI 디자인 변경 및 페이징 기능을 추가했다.
    breaking: true
    url: https://github.com/IBM/mcp-context-forge/releases/tag/v1.1.0
  - version: v1.0.11
    releasedAt: 2026-09-28
    summary: MCP Python SDK 2.x 마이그레이션과 툴 미리보기 기능 및 SSO 연동 제어 기능을 추가했다.
    breaking: true
    url: https://github.com/IBM/mcp-context-forge/releases/tag/v1.0.11
  - version: v1.0.7-20260921
    releasedAt: 2026-09-21
    summary: MCP 페이지네이션 오류를 수정하고 보안 취약점이 있는 컨테이너 및 라이브러리 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/IBM/mcp-context-forge/releases/tag/v1.0.7-20260921
security:
  - id: GHSA-qmfj-jjw4-8qrq
    severity: high
    title: Cross-team A2A agent takeover via missing ownership check in the admin edit route (POST /admin/a2a/{agent_id}/edit)
    affected: <= 1.0.6
    fixedIn: v1.0.7
    publishedAt: 2026-09-07
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-qmfj-jjw4-8qrq
  - id: GHSA-w8vq-gj3v-h664
    severity: unknown
    title: Scoped admin OAuth DCR endpoints ignore token_teams restrictions and expose global registered clients
    affected: < v1.0.8
    fixedIn: v1.0.8
    publishedAt: 2026-09-02
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-w8vq-gj3v-h664
  - id: GHSA-9qxh-fpx5-vxvw
    severity: high
    title: "Parse-gap bypasses in mcp-context-forge: SQL Sanitizer (privesc/DROP/mass-DELETE) and resource_filter SSRF"
    affected: < v1.0.7
    fixedIn: v1.0.7
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-9qxh-fpx5-vxvw
  - id: GHSA-gj7g-7r6g-jc8v
    severity: unknown
    title: Scoped admin OAuth DCR endpoints ignore token_teams restrictions and expose global registered clients
    affected: < v1.0.7
    fixedIn: v1.0.7
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-gj7g-7r6g-jc8v
  - id: GHSA-gv3m-3mvj-w6f2
    severity: critical
    title: Server-Side Request Forgery (SSRF) in url_to_markdown_server via Unvalidated URL Fetching
    affected: < v1.0.7
    fixedIn: v1.0.7
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-gv3m-3mvj-w6f2
  - id: GHSA-578v-pgw5-36gv
    severity: high
    title: Server-Side Request Forgery (SSRF) in mcp-rss-search via Unvalidated URL Fetching
    affected: v1.0.5
    fixedIn: ">=v1.0.7"
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-578v-pgw5-36gv
  - id: GHSA-hxq2-5h3j-jqjv
    severity: unknown
    title: Session auth-context reuse ignores JWT exp — expired JWT replayable within session_auth_reuse_ttl
    affected: < v1.0.5
    fixedIn: v1.0.5
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-hxq2-5h3j-jqjv
  - id: GHSA-55gx-p285-xw7f
    severity: high
    title: Cross-tenant read of plugin-binding policies (BOLA) in ContextForge MCP Gateway
    affected: < v1.0.5
    fixedIn: v1.0.5
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-55gx-p285-xw7f
  - id: GHSA-8pcq-mx48-hjvj
    severity: critical
    title: Default JWT Secret in Docker Compose Enables Forged Platform-Admin Tokens
    affected: < v1.0.7
    fixedIn: v1.0.7
    publishedAt: 2026-08-25
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-8pcq-mx48-hjvj
  - id: GHSA-5424-f25v-29r8
    severity: high
    title: 'ContextForge MCP Gateway: predictable default JWT signing key ("changeme") accepted in the default environment enables authentication bypass'
    affected: <= 1.0.6
    fixedIn: 1.0.7
    publishedAt: 2026-08-24
    url: https://github.com/IBM/mcp-context-forge/security/advisories/GHSA-5424-f25v-29r8
---

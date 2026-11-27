---
checkedAt: 2026-11-28
latestVersion: v4.2.6
latestReleasedAt: 2026-11-25
versions:
  - version: v4.2.6
    releasedAt: 2026-11-25
    summary: 실험적 기능인 CodeModeClient를 추가하고 Authlib를 기본 설치에서 제외했으며 이벤트 기능을 별도 패키지로 분리했다.
    breaking: false
    url: https://github.com/PrefectHQ/fastmcp/releases/tag/v4.2.6
  - version: v4.2.5
    releasedAt: 2026-11-23
    summary: 구독 기반 이벤트 수신 기능과 사용량 기록 미들웨어가 추가되었고 보안 및 버그 수정이 이루어졌다.
    breaking: false
    url: https://github.com/PrefectHQ/fastmcp/releases/tag/v4.2.5
  - version: v4.2.4
    releasedAt: 2026-11-21
    summary: OAuth 토큰 중복 사용 및 무효화된 토큰 재검증 버그를 수정하고 도구 변환 오류 시 해당 도구만 숨기도록 개선했다.
    breaking: true
    url: https://github.com/PrefectHQ/fastmcp/releases/tag/v4.2.4
  - version: v4.2.3
    releasedAt: 2026-11-20
    summary: 백그라운드 작업 추적을 위한 옵션을 추가하고 출력 스키마 변환 및 OpenAPI 유효성 검사 버그를 수정했으며 pydocket 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/PrefectHQ/fastmcp/releases/tag/v4.2.3
  - version: v4.2.2
    releasedAt: 2026-11-18
    summary: 도구 전용 서버 변환 시에도 스킬 탐색이 정상적으로 작동하도록 수정했다.
    breaking: false
    url: https://github.com/PrefectHQ/fastmcp/releases/tag/v4.2.2
security:
  - id: GHSA-78c8-3jhx-5mg7
    severity: unknown
    title: OAuthProxy redeems one authorization code more than once under concurrency
    affected: ">= 2.13.0, <= 4.2.3"
    fixedIn: 4.2.4
    publishedAt: 2026-11-21
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-78c8-3jhx-5mg7
  - id: GHSA-7xgj-8392-5q4r
    severity: unknown
    title: Post-transform component authorization is skipped on direct calls
    affected: ">= 3.0.0, < 3.4.10"
    fixedIn: 3.4.10
    publishedAt: 2026-10-20
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-7xgj-8392-5q4r
  - id: GHSA-vqqp-x5qm-5qp4
    severity: unknown
    title: fastmcp MCP client wrappers construct M2M OAuth providers without issuer binding — client secret redirectable to attacker-advertised authorization server
    affected: ">= 4.0.0a1, < 4.1.2"
    fixedIn: 4.1.2
    publishedAt: 2026-10-20
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-vqqp-x5qm-5qp4
  - id: GHSA-qvjc-pw7p-hvg5
    severity: unknown
    title: OpenAPI components forward undeclared header, cookie, and query arguments, letting clients override configured upstream credentials
    affected: < 3.4.8
    fixedIn: 3.4.8
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-qvjc-pw7p-hvg5
  - id: GHSA-c3q8-4mcq-p7vg
    severity: unknown
    title: Hashed FastMCPApp tool calls bypass disable and allowlist visibility rules
    affected: ">= 3.2.0, < 3.4.8"
    fixedIn: 3.4.8
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-c3q8-4mcq-p7vg
  - id: GHSA-gpgx-58w2-xwwf
    severity: critical
    title: Remote code execution in FastMCP client when parsing a server-supplied tool output schema
    affected: ">= 2.10.0, < 3.4.8"
    fixedIn: 3.4.8
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-gpgx-58w2-xwwf
  - id: GHSA-63pr-7fpf-v477
    severity: unknown
    title: Component manager enable/disable routes skip the server auth provider when required_scopes is unset
    affected: < 3.4.8
    fixedIn: 3.4.8
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-63pr-7fpf-v477
  - id: GHSA-99xm-8q53-5c8p
    severity: unknown
    title: OpenAPI path parameters set to `..` reach other backend routes (incomplete fix for CVE-2026-32871)
    affected: ">= 4.0.0, < 4.1.0"
    fixedIn: 4.1.0
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-99xm-8q53-5c8p
  - id: GHSA-pwp3-fpg3-p53c
    severity: low
    title: Skill providers read a symlinked SKILL.md that points outside its skill folder
    affected: ">= 4.0.0b1, < 4.1.0"
    fixedIn: 4.1.0
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-pwp3-fpg3-p53c
  - id: GHSA-6868-q46w-rmjv
    severity: unknown
    title: host_origin_protection is silently ignored on the SSE transport
    affected: ">= 3.4.3, < 3.4.8"
    fixedIn: 3.4.8
    publishedAt: 2026-10-16
    url: https://github.com/PrefectHQ/fastmcp/security/advisories/GHSA-6868-q46w-rmjv
---

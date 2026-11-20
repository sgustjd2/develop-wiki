---
checkedAt: 2026-11-21
latestVersion: v2.71.0
latestReleasedAt: 2026-11-19
versions:
  - version: v2.71.0
    releasedAt: 2026-11-19
    summary: Stav 및 Otari 게이트웨이 프로바이더를 추가하고 일부 모델과 API 키 사용을 중단했다.
    breaking: false
    url: https://github.com/pydantic/pydantic-ai/releases/tag/v2.71.0
  - version: v2.70.0
    releasedAt: 2026-11-17
    summary: 보안 취약점 해결을 위해 ANSI 이스케이프 시퀀스 및 JWT 패턴 처리 로직을 수정했다.
    breaking: false
    url: https://github.com/pydantic/pydantic-ai/releases/tag/v2.70.0
  - version: v2.69.0
    releasedAt: 2026-11-17
    summary: Gemini 4 Hydrogen 지원 및 GroqModel 서비스 티어 지원을 추가했다.
    breaking: true
    url: https://github.com/pydantic/pydantic-ai/releases/tag/v2.69.0
  - version: v2.68.0
    releasedAt: 2026-11-12
    summary: 응답이 잘릴 경우 다음 모델로 전환하는 기능과 사용자 승인 요청 기능이 추가되었다.
    breaking: false
    url: https://github.com/pydantic/pydantic-ai/releases/tag/v2.68.0
  - version: v2.67.0
    releasedAt: 2026-11-10
    summary: RepoContext의 지시 파일 로드 방식 변경 및 중첩 지시문 글자 수 제한이 추가되었다.
    breaking: false
    url: https://github.com/pydantic/pydantic-ai/releases/tag/v2.67.0
security:
  - id: GHSA-5m5q-5qj4-gx9h
    severity: high
    title: Harness JWT redaction can take quadratic time, blocking the event loop
    affected: ">= 0.16.0, <= 0.69.0"
    fixedIn: 0.70.0
    publishedAt: 2026-11-18
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-5m5q-5qj4-gx9h
  - id: GHSA-m4cr-m4qc-9hh3 (CVE-2026-133161)
    severity: high
    title: Harness `ToolOutputLimits` ANSI stripping can take quadratic time, blocking the event loop
    affected: ">= 0.4.0, <= 0.69.0"
    fixedIn: 0.70.0
    publishedAt: 2026-11-18
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-m4cr-m4qc-9hh3
  - id: GHSA-mgmv-r532-pg36
    severity: unknown
    title: A credential in an MCP server URL path could reach chat frontends through MCP Apps events
    affected: ">= 2.57.0, < 2.60.0"
    fixedIn: 2.60.0
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-mgmv-r532-pg36
  - id: GHSA-jp94-mmr3-2pvv
    severity: unknown
    title: Embedding `extra_headers` and `extra_body` settings are recorded in traces
    affected: ">= 1.39.0, <= 1.107.9"
    fixedIn: 1.107.10
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-jp94-mmr3-2pvv
  - id: GHSA-5ppx-9jq6-6pmw
    severity: low
    title: Domain allowlists in web fetching and PlaywrightBrowser resolved refused hostnames before rejecting them
    affected: ">= 1.77.0, <= 1.107.9"
    fixedIn: 1.107.10
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-5ppx-9jq6-6pmw
  - id: GHSA-mfx5-pc32-32m8
    severity: high
    title: Harness private-key redaction can take exponential time on short input
    affected: ">= 0.16.0, <= 0.65.0"
    fixedIn: 0.66.0
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-mfx5-pc32-32m8
  - id: GHSA-r879-rxgj-3g75
    severity: unknown
    title: UI adapters take quadratic time to load a submitted message with many parts
    affected: ">= 1.9.0, <= 1.107.9"
    fixedIn: 1.107.10
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-r879-rxgj-3g75
  - id: GHSA-484x-x9m4-62cj
    severity: unknown
    title: Decision models expand tool argument schemas without a limit
    affected: ">= 2.46.0, <= 2.65.0"
    fixedIn: 2.66.0
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-484x-x9m4-62cj
  - id: GHSA-7494-925c-rrxv
    severity: unknown
    title: Tool schemas with repeated definition references expand exponentially for models that need inlined schemas
    affected: ">= 0.4.4, <= 1.107.9"
    fixedIn: 1.107.10
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-7494-925c-rrxv
  - id: GHSA-m5vj-8mcw-82qx
    severity: high
    title: Local web fetching can exhaust memory and block the event loop when it formats nested JSON
    affected: ">= 1.77.0, <= 1.107.9"
    fixedIn: 1.107.10
    publishedAt: 2026-11-04
    url: https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-m5vj-8mcw-82qx
---

---
checkedAt: 2026-11-18
latestVersion: "@mastra/core@1.83.0"
latestReleasedAt: 2026-11-13
versions:
  - version: "@mastra/core@1.83.0"
    releasedAt: 2026-11-13
    summary: 모든 에이전트에서 재개 가능한 실행 스트림을 지원하며 MCP 서버와 워크플로우 저장소 버전 2가 추가되었다.
    breaking: true
    url: https://github.com/mastra-ai/mastra/releases/tag/%40mastra/core%401.83.0
  - version: "@mastra/core@1.82.0"
    releasedAt: 2026-11-04
    summary: 지식(Knowledge) v2 모델 도입과 도구 업그레이드 및 서버 API를 통한 외부 콘텐츠 동기화 기능을 추가했다.
    breaking: true
    url: https://github.com/mastra-ai/mastra/releases/tag/%40mastra/core%401.82.0
  - version: "@mastra/core@1.81.0"
    releasedAt: 2026-11-02
    summary: 저장소 기반의 MCP 작업과 비에이전트 소유자를 위한 백그라운드 작업 기능이 추가되었다.
    breaking: true
    url: https://github.com/mastra-ai/mastra/releases/tag/%40mastra/core%401.81.0
  - version: "@mastra/core@1.80.0"
    releasedAt: 2026-10-28
    summary: 사용자별 OAuth 연결 기능과 통합 요청 프롬프트, 스팬 집계 API 및 오류 분류 기능이 추가되었다.
    breaking: true
    url: https://github.com/mastra-ai/mastra/releases/tag/%40mastra/core%401.80.0
  - version: "@mastra/core@1.79.0"
    releasedAt: 2026-10-21
    summary: MCP 이벤트 기능과 관측성 기능이 강화되었으며 세션 관리 방식이 세션 ID 기반으로 변경되었다.
    breaking: true
    url: https://github.com/mastra-ai/mastra/releases/tag/%40mastra/core%401.79.0
security:
  - id: GHSA-8982-g8xm-3x5h
    severity: high
    title: Prototype pollution in normalizeQueryParams allows unauthenticated process-wide state changes (cross-user data exposure, DoS)
    affected: ">= 1.62.0, <= 1.76.0-alpha.6"
    fixedIn: ">= 1.760"
    publishedAt: 2026-10-12
    url: https://github.com/mastra-ai/mastra/security/advisories/GHSA-8982-g8xm-3x5h
  - id: GHSA-xh92-rqrq-227v (CVE-2025-61685)
    severity: unknown
    title: Mastra Docs MCP Server `@mastra/mcp-docs-server` Leads to Information Exposure
    affected: <= 0.13.8
    fixedIn: 0.17.0
    publishedAt: 2025-09-24
    url: https://github.com/mastra-ai/mastra/security/advisories/GHSA-xh92-rqrq-227v
---

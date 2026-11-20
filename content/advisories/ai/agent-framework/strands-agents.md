---
checkedAt: 2026-11-21
latestVersion: typescript/v1.26.0
latestReleasedAt: 2026-11-19
versions:
  - version: typescript/v1.26.0
    releasedAt: 2026-11-19
    summary: 도구 사양 정렬, 할 일 리마인더, OpenAPI 메타데이터 게시 등 다양한 기능이 추가되었다.
    breaking: false
    url: https://github.com/strands-agents/harness-sdk/releases/tag/typescript/v1.26.0
  - version: harness-typescript/v0.5.0
    releasedAt: 2026-11-19
    summary: 도구 사양 정렬, 할 일 리마인더, OpenAPI 메타데이터 게시 기능이 추가되었으며 Anthropic Bedrock 클라이언트의 기본 모델이 Claude Opus 5.5로 변경되었다.
    breaking: false
    url: https://github.com/strands-agents/harness-sdk/releases/tag/harness-typescript/v0.5.0
  - version: harness-cli/v0.4.0
    releasedAt: 2026-11-19
    summary: 도구 사양 정렬, 할 일 알림 간격 추가, Anthropic Bedrock 클라이언트의 기본 모델을 Claude Opus 5.5로 변경했다.
    breaking: false
    url: https://github.com/strands-agents/harness-sdk/releases/tag/harness-cli/v0.4.0
  - version: python/v1.65.0
    releasedAt: 2026-11-13
    summary: 비동기 에이전트 빌더 추가와 HumanInTheLoop 자동 모드 및 다양한 모델 지원 기능을 구현했다.
    breaking: false
    url: https://github.com/strands-agents/harness-sdk/releases/tag/python/v1.65.0
  - version: typescript/v1.25.0
    releasedAt: 2026-11-13
    summary: find_integrations 도구 추가와 HumanInTheLoop 자동 모드 및 SageMakerDecisionModel 등을 지원한다.
    breaking: false
    url: https://github.com/strands-agents/harness-sdk/releases/tag/typescript/v1.25.0
security:
  - id: GHSA-4v6f-7vjh-6x4m (CVE-2026-115419)
    severity: high
    title: Exposure of data element to wrong session in Strands Agents SDK A2A Server
    affected: < 1.43.0
    fixedIn: 1.43.0
    publishedAt: 2026-10-22
    url: https://github.com/strands-agents/harness-sdk/security/advisories/GHSA-4v6f-7vjh-6x4m
  - id: GHSA-3w55-933p-8pv5
    severity: high
    title: Local Privilege Escalation via Symlink Attack in Default Session File Storage
    affected: < 1.48.0
    fixedIn: 1.48.0
    publishedAt: 2026-10-05
    url: https://github.com/strands-agents/harness-sdk/security/advisories/GHSA-3w55-933p-8pv5
  - id: GHSA-763v-5pjm-fx36
    severity: unknown
    title: Default FileSessionManager storage is world-readable on shared systems
    affected: < 1.48.0
    fixedIn: 1.48.0
    publishedAt: 2026-10-05
    url: https://github.com/strands-agents/harness-sdk/security/advisories/GHSA-763v-5pjm-fx36
---

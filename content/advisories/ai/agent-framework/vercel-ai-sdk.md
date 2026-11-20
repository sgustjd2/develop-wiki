---
checkedAt: 2026-11-21
latestVersion: ai@7.0.178
latestReleasedAt: 2026-11-20
versions:
  - version: ai@7.0.178
    releasedAt: 2026-11-20
    summary: generateText와 streamText에서 도구 승인 요청 시 자동 거절된 요청은 서명을 생성하지 않도록 수정했다.
    breaking: false
    url: https://github.com/vercel/ai/releases/tag/ai%407.0.178
  - version: ai@5.0.292
    releasedAt: 2026-11-20
    summary: 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/vercel/ai/releases/tag/ai%405.0.292
  - version: "@ai-sdk/zai@3.0.57"
    releasedAt: 2026-11-20
    summary: provider-utils와 openai-compatible의 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/vercel/ai/releases/tag/%40ai-sdk/zai%403.0.57
  - version: "@ai-sdk/xai@5.0.48"
    releasedAt: 2026-11-20
    summary: 비디오 및 기본 음성 모델 ID를 모델 카탈로그에서 가져오도록 변경했다.
    breaking: false
    url: https://github.com/vercel/ai/releases/tag/%40ai-sdk/xai%405.0.48
  - version: "@ai-sdk/workflow@2.0.110"
    releasedAt: 2026-11-20
    summary: 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/vercel/ai/releases/tag/%40ai-sdk/workflow%402.0.110
security:
  - id: GHSA-g3x3-7q3h-gmhj
    severity: unknown
    title: AI SDK ACP Harness Host Tool Relay Authorization Bypass
    affected: ">= 1.0.0"
    fixedIn: 1.0.77
    publishedAt: 2026-10-01
    url: https://github.com/vercel/ai/security/advisories/GHSA-g3x3-7q3h-gmhj
  - id: GHSA-4mqq-99j3-3hmv
    severity: high
    title: AI SDK Harness session resume can expose host credentials to sandboxed code
    affected: < 1.0.135
    fixedIn: 1.0.135
    publishedAt: 2026-09-28
    url: https://github.com/vercel/ai/security/advisories/GHSA-4mqq-99j3-3hmv
  - id: GHSA-222v-gj5h-ff73
    severity: high
    title: Sandbox path traversal in Cline harness file tools
    affected: ">= 1.0.0, < 1.0.8"
    fixedIn: 1.0.8
    publishedAt: 2026-08-20
    url: https://github.com/vercel/ai/security/advisories/GHSA-222v-gj5h-ff73
  - id: GHSA-vmqp-7rwf-cq3w
    severity: unknown
    title: AI SDK OpenCode Harness Unauthenticated Loopback Control API
    affected: <= 1.0.72
    fixedIn: 1.0.73
    publishedAt: 2026-08-14
    url: https://github.com/vercel/ai/security/advisories/GHSA-vmqp-7rwf-cq3w
  - id: GHSA-g48p-5rr5-8rgq (CVE-2026-64651)
    severity: unknown
    title: AI SDK OpenCode Harness Tool Relay Authorization Bypass
    affected: <= 1.0.27
    fixedIn: 1.0.28
    publishedAt: 2026-07-20
    url: https://github.com/vercel/ai/security/advisories/GHSA-g48p-5rr5-8rgq
  - id: GHSA-qw9h-448j-6rph (CVE-2026-64650)
    severity: unknown
    title: AI SDK Codex Harness Tool Relay Authorization Bypass
    affected: <= 1.0.28
    fixedIn: 1.0.29
    publishedAt: 2026-07-20
    url: https://github.com/vercel/ai/security/advisories/GHSA-qw9h-448j-6rph
---

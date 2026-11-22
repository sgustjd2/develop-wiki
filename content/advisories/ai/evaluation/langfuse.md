---
checkedAt: 2026-11-23
latestVersion: v4.83.0
latestReleasedAt: 2026-11-19
versions:
  - version: v4.83.0
    releasedAt: 2026-11-19
    summary: Scatter 뷰 추가와 MCP 프로토콜 업데이트 및 AI 게이트웨이의 지출 한도 설정 기능 등을 도입했다.
    breaking: false
    url: https://github.com/langfuse/langfuse/releases/tag/v4.83.0
  - version: v4.82.0
    releasedAt: 2026-11-17
    summary: API 키 프리셋 추가와 감사 로그 읽기 기능이 추가되었고 SSO 보안 취약점과 LLM 연결 오류 등을 수정했다.
    breaking: false
    url: https://github.com/langfuse/langfuse/releases/tag/v4.82.0
  - version: v4.81.0
    releasedAt: 2026-11-16
    summary: 데이터셋 상태 필터링, Google Vertex AI 지원, 세션 커스텀 뷰 저장 등 다양한 기능이 추가되고 여러 버그가 수정되었다.
    breaking: false
    url: https://github.com/langfuse/langfuse/releases/tag/v4.81.0
  - version: v4.80.0
    releasedAt: 2026-11-13
    summary: Google AI Studio와 Microsoft Azure를 게이트웨이 제공업체로 추가하고 스킬 크기 및 파일 수 제한을 설정 가능하게 변경했다.
    breaking: false
    url: https://github.com/langfuse/langfuse/releases/tag/v4.80.0
  - version: v4.79.0
    releasedAt: 2026-11-12
    summary: OpenRouter와 xAI 및 Vercel AI Gateway를 정식 지원하고 프로젝트 생성 시 기본 점수 설정을 제공한다.
    breaking: false
    url: https://github.com/langfuse/langfuse/releases/tag/v4.79.0
security:
  - id: GHSA-2524-j966-gfgh (CVE-2026-41487)
    severity: low
    title: Improper role-based-access control in Langfuse LLM connection management allowed users of role “member” to retrieve stored LLM provider API keys
    affected: ">= 3.68.0, < 3.167.0"
    fixedIn: ">= 3.167.0"
    publishedAt: 2026-04-17
    url: https://github.com/langfuse/langfuse/security/advisories/GHSA-2524-j966-gfgh
  - id: GHSA-pvq7-vvfj-p98x (CVE-2026-24055)
    severity: unknown
    title: Unauthenticated Slack OAuth Install Allows Linking Slack to Arbitrary Project Improper Access Control)
    affected: ">=3.89.0, <= v3.146.0"
    fixedIn: v3.147.0
    publishedAt: 2026-01-21
    url: https://github.com/langfuse/langfuse/security/advisories/GHSA-pvq7-vvfj-p98x
  - id: GHSA-w9pw-c549-5m6w (CVE-2025-65107)
    severity: unknown
    title: SSO Account Takeover via CSRF or phishing attack
    affected: ">= 3.17.0, <3.131.0"
    fixedIn: 3.131.0
    publishedAt: 2025-11-19
    url: https://github.com/langfuse/langfuse/security/advisories/GHSA-w9pw-c549-5m6w
  - id: GHSA-94hf-6gqq-pj69 (CVE-2025-64504)
    severity: unknown
    title: Cross‑organization enumeration of member & invitation lists via project membership APIs
    affected: ">=2.70.0, <3.124.1"
    fixedIn: 3.124.1
    publishedAt: 2025-11-09
    url: https://github.com/langfuse/langfuse/security/advisories/GHSA-94hf-6gqq-pj69
---

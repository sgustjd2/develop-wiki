---
checkedAt: 2026-11-19
latestVersion: v3.2.1
latestReleasedAt: 2026-11-17
versions:
  - version: v3.2.1
    releasedAt: 2026-11-17
    summary: 세션 압축 조회 및 회사 파일 읽기 기능이 추가되었고 도구들의 타임아웃과 검색 오류 처리 등이 개선되었다.
    breaking: false
    url: https://github.com/agno-agi/agno/releases/tag/v3.2.1
  - version: v3.2.0
    releasedAt: 2026-11-12
    summary: OSManager 기본값이 변경되고 A2A 프로토콜이 v1.0으로 업그레이드되었으며 Slack 인터페이스가 Bolt SDK를 사용하도록 업데이트되었다.
    breaking: true
    url: https://github.com/agno-agi/agno/releases/tag/v3.2.0
  - version: v3.1.12
    releasedAt: 2026-10-29
    summary: Harness Agent의 승인 요청이 AgentOS UI에 표시되며 CodexAgent의 기본 승인 정책이 변경되었다.
    breaking: true
    url: https://github.com/agno-agi/agno/releases/tag/v3.1.12
  - version: v3.1.11
    releasedAt: 2026-10-27
    summary: ClaudeAgent와 CodexAgent를 팀과 워크플로우의 구성원으로 사용할 수 있으며 세션 검색 및 회사 작업 관리 기능이 추가되었다.
    breaking: false
    url: https://github.com/agno-agi/agno/releases/tag/v3.1.11
  - version: v3.1.10
    releasedAt: 2026-10-23
    summary: CodexAgent 자동 로그인과 OS Manager의 외부 에이전트 실행 기능이 추가되었고 지식 업로드 오류 수정 및 트레이싱 속성이 개선되었다.
    breaking: false
    url: https://github.com/agno-agi/agno/releases/tag/v3.1.10
security:
  - id: GHSA-w9j5-7p53-pvr3 (CVE-2026-10105)
    severity: high
    title: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection') in agno
    affected: < 2.8.5
    fixedIn: 2.8.5
    publishedAt: 2026-07-27
    url: https://github.com/agno-agi/agno/security/advisories/GHSA-w9j5-7p53-pvr3
  - id: GHSA-m4w4-3r8h-jw98 (CVE-2026-35002)
    severity: critical
    title: Arbitrary code execution via eval() on field_type in FunctionCall (CWE-95)
    affected: < 2.3.24
    fixedIn: 2.3.24
    publishedAt: 2026-06-30
    url: https://github.com/agno-agi/agno/security/advisories/GHSA-m4w4-3r8h-jw98
  - id: GHSA-vw84-hprm-cxmm (CVE-2025-64168)
    severity: high
    title: Session state overwrites between different sessions/users
    affected: ">2, <2.2.2"
    fixedIn: 2.2.2
    publishedAt: 2025-10-31
    url: https://github.com/agno-agi/agno/security/advisories/GHSA-vw84-hprm-cxmm
---

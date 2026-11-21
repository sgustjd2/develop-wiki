---
checkedAt: 2026-11-22
latestVersion: v4.1.27
latestReleasedAt: 2026-11-21
versions:
  - version: v4.1.27
    releasedAt: 2026-11-21
    summary: LM Studio 인증 필드 추가, MCP 읽기 전용 배지 표시, 모델 목록 새로고침 및 모델 카탈로그 업데이트를 수행했다.
    breaking: false
    url: https://github.com/cline/cline/releases/tag/v4.1.27
  - version: sdk/sdk/v0.2.1
    releasedAt: 2026-11-21
    summary: read_files 결과의 용량 제한이 8k에서 50k로 늘어났고 추론 기능 관련 오류를 수정했다.
    breaking: false
    url: https://github.com/cline/cline/releases/tag/sdk/sdk/v0.2.1
  - version: desktop-v0.0.50
    releasedAt: 2026-11-21
    summary: 추론 강도 설정 추가와 요약 중단 기능 개선 및 파일 읽기 글자 수 제한을 확대했다.
    breaking: false
    url: https://github.com/cline/cline/releases/tag/desktop-v0.0.50
  - version: cli-v3.0.75
    releasedAt: 2026-11-21
    summary: 원샷 실행 시 yolo 모드가 기본 적용되며 파일 읽기 제한이 늘어났다.
    breaking: false
    url: https://github.com/cline/cline/releases/tag/cli-v3.0.75
  - version: v4.1.26
    releasedAt: 2026-10-26
    summary: 클라우드 작업 설정에 로컬/클라우드 토글이 추가되고 모델 목록과 기본 모델이 업데이트되었다.
    breaking: false
    url: https://github.com/cline/cline/releases/tag/v4.1.26
security:
  - id: GHSA-3cj3-hqcr-g934 (CVE-2026-59723)
    severity: high
    title: Cross-Origin WebSocket Hijacking in Cline Hub Dashboard (`/browser` endpoint)
    affected: <= 3.0.24
    publishedAt: 2026-06-23
    url: https://github.com/cline/cline/security/advisories/GHSA-3cj3-hqcr-g934
  - id: GHSA-5c57-rqjx-35g2 (CVE-2026-44211)
    severity: critical
    title: Cross-Origin WebSocket Hijack in Cline Kanban Server
    affected: <v2.13.0
    publishedAt: 2026-05-08
    url: https://github.com/cline/cline/security/advisories/GHSA-5c57-rqjx-35g2
  - id: GHSA-9ppg-jx86-fqw7
    severity: low
    title: Unauthorized npm publish of Cline CLI cline@2.3.0 with modified postinstall script to install openclaw
    affected: 2.3.0
    fixedIn: ">=2.4.0"
    publishedAt: 2026-02-17
    url: https://github.com/cline/cline/security/advisories/GHSA-9ppg-jx86-fqw7
---

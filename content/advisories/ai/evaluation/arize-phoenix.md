---
checkedAt: 2026-11-22
latestVersion: arize-phoenix-v22.0.0
latestReleasedAt: 2026-11-20
versions:
  - version: arize-phoenix-v22.0.0
    releasedAt: 2026-11-20
    summary: 비용 추적 기능에 생성형 모델 유형 및 임베딩 모델 가격 동기화 기능을 추가하고 데이터베이스 관련 버그를 수정했다.
    breaking: false
    url: https://github.com/Arize-ai/phoenix/releases/tag/arize-phoenix-v22.0.0
  - version: arize-phoenix-v21.3.0
    releasedAt: 2026-11-20
    summary: 데이터셋 레이블 지정 명령 추가와 모델 토큰 가격 및 Bedrock 가격 업데이트를 수행했다.
    breaking: false
    url: https://github.com/Arize-ai/phoenix/releases/tag/arize-phoenix-v21.3.0
  - version: arize-phoenix-v21.2.1
    releasedAt: 2026-11-19
    summary: Phoenix 릴리스 노트를 추가하고 phoenix-harbor가 Harbor 태스크와 검증기를 구축하도록 하는 기능을 추가했다.
    breaking: false
    url: https://github.com/Arize-ai/phoenix/releases/tag/arize-phoenix-v21.2.1
  - version: "@arizeai/phoenix-otel@3.1.1"
    releasedAt: 2026-11-19
    summary: 패키지 README에서 Slack 커뮤니티 링크를 제거하고 의존성을 업데이트했다.
    breaking: false
    url: https://github.com/Arize-ai/phoenix/releases/tag/%40arizeai/phoenix-otel%403.1.1
  - version: "@arizeai/phoenix-evals@2.8.1"
    releasedAt: 2026-11-19
    summary: 패키지 README에서 Slack 커뮤니티 링크를 제거했다.
    breaking: false
    url: https://github.com/Arize-ai/phoenix/releases/tag/%40arizeai/phoenix-evals%402.8.1
security:
  - id: GHSA-gfv3-m769-5xm3 (CVE-2026-53998)
    severity: critical
    title: Format String Injection in applyChatTemplate
    affected: ">= 13.0.0"
    fixedIn: v15.7.0
    publishedAt: 2026-11-09
    url: https://github.com/Arize-ai/phoenix/security/advisories/GHSA-gfv3-m769-5xm3
---

---
checkedAt: 2026-11-18
latestReleasedAt: 2026-11-17
versions:
  - version: langchain-openai==1.8.1
    releasedAt: 2026-11-17
    summary: done 이벤트에서 함수 호출 인자를 복구하도록 수정했다.
    breaking: false
    url: https://github.com/langchain-ai/langchain/releases/tag/langchain-openai%3D%3D1.8.1
  - version: langchain-core==1.8.2
    releasedAt: 2026-11-17
    summary: langsmith_gateway에 headers를 추가하고 프록시를 무시하며 스키마 생성 시 경고 필터 경합 문제를 수정했다.
    breaking: false
    url: https://github.com/langchain-ai/langchain/releases/tag/langchain-core%3D%3D1.8.2
  - version: langchain-xai==1.4.0
    releasedAt: 2026-11-15
    summary: ChatXAI의 LangSmith 게이트웨이 경로를 추가하고 추론 토큰 포함 시 전체 토큰 수를 재계산하도록 수정했다.
    breaking: false
    url: https://github.com/langchain-ai/langchain/releases/tag/langchain-xai%3D%3D1.4.0
  - version: langchain-mistralai==1.2.0
    releasedAt: 2026-11-15
    summary: 추론 모델의 스트리밍 동작을 수정하고 ChatMistralAI의 LangSmith 게이트웨이 경로를 추가했다.
    breaking: false
    url: https://github.com/langchain-ai/langchain/releases/tag/langchain-mistralai%3D%3D1.2.0
  - version: langchain-groq==1.2.0
    releasedAt: 2026-11-15
    summary: ChatGroq의 LangSmith 게이트웨이 경로 추가와 성능 서비스 티어 및 ContextOverflowError 매핑 기능을 추가했다.
    breaking: false
    url: https://github.com/langchain-ai/langchain/releases/tag/langchain-groq%3D%3D1.2.0
security:
  - id: GHSA-gr75-jv2w-4656 (CVE-2026-55443)
    severity: unknown
    title: Path traversal and sandbox escape in LangChain file-search middleware and loaders
    affected: <= 1.3.8
    fixedIn: 1.3.9
    publishedAt: 2026-06-12
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-gr75-jv2w-4656
  - id: GHSA-pjwx-r37v-7724 (CVE-2026-44843)
    severity: high
    title: Unsafe deserialization of attacker-controlled LangChain objects through overly broad `load()` allowlists
    affected: <=1.3.2,>=1
    fixedIn: 1.3.3
    publishedAt: 2026-05-05
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-pjwx-r37v-7724
  - id: GHSA-r7w7-9xr2-qq2r (CVE-2026-41488)
    severity: low
    title: Image token counting SSRF protection can be bypassed via DNS rebinding
    affected: <1.1.14
    fixedIn: ">=1.1.14"
    publishedAt: 2026-04-16
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-r7w7-9xr2-qq2r
  - id: GHSA-fv5p-p927-qmxr (CVE-2026-41481)
    severity: unknown
    title: HTMLHeaderTextSplitter.split_text_from_url SSRF Redirect Bypass
    affected: <1.1.2
    fixedIn: ">=1.1.2"
    publishedAt: 2026-04-16
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-fv5p-p927-qmxr
  - id: GHSA-926x-3r5x-gfhw (CVE-2026-40087)
    severity: unknown
    title: Incomplete f-string validation in prompt templates
    affected: <0.3.83
    fixedIn: 0.3.84
    publishedAt: 2026-04-08
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-926x-3r5x-gfhw
  - id: GHSA-qh6h-p6c9-ff54 (CVE-2026-34070)
    severity: high
    title: Path traversal in legacy `load_prompt` functions in `langchain-core` (CWE-22)
    affected: <1.2.22
    fixedIn: ">=1.2.22"
    publishedAt: 2026-03-26
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-qh6h-p6c9-ff54
  - id: GHSA-2g6r-c272-w58r (CVE-2026-26013)
    severity: low
    title: SSRF via image_url token counting in ChatOpenAI.get_num_tokens_from_messages
    affected: 0.3.81
    publishedAt: 2026-02-10
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-2g6r-c272-w58r
  - id: GHSA-c67j-w6g6-q2cm (CVE-2025-68664)
    severity: critical
    title: LangChain serialization injection vulnerability enables secret extraction in dumps/loads APIs
    affected: < 1.2.5, >= 1.0.0
    fixedIn: 1.2.5
    publishedAt: 2025-12-23
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-c67j-w6g6-q2cm
  - id: GHSA-6qv9-48xg-fc7f (CVE-2025-65106)
    severity: high
    title: Template Injection via Attribute Access in Prompt Templates
    affected: <1.0.6,>=1.0.0
    fixedIn: 1.0.7
    publishedAt: 2025-11-19
    url: https://github.com/langchain-ai/langchain/security/advisories/GHSA-6qv9-48xg-fc7f
---

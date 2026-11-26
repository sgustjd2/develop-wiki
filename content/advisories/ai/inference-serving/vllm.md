---
checkedAt: 2026-11-27
latestVersion: v0.34.0
latestReleasedAt: 2026-11-16
versions:
  - version: v0.34.0
    releasedAt: 2026-11-16
    summary: Mistral Large 4 등 10종의 모델이 추가되고 확장형 KV 캐시가 기본 적용되며 블록 크기 기본값이 64로 변경되었다.
    breaking: true
    url: https://github.com/vllm-project/vllm/releases/tag/v0.34.0
  - version: v0.33.0rc3
    releasedAt: 2026-11-02
    summary: PyTorch 2.14로 업그레이드되었으며 CUDA 12.9 지원이 중단되고 CUDA 13.0만 지원한다.
    breaking: true
    url: https://github.com/vllm-project/vllm/releases/tag/v0.33.0rc3
  - version: v0.32.0
    releasedAt: 2026-10-18
    summary: 새로운 모델 지원과 저정밀도 KV 캐시 기능 및 Model Runner V2가 추가되었다.
    breaking: true
    url: https://github.com/vllm-project/vllm/releases/tag/v0.32.0
  - version: v0.31.0
    releasedAt: 2026-10-05
    summary: vllm preload CLI를 통한 빠른 재시작 기능과 모델 러너 V2 기반의 추측적 디코딩을 지원한다.
    breaking: true
    url: https://github.com/vllm-project/vllm/releases/tag/v0.31.0
  - version: v0.30.0
    releasedAt: 2026-09-22
    summary: Fast Start 기능이 FP4 체크포인트와 멀티 노드 TP를 지원하며 워터마킹 기능이 추가되었다.
    breaking: true
    url: https://github.com/vllm-project/vllm/releases/tag/v0.30.0
security:
  - id: GHSA-xgh8-qwjh-q853
    severity: unknown
    title: /v1/systemone bypasses the --trust-request-chat-template gate
    affected: ">= 0.32.0rc0, <= 0.34.0"
    fixedIn: 0.34.0
    publishedAt: 2026-11-18
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-xgh8-qwjh-q853
  - id: GHSA-qrj2-j723-m6w8
    severity: unknown
    title: vLLM Speculators Config verifier.name_or_path Element Directory Traversal Information Disclosure Vulnerability
    affected: < 0.33.0
    fixedIn: 0.33.0
    publishedAt: 2026-11-02
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-qrj2-j723-m6w8
  - id: GHSA-894j-wg8m-63h8
    severity: unknown
    title: "vLLM OpenCVDynamicOpenPanguVideoBackend: request-level num_frames without a ceiling — unauthenticated memory/CPU exhaustion (OOM-kill) on any video-capable depl"
    affected: ">= 0.30.0, < 0.31.0"
    fixedIn: 0.31.0
    publishedAt: 2026-10-27
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-894j-wg8m-63h8
  - id: GHSA-vvpg-rrww-wpmh (CVE-2026-115917)
    severity: low
    title: Permissive default CORS origins allow cross-origin requests to the vLLM HTTP server
    affected: "All versions (default config) "
    fixedIn: 0.32.0
    publishedAt: 2026-10-20
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-vvpg-rrww-wpmh
  - id: GHSA-8397-8qf6-f2gm (CVE-2026-115913)
    severity: unknown
    title: "Phi-4 multimodal audio encoder materializes and retains full attention matrices: a single max-length audio OOM-crashes the vLLM engine"
    affected: 0.31.0
    fixedIn: 0.32.0
    publishedAt: 2026-10-20
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-8397-8qf6-f2gm
  - id: GHSA-h3rc-j82p-2c3h (CVE-2026-115915)
    severity: high
    title: Untrusted EPS inputs can trigger denial of service or Ghostscript RCE in vLLM
    affected: 0.30.0
    fixedIn: 0.32.0
    publishedAt: 2026-10-20
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-h3rc-j82p-2c3h
  - id: GHSA-q97c-p368-75c4 (CVE-2026-115916)
    severity: unknown
    title: Out-of-vocabulary prompt token id passes input validation and triggers a CUDA device-side assert (engine crash / DoS)
    affected: <= 0.31.0
    fixedIn: 0.32.0
    publishedAt: 2026-10-20
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-q97c-p368-75c4
  - id: GHSA-gq5q-89c7-vhvx (CVE-2026-115914)
    severity: unknown
    title: "DeepSeek-OCR family: an image whose normalized pixels sum to exactly 0 makes embed_multimodal return None, tripping the encoder-output sanity assert — one unaut"
    affected: 0.30.0
    fixedIn: 0.32.0
    publishedAt: 2026-10-20
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-gq5q-89c7-vhvx
  - id: GHSA-6cxc-2vcg-w5qc
    severity: low
    title: V1 InputBatch.condense leaves a stale allowed_token_ids mask on recycled batch rows
    affected: < 0.31.0
    fixedIn: ">= 0.31.0"
    publishedAt: 2026-10-06
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-6cxc-2vcg-w5qc
  - id: GHSA-p92p-rxj5-7p2x (CVE-2026-114050)
    severity: unknown
    title: "Forged multimodal UUID + P0/P1 processor-cache eviction drift: unauthenticated remote crash of the whole vLLM engine"
    affected: < 0.31.0
    fixedIn: ">= 0.31.0"
    publishedAt: 2026-10-06
    url: https://github.com/vllm-project/vllm/security/advisories/GHSA-p92p-rxj5-7p2x
---

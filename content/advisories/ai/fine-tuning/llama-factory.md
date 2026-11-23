---
checkedAt: 2026-11-24
latestVersion: v0.9.5
latestReleasedAt: 2026-05-30
versions:
  - version: v0.9.5
    releasedAt: 2026-05-30
    summary: Qwen3.5/3.6, Gemma4, Phi-4-mini, LiquidAI LFM2.5, Hunyuan 등 다양한 모델 지원을 추가하고 FP8 및 데이터셋 인터리브 기능을 개선했다.
    breaking: false
    url: https://github.com/hiyouga/LlamaFactory/releases/tag/v0.9.5
  - version: v0.9.4
    releasedAt: 2025-12-31
    summary: 저장소 이름이 LlamaFactory로 변경되었고 Python 3.11–3.13이 필수이며 uv로 패키지 관리 방식이 변경되었다.
    breaking: true
    url: https://github.com/hiyouga/LlamaFactory/releases/tag/v0.9.4
  - version: v0.9.3
    releasedAt: 2025-06-16
    summary: Llama 4, Qwen3, Gemma 3 등 신규 모델을 추가하고 SGLang 및 vLLM 추론 기능을 지원한다.
    breaking: false
    url: https://github.com/hiyouga/LlamaFactory/releases/tag/v0.9.3
  - version: v0.9.2
    releasedAt: 2025-03-11
    summary: APOLLO 옵티마이저, SwanLab, Ray Trainer 및 vLLM 배치 추론 등 다양한 기능을 추가하고 신규 모델과 데이터셋을 지원한다.
    breaking: false
    url: https://github.com/hiyouga/LlamaFactory/releases/tag/v0.9.2
  - version: v0.9.1
    releasedAt: 2024-11-24
    summary: Llama-3.2, LLaVA-NeXT, Qwen2.5 등 신규 모델을 지원하고 멀티 이미지 추론 및 모델 허브 다운로드 기능을 추가했다.
    breaking: false
    url: https://github.com/hiyouga/LlamaFactory/releases/tag/v0.9.1
security:
  - id: GHSA-527m-2xhr-j27g (CVE-2025-61784)
    severity: high
    title: Critical SSRF and LFI Vulnerabilities in LLaMA Factory's Chat API
    affected: <=0.9.3
    fixedIn: 0.9.4
    publishedAt: 2025-10-07
    url: https://github.com/hiyouga/LlamaFactory/security/advisories/GHSA-527m-2xhr-j27g
  - id: GHSA-xj56-p8mm-qmxj (CVE-2025-53002)
    severity: high
    title: LLaMA-Factory Remote Code Execution (RCE) Vulnerability
    affected: <=0.9.3
    fixedIn: 0.9.4
    publishedAt: 2025-06-26
    url: https://github.com/hiyouga/LlamaFactory/security/advisories/GHSA-xj56-p8mm-qmxj
  - id: GHSA-f2f7-gj54-6vpv (CVE-2025-46567)
    severity: unknown
    title: Arbitrary Code Execution via Unsafe Deserialization in Ilamafy_baichuan2.py
    affected: <=0.9.2
    fixedIn: 0.9.3
    publishedAt: 2025-04-23
    url: https://github.com/hiyouga/LlamaFactory/security/advisories/GHSA-f2f7-gj54-6vpv
  - id: GHSA-hj3w-wrh4-44vp (CVE-2024-52803)
    severity: high
    title: Llama Factory Remote OS Command Injection Vulnerability
    affected: <=0.9.0
    fixedIn: 0.9.1
    publishedAt: 2024-11-21
    url: https://github.com/hiyouga/LlamaFactory/security/advisories/GHSA-hj3w-wrh4-44vp
---

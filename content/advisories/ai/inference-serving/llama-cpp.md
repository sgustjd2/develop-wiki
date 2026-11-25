---
checkedAt: 2026-11-26
versions: []
security:
  - id: GHSA-j8rj-fmpv-wcxw (CVE-2026-34159)
    severity: critical
    title: Unauthenticated RCE via GRAPH_COMPUTE buffer=0 bypass in llama.cpp RPC backend
    affected: <= b7991
    publishedAt: 2026-03-26
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-j8rj-fmpv-wcxw
  - id: GHSA-96jg-mvhq-q7q7 (CVE-2026-33298)
    severity: high
    title: Heap Buffer Overflow via Integer Overflow in GGUF Tensor Parsing
    affected: < b7437
    fixedIn: b7824
    publishedAt: 2026-03-18
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-96jg-mvhq-q7q7
  - id: GHSA-3p4r-fq3f-q74v (CVE-2026-27940)
    severity: high
    title: Heap Buffer Overflow via Integer Overflow in `mem_size` Calculation — Bypass of CVE-2025-53630 Fix
    affected: <= b8145
    fixedIn: ">= b8146"
    publishedAt: 2026-03-12
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-3p4r-fq3f-q74v
  - id: GHSA-8947-pfff-2f3c (CVE-2026-21869)
    severity: low
    title: Out-of-bounds Write in llama.cpp llama-server
    affected: <= 55d4206c8
    fixedIn: ">= c78fb90"
    publishedAt: 2026-01-05
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-8947-pfff-2f3c
  - id: GHSA-vgg9-87g3-85w8 (CVE-2025-53630)
    severity: high
    title: Integer Overflow in GGUF Parser can lead to Heap Out-of-Bounds Read/Write in gguf
    affected: <26a48ad
    fixedIn: 26a48ad
    publishedAt: 2025-07-10
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-vgg9-87g3-85w8
  - id: GHSA-g4cc-763q-h9h6
    severity: unknown
    title: Heap-based Buffer Over-read in llama_model_load
    affected: c33fe8b8
    fixedIn: c33fe8b8
    publishedAt: 2025-06-25
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-g4cc-763q-h9h6
  - id: GHSA-7rxv-5jhh-j6xx (CVE-2025-52566)
    severity: high
    title: Tokenizer signed vs. unsigned heap overflow
    affected: <b5721
    fixedIn: b5721
    publishedAt: 2025-06-23
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-7rxv-5jhh-j6xx
  - id: GHSA-8wwf-w4qm-gpqr (CVE-2025-49847)
    severity: high
    title: Buffer Overflow in llama.cpp via Malicious GGUF Model – Exploitable via Vocabulary Loading (`llama_vocab::impl::token_to_piece`)
    affected: All versions before patch
    fixedIn: ">= b5662"
    publishedAt: 2025-06-14
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-8wwf-w4qm-gpqr
  - id: GHSA-wcr5-566p-9cwj (CVE-2024-42479)
    severity: critical
    title: Write-what-where in rpc_server::set_tensor
    affected: < b3561
    fixedIn: ">= b3561"
    publishedAt: 2024-08-12
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-wcr5-566p-9cwj
  - id: GHSA-5vm9-p64x-gqw9 (CVE-2024-42478)
    severity: unknown
    title: Arbitrary Address Read in rpc_server::get_tensor
    affected: < b3561
    fixedIn: ">= b3561"
    publishedAt: 2024-08-12
    url: https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-5vm9-p64x-gqw9
---

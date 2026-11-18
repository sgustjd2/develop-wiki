---
name: Llama Guard 3 8B
org: Meta
family: Llama Guard
type: guard
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 8
license: Llama 3.1 Community License
commercialUse: restricted
korean: unknown
releaseDate: 2024-07-23
huggingface: https://huggingface.co/meta-llama/Llama-Guard-3-8B
summary: 사용자 프롬프트와 모델 응답이 안전한지 판정하고 위반 카테고리를 출력하는 가드레일 모델.
useCases:
  - LLM 서비스 입력/출력 필터링
  - 안전 정책 위반 로그 분류
strengths:
  - MLCommons 위험 분류 체계에 맞춘 카테고리 출력
limitations:
  - 정책이 고정적이라 자체 정책 적용엔 프롬프트 수정·추가 학습 필요
sources:
  - https://huggingface.co/meta-llama/Llama-Guard-3-8B
verifiedAt: 2026-11-18
---

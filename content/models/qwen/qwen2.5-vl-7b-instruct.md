---
name: Qwen2.5-VL-7B-Instruct
org: Alibaba Qwen
family: Qwen2.5-VL
type: vlm
thinking: none
modalities: { input: [text, image, video], output: [text] }
architecture: dense
paramsB: 8.3
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-01-26
huggingface: https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct
summary: 이미지·영상·문서를 이해하는 7B급 VLM. 객체 위치(바운딩 박스)를 좌표로 답할 수 있다.
useCases:
  - 스크린샷·차트·문서 이미지 질의응답
  - 이미지 속 객체 위치 추출
  - 영상 요약
strengths:
  - Apache-2.0 이고 단일 GPU에서 실행 가능
limitations:
  - 고해상도·긴 영상은 시각 토큰이 많아 메모리 사용이 큼
  - 후속 Qwen3-VL(2025-09, 8B 는 2025-10)과 네이티브 멀티모달 Qwen3.5 이후 세대가 공개돼 신규 도입이라면 후속 모델 검토 필요
capabilities: [grounding, structured-output]
sources:
  - https://huggingface.co/Qwen/Qwen3.5-27B
  - https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct
  - https://qwenlm.github.io/blog/qwen2.5-vl/
  - https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct
verifiedAt: 2026-11-18
---

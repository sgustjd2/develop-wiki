---
name: FLUX.2 [dev]
org: Black Forest Labs
family: FLUX.2
type: image-gen
thinking: none
modalities: { input: [text, image], output: [image] }
architecture: diffusion
paramsB: 32.2
license: FLUX [dev] Non-Commercial License
commercialUse: not-allowed
korean: unknown
releaseDate: 2025-11-25
huggingface: https://huggingface.co/black-forest-labs/FLUX.2-dev
summary: 텍스트 기반 이미지 생성과 단일·다중 참조 편집을 하나로 처리하는 32B rectified flow 트랜스포머.
useCases:
  - 캐릭터·물체·스타일 참조를 파인튜닝 없이 유지하는 이미지 생성 연구
  - ComfyUI 기반 고품질 이미지 생성·편집 워크플로 실험
strengths:
  - 가이던스 증류로 추론 효율 개선
  - 4비트 양자화와 원격 텍스트 인코더로 RTX 4090 급에서도 실행 예시 제공
  - Diffusers·ComfyUI 지원
limitations:
  - 모델 자체의 상업 이용은 비허용(생성 출력물은 라이선스 조건에 따라 상업 이용 가능)
  - 32B 라 원본 정밀도로는 대용량 GPU 필요
  - Apache-2.0 이 필요하면 같은 계열의 FLUX.2 [klein] 4B 를 검토
capabilities: []
sources:
  - https://huggingface.co/black-forest-labs/FLUX.2-dev
  - https://bfl.ai/blog/flux-2
verifiedAt: 2026-11-18
---

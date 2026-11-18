---
name: FLUX.2 [klein] 4B
org: Black Forest Labs
family: FLUX.2
type: image-gen
thinking: none
modalities: { input: [text, image], output: [image] }
architecture: diffusion
paramsB: 3.9
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-01-15
huggingface: https://huggingface.co/black-forest-labs/FLUX.2-klein-4B
summary: 생성과 다중 참조 편집을 한 모델로 처리하는 4B 증류 이미지 모델. 1초 미만 생성을 목표로 한 FLUX.2 계열의 경량판이다.
useCases:
  - 사용자 입력에 즉시 반응해야 하는 실시간 이미지 생성·편집 기능
  - RTX 3090/4070 급 소비자 GPU에서의 로컬 이미지 생성
strengths:
  - Apache-2.0 로 상업 이용 가능
  - 약 13GB VRAM 으로 실행
  - 파인튜닝용 비증류 base 체크포인트와 9B 변형도 공개
limitations:
  - 9B 변형(FLUX.2-klein-9B)은 비상업 라이선스라 4B 와 조건이 다름
capabilities: []
sources:
  - https://huggingface.co/black-forest-labs/FLUX.2-klein-4B
  - https://bfl.ai/blog/flux2-klein-towards-interactive-visual-intelligence
verifiedAt: 2026-11-18
---

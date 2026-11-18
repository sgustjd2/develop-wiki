---
name: Qwen-Image-2.1
org: Alibaba Qwen
family: Qwen-Image
type: image-gen
thinking: none
modalities: { input: [text, image], output: [image] }
architecture: diffusion
paramsB: 7.1
license: Qwen Research License
commercialUse: not-allowed
korean: unknown
releaseDate: 2026-09-20
huggingface: https://huggingface.co/Qwen/Qwen-Image-2.1
summary: 텍스트→이미지 생성과 편집을 통합한 Qwen 의 7B 시각 생성 모델. 투명 배경(RGBA) 이미지 생성과 레이어 편집을 지원한다.
useCases:
  - 투명 배경 스티커·아이콘·상품 누끼 이미지 생성 연구
  - 원·마스크 표시로 부분 편집하고 최대 10장 참조로 인물·상품 정체성을 유지하는 편집 실험
strengths:
  - 시각 생성 부분 7B(단일 스트림 DiT 32층)로 비교적 가벼움
  - 간판·포스터 같은 글자 렌더링 개선
  - Diffusers(QwenImage21Pipeline)·ComfyUI 공개 당일 지원, 8스텝 Turbo 변형 별도 공개
limitations:
  - 연구·평가 목적 라이선스라 상업 이용은 별도 허가 필요
  - 상업 이용이 필요하면 Apache-2.0 인 이전 세대 Qwen-Image-2512·Qwen-Image-Edit-2511 을 검토
capabilities: []
sources:
  - https://huggingface.co/Qwen/Qwen-Image-2.1
  - https://huggingface.co/Qwen/Qwen-Image-2.1/blob/main/LICENSE
  - https://github.com/QwenLM/Qwen-Image-2.1
  - https://huggingface.co/Qwen/Qwen-Image-2512
verifiedAt: 2026-11-18
---

---
name: FLUX 3 Image Klein
org: Black Forest Labs
family: FLUX 3
type: image-gen
thinking: none
modalities: { input: [text, image], output: [image] }
architecture: diffusion
paramsB: 5.6
license: FLUX Kommunity License v1.0
commercialUse: restricted
korean: unknown
releaseDate: 2026-10-15
huggingface: https://huggingface.co/black-forest-labs/flux-3-image-klein
summary: 지시문 편집, 텍스트→이미지, 최대 10장 참조 합성, 바운딩 박스 레이아웃 지정을 한 모델로 처리하는 5.6B 이미지 모델.
useCases:
  - 상품·인물 사진을 지시문으로 부분 수정하는 편집 파이프라인
  - 여러 참조 이미지를 조합하고 박스로 배치를 지정하는 광고·썸네일 시안 제작
strengths:
  - 증류 체크포인트로 16스텝 생성, FP8·NVFP4 변형 포함
  - 이미지 내 텍스트 렌더링 지원
  - 파인튜닝·LoRA 용 비증류 Klein Base 를 따로 공개
limitations:
  - 프롬프트 업샘플러(flux-3-image-klein-pup, 약 28GB 추가) 사용을 사실상 필수로 안내
  - 레퍼런스 코드 기준 1024x1024 피크 메모리 BF16 31GB
  - 비상업 이용과 연 매출 500만 달러 미만 사용자의 출력물 상업 이용만 허용, 경쟁 모델 학습에 출력 사용 금지
capabilities: []
sources:
  - https://huggingface.co/black-forest-labs/flux-3-image-klein
  - https://bfl.ai/blog/flux-3-image-klein
verifiedAt: 2026-11-18
---

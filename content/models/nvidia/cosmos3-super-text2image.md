---
name: Cosmos3-Super-Text2Image
org: NVIDIA
family: Cosmos
type: image-gen
thinking: none
modalities: { input: [text], output: [image] }
architecture: other
paramsB: 64
license: OpenMDW-1.1
commercialUse: allowed
korean: unknown
releaseDate: 2026-05-31
huggingface: https://huggingface.co/nvidia/Cosmos3-Super-Text2Image
summary: Cosmos3-Super 를 텍스트→이미지 생성에 맞춰 후속 학습한 64B 변형. 텍스트 설명에 맞는 고해상도 이미지를 만들며 Physical AI 장면 합성에 쓴다.
useCases:
  - 로봇·자율주행·산업 현장 장면의 정지 이미지를 텍스트로 합성해 학습 데이터를 늘릴 때
  - 256p·480p·720p 해상도와 16:9·4:3·1:1·3:4·9:16 비율의 이미지를 생성할 때
  - vLLM-Omni·SGLang Diffusion·Diffusers 로 OpenAI 호환 이미지 생성 엔드포인트를 띄울 때
strengths:
  - 모델 카드가 "Cosmos3-Super 의 post-trained text-to-image variant"라고 설명하며 게이트 없는 공개 저장소
  - OpenMDW-1.1 라이선스로 카드가 상업·비상업 사용 가능이라고 밝힘
  - 카드에 Artificial Analysis 텍스트→이미지 리더보드(2026-05-28) 비교 이미지를 게재(수치는 카드 이미지로만 제공)
limitations:
  - 파라미터 64B 급이라 8×H100 노드 서빙이 권장되며 BF16 만 공식 테스트됨, Linux 에서만 테스트됨
  - 텍스트 입력 최대 4096 토큰, 한국어 지원 근거 확인 못 함
  - Cosmos3 계열은 옴니모달 기반이라 이 체크포인트의 입력 모달리티는 텍스트 조건만 기재함
  - 파라미터는 카드 표기 64B 를 썼다(safetensors 합계는 약 64.6B). 같은 계열 Image2Video 항목은 합계 64.6B 를 쓴다
capabilities: []
sources:
  - https://huggingface.co/nvidia/Cosmos3-Super-Text2Image
  - https://huggingface.co/api/models/nvidia/Cosmos3-Super-Text2Image
  - https://github.com/nvidia/cosmos
  - https://openmdw.ai/license/1-1/
verifiedAt: 2026-11-19
---

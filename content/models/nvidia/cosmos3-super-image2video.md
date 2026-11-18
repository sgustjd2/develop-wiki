---
name: Cosmos3-Super-Image2Video
org: NVIDIA
family: Cosmos
type: video-gen
thinking: none
modalities: { input: [text, image, video, audio, action], output: [text, image, video, audio, action] }
architecture: other
paramsB: 64.6
license: OpenMDW-1.1
commercialUse: allowed
korean: unknown
releaseDate: 2026-05-31
huggingface: https://huggingface.co/nvidia/Cosmos3-Super-Image2Video
summary: Cosmos3-Super 를 이미지→영상 생성에 맞춰 후속 학습한 64B 변형. 이미지 한 장과 텍스트 지시를 받아 장면과 일관된 영상을 만든다.
useCases:
  - 로봇·차량 장면의 첫 프레임에서 이어지는 미래 영상을 만들어 합성 데이터로 쓸 때
  - 액션 궤적을 조건으로 지정 임바디먼트의 동작 영상을 시뮬레이션할 때
  - 기본 Cosmos3-Super 대신 이미지 조건 영상 생성에 맞춘 체크포인트를 쓰고 싶을 때
strengths:
  - 모델 카드가 "Cosmos3-Super 의 post-trained image-to-video variant"라고 설명하며 입력은 이미지 1장과 텍스트 지시
  - 해상도 256p/480p/720p, 영상 5~400프레임(기본 189프레임), 오디오는 AAC 로 영상에 합성
  - Diffusers·vLLM-Omni·SGLang 으로 서빙 가능, 게이트 없는 공개 저장소이며 OpenMDW-1.1 로 상업 이용 가능
limitations:
  - safetensors 합계 약 64.6B 라 단일 소비자 GPU 에서는 돌리기 어렵고 BF16 만 공식 테스트됨
  - 영상 입력은 최대 5프레임, 오디오 입력은 최대 0.5초, 액션은 지정 임바디먼트만 지원
  - 로봇 제어용 VLA 가 아니라 영상 생성 모델이라 직접 제어에는 Policy 변형이 필요
  - Linux 에서만 테스트됨, 한국어 지원 근거 확인 못 함
  - type 은 출력에 영상이 포함돼 video-gen 으로 분류했으나 Cosmos3 계열은 옴니모달이라 분류 검토 필요
capabilities: []
sources:
  - https://huggingface.co/nvidia/Cosmos3-Super-Image2Video
  - https://huggingface.co/api/models/nvidia/Cosmos3-Super-Image2Video
  - https://github.com/nvidia/cosmos
  - https://openmdw.ai/license/1-1/
verifiedAt: 2026-11-19
---

---
name: Cosmos3-Super
org: NVIDIA
family: Cosmos
type: video-gen
thinking: none
modalities: { input: [text, image, video, audio, action], output: [text, image, video, audio, action] }
architecture: other
paramsB: 64
license: OpenMDW-1.1
commercialUse: allowed
korean: unknown
releaseDate: 2026-05-31
huggingface: https://huggingface.co/nvidia/Cosmos3-Super
summary: Cosmos3 계열 최대 크기(64B)의 옴니모달 월드 모델. Mixture-of-Transformers 구조로 텍스트·이미지·영상·오디오·액션을 받아 영상·오디오·액션·텍스트를 생성한다.
useCases:
  - 로봇 액션 궤적을 조건으로 720p 미래 영상을 만들어 월드 시뮬레이션이나 합성 데이터를 확보할 때
  - 자율주행·스마트 스페이스 장면의 합성 영상을 고해상도로 생성할 때
  - Reasoner 모드로 영상에 대한 물리 추론과 좌표 지정 답변을 얻을 때
strengths:
  - 생성 해상도 256p/480p/720p, 영상은 5~400프레임(Edge 는 480p·150프레임까지)
  - 오디오를 AAC 로 영상에 합성해 출력하고, 입력 액션은 Franka·Agibot·UR·WidowX 등 지정 임바디먼트를 지원
  - Reasoner 입력은 최대 256K 토큰, 모델 카드가 상업·비상업 이용 모두 가능하다고 밝힘(OpenMDW-1.1)
  - Super-Image2Video, Super-Text2Image 및 4Step·FP8 변형이 별도 저장소로 존재(이 항목에서는 다루지 않음)
limitations:
  - 64B(safetensors 합계 약 64.6B)라 소비자 GPU 에서 돌리기 어렵고, BF16 만 공식 테스트되며 FP4·FP8·FP16 은 공식 미지원
  - 영상 입력은 최대 5프레임, 오디오는 최대 0.5초, 액션은 지정 임바디먼트만 지원
  - 로봇 정책(VLA)이 아니라 월드 모델이라 직접 제어에는 Policy 변형이 필요
  - Linux 에서만 테스트됨
  - type 은 출력에 영상이 포함돼 video-gen 으로 분류했으나 옴니모달이라 분류 검토 필요
capabilities: [long-context]
sources:
  - https://huggingface.co/nvidia/Cosmos3-Super
  - https://huggingface.co/api/models/nvidia/Cosmos3-Super
  - https://github.com/nvidia/cosmos
  - https://openmdw.ai/license/1-1/
verifiedAt: 2026-11-19
---

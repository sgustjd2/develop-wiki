---
name: Cosmos3-Nano
org: NVIDIA
family: Cosmos
type: video-gen
thinking: none
modalities: { input: [text, image, video, audio, action], output: [text, image, video, audio, action] }
architecture: other
paramsB: 16
license: OpenMDW-1.1
commercialUse: allowed
korean: unknown
releaseDate: 2026-05-31
huggingface: https://huggingface.co/nvidia/Cosmos3-Nano
summary: 자기회귀 트랜스포머와 디퓨전 트랜스포머를 결합한(Mixture-of-Transformers) 옴니모달 월드 모델. 텍스트·이미지·영상·오디오·액션 궤적을 받아 영상 등을 생성한다.
useCases:
  - 로봇 액션 궤적(Franka 단팔·양팔, UR, WidowX, AgiBot 등)을 조건으로 미래 영상을 예측하는 월드 시뮬레이션
  - 로봇·자율주행 학습용 합성 영상을 만들어 Physical AI 데이터를 늘릴 때
  - 같은 모델의 Reasoner 모드로 영상에 대한 물리 추론과 좌표 지정 답변을 얻을 때
strengths:
  - 모델 카드가 상업·비상업 이용 모두 가능하다고 밝힘(OpenMDW-1.1)
  - 영상 생성은 256p/480p/720p, 5~400프레임이며 Reasoner 는 256K 토큰 컨텍스트
  - Cosmos3-Nano-Sim-* 등 시뮬레이션·정책 변형이 별도 저장소로 존재
limitations:
  - 영상 입력은 최대 5프레임, 오디오 최대 0.5초이고 액션은 지정된 임바디먼트만 지원
  - 모델명 기준 Nano 이며 16B 파라미터라 소비자 GPU 에서 돌리기 어려움
  - 로봇 정책(VLA)이 아니라 월드 모델이라 직접 제어에는 Cosmos3-Edge-Policy-DROID 등 별도 변형이 필요
  - type 은 출력에 영상이 포함돼 video-gen 으로 분류했으나 옴니모달이라 분류 검토 필요
capabilities: [long-context]
sources:
  - https://huggingface.co/nvidia/Cosmos3-Nano
  - https://github.com/nvidia/cosmos
  - https://openmdw.ai/license/1-1/
verifiedAt: 2026-11-19
---

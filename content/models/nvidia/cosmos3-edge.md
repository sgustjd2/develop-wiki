---
name: Cosmos3-Edge
org: NVIDIA
family: Cosmos
type: video-gen
thinking: none
modalities: { input: [text, image, video, action], output: [text, image, video, action] }
architecture: other
paramsB: 4
license: OpenMDW-1.1
commercialUse: allowed
korean: unknown
releaseDate: 2026-07-20
huggingface: https://huggingface.co/nvidia/Cosmos3-Edge
summary: Cosmos3 계열 중 가장 작은 4B 옴니모달 월드 모델. 텍스트·이미지·액션 궤적을 받아 256p/480p 영상·이미지·액션과 텍스트를 생성하며 엣지 배포를 겨냥한다.
useCases:
  - 로봇 액션 궤적으로 480p 이하 짧은 미래 영상을 예측하는 월드 모델을 작은 GPU 에서 돌릴 때
  - Cosmos3-Edge-Policy-DROID 같은 정책 변형을 후속 학습하기 위한 기반 체크포인트로 쓸 때
  - Reasoner 모드로 영상·이미지에 대한 물리 추론과 좌표 지정 답변을 얻을 때
strengths:
  - 4B 규모(safetensors 합계 약 3.86B)이고 FP8 변형이 별도 저장소로 있음
  - 입력 액션은 Franka 단팔·양팔, Agibot, UR, Google robot, WidowX, UMI 등 지정 임바디먼트 지원
  - Reasoner 입력은 최대 256K 토큰, 모델 카드가 상업·비상업 이용 모두 가능하다고 밝힘(OpenMDW-1.1)
limitations:
  - 생성은 256p/480p, 12~30fps, 50~150프레임으로 Super·Nano 보다 제한적이고 오디오 출력 없음
  - 카드에 따르면 2026-08-25 에 체크포인트와 기본값이 갱신돼 main 을 받아 쓰는 경우 재동기화가 필요
  - BF16 만 공식 테스트되며 Linux 에서만 테스트됨
  - type 은 출력에 영상이 포함돼 video-gen 으로 분류했으나 옴니모달이라 분류 검토 필요
capabilities: [long-context]
sources:
  - https://huggingface.co/nvidia/Cosmos3-Edge
  - https://huggingface.co/api/models/nvidia/Cosmos3-Edge
  - https://github.com/nvidia/cosmos
  - https://openmdw.ai/license/1-1/
verifiedAt: 2026-11-19
---

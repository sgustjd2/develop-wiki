---
name: Cosmos-Reason2-32B
org: NVIDIA
family: Cosmos-Reason
type: vlm
thinking: hybrid
modalities: { input: [text, image, video], output: [text] }
architecture: dense
paramsB: 32
contextLength: 262144
license: NVIDIA Open Model License
commercialUse: restricted
korean: unknown
releaseDate: 2026-04-29
huggingface: https://huggingface.co/nvidia/Cosmos-Reason2-32B
summary: Qwen3-VL-32B-Instruct 를 물리 AI 추론용으로 후속 학습한 VLM. 영상·이미지와 텍스트를 받아 공간·시간·물리 상식을 추론하고 로봇 계획을 세우거나 2D/3D 좌표를 낸다.
useCases:
  - 로봇·자율주행 영상에서 다음 행동을 추론하는 VLA 의 플래너로 쓸 때
  - 대량 영상의 데이터 큐레이션과 자동 주석, 영상 분석 에이전트의 백엔드로 쓸 때
  - 물리 상식·체화 추론을 평가하거나 SFT·RL 로 후속 학습할 때
strengths:
  - 객체 2D/3D 포인트·바운딩 박스 좌표 출력과 타임스탬프 정밀도 개선(카드)
  - 최대 256K 입력 토큰(카드, 컨텍스트 값은 256K 를 262144 로 환산)
  - 시스템 프롬프트에 think/answer 형식을 붙이면 긴 사고 응답을 유도(카드)
  - 같은 패밀리의 2B·8B 도 있으나 HF 에서 약관 동의가 필요한 게이트 저장소
limitations:
  - NVIDIA Open Model License 는 가드레일 우회 시 권리 종료, "Built on NVIDIA Cosmos" 표기 의무가 있어 restricted 로 표기(사람 확인 필요)
  - 입력 영상은 학습 설정에 맞춰 FPS=4 를 쓰라고 권장
  - 카드에 extra_gated_prompt 가 있으나 HF API 는 gated=False 로 응답
  - 한국어 지원·성능 정보 없음, thinking 은 프롬프트로 유도하는 방식이라 hybrid 로 표기(분류 검토 필요)
capabilities: [long-context, grounding]
sources:
  - https://huggingface.co/nvidia/Cosmos-Reason2-32B
  - https://huggingface.co/api/models/nvidia/Cosmos-Reason2-32B
  - https://github.com/nvidia-cosmos/cosmos-reason2
  - https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license
verifiedAt: 2026-11-19
---

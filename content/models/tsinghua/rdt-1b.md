---
name: RDT-1B
org: 칭화대 TSAIL (RDT 팀)
family: RDT
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: diffusion
paramsB: 1.0
license: MIT
commercialUse: allowed
korean: unknown
releaseDate: 2024-08-27
huggingface: https://huggingface.co/robotics-diffusion-transformer/rdt-1b
summary: 46개 이상 데이터셋의 100만 개 이상 멀티 로봇 에피소드로 사전학습한 1B 확산 트랜스포머 정책. 통합 액션 공간으로 양팔 조작까지 다룬다.
useCases:
  - Mobile ALOHA 같은 양팔 로봇에 6천 개 이상 자체 에피소드로 파인튜닝해 정밀 양손 조작을 할 때
  - 단팔·양팔, 관절·EEF, 위치·속도 제어가 섞인 로봇들을 하나의 액션 공간으로 다룰 때
  - ManiSkill 시뮬레이션 벤치마크 평가
strengths:
  - 입력은 최대 3개 뷰 RGB, 지시문, 제어 주파수, 로봇 상태이며 출력은 다음 64개 액션
  - 코드·가중치·파인튜닝 데이터 모두 MIT
  - VRAM 이 적으면 RDT-170M 변형과 언어 임베딩 사전계산을 사용할 수 있음
limitations:
  - 사전학습에 없던 로봇 플랫폼에는 일반화하지 않아 소량 데이터 파인튜닝이 필요
  - T5-XXL 언어 인코더 때문에 RTX 4090 이하에서는 임베딩을 미리 계산해야 함(저장소 안내)
  - 1B 는 모델명 기준이며 HF 에 safetensors 합계 메타데이터가 없음
  - 공개일은 HF 첫 가중치 업로드(2024-08-27) 기준이고 논문은 2024년 10월
capabilities: []
sources:
  - https://huggingface.co/robotics-diffusion-transformer/rdt-1b
  - https://github.com/thu-ml/RoboticsDiffusionTransformer
  - https://arxiv.org/abs/2410.07864
verifiedAt: 2026-11-19
---

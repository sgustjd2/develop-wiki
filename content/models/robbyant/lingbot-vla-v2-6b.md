---
name: LingBot-VLA 2.0 (lingbot-vla-v2-6b)
org: Robbyant
family: LingBot-VLA
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 6.4
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-07-08
huggingface: https://huggingface.co/robbyant/lingbot-vla-v2-6b
summary: Qwen3-VL 계열 백본에 MoE 액션 전문가를 붙이고 플로 매칭으로 학습한 범용 VLA 사전학습 체크포인트. 팔·손·허리·머리·이동 베이스까지 통합 액션 공간으로 다룬다.
useCases:
  - 새 로봇의 시연 데이터로 후속 학습(SFT)을 시작할 사전학습 시작점으로 쓸 때
  - 팔·그리퍼·덱스터러스 핸드·모바일 베이스가 섞인 임바디먼트를 통합 액션 표현으로 학습할 때
  - 깊이·미래 장면 증류가 들어간 VLA 구조를 연구·재현할 때
strengths:
  - 로봇 궤적 약 5만 시간(구성 20종)과 에고센트릭 인간 영상 약 1만 시간을 합친 약 6만 시간으로 사전학습(카드·저장소 설명)
  - 55차원 통합 상태·액션 벡터로 팔·엔드이펙터·그리퍼·핸드·허리·머리·이동 신호를 표현
  - 액션 전문가의 희소 MoE 와 LingBot-Depth·DINO-Video 에서 증류한 현재·미래 쿼리를 사용
  - 모델 카드와 GitHub 저장소 모두 Apache-2.0
limitations:
  - 사전학습 체크포인트라 대상 로봇에는 후속 학습이 필요하고 학습 환경은 Python 3.12·PyTorch 2.8 으로 안내됨
  - 학습·추론에 Qwen3-VL-4B-Instruct, MoGe-2, 깊이·DINO-Video 교사 체크포인트가 추가로 필요(저장소 안내)
  - HF 메타데이터의 safetensors 합계(약 6.4B, 이름의 6b 와 일치)이며 활성 파라미터 수치는 확인 못 함
  - 한국어 지시문 지원 근거 확인 못 함
capabilities: []
sources:
  - https://huggingface.co/robbyant/lingbot-vla-v2-6b
  - https://huggingface.co/api/models/robbyant/lingbot-vla-v2-6b
  - https://github.com/robbyant/lingbot-vla-v2
  - https://technology.robbyant.com/lingbot-vla-v2
verifiedAt: 2026-11-19
---

---
name: Isaac GR00T N1.6 3B
org: NVIDIA
family: GR00T
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 3.3
license: NVIDIA One-Way Noncommercial License
commercialUse: not-allowed
korean: unknown
releaseDate: 2025-12-15
huggingface: https://huggingface.co/nvidia/GR00T-N1.6-3B
summary: 비전-언어 모델과 플로 매칭 DiT 헤드를 결합한 휴머노이드용 교차 임바디먼트 VLA. 이미지·언어 지시·로봇 상태를 받아 연속 액션 벡터를 낸다.
useCases:
  - 휴머노이드·양팔 로봇 연구에서 임바디먼트별 후속 학습의 출발점으로 쓸 때(비상업 연구·평가 한정)
  - GR00T N1.5 에서 N1.7 로 이어지는 계보를 재현하거나 비교 실험할 때
strengths:
  - SigLip2 비전 인코더, T5 텍스트 인코더, 임바디먼트 ID 별 MLP 와 AdaLN DiT 로 구성되며 입력 이미지 장수·해상도는 가변
  - 양팔·세미 휴머노이드·휴머노이드 로봇 데이터와 NVIDIA Isaac GR00T Blueprint 합성 데이터를 섞어 사전학습(카드)
  - bridge·fractal·DROID·BEHAVIOR1k 등 후속학습 체크포인트가 별도 저장소로 존재
limitations:
  - 카드가 링크한 NVIDIA One-Way Noncommercial License 와 LICENSE 파일 3.3 항이 연구·평가 목적의 비상업 이용만 허용(NVIDIA 자신은 상업 이용 가능)
  - 후속 학습 없이는 특정 로봇에서 동작을 기대하기 어렵고 Linux 에서만 지원
  - 최신은 GR00T N1.7 이며 같은 패밀리의 N1.5-3B, N1-2B 는 이 항목에서 다루지 않음
  - 공개일은 HF 저장소의 단일 squash 커밋(2025-12-15) 기준이며 공식 공지 날짜는 확인하지 못함
capabilities: []
sources:
  - https://huggingface.co/nvidia/GR00T-N1.6-3B
  - https://huggingface.co/nvidia/GR00T-N1.6-3B/blob/main/LICENSE
  - https://huggingface.co/api/models/nvidia/GR00T-N1.6-3B
  - https://github.com/NVIDIA/Isaac-GR00T
verifiedAt: 2026-11-19
---

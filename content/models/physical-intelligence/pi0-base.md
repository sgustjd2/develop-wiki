---
name: π0 (pi0_base, openpi)
org: Physical Intelligence
family: π0
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: dense
paramsB: 3.5
license: Apache-2.0 (openpi 저장소 코드) / Gemma (HF LeRobot 포팅본 표기)
commercialUse: restricted
korean: unknown
releaseDate: 2025-02-04
huggingface: https://huggingface.co/lerobot/pi0_base
summary: PaliGemma 3B 기반 VLM 에 플로 매칭 액션 헤드를 붙인 π0 의 openpi 기반 사전학습 체크포인트. 자체 로봇 데이터로 파인튜닝하는 출발점이다.
useCases:
  - ALOHA 양팔이나 DROID Franka 같은 로봇의 자체 데이터로 openpi 에서 파인튜닝할 때
  - LeRobot 의 PI0Policy 로 SO-100 등 저가 로봇용 정책을 학습해 보는 연구
  - π0.5 와 비교하는 기준선(베이스라인)으로 쓸 때
strengths:
  - openpi 가 JAX·PyTorch 구현과 LIBERO·DROID·ALOHA 예제를 제공하고 10k시간 이상의 로봇 데이터로 사전학습한 베이스 체크포인트를 배포
  - 입력은 다중 뷰 이미지·로봇 상태·지시문, 출력은 연속 액션 청크(LeRobot 카드)
  - 추론 8GB 초과, LoRA 파인튜닝 22.5GB 초과 VRAM 으로 가능(openpi README)
limitations:
  - 최신 세대는 π0.5 이며 본 항목은 첫 세대 베이스 체크포인트(π0-FAST 베이스는 다루지 않음)
  - 전체 파인튜닝은 70GB 이상 VRAM 이 필요하고 학습 스크립트는 멀티 노드 미지원(README)
  - 가중치는 openpi 가 gs://openpi-assets/checkpoints/pi0_base 로 배포하며 HF 의 LeRobot 포팅본은 gemma 로 표기됨. 원 가중치 라이선스는 사람 확인 필요
  - 공개일은 openpi 저장소 최초 커밋(2025-02-04) 기준, 파라미터 수는 LeRobot 포팅본 safetensors 합계 기준
capabilities: []
sources:
  - https://github.com/Physical-Intelligence/openpi
  - https://github.com/Physical-Intelligence/openpi/issues/263
  - https://huggingface.co/lerobot/pi0_base
  - https://huggingface.co/api/models/lerobot/pi0_base
  - https://arxiv.org/abs/2410.24164
verifiedAt: 2026-11-19
---

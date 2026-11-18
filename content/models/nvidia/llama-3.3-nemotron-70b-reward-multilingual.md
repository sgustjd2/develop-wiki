---
name: Llama-3.3-Nemotron-70B-Reward-Multilingual
org: NVIDIA
family: Nemotron Reward
type: reward
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 70.6
license: NVIDIA Open Model License + Llama 3.3 Community License
commercialUse: restricted
korean: basic
releaseDate: 2025-06-27
huggingface: https://huggingface.co/nvidia/Llama-3.3-Nemotron-70B-Reward-Multilingual
summary: Llama-3.3-70B-Instruct 를 HelpSteer3 로 학습한 다국어 리워드 모델. 다국어 대화의 마지막 어시스턴트 응답 품질을 점수로 낸다.
useCases:
  - 한국어 포함 다국어 챗봇의 RLHF 보상 모델
  - 다국어 응답 후보의 Best-of-N 선택과 품질 회귀 평가
strengths:
  - 언어 메타데이터에 한국어(ko) 등 14개 언어 명시
  - 카드에 상업·비상업 사용 가능 명시
limitations:
  - 70B 라 80GB GPU 2장 이상 필요(카드 기재)
  - 입력은 128K 까지 받지만 4K 토큰 이하 대화로만 학습
  - 점수는 같은 프롬프트의 응답끼리만 비교 가능
capabilities: [multilingual]
sources:
  - https://huggingface.co/nvidia/Llama-3.3-Nemotron-70B-Reward-Multilingual
  - https://arxiv.org/abs/2505.11475
verifiedAt: 2026-11-18
---

---
name: Qwen3-Nemotron-32B-GenRM-Principle
org: NVIDIA
family: Nemotron Reward
type: reward
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 32.8
license: NVIDIA Open Model License
commercialUse: restricted
korean: unknown
releaseDate: 2025-10-27
huggingface: https://huggingface.co/nvidia/Qwen3-Nemotron-32B-GenRM-Principle
summary: Qwen3-32B 기반 생성형 리워드(LLM-as-judge) 모델. 사용자가 지정한 원칙(principle)을 응답이 얼마나 충족하는지 점수로 낸다.
useCases:
  - '"출처를 인용했는가" 같은 자체 평가 기준으로 응답을 채점하는 LLM 저지'
  - 원칙 기반 피드백(RLBFF)을 쓰는 강화학습 보상
  - 일반 지식·추론·수학·코드 응답의 자동 평가
strengths:
  - 평가 기준을 자연어 원칙으로 바꿔 재사용
  - 카드 기준 2025-09-24 시점 JudgeBench·RM-Bench 생성형 리워드 모델 1위
limitations:
  - 입력은 128K 까지 받지만 8K 토큰 이하 대화로만 학습
  - 언어 메타데이터는 영어뿐
  - 32B 라 단일 소형 GPU 로는 어려움
sources:
  - https://huggingface.co/nvidia/Qwen3-Nemotron-32B-GenRM-Principle
  - https://arxiv.org/abs/2509.21319
verifiedAt: 2026-11-18
---

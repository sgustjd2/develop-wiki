---
name: Skywork-Reward-V2-Llama-3.1-8B
org: Skywork
family: Skywork-Reward-V2
type: reward
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 7.5
contextLength: 16384
license: Llama 3.1 Community License
commercialUse: restricted
korean: unknown
releaseDate: 2025-07-02
huggingface: https://huggingface.co/Skywork/Skywork-Reward-V2-Llama-3.1-8B
summary: 2,600만 개 선호 쌍으로 학습한 Bradley-Terry 방식 리워드 모델. 대화와 응답을 받아 품질 점수(스칼라)를 낸다.
useCases:
  - RLHF·DPO 학습의 보상 신호 또는 선호 데이터 자동 라벨링
  - 여러 후보 응답 중 하나를 고르는 Best-of-N 샘플링
  - 프롬프트·모델 변경 전후 응답 품질 비교 평가
strengths:
  - 시리즈 8종 중 카드가 대부분의 용도에 권장하는 모델
  - Qwen3 기반 0.6B~8B 변형(Apache-2.0)도 있어 저자원·라이선스 요구에 맞춰 교체 가능
  - transformers AutoModelForSequenceClassification 으로 바로 점수 산출
limitations:
  - 학습 데이터 최대 길이 16,384토큰, 그 안에서 추론 권장
  - 채팅 템플릿에 시스템 프롬프트를 넣지 말 것(카드 권고)
  - 점수는 같은 프롬프트 내 비교용
sources:
  - https://huggingface.co/Skywork/Skywork-Reward-V2-Llama-3.1-8B
  - https://arxiv.org/abs/2507.01352
  - https://github.com/SkyworkAI/Skywork-Reward-V2
verifiedAt: 2026-11-18
---

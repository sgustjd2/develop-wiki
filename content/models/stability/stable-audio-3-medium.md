---
name: Stable Audio 3 Medium
org: Stability AI
family: Stable Audio 3
type: audio-gen
thinking: none
modalities: { input: [text, audio], output: [audio] }
architecture: diffusion
license: Stability AI Community License
commercialUse: restricted
korean: none
releaseDate: 2026-05-20
huggingface: https://huggingface.co/stabilityai/stable-audio-3-medium
summary: 가변 길이 음악·효과음을 생성하고 인페인팅으로 편집하는 잠재 확산 모델. 공개된 Stable Audio 3 중 가장 큰 중형 모델이다.
useCases:
  - 영상·게임용 배경음악과 효과음을 길이에 맞춰 생성
  - 짧은 녹음을 이어 붙이거나 일부 구간만 다시 생성하는 오디오 편집
strengths:
  - 라이선스 음원과 Creative Commons 데이터로 학습
  - 적대적 후학습으로 적은 스텝(예시 8스텝)으로 생성, H200 에서 2초 미만이라고 공개
  - stable-audio-3 라이브러리로 추론·파인튜닝 지원
limitations:
  - 텍스트 조건은 영어만 지원
  - 연 매출 100만 달러 초과 조직은 별도 상업 라이선스 필요, Gemma 이용 약관도 함께 적용
  - 가중치는 small·medium 만 공개(카드 기준)
capabilities: []
sources:
  - https://huggingface.co/stabilityai/stable-audio-3-medium
  - https://stability.ai/news-updates/meet-stable-audio-3-the-model-family-built-for-artistic-experimentation-with-open-weight-models
  - https://stability.ai/license
  - https://arxiv.org/abs/2605.17991
verifiedAt: 2026-11-18
---

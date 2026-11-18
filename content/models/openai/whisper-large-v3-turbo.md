---
name: Whisper large-v3-turbo
org: OpenAI
family: Whisper
type: asr
thinking: none
modalities: { input: [audio], output: [text] }
architecture: dense
paramsB: 0.809
license: MIT
commercialUse: allowed
korean: basic
releaseDate: 2024-09-30
huggingface: https://huggingface.co/openai/whisper-large-v3-turbo
summary: Whisper large-v3 를 가지치기해 디코더 층을 32개에서 4개로 줄이고 미세조정한 경량판. 인코더는 같고 디코딩 비용이 작다.
useCases:
  - 대량 녹음 파일의 다국어 일괄 전사를 GPU 비용을 줄여 처리할 때
  - faster-whisper·whisper.cpp 로 돌리는 로컬 자막 생성
strengths:
  - large-v3 와 같은 인코더라 다국어 인식 품질을 대부분 유지
  - MIT 라이선스, 기존 Whisper 도구 생태계 그대로 사용
limitations:
  - 학습·평가가 ASR 과 영어로의 음성 번역 중심이며, 강한 ASR 성능은 약 10개 언어에서 확인됐다고 카드에 명시
  - 무음 구간 환각 등 Whisper 계열의 한계를 공유
capabilities: [multilingual]
sources:
  - https://huggingface.co/openai/whisper-large-v3-turbo
  - https://github.com/openai/whisper/releases/tag/v20240930
verifiedAt: 2026-11-18
---

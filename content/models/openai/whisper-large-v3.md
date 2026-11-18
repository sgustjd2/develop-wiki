---
name: Whisper large-v3
org: OpenAI
family: Whisper
type: asr
thinking: none
modalities: { input: [audio], output: [text] }
architecture: dense
paramsB: 1.55
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2023-11-06
huggingface: https://huggingface.co/openai/whisper-large-v3
summary: 대규모 약지도 학습으로 만든 다국어 음성 인식·번역 모델.
useCases:
  - 회의·강의 녹음 전사
  - 자막 생성
strengths:
  - 다국어 지원과 넓은 도구 생태계 (faster-whisper, whisper.cpp)
limitations:
  - 무음 구간에서 환각 텍스트가 생길 수 있음
capabilities: [multilingual]
sources:
  - https://huggingface.co/openai/whisper-large-v3
verifiedAt: 2026-11-18
---

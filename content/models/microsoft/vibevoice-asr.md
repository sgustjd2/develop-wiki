---
name: VibeVoice-ASR
org: Microsoft
family: VibeVoice
type: asr
thinking: none
modalities: { input: [audio], output: [text] }
architecture: dense
paramsB: 8.7
license: MIT
commercialUse: allowed
korean: basic
releaseDate: 2026-01-21
huggingface: https://huggingface.co/microsoft/VibeVoice-ASR
summary: 최대 60분 오디오를 한 번에 받아 화자·타임스탬프·내용을 구조화해 출력하는 음성 인식 모델. 50개 이상 언어와 코드 스위칭을 지원한다.
useCases:
  - 1시간 회의·인터뷰 녹음을 화자 분리와 함께 한 번에 전사
  - 고유명사·전문 용어를 핫워드로 주입해야 하는 도메인 전사
strengths:
  - 전사·화자 분리·타임스탬프를 한 모델에서 수행
  - 청크로 자르지 않아 긴 녹음에서 화자 추적이 일관됨
  - vLLM 추론, 파인튜닝 코드, Transformers 통합(VibeVoice-ASR-HF) 제공
limitations:
  - 8.7B 로 경량 ASR 보다 GPU 메모리 요구가 큼
capabilities: [multilingual]
sources:
  - https://huggingface.co/microsoft/VibeVoice-ASR
  - https://github.com/microsoft/VibeVoice
  - https://arxiv.org/abs/2601.18184
verifiedAt: 2026-11-18
---

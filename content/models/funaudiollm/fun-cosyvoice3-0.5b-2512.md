---
name: Fun-CosyVoice3-0.5B-2512
org: Alibaba Tongyi (FunAudioLLM)
family: CosyVoice
type: tts
thinking: none
modalities: { input: [text, audio], output: [audio] }
architecture: other
paramsB: 0.5
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2025-12-14
huggingface: https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512
summary: LLM 기반 제로샷 다국어 TTS CosyVoice 3.0 의 0.5B 공개 모델. 9개 언어와 18개 이상 중국어 방언의 보이스 클로닝을 지원한다.
useCases:
  - 짧은 참조 음성으로 같은 목소리를 여러 언어로 합성(교차 언어 클로닝)
  - 텍스트·오디오 양방향 스트리밍이 필요한 실시간 음성 응답
strengths:
  - 150ms 수준 지연의 양방향 스트리밍
  - 숫자·기호 읽기를 별도 전처리 없이 처리, 병음·CMU 발음 인페인팅 지원
  - 언어·방언·감정·속도·음량 지시 지원, RL 버전 가중치(llm.rl.pt) 함께 제공
limitations:
  - 공식 추론은 CosyVoice 저장소 코드 기준
  - releaseDate 는 HF 커밋 기록 기준(공식 로드맵 표기는 2025/12)
capabilities: [multilingual]
sources:
  - https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512
  - https://github.com/FunAudioLLM/CosyVoice
  - https://arxiv.org/abs/2505.17589
verifiedAt: 2026-11-18
---

---
name: Qwen3-TTS-12Hz-1.7B-CustomVoice
org: Alibaba Qwen
family: Qwen3-TTS
type: tts
thinking: none
modalities: { input: [text], output: [audio] }
architecture: other
paramsB: 1.9
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2026-01-22
huggingface: https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice
summary: 자연어 지시로 음색·감정·운율을 조절하는 Qwen3-TTS 의 1.7B 프리미엄 보이스 모델. 한국어를 포함한 10개 언어를 지원한다.
useCases:
  - 한국어·영어 음성 비서의 저지연 스트리밍 응답 음성
  - 차분한 톤 같은 자연어 지시로 감정·속도를 바꿔야 하는 콘텐츠 내레이션
strengths:
  - 첫 오디오 패킷까지 지연 97ms 수준의 스트리밍 생성
  - 9개 프리미엄 음색과 지시 기반 스타일 제어
  - 같은 계열에 3초 보이스 클로닝용 Base, 설명문으로 목소리를 만드는 VoiceDesign, 0.6B 변형이 함께 공개
limitations:
  - 임의 화자 클로닝은 Base 모델을 써야 함
  - 전용 토크나이저(Qwen3-TTS-Tokenizer-12Hz)와 qwen-tts 패키지 필요
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice
  - https://github.com/QwenLM/Qwen3-TTS
verifiedAt: 2026-11-18
---

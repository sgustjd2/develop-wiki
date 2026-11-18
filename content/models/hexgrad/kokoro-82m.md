---
name: Kokoro-82M
org: hexgrad
family: Kokoro
type: tts
thinking: none
modalities: { input: [text], output: [audio] }
architecture: other
paramsB: 0.082
license: Apache-2.0
commercialUse: allowed
korean: none
releaseDate: 2025-01-27
huggingface: https://huggingface.co/hexgrad/Kokoro-82M
summary: StyleTTS 2 와 ISTFTNet 구조의 82M 경량 TTS 모델. 작은 크기로 빠르고 저렴하게 음성을 합성한다.
useCases:
  - CPU나 소형 GPU에서 돌리는 영어 낭독·안내 음성 생성
  - 문서·기사를 오디오로 바꾸는 대량 배치 합성
strengths:
  - 82M 파라미터라 실행 비용이 매우 낮음
  - Apache-2.0 이고 상용 API·프로젝트에 널리 배포됨
  - 미국·영국 영어, 일본어, 중국어, 스페인어, 프랑스어, 힌디어, 이탈리아어, 포르투갈어 보이스 제공
limitations:
  - 한국어 보이스 없음
  - 참조 음성 기반 보이스 클로닝 미지원(제공 보이스 선택 방식)
capabilities: [multilingual]
sources:
  - https://huggingface.co/hexgrad/Kokoro-82M
  - https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
  - https://github.com/hexgrad/kokoro
verifiedAt: 2026-11-18
---

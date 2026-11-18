---
name: VoxCPM2
org: OpenBMB
family: VoxCPM
type: tts
thinking: none
modalities: { input: [text, audio], output: [audio] }
architecture: other
paramsB: 2.3
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2026-04-03
huggingface: https://huggingface.co/openbmb/VoxCPM2
summary: 토크나이저 없이 확산-자기회귀 방식으로 음성을 만드는 TTS 모델. 30개 언어, 48kHz 출력, 설명문 기반 보이스 디자인을 지원한다.
useCases:
  - 한국어 포함 다국어 오디오북·영상 내레이션을 고음질(48kHz)로 생성
  - 참조 음성 없이 "중년 남성, 차분한 톤" 같은 설명만으로 새 목소리를 만들 때
  - 짧은 클립으로 화자 클로닝 후 감정·속도를 조절
strengths:
  - 언어 태그 없이 입력 텍스트 언어를 자동 처리
  - RTX 4090 에서 RTF 약 0.3, Nano-vLLM 가속 시 약 0.13
  - Apache-2.0
limitations:
  - paramsB 는 safetensors 합계이며 카드 표기는 2B
  - releaseDate 는 HF 첫 커밋 기록 기준(공식 표기는 2026.04)
capabilities: [multilingual]
sources:
  - https://huggingface.co/openbmb/VoxCPM2
  - https://github.com/OpenBMB/VoxCPM
  - https://arxiv.org/abs/2606.06928
verifiedAt: 2026-11-18
---

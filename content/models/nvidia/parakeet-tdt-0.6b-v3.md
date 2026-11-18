---
name: parakeet-tdt-0.6b-v3
org: NVIDIA
family: Parakeet
type: asr
thinking: none
modalities: { input: [audio], output: [text] }
architecture: other
paramsB: 0.627
license: CC-BY-4.0
commercialUse: allowed
korean: none
releaseDate: 2025-08-14
huggingface: https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3
summary: FastConformer 인코더와 TDT 디코더를 쓴 600M 다국어 음성 인식 모델. 유럽 25개 언어를 지원하고 구두점·타임스탬프를 함께 출력한다.
useCases:
  - 유럽어 콜센터·회의 녹음의 고처리량 일괄 전사
  - 단어 단위 타임스탬프가 필요한 자막 생성
strengths:
  - 구두점·대소문자 자동 처리, 단어·구간 타임스탬프
  - 전체 어텐션으로 최대 24분, 로컬 어텐션으로 최대 3시간 오디오 처리
  - NeMo 와 Transformers 에서 사용 가능
limitations:
  - 지원 언어가 영어 포함 유럽 25개 언어로 한국어 미지원
  - CC-BY-4.0 은 저작자 표시 조건으로 상업 이용을 허용하지만 lint 규칙상 restricted 로 표기(사람 확인 필요)
capabilities: [multilingual]
sources:
  - https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3
  - https://arxiv.org/abs/2509.14128
verifiedAt: 2026-11-18
---

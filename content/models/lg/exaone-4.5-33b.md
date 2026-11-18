---
name: EXAONE 4.5 33B
org: LG AI Research
family: EXAONE
type: vlm
thinking: hybrid
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 33
contextLength: 262144
license: EXAONE AI Model License 1.2 - NC
commercialUse: not-allowed
korean: good
releaseDate: 2026-04-09
huggingface: https://huggingface.co/LGAI-EXAONE/EXAONE-4.5-33B
summary: EXAONE 4.0 에 비전 인코더를 붙인 LG AI연구원의 첫 오픈 웨이트 비전 언어 모델. 문서 이해와 한국어 맥락 추론에 강점을 둔다.
useCases:
  - 한국어 문서·서식 이미지 이해 연구와 평가
  - 한국어 시각 질의응답 벤치마크·비교 실험
strengths:
  - 31.7B 언어 모델 + 1.29B 비전 인코더, 256K 컨텍스트
  - 추론 모드가 기본 켜짐이며 enable_thinking=False 로 비추론 모드 전환
  - 하이브리드 어텐션(슬라이딩 윈도우 3 + 글로벌 1)으로 긴 입력 효율 개선
limitations:
  - 연구·교육 목적 비상업 라이선스라 서비스 적용에는 별도 상업 계약 필요
  - paramsB 는 공식 표기(33B)이며 safetensors 합계(34.4B)에는 MTP 레이어가 포함됨
capabilities: [tool-calling, long-context, multilingual]
sources:
  - https://huggingface.co/LGAI-EXAONE/EXAONE-4.5-33B
  - https://huggingface.co/LGAI-EXAONE/EXAONE-4.5-33B/blob/main/LICENSE
  - https://github.com/LG-AI-EXAONE/EXAONE-4.5
  - https://arxiv.org/abs/2604.08644
verifiedAt: 2026-11-18
---

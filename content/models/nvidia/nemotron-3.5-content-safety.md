---
name: Nemotron 3.5 Content Safety
org: NVIDIA
family: Nemotron Content Safety
type: guard
thinking: hybrid
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 4.3
license: OpenMDW-1.1 + Gemma Terms of Use
commercialUse: restricted
korean: basic
releaseDate: 2026-06-02
huggingface: https://huggingface.co/nvidia/Nemotron-3.5-Content-Safety
summary: Gemma-3-4B-it 기반 콘텐츠 안전 판정 모델. 텍스트와 이미지 1장을 받아 사용자 입력·응답의 safe/unsafe 와 위반 카테고리를 내고, 사용자 정의 정책도 적용할 수 있다.
useCases:
  - 이미지 1장을 받는 VLM 서비스의 입력·응답 모더레이션
  - 도메인 전용 금지 규칙(사내 정책)을 프롬프트로 넣어 판정하는 커스텀 정책 가드
  - 한국어·일본어 등 12개 언어 서비스의 안전 필터
strengths:
  - 표준 분류 체계(Aegis 2.0) 모드와 커스텀 정책 추론 모드를 한 모델에서 지원
  - 지원 언어에 한국어를 명시
  - 카드 기재 최대 128K 컨텍스트
limitations:
  - Gemma Terms of Use·금지 사용 정책이 함께 적용됨
  - 이미지는 한 장만 입력
  - 커스텀 정책 모드는 추론 과정을 출력해 지연이 늘어남
capabilities: [multilingual, long-context]
sources:
  - https://huggingface.co/nvidia/Nemotron-3.5-Content-Safety
verifiedAt: 2026-11-18
---

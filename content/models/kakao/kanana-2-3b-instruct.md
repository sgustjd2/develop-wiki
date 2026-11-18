---
name: Kanana-2-3B-Instruct
org: Kakao
family: Kanana-2
type: text-llm
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 3.5
contextLength: 32768
license: Kanana Open License
commercialUse: restricted
korean: good
releaseDate: 2026-07-27
huggingface: https://huggingface.co/kakaocorp/kanana-2-3b-instruct
summary: 카카오가 TPU 클러스터에서 처음부터 학습한 Kanana-2 소형 언어 모델의 3B 지시 수행판. 한국어 토큰화 효율을 개선했다.
useCases:
  - 한국어 챗봇·요약을 저비용 GPU나 CPU 서버에서 돌릴 때
  - 한국어 사내 문서 분류·추출 같은 경량 파이프라인
  - 한국어 도메인 특화 파인튜닝의 소형 출발점
strengths:
  - 이전 세대 대비 한국어 토큰화 효율 30% 이상 개선
  - 툴 호출 벤치마크 결과 공개, vLLM tool-call parser 예제 제공
  - 가지치기·증류로 만든 1.3B 변형(슬라이딩 윈도우 어텐션)도 함께 공개
limitations:
  - API·SI·온디바이스 형태로 제3자에게 제공하려면 별도 상업 라이선스 필요, "Powered by Kanana" 표기 의무
  - 컨텍스트 32K
capabilities: [tool-calling]
sources:
  - https://huggingface.co/kakaocorp/kanana-2-3b-instruct
  - https://huggingface.co/kakaocorp/kanana-2-3b-instruct/blob/main/LICENSE
verifiedAt: 2026-11-18
---

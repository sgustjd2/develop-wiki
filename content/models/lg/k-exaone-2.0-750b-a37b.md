---
name: K-EXAONE 2.0 750B-A37B
org: LG AI Research
family: K-EXAONE
type: text-llm
thinking: hybrid
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 750
activeParamsB: 37
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: good
releaseDate: 2026-07-31
huggingface: https://huggingface.co/LGAI-EXAONE/K-EXAONE-2.0-750B-A37B
summary: K-EXAONE 을 업사이클링해 3배 이상 키운 LG AI연구원의 750B MoE 범용 모델. 한국어 포함 10개 언어, 추론 모드 전환을 지원한다.
useCases:
  - 한국어 품질이 중요한 대규모 사내 에이전트·코딩 보조를 자체 클러스터에서 운영할 때
  - 긴 문서 검색·요약 등 장문 컨텍스트 업무
strengths:
  - Apache-2.0 로 상업 이용 가능
  - MTP 와 DSpark 두 가지 추측 디코딩으로 생성 속도 3~5배 향상을 공개
  - 256K 컨텍스트, 추론 모드 기본 켜짐(enable_thinking=False 로 끔)
limitations:
  - 공식 서빙 예시는 H200 8장 노드 2개 규모
  - 텍스트 전용
capabilities: [tool-calling, long-context, multilingual]
sources:
  - https://huggingface.co/LGAI-EXAONE/K-EXAONE-2.0-750B-A37B
  - https://github.com/LG-AI-EXAONE/K-EXAONE-2.0
verifiedAt: 2026-11-18
---

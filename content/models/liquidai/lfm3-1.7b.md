---
name: LFM3-1.7B
org: Liquid AI
family: LFM3
type: text-llm
thinking: hybrid
modalities: { input: [text], output: [text] }
architecture: hybrid
paramsB: 1.73
contextLength: 262144
license: LFM Open License v1.0
commercialUse: restricted
korean: basic
releaseDate: 2026-10-27
huggingface: https://huggingface.co/LiquidAI/LFM3-1.7B
summary: 짧은 합성곱과 슬라이딩 윈도·전역 어텐션을 섞은 1.7B 엣지 모델. 로컬 에이전트·도구 호출에 맞춰 학습됐다.
useCases:
  - 휴대폰·노트북에서 돌리는 온디바이스 도구 호출 에이전트
  - 단일 GPU로 빠르게 파인튜닝하는 도메인 특화 소형 모델
strengths:
  - 4비트 기준 약 1GB 메모리로 실행
  - 지연 로딩 도구(deferred tools)와 도구 검색을 채팅 템플릿에서 지원
  - 한국어 포함 16개 언어 지원 명시
limitations:
  - 연 매출 1,000만 달러 이상 기업의 상업 이용은 이 라이선스로 허용되지 않음 (별도 계약 필요)
  - 모델 카드가 에이전트 코딩·복잡한 다단계 추론에는 권장하지 않음
  - enable_thinking=False 동작이 일관되지 않을 수 있음
capabilities: [tool-calling, long-context, multilingual, structured-output]
sources:
  - https://huggingface.co/LiquidAI/LFM3-1.7B
  - https://huggingface.co/LiquidAI/LFM3-1.7B/blob/main/LICENSE
  - https://huggingface.co/api/models/LiquidAI/LFM3-1.7B
verifiedAt: 2026-11-18
---

---
name: Qwen3-4B-Thinking-2507
org: Alibaba Qwen
family: Qwen3-2507
type: reasoning-llm
thinking: native
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 4.0
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-08-06
huggingface: https://huggingface.co/Qwen/Qwen3-4B-Thinking-2507
summary: Qwen3-4B 의 사고 전용 업데이트판. 항상 사고 모드로 동작하며 수학·코딩·논리 추론 품질을 높였다.
useCases:
  - 노트북·소형 GPU에서 돌리는 수학·논리 문제 풀이 도우미
  - 비용이 낮아야 하는 추론 단계(계획 수립, 검증)를 맡는 경량 에이전트
  - 추론 모델 파인튜닝·증류 실험의 작은 출발점
strengths:
  - 4B 크기에 네이티브 256K 컨텍스트
  - Qwen-Agent 를 통한 툴 호출 지원
  - Apache-2.0
limitations:
  - 사고 모드를 끌 수 없어 짧은 응답에도 지연이 생김 (비사고형은 Qwen3-4B-Instruct-2507 별도)
  - 긴 추론을 위해 131K 이상 컨텍스트 설정을 권장해 메모리 요구가 커질 수 있음
capabilities: [tool-calling, long-context]
sources:
  - https://huggingface.co/Qwen/Qwen3-4B-Thinking-2507
  - https://github.com/QwenLM/Qwen3
verifiedAt: 2026-11-18
---

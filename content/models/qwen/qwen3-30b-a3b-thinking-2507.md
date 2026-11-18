---
name: Qwen3-30B-A3B-Thinking-2507
org: Alibaba Qwen
family: Qwen3-2507
type: reasoning-llm
thinking: native
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 30.5
activeParamsB: 3.3
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-07-31
huggingface: https://huggingface.co/Qwen/Qwen3-30B-A3B-Thinking-2507
summary: Qwen3-30B-A3B 의 사고 전용 업데이트판 MoE 모델. 활성 3.3B 로 깊은 추론을 낮은 연산 비용에 수행한다.
useCases:
  - 단일 GPU(양자화 시 24GB급)에서 돌리는 수학·코딩·과학 추론
  - 추론 품질이 중요하지만 대형 모델 서빙 비용은 부담스러운 사내 에이전트
strengths:
  - 활성 파라미터 3.3B 라 같은 총 크기 dense 모델보다 추론이 빠름
  - 네이티브 256K 컨텍스트, vLLM·SGLang 의 reasoning parser 지원
  - Apache-2.0
limitations:
  - 사고 모드를 끌 수 없음 (비사고형은 Qwen3-30B-A3B-Instruct-2507 별도)
  - 총 30B 가중치를 모두 메모리에 올려야 함
capabilities: [tool-calling, long-context]
sources:
  - https://huggingface.co/Qwen/Qwen3-30B-A3B-Thinking-2507
  - https://github.com/QwenLM/Qwen3
verifiedAt: 2026-11-18
---

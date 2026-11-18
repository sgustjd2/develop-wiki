---
name: A.X K2
org: SK Telecom
family: A.X
type: text-llm
thinking: hybrid
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 688
activeParamsB: 33
contextLength: 131072
license: Apache-2.0
commercialUse: allowed
korean: good
releaseDate: 2026-07-28
huggingface: https://huggingface.co/skt/A.X-K2
summary: SKT 가 처음부터 학습한 688B MoE 에이전트형 범용 모델. 한 모델에서 사고·비사고 모드를 전환하며 한국어·수학에 강점을 둔다.
useCases:
  - 한국어 지식·문화 이해가 중요한 대규모 사내 비서를 자체 인프라에서 운영할 때
  - 한국어 수학·추론 문제 풀이와 장문 문서 분석
strengths:
  - Apache-2.0 로 연구·상업 이용 가능
  - FP8 로 네이티브 학습해 블록 스케일 FP8 체크포인트를 바로 서빙
  - 128K 로 학습하고 YaRN 으로 256K 까지 확장
  - Sparse Gated Attention 으로 긴 컨텍스트 추론 처리량 개선
limitations:
  - Terminal Bench·BrowseComp 등 에이전트 벤치마크는 비교 모델보다 낮다고 카드에 명시
  - vLLM 지원은 SKT 포크(SKT-AI/vllm) 기준
  - releaseDate 는 HF 커밋 기록 기준
capabilities: [tool-calling, long-context, multilingual]
sources:
  - https://huggingface.co/skt/A.X-K2
  - https://arxiv.org/abs/2608.30181
  - https://huggingface.co/api/models/skt/A.X-K2/commits/main
verifiedAt: 2026-11-18
---

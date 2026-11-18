---
name: Qwen3-Reranker-4B
org: Alibaba Qwen
family: Qwen3 Embedding
type: reranker
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 4.0
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-06-05
huggingface: https://huggingface.co/Qwen/Qwen3-Reranker-4B
summary: Qwen3 기반 크로스 인코더 방식 리랭커. 질의-문서 쌍을 받아 관련도를 "yes" 토큰 확률로 점수화하며 100개 이상 언어와 32K 입력을 지원한다.
useCases:
  - Qwen3-Embedding 으로 뽑은 상위 후보를 재정렬하는 다국어 RAG 2단계 검색
  - 작업별 지시문을 넣어 법률·코드 등 도메인 기준으로 재정렬
  - vLLM 으로 배치 서빙하는 검색 API 의 재순위 단계
strengths:
  - Apache-2.0
  - instruction-aware (지시문으로 작업·언어별 성능 조정)
  - 0.6B·8B 크기도 있어 지연·정확도 사이 선택 가능
limitations:
  - 한국어 개별 평가는 카드에 없음
  - 문서마다 순전파가 필요해 후보 수가 많으면 비용이 큼
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-Reranker-4B
  - https://qwenlm.github.io/blog/qwen3-embedding/
verifiedAt: 2026-11-18
---

---
name: mxbai-rerank-large-v2
org: Mixedbread
family: mxbai-rerank
type: reranker
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 1.5
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2025-03-13
huggingface: https://huggingface.co/mixedbread-ai/mxbai-rerank-large-v2
summary: 1.5B 크로스 인코더 리랭커(ProRank-1.5B). 100개 이상 언어와 코드, 긴 문서 재정렬을 지원한다.
useCases:
  - 단일 GPU 에서 돌리는 다국어 RAG 재정렬
  - 코드 검색 결과 재정렬
  - sentence-transformers CrossEncoder 로 기존 파이프라인의 리랭커 교체
strengths:
  - Apache-2.0
  - sentence-transformers 와 전용 mxbai-rerank 패키지 지원
  - 더 작은 base-v2 변형도 공개
limitations:
  - 한국어는 언어 메타데이터(ko) 기준이며 한국어 평가 수치는 없음 (영어·중국어 성능을 강조)
  - 카드 작성 시점 기술 보고서 미공개
capabilities: [multilingual]
sources:
  - https://huggingface.co/mixedbread-ai/mxbai-rerank-large-v2
  - https://www.mixedbread.ai/blog/mxbai-rerank-v2
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder("mixedbread-ai/mxbai-rerank-large-v2")
rankings = model.rank("Who wrote 'To Kill a Mockingbird'?", ["'To Kill a Mockingbird' is a novel by Harper Lee.", "Moby-Dick was written by Herman Melville."])
```

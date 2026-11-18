---
name: bge-reranker-v2-m3
org: BAAI
family: BGE
type: reranker
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 0.568
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2024-03-18
huggingface: https://huggingface.co/BAAI/bge-reranker-v2-m3
summary: BGE-M3 기반 다국어 크로스 인코더 리랭커. 질의-문단 쌍의 관련도 점수를 내며 sigmoid 로 0~1 로 바꿔 쓸 수 있다.
useCases:
  - BGE-M3 하이브리드 검색 결과를 재정렬하는 다국어 RAG
  - GPU 자원이 적은 환경의 경량 재순위 단계
  - 리랭커 미세조정의 출발점(FlagEmbedding 학습 스크립트 제공)
strengths:
  - Apache-2.0, 0.57B 로 가벼움
  - FlagEmbedding·sentence-transformers·TEI 등 지원 도구가 많음
  - 카드가 다국어·효율 용도 모두에 권장
limitations:
  - 2024년 모델로, 최신 LLM 기반 리랭커보다 정확도가 낮을 수 있음
  - 한국어 단독 평가는 카드에 없음 (다국어 MIRACL 재정렬 결과만 제시)
capabilities: [multilingual]
sources:
  - https://huggingface.co/BAAI/bge-reranker-v2-m3
  - https://github.com/FlagOpen/FlagEmbedding
verifiedAt: 2026-11-18
---

## 사용 예

```python
from FlagEmbedding import FlagReranker

reranker = FlagReranker("BAAI/bge-reranker-v2-m3", use_fp16=True)
scores = reranker.compute_score([["what is panda?", "hi"], ["what is panda?", "The giant panda is a bear species endemic to China."]], normalize=True)
```

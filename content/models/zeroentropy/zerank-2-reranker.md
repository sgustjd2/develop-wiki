---
name: zerank-2
org: ZeroEntropy
family: zerank
type: reranker
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 4.0
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-11-19
huggingface: https://huggingface.co/zeroentropy/zerank-2-reranker
summary: Qwen3-4B 기반 크로스 인코더 리랭커. 질의-문서 관련도를 Elo 방식으로 보정한 학습 데이터로 훈련했고 32K 토큰 입력을 받는다.
useCases:
  - 금융·법률·의료·코드 문서 검색의 상용 리랭커 자체 호스팅 대체
  - sentence-transformers CrossEncoder 로 붙이는 RAG 재정렬
strengths:
  - Apache-2.0
  - 카드가 cohere-rerank-v3.5 등 상용 리랭커보다 높다고 보고
  - 2026-05 부터 trust_remote_code 없이 로드
limitations:
  - 2026-05 변경으로 predict() 가 확률이 아닌 raw 로짓을 반환 (sigmoid(score/5) 로 변환)
  - 언어 메타데이터는 영어뿐, 한국어 평가 없음
sources:
  - https://huggingface.co/zeroentropy/zerank-2-reranker
  - https://arxiv.org/abs/2509.12541
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder("zeroentropy/zerank-2")
scores = model.predict([("What is 2+2?", "4"), ("What is 2+2?", "The answer is definitely 1 million")], convert_to_tensor=True)
probabilities = (scores / 5).sigmoid()  # 선택: raw 로짓을 0~1 점수로 변환
```

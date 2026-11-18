---
name: Qwen3-Embedding-0.6B
org: Alibaba Qwen
family: Qwen3 Embedding
type: embedding
thinking: none
modalities: { input: [text], output: [vector] }
architecture: dense
paramsB: 0.596
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-06-05
huggingface: https://huggingface.co/Qwen/Qwen3-Embedding-0.6B
summary: Qwen3 기반 텍스트 임베딩 시리즈의 최소 크기 모델. 100개 이상 언어와 코드 검색을 지원하고 최대 32K 토큰 입력, 32~1024 차원 출력(MRL)을 낸다.
useCases:
  - 단일 GPU·CPU 서버에서 돌리는 다국어 사내 문서 RAG 1차 검색
  - 코드 저장소 검색(자연어 → 코드)
  - 벡터 DB 저장 비용을 줄이려 차원을 잘라 쓰는 대규모 색인
strengths:
  - Apache-2.0
  - 작업별 지시문(instruction)을 쿼리에 붙여 성능을 높이는 instruction-aware 방식
  - 같은 시리즈에 4B·8B(8B 는 2025-06-05 기준 MTEB 다국어 1위, 카드 기재)와 Qwen3-Reranker 가 있어 검색-재정렬 조합이 쉬움
limitations:
  - 한국어를 명시한 언어 목록·평가 수치는 카드에 없음 ("100개 이상 언어"만 명시)
  - transformers 4.51.0 미만에서는 로드 오류
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-Embedding-0.6B
  - https://qwenlm.github.io/blog/qwen3-embedding/
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("Qwen/Qwen3-Embedding-0.6B")
query_embeddings = model.encode(["What is the capital of China?"], prompt_name="query")
document_embeddings = model.encode(["The capital of China is Beijing."])
print(model.similarity(query_embeddings, document_embeddings))
```

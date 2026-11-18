---
name: snowflake-arctic-embed-l-v2.0
org: Snowflake
family: Arctic Embed
type: embedding
thinking: none
modalities: { input: [text], output: [vector] }
architecture: dense
paramsB: 0.568
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2024-12-04
huggingface: https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0
summary: Snowflake 의 다국어 검색용 텍스트 임베딩 모델(568M). bge-m3-retromae 기반으로 영어와 다국어 검색 품질을 함께 노렸다.
useCases:
  - 영어·다국어 문서가 섞인 기업 RAG 검색에 하나의 임베딩 모델로 대응
  - MRL 256 차원 + 4비트 양자화로 문서당 128바이트 수준까지 줄인 대규모 벡터 색인
  - 브라우저(Transformers.js)·ONNX 런타임에서의 임베딩 계산
strengths:
  - Apache-2.0, 카드에 상업 이용 무료 명시
  - 최대 8192 토큰 입력(RoPE)
  - bge-m3 와 같은 구조라 기존 bge-m3 추론 스택에 그대로 교체 가능
  - ONNX(fp16·int8·q4 등) 가중치 동봉
limitations:
  - '질의에만 "query: " 접두어(Sentence Transformers 는 prompt_name="query")를 붙여야 성능이 남'
  - MRL 은 256 차원 한 단계만 학습됨
  - 한국어는 카드 언어 목록에 있으나 한국어별 평가 수치는 없음
capabilities: [multilingual]
sources:
  - https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0
  - https://arxiv.org/abs/2412.04506
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("Snowflake/snowflake-arctic-embed-l-v2.0")
query_embeddings = model.encode(["what is snowflake?"], prompt_name="query")
document_embeddings = model.encode(["The Data Cloud!", "Mexico City of Course!"])
print(model.similarity(query_embeddings, document_embeddings))
```

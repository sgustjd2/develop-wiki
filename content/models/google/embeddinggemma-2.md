---
name: EmbeddingGemma 2
org: Google
family: EmbeddingGemma
type: embedding
thinking: none
modalities: { input: [text, image, audio, video], output: [vector] }
architecture: dense
paramsB: 0.744
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-10-06
huggingface: https://huggingface.co/google/embeddinggemma-2
summary: 텍스트·이미지·영상·오디오를 하나의 768차원 공간에 넣는 온디바이스용 멀티모달 임베딩 모델. 텍스트 백본은 270M 이고 비전·오디오 인코더는 필요할 때만 로드한다.
useCases:
  - 모바일·노트북에서 돌리는 온디바이스 시맨틱 검색·RAG
  - 텍스트 질의로 사진·영상·음성 메모를 찾는 개인 미디어 검색
  - 상품 설명과 이미지를 한 벡터로 묶는 커머스 검색 색인
strengths:
  - Apache-2.0 (EmbeddingGemma 1 은 Gemma 라이선스)
  - 텍스트만 쓰면 270M 만 로드, 8K 토큰 컨텍스트
  - MRL 로 768/512/256/128 차원 절단
  - 100개 이상 언어, 코드 검색 성능 개선(카드 기재)
limitations:
  - float16 에서 NaN·품질 저하가 발생해 bfloat16/float32 로 실행해야 함
  - '텍스트는 작업별 접두어("task: search result | query: ...")를 붙여야 최적 성능'
  - 한국어 개별 지원 여부·평가는 카드에 명시되지 않음
capabilities: [multilingual]
sources:
  - https://huggingface.co/google/embeddinggemma-2
  - https://blog.google/innovation-and-ai/technology/developers-tools/embeddinggemma-2
  - https://arxiv.org/abs/2610.37364
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("google/embeddinggemma-2")
query_emb = model.encode("What causes the northern lights?", prompt_name="SearchQuery")
doc_emb = model.encode("The northern lights are caused by charged particles from the sun.", prompt_name="Document")
print(model.similarity(query_emb, doc_emb))
```

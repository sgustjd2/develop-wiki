---
name: Qwen3-VL-Embedding-8B
org: Alibaba Qwen
family: Qwen3-VL-Embedding
type: embedding
thinking: none
modalities: { input: [text, image, video], output: [vector] }
architecture: dense
paramsB: 8.1
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-01-08
huggingface: https://huggingface.co/Qwen/Qwen3-VL-Embedding-8B
summary: Qwen3-VL-8B-Instruct 기반 멀티모달 임베딩 모델. 텍스트·이미지·스크린샷·영상과 그 조합을 같은 벡터 공간에 넣어 교차 모달 검색을 한다.
useCases:
  - 텍스트 질의로 사진·스크린샷·영상 클립을 찾는 사내 미디어 자산 검색
  - PDF 페이지 이미지를 그대로 색인하는 시각 문서 RAG(OCR 단계 생략)
  - 이미지+설명이 섞인 상품 카탈로그의 유사 상품 검색·클러스터링
strengths:
  - Apache-2.0
  - 최대 32K 토큰 입력, 64~4096 차원 사용자 지정(MRL)과 임베딩 양자화 지원
  - 작업별 지시문(instruction)을 붙이는 instruction-aware 방식, 30개 이상 언어 지원
  - 같은 시리즈 2B 크기와 Qwen3-VL-Reranker(2B·8B)가 함께 공개돼 검색-재정렬 조합이 쉬움
limitations:
  - 8B 규모라 텍스트 전용 소형 임베딩보다 색인 비용이 큼. 가벼운 용도는 같은 시리즈 2B 검토
  - 지시문은 영어로 쓰도록 권장 (학습 지시문 대부분이 영어)
  - 한국어를 명시한 언어 목록·평가 수치는 카드에 없음
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-VL-Embedding-8B
  - https://github.com/QwenLM/Qwen3-VL-Embedding
  - https://arxiv.org/abs/2601.04720
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("Qwen/Qwen3-VL-Embedding-8B")
queries = ["A woman playing with her dog on a beach at sunset."]
documents = [
    "A woman shares a joyful moment with her golden retriever on a beach at sunset.",
    "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-VL/assets/demo.jpeg",
]
query_embeddings = model.encode(queries)
doc_embeddings = model.encode(documents)
print(model.similarity(query_embeddings, doc_embeddings))
```

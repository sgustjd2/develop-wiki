---
name: Qwen3-VL-Reranker-2B
org: Alibaba Qwen
family: Qwen3-VL-Embedding
type: reranker
thinking: none
modalities: { input: [text, image, video], output: [text] }
architecture: dense
paramsB: 2.1
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-01-08
huggingface: https://huggingface.co/Qwen/Qwen3-VL-Reranker-2B
summary: Qwen3-VL-2B-Instruct 기반 멀티모달 리랭커. 질의와 문서가 텍스트·이미지·영상 중 무엇이든 (질의, 문서) 쌍의 관련도 점수를 낸다.
useCases:
  - Qwen3-VL-Embedding 으로 1차 검색한 이미지·스크린샷 후보를 재정렬하는 멀티모달 RAG 2단계
  - 텍스트 질의에 맞는 영상 클립·페이지 이미지 상위 결과 정밀화
strengths:
  - Apache-2.0
  - 2B 규모라 단일 GPU에서 재정렬 단계 지연을 낮게 유지
  - 최대 32K 토큰 입력, 작업별 지시문(instruction) 지원, 30개 이상 언어
  - Sentence Transformers CrossEncoder·vLLM 사용 예 제공, 더 정확한 8B 크기도 공개
limitations:
  - 쌍마다 모델을 돌리므로 후보 수가 많으면 비용이 큼 (임베딩 1차 검색과 함께 써야 함)
  - 한국어를 명시한 언어 목록·평가 수치는 카드에 없음
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-VL-Reranker-2B
  - https://github.com/QwenLM/Qwen3-VL-Embedding
  - https://arxiv.org/abs/2601.04720
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder("Qwen/Qwen3-VL-Reranker-2B")
query = "A woman playing with her dog on a beach at sunset."
documents = [
    "A woman shares a joyful moment with her golden retriever on a beach at sunset.",
    "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-VL/assets/demo.jpeg",
]
prompt = "Retrieve images or text relevant to the user's query."
print(model.rank(query, documents, prompt=prompt))
```

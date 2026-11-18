---
name: jina-reranker-v3.5
org: Jina AI
family: jina-reranker
type: reranker
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 0.597
license: CC-BY-NC-4.0
commercialUse: not-allowed
korean: unknown
releaseDate: 2026-07-14
huggingface: https://huggingface.co/jinaai/jina-reranker-v3.5
summary: Qwen3-0.6B 기반 다국어 리스트와이즈(listwise) 리랭커. 질의와 여러 후보 문서를 한 번의 순전파로 함께 넣어 순위를 매긴다.
useCases:
  - 후보 문서 수십~수백 개를 한 번에 재정렬해야 하는 검색 (비상업 연구·평가)
  - 표·JSON 같은 구조화 데이터와 법률·의료 문서 재정렬
  - jina-embeddings-v5 로 1차 검색한 결과의 2단계 정렬
strengths:
  - 최대 131K 토큰 컨텍스트, 슬라이딩 윈도·글로벌 혼합 어텐션
  - v3 대비 추론 1.22~1.56배 빠름(카드 기재)
  - GGUF·MLX 버전 제공
limitations:
  - CC-BY-NC-4.0 이라 상업 이용은 Jina API 나 별도 계약 필요
  - trust_remote_code 로 로드
  - 한국어 개별 지원 여부는 카드에 명시되지 않음
capabilities: [multilingual, long-context]
sources:
  - https://huggingface.co/jinaai/jina-reranker-v3.5
  - https://arxiv.org/abs/2607.18152
verifiedAt: 2026-11-18
---

## 사용 예

```python
from transformers import AutoModel

model = AutoModel.from_pretrained("jinaai/jina-reranker-v3.5", dtype="auto", trust_remote_code=True)
model.eval()
results = model.rerank("What are the health benefits of green tea?", ["Green tea contains antioxidants...", "Basketball is popular in the US."])
```

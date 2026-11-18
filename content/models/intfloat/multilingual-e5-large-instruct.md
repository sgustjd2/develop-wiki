---
name: multilingual-e5-large-instruct
org: Microsoft (intfloat)
family: E5
type: embedding
thinking: none
modalities: { input: [text], output: [vector] }
architecture: dense
paramsB: 0.56
license: MIT
commercialUse: allowed
korean: basic
releaseDate: 2024-02-08
huggingface: https://huggingface.co/intfloat/multilingual-e5-large-instruct
summary: XLM-RoBERTa-large 계열 24층 다국어 임베딩 모델. 쿼리 앞에 한 문장 작업 지시문을 붙여 1024차원 벡터를 만든다.
useCases:
  - 짧은 문단 단위로 쪼갠 한국어·다국어 FAQ·지식베이스 검색
  - 다국어 텍스트 분류·클러스터링용 특징 추출
  - 새 임베딩 모델 도입 전 비교 기준선
strengths:
  - MIT 라이선스
  - 카드의 MTEB 결과에 한국어(ko) 분류 과제 점수 포함
  - sentence-transformers·Infinity 등 주요 도구에서 바로 사용
limitations:
  - 입력 512토큰 초과분은 잘림(카드 명시)
  - 2024년 모델이라 최신 LLM 기반 임베딩보다 장문·코드 검색에 불리
capabilities: [multilingual]
sources:
  - https://huggingface.co/intfloat/multilingual-e5-large-instruct
  - https://arxiv.org/abs/2402.05672
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("intfloat/multilingual-e5-large-instruct")
task = "Given a web search query, retrieve relevant passages that answer the query"
texts = [f"Instruct: {task}\nQuery: 연차 휴가 신청 방법", "연차는 사내 포털에서 신청합니다."]
embeddings = model.encode(texts, convert_to_tensor=True, normalize_embeddings=True)
```

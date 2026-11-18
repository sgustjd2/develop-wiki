---
name: Granite-Embedding-311M-Multilingual-R2
org: IBM
family: Granite Embedding
type: embedding
thinking: none
modalities: { input: [text], output: [vector] }
architecture: dense
paramsB: 0.312
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2026-04-29
huggingface: https://huggingface.co/ibm-granite/granite-embedding-311m-multilingual-r2
summary: ModernBERT 기반 311M 다국어 텍스트 임베딩 모델. 768차원 벡터를 내고 32,768 토큰 입력과 200개 이상 언어를 지원한다.
useCases:
  - GPU 없이 CPU·ONNX·OpenVINO 로 돌리는 다국어 사내 검색
  - 긴 계약서·매뉴얼을 잘게 자르지 않고 임베딩하는 장문 검색
  - 다국어 질의로 코드(Python·Go·Java 등)를 찾는 코드 검색
strengths:
  - Apache-2.0
  - 강화 지원 52개 언어 목록에 한국어(ko) 명시
  - MRL 로 512/384/256/128 차원 절단, vLLM·llama.cpp(GGUF) 호환
  - 지연이 중요하면 97M 변형(384차원)을 선택 가능
limitations:
  - 텍스트 전용
  - 한국어 단독 평가 수치는 카드에 없음
capabilities: [multilingual]
sources:
  - https://huggingface.co/ibm-granite/granite-embedding-311m-multilingual-r2
  - https://huggingface.co/papers/2605.13521
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("ibm-granite/granite-embedding-311m-multilingual-r2")
embeddings = model.encode(["검색 질의", "검색 대상 문서"])
```

---
name: nomic-embed-text-v2-moe
org: Nomic AI
family: Nomic Embed
type: embedding
thinking: none
modalities: { input: [text], output: [vector] }
architecture: moe
paramsB: 0.475
activeParamsB: 0.305
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2025-02-11
huggingface: https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe
summary: MoE 구조를 쓴 다국어 텍스트 임베딩 모델(총 475M, 활성 305M). 약 100개 언어를 지원하고 768~256 차원 출력(MRL)을 낸다.
useCases:
  - CPU·소형 GPU 서버에서 돌리는 다국어 FAQ·지식베이스 검색
  - 256 차원으로 잘라 저장 비용을 줄이는 대규모 다국어 문서 색인
strengths:
  - Apache-2.0, 가중치·학습 코드·학습 데이터까지 공개
  - 8개 전문가 중 2개만 활성화해 같은 크기 dense 모델보다 추론 비용이 낮음
  - 16억 쌍 다국어 데이터로 학습, MIRACL 다국어 검색에서 같은 체급 대비 강세(카드 표)
limitations:
  - 최대 입력 512 토큰이라 긴 문서는 청크를 잘게 나눠야 함
  - 질의에 "search_query:", 문서에 "search_document:" 접두어를 반드시 붙여야 함
  - trust_remote_code=True 필요, 카드가 언어별 성능 편차를 한계로 명시
  - 한국어는 카드 언어 목록에 있으나 한국어별 평가 수치는 없음
capabilities: [multilingual]
sources:
  - https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe
  - https://www.nomic.ai/blog/posts/nomic-embed-text-v2
  - https://arxiv.org/abs/2502.07972
verifiedAt: 2026-11-18
---

## 사용 예

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("nomic-ai/nomic-embed-text-v2-moe", trust_remote_code=True)
embeddings = model.encode(["Hello!", "¡Hola!"], prompt_name="passage")
print(model.similarity(embeddings[0], embeddings[1]))
```

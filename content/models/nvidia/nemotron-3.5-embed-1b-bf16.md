---
name: Nemotron-3.5-Embed-1B-BF16
org: NVIDIA
family: Nemotron Retriever
type: embedding
thinking: none
modalities: { input: [text, image], output: [vector] }
architecture: dense
paramsB: 1.55
license: OpenMDW-1.1
commercialUse: allowed
korean: basic
releaseDate: 2026-10-20
huggingface: https://huggingface.co/nvidia/Nemotron-3.5-Embed-1B-BF16
summary: 텍스트 질의로 텍스트 청크나 문서 페이지 이미지(표·차트 포함)를 찾는 다국어 멀티모달 임베딩 모델. 8B 교사 모델에서 증류했고 2048차원 벡터를 낸다.
useCases:
  - PDF 를 OCR 없이 페이지 이미지 그대로 색인하는 비주얼 문서 RAG
  - 한국어 포함 다국어 사내 문서 질의응답 검색
  - Nemotron-3.5-Rerank 와 묶은 2단계 멀티모달 검색 파이프라인
strengths:
  - 지원 언어에 한국어 명시, 이미지 검색 평가 18개 언어에도 한국어 포함
  - 벡터를 앞에서부터 잘라 1024·512 차원 등으로 축소 가능
  - 같은 계열에 8B BF16·1B NVFP4 변형
  - 카드에 상업·비상업 사용 가능 명시
limitations:
  - 질의는 텍스트만, 이미지는 문서 쪽에서만 입력
  - transformers 5.x 기준 예제, FlashAttention 2 권장
sources:
  - https://huggingface.co/nvidia/Nemotron-3.5-Embed-1B-BF16
  - https://huggingface.co/blog/nvidia/nemotron-retriever-world-class-agentic-retrieval
  - https://openmdw.ai/license/1-1/
capabilities: [multilingual]
verifiedAt: 2026-11-18
---

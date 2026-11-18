---
name: Nemotron-3.5-Rerank-8B-BF16
org: NVIDIA
family: Nemotron Retriever
type: reranker
thinking: none
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 8.38
license: OpenMDW-1.1
commercialUse: allowed
korean: basic
releaseDate: 2026-10-20
huggingface: https://huggingface.co/nvidia/Nemotron-3.5-Rerank-8B-BF16
summary: Ministral-3-8B 기반 다국어 멀티모달 리랭커. 텍스트 질의와 텍스트·페이지 이미지(차트 포함) 문서 쌍의 관련도를 로짓으로 낸다.
useCases:
  - 페이지 이미지로 색인한 PDF·슬라이드의 비주얼 RAG 재정렬
  - Nemotron-3.5-Embed 와 묶은 한국어 포함 다국어 문서 검색 2단계
  - 차트·표가 많은 보고서 검색 정확도 개선
strengths:
  - 지원 언어에 한국어 명시
  - 최대 32,768 토큰 입력
  - 카드 기준 2026-10-20 ViDoRe v3.1 리랭킹 리더보드 1위
  - 카드에 상업·비상업 사용 가능 명시
limitations:
  - 8B 라 후보가 많으면 GPU 비용이 큼
  - 질의는 텍스트만
sources:
  - https://huggingface.co/nvidia/Nemotron-3.5-Rerank-8B-BF16
  - https://huggingface.co/blog/nvidia/nemotron-retriever-world-class-agentic-retrieval
  - https://openmdw.ai/license/1-1/
capabilities: [multilingual]
verifiedAt: 2026-11-18
---

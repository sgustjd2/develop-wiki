---
name: jina-embeddings-v5-omni-small
org: Jina AI
family: jina-embeddings-v5
type: embedding
thinking: none
modalities: { input: [text, image, audio, video], output: [vector] }
architecture: dense
paramsB: 1.74
license: CC-BY-NC-4.0
commercialUse: not-allowed
korean: unknown
releaseDate: 2026-05-08
huggingface: https://huggingface.co/jinaai/jina-embeddings-v5-omni-small
summary: 텍스트·이미지·영상·오디오·PDF 를 텍스트 전용 jina-embeddings-v5-text-small 과 같은 벡터 공간에 넣는 멀티모달 임베딩 모델. 검색·분류·클러스터링·텍스트 매칭 어댑터를 담고 있다.
useCases:
  - 이미 text-small 로 만든 텍스트 색인에 이미지·영상·오디오를 재색인 없이 추가
  - PDF·스크린샷·회의 녹음이 섞인 사내 자료의 통합 검색 (비상업 연구·평가)
  - 미디어 중복 탐지와 주제 클러스터링
strengths:
  - 최대 32,768 토큰, 1024차원 (MRL 32~1024)
  - 작업별 병합 변형(-retrieval, -classification 등)과 GGUF·MLX 버전 제공
  - 더 작은 omni-nano 와 텍스트 전용 v5-text-small/nano 도 공개
limitations:
  - CC-BY-NC-4.0 이라 상업 이용은 Jina/Elastic API 나 별도 계약 필요
  - 한국어 개별 지원 여부는 카드에 명시되지 않음 (언어 메타데이터 "multilingual")
capabilities: [multilingual]
sources:
  - https://huggingface.co/jinaai/jina-embeddings-v5-omni-small
  - https://arxiv.org/abs/2605.08384
verifiedAt: 2026-11-18
---

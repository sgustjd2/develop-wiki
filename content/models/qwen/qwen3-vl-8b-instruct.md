---
name: Qwen3-VL-8B-Instruct
org: Alibaba Qwen
family: Qwen3-VL
type: vlm
thinking: none
modalities: { input: [text, image, video], output: [text] }
architecture: dense
paramsB: 8.8
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-10-15
huggingface: https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct
summary: 이미지·영상·문서를 이해하는 Qwen3-VL 계열의 8B 비전 언어 모델. 2D/3D 위치 지정, 32개 언어 OCR, GUI 조작을 지원한다.
useCases:
  - 단일 24GB GPU에서 돌리는 스크린샷·차트·스캔 문서 질의응답
  - 상품·문서 이미지에서 객체 좌표나 표 내용을 JSON으로 추출
  - 몇 시간 길이 영상의 장면 검색·요약
strengths:
  - 네이티브 256K 컨텍스트(1M까지 확장 가능)로 긴 문서·영상 처리
  - 텍스트 성능이 같은 크기 텍스트 전용 모델과 비슷하다고 공개
  - 같은 크기의 Thinking 변형(Qwen3-VL-8B-Thinking)과 2B/4B/32B/30B-A3B/235B-A22B 크기가 함께 공개됨
limitations:
  - 고해상도 이미지·긴 영상은 시각 토큰이 많아 메모리 사용이 큼
  - 이후 이미지 입력을 기본 지원하는 범용 Qwen3.5/3.6 계열이 나와, 범용 챗봇 용도라면 그쪽도 비교 필요
capabilities: [grounding, long-context, multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct
  - https://github.com/QwenLM/Qwen3-VL
  - https://arxiv.org/abs/2511.21631
verifiedAt: 2026-11-18
---

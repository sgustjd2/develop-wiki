---
name: InternVL3.5-8B
org: Shanghai AI Lab (OpenGVLab)
family: InternVL3.5
type: vlm
thinking: hybrid
modalities: { input: [text, image, video], output: [text] }
architecture: dense
paramsB: 8.5
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-08-26
huggingface: https://huggingface.co/OpenGVLab/InternVL3_5-8B
summary: InternViT-300M 비전 인코더와 Qwen3-8B 언어 모델을 결합한 오픈소스 VLM. Cascade RL 로 멀티모달 추론을 강화했다.
useCases:
  - 단일 GPU에서 돌리는 수학·과학 문제 이미지 풀이와 차트 해석
  - 사내 문서·도표 이미지 질의응답을 자체 호스팅해야 할 때
  - 연구용 VLM 파인튜닝 출발점(학습 코드·중간 체크포인트 공개)
strengths:
  - 시스템 프롬프트로 thinking 모드를 켜서 단계별 추론 가능
  - Visual Resolution Router 로 시각 토큰 해상도를 동적으로 조절
  - 1B~241B-A28B 까지 크기가 다양하고, Pretrained·Instruct·MPO 중간 체크포인트와 HF 포맷(-HF)을 함께 공개
limitations:
  - SFT 단계 컨텍스트가 32K 토큰이라 공식 지원 컨텍스트 길이는 카드에 명시되지 않음
  - 2025-08 공개 모델로, 이후 Qwen3-VL·MiniCPM-V 4.7 등 후속 VLM 이 나옴
capabilities: []
sources:
  - https://huggingface.co/OpenGVLab/InternVL3_5-8B
  - https://github.com/OpenGVLab/InternVL
  - https://huggingface.co/papers/2508.18265
verifiedAt: 2026-11-18
---

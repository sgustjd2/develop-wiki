---
name: Qwen3-Omni-30B-A3B-Instruct
org: Alibaba Qwen
family: Qwen3-Omni
type: omni
thinking: none
modalities: { input: [text, image, audio, video], output: [text, audio] }
architecture: moe
paramsB: 35.3
activeParamsB: 3
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2025-09-22
huggingface: https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct
summary: 텍스트·이미지·오디오·영상을 입력받아 텍스트와 음성으로 실시간 스트리밍 응답하는 엔드투엔드 옴니 모델.
useCases:
  - 음성으로 대화하는 실시간 상담·비서 서비스
  - 회의 녹음·영상의 내용 분석과 요약
strengths:
  - MoE 기반 Thinker–Talker 구조로 저지연 음성 응답
  - 텍스트 119개, 음성 입력 19개, 음성 출력 10개 언어 지원(한국어 음성 입·출력 포함)
  - 사고 특화 Thinking 변형과 오디오 캡셔너 변형이 별도로 공개됨
limitations:
  - 인코더·Talker 를 포함해 체크포인트가 35B 규모라 메모리 요구가 큼
  - 활성 파라미터 3B 는 모델명(A3B) 기준 Thinker 값. 총 35B 에는 인코더·Talker 포함
capabilities: [multilingual, grounding]
sources:
  - https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct
  - https://huggingface.co/api/models/Qwen/Qwen3-Omni-30B-A3B-Instruct
verifiedAt: 2026-11-18
---

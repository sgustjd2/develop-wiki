---
name: MiniCPM-V 4.7 35B-A3B
org: OpenBMB
family: MiniCPM-V
type: vlm
thinking: hybrid
modalities: { input: [text, image, video], output: [text] }
architecture: moe
paramsB: 35.2
activeParamsB: 3
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-10-12
huggingface: https://huggingface.co/openbmb/MiniCPM-V-4.7-35B-A3B
summary: MiniCPM-V 시리즈 첫 MoE 비전 언어 모델. 단일·다중 이미지와 영상 이해를 휴대폰·태블릿에서 돌리는 것을 목표로 한다.
useCases:
  - 스마트폰·태블릿 온디바이스 이미지·영상 이해 앱
  - 클라우드 전송 없이 처리해야 하는 사진·문서 이미지 질의응답
  - llama.cpp·Ollama 기반 로컬 멀티모달 비서
strengths:
  - Lookahead Expert Scheduling 으로 iPhone 17 Pro Max 에서 약 3GB 메모리로 초당 13토큰 이상 디코딩한다고 공개
  - 시각 토큰 4x/16x 혼합 압축으로 디테일과 추론 비용을 조절
  - SGLang, vLLM, llama.cpp, Ollama 지원과 AWQ·GPTQ·GGUF·int4 양자화본 제공
  - 같은 세대의 초소형 변형 MiniCPM-V 4.7 1B 도 공개
limitations:
  - 활성 파라미터 3B 는 모델명 기준
  - 언어 백본은 Qwen3.5/Qwen3.6 기반
  - thinking 은 enable_thinking 플래그로 켜고 끄며, 공개 예제는 끈 상태가 기본
capabilities: []
sources:
  - https://huggingface.co/openbmb/MiniCPM-V-4.7-35B-A3B
  - https://github.com/OpenBMB/MiniCPM-o
  - https://github.com/OpenBMB/MiniCPM-o/blob/main/docs/minicpm_v4dot7_en.md
verifiedAt: 2026-11-18
---

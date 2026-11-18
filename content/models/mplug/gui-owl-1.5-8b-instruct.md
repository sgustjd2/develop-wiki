---
name: GUI-Owl 1.5 8B Instruct
org: mPLUG (Alibaba Tongyi)
family: GUI-Owl
type: gui-agent
thinking: none
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 8.8
license: MIT
commercialUse: allowed
korean: unknown
releaseDate: 2026-02-14
huggingface: https://huggingface.co/mPLUG/GUI-Owl-1.5-8B-Instruct
summary: Qwen3-VL 기반 GUI 에이전트 모델. 데스크톱·모바일·브라우저 화면을 보고 조작 액션을 낸다.
useCases:
  - 모바일 앱·데스크톱 업무 자동화 에이전트
  - Mobile-Agent-v3.5 프레임워크의 planner·executor·verifier 역할 모델
strengths:
  - 도구·MCP 호출과 장기 메모리 기능 내장
  - 2B·4B·8B·32B Instruct 와 Thinking 변형을 함께 공개
  - MIT 라이선스
limitations:
  - 모델 카드에 컨텍스트 길이·지원 언어가 명시되지 않음
capabilities: [tool-calling, grounding]
sources:
  - https://huggingface.co/mPLUG/GUI-Owl-1.5-8B-Instruct
  - https://huggingface.co/api/models/mPLUG/GUI-Owl-1.5-8B-Instruct
  - https://arxiv.org/abs/2602.16855
verifiedAt: 2026-11-18
---

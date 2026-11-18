---
name: Qwen3-Coder-30B-A3B-Instruct
org: Alibaba Qwen
family: Qwen3-Coder
type: code-llm
thinking: none
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 30.5
activeParamsB: 3.3
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-07-31
huggingface: https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct
summary: 활성 3.3B 의 MoE 코드 모델. Qwen Code·Cline 같은 에이전트 코딩 도구와 함수 호출 포맷을 지원한다.
useCases:
  - 로컬 GPU 하나로 돌리는 IDE 코딩 에이전트 백엔드
  - 저장소 단위 코드 이해·수정 자동화
strengths:
  - 네이티브 256K 컨텍스트, YaRN 으로 1M 까지 확장
  - 비사고형이라 응답 지연이 짧음
  - Apache-2.0
limitations:
  - 사고 모드가 없어 복잡한 설계 추론은 약할 수 있음
  - 후속으로 Qwen3-Coder-Next 가 공개됨
capabilities: [tool-calling, long-context]
sources:
  - https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct
  - https://github.com/QwenLM/Qwen3-Coder
verifiedAt: 2026-11-18
---

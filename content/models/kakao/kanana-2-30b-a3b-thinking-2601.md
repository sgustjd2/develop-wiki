---
name: Kanana-2-30B-A3B-Thinking-2601
org: Kakao
family: Kanana-2
type: reasoning-llm
thinking: native
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 30.7
activeParamsB: 3
contextLength: 32768
license: Kanana License
commercialUse: restricted
korean: good
releaseDate: 2026-01-15
huggingface: https://huggingface.co/kakaocorp/kanana-2-30b-a3b-thinking-2601
summary: 카카오가 처음부터 학습한 Kanana-2 MoE 의 추론 전용 변형. 한국어를 포함한 6개 언어와 툴 호출을 지원한다.
useCases:
  - 한국어 수학·논리 문제 풀이와 근거 설명이 필요한 사내 서비스
  - 한국어 업무 에이전트의 계획·추론 단계
strengths:
  - MLA 어텐션과 128 전문가 MoE(활성 3B)로 추론 비용이 낮음
  - 한국어 토큰화 효율을 개선한 새 토크나이저, 한·영·일·중·태·베 지원
  - vLLM·SGLang 의 reasoning/tool-call parser 사용 예제 제공
limitations:
  - 기본 config 는 32K 이하이며 더 긴 입력은 YaRN 설정이 필요
  - API·SI·온디바이스 형태로 제3자에게 제공하거나 MAU 1천만 초과 시 별도 상업 라이선스 필요, "Powered by Kanana" 표기 의무
  - 같은 날 공개된 Instruct 변형(kanana-2-30b-a3b-instruct-2601)이 비사고형 범용 용도
capabilities: [tool-calling, multilingual]
sources:
  - https://huggingface.co/kakaocorp/kanana-2-30b-a3b-thinking-2601
  - https://huggingface.co/kakaocorp/kanana-2-30b-a3b-thinking-2601/blob/main/LICENSE
  - https://tech.kakao.com/posts/808
verifiedAt: 2026-11-18
---

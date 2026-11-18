---
name: Kimi K2.7 Code
org: Moonshot AI
family: Kimi K2
type: code-llm
thinking: native
modalities: { input: [text, image], output: [text] }
architecture: moe
paramsB: 1000
activeParamsB: 32
contextLength: 262144
license: Modified MIT
commercialUse: restricted
korean: unknown
releaseDate: 2026-06-12
huggingface: https://huggingface.co/moonshotai/Kimi-K2.7-Code
summary: Kimi K2.6 을 바탕으로 장기 코딩 에이전트 작업에 맞춰 튜닝한 1T MoE 코드 모델. 항상 사고 모드로 동작한다.
useCases:
  - 여러 파일·여러 단계에 걸친 저장소 단위 코딩 에이전트를 자체 GPU 클러스터에서 운영할 때
  - MCP 툴을 많이 쓰는 장시간 개발 자동화
strengths:
  - K2.6 대비 사고 토큰 사용을 약 30% 줄였다고 공개
  - K2.5/K2.6 과 같은 아키텍처라 기존 vLLM·SGLang 배포 방식을 재사용 가능
  - 네이티브 int4 양자화 가중치 배포
limitations:
  - 총 1T 파라미터라 다중 GPU 노드가 필요
  - 사고 모드를 끌 수 없음(Instant 모드 미지원)
  - 영상 입력은 공식 API 에서만 실험적으로 지원
  - 월 사용자 1억 명 또는 월 매출 2천만 달러 초과 서비스는 UI 에 "Kimi K2.7 Code" 표기 의무
capabilities: [tool-calling, long-context]
sources:
  - https://huggingface.co/moonshotai/Kimi-K2.7-Code
  - https://huggingface.co/moonshotai/Kimi-K2.7-Code/blob/main/LICENSE
  - https://huggingface.co/api/models/moonshotai/Kimi-K2.7-Code/commits/main
verifiedAt: 2026-11-18
---

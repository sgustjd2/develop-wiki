---
name: GLM-5.3
org: Z.ai
family: GLM-5
type: text-llm
thinking: native
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 744
activeParamsB: 40
contextLength: 1048576
license: GLM-5.3 License
commercialUse: restricted
korean: unknown
releaseDate: 2026-08-28
huggingface: https://huggingface.co/zai-org/GLM-5.3
summary: GLM-5.2 와 같은 베이스에 사후 학습만 강화한 대형 MoE 모델. 코딩·장기 에이전트 작업에 맞춰져 있다.
useCases:
  - 터미널·저장소 단위 에이전트 코딩을 자체 인프라에서 운영할 때
  - 장시간 다단계 자동화 작업의 에이전트 모델
strengths:
  - reasoning_effort(low/high/max)로 사고 예산 조절
  - SGLang·vLLM·KTransformers 등 서빙 지원이 넓음
limitations:
  - 채팅 템플릿에 사고 끄기 옵션이 없음(기본 max)
  - 연 매출 100억 달러 초과 MaaS 사업자는 상업 이용 전 Z.ai 보안 심사 필요
  - 744B 규모라 다중 노드급 자원 필요
capabilities: [tool-calling, long-context]
sources:
  - https://huggingface.co/zai-org/GLM-5.3/blob/main/config.json
  - https://huggingface.co/zai-org/GLM-5.3
  - https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE
  - https://huggingface.co/api/models/zai-org/GLM-5.3
  - https://github.com/zai-org/GLM-5
verifiedAt: 2026-11-18
---

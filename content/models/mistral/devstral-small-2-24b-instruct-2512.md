---
name: Devstral Small 2 (24B Instruct 2512)
org: Mistral AI
family: Devstral
type: code-llm
thinking: none
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 24
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-12-09
huggingface: https://huggingface.co/mistralai/Devstral-Small-2-24B-Instruct-2512
summary: 소프트웨어 엔지니어링 에이전트용 24B 코드 모델. 도구로 코드베이스를 탐색하고 여러 파일을 편집하는 작업에 맞춰져 있다.
useCases:
  - RTX 4090 한 장이나 32GB Mac 에서 돌리는 로컬 코딩 에이전트
  - Mistral Vibe CLI·SWE-agent 같은 에이전트 하네스의 모델
strengths:
  - 256K 컨텍스트와 이미지 입력 지원
  - Apache-2.0
limitations:
  - 체크포인트가 FP8 로 배포됨
capabilities: [tool-calling, long-context]
sources:
  - https://mistral.ai/news/devstral-2-vibe-cli/
  - https://huggingface.co/mistralai/Devstral-Small-2-24B-Instruct-2512
  - https://huggingface.co/api/models/mistralai/Devstral-Small-2-24B-Instruct-2512
verifiedAt: 2026-11-18
---

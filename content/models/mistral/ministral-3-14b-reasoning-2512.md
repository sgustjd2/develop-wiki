---
name: Ministral 3 14B Reasoning 2512
org: Mistral AI
family: Ministral 3
type: reasoning-llm
thinking: native
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 13.9
contextLength: 262144
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2025-12-02
huggingface: https://huggingface.co/mistralai/Ministral-3-14B-Reasoning-2512
summary: Ministral 3 14B 의 추론 후학습 변형. 수학·코딩·STEM 추론용이며 이미지 입력과 함수 호출을 지원한다.
useCases:
  - 32GB VRAM(양자화 시 24GB 미만) 로컬 환경의 수학·코딩 추론
  - 사내망에서 돌리는 다단계 에이전트의 추론 담당 모델
strengths:
  - 13.5B 언어 모델 + 0.4B 비전 인코더로 이미지 질의도 가능
  - 네이티브 함수 호출·JSON 출력, 256K 컨텍스트
  - 같은 크기의 Instruct·Base 변형과 3B/8B 크기도 공개
limitations:
  - 멀티턴에서 추론 트레이스를 컨텍스트에 유지하도록 권장해 토큰 사용이 늘어남
  - 이미지는 1:1 에 가까운 비율일 때 성능이 좋다고 안내
capabilities: [tool-calling, structured-output, long-context, multilingual]
sources:
  - https://huggingface.co/mistralai/Ministral-3-14B-Reasoning-2512
  - https://mistral.ai/news/mistral-3
  - https://arxiv.org/abs/2601.08584
verifiedAt: 2026-11-18
---

---
name: Qwen2.5-Math-PRM-7B
org: Alibaba Qwen
family: Qwen2.5-Math
type: reward
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 7.6
license: Qwen License
commercialUse: restricted
korean: unknown
releaseDate: 2025-01-13
huggingface: https://huggingface.co/Qwen/Qwen2.5-Math-PRM-7B
summary: 수학 풀이의 각 단계를 0~1 점수로 평가하는 프로세스 리워드 모델(PRM). 최종 답이 아니라 중간 추론 단계의 오류를 찾는다.
useCases:
  - 수학 추론 모델의 단계별 풀이 검증과 오류 단계 위치 찾기
  - 여러 풀이 후보 중 단계 점수가 높은 것을 고르는 Best-of-N·트리 탐색
  - 추론 모델 강화학습의 단계 보상
strengths:
  - 단계 구분 토큰(<extra_0>) 위치마다 점수를 내 어느 단계가 틀렸는지 보임
  - 더 큰 Qwen2.5-Math-PRM-72B 도 공개
limitations:
  - 수학 영역 특화, 영어·중국어 메타데이터
  - 생성용이 아니라 평가 전용
  - Qwen License(월 활성 사용자 1억 초과 시 별도 허가)
sources:
  - https://huggingface.co/Qwen/Qwen2.5-Math-PRM-7B
  - https://arxiv.org/abs/2501.07301
verifiedAt: 2026-11-18
---

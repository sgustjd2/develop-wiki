---
name: gpt-oss-safeguard-20b
org: OpenAI
family: gpt-oss
type: guard
thinking: native
modalities: { input: [text], output: [text] }
architecture: moe
paramsB: 21.5
activeParamsB: 3.6
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-10-29
huggingface: https://huggingface.co/openai/gpt-oss-safeguard-20b
summary: gpt-oss-20b 를 안전 추론용으로 튜닝한 MoE 모델. 사용자가 작성한 정책 문서를 읽고 콘텐츠가 정책을 위반하는지 추론 과정과 함께 판정한다.
useCases:
  - 고정 카테고리가 아닌 자사 운영 정책(커뮤니티 가이드라인 등)으로 게시물·대화를 라벨링
  - Trust & Safety 팀의 오프라인 대량 라벨링과 판정 근거 검토
  - 16GB VRAM GPU 한 장에서 돌리는 정책 기반 입력·출력 필터
strengths:
  - Apache-2.0
  - 정책을 프롬프트로 교체해 재학습 없이 판정 기준 변경 (bring your own policy)
  - 추론 강도(low/medium/high) 조절, 판정 근거(CoT) 확인 가능
  - 더 큰 gpt-oss-safeguard-120b(117B, 활성 5.1B)도 공개
limitations:
  - harmony 응답 포맷으로만 정상 동작
  - 항상 추론 과정을 생성해 분류 전용 소형 가드보다 지연이 큼 (사이트 규칙상 thinking 은 none 으로 표기)
  - 원시 CoT 는 일반 사용자 노출용이 아님
sources:
  - https://huggingface.co/openai/gpt-oss-safeguard-20b
  - https://openai.com/index/introducing-gpt-oss-safeguard/
  - https://cookbook.openai.com/articles/gpt-oss-safeguard-guide
verifiedAt: 2026-11-18
---

---
name: Arch-Router-1.5B
org: Katanemo (DigitalOcean)
family: Arch
type: classifier
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 1.5
license: Katanemo Community License
commercialUse: not-allowed
korean: unknown
releaseDate: 2025-06-19
huggingface: https://huggingface.co/katanemo/Arch-Router-1.5B
summary: Qwen2.5-1.5B-Instruct 기반 LLM 라우터. 대화를 보고 사용자가 정의한 도메인·작업(route) 중 가장 맞는 것을 JSON 으로 골라 어떤 모델에 보낼지 정한다.
useCases:
  - '"코드 생성은 모델 A, 요약은 모델 B" 같은 선호 기반 멀티 모델 라우팅'
  - 에이전트 프록시(Arch)에서 요청 의도를 분류해 하위 에이전트로 분기
  - 라우트 설명만 바꿔 재학습 없이 라우팅 규칙을 갱신해야 하는 서비스
strengths:
  - 라우트 이름·설명을 프롬프트로 주는 방식이라 새 라우트 추가에 재학습 불필요
  - 1.5B 로 작아 저지연 라우팅
limitations:
  - 상업적 사용 시 DigitalOcean 의 별도 상업 라이선스가 필요(라이선스 4조)
  - 제공된 프롬프트 형식에서 가장 잘 동작
  - 언어 메타데이터는 영어뿐
sources:
  - https://huggingface.co/katanemo/Arch-Router-1.5B
  - https://huggingface.co/katanemo/Arch-Router-1.5B/blob/main/LICENSE
  - https://arxiv.org/abs/2506.16655
verifiedAt: 2026-11-18
---

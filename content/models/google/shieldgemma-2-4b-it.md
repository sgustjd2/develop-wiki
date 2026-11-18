---
name: ShieldGemma 2 4B
org: Google
family: ShieldGemma
type: guard
thinking: none
modalities: { input: [image, text], output: [text] }
architecture: dense
paramsB: 4.3
license: Gemma Terms of Use
commercialUse: restricted
korean: unknown
releaseDate: 2025-03-12
huggingface: https://huggingface.co/google/shieldgemma-2-4b-it
summary: Gemma 3 4B IT 기반 이미지 안전 분류 모델. 실사·생성 이미지가 성적 콘텐츠, 위험 콘텐츠, 폭력·고어 정책을 위반하는지 판정한다.
useCases:
  - 이미지 생성 서비스의 출력 이미지 필터링
  - VLM 입력 이미지 사전 검사
  - 학습용 이미지 데이터셋에서 유해 이미지 걸러내기
strengths:
  - 이미지 전용 가드로 텍스트 가드와 조합해 쓰기 좋음
  - 정책별 Yes/No 확률을 얻을 수 있어 임계값 조정이 쉬움
limitations:
  - 판정 범주가 성적·위험·폭력 3가지
  - Gemma 금지 사용 정책 적용, 저장소 게이트
  - 텍스트 프롬프트·응답 자체의 안전성은 판정 대상이 아님
sources:
  - https://huggingface.co/google/shieldgemma-2-4b-it
  - https://blog.google/technology/developers/gemma-3/
  - https://arxiv.org/abs/2504.01081
verifiedAt: 2026-11-18
---

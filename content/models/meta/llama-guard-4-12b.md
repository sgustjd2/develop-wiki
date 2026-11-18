---
name: Llama Guard 4 12B
org: Meta
family: Llama Guard
type: guard
thinking: none
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 12.0
license: Llama 4 Community License
commercialUse: restricted
korean: unknown
releaseDate: 2025-04-29
huggingface: https://huggingface.co/meta-llama/Llama-Guard-4-12B
summary: Llama 4 Scout 에서 가지치기한 12B dense 가드 모델. 텍스트와 여러 장의 이미지가 섞인 프롬프트·응답의 안전 여부와 위반 카테고리(S1~S14)를 판정한다.
useCases:
  - 이미지 업로드를 받는 멀티모달 챗봇의 입력·출력 필터링
  - Llama Guard 3 8B(텍스트)와 11B-Vision(이미지)을 하나의 모델로 합쳐 운영하고 싶을 때
  - 코드 인터프리터 오용(S14) 등 S1~S14 위험 카테고리 기준의 정책 위반 로그 분류
strengths:
  - 한 프롬프트에 여러 이미지가 들어와도 판정 가능 (Llama Guard 3 11B-Vision 은 불가)
  - 단일 GPU 에서 실행 가능한 크기
  - 영어 외 Llama Guard 3 지원 언어(프랑스어·독일어·힌디어·이탈리아어·포르투갈어·스페인어·태국어) 텍스트 판정
limitations:
  - 한국어는 공식 지원 언어 목록에 없음
  - 저장소가 게이트(라이선스 동의 후 다운로드)
  - 카테고리가 고정적이라 자체 정책은 프롬프트 수정·추가 학습이 필요
capabilities: [multilingual]
sources:
  - https://huggingface.co/meta-llama/Llama-Guard-4-12B
  - https://ai.meta.com/blog/llamacon-llama-news/
verifiedAt: 2026-11-18
---

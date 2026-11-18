---
name: HyperCLOVA X SEED 32B Think
org: NAVER Cloud
family: HyperCLOVA X SEED
type: text-llm
thinking: hybrid
modalities: { input: [text, image, video], output: [text] }
architecture: dense
paramsB: 33.3
contextLength: 131072
license: HyperCLOVA X SEED 32B Think Model License
commercialUse: restricted
korean: good
releaseDate: 2025-12-29
huggingface: https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-32B
summary: SEED Think 14B 를 잇는 네이버의 32B 비전-언어 사고 모델. 한국어 지식, 이미지 이해, 에이전트 작업을 한 모델로 다룬다.
useCases:
  - 한국어 서비스에서 텍스트와 이미지(문서·차트)를 함께 받는 상담·비서
  - 한국어 수능형 수학 문제 같은 단계적 풀이가 필요한 작업
strengths:
  - chat_template_kwargs.thinking 으로 추론 모드를 켜고 thinking_token_budget 으로 길이 제한
  - 128K 컨텍스트
  - OpenAI 호환 API 를 내는 서빙 시스템 OmniServe 제공
limitations:
  - 공식 서빙 요구 사양이 A100 80GB 4장
  - 카드의 기본 정보는 영상 입력을 표기하지만 OmniServe 기능 항목은 텍스트·이미지만 명시
  - MAU 1천만 초과 시 별도 라이선스 필요, 금지 용도 정책 준수 의무
  - paramsB 는 safetensors 합계이며 카드 표기는 32B
capabilities: [long-context]
sources:
  - https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-32B
  - https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-32B/blob/main/LICENSE
verifiedAt: 2026-11-18
---

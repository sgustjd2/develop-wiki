---
name: Granite Guardian 4.1 8B
org: IBM
family: Granite Guardian
type: guard
thinking: hybrid
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 8.4
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-04-29
huggingface: https://huggingface.co/ibm-granite/granite-guardian-4.1-8b
summary: granite-4.1-8b 를 파인튜닝한 판정 모델. 유해성·탈옥 같은 안전 기준과 RAG 근거성·함수 호출 환각, 사용자가 직접 쓴 기준(BYOC)을 yes/no 로 판정한다.
useCases:
  - RAG 응답이 검색 문서에 근거하는지(groundedness)·문맥 관련성 검사
  - 에이전트의 함수 호출 인자 환각 탐지
  - '"3문장 이내" 같은 사내 출력 규칙을 자연어 기준으로 적어 응답을 검수'
  - 프롬프트·응답 유해성 및 탈옥 시도 필터링
strengths:
  - Apache-2.0
  - think 모드(추론 과정 출력)와 no-think 모드(점수만, 저지연)를 프롬프트로 전환
  - Best-of-N 선택용 리워드 모델로도 쓸 수 있다고 카드에 명시
limitations:
  - 정해진 guardian 프롬프트 템플릿을 벗어나면 예기치 않은 출력이 나올 수 있다고 카드가 경고
  - 카드의 언어 메타데이터는 영어뿐
sources:
  - https://huggingface.co/ibm-granite/granite-guardian-4.1-8b
  - https://github.com/ibm-granite/granite-guardian
verifiedAt: 2026-11-18
---

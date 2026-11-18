---
name: Aion 1.0 Instruct 2.3B
org: Microsoft
family: Aion
type: text-llm
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 2.3
contextLength: 32768
license: MIT
commercialUse: allowed
korean: none
releaseDate: 2026-11-18
huggingface: https://huggingface.co/microsoft/Aion-1.0-Instruct-2.3B
summary: Microsoft Windows Applied Sciences Group 가 만든 2.3B 온디바이스용 소형 지시 모델. 요약·재작성·문서 이해·질의응답을 32K 컨텍스트로 처리한다.
useCases:
  - 기기 안에서 이메일 스레드·여러 쪽짜리 문서를 요약하고 다시 쓰는 프라이버시 중시 기능
  - Windows 온디바이스 SLM(Phi Silica 후속) 방향을 미리 시험하는 소형 모델 평가
  - 툴 호출 포맷을 갖춘 소형 로컬 에이전트의 실험용 백본
strengths:
  - 28개 레이어, 슬라이딩 윈도우 21층과 전체 어텐션 7층을 섞은 구조에 GQA 사용
  - 영어·독일어·스페인어·포르투갈어·이탈리아어·프랑스어·중국어·일본어 지원, IFEval 83.90 보고(카드)
  - 공식 툴 호출 포맷(<|tool_call|>)과 채팅 템플릿 제공
limitations:
  - 카드가 사전 공개용(프리뷰)이라고 밝히며 양자화본은 이후 공개 예정, 최적화 버전은 2027-01 말 Windows 에 탑재 예정
  - 카드의 지원 언어 목록에 한국어가 없음
  - 복잡한 다단계 추론과 세계 지식은 약하고 MMLU-Pro 33.35, GPQA 28.18 로 소형 모델 한계가 큼
  - custom_code(trust_remote_code)가 필요하고 transformers 5.x 로 내보낸 모델
capabilities: [tool-calling, multilingual]
sources:
  - https://huggingface.co/microsoft/Aion-1.0-Instruct-2.3B
  - https://huggingface.co/api/models/microsoft/Aion-1.0-Instruct-2.3B
  - https://github.com/microsoft/Aion-Instruct-Preview-Sample
verifiedAt: 2026-11-19
---

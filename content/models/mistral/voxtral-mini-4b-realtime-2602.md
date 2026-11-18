---
name: Voxtral Mini 4B Realtime 2602
org: Mistral AI
family: Voxtral
type: asr
thinking: none
modalities: { input: [audio], output: [text] }
architecture: dense
paramsB: 4.4
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2026-02-04
huggingface: https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602
summary: 네이티브 스트리밍 구조의 실시간 음성 전사 모델. 13개 언어를 지원하며 지연 시간을 240ms~2.4s 사이에서 조절한다.
useCases:
  - 음성 비서·라이브 자막처럼 500ms 이하 지연이 필요한 실시간 전사
  - 온디바이스·사내망 회의 실시간 기록
strengths:
  - 480ms 지연에서 오프라인 오픈소스 전사 모델과 비슷한 정확도를 낸다고 공개
  - 인과(causal) 오디오 인코더와 슬라이딩 윈도우 어텐션으로 장시간 스트리밍
  - vLLM 의 스트리밍 입력·웹소켓 세션 지원
limitations:
  - 지원 언어가 13개로 제한
  - 긴 녹음은 max-model-len 을 길이에 맞게 설정해야 함(텍스트 토큰 1개가 80ms)
capabilities: [multilingual]
sources:
  - https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602
  - https://mistral.ai/news/voxtral-transcribe-2
  - https://arxiv.org/abs/2602.11298
verifiedAt: 2026-11-18
---

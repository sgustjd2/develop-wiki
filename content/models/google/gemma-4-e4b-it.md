---
name: Gemma 4 E4B IT
org: Google DeepMind
family: Gemma 4
type: text-llm
thinking: hybrid
modalities: { input: [text, image, audio, video], output: [text] }
architecture: dense
paramsB: 8
contextLength: 131072
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-04-02
huggingface: https://huggingface.co/google/gemma-4-E4B-it
summary: 유효 4.5B 파라미터의 온디바이스용 Gemma 4. 텍스트·이미지와 함께 오디오 입력(음성 인식·번역)을 처리한다.
useCases:
  - 휴대폰·노트북에서 음성 전사와 이미지 질의응답을 한 모델로 처리
  - 오프라인 환경의 경량 멀티모달 어시스턴트
strengths:
  - Per-Layer Embeddings 로 임베딩 포함 8B 지만 유효 연산은 4.5B 수준
  - 128K 컨텍스트, 함수 호출 지원
  - Apache-2.0
limitations:
  - 출력은 텍스트만(음성 생성 없음)
  - 큰 Gemma 4 모델보다 컨텍스트(128K)와 추론 성능이 낮음
capabilities: [tool-calling, long-context, multilingual]
sources:
  - https://huggingface.co/google/gemma-4-E4B-it
  - https://huggingface.co/api/models/google/gemma-4-E4B-it
verifiedAt: 2026-11-18
---

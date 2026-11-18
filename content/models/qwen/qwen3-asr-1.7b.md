---
name: Qwen3-ASR-1.7B
org: Alibaba Qwen
family: Qwen3-ASR
type: asr
thinking: none
modalities: { input: [audio], output: [text] }
architecture: dense
paramsB: 2.3
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2026-01-29
huggingface: https://huggingface.co/Qwen/Qwen3-ASR-1.7B
summary: Qwen3-Omni 의 오디오 이해 능력을 바탕으로 한 음성 인식 모델. 30개 언어와 22개 중국어 방언의 언어 식별과 전사를 지원한다.
useCases:
  - 한국어·영어·중국어가 섞인 다국어 녹음 전사
  - vLLM 기반 대량 배치 전사와 스트리밍 전사 서버
strengths:
  - 언어 식별을 함께 수행해 언어 지정 없이 전사
  - 타임스탬프용 Qwen3-ForcedAligner-0.6B 와 경량 Qwen3-ASR-0.6B 를 함께 공개
  - qwen-asr 패키지로 배치·비동기 서빙·스트리밍 지원, 2026-06 부터 Transformers 네이티브 지원(-hf 저장소)
limitations:
  - paramsB 는 safetensors 합계(오디오 인코더 포함)이며 모델명은 1.7B
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3-ASR-1.7B
  - https://github.com/QwenLM/Qwen3-ASR
  - https://arxiv.org/abs/2601.21337
verifiedAt: 2026-11-18
---

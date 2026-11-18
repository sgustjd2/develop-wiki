---
name: Step3-VL-10B
org: StepFun
family: Step3-VL
type: vlm
thinking: native
modalities: { input: [text, image], output: [text] }
architecture: dense
paramsB: 10.2
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-01-13
huggingface: https://huggingface.co/stepfun-ai/Step3-VL-10B
summary: StepFun 의 10B 비전 언어 모델. 1.8B Perception Encoder 와 Qwen3-8B 디코더를 결합했고, 항상 사고 과정을 거쳐 이미지 기반 STEM 추론·OCR·GUI 위치 지정을 한다.
useCases:
  - 단일 24GB GPU에서 돌리는 수식·도표가 든 문제 이미지 풀이·채점 보조
  - 스크린샷에서 버튼·입력란 좌표를 찾는 GUI 자동화 에이전트의 인식 모듈
  - 스캔 문서·차트 이미지 질의응답
strengths:
  - Apache-2.0
  - 카드 기준 최소 VRAM 24GB(가중치 20GB), FP8 변형과 base 모델 별도 공개
  - 병렬 추론 모드 PaCoRe(16개 롤아웃 종합)로 테스트 시간 연산을 늘려 추론 정확도를 높일 수 있음
  - vLLM·SGLang 공식 지원, hermes 형식 툴 호출 파서로 배포 예시 제공
limitations:
  - 항상 사고 토큰을 내므로 단순 캡션·분류에는 지연이 큼
  - 카드가 비교 모델(Qwen3-VL-8B) 일부 수치 오류를 인정하고 재측정 중이라고 밝힘
  - transformers 사용 시 trust_remote_code 와 key_mapping 지정 필요, bf16 추론만 지원
  - 공식 지원 컨텍스트 길이는 카드에 명시되지 않음 (순차 추론 최대 64K 토큰 설정으로 평가)
capabilities: [grounding, tool-calling]
sources:
  - https://huggingface.co/stepfun-ai/Step3-VL-10B
  - https://github.com/stepfun-ai/Step3-VL-10B
  - https://arxiv.org/abs/2601.09668
verifiedAt: 2026-11-18
---

## 사용 예

```bash
vllm serve stepfun-ai/Step3-VL-10B -tp 1 \
  --reasoning-parser deepseek_r1 \
  --enable-auto-tool-choice --tool-call-parser hermes \
  --trust-remote-code
```

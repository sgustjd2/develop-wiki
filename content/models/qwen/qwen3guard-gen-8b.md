---
name: Qwen3Guard-Gen-8B
org: Alibaba Qwen
family: Qwen3Guard
type: guard
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 8.2
license: Apache-2.0
commercialUse: allowed
korean: basic
releaseDate: 2025-09-23
huggingface: https://huggingface.co/Qwen/Qwen3Guard-Gen-8B
summary: Qwen3 기반 생성형 가드 모델. 프롬프트·응답을 Safe/Controversial/Unsafe 3단계와 위반 카테고리, 응답 거절 여부로 판정하며 119개 언어를 지원한다.
useCases:
  - 한국어·다국어 서비스의 사용자 입력과 LLM 응답 안전성 필터링
  - 서비스 성격에 따라 "Controversial" 을 차단/허용으로 달리 처리해야 하는 모더레이션
  - vLLM·SGLang OpenAI 호환 엔드포인트로 띄워 기존 파이프라인에 붙이는 가드레일
strengths:
  - Apache-2.0 라이선스
  - 0.6B·4B·8B 크기와, 생성 중 토큰 단위로 감시하는 Qwen3Guard-Stream 변형이 함께 공개됨
  - 탈옥(Jailbreak)·PII·정치적 민감 주제 등 카테고리 출력
limitations:
  - 카테고리·심각도 체계가 고정적이라 자체 정책을 그대로 넣는 방식(BYOP)은 아님
  - 한국어 지원은 Qwen3 의 119개 언어 목록(한국어 포함) 기준이며 한국어 단독 평가 수치는 카드에 없음
capabilities: [multilingual]
sources:
  - https://huggingface.co/Qwen/Qwen3Guard-Gen-8B
  - https://github.com/QwenLM/Qwen3Guard
  - https://qwenlm.github.io/blog/qwen3/
verifiedAt: 2026-11-18
---

## 사용 예

```bash
vllm serve Qwen/Qwen3Guard-Gen-8B --port 8000 --max-model-len 32768
```

출력 형식: `Safety: Unsafe` / `Categories: Violent` (응답 판정 시 `Refusal: Yes|No` 추가)

---
name: Hy4-flash
org: Tencent Hunyuan
family: Hy4
type: text-llm
thinking: hybrid
modalities: { input: [text, image], output: [text] }
architecture: moe
paramsB: 220
activeParamsB: 12
contextLength: 1048576
license: Tencent Hy License 1.0
commercialUse: restricted
korean: unknown
releaseDate: 2026-11-17
huggingface: https://huggingface.co/tencent/Hy4-flash
summary: 텐센트 Hy4 계열의 비용 효율형 MoE 모델(총 220B, 활성 약 12B). 텍스트·이미지 입력과 1M 토큰 컨텍스트를 지원하고 사고 모드를 켜고 끌 수 있다.
useCases:
  - 딥 서치·문서 처리·슬라이드 작성 같은 일상 업무 에이전트를 자체 GPU 클러스터에서 저비용으로 운영
  - 스크린샷·이미지가 섞인 업무 문서를 받아 요약·편집하는 사내 어시스턴트
  - 1M 토큰 컨텍스트로 긴 문서 묶음을 한 번에 넣는 질의응답
strengths:
  - 하이브리드 어텐션(희소 + 슬라이딩 윈도)으로 KV 캐시를 Hy3 대비 1/24, Hy4 대비 1/6 로 줄였다고 공개
  - reasoning_effort 로 사고(high, 기본값)와 즉답(no_think) 전환
  - 내장 5층 드래프터 DFly2(0.85B)로 긴 컨텍스트에서도 추측 디코딩 지원, vLLM·SGLang 공식 이미지 제공
  - FP8 변형(Hy4-flash-FP8)과 사전학습 base 모델이 함께 공개됨, LLaMA-Factory·ms-swift 파인튜닝 스크립트 포함
limitations:
  - 총 220B 중 63.5B 는 n-gram 임베딩(Engram) 테이블, 0.43B 는 비전 인코더. 활성 12B 는 카드 소개 수치(텍스트 11.3B + 비전 0.43B)
  - 매출 5천만 달러 초과 또는 월 1억 명 초과 서비스에서 MaaS(API 등 범용 모델 접근 제공)로 쓰려면 별도 서면 라이선스 필요
  - 카드 권장 서빙은 FP8 가중치 8-GPU 텐서 병렬 구성이며, 공개 시점 transformers 지원은 PR 브랜치 설치 필요
  - 장기 소프트웨어 엔지니어링 같은 복잡한 작업은 상위 모델 Hy4 를 권장한다고 카드에 명시
  - 한국어 개별 평가 수치 없음 (base 모델의 5개 언어 Belebele 평균만 공개)
capabilities: [tool-calling, long-context]
sources:
  - https://huggingface.co/tencent/Hy4-flash
  - https://huggingface.co/tencent/Hy4-flash/blob/main/LICENSE
  - https://github.com/Tencent-Hunyuan/Hy4-flash
verifiedAt: 2026-11-18
---

## 사용 예

```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="EMPTY")
response = client.chat.completions.create(
    model="hy4-flash",
    messages=[{"role": "user", "content": "Hello! Can you briefly introduce yourself?"}],
    temperature=0.9,
    top_p=1.0,
    extra_body={"chat_template_kwargs": {"reasoning_effort": "no_think"}},
)
print(response.choices[0].message.content)
```

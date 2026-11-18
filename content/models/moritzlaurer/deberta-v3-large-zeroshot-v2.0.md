---
name: deberta-v3-large-zeroshot-v2.0
org: Moritz Laurer
family: zeroshot-v2.0
type: classifier
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 0.435
contextLength: 512
license: MIT
commercialUse: allowed
korean: none
releaseDate: 2024-04-03
huggingface: https://huggingface.co/MoritzLaurer/deberta-v3-large-zeroshot-v2.0
summary: NLI(함의/비함의) 방식으로 학습된 DeBERTa-v3-large 제로샷 분류기. 라벨 이름만 주면 학습 데이터 없이 텍스트를 분류한다.
useCases:
  - 라벨링 데이터 없이 고객 문의·티켓을 주제별로 1차 분류
  - LLM 호출 전 저비용 의도 분류·필터 (CPU 에서도 실행)
  - 다중 라벨 태깅 프로토타입 (multi_label=True)
strengths:
  - Hugging Face zero-shot-classification 파이프라인에 그대로 사용
  - MIT 라이선스, 상업 친화 데이터만 쓴 "-c" 변형도 함께 공개
  - 같은 시리즈에 8192토큰·다국어용 bge-m3-zeroshot-v2.0 이 있음
limitations:
  - 영어 전용. 카드가 비영어는 bge-m3 변형이나 영어 번역 후 사용을 권장
  - '"-c" 가 없는 이 모델은 비상업 라이선스 데이터도 학습에 포함 (카드 명시)'
  - 입력 512토큰
sources:
  - https://huggingface.co/MoritzLaurer/deberta-v3-large-zeroshot-v2.0
  - https://github.com/MoritzLaurer/zeroshot-classifier
verifiedAt: 2026-11-18
---

## 사용 예

```python
from transformers import pipeline

zeroshot_classifier = pipeline("zero-shot-classification", model="MoritzLaurer/deberta-v3-large-zeroshot-v2.0")
zeroshot_classifier("Angela Merkel is a politician in Germany and leader of the CDU",
                    ["politics", "economy", "entertainment", "environment"],
                    hypothesis_template="This text is about {}", multi_label=False)
```

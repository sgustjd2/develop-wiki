---
name: NemoCurator Prompt Task and Complexity Classifier
org: NVIDIA
family: NeMo Curator classifiers
type: classifier
thinking: none
modalities: { input: [text], output: [text] }
architecture: dense
paramsB: 0.184
contextLength: 512
license: NVIDIA Open Model License
commercialUse: restricted
korean: unknown
releaseDate: 2024-12-11
huggingface: https://huggingface.co/nvidia/prompt-task-and-complexity-classifier
summary: DeBERTa 백본에 여러 분류 헤드를 단 프롬프트 분류기. 영어 프롬프트의 작업 유형(11종)과 창의성·추론 등 6개 복잡도 점수를 한 번에 낸다.
useCases:
  - 프롬프트 복잡도 점수로 소형/대형 모델을 고르는 비용 기반 라우팅
  - 학습·평가용 프롬프트 데이터셋의 작업 유형 분포 분석과 큐레이션
strengths:
  - 작업 유형과 복잡도를 단일 순전파로 동시에 예측
  - 카드에 상업 이용 가능 명시
limitations:
  - 영어 프롬프트 4,024개로 학습, 영어 전용
  - 입력 512토큰
  - 추론 코드는 NeMo Curator 예제 노트북 기준
sources:
  - https://huggingface.co/nvidia/prompt-task-and-complexity-classifier
verifiedAt: 2026-11-18
---

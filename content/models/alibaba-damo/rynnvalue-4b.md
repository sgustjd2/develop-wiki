---
name: RynnValue-4B
org: Alibaba DAMO Academy
family: RynnValue
type: reward
thinking: none
modalities: { input: [video, text], output: [text] }
architecture: dense
paramsB: 5.1
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-07-27
huggingface: https://huggingface.co/Alibaba-DAMO-Academy/RynnValue-4B
summary: RynnBrain-4B(Qwen3-VL 구조) 기반의 로봇 가치 모델. 로봇 영상과 지시문을 받아 프레임마다 작업 완료까지 남은 시간(초)을 예측하고 성공 여부 분석 텍스트를 낸다.
useCases:
  - 로봇 조작 영상의 진행도 추정과 실패 감지
  - VLA 정책의 강화학습(IQL·SAC)에 쓸 밀집 보상·크리틱 신호 생성
  - 모방학습 전에 시연 영상을 가치 점수로 걸러내는 데이터 큐레이션
strengths:
  - 타임스탬프에서 얻은 temporal distance 로 학습해 선호·진행도 라벨 없이 7,000시간 이상 데이터를 사용(카드)
  - 카드가 RBM-EVAL-OOD 평균 Kendall's τ 0.670(고정 bin 4B)을 보고하고, 4B-Quantile 은 0.679
  - 추론용 데모, 벤치마크 도구, openpi 기반 정책 RL 코드가 같은 GitHub 저장소에 포함
  - lerobot/RynnValue-4B 가 LeRobot 보상 모델 포맷으로 변환한 포팅본(추론 전용)
limitations:
  - 로봇 조작 영상 전용 가치 모델이라 일반 대화·챗 응답 점수화에는 쓸 수 없음
  - custom_code(trust_remote_code)가 필요하고 같은 계열에 8B·4B-Quantile 변형이 따로 있음
  - 파라미터 수(5.1B)는 safetensors 합계 기준이며 이름은 4B, 컨텍스트 길이는 카드에 명시 없음
  - type 은 점수화 목적이라 reward 로 분류했으나 로봇 전용이라 분류 검토 필요
capabilities: []
sources:
  - https://huggingface.co/Alibaba-DAMO-Academy/RynnValue-4B
  - https://huggingface.co/api/models/Alibaba-DAMO-Academy/RynnValue-4B
  - https://huggingface.co/lerobot/RynnValue-4B
  - https://github.com/alibaba-damo-academy/RynnValue
  - https://arxiv.org/abs/2608.09853
verifiedAt: 2026-11-19
---

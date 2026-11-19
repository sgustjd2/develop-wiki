---
name: FineART-VLA (subtask-midtrained)
org: Scale AI · Hugging Face (LeRobot)
family: FineART-VLA
type: vla
thinking: none
modalities: { input: [image, text], output: [action, text] }
architecture: other
paramsB: 4.1
license: Gemma Terms of Use
commercialUse: restricted
korean: unknown
releaseDate: 2026-09-29
huggingface: https://huggingface.co/lerobot/FineART-VLA-subtask-midtrained
summary: π0.5 초기화에서 FineART 데이터로 중간 학습한 ALOHA 양팔 VLA. 다음 서브태스크를 언어로 예측한 뒤 그 서브태스크로 연속 액션 청크를 낸다.
useCases:
  - 서브태스크 언어 안내를 쓰는 ALOHA 양팔 조작을 연구·재현할 때
  - 서브태스크 타임라인이 있는 LeRobot 데이터셋으로 새 작업·임바디먼트에 후속 학습할 때
  - LeRobot 의 fineart_vla 정책으로 사용자 지정 서브태스크를 주며 롤아웃할 때
strengths:
  - 카메라 3대(224×224 리사이즈)와 14차원 조인트·그리퍼 상태로 50스텝 액션 청크를 냄(카드)
  - FineART 데이터셋은 40,543 에피소드·1,718시간·53만 개 이상 서브태스크 주석으로 구성(카드)
  - 정규화 통계와 학습된 액션 토크나이저가 체크포인트에 포함됨
limitations:
  - 카드가 PaliGemma·π0.5 초기화에서 이어진 Gemma 라이선스를 유지한다고 밝혀 Gemma 이용 약관·사용 제한을 따라야 함
  - ALOHA 용 체크포인트라 새 하드웨어·환경은 적응과 검증이 필요하고 서브태스크 예측이 틀릴 수 있음
  - 일반 시각 질의응답이나 기억 능력을 보장하지 않음(카드), 텍스트 토크나이저(google/paligemma-3b-pt-224)는 약관 동의가 필요할 수 있음
  - 가중치 약 9.35GB, 한국어 지원 근거 없음
capabilities: []
sources:
  - https://huggingface.co/lerobot/FineART-VLA-subtask-midtrained
  - https://huggingface.co/api/models/lerobot/FineART-VLA-subtask-midtrained
  - https://arxiv.org/abs/2609.36416
  - https://huggingface.co/docs/lerobot/main/en/fineart_vla
verifiedAt: 2026-11-19
---

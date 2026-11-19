---
name: Being-H0.5 (Being-H05-2B)
org: BeingBeyond
family: Being-H
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 2.8
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-01-20
huggingface: https://huggingface.co/BeingBeyond/Being-H05-2B
summary: 사람 중심 데이터(UniHand-2.0)와 통합 액션 공간으로 학습한 교차 임바디먼트 VLA 의 사전학습(프리뷰) 체크포인트. 카드상 2B 급이며 로봇별 후속 학습으로 쓴다.
useCases:
  - 서로 다른 로봇 형태에 통합 액션 공간으로 후속 학습할 시작점으로 쓸 때
  - 공개된 LIBERO·RoboCasa 후속 학습 체크포인트와 비교하며 파이프라인을 재현할 때
  - 경량 VLA 연구용으로 224px 비전 입력의 정책을 로컬에서 돌릴 때
strengths:
  - Apache-2.0 이며 코드(Being-H05 저장소)와 논문(arXiv 2601.12993)이 공개돼 있음
  - 카드에 사전학습·LIBERO·RoboCasa·통합 후속 학습 체크포인트 계열이 정리돼 있음
  - 비전 입력은 기본 224px
limitations:
  - 카드가 이 저장소를 "Base 모델(preview)"로 표기하므로 대상 로봇에는 후속 학습이 필요
  - 2.8B 는 HF safetensors 합계이고 이름과 카드는 2B 로 표기
  - 한국어 지원 근거 없음, 컨텍스트 길이는 카드에서 확인 못 함
capabilities: []
sources:
  - https://huggingface.co/BeingBeyond/Being-H05-2B
  - https://huggingface.co/api/models/BeingBeyond/Being-H05-2B
  - https://github.com/BeingBeyond/Being-H
  - https://arxiv.org/abs/2601.12993
verifiedAt: 2026-11-19
---

---
name: Octo Base 1.5
org: Octo 모델 팀 (UC Berkeley RAIL 등)
family: Octo
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: diffusion
paramsB: 0.093
license: MIT
commercialUse: allowed
korean: unknown
releaseDate: 2024-05-21
huggingface: https://huggingface.co/rail-berkeley/octo-base-1.5
summary: Open X-Embodiment 혼합 데이터로 학습한 93M 트랜스포머 확산 정책. 주 카메라와 손목 카메라 이미지, 언어 또는 목표 이미지로 7차원 액션을 예측한다.
useCases:
  - 새 로봇의 관측·액션 공간에 맞춰 소량 데이터로 빠르게 파인튜닝하는 경량 일반 정책 기준선
  - 언어 지시뿐 아니라 목표 이미지로 과제를 지정하는 실험
  - 7B 급 VLA 를 올리기 어려운 GPU 에서 Open X-Embodiment 사전학습 효과를 확인할 때
strengths:
  - ViT-B 급 93M 파라미터로 가볍고 JAX 기반 파인튜닝 코드를 제공
  - 입력 이미지는 256x256 주 카메라와 128x128 손목 카메라(히스토리 창 2), 출력은 4스텝 미래 액션
  - 저장소와 가중치가 MIT 라이선스
limitations:
  - 별도 VLM 이 아닌 소형 모델이라 언어 이해와 일반화가 최신 VLA 보다 제한적
  - 새 임바디먼트에서는 파인튜닝이 사실상 필요하고 코드베이스는 JAX 중심
  - HF 카드에 파라미터 수 외 평가 수치가 거의 없어 상세는 논문과 저장소 참고
capabilities: []
sources:
  - https://huggingface.co/rail-berkeley/octo-base-1.5
  - https://github.com/octo-models/octo
  - https://arxiv.org/abs/2405.12213
verifiedAt: 2026-11-19
---

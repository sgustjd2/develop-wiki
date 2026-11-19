---
name: Wall-OSS-0.5
org: X Square Robot
family: WALL-OSS
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 4.2
license: 모델 카드에 라이선스 미표기 (코드 저장소는 Apache-2.0)
commercialUse: not-allowed
korean: unknown
releaseDate: 2026-05-29
huggingface: https://huggingface.co/x-square-robot/wall-oss-0.5
summary: Qwen2.5-VL 계열 3B VLM 에 액션 생성부를 붙인 약 4B 급 VLA. 20종 이상 로봇의 궤적으로 사전학습해 미세조정 없이도 실로봇에서 실행되도록 설계했다.
useCases:
  - 20종 이상 임바디먼트에 대해 norm_key 를 지정해 사전학습 상태 그대로 실로봇 정책을 시험할 때
  - LeRobot 형식 데이터셋으로 SFT 해 새 작업·로봇에 맞출 때
  - LIBERO 평가와 open-loop 비교 스크립트로 정책을 점검할 때
strengths:
  - 이산 액션 예측·멀티모달 예측·연속 플로 매칭 세 목적을 함께 학습하는 gradient-bridged co-training 을 사용(카드)
  - 카드 기준 17개 과제 실로봇 제로샷 수행, 15개 실로봇 과제 파인튜닝 후 평균 진행도 60.5%(π0.5 대비 +17.5%, 자체 보고)
  - 코드 저장소(wall-x)는 Apache-2.0 이며 학습·추론 가이드 제공
limitations:
  - HF 저장소·모델 카드에 가중치 라이선스가 명시되지 않아 사용 조건은 제작사에 확인 필요. 라이선스가 부여되지 않은 상태로 보고 not-allowed(비상업)로 보수적으로 표기
  - 카드는 4B 라고 소개하며 4.2B 는 HF safetensors 합계 기준
  - 임바디먼트마다 norm_key 설정이 필요하고, 성능 수치는 자체 보고라 독립 검증하지 않음
  - 한국어 지원 근거 없음
capabilities: []
sources:
  - https://huggingface.co/x-square-robot/wall-oss-0.5
  - https://huggingface.co/api/models/x-square-robot/wall-oss-0.5
  - https://github.com/X-Square-Robot/wall-x
  - https://arxiv.org/abs/2605.30877
verifiedAt: 2026-11-19
---

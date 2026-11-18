---
name: MolmoAct2
org: Ai2
family: MolmoAct
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 5.4
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-05-05
huggingface: https://huggingface.co/allenai/MolmoAct2
summary: 임바디드 추론 VLM 인 Molmo2-ER 에 플로 매칭 액션 전문가를 KV 조건으로 연결한 Ai2 의 VLA. 멀티 임바디먼트 후속학습 체크포인트로 추가 파인튜닝용이다.
useCases:
  - Franka·DROID, SO-100/101, 양팔 YAM 로봇에 맞춰 파인튜닝한 체크포인트(MolmoAct2-DROID 등)로 실제 로봇을 제어할 때
  - 학습 코드와 데이터 전체가 공개돼 VLA 사전·후속 학습 레시피를 재현하거나 비교할 때
  - LeRobot 워크플로로 자체 데이터를 파인튜닝할 때
strengths:
  - 모델·데이터·학습 코드와 실험 상세를 모두 공개한 완전 오픈 구성
  - 입력은 이미지, 지시문, 로봇 상태(norm_stats 로 정규화)이며 출력은 연속 액션
  - 적응형 깊이 맵 등 해석 가능한 중간 출력으로 동작을 점검할 수 있다고 카드가 안내
limitations:
  - 카드가 이 체크포인트는 단일 배포용 정책이 아닌 파인튜닝 출발점이라 직접 추론 코드를 싣지 않는다고 밝힘
  - 모델 카드 메타데이터에는 라이선스 필드가 없지만 카드 본문(7. License)과 GitHub 저장소가 Apache 2.0 으로 표기하며, 연구·교육 목적 책임 사용 지침(Ai2 Responsible Use Guidelines)이 붙음
  - 임바디먼트·환경에 따라 동작이 달라 속도·작업공간·토크 한계와 비상정지를 두라고 카드가 경고
  - 파라미터는 safetensors 합계 기준
capabilities: []
sources:
  - https://huggingface.co/allenai/MolmoAct2
  - https://github.com/allenai/molmoact2
  - https://arxiv.org/abs/2605.02881
  - https://allenai.org/blog/molmoact2
verifiedAt: 2026-11-19
---

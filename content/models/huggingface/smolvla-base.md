---
name: SmolVLA (smolvla_base)
org: Hugging Face (LeRobot)
family: SmolVLA
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: dense
paramsB: 0.45
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-06-03
huggingface: https://huggingface.co/lerobot/smolvla_base
summary: SmolVLM2-500M 을 기반으로 LeRobot 커뮤니티 데이터로 학습한 450M 플로 매칭 VLA. 단일 GPU 학습과 소비자 하드웨어 배포를 목표로 한다.
useCases:
  - SO-100/SO-101 저가형 로봇 팔로 직접 수집한 데이터로 파인튜닝해 언어 지시 기반 pick-and-place 를 하는 취미·교육 프로젝트
  - 단일 소비자 GPU 에서 VLA 를 학습·평가하고 LIBERO·Meta-World 시뮬레이션과 비교할 때
  - 비동기 추론으로 응답 지연을 줄여야 하는 저사양 온보드 정책 실험
strengths:
  - 입력은 다중 뷰 이미지, 로봇 상태(proprioception, 별도 키가 없어 text 가 아닌 상태 벡터로 처리), 선택적 지시문이며 출력은 연속 액션
  - LeRobot 라이브러리에서 학습·추론·데이터 수집까지 한 파이프라인으로 처리
  - 블로그 기준 CPU 추론과 MacBook 학습도 가능한 크기
limitations:
  - base 체크포인트는 범용 정책이 아니라 파인튜닝용 시작점이며 저장소가 직접 제어 성능을 보장하지 않음
  - 로봇별 카메라·액션 차원 설정을 맞춰야 하고 사전학습이 SO-100/101 계열 커뮤니티 데이터에 치우침
  - 카드는 영어만 명시
capabilities: []
sources:
  - https://huggingface.co/lerobot/smolvla_base
  - https://huggingface.co/blog/smolvla
  - https://arxiv.org/abs/2506.01844
verifiedAt: 2026-11-19
---

## 사용 예

`pip install "lerobot[smolvla]"` 후 `SmolVLAPolicy.from_pretrained("lerobot/smolvla_base")` 로 불러오고 `select_action` 으로 액션 청크를 얻는다.

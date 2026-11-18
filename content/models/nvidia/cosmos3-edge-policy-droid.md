---
name: Cosmos3-Edge-Policy-DROID
org: NVIDIA
family: Cosmos
type: vla
thinking: none
modalities: { input: [image, video, text], output: [action] }
architecture: other
paramsB: 4
license: OpenMDW-1.1
commercialUse: allowed
korean: unknown
releaseDate: 2026-07-20
huggingface: https://huggingface.co/nvidia/Cosmos3-Edge-Policy-DROID
summary: Cosmos3-Edge 를 DROID 플랫폼 로봇 정책용으로 후속 학습한 4B world action model. 언어 지시와 관측 영상으로 DROID 8차원 액션 청크를 생성한다.
useCases:
  - DROID Franka 셋업에서 언어 지시로 탁상 조작을 시험하는 정책 서버를 Jetson AGX Thor 급 엣지 장치에 올릴 때
  - Cosmos3 월드 모델 기반 정책을 openpi·GR00T 계열 VLA 와 비교 평가할 때
strengths:
  - 모델 카드가 액션 청크 형태를 [16, 8](16스텝, 8값)로 밝히고 H100 단일 GPU 에서 약 1.3~1.4초 end-to-end 지연을 보고
  - Jetson AGX Thor 에서 5Hz 제어 예산을 만족하는 측정치를 카드에 제시(32스텝 청크 기준)
  - 모델 카드가 상업·비상업 이용 모두 가능하다고 밝힘(OpenMDW-1.1)
limitations:
  - 입력·출력 액션이 DROID 플랫폼(8D)만 지원
  - 영상 입력은 최대 5프레임이고 BF16 만 공식 테스트됨, Linux 만 테스트
  - 카드의 지연 수치는 디노이징 스텝 수·해상도에 따라 달라지며 일부 Jetson(T2000)에서는 실시간 불가
  - 같은 계열로 Cosmos3-Nano-Policy-DROID(약 15.7B) 도 있으며 이 항목에서는 다루지 않음
capabilities: []
sources:
  - https://huggingface.co/nvidia/Cosmos3-Edge-Policy-DROID
  - https://huggingface.co/api/models/nvidia/Cosmos3-Edge-Policy-DROID
  - https://github.com/nvidia/cosmos
  - https://openmdw.ai/license/1-1/
verifiedAt: 2026-11-19
---

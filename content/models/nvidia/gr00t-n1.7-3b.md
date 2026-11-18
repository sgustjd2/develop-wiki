---
name: Isaac GR00T N1.7 3B
org: NVIDIA
family: GR00T
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 3.1
license: NVIDIA Open Model License
commercialUse: restricted
korean: unknown
releaseDate: 2026-04-18
huggingface: https://huggingface.co/nvidia/GR00T-N1.7-3B
summary: Cosmos-Reason2-2B 를 VLM 백본으로 쓰고 플로 매칭 DiT 로 연속 액션 청크를 내는 휴머노이드용 교차 임바디먼트 VLA. 후속 학습으로 로봇별 적응을 전제로 한다.
useCases:
  - Unitree G1 같은 휴머노이드의 상체 양팔 조작을 후속 학습해 배포할 때
  - LIBERO·SimplerEnv(Bridge, Fractal)·DROID 용 사전 후속학습 체크포인트로 벤치마크를 재현할 때
  - Jetson AGX Thor·RTX 6000 급에서 TensorRT 로 20Hz 이상 정책을 돌리는 엣지 배포
strengths:
  - 입력은 RGB 이미지, 지시문, 로봇 proprioception(상태 벡터), 임바디먼트 ID 이며 출력은 연속 액션 벡터
  - 상대 EEF 액션 공간과 약 2만 시간의 인간 에고 영상 사전학습을 사용(저장소 설명)
  - 코드는 Apache-2.0, ONNX·TensorRT 내보내기와 배포 벤치마크를 제공
limitations:
  - 사전학습 임바디먼트 밖의 로봇은 후속 학습이 필요하고 카드가 후속 학습 데이터 사용을 전제함
  - 추론에 16GB 이상 VRAM GPU 가 필요하고 Orin 에서는 DiT 만 TensorRT 로 돌려 약 4.6Hz
  - Linux 에서만 지원, 라이선스는 NVIDIA Open Model License(상업 이용 문구가 있으나 가드레일 우회 시 종료 조항이 있어 restricted 표기, 사람 확인 필요)
  - HF 에는 2026-02-25 에 Early Access 로 먼저 올라왔고 GitHub 정식 릴리스는 2026-04-18
capabilities: []
sources:
  - https://huggingface.co/nvidia/GR00T-N1.7-3B
  - https://github.com/NVIDIA/Isaac-GR00T
  - https://arxiv.org/abs/2503.14734
  - https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/
verifiedAt: 2026-11-19
---

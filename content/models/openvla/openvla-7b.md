---
name: OpenVLA 7B
org: OpenVLA 팀 (Stanford·UC Berkeley·TRI)
family: OpenVLA
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: dense
paramsB: 7.5
license: MIT
commercialUse: allowed
korean: unknown
releaseDate: 2024-06-13
huggingface: https://huggingface.co/openvla/openvla-7b
summary: Llama-2 와 DINOv2·SigLIP 비전 인코더 위에 Open X-Embodiment 97만 에피소드로 학습한 7B VLA. 카메라 이미지와 지시문에서 7자유도 엔드이펙터 액션을 낸다.
useCases:
  - BridgeV2 환경의 WidowX 로봇 같이 사전학습 데이터에 포함된 로봇·장면에서 언어 지시 기반 pick-and-place 를 바로 시험할 때
  - 새 로봇 팔을 LoRA 로 파인튜닝해 단일 카메라 기반 조작 정책의 기준선을 만들 때
  - LIBERO 시뮬레이션 벤치마크용 파인튜닝 체크포인트(openvla-7b-finetuned-libero-*)로 VLA 연구를 재현할 때
strengths:
  - 모델 카드와 저장소 모두 MIT 라이선스로 체크포인트와 학습 코드를 공개
  - HF transformers 의 AutoModelForVision2Seq 로 불러올 수 있고 LoRA 파인튜닝 스크립트를 제공
  - 입력은 이미지와 지시문이며 출력은 정규화된 (x, y, z, roll, pitch, yaw, gripper) 액션
limitations:
  - 사전학습 믹스에 없던 로봇·셋업에는 제로샷으로 일반화하지 않아 파인튜닝이 필요
  - 단일 이미지 입력과 7B 규모라 고주파 제어에 불리하고 LoRA 파인튜닝도 약 27GB 이상 VRAM 이 필요(저장소 안내)
  - 언어 백본이 Llama-2 라서 파생 약관 적용 여부는 사람 확인 필요
  - 액션은 로봇별 통계로 언노멀라이즈해야 하며 카드는 영어만 명시
capabilities: []
sources:
  - https://huggingface.co/openvla/openvla-7b
  - https://github.com/openvla/openvla
  - https://arxiv.org/abs/2406.09246
verifiedAt: 2026-11-19
---

## 사용 예

모델 카드의 예시는 `AutoProcessor`·`AutoModelForVision2Seq` 를 `trust_remote_code=True` 로 불러온 뒤 `predict_action(..., unnorm_key="bridge_orig")` 로 7차원 액션을 얻는다.

---
name: π0.5 (pi05_base, openpi)
org: Physical Intelligence
family: π0
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: dense
paramsB: 3.6
license: Apache-2.0 (openpi 저장소 코드) / Gemma (HF LeRobot 포팅본 표기)
commercialUse: restricted
korean: unknown
releaseDate: 2025-09-08
huggingface: https://huggingface.co/lerobot/pi05_base
summary: PaliGemma 기반 VLM 에 플로 매칭 액션 헤드를 붙인 π0.5 의 openpi 기반 체크포인트. 10k시간 이상의 로봇 데이터로 사전학습한 파인튜닝용 모델이다.
useCases:
  - DROID Franka 셋업에서 pi05_droid 체크포인트로 처음 보는 장면의 탁상 조작을 제로샷 시험할 때
  - ALOHA 양팔 로봇이나 LIBERO 벤치마크용으로 openpi 설정을 참고해 자체 데이터를 파인튜닝할 때
  - 원격 정책 서버(웹소켓)로 GPU 서버에서 추론하고 로봇에는 액션만 스트리밍하는 구성
strengths:
  - 첫 공개된 π 계열 openpi 저장소가 JAX 와 PyTorch 구현을 모두 제공하고 LIBERO·DROID·ALOHA 예제를 포함
  - 입력은 다중 뷰 이미지, 로봇 상태(별도 키가 없어 상태 벡터로 처리), 지시문이며 출력은 연속 액션 청크
  - 추론은 8GB 초과 VRAM, LoRA 파인튜닝은 22.5GB 초과 VRAM 으로 가능(openpi README)
limitations:
  - 저장소 스스로 π0 가 자사 로봇용으로 개발됐고 다른 플랫폼에서 동작을 보장하지 않는다고 밝힘
  - openpi 는 π0.5 의 플로 매칭 헤드만 지원하고 서브태스크 예측·FAST 토크나이저·RL 은 미공개
  - 전체 파인튜닝은 70GB 이상 VRAM(A100/H100) 이 필요하고 학습 스크립트는 멀티 노드 미지원
  - 가중치는 gs://openpi-assets 로 배포된다. openpi 저장소 코드는 Apache-2.0 이지만 이슈 #263 의 Apache 2.0 답변은 2025-02(π0 시기)라 π0.5 가중치를 직접 다루지 않고, HF LeRobot 포팅본은 gemma(PaliGemma 기반)로 표기하므로 가중치 라이선스는 사람 확인 필요
  - 파라미터 수는 LeRobot 포팅본 safetensors 합계 기준
capabilities: []
sources:
  - https://github.com/Physical-Intelligence/openpi
  - https://github.com/Physical-Intelligence/openpi/issues/263
  - https://huggingface.co/lerobot/pi05_base
  - https://arxiv.org/abs/2504.16054
verifiedAt: 2026-11-19
---

## 사용 예

openpi 에서 `_config.get_config("pi05_droid")` 와 `download.maybe_download("gs://openpi-assets/checkpoints/pi05_droid")` 로 정책을 만들고 관측 딕셔너리를 `policy.infer` 에 넣는다. LeRobot 은 `PI05Policy.from_pretrained("lerobot/pi05_base")` 를 제공한다.

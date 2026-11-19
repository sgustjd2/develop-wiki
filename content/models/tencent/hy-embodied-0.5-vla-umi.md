---
name: Hy-Embodied-0.5-VLA-UMI
org: Tencent Hunyuan
family: Hy-Embodied
type: vla
thinking: none
modalities: { input: [image, text], output: [action] }
architecture: other
paramsB: 4.5
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2026-06-15
huggingface: https://huggingface.co/tencent/Hy-Embodied-0.5-VLA-UMI
summary: Hy-Embodied-0.5 MoT 백본에 3.7억 파라미터 플로 매칭 액션 전문가를 붙인 양팔 VLA 사전학습 체크포인트. 1만 시간 이상의 UMI 시연으로 학습했다.
useCases:
  - 양팔 로봇의 후속 학습(SFT) 시작점으로 쓰고 RoboTwin 2.0 같은 환경에서 재현할 때
  - 머리·양손 3개 카메라와 상대 EEF 델타 청크를 쓰는 UMI 계열 데이터에 맞출 때
  - 멀티프레임 기억 인코더를 켜 SFT 하는 구조를 연구할 때
strengths:
  - 카드 기준 RoboTwin 2.0 에서 Clean 90.9%·Randomized 90.1% 보고(후속 학습 체크포인트 기준, 자체 보고)
  - 액션은 상대 EEF 델타 청크(팔당 xyz+rot6d+그리퍼, 호라이즌 50스텝 10Hz)로 임바디먼트 기구학과 분리
  - 카드·LICENSE 모두 Apache-2.0
limitations:
  - 사전학습 체크포인트라 대상 로봇에는 후속 학습이 필요하며 메모리 인코더는 SFT 단계에서 활성화
  - 4.5B 는 HF safetensors 합계이고 활성 파라미터 수치는 확인 못 함
  - GitHub 저장소 라이선스는 'Other' 로 표시되지만 HF LICENSE 파일에 Apache-2.0 이 명시돼 이를 따름
  - 한국어 지원 근거 없음
capabilities: []
sources:
  - https://huggingface.co/tencent/Hy-Embodied-0.5-VLA-UMI
  - https://huggingface.co/api/models/tencent/Hy-Embodied-0.5-VLA-UMI
  - https://github.com/Tencent-Hunyuan/Hy-Embodied-0.5-VLA
  - https://arxiv.org/abs/2606.14409
verifiedAt: 2026-11-19
---

---
name: Wan2.2-T2V-A14B
org: Alibaba Tongyi Wanxiang (Wan-AI)
family: Wan2.2
type: video-gen
thinking: none
modalities: { input: [text], output: [video] }
architecture: moe
paramsB: 27
activeParamsB: 14
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-07-28
huggingface: https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B
summary: 노이즈 단계별 전문가(고노이즈·저노이즈)를 나눈 MoE 확산 영상 모델. 480P·720P 5초 영상을 텍스트로 생성한다.
useCases:
  - 상업 이용 가능한 오픈 웨이트로 광고·숏폼 영상 시안을 자체 GPU에서 생성
  - 조명·구도·색감 같은 영화적 스타일을 프롬프트로 제어하는 영상 생성
strengths:
  - 총 27B 지만 스텝당 활성 14B 라 연산·메모리는 14B 급 유지
  - Apache-2.0, ComfyUI·Diffusers 지원
  - 같은 세대에 이미지→영상(I2V-A14B)과 RTX 4090 에서 720P@24fps 를 내는 TI2V-5B 공개
limitations:
  - 단일 GPU 실행에 80GB VRAM 이 필요(오프로딩 옵션 사용 시)
  - 생성 길이는 5초 단위
capabilities: []
sources:
  - https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B
  - https://github.com/Wan-Video/Wan2.2
verifiedAt: 2026-11-18
---

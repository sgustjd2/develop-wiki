---
name: HunyuanVideo-1.5
org: Tencent Hunyuan
family: HunyuanVideo
type: video-gen
thinking: none
modalities: { input: [text, image], output: [video] }
architecture: diffusion
paramsB: 8.3
license: Tencent Hunyuan Community License
commercialUse: restricted
korean: unknown
releaseDate: 2025-11-20
huggingface: https://huggingface.co/tencent/HunyuanVideo-1.5
summary: 8.3B DiT 와 3D causal VAE 로 만든 경량 영상 생성 모델. 텍스트·이미지→영상을 소비자 GPU에서 돌리는 것을 목표로 한다.
useCases:
  - 단일 소비자 GPU에서의 텍스트·이미지 기반 영상 생성 실험
  - 학습 코드·LoRA 스크립트를 이용한 영상 스타일 파인튜닝 연구
strengths:
  - 모델 오프로딩 시 최소 14GB GPU 메모리
  - 1080p 업스케일용 few-step 초해상도 네트워크 제공
  - 8~12스텝 step-distilled I2V 체크포인트, Diffusers·ComfyUI 지원
limitations:
  - 라이선스 적용 지역에서 유럽연합·영국·한국이 제외돼 한국에서는 사용 허가가 없음
  - MAU 1억 초과 시 별도 라이선스 필요
capabilities: []
sources:
  - https://huggingface.co/tencent/HunyuanVideo-1.5
  - https://huggingface.co/tencent/HunyuanVideo-1.5/blob/main/LICENSE
verifiedAt: 2026-11-18
---

---
name: LTX-2.5
org: Lightricks
family: LTX-2
type: video-gen
thinking: none
modalities: { input: [text, image, video, audio], output: [video, audio] }
architecture: diffusion
paramsB: 22
license: LTX-2.x Community License
commercialUse: restricted
korean: basic
releaseDate: 2026-08-11
huggingface: https://huggingface.co/Lightricks/LTX-2.5
summary: 텍스트·이미지·영상 입력으로 동기화된 영상과 오디오를 함께 생성하는 22B 오픈 웨이트 모델. 한 번에 여러 컷을 이어 만든다.
useCases:
  - 대사·효과음이 붙은 짧은 영상 클립을 로컬 GPU에서 생성
  - 인물·배경·목소리를 유지한 멀티샷 장면 시안 제작
  - IC-LoRA(업스케일·복원·인페인팅 등)를 붙인 영상 후처리 파이프라인
strengths:
  - 네이티브 멀티샷 생성과 프롬프트 기반 길이 예측(duration head)
  - 확산 기반 영상 디코더, Gemma 4 12B 텍스트 인코더
  - ComfyUI·Diffusers·ltx-pipelines 지원, 증류 체크포인트(8스텝)와 NVFP4 변형 제공
limitations:
  - 연 매출 1천만 달러 이상 기업은 유료 상업 계약 필요, 파인튜닝 모델 이전 시 유료 라이선스가 필요할 수 있음
  - HF 저장소가 게이트(약관 동의) 방식
  - paramsB 는 DiT 기준이며 텍스트 인코더(12B)·VAE 는 별도
capabilities: [multilingual]
sources:
  - https://huggingface.co/Lightricks/LTX-2.5
  - https://ltx.io/newsroom/introducing-ltx-2-5
  - https://github.com/Lightricks/LTX-2
verifiedAt: 2026-11-18
---

---
name: Qwen-Image-2512
org: Alibaba Qwen
family: Qwen-Image
type: image-gen
thinking: none
modalities: { input: [text], output: [image] }
architecture: diffusion
paramsB: 20.4
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-12-31
huggingface: https://huggingface.co/Qwen/Qwen-Image-2512
summary: Qwen-Image 텍스트→이미지 모델의 2025년 12월 업데이트. 인물 사실감, 털·풍경 같은 자연 디테일, 이미지 속 글자 렌더링을 개선했다.
useCases:
  - 상업 이용이 필요한 광고·상세페이지용 인물·제품 사진풍 이미지 생성
  - 간판·포스터처럼 이미지 안에 영문·중문 글자가 들어가는 디자인 시안 생성
strengths:
  - Apache-2.0 이라 상업 이용 가능
  - 8월 원판 Qwen-Image 대비 인물 얼굴·머리카락 디테일과 배경 선명도 개선
  - Diffusers 지원, 공개 당일 Lightning(가속)·vLLM-Omni 커뮤니티 지원
limitations:
  - 확산 트랜스포머(MMDiT)만 20.4B 이고 별도 텍스트 인코더(Qwen2.5-VL 약 8.3B)가 더해져 메모리 요구가 큼
  - 카드 언어 메타데이터는 영어·중국어만 표기
  - 편집은 별도 모델 Qwen-Image-Edit-2511, 후속 Qwen-Image-2.1 은 연구용 라이선스
capabilities: []
sources:
  - https://huggingface.co/Qwen/Qwen-Image-2512
  - https://github.com/QwenLM/Qwen-Image
  - https://huggingface.co/Qwen/Qwen-Image-2512/blob/main/transformer/diffusion_pytorch_model.safetensors.index.json
verifiedAt: 2026-11-18
---

## 사용 예

```python
import torch
from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained("Qwen/Qwen-Image-2512", torch_dtype=torch.bfloat16).to("cuda")
image = pipe(
    prompt="A coffee shop entrance with a chalkboard sign reading 'Qwen Coffee'",
    width=1664, height=928,
    num_inference_steps=50, true_cfg_scale=4.0,
).images[0]
image.save("example.png")
```

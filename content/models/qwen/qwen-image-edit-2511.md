---
name: Qwen-Image-Edit-2511
org: Alibaba Qwen
family: Qwen-Image
type: image-gen
thinking: none
modalities: { input: [text, image], output: [image] }
architecture: diffusion
paramsB: 20.4
license: Apache-2.0
commercialUse: allowed
korean: unknown
releaseDate: 2025-12-23
huggingface: https://huggingface.co/Qwen/Qwen-Image-Edit-2511
summary: Qwen-Image 기반 지시문 이미지 편집 모델의 2025년 11월판. 여러 장의 입력 이미지를 받아 인물 정체성을 유지한 채 합성·편집한다.
useCases:
  - 인물 사진 두 장을 한 장의 단체 사진으로 합치는 등 인물 일관성이 중요한 편집
  - 제품 이미지의 재질 교체·조명 변경·새 시점 생성 같은 산업 디자인 시안 작업
  - 도면·이미지에 보조선을 그려 넣는 설계 주석 작업
strengths:
  - Apache-2.0 이라 상업 이용 가능
  - 이전판(2509) 대비 이미지 드리프트 완화, 단일·다인 인물 일관성 개선
  - 조명 보정·시점 변경 같은 인기 커뮤니티 LoRA 효과를 기본 모델에 통합
  - Diffusers QwenImageEditPlusPipeline, vLLM-Omni·SGLang-Diffusion 공개 당일 지원
limitations:
  - 확산 트랜스포머만 20.4B 에 텍스트·비전 인코더가 더해져 메모리 요구가 큼
  - 텍스트→이미지 생성 품질 개선은 별도 모델 Qwen-Image-2512 쪽에 반영됨
  - 카드 언어 메타데이터는 영어·중국어만 표기
capabilities: []
sources:
  - https://huggingface.co/Qwen/Qwen-Image-Edit-2511
  - https://github.com/QwenLM/Qwen-Image
verifiedAt: 2026-11-18
---

## 사용 예

```python
import torch
from PIL import Image
from diffusers import QwenImageEditPlusPipeline

pipeline = QwenImageEditPlusPipeline.from_pretrained("Qwen/Qwen-Image-Edit-2511", torch_dtype=torch.bfloat16).to("cuda")
output = pipeline(
    image=[Image.open("input1.png"), Image.open("input2.png")],
    prompt="The magician bear is on the left, the alchemist bear is on the right, facing each other in the central park square.",
    true_cfg_scale=4.0, negative_prompt=" ", num_inference_steps=40, guidance_scale=1.0,
    generator=torch.manual_seed(0),
)
output.images[0].save("output.png")
```

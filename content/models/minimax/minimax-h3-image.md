---
name: MiniMax-H3-Image
org: MiniMax
family: MiniMax H3
type: image-gen
thinking: none
modalities: { input: [text, image], output: [image] }
architecture: diffusion
paramsB: 33.1
license: MiniMax-H3-Image Community License Agreement
commercialUse: restricted
korean: unknown
releaseDate: 2026-11-10
huggingface: https://huggingface.co/MiniMaxAI/MiniMax-H3-Image
summary: 텍스트→이미지와 최대 16장 참조 이미지 편집을 한 체크포인트로 처리하는 33.1B DiT. 6스텝 증류로 약 16MP 이미지를 바로 생성한다.
useCases:
  - 4096x4096 급 고해상도 이미지를 업스케일러 없이 생성하는 콘텐츠 제작
  - 여러 참조 이미지를 조합하거나 지시문으로 수정하는 이미지 편집 파이프라인
strengths:
  - 6스텝(CFG 없음) 증류로 16MP 급 직접 생성
  - 모든 종횡비 지원, 최대 16장 참조 이미지 편집
  - SGLang, vLLM-Omni, diffusers, ComfyUI 등 다양한 서빙 경로 제공
limitations:
  - 라이선스 적용 지역에서 유럽연합·영국·한국·미국이 제외돼 한국에서는 사용 허가가 없음
  - 연 매출 100만 달러 초과 또는 호스팅 서비스 제공 시 MiniMax 의 별도 서면 승인 필요
  - 출력물로 다른 AI 모델을 개선하는 용도 금지, 상용 제품 UI 에 모델명 표기 의무
  - DiT 외에 MiniMax-H3 의 텍스트 인코더(약 66.7GB)를 따로 받아야 하며 상세한 영어 프롬프트를 전제로 설계됨
capabilities: []
sources:
  - https://huggingface.co/MiniMaxAI/MiniMax-H3-Image
  - https://huggingface.co/MiniMaxAI/MiniMax-H3-Image/blob/main/LICENSE
  - https://github.com/MiniMax-AI/MiniMax-H3-Image
verifiedAt: 2026-11-18
---

## 개요
MiniMax-H3-Image 는 MiniMax H3 계열에서 오디오 계층을 뺀 단일 스트림 디퓨전 트랜스포머(DiT, 50층, 33.1B)로, 이미지 생성과 편집을 한 체크포인트에서 처리한다. 텍스트 인코더는 MiniMax-H3 의 Qwen3-VL 기반 인코더를 그대로 쓰며 별도 저장소(`MiniMaxAI/MiniMax-H3`)에서 받는다. 6스텝 증류 모델이고 guidance scale 은 1 만 허용된다.

## 사용 메모
- 권장 크기는 약 16MP(예: 4096x4096, 5472x3072)이고 작동 범위는 약 4~20MP 다.
- 짧은 프롬프트는 API 의 Context-IR 또는 로컬 프롬프트 확장 모델(MiniMax-H3-Image-PE)로 상세한 영어 설명으로 확장해 쓰도록 안내한다. PE 모델은 이 모델의 일부로 같은 라이선스를 따른다.
- 서빙: `vllm serve MiniMaxAI/MiniMax-H3-Image --omni`, 또는 `sglang serve --model-path MiniMaxAI/MiniMax-H3-Image`.

## 라이선스 주의
라이선스 원문의 "Applicable Territory" 는 전 세계에서 EU, 영국, 대한민국, 미국을 제외한 지역이다. 제외 지역에서의 사용·배포·출력물 사용은 허가되지 않으며 MiniMax 와 별도 라이선스를 협의해야 한다. 연 매출 100만 달러 초과 또는 호스팅 서비스 제공 시에도 별도 서면 승인이 필요하다.

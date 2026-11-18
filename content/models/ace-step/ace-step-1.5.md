---
name: ACE-Step 1.5
org: ACE Studio · StepFun
family: ACE-Step
type: audio-gen
thinking: none
modalities: { input: [text, audio], output: [audio] }
architecture: other
license: MIT
commercialUse: allowed
korean: unknown
releaseDate: 2026-01-23
huggingface: https://huggingface.co/ACE-Step/Ace-Step1.5
summary: 언어 모델이 곡 설계를 맡고 확산 트랜스포머가 오디오를 만드는 음악 생성 모델. 짧은 루프부터 10분 곡까지 생성한다.
useCases:
  - 4GB 미만 VRAM 소비자 GPU에서 가사 포함 노래 생성
  - 커버 생성, 구간 다시 그리기(repaint), 보컬 제거 반주 만들기 같은 음악 편집
strengths:
  - A100 에서 한 곡 2초 미만, RTX 3090 에서 10초 미만 생성이라고 공개
  - 라이선스 음원·로열티 프리·합성 데이터로 학습했다고 밝혀 생성 음악의 상업 이용을 명시
  - 50개 이상 언어 프롬프트, LoRA 학습 지원, 2026-04 에 4B DiT 의 XL 변형 공개
limitations:
  - 이 저장소의 기본 DiT 는 8스텝 turbo 변형이며, 편집 기능 일부(Extract·Lego·Complete)는 base 변형에서만 지원
  - releaseDate 는 HF 첫 업로드 기록 기준(외부 보도는 2026-02 초 공개로도 표기)
capabilities: [multilingual]
sources:
  - https://huggingface.co/ACE-Step/Ace-Step1.5
  - https://github.com/ace-step/ACE-Step-1.5
  - https://arxiv.org/abs/2602.00744
verifiedAt: 2026-11-18
---

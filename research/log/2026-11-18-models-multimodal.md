# models/multimodal survey — 2026-11-18

## 추가
- Qwen3.8-27B — 네이티브 멀티모달 범용 모델 → 규칙 변경으로 text-llm (이미지·영상 입력)
- Gemma 4 31B IT, Gemma 4 E4B IT — 범용 멀티모달 → text-llm (E4B 는 오디오 입력)
- Qwen3-Omni-30B-A3B-Instruct — omni (음성 입·출력)
- GLM-OCR — 0.9B 문서 OCR, MIT
- GUI-Owl-1.5-8B-Instruct — GUI 에이전트, MIT
## 수정
- Qwen2.5-VL-7B — 후속(Qwen3-VL, Qwen3.5) 안내, releaseDate 2025-01-26 정정
- 분류 규칙 변경: vlm 은 시각 이해가 주 목적일 때만, omni 는 음성 상호작용이 주 목적일 때만. 사이트에 "이미지 입력"/"음성 입력" 필터 추가
## 폐기 후보
- Qwen2.5-VL-7B — 두 세대 뒤처짐(다운로드는 여전히 많음)
## 보류/백로그
- Qwen3-VL 계열(vlm 대표로 추가 필요), Qwen3.6-35B-A3B, Qwen3.5-9B/4B, Gemma-4-26B-A4B, MiniCPM-V-4.7, MiniCPM-o-4.5, LFM3-Omni-2B, Nemotron-3-Nano-Omni
- OCR: Unlimited-OCR-2, DeepSeek-OCR-2(활성 파라미터 공식값 대기), LightOnOCR-3-4B, chandra-ocr-2
- GUI: UI-TARS-1.5-7B
- meta-models/Muse-Glimmer-30B — 출처 확인 필요

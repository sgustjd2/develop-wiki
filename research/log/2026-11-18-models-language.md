# models/language survey — 2026-11-18

## 추가
- gpt-oss-120b, gpt-oss-20b — OpenAI 오픈 웨이트, Apache-2.0, 항상 사고(effort 조절만) (arxiv.org/abs/2508.10925)
- DeepSeek-V4-Flash-0731 — 284B/13B MoE, 1M ctx, 하이브리드 사고, MIT
- GLM-5.3 — 744B/40B MoE, 1M ctx, 항상 사고, 커스텀 라이선스(restricted)
- Nemotron 3 Nano 30B-A3B — Mamba-2+MoE, 1M ctx, 하이브리드 사고, Nemotron Open Model License(allowed)
- LFM3-1.7B — 온디바이스급, 256K ctx, LFM Open License(매출 기준 restricted)
- Qwen3-Coder-Next — 80B/3B MoE 코드 모델, Apache-2.0
- Devstral Small 2 24B — 코드 에이전트, 이미지 입력, Apache-2.0
## 수정
- DeepSeek-R1, Qwen3-30B-A3B — 후속 모델 안내 추가, Qwen3-30B-A3B contextLength(32768) 보강
- 분류 규칙 변경: 항상 사고하는 범용 모델은 text-llm + thinking: native (gpt-oss, GLM-5.3 이동). reasoning-llm 은 추론 특화 모델만
- 팩트체크: releaseDate 다수를 HF createdAt → 공식 공개일로 정정
## 폐기 후보
- DeepSeek-R1 — V3.x/V4 하이브리드로 대체됨 (사람 결정 필요)
## 보류/백로그
- DeepSeek-V4.1-Flash — 파라미터 수 공식값 불명확
- DeepSeek-V4-Pro, Nemotron-3.5-Bolt-E4B, Kimi-K3, MiniMax-M3, Mistral-Large-4, Inkling 계열
- Meta 의 Llama 3.1 이후 오픈 웨이트 후속 여부 확인 필요

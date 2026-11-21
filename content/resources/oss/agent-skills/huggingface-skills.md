---
name: huggingface/skills
url: https://github.com/huggingface/skills
docs: https://huggingface.co/docs/hub/agents-cli
repo: https://github.com/huggingface/skills
stars: 11375
domain: oss
category: agent-skills
description: Hugging Face 가 공개한 Agent Skills 모음. Hub CLI(hf-cli)부터 모델 학습·평가, Spaces·Gradio 배포, 데이터셋 조회, SageMaker 배포까지 25개 스킬을 담았다. 코딩 에이전트가 Hugging Face 생태계를 다루게 할 때 쓴다.
pricing: oss
tags: [agent-skills, huggingface, ml, fine-tuning, spaces, hub]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`huggingface/skills` 는 Hugging Face 의 AI/ML 작업(데이터셋 만들기, 모델 학습, 평가, 배포)을 코딩 에이전트에 가르치는 스킬 저장소다. [Agent Skills](/develop-wiki/oss/agent-skills/agent-skills-spec/) 표준 형식(`SKILL.md`)을 따르며 Claude Code·Codex·Gemini CLI·Cursor 에서 쓸 수 있다.
**2026-11 기준**: 별 11,361, 마지막 푸시 2026-11-17, 라이선스 Apache-2.0. 태그 릴리스가 아닌 main 브랜치로 배포된다.
설치 구조가 독특하다. 클라이언트 마켓플레이스에는 **`hf-cli` 스킬 하나만** 올라가 있고, 나머지는 `hf skills add` 로 필요할 때 설치한다.

## 무엇이 들어 있나
| 스킬 (일부) | 하는 일 |
| --- | --- |
| `hf-cli` | `hf` 명령으로 모델·데이터셋·Spaces·버킷·잡 관리. 설치된 CLI 에서 생성돼 항상 최신 |
| `huggingface-llm-trainer` · `trl-training` | TRL·Unsloth 로 LLM 파인튜닝, Hugging Face Jobs 실행 |
| `huggingface-vision-trainer` | 객체 탐지·이미지 분류·SAM 파인튜닝 |
| `train-sentence-transformers` | 임베딩·리랭커·희소 인코더 학습 |
| `huggingface-community-evals` | inspect-ai·lighteval 로 평가 |
| `huggingface-spaces` · `huggingface-gradio` · `huggingface-zerogpu` | Spaces·Gradio 앱 배포, ZeroGPU |
| `huggingface-datasets` · `huggingface-papers` | Dataset Viewer API, 논문 페이지 조회 |
| `hf-mem` · `huggingface-local-models` | 모델의 GPU 메모리 추정, llama.cpp·GGUF 로 로컬 실행 모델 선택 |
| `hf-cloud-sagemaker-*` | SageMaker 엔드포인트 배포 계획·IAM 점검·운영 기본값 |
| `transformers-js` · `huggingface-trackio` | Transformers.js, 학습 실험 추적 |

## 설치·사용법
```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

나머지 스킬은 `hf` CLI 로 고른다.

```bash
hf skills add
```

Codex 는 `skills/` 폴더의 스킬을 `.agents/skills` 로 복사하거나 링크하고, Gemini CLI 는 `gemini extensions install https://github.com/huggingface/skills.git --consent` 를 쓴다. 스킬을 지원하지 않는 에이전트는 `agentsmd/AGENTS.md` 를 대신 쓸 수 있다. 설치 후에는 "HF LLM trainer 스킬로 70B 모델 학습에 필요한 GPU 메모리를 추정해 줘"처럼 지시한다.

## 언제 쓰나 / 주의
- 쓸 때: Hub 작업(검색·업로드·Spaces 생성)을 반복 명령 대신 에이전트에게 맡길 때, 학습·평가 잡을 Hugging Face Jobs 에 띄울 때.
- 주의: 학습·배포 스킬은 **유료 GPU 잡과 클라우드 리소스를 만들 수 있다**. HF 토큰은 필요한 범위(읽기 전용 등)만 주고, 잡 실행 전 하드웨어와 예상 비용을 확인한다. 스킬에 포함된 스크립트를 설치 전에 읽어 본다.
- 이 저장소의 다른 도구와 관계: Hub 자체는 [Hugging Face Hub](/develop-wiki/ai/model-platform/huggingface-hub/), 학습 라이브러리는 [TRL](/develop-wiki/ai/fine-tuning/trl/).

## 링크
- [저장소](https://github.com/huggingface/skills) · [Hub CLI 에이전트 문서](https://huggingface.co/docs/hub/agents-cli) · [Agent Skills 표준](https://agentskills.io/home)
- 이 사이트: [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/) · [anthropics/skills](/develop-wiki/oss/agent-skills/anthropic-skills/)

---
name: LLMs-from-scratch
url: https://github.com/rasbt/LLMs-from-scratch
repo: https://github.com/rasbt/LLMs-from-scratch
stars: 108617
domain: oss
category: learning-repos
description: GPT 계열 LLM 을 PyTorch 로 토크나이저·어텐션부터 사전 학습·파인튜닝까지 직접 구현하는 책의 공식 코드 저장소. LLM 내부 구조를 코드로 이해하고 싶을 때 쓴다.
pricing: oss
tags: [llm, pytorch, gpt, transformer, from-scratch, fine-tuning]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Sebastian Raschka 의 책 *Build a Large Language Model (From Scratch)*(Manning) 공식 코드 저장소다. 장별 Jupyter 노트북으로 텍스트 데이터 처리 → 어텐션 → GPT 모델 → 사전 학습 → 분류·지시 파인튜닝을 단계적으로 구현한다. 본문 코드는 일반 노트북(GPU 없이도)에서 돌아가도록 작게 설계됐다. 2026-11 기준 별 약 10.9만, 코드 라이선스 Apache-2.0. 최근 6개월 커밋 39건, 마지막 2026-11-09. 책 본문 자체는 유료이고, 저장소의 코드·보너스 자료는 무료다.

## 무엇이 들어 있나
| 장 | 내용 |
| --- | --- |
| Setup | Python·패키지·Docker 환경 설정 |
| Ch 1 | LLM 이해하기 (코드 없음) |
| Ch 2 | 텍스트 데이터 다루기: 토큰화, BPE, 데이터 로더 |
| Ch 3 | 어텐션 메커니즘 구현: self-attention, causal, multi-head |
| Ch 4 | GPT 모델 처음부터 구현 |
| Ch 5 | 레이블 없는 데이터로 사전 학습, 공개 가중치 불러오기 |
| Ch 6 | 텍스트 분류 파인튜닝 |
| Ch 7 | 지시(instruction) 파인튜닝 |
| Appendix A~E | PyTorch 입문, 참고 문헌, 연습 문제 풀이, 학습 루프 개선, LoRA |
| Bonus | BPE 직접 구현, KV 캐시, GQA·MLA·슬라이딩 윈도 어텐션, MoE, GPT→Llama 변환, Llama 3.2·Qwen3·Gemma 3 등 최신 구조 처음부터 구현, 학습 성능 팁 |

## 이렇게 활용하라
1. **setup 폴더대로 환경을 만든다.**
   ```bash
   git clone --depth 1 https://github.com/rasbt/LLMs-from-scratch.git
   cd LLMs-from-scratch && pip install -r requirements.txt
   ```
2. **Appendix A 로 PyTorch 를 먼저 익힌다.** 텐서·autograd·학습 루프가 낯설면 여기부터.
3. **장마다 노트북을 실행하며 코드를 직접 다시 친다.** 각 장 끝 연습 문제를 풀고 Appendix C 와 대조한다.
4. **Ch 5 이후는 공개 가중치로 실험한다.** GPT-2 가중치를 불러와 생성·파인튜닝을 해 본 뒤, Bonus 의 Llama·Qwen3 구현으로 최신 구조 차이를 비교한다.
5. **이 사이트 자료로 개념을 넓힌다.** [PyTorch](/develop-wiki/data-ml/ml/pytorch/) · [Hugging Face 학습 과정](/develop-wiki/ai/learning/hugging-face-learn/) · [오픈 웨이트 모델](/develop-wiki/models/)

## 주의
- 교육용 소형 모델 구현이다. 실서비스 학습·추론은 Hugging Face Transformers, vLLM 같은 도구를 쓴다.
- 책 없이 노트북만으로도 따라갈 수 있지만, 설명은 책에 있어 코드만 보면 맥락이 부족할 수 있다.
- 한국어 번역은 저장소에 없다.

## 링크
- [저장소 README](https://github.com/rasbt/LLMs-from-scratch) · [후속 저장소: reasoning-from-scratch](https://github.com/rasbt/reasoning-from-scratch)
- 이 사이트: [Generative AI for Beginners](/develop-wiki/oss/learning-repos/generative-ai-for-beginners/)(애플리케이션 쪽 입문) · [Build Your Own X](/develop-wiki/oss/learning-repos/build-your-own-x/)

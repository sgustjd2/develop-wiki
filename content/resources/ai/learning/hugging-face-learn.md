---
name: Hugging Face Learn
url: https://huggingface.co/learn
docs: https://huggingface.co/learn
repo: https://github.com/huggingface/agents-course
stars: 35427
domain: ai
category: learning
description: Hugging Face 가 운영하는 무료 실습 강좌 모음. LLM·에이전트·MCP·컨텍스트 엔지니어링·후학습 등을 노트북과 과제로 익힐 때 쓴다.
pricing: oss
tags: [course, llm, agents, mcp, transformers, fine-tuning]
languages: [python]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hugging Face Learn 은 Hugging Face 가 공개하는 무료 강좌 허브다. 각 강좌는 문서 사이트(huggingface.co/learn/…)와 GitHub 저장소(Apache-2.0)로 나뉘어 있고, 본문 + Colab/Jupyter 노트북 + 과제(Space 제출, 리더보드) 구조로 진행된다.
라이브러리 사용법만이 아니라 Transformer 구조, 에이전트 루프, MCP 같은 개념을 직접 코드로 확인하는 데 초점이 있다. 유료 MOOC 와 달리 계정만 있으면 모든 단원과 수료증이 무료다.

## 시작하기
1. Hugging Face 무료 계정을 만든다(과제 제출·수료증에 필요).
2. 원하는 강좌의 Unit 0(온보딩)부터 읽는다. 대부분 Python 기초를 전제로 한다.
3. 노트북은 본문의 "Open in Colab" 링크로 열거나 저장소를 클론해 로컬에서 돌린다.

```bash
git clone https://github.com/huggingface/agents-course.git
cd agents-course
ls units/en          # 단원별 마크다운·노트북
```

## 구성 (2026-11 기준 강좌 목록)
| 강좌 | 경로 | 다루는 내용 |
| --- | --- | --- |
| LLM Course | `/learn/llm-course` | Transformers·Datasets·Tokenizers, 파인튜닝, 데이터 큐레이션, 추론(reasoning) 모델 |
| Agents Course | `/learn/agents-course` | 에이전트 기초(도구·관찰·채팅 템플릿), smolagents·LangGraph·LlamaIndex, 최종 과제 리더보드 |
| MCP Course | `/learn/mcp-course` | MCP 아키텍처, 엔드투엔드 MCP 앱 제작, 배포 |
| Context Course | `/learn/context-course` | 코딩 에이전트를 위한 컨텍스트 엔지니어링 |
| a smol course | `/learn/smol-course` | 작은 모델 후학습(SFT·선호 학습 등) |
| Open-Source AI Cookbook | `/learn/cookbook` | 커뮤니티가 쓴 RAG·평가·파인튜닝 노트북 모음 |
| Deep RL / Audio / Computer Vision / Diffusion / ML for 3D / ML for Games / Robotics | `/learn/<이름>-course` | 분야별 강좌 |

| 개념 | 설명 |
| --- | --- |
| Unit | 강좌의 장. Unit 0 은 환경 준비, 마지막은 보통 최종 과제 |
| 수료증 | Agents·MCP 강좌는 기초 단원만 마친 "Fundamentals" 와 과제까지 마친 "Completion" 두 단계, 모두 무료·기한 없음 |
| Audit 모드 | 등록·제출 없이 본문만 읽는 방식 |
| 번역 | Agents Course 는 한국어판(`units/ko`)이 Unit 0~2 전체와 보너스·Unit 4 일부까지 있다(영어 74개 문서 중 50개). LLM Course 한국어는 일부만 번역(WIP) |

## 기본 사용법
LLM Course 1장 수준의 첫 실습을 로컬에서 재현하는 예시(인증 불필요한 공개 모델 사용).

```python
# pip install "transformers[torch]"
from transformers import pipeline

clf = pipeline("sentiment-analysis",
               model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
print(clf(["I finished unit 1 today.", "The notebook crashed again."]))
```

Agents Course 의 smolagents 단원은 아래처럼 작은 에이전트로 시작한다(모델 호출에 HF 토큰은 환경 변수 `HF_TOKEN` 으로 둔다).

```python
# pip install smolagents
from smolagents import CodeAgent, InferenceClientModel, tool

@tool
def add(a: int, b: int) -> int:
    """두 정수를 더한다.
    Args:
        a: 첫 번째 수
        b: 두 번째 수
    """
    return a + b

agent = CodeAgent(tools=[add], model=InferenceClientModel())
agent.run("17 더하기 25 는?")
```

## 자주 쓰는 패턴
- **순서**: LLM Course(1~4장) → Agents Course → MCP Course 순으로 가면 모델 → 에이전트 → 도구 연동 흐름이 이어진다.
- **로컬 GPU 없이**: 노트북은 Colab 무료 런타임에서 돌도록 작게 짜여 있다. 무거운 장은 Inference Providers 를 쓰도록 안내한다.
- **최신 내용 확인**: 강좌는 저장소에서 계속 수정되므로, 본문과 노트북이 다르면 GitHub 의 최근 커밋을 기준으로 본다.
- **Cookbook 은 레시피 검색용**: 강좌처럼 순서대로 읽기보다, 필요한 주제(RAG 평가, 구조화 출력 등) 노트북을 찾아 쓴다.
- **MCP 실습 연결**: MCP Course 를 마친 뒤 [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 명세·SDK 문서로 넘어간다.

## 언제 쓰나 / 피할 때
- 쓸 때: Hugging Face 생태계(Transformers, smolagents, Hub)를 쓰는 팀의 온보딩, 에이전트·MCP 개념을 실습으로 빠르게 잡고 싶을 때, 무료 수료증이 필요할 때.
- 피할 때(대안): 특정 상용 API(Claude, OpenAI) 기능을 바로 쓰려면 [Claude Cookbooks](/develop-wiki/ai/learning/claude-cookbooks/)·[OpenAI Cookbook](/develop-wiki/ai/learning/openai-cookbook/) 이 더 직접적이다. 딥러닝 수학 기초부터라면 fast.ai 등 입문 강좌를 먼저 듣는 편이 낫다(LLM Course 도 이를 권장).

## 공식 문서
- [Learn 홈(강좌 목록)](https://huggingface.co/learn) · [LLM Course](https://huggingface.co/learn/llm-course/chapter1/1) · [Agents Course](https://huggingface.co/learn/agents-course/unit0/introduction) · [MCP Course](https://huggingface.co/learn/mcp-course/unit0/introduction)
- 저장소: [huggingface/course](https://github.com/huggingface/course) · [huggingface/agents-course](https://github.com/huggingface/agents-course) · [huggingface/mcp-course](https://github.com/huggingface/mcp-course)

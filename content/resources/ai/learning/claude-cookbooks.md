---
name: Claude Cookbooks
url: https://platform.claude.com/cookbook
docs: https://platform.claude.com/cookbook
repo: https://github.com/anthropics/claude-cookbooks
stars: 55111
domain: ai
category: learning
description: Anthropic 이 관리하는 Claude API 예제 노트북 모음. 도구 사용·에이전트·평가·RAG·스킬 같은 기능을 실제 코드로 따라 해 볼 때 쓴다.
pricing: oss
tags: [cookbook, claude, notebooks, tool-use, agents]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Claude Cookbooks 는 Anthropic 공식 예제 저장소다(MIT, 2025년 9월 `anthropic-cookbook` 에서 이름 변경). 각 레시피는 대부분 Jupyter 노트북이며, API 문서가 "무엇이 있는가"를 설명한다면 쿡북은 "기능을 엮어 문제를 어떻게 푸는가"를 코드로 보여 준다.
노트북 원본은 GitHub 에 있고, platform.claude.com/cookbook 에서 카테고리 필터와 검색이 되는 카탈로그로 볼 수 있다. 저장소와 카탈로그는 무료이고, 노트북을 실행할 때의 API 사용료만 든다.

## 시작하기
Python 3.11+ 와 [uv](https://docs.astral.sh/uv/) 를 권장한다.

```bash
git clone https://github.com/anthropics/claude-cookbooks.git
cd claude-cookbooks
uv sync --all-extras          # 의존성 설치 (pip 이면: pip install -e ".[dev]")
cp .env.example .env          # ANTHROPIC_API_KEY 는 직접 채운다 (커밋 금지)
uv run jupyter lab            # 원하는 노트북 열기
```

`.env.example` 은 비용을 줄이려고 테스트 기본 모델을 가장 저렴한 Haiku 로 두고 있다.

## 구성
| 카탈로그 카테고리 | 저장소 폴더(예) | 내용 |
| --- | --- | --- |
| Tools | `tool_use/` | 도구 정의·호출, 프로그래매틱 도구 호출, 임베딩 기반 도구 검색 |
| Agent Patterns | `patterns/` | 프롬프트 체이닝·라우팅·오케스트레이터-워커 등 에이전트 워크플로 |
| Claude Agent SDK / Managed Agents | `claude_agent_sdk/`, `managed_agents/` | SDK 로 만든 에이전트, 서버 호스팅 에이전트 세션 |
| Evals | `evals/`, `tool_evaluation/` | 평가 세트 만들기, LLM 채점 |
| RAG & Retrieval | `capabilities/`, `third_party/` | 검색 증강, 벡터 DB·임베딩 연동 |
| Skills | `skills/` | Claude Skills 소개와 작성 |
| Multimodal | `multimodal/` | 이미지·차트·PDF 읽기 |
| Thinking | `extended_thinking/` | 확장 사고 사용법 |
| Observability | `observability/` | OpenTelemetry 로 요청·세션 추적 |
| 비용·지연 | `cost_optimization/`, `latency_optimization/` | 품질 대비 비용·지연 최적 설정 찾기 |

## 기본 사용법
노트북 대부분이 공유하는 최소 호출 형태. 키는 환경 변수에서 읽는다.

```python
# uv add anthropic python-dotenv
import os
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()                      # .env 의 ANTHROPIC_API_KEY 로드
client = Anthropic()
model = os.getenv("CLAUDE_MODEL", "claude-haiku-5-5")

msg = client.messages.create(
    model=model,
    max_tokens=300,
    messages=[{"role": "user", "content": "프롬프트 캐싱이 무엇인지 두 문장으로."}],
)
print(msg.content[0].text)
```

노트북을 헤드리스로 실행해 결과를 확인할 수도 있다.

```bash
uv run jupyter nbconvert --to notebook --execute tool_use/calculator_tool.ipynb --output /tmp/out.ipynb
```

## 자주 쓰는 패턴
- **기능 도입 전 레퍼런스 구현으로**: 새 기능(도구 검색, 컨텍스트 압축 등)을 붙이기 전에 해당 레시피를 실행해 기대 동작·토큰 비용을 먼저 확인한다.
- **카탈로그로 찾고 GitHub 로 실행**: 웹 카탈로그에서 카테고리로 고른 뒤, 노트북은 저장소 최신본을 받는다. 두 곳의 목록이 잠시 어긋날 수 있다.
- **테스트 모드로 싸게**: `.env` 의 `CLAUDE_MODEL` 을 Haiku 로 두고 흐름을 확인한 뒤 실제 모델로 바꾼다.
- **평가 레시피 재사용**: `evals/` 의 채점 구조를 가져와 자기 프롬프트 회귀 테스트로 쓴다.
- **Claude Code 와 함께**: 저장소에 `CLAUDE.md`·`.claude/` 가 있어 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 로 레시피를 읽고 변형하기 쉽다.

## 언제 쓰나 / 피할 때
- 쓸 때: Claude API 로 도구 사용·에이전트·RAG·평가를 처음 구현할 때, 공식 권장 패턴을 코드로 확인하고 싶을 때.
- 피할 때(대안): 파라미터·제한 같은 정확한 사양은 API 문서가 기준이다. 모델 중립적인 개념 학습이면 [Hugging Face Learn](/develop-wiki/ai/learning/hugging-face-learn/), OpenAI 모델용 예제는 [OpenAI Cookbook](/develop-wiki/ai/learning/openai-cookbook/) 을 본다.

## 공식 문서
- [Cookbook 카탈로그](https://platform.claude.com/cookbook) · [GitHub 저장소](https://github.com/anthropics/claude-cookbooks) · [기여 가이드](https://github.com/anthropics/claude-cookbooks/blob/main/CONTRIBUTING.md)

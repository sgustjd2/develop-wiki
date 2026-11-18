---
name: OpenAI Cookbook
url: https://developers.openai.com/cookbook
docs: https://developers.openai.com/cookbook
repo: https://github.com/openai/openai-cookbook
domain: ai
category: learning
description: OpenAI 가 관리하는 API 예제·가이드 모음. 임베딩·함수 호출·Responses·Agents SDK·평가·음성 같은 기능을 노트북으로 익힐 때 쓴다.
pricing: oss
tags: [cookbook, openai, notebooks, embeddings, agents, evals]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenAI Cookbook 은 OpenAI API 로 흔한 작업을 푸는 예제 노트북과 글을 모은 공식 저장소다(MIT). 2026-11 기준 사이트에 등록된 항목은 325개이며, `registry.yaml` 에 제목·날짜·태그를 적은 항목이 웹 사이트로 빌드된다. 옛 주소 cookbook.openai.com 은 developers.openai.com/cookbook 으로 영구 리디렉션된다.
초기 임베딩·Completions 예제부터 최근 Agents SDK·Codex·Realtime 음성·평가 가이드까지 쌓여 있어, 오래된 노트북과 최신 노트북의 API 스타일이 섞여 있다는 점을 감안하고 읽어야 한다.

## 시작하기
```bash
git clone https://github.com/openai/openai-cookbook.git
cd openai-cookbook
python -m venv .venv && source .venv/bin/activate
pip install openai jupyter          # 노트북마다 추가 패키지는 첫 셀에 적혀 있다
export OPENAI_API_KEY=...           # 직접 발급한 키를 셸에서만 설정
jupyter lab examples/
```

## 구성
| 위치 | 내용 |
| --- | --- |
| `examples/` | 실행 가능한 노트북(`.ipynb`)·MDX. 분야별 하위 폴더(agents_sdk, evals, codex, mcp, responses_api 등) 포함 |
| `articles/` | 코드보다 설명 중심의 글(프롬프트 작성, 기술 선택 가이드) |
| `registry.yaml` | 사이트에 올라가는 항목 목록. `date`, `tags`, `authors` 로 최신순·주제별 탐색 가능 |

| 자주 나오는 태그 | 다루는 내용 |
| --- | --- |
| embeddings | 검색·분류·클러스터링·추천 (가장 많은 항목) |
| responses / functions | Responses API, 함수 호출, 구조화 출력 |
| agents / mcp | Agents SDK, MCP 도구 연동, 샌드박스 |
| evals | 평가 설계, LLM-as-a-judge, 트레이스 기반 개선 |
| audio / speech | 전사, Realtime 음성 에이전트 |
| codex | Codex 로 코드 현대화·수리 루프 |
| gpt-oss | 오픈 웨이트 gpt-oss 실행·파인튜닝 |

## 기본 사용법
최신 노트북이 쓰는 Responses API 최소 예제. 모델 id 는 공식 모델 문서에서 확인한다(2026-11 기준 가장 저렴한 모델은 `gpt-6-luna`).

```python
# pip install openai
import os
from openai import OpenAI

client = OpenAI()   # OPENAI_API_KEY 환경 변수 사용
resp = client.responses.create(
    model=os.getenv("OPENAI_MODEL", "gpt-6-luna"),
    input="임베딩으로 중복 질문을 찾는 방법을 세 단계로 설명해 줘.",
)
print(resp.output_text)
```

최근 추가된 항목을 날짜순으로 뽑아 보기(키 불필요).

```bash
python - <<'EOF'
import yaml  # pip install pyyaml
items = yaml.safe_load(open("registry.yaml"))
for it in sorted(items, key=lambda x: str(x.get("date")), reverse=True)[:10]:
    print(it.get("date"), "|", it["title"], "|", ", ".join(it.get("tags", [])))
EOF
```

## 자주 쓰는 패턴
- **날짜부터 확인**: 사이트·`registry.yaml` 의 `date` 가 오래된 노트북은 Completions·Assistants API 등 구식 호출을 쓸 수 있다. 같은 주제의 최신 항목이 있으면 그쪽을 기준으로 삼는다.
- **태그로 묶어 읽기**: `evals` 태그만 모아 읽으면 평가 파이프라인 설계 흐름을 한 번에 잡을 수 있다.
- **임베딩 레시피는 모델 중립적으로 재사용**: 유사도 검색·분류 로직은 다른 임베딩 모델로 바꿔도 그대로 쓸 수 있다.
- **에이전트 예제는 SDK 문서와 함께**: [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/) 항목·공식 문서와 버전을 맞춰 본다.
- **오픈 웨이트 실습**: gpt-oss 예제는 [vLLM](/develop-wiki/ai/inference-serving/vllm/)·[Ollama](/develop-wiki/ai/inference-serving/ollama/) 로 로컬 실행하는 방법을 포함한다.

## 언제 쓰나 / 피할 때
- 쓸 때: OpenAI API 로 RAG·함수 호출·평가·음성 기능을 처음 구현할 때, 공식 팀이 권장하는 구조를 코드로 확인하고 싶을 때.
- 피할 때(대안): 파라미터·가격의 정확한 값은 API 레퍼런스가 기준이다. Claude 를 쓴다면 [Claude Cookbooks](/develop-wiki/ai/learning/claude-cookbooks/), 체계적인 강좌가 필요하면 [Hugging Face Learn](/develop-wiki/ai/learning/hugging-face-learn/) 이 맞다.

## 공식 문서
- [Cookbook 사이트](https://developers.openai.com/cookbook) · [GitHub 저장소](https://github.com/openai/openai-cookbook) · [모델 목록](https://developers.openai.com/api/docs/models)

---
name: Haystack
url: https://haystack.deepset.ai
docs: https://docs.haystack.deepset.ai/docs/intro
repo: https://github.com/deepset-ai/haystack
stars: 27118
domain: ai
category: rag-retrieval
description: 컴포넌트를 연결한 파이프라인과 에이전트로 RAG·검색·질의응답을 만드는 deepset 의 Python 오케스트레이션 프레임워크.
pricing: oss
tags: [rag, pipeline, retrieval, agents, framework]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Haystack 은 독일 deepset 이 만든 오픈소스(Apache-2.0) LLM 애플리케이션 프레임워크다. 리트리버·프롬프트 빌더·생성기·조이너·랭커 같은 **컴포넌트**를 `Pipeline` 에 넣고 입출력 소켓을 명시적으로 `connect` 해서 흐름을 만든다. 분기·루프도 표현할 수 있고, 데이터가 어디서 어디로 가는지 코드에 그대로 드러나는 것이 특징이다.
2026-07 의 **3.0** 에서 큰 정리가 있었다: `Pipeline` 과 `AsyncPipeline` 이 하나로 합쳐졌고(`run`/`run_async`/`stream`), `Agent` 가 훅(`before_llm`, `before_tool` …)과 스킬을 갖게 됐으며, 레거시 Generator 가 제거되고 Sentence Transformers·HF 등 30개 컴포넌트가 별도 연동 패키지로 분리됐다. 2.x 코드는 [마이그레이션 가이드](https://docs.haystack.deepset.ai/docs/migration)를 보고 옮긴다.
비슷한 자리의 [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/) 가 "인덱스 중심 고수준 API" 라면, Haystack 은 "파이프라인 그래프 중심" 이다.

## 설치
기준: haystack-ai 3.5.0 (2026-11-10), Python 3.11 이상.

```bash
pip install haystack-ai
pip install sentence-transformers-haystack   # 로컬 임베딩·랭커 (3.0 부터 별도 패키지)
export OPENAI_API_KEY="..."                  # OpenAIChatGenerator 사용 시
```

벡터 DB·모델 공급자 연동은 `haystack-core-integrations` 의 개별 패키지(`qdrant-haystack`, `pgvector-haystack` 등)로 설치한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Component | `run()` 입출력이 타입으로 정의된 처리 단위 |
| `Pipeline` | 컴포넌트를 `add_component` 로 넣고 `connect("a.out", "b.in")` 으로 잇는 그래프. 동기·비동기·스트리밍 겸용 |
| Document Store | 문서 저장소. 개발용 `InMemoryDocumentStore`, 운영은 Qdrant·pgvector·Elasticsearch 등 |
| Retriever | BM25·임베딩·하이브리드 검색 컴포넌트 (저장소별 구현) |
| `ChatPromptBuilder` | Jinja 템플릿으로 `ChatMessage` 프롬프트 생성 |
| Chat Generator | `OpenAIChatGenerator` 등 LLM 호출 컴포넌트 |
| `DocumentJoiner` | 여러 리트리버 결과를 합침(`reciprocal_rank_fusion` 등) |
| `Agent` | 도구 호출 루프 + 훅 + 상태(`step_count`, `token_usage`) |

## 기본 사용법
BM25 검색 → 프롬프트 → 생성으로 이어지는 최소 RAG

```python
from haystack import Document, Pipeline
from haystack.components.builders import ChatPromptBuilder
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
from haystack.dataclasses import ChatMessage
from haystack.document_stores.in_memory import InMemoryDocumentStore

store = InMemoryDocumentStore()
store.write_documents([Document(content="환불은 구매 후 14일 이내에 가능하다.")])

template = [ChatMessage.from_user(
    "문서:\n{% for d in documents %}{{ d.content }}\n{% endfor %}\n질문: {{ question }}")]
rag = Pipeline()
rag.add_component("retriever", InMemoryBM25Retriever(document_store=store))
rag.add_component("prompt", ChatPromptBuilder(template=template, required_variables="*"))
rag.add_component("llm", OpenAIChatGenerator())
rag.connect("retriever", "prompt.documents")
rag.connect("prompt.prompt", "llm.messages")

q = "환불 기한은?"
out = rag.run({"retriever": {"query": q}, "prompt": {"question": q}})
print(out["llm"]["replies"][0].text)
```

## 자주 쓰는 패턴
- **하이브리드 검색**: BM25 리트리버와 임베딩 리트리버를 병렬로 두고 `DocumentJoiner(join_mode="reciprocal_rank_fusion")` 로 합친다. Elasticsearch·OpenSearch 연동에는 하이브리드 리트리버 컴포넌트가 따로 있다.
- **재정렬**: 조이너 뒤에 크로스 인코더 랭커(Sentence Transformers 연동 패키지 등)를 두어 상위 k 개만 LLM 에 넘긴다. [BGE-M3](/develop-wiki/models/baai/bge-m3/) 같은 다국어 임베딩과 다국어 리랭커 조합이 한국어 문서에 무난하다.
- **인덱싱 파이프라인 분리**: 변환기(예: [Docling](/develop-wiki/ai/rag-retrieval/docling/) 연동) → 분할기 → 임베더 → `DocumentWriter` 를 별도 파이프라인으로 만들어 배치로 돌린다.
- **비동기 서빙**: 같은 `Pipeline` 을 `await pipeline.run_async(...)` 로 부르거나 `stream()` 으로 토큰 단위 응답을 내보낸다. REST·MCP 로 노출하려면 Hayhooks 를 쓴다.
- **에이전트**: `Agent(chat_generator=..., tools=[...], hooks={"before_tool": [...]})` 로 도구 실행 전 검사·사람 승인을 끼운다.

## 언제 쓰나 / 피할 때
- 쓸 때: 검색·랭킹·생성 단계를 명시적으로 설계하고 테스트하려는 RAG·검색 서비스, 비동기 서빙과 관측(트레이싱)이 필요한 운영 환경.
- 피할 때(대안): 몇 줄로 빠르게 문서 Q&A 만 만들면 [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/), 그래프형 상태 머신 에이전트가 중심이면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/).

## 공식 문서
- [소개](https://docs.haystack.deepset.ai/docs/intro) · [3.0 마이그레이션](https://docs.haystack.deepset.ai/docs/migration) · [튜토리얼](https://haystack.deepset.ai/tutorials)
- [InMemoryBM25Retriever](https://docs.haystack.deepset.ai/docs/inmemorybm25retriever) · [DocumentJoiner](https://docs.haystack.deepset.ai/docs/documentjoiner) · [연동 목록](https://haystack.deepset.ai/integrations)

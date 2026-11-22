---
name: LlamaIndex
url: https://www.llamaindex.ai
docs: https://developers.llamaindex.ai/python/framework/
repo: https://github.com/run-llama/llama_index
stars: 52981
domain: ai
category: rag-retrieval
description: 문서 로딩·청킹·인덱싱·검색·응답 합성을 모듈로 제공하는 Python RAG 프레임워크. 300개 넘는 LLM·임베딩·벡터 저장소 연동 패키지를 갖췄다.
pricing: oss
tags: [rag, indexing, retrieval, framework]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
LlamaIndex 는 LLM 에 사내 문서·DB 같은 비공개 데이터를 연결하는 "데이터 프레임워크"다. 데이터 커넥터(Reader)로 문서를 읽고, 노드(청크)로 나눠 인덱스를 만들고, 리트리버·후처리기·응답 합성기를 조합해 질의 엔진을 만든다. 고수준 API 는 몇 줄로 RAG 를 띄우고, 저수준 모듈은 하나씩 갈아 끼울 수 있다.
패키지는 `llama-index-core` 와 연동별 패키지(`llama-index-llms-openai`, `llama-index-vector-stores-qdrant` 등)로 나뉜다. 임포트 경로에 `core` 가 있으면 코어, 없으면 연동 패키지다.

**현재 상태(2026-11)**: 회사 LlamaIndex 의 주력은 상용 문서 파싱 플랫폼 LlamaParse 로 옮겨 갔고, README 도 프레임워크는 "열린 툴킷으로 계속 제공"한다고 적고 있다. 저장소는 MIT 라이선스로 꾸준히 릴리스(0.14.26, 2026-11-13)되고 있지만, 신규 프로젝트라면 장기 투자 방향을 감안한다.
에이전트·워크플로 중심이면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), 파이프라인을 명시적으로 그리는 쪽을 선호하면 [Haystack](/develop-wiki/ai/rag-retrieval/haystack/) 이 비교 대상이다.

## 설치
Python 3.11 이상(0.14.26 기준).

```bash
pip install llama-index                       # 코어 + 기본 연동(OpenAI 등) 묶음
# 또는 필요한 것만
pip install llama-index-core llama-index-llms-ollama llama-index-embeddings-huggingface
```

TypeScript 판(`llamaindex`, npm 0.12.1)도 있지만 기능 범위는 Python 판이 넓다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Document` / `Node` | 원문 문서와, 그것을 나눈 청크. 노드는 메타데이터와 앞뒤 관계를 가진다 |
| Reader | `SimpleDirectoryReader` 등 파일·API·DB 에서 문서를 읽는 커넥터 |
| `VectorStoreIndex` | 노드를 임베딩해 벡터 저장소에 넣는 가장 흔한 인덱스. 기본은 메모리 저장 |
| `Settings` | 전역 기본 LLM·임베딩 모델·토크나이저 설정 |
| Retriever | 질의에 맞는 노드를 가져옴. `similarity_top_k` 로 개수 조절 |
| Node Postprocessor | 검색 후 필터·재정렬(유사도 컷오프, 리랭커) |
| Query / Chat Engine | 검색 + 응답 합성을 묶은 단발 질의 / 대화형 인터페이스 |
| `StorageContext` | 인덱스 영속화(`persist`)·재로드 |

## 기본 사용법
OpenAI 기본 설정으로 폴더의 문서를 색인하고 질문하기 (`OPENAI_API_KEY` 환경 변수 필요)

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex

documents = SimpleDirectoryReader("./docs").load_data()
index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine(similarity_top_k=5)
print(query_engine.query("환불 정책의 예외 조건은?"))

index.storage_context.persist(persist_dir="./storage")  # 디스크에 저장
```

로컬 모델로 바꾸기 — [Ollama](/develop-wiki/ai/inference-serving/ollama/) LLM + HF 임베딩

```python
from llama_index.core import Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

Settings.llm = Ollama(model="qwen3:8b", request_timeout=300.0)
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-m3")
```

## 자주 쓰는 패턴
- **재로드**: `StorageContext.from_defaults(persist_dir="./storage")` → `load_index_from_storage(...)` 로 다시 임베딩하지 않고 인덱스를 연다.
- **외부 벡터 DB**: `llama-index-vector-stores-*` 패키지로 [Qdrant](/develop-wiki/ai/vector-db/qdrant/)·[pgvector](/develop-wiki/ai/vector-db/pgvector/)·[Milvus](/develop-wiki/ai/vector-db/milvus/) 등을 `StorageContext` 에 연결한다.
- **재정렬·컷오프**: 넉넉히 가져온 뒤 후처리기로 줄인다.

  ```python
  from llama_index.core.postprocessor import SimilarityPostprocessor

  engine = index.as_query_engine(
      similarity_top_k=20,
      node_postprocessors=[SimilarityPostprocessor(similarity_cutoff=0.5)],
  )
  ```
  크로스 인코더·Cohere 등 리랭커는 `llama-index-postprocessor-*` 연동 패키지로 같은 자리에 넣는다.
- **하이브리드 검색**: 벡터 저장소가 키워드+벡터 검색을 지원하면(예: Qdrant, Weaviate) 해당 연동의 하이브리드 모드를 켠다. 아니면 BM25 리트리버와 벡터 리트리버 결과를 합치는 융합 리트리버를 쓴다.
- **문서 파싱 품질**: 표·레이아웃이 복잡한 PDF 는 [Docling](/develop-wiki/ai/rag-retrieval/docling/) 이나 상용 LlamaParse 로 먼저 마크다운으로 변환한 뒤 넣는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 문서 Q&A·사내 검색 RAG 를 빠르게 프로토타이핑할 때, 다양한 데이터 소스·벡터 DB 연동이 필요할 때.
- 피할 때(대안): 회사의 개발 중심이 파싱 플랫폼으로 옮겨간 점이 부담이면 [Haystack](/develop-wiki/ai/rag-retrieval/haystack/) 이나 [LangChain](/develop-wiki/ai/agent-framework/langchain/). 검색 하나만 필요하면 벡터 DB 클라이언트를 직접 쓰는 편이 단순하다.

## 공식 문서
- [프레임워크 문서](https://developers.llamaindex.ai/python/framework/) · [연동 목록](https://developers.llamaindex.ai/python/framework/community/integrations) · [Node Postprocessor](https://developers.llamaindex.ai/python/framework/module_guides/querying/node_postprocessors/)
- [LlamaParse](https://developers.llamaindex.ai/llamaparse/) · [GitHub](https://github.com/run-llama/llama_index)

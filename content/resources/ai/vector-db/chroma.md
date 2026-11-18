---
name: Chroma
url: https://www.trychroma.com
docs: https://docs.trychroma.com
repo: https://github.com/chroma-core/chroma
stars: 29708
domain: ai
category: vector-db
description: 파이썬·JS 에서 임베디드 또는 서버 모드로 쓰는 오픈소스 임베딩 데이터베이스. 기본 임베딩 함수가 있어 RAG 프로토타입에 많이 쓴다.
pricing: oss
tags: [vector-search, embedded, prototyping]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Chroma 는 "문서를 넣고 텍스트로 질의"하는 흐름에 맞춘 오픈소스(Apache-2.0) 임베딩 데이터베이스다. 컬렉션에 문서를 넣으면 기본 임베딩 함수(로컬 소형 모델)가 벡터를 만들어 주므로 별도 임베딩 코드 없이 시작할 수 있다. 같은 API 로 프로세스 내 영구 저장(임베디드), 클라이언트-서버, 관리형 **Chroma Cloud** 를 오간다. 코어는 Rust 로 다시 작성돼 있다.
**유지 상태(2026-11-18 확인)**: 저장소 커밋은 이어지고 있으나(최근 2026-11-07) 빈도가 줄었고, PyPI `chromadb` 최신은 **1.5.9**(2026-05-05), npm `chromadb` 은 3.5.0(2026-06-30)이다. PyPI 는 6개월 넘게, npm 은 4개월 넘게 새 패키지가 없다. 저장소에 "[RELEASE] 1.6.0" 커밋(2026-10-13)이 있지만 PyPI 에는 아직 올라오지 않았다. 신규 운영 도입 전 릴리스 주기를 확인한다.

## 설치
```bash
pip install chromadb      # 1.5.9, Python 3.9+
npm install chromadb      # 3.5.0
chroma run --path ./chroma-data          # 서버 모드 (기본 8000 포트)
# 또는 docker run -p 8000:8000 chromadb/chroma
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Client | `EphemeralClient`(메모리), `PersistentClient(path=...)`(로컬 파일), `HttpClient`(서버), `CloudClient` |
| Collection | 문서·임베딩·메타데이터·ID 묶음. 이름과 임베딩 함수를 가진다 |
| 임베딩 함수 | 컬렉션에 붙여 텍스트 → 벡터를 자동 처리. 지정하지 않으면 기본 로컬 모델 |
| `add` / `upsert` | `ids` 필수, `documents` 또는 `embeddings`, 선택 `metadatas` |
| `query` | `query_texts` 또는 `query_embeddings`, `n_results`, `where`(메타데이터), `where_document`(본문 조건) |
| 거리 | 컬렉션 설정으로 코사인·L2·내적 중 선택 |

## 기본 사용법
```python
import chromadb

client = chromadb.PersistentClient(path="./chroma-data")
col = client.get_or_create_collection(name="docs")

col.add(
    ids=["d1", "d2"],
    documents=["환불은 구매 후 14일 이내에 가능하다.", "배송은 평균 3일 걸린다."],
    metadatas=[{"topic": "refund"}, {"topic": "shipping"}],
)
res = col.query(query_texts=["반품 기한이 어떻게 돼?"], n_results=1, where={"topic": "refund"})
print(res["documents"][0])
```

서버에 붙을 때는 `chromadb.HttpClient(host="localhost", port=8000)` 로 클라이언트만 바꾼다.

## 자주 쓰는 패턴
- **임베딩 모델 지정**: 한국어 문서는 기본 모델 대신 다국어 임베딩(예: [BGE-M3](/develop-wiki/models/baai/bge-m3/))을 쓰는 임베딩 함수를 컬렉션에 붙이거나, 직접 계산한 `embeddings` 를 넣는다. 조회할 때도 같은 모델을 써야 한다.
- **메타데이터 필터**: `where={"topic": "refund"}`, `where_document={"$contains": "환불"}` 로 후보를 좁힌다.
- **재정렬**: `n_results` 를 넉넉히 받아 크로스 인코더로 재정렬한 뒤 상위 몇 개만 LLM 에 넣는다.
- **ID 설계**: `ids` 를 원본 문서 ID + 청크 번호로 정하면 재색인 때 `upsert` 로 덮어쓰기 쉽고, 문서 삭제 시 관련 청크를 한 번에 지울 수 있다.
- **거리 함수 고정**: 컬렉션을 만들 때 정한 거리 설정은 나중에 바꾸기 어렵다. 임베딩 모델이 권장하는 거리(대개 코사인)로 처음부터 만든다.
- **프로토타입 → 운영**: 노트북에서는 `PersistentClient`, 여러 서비스가 공유하면 서버 모드나 Chroma Cloud 로 옮긴다.
- **프레임워크 연동**: [LangChain](/develop-wiki/ai/agent-framework/langchain/)·[LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/) 에 Chroma 벡터 저장소가 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: RAG 프로토타입·데모·개인 프로젝트처럼 설치 한 줄로 바로 시작해야 할 때, 파이썬·JS 앱에 가볍게 내장할 때.
- 피할 때(대안): 대규모 운영·고급 필터·하이브리드 검색이 필요하면 [Qdrant](/develop-wiki/ai/vector-db/qdrant/)·[Milvus](/develop-wiki/ai/vector-db/milvus/)·[pgvector](/develop-wiki/ai/vector-db/pgvector/). 임베디드 형태에 버전 관리·대용량 컬럼 저장이 필요하면 [LanceDB](/develop-wiki/ai/vector-db/lancedb/).

## 공식 문서
- [문서](https://docs.trychroma.com) · [GitHub](https://github.com/chroma-core/chroma) · [릴리스](https://github.com/chroma-core/chroma/releases)

---
name: Qdrant
url: https://qdrant.tech
docs: https://qdrant.tech/documentation/
repo: https://github.com/qdrant/qdrant
stars: 35676
domain: ai
category: vector-db
description: Rust 로 작성된 오픈소스 벡터 검색 엔진. 페이로드 필터링, 희소·멀티 벡터, 하이브리드 검색, 양자화를 지원한다.
pricing: oss
tags: [vector-search, rust, hybrid-search, filtering]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Qdrant 는 Rust 로 만든 벡터 데이터베이스로, 벡터와 함께 JSON **페이로드**를 저장하고 페이로드 조건으로 필터링하면서 검색하는 데 강하다. 밀집(dense)·희소(sparse)·멀티 벡터(ColBERT 같은 late interaction)를 한 컬렉션에 두고 여러 검색 결과를 서버에서 융합할 수 있다.
라이선스는 Apache-2.0 이다. 최신 서버는 **v1.20.2**(2026-11-16). 관리형 **Qdrant Cloud**(무료 등급 있음)와, 애플리케이션 프로세스 안에서 도는 경량판 **Qdrant Edge** 도 있다.
공식 클라이언트: Python, JavaScript/TypeScript, Rust, Go, .NET, Java. REST(OpenAPI)와 gRPC 를 함께 연다.

## 설치
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant
pip install qdrant-client          # 1.20.0
npm install @qdrant/js-client-rest # 1.20.0
```

6333 은 REST(+ `/dashboard` 웹 UI), 6334 는 gRPC 포트다. 서버 없이 시험할 때는 Python 클라이언트의 로컬 모드(`QdrantClient(":memory:")`, `QdrantClient(path="./db")`)를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Collection | 같은 벡터 설정(차원·거리)을 공유하는 포인트 집합. 이름 붙은 여러 벡터를 둘 수 있다 |
| Point | `id` + 벡터(들) + 페이로드(JSON) |
| 거리 | `Cosine`, `Dot`, `Euclid`, `Manhattan` |
| 페이로드 인덱스 | 필터에 쓰는 필드에 인덱스를 만들어야 필터 검색이 빠르다 |
| `query_points` | 통합 검색 API. 벡터·ID·융합·재정렬 질의를 모두 받는다 |
| 하이브리드 | `prefetch` 로 밀집·희소 검색을 각각 하고 RRF 등으로 융합 |
| 양자화 | 스칼라·이진·곱 양자화로 메모리 절약, 원본은 디스크에 두고 재채점 |
| 멀티테넌시 | 테넌트 ID 페이로드 + 인덱스로 한 컬렉션에 여러 고객 데이터 |

## 기본 사용법
```python
import os
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333", api_key=os.environ.get("QDRANT_API_KEY"))
client.create_collection(
    collection_name="docs",
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
)
client.upsert(collection_name="docs", points=[
    models.PointStruct(id=1, vector=[0.1, 0.9, 0.0, 0.2], payload={"lang": "ko"}),
    models.PointStruct(id=2, vector=[0.8, 0.1, 0.3, 0.0], payload={"lang": "en"}),
])
hits = client.query_points(
    collection_name="docs",
    query=[0.1, 0.8, 0.1, 0.2],
    query_filter=models.Filter(must=[models.FieldCondition(key="lang", match=models.MatchValue(value="ko"))]),
    limit=3,
).points
print([(h.id, h.score) for h in hits])
```

## 자주 쓰는 패턴
- **하이브리드 검색(밀집+희소)**: 컬렉션에 이름 붙은 밀집 벡터와 희소 벡터(BM25·SPLADE 류)를 함께 저장하고, 한 번의 질의로 융합한다.

  ```python
  hits = client.query_points(
      collection_name="docs_hybrid",
      prefetch=[
          models.Prefetch(query=dense_vec, using="dense", limit=20),
          models.Prefetch(query=sparse_vec, using="sparse", limit=20),
      ],
      query=models.FusionQuery(fusion=models.Fusion.RRF),
      limit=5,
  ).points
  ```
- **다단계 재정렬**: 1단계 양자화·작은 벡터로 넓게 찾고, 2단계 원본 벡터나 멀티 벡터(ColBERT)로 재채점하는 구성을 `prefetch` 중첩으로 표현한다.
- **필터 성능**: 필터에 쓰는 페이로드 필드에 `create_payload_index` 로 인덱스를 만든다. 테넌트 필드는 테넌트용 인덱스 옵션을 켠다.
- **임베딩 자동화**: `pip install "qdrant-client[fastembed]"` 를 쓰면 클라이언트가 FastEmbed 로 텍스트를 직접 임베딩한다.
- **대량 적재**: 한 건씩 `upsert` 하지 말고 `upload_points`/`upload_collection` 으로 배치 업로드한다.
- **프레임워크 연동**: [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[Haystack](/develop-wiki/ai/rag-retrieval/haystack/)(`qdrant-haystack`)·[LangChain](/develop-wiki/ai/agent-framework/langchain/) 지원.

## 언제 쓰나 / 피할 때
- 쓸 때: 메타데이터 필터가 많은 RAG·추천, 하이브리드 검색을 서버 쪽에서 처리하고 싶을 때, 단일 바이너리로 가볍게 시작해 클러스터로 확장할 때.
- 피할 때(대안): 이미 Postgres 중심이고 규모가 크지 않으면 [pgvector](/develop-wiki/ai/vector-db/pgvector/) 가 운영 부담이 적다. 레이크하우스·대규모 분산이 핵심이면 [Milvus](/develop-wiki/ai/vector-db/milvus/), 임베디드 파일형이면 [LanceDB](/develop-wiki/ai/vector-db/lancedb/).

## 공식 문서
- [문서](https://qdrant.tech/documentation/) · [Quickstart](https://qdrant.tech/documentation/quickstart/) · [Python 클라이언트](https://github.com/qdrant/qdrant-client)
- [API 레퍼런스](https://api.qdrant.tech/) · [Qdrant Cloud](https://cloud.qdrant.io/) · [Qdrant Edge](https://qdrant.tech/documentation/edge/)

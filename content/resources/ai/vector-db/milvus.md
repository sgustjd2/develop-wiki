---
name: Milvus
url: https://milvus.io
docs: https://milvus.io/docs
repo: https://github.com/milvus-io/milvus
stars: 46725
domain: ai
category: vector-db
description: 대규모 분산 환경을 겨냥한 오픈소스 벡터 데이터베이스. 다양한 ANN 인덱스, BM25 전문 검색, 하이브리드 검색, 레이크하우스 연동을 지원한다.
pricing: oss
tags: [vector-search, distributed, kubernetes, hybrid-search]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Milvus 는 Go·C++ 로 작성된 벡터 데이터베이스로, 컴퓨트와 스토리지를 분리한 쿠버네티스 친화적 분산 구조라 수십억 건 규모까지 수평 확장하는 것을 목표로 한다. HNSW·IVF·DiskANN·SCANN 등 여러 인덱스와 GPU 가속, 스칼라 필드 필터, BM25 기반 전문 검색, 밀집+희소 하이브리드 검색을 제공한다.
LF AI & Data 재단 프로젝트로 Apache-2.0 라이선스이며 Zilliz 가 주 기여사다. 관리형 서비스는 **Zilliz Cloud**.
**3.0**(2026-07-29 정식)에서 레이크 파일을 복사 없이 색인·검색하는 External Collection, 온라인 스키마 추가·백필·삭제, 희소 인덱스 개편(SINDI 등), 패싯 검색, Function Chain 재정렬이 들어왔다. 최신은 **v3.0.6**(2026-11-11)이며 2.6 계열도 패치가 계속 나온다.

## 설치
배포 형태: Milvus Lite(파이썬 내장, 파일 하나), Standalone(Docker 한 대), Distributed(쿠버네티스).

```bash
pip install -U "pymilvus[milvus-lite]"      # pymilvus 3.0.3, milvus-lite 3.2.2

# Standalone (Docker) — 공식 스크립트, 19530 포트
curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o standalone_embed.sh
bash standalone_embed.sh start
```

공식 SDK: Python, Node.js, Java, Go (+ RESTful API). 3.0.0 릴리스 노트가 SDK 버전 대응표를 제공한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Collection / Schema | 필드(기본 키, 벡터, 스칼라, JSON, 배열, StructArray) 정의를 가진 테이블 |
| `MilvusClient` | 고수준 Python 클라이언트. 파일 경로를 주면 Milvus Lite, URI 를 주면 서버 접속 |
| 인덱스 | HNSW, IVF 계열, DiskANN, GPU 인덱스, 희소 인덱스(SINDI 등) |
| 파티션·파티션 키 | 데이터 분할. 파티션 키로 멀티테넌시 구현 |
| 전문 검색 | BM25 함수로 텍스트에서 희소 벡터를 서버가 생성 |
| 하이브리드 검색 | 여러 벡터 필드 검색 결과를 RRF·가중 랭커로 결합 |
| 일관성 수준 | Strong, Bounded, Session, Eventually 중 선택 |

## 기본 사용법
```python
import os
from pymilvus import MilvusClient

# 로컬 파일(Milvus Lite) — 서버면 MilvusClient(uri="http://localhost:19530", token=os.environ.get("MILVUS_TOKEN"))
client = MilvusClient("milvus_demo.db")
client.create_collection(collection_name="docs", dimension=4)   # id + vector 기본 스키마

client.insert(collection_name="docs", data=[
    {"id": 1, "vector": [0.1, 0.9, 0.0, 0.2], "text": "환불 규정", "lang": "ko"},
    {"id": 2, "vector": [0.8, 0.1, 0.3, 0.0], "text": "refund policy", "lang": "en"},
])
res = client.search(
    collection_name="docs",
    data=[[0.1, 0.8, 0.1, 0.2]],
    filter='lang == "ko"',
    limit=3,
    output_fields=["text"],
)
print(res[0])
```

빠른 생성 모드(`dimension` 만 지정)는 동적 필드가 켜져 있어 `text`, `lang` 같은 추가 키를 그대로 저장한다. 운영 환경에서는 스키마와 인덱스를 명시적으로 정의한다.

## 자주 쓰는 패턴
- **개발은 Lite, 운영은 서버**: 같은 `MilvusClient` 코드를 파일 경로 → 서버 URI 로만 바꿔 옮긴다.
- **하이브리드 검색**: 한 컬렉션에 밀집 벡터 필드와 BM25 희소 필드를 두고 `hybrid_search` 로 두 검색을 RRF 로 합친다. [BGE-M3](/develop-wiki/models/baai/bge-m3/) 처럼 밀집·희소를 함께 내는 임베딩과 잘 맞는다.
- **멀티테넌시**: 고객 ID 를 파티션 키로 지정해 한 컬렉션에서 테넌트별로 격리 검색한다.
- **임베딩 모델 교체**: 3.0 의 온라인 필드 추가·백필로 새 벡터 컬럼을 채운 뒤 전환해 다운타임 없이 모델을 바꾼다.
- **프레임워크 연동**: [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[Haystack](/develop-wiki/ai/rag-retrieval/haystack/)·[LangChain](/develop-wiki/ai/agent-framework/langchain/) 지원.

## 언제 쓰나 / 피할 때
- 쓸 때: 수억~수십억 벡터, 높은 QPS, 쿠버네티스 기반 수평 확장이 필요할 때, 레이크하우스 데이터를 그대로 검색하고 싶을 때.
- 피할 때(대안): 수백만 건 이하라면 분산 구성(etcd·오브젝트 스토리지·메시지 큐)의 운영 부담이 크다. [pgvector](/develop-wiki/ai/vector-db/pgvector/)·[Qdrant](/develop-wiki/ai/vector-db/qdrant/)·[LanceDB](/develop-wiki/ai/vector-db/lancedb/) 가 더 단순하다.

## 공식 문서
- [문서](https://milvus.io/docs) · [릴리스 노트](https://milvus.io/docs/release_notes.md) · [하이브리드 검색 튜토리얼](https://milvus.io/docs/hybrid_search_with_milvus.md)
- [전문 검색](https://milvus.io/docs/full-text-search.md) · [멀티테넌시](https://milvus.io/docs/multi_tenancy.md) · [pymilvus](https://github.com/milvus-io/pymilvus)

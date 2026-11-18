---
name: LanceDB
url: https://lancedb.com
docs: https://docs.lancedb.com
repo: https://github.com/lancedb/lancedb
domain: ai
category: vector-db
description: Lance 컬럼 포맷 위에 만든 임베디드 벡터 DB. 서버 없이 로컬 디스크·오브젝트 스토리지에서 벡터·전문·하이브리드 검색을 한다.
pricing: oss
tags: [vector-search, embedded, lance, multimodal, hybrid-search]
languages: [python, typescript, rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
LanceDB 는 애플리케이션 프로세스 안에서 도는 **임베디드** 벡터 데이터베이스로, 데이터는 Lance 컬럼 포맷 파일로 로컬 디스크나 S3 같은 오브젝트 스토리지에 저장된다. SQLite 처럼 서버를 띄우지 않고 경로 하나로 연결하며, 벡터 검색·전문 검색(FTS)·SQL 필터·하이브리드 검색과 자동 버전 관리(테이블 스냅샷)를 제공한다. 이미지·영상 같은 멀티모달 원본과 벡터를 같은 테이블에 두는 용도에도 맞다.
오픈소스 임베디드판은 Apache-2.0 이며, 분산 검색·운영 관리용 **LanceDB Enterprise** 가 상용으로 있다. 최신은 **0.41.0**(2026-10-29, Python·npm 동일 버전). SDK 는 Python, TypeScript, Rust.

## 설치
```bash
pip install lancedb                 # 0.41.0, Python 3.10+
npm install @lancedb/lancedb        # 0.41.0
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `lancedb.connect(uri)` | 로컬 경로, `s3://...` 등 오브젝트 스토리지, 또는 `db://` (Enterprise) |
| Table | Arrow 스키마를 가진 컬럼형 테이블. 리스트·DataFrame·Arrow 로 생성 |
| `search()` | 벡터·FTS·하이브리드 질의 빌더. `.where()`, `.select()`, `.limit()`, `.to_pandas()` |
| 벡터 인덱스 | `create_index` 로 IVF 계열 등 ANN 인덱스. 소량이면 인덱스 없이 전수 검색도 충분 |
| FTS 인덱스 | `create_fts_index("text")` 로 전문 검색 |
| 하이브리드 | `search(query_type="hybrid")` + 리랭커(기본 RRF 등)로 벡터·FTS 결과 결합 |
| 버전 관리 | 쓰기마다 새 버전이 생기고 과거 버전으로 되돌리거나 조회 가능 |

## 기본 사용법
```python
import lancedb

db = lancedb.connect("./lancedb-data")
table = db.create_table(
    "docs",
    data=[
        {"id": 1, "text": "환불은 14일 이내", "vector": [0.1, 0.9, 0.0, 0.2]},
        {"id": 2, "text": "배송은 3일 소요", "vector": [0.8, 0.1, 0.3, 0.0]},
    ],
    mode="overwrite",
)
result = (
    table.search([0.1, 0.8, 0.1, 0.2])
    .select(["id", "text", "_distance"])
    .limit(2)
    .to_pandas()
)
print(result)
```

TypeScript:

```typescript
import * as lancedb from "@lancedb/lancedb";

const db = await lancedb.connect("./lancedb-data");
const table = await db.openTable("docs");
const rows = await table.search([0.1, 0.8, 0.1, 0.2]).limit(2).toArray();
console.log(rows);
```

## 자주 쓰는 패턴
- **하이브리드 검색**: 텍스트 컬럼에 `table.create_fts_index("text")` 를 만든 뒤 `table.search(query_type="hybrid")` 로 벡터와 키워드 검색을 함께 수행하고, 리랭커(`lancedb.rerankers` 의 RRF·크로스 인코더 등)로 합친다.
- **필터 검색**: `.where("lang = 'ko'")` 처럼 SQL 조건을 붙인다. 자주 쓰는 컬럼은 스칼라 인덱스를 만든다.
- **오브젝트 스토리지**: `lancedb.connect("s3://bucket/path")` 로 서버 없이 여러 작업자가 같은 데이터를 읽는다. 동시 쓰기 패턴은 문서의 동시성 안내를 따른다.
- **임베딩 자동화**: 임베딩 함수 레지스트리로 스키마에 임베딩 모델을 연결하면 삽입·검색 시 벡터를 자동 생성한다.
- **분석 연동**: Arrow 기반이라 Pandas·Polars·DuckDB 와 데이터 교환이 쉽다. 프레임워크로는 [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[LangChain](/develop-wiki/ai/agent-framework/langchain/) 연동이 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서버 운영 없이 로컬·데스크톱·배치 파이프라인에서 벡터 검색을 할 때, 멀티모달 학습·평가 데이터와 임베딩을 한곳에 관리할 때, S3 위 대용량 데이터를 저비용으로 검색할 때.
- 피할 때(대안): 많은 클라이언트가 동시에 쓰고 읽는 온라인 서비스라면 서버형 [Qdrant](/develop-wiki/ai/vector-db/qdrant/)·[Milvus](/develop-wiki/ai/vector-db/milvus/) 나 기존 DB 의 [pgvector](/develop-wiki/ai/vector-db/pgvector/). 가벼운 프로토타입만이라면 [Chroma](/develop-wiki/ai/vector-db/chroma/) 도 비교한다.

## 공식 문서
- [문서](https://docs.lancedb.com) · [Quickstart](https://docs.lancedb.com/quickstart) · [Python SDK](https://lancedb.github.io/lancedb/python/python/)
- [TypeScript SDK](https://lancedb.github.io/lancedb/js/globals/) · [Rust SDK](https://docs.rs/lancedb/latest/lancedb/index.html) · [REST API](https://docs.lancedb.com/api-reference/rest)

---
name: pgvector
url: https://github.com/pgvector/pgvector
docs: https://github.com/pgvector/pgvector/blob/master/README.md
repo: https://github.com/pgvector/pgvector
stars: 23778
domain: ai
category: vector-db
description: PostgreSQL 에 vector 자료형과 HNSW·IVFFlat 인덱스를 추가하는 확장. 기존 Postgres 안에서 벡터 검색을 SQL 로 할 때 쓴다.
pricing: oss
tags: [postgresql, extension, hnsw, sql]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
pgvector 는 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 확장으로, 임베딩을 일반 테이블의 컬럼(`vector`)에 저장하고 거리 연산자와 근사 최근접(ANN) 인덱스로 검색하게 해 준다. 벡터가 일반 행과 같은 테이블에 있으니 JOIN·트랜잭션·백업·권한·복제를 Postgres 그대로 쓴다.
라이선스는 PostgreSQL License(OSI 승인)다. 최신 버전은 **0.8.7**(2026-10-01, GitHub 릴리스 없이 태그와 CHANGELOG 로 배포)이며, 다음 0.9.0 에서 Postgres 13·14 지원을 중단할 예정이다(CHANGELOG 의 unreleased 항목). Postgres 13 이상을 지원한다.
관리형 Postgres 서비스 대부분이 pgvector 를 확장으로 제공한다. 수억 건 이상·전용 분산 구조가 필요하면 [Milvus](/develop-wiki/ai/vector-db/milvus/)·[Qdrant](/develop-wiki/ai/vector-db/qdrant/) 같은 전용 엔진을 비교한다.

## 설치
Docker (공식 Postgres 이미지에 pgvector 를 더한 이미지):

```bash
docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD="$PGPASSWORD" pgvector/pgvector:pg18
```

소스 빌드(Linux·Mac):

```bash
git clone --branch v0.8.7 https://github.com/pgvector/pgvector.git
cd pgvector && make && sudo make install
```

DB 마다 한 번 확장을 켠다: `CREATE EXTENSION vector;`

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `vector(n)` | 단정밀도 벡터. HNSW 인덱스는 2,000 차원까지 |
| `halfvec(n)` | 반정밀도. 인덱스 4,000 차원까지, 저장 공간 절반 |
| `sparsevec` / `bit` | 희소 벡터(0 아닌 원소 1,000개까지), 이진 벡터(해밍·자카드) |
| 거리 연산자 | `<->` L2, `<#>` 음의 내적, `<=>` 코사인 거리, `<+>` L1 |
| HNSW | 그래프 기반 인덱스. 검색 품질·속도 좋고 빌드가 느리며 메모리 많이 씀. `m`, `ef_construction`, 쿼리 시 `hnsw.ef_search` |
| IVFFlat | 클러스터 기반 인덱스. 빌드 빠르고 메모리 적음. 데이터 적재 후 생성, `lists`, 쿼리 시 `ivfflat.probes` |
| 반복 인덱스 스캔 | 0.8.0+. 필터 때문에 결과가 모자라면 인덱스를 더 훑는다(`hnsw.iterative_scan`) |

## 기본 사용법
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE docs (
  id bigserial PRIMARY KEY,
  category_id int,
  content text,
  embedding vector(1024)          -- 임베딩 모델 차원과 같게
);

CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);

-- 코사인 거리 기준 상위 5개 (:q 는 애플리케이션에서 넘기는 쿼리 벡터)
SELECT id, content, 1 - (embedding <=> :q) AS similarity
FROM docs
WHERE category_id = 3
ORDER BY embedding <=> :q
LIMIT 5;
```

Python(psycopg 3 + `pgvector` 패키지 0.5.1):

```python
import os
import numpy as np
import psycopg
from pgvector.psycopg import register_vector

with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
    register_vector(conn)
    q = np.random.rand(1024).astype(np.float32)   # 실제로는 임베딩 모델 출력
    rows = conn.execute(
        "SELECT id, content FROM docs ORDER BY embedding <=> %s LIMIT 5", (q,)
    ).fetchall()
    print(rows)
```

## 자주 쓰는 패턴
- **연산자와 인덱스 짝 맞추기**: 코사인 검색(`<=>`)이면 `vector_cosine_ops`, 내적이면 `vector_ip_ops`. 맞지 않으면 인덱스를 타지 않는다. `EXPLAIN` 으로 확인한다.
- **필터 + 벡터 검색**: ANN 인덱스는 필터를 스캔 *뒤에* 적용하므로 결과가 모자랄 수 있다. `SET hnsw.iterative_scan = relaxed_order;` 를 켜거나, 자주 쓰는 필터는 부분 인덱스(`WHERE category_id = 3`)·파티셔닝으로 나눈다.
- **하이브리드 검색**: Postgres 전문 검색(`tsvector`, `ts_rank_cd`) 결과와 벡터 결과를 RRF(Reciprocal Rank Fusion)로 합치거나, 상위 후보를 크로스 인코더로 재정렬한다. 한국어 전문 검색은 형태소 분석 확장이 따로 필요하다.
- **빌드 속도**: HNSW 빌드 전 `maintenance_work_mem` 을 키우고 병렬 워커(`max_parallel_maintenance_workers`)를 늘린다. 대량 적재 후 인덱스를 만드는 편이 빠르다.
- **비용 절감**: `halfvec` 로 저장하거나 `(embedding::halfvec(1024))` 식 인덱스를 써서 메모리를 줄인다.
- **프레임워크 연동**: [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[Haystack](/develop-wiki/ai/rag-retrieval/haystack/)(`pgvector-haystack`)·[LangChain](/develop-wiki/ai/agent-framework/langchain/) 모두 pgvector 저장소를 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Postgres 를 운영 중이고 수백만~수천만 벡터 규모의 RAG·추천을 붙일 때, 벡터와 관계형 데이터를 한 트랜잭션·JOIN 으로 다뤄야 할 때.
- 피할 때(대안): 수억 건 이상, 샤딩·전용 양자화·멀티 벡터가 필요하면 [Milvus](/develop-wiki/ai/vector-db/milvus/)·[Qdrant](/develop-wiki/ai/vector-db/qdrant/). DB 서버 없이 파일로 끝내려면 [LanceDB](/develop-wiki/ai/vector-db/lancedb/)·[Chroma](/develop-wiki/ai/vector-db/chroma/).

## 공식 문서
- [README(설치·인덱스·필터링)](https://github.com/pgvector/pgvector/blob/master/README.md) · [CHANGELOG](https://github.com/pgvector/pgvector/blob/master/CHANGELOG.md) · [Docker 이미지](https://hub.docker.com/r/pgvector/pgvector)
- [pgvector-python](https://github.com/pgvector/pgvector-python) · [하이브리드 검색 예제(RRF)](https://github.com/pgvector/pgvector-python/blob/master/examples/hybrid_search/rrf.py)

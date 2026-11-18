---
name: Weaviate
url: https://weaviate.io
docs: https://docs.weaviate.io/weaviate
repo: https://github.com/weaviate/weaviate
domain: ai
category: vector-db
description: Go 로 작성된 벡터 데이터베이스. 임베딩 모델 연동 모듈, BM25+벡터 하이브리드 검색, 멀티테넌시를 내장한다. 코어는 BSD-3, 일부 엔터프라이즈 기능은 별도 라이선스.
pricing: oss
tags: [vector-search, hybrid-search, multi-tenancy, go]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Weaviate 는 객체(JSON 속성)와 벡터를 함께 저장하는 벡터 데이터베이스다. 임베딩 모델 공급자(OpenAI, Cohere, Ollama 등)와 연결하는 **벡터라이저 모듈**이 내장돼 있어, 텍스트만 넣어도 서버가 임베딩을 만들고 `near_text` 로 검색할 수 있다. BM25 와 벡터 검색을 한 번에 섞는 하이브리드 검색, 테넌트별 샤드 격리, 생성형(RAG) 질의도 기본 기능이다.
최신 서버는 **v1.40.5**(2026-11-10). 관리형 **Weaviate Cloud** 가 있다. 공식 클라이언트는 Python(v4), TypeScript, Go, Java 등.

**라이선스 주의(2026-11 확인)**: 저장소의 `LICENSE` 는 혼합 구조다. `wl` 디렉터리 **밖**의 코드는 BSD-3-Clause(OSI 오픈소스)이고, `wl` 디렉터리 **안**의 코드(백업 중복 제거, DB 사용자, 네임스페이스, 자가 복구 등 엔터프라이즈 기능)는 Weaviate BV 의 별도 엔터프라이즈 라이선스로만 쓸 수 있으며 라이선스 키로 활성화된다. 코어 데이터베이스는 오픈소스로 쓸 수 있으므로 이 사이트에서는 `oss` 로 분류하되, 해당 기능이 필요하면 상용 계약이 필요하다.

## 설치
공식 빠른 시작은 Docker Compose 를 쓴다(REST 8080, gRPC 50051 포트를 연다).

```bash
docker compose up -d            # 문서의 docker-compose.yml 사용
pip install -U weaviate-client  # 4.24.1
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Collection | 속성 스키마 + 벡터 설정을 가진 객체 집합(예전 명칭 class) |
| Object | 속성(JSON) + 하나 이상의 이름 붙은 벡터 + UUID |
| 벡터 설정 | `Configure.Vectors.self_provided()`(직접 넣기) 또는 `text2vec_*` 모듈(서버가 임베딩) |
| `near_vector` / `near_text` | 벡터 / 텍스트 기반 유사도 검색 |
| `hybrid` | BM25 + 벡터 점수 융합. `alpha` 로 비중 조절(0 이면 키워드, 1 이면 벡터) |
| 멀티테넌시 | 컬렉션 안에서 테넌트마다 별도 샤드. 비활성 테넌트를 내려 메모리 절약 |
| 생성 검색 | 검색 결과를 LLM 에 넘겨 답을 만드는 generative 모듈 |

## 기본 사용법
```python
import weaviate
from weaviate.classes.config import Configure, Property, DataType

with weaviate.connect_to_local() as client:          # localhost:8080 / 50051
    docs = client.collections.create(
        name="Doc",
        properties=[Property(name="text", data_type=DataType.TEXT)],
        vector_config=Configure.Vectors.self_provided(),
    )
    docs.data.insert(properties={"text": "환불은 14일 이내"}, vector=[0.1, 0.9, 0.0, 0.2])
    docs.data.insert(properties={"text": "배송은 3일 소요"}, vector=[0.8, 0.1, 0.3, 0.0])

    res = docs.query.near_vector(near_vector=[0.1, 0.8, 0.1, 0.2], limit=2)
    for o in res.objects:
        print(o.properties["text"])
```

## 자주 쓰는 패턴
- **하이브리드 검색**: `docs.query.hybrid(query="환불 기한", vector=qvec, alpha=0.5, limit=5)` 처럼 키워드와 벡터를 함께 쓴다. 제품명·코드처럼 정확한 단어가 중요한 질의는 `alpha` 를 낮춘다.
- **서버 측 임베딩**: `Configure.Vectors.text2vec_ollama(...)` 같은 모듈을 쓰면 애플리케이션에서 임베딩 코드를 없앨 수 있다. 대신 모델 교체 시 재색인이 필요하다.
- **대량 적재**: 한 건씩 `insert` 대신 `data.insert_many`·배치·`data.ingest` 로 넣는다.
- **멀티테넌시**: SaaS 처럼 고객별 데이터를 격리할 때 컬렉션에 멀티테넌시를 켜고 테넌트별로 `with_tenant()` 핸들을 쓴다.
- **프레임워크 연동**: [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[Haystack](/develop-wiki/ai/rag-retrieval/haystack/)·[LangChain](/develop-wiki/ai/agent-framework/langchain/) 지원.

## 언제 쓰나 / 피할 때
- 쓸 때: 하이브리드 검색과 서버 측 임베딩을 기본 기능으로 쓰고 싶을 때, 테넌트가 많은 SaaS 형 RAG.
- 피할 때(대안): 라이선스를 순수 OSI 오픈소스로만 맞춰야 하는데 `wl` 기능이 필요하다면 [Qdrant](/develop-wiki/ai/vector-db/qdrant/)·[Milvus](/develop-wiki/ai/vector-db/milvus/)(Apache-2.0)를 비교한다. 기존 Postgres 를 쓰면 [pgvector](/develop-wiki/ai/vector-db/pgvector/).

## 공식 문서
- [문서](https://docs.weaviate.io/weaviate) · [로컬 빠른 시작](https://docs.weaviate.io/weaviate/quickstart/local) · [Python 클라이언트](https://github.com/weaviate/weaviate-python-client)
- [LICENSE](https://github.com/weaviate/weaviate/blob/main/LICENSE) · [엔터프라이즈 에디션](http://weaviate.io/enterprise-edition)

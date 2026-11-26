---
name: Elasticsearch
url: https://www.elastic.co/elasticsearch
docs: https://www.elastic.co/docs
repo: https://github.com/elastic/elasticsearch
stars: 78840
domain: backend
category: database
description: Lucene 기반 분산 검색·분석 엔진. 전문 검색, 로그 분석, 벡터 검색에 쓴다. 소스는 AGPLv3·SSPL·ELv2 중 택일이고, Apache-2.0 포크로 OpenSearch 가 있다.
pricing: oss
tags: [search, full-text, nosql, lucene, opensearch]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
검색 엔진형 데이터베이스. JSON 문서를 저장하면 Apache Lucene 역색인(inverted index)을 만들어 텍스트 관련도 검색, 필터·집계, 벡터(kNN) 검색을 제공한다. 데이터는 인덱스 → 샤드로 나뉘어 여러 노드에 분산된다. REST API(JSON)로 다루며, 시각화 도구 Kibana 와 함께 로그·관측성 스택(ELK)으로 많이 쓰인다. 2026-11 기준 최신 릴리스는 9.5.x.

## 라이선스와 OpenSearch
- 2021년 Apache-2.0 에서 SSPL / Elastic License 2.0(ELv2) 이중 라이선스로 바뀌었고, 2024년에 **AGPLv3 가 선택지로 추가**되었다. 현재 소스 기본 라이선스는 AGPLv3·SSPL·ELv2 중 택일(일부 x-pack 코드는 ELv2 전용).
- Elastic 이 배포하는 기본 바이너리·이미지는 Elastic License 로 제공된다(무료 기본 기능 + 유료 구독 기능).
- **OpenSearch**: 라이선스 변경 직전 Elasticsearch 7.10.2 에서 갈라진 포크. Linux Foundation 산하 OpenSearch Software Foundation 이 관리하고 Apache-2.0 이다(2026-11 기준 3.10). Query DSL 의 기본 형태는 비슷하지만 버전이 갈라진 뒤 API·클라이언트·기능(보안, 벡터 검색 구현)이 달라졌으므로 서로의 클라이언트를 섞어 쓰지 않는다.

## 설치·실행
```bash
curl -fsSL https://elastic.co/start-local | sh -s -- --esonly   # 로컬 개발용 (Docker Compose)
cd elastic-start-local && source .env
curl $ES_LOCAL_URL -H "Authorization: ApiKey ${ES_LOCAL_API_KEY}"
```
- `--esonly` 를 빼면 Kibana(http://localhost:5601)까지 설치된다. Elasticsearch 는 http://localhost:9200.
- 비밀번호(`ES_LOCAL_PASSWORD`)와 API 키는 `.env` 에 생성된다. 운영용 보안 설정이 아니므로 로컬 개발에만 쓴다. 중지·시작은 `./stop.sh` / `./start.sh`.

## 데이터 모델
클러스터 → 인덱스 → 문서(JSON, `_id`). 인덱스는 프라이머리 샤드와 복제 샤드로 나뉜다. 필드 타입은 **매핑(mapping)** 으로 정한다.

| 타입 | 용도 |
| --- | --- |
| `text` | 분석기(analyzer)로 토큰화되는 전문 검색 필드 |
| `keyword` | 정확 일치·정렬·집계용 |
| `long`, `double`, `date`, `boolean` | 수치·날짜 필터 |
| `dense_vector` | 벡터 kNN 검색 |
| `nested`, `object` | 하위 문서 |

한국어 형태소 분석은 공식 플러그인 `analysis-nori` 를 쓴다.

## 기본 사용법 (CRUD)
```text
PUT /products
{ "mappings": { "properties": {
    "name":  { "type": "text" },
    "brand": { "type": "keyword" },
    "price": { "type": "double" } } } }

PUT  /products/_doc/1  { "name": "무선 기계식 키보드", "brand": "acme", "price": 89000 }
GET  /products/_doc/1
POST /products/_update/1  { "doc": { "price": 79000 } }
DELETE /products/_doc/1

POST /products/_search
{ "query": { "bool": {
    "must":   [ { "match": { "name": "키보드" } } ],
    "filter": [ { "term": { "brand": "acme" } }, { "range": { "price": { "lte": 100000 } } } ] } },
  "aggs": { "by_brand": { "terms": { "field": "brand" } } } }
```
대량 적재는 `_bulk` API 를 쓴다. ES|QL(`POST /_query`) 같은 파이프 형식 질의 언어도 있다.

## 인덱스·쿼리 성능
- 모든 필드가 기본으로 색인된다. 검색에 안 쓰는 필드는 매핑에서 `"index": false` 로 꺼서 용량을 줄인다.
- 관련도 점수가 필요 없는 조건은 `filter` 절에 넣는다(점수 계산 생략, 캐시 가능).
- 쿼리 분석: 요청에 `"profile": true`, 느린 쿼리는 search slow log.
- 샤드는 너무 많지도 작지도 않게 잡는다. 시간 단위로 쌓이는 로그는 데이터 스트림 + ILM(인덱스 수명 주기 관리)으로 롤오버한다.

## 트랜잭션·일관성
- 단일 문서 쓰기는 원자적이지만 여러 문서에 걸친 트랜잭션은 없다. 동시 수정은 `if_seq_no`/`if_primary_term` 낙관적 동시성 제어로 막는다.
- **준실시간(near real-time)**: 색인한 문서는 refresh(기본 1초) 뒤에 검색된다. ID 로 `GET` 하는 것은 즉시 가능.
- 원본 데이터 저장소라기보다 다른 DB 의 데이터를 색인해 두는 보조 저장소로 두는 구성이 일반적이다.

## 애플리케이션 연동
| 언어 | 공식 클라이언트 |
| --- | --- |
| TypeScript | `@elastic/elasticsearch` |
| Python | `elasticsearch` |
| Go | `github.com/elastic/go-elasticsearch/v9` |
| Java | Elasticsearch Java API Client |

```ts
// npm install @elastic/elasticsearch
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: 'http://localhost:9200',
  auth: { apiKey: process.env.ES_LOCAL_API_KEY! },
});
await client.index({ index: 'products', id: '1', document: { name: '무선 키보드', price: 89000 } });
await client.indices.refresh({ index: 'products' });
const res = await client.search({ index: 'products', query: { match: { name: '키보드' } } });
console.log(res.hits.hits);
```
클라이언트 메이저 버전은 서버 메이저 버전에 맞춘다(9.x 서버 → 9.x 클라이언트).

## 운영 팁
- 백업: 스냅샷 API(`_snapshot`)로 S3·파일 시스템 저장소에 증분 백업. 데이터 디렉터리 복사는 쓰지 않는다.
- 지표: 클러스터 상태(`GET _cluster/health` 의 green/yellow/red), JVM 힙 사용률, 샤드 수, 디스크 워터마크, 검색·색인 지연.
- 함정: 동적 매핑에 맡겨 필드가 폭증하는 매핑 폭발, 너무 많은 작은 샤드, 매핑 변경 시 재색인 필요(`_reindex` + alias 전환).

## 언제 쓰나 / 피할 때
- 쓸 때: 상품·문서 전문 검색, 자동완성, 로그·이벤트 검색과 분석, 하이브리드(키워드 + 벡터) 검색.
- 피할 때(대안): 원본 트랜잭션 데이터 → [PostgreSQL](/develop-wiki/backend/database/postgresql/), 정형 대용량 집계 위주 → [ClickHouse](/develop-wiki/backend/database/clickhouse/), Apache-2.0 라이선스가 필요하면 OpenSearch.

## 공식 문서
- [Elastic 문서](https://www.elastic.co/docs) · [로컬 설치(start-local)](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/local-development-installation-quickstart) · [JavaScript 클라이언트](https://www.elastic.co/docs/reference/elasticsearch/clients/javascript/getting-started) · [라이선스 FAQ](https://www.elastic.co/pricing/faq/licensing) · [LICENSE.txt](https://github.com/elastic/elasticsearch/blob/main/LICENSE.txt) · [OpenSearch 문서](https://docs.opensearch.org/latest/)

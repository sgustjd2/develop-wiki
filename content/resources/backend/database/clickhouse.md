---
name: ClickHouse
url: https://clickhouse.com
docs: https://clickhouse.com/docs
repo: https://github.com/ClickHouse/ClickHouse
stars: 51196
domain: backend
category: database
description: 대용량 실시간 분석용 컬럼형 OLAP DB(Apache-2.0). 로그·이벤트·지표 데이터를 빠르게 집계할 때 쓴다.
pricing: oss
tags: [olap, sql, columnar, analytics]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
컬럼형(columnar) 분석 데이터베이스 서버. 데이터를 컬럼별로 압축 저장하고 벡터화 실행으로 수십억 행 집계를 빠르게 처리한다. 대량 삽입·대량 집계에 맞춰져 있고, 행 단위 잦은 수정이나 점 조회 트랜잭션은 약하다. 단일 서버부터 샤딩·복제 클러스터까지 확장하며, 매니지드 서비스로 ClickHouse Cloud 가 있다. 버전은 `YY.M` 형식(2026-11 기준 26.x).

## 설치·실행
```bash
docker run -d --name ch -p 8123:8123 -p 9000:9000 \
  -e CLICKHOUSE_PASSWORD=secret --ulimit nofile=262144:262144 \
  clickhouse/clickhouse-server
docker exec -it ch clickhouse-client       # 공식 CLI (네이티브 프로토콜 9000)
```
- 8123: HTTP 인터페이스(`curl` 로도 쿼리 가능), 9000: 네이티브 TCP.
- Docker 이미지는 비밀번호(`CLICKHOUSE_PASSWORD`)나 사용자를 지정하지 않으면 `default` 사용자의 네트워크 접근을 막는다.

## 데이터 모델
데이터베이스 → 테이블. 테이블마다 **테이블 엔진**을 고르며, 기본은 MergeTree 계열이다.

| 엔진 | 용도 |
| --- | --- |
| `MergeTree` | 기본. 정렬 키 순으로 파트(part)를 쌓고 백그라운드 병합 |
| `ReplacingMergeTree` | 같은 정렬 키 행을 병합 때 최신 버전만 남김(upsert 대용) |
| `SummingMergeTree` / `AggregatingMergeTree` | 병합 때 미리 집계 |
| `Replicated*MergeTree` | 클러스터 복제 |

주요 자료형: `UInt8~UInt64`, `Int*`, `Float64`, `Decimal`, `String`, `LowCardinality(String)`, `DateTime64`, `Array(T)`, `Map(K,V)`, `Nullable(T)`(필요할 때만), `JSON`.

## 기본 사용법 (CRUD)
```sql
CREATE TABLE events (
  ts      DateTime64(3) DEFAULT now64(),
  user_id UInt64,
  event   LowCardinality(String),
  amount  Float64
) ENGINE = MergeTree
ORDER BY (event, ts);

INSERT INTO events VALUES (now64(), 1, 'purchase', 12.5), (now64(), 2, 'view', 0);

SELECT event, count() AS n, sum(amount) AS revenue
FROM events
WHERE ts >= now() - INTERVAL 1 DAY
GROUP BY event ORDER BY n DESC;

ALTER TABLE events UPDATE amount = 0 WHERE user_id = 2;   -- 비동기 mutation
DELETE FROM events WHERE user_id = 2;                     -- lightweight delete
```
수정·삭제는 무거운 작업이므로 일상적으로 쓰지 않고, 변경은 새 행 삽입 + `ReplacingMergeTree` 로 처리하는 경우가 많다.

## 인덱스·쿼리 성능
- **정렬 키(`ORDER BY`)가 곧 기본 인덱스(sparse primary index)** 다. 자주 거르는 컬럼, 카디널리티가 낮은 컬럼을 앞에 둔다. 나중에 바꾸기 어렵다.
- `PARTITION BY toYYYYMM(ts)` 같은 파티션은 데이터 수명 관리(TTL, 파티션 삭제)용으로 쓰고 너무 잘게 나누지 않는다.
- 보조 인덱스는 data skipping index(`minmax`, `set`, `bloom_filter`), 미리 계산은 projection·materialized view.
- 실행 계획: `EXPLAIN indexes = 1 SELECT ...` 로 읽는 파트·그래뉼 수를 확인. 실행 기록은 `system.query_log`.

## 트랜잭션·일관성
- 일반적인 ACID 다중 문장 트랜잭션은 기본 기능이 아니다. 하나의 `INSERT` 블록 단위로 원자적으로 기록된다.
- 복제는 `Replicated*MergeTree` + ClickHouse Keeper(ZooKeeper 호환)로 하며 비동기 복제가 기본이다.
- 작은 `INSERT` 를 자주 보내면 파트가 많아져 "Too many parts" 오류가 난다. 배치로 모아 보낸다. 26.3 이후로는 `async_insert` 가 기본으로 켜져 있어 서버가 작은 INSERT 를 모아 기록하므로, 이 설정을 끄지 않았는지 확인한다.

## 애플리케이션 연동
| 언어 | 공식 클라이언트 |
| --- | --- |
| TypeScript | `@clickhouse/client` |
| Python | `clickhouse-connect` |
| Go | `github.com/ClickHouse/clickhouse-go/v2` |
| Java | `clickhouse-java`(클라이언트·JDBC) |

```python
# pip install clickhouse-connect
import clickhouse_connect

client = clickhouse_connect.get_client(host="localhost", port=8123,
                                       username="default", password="secret")
client.insert("events", [[1, "view", 0.0]], column_names=["user_id", "event", "amount"])
result = client.query(
    "SELECT event, count() FROM events WHERE user_id = {uid:UInt64} GROUP BY event",
    parameters={"uid": 1},
)
print(result.result_rows)
```

## 운영 팁
- 백업: `BACKUP TABLE db.events TO Disk('backups', 'events.zip')` / `RESTORE`, 또는 S3 대상 백업.
- 지표: `system.parts`(파트 수), `system.merges`, `system.mutations`, `system.query_log`, 복제 지연(`system.replicas`).
- 함정: 잦은 소량 INSERT, 잘못 고른 정렬 키, 높은 카디널리티 컬럼으로 파티션 나누기, 불필요한 `Nullable`. 해시 조인은 한쪽 테이블을 메모리에 올린다. 24.12 부터 `query_plan_join_swap_table=auto` 로 옵티마이저가 작은 쪽을 고르지만, 통계가 부족할 때를 대비해 작은 테이블을 오른쪽에 두는 편이 안전하다.

## 언제 쓰나 / 피할 때
- 쓸 때: 로그·이벤트·클릭스트림 분석, 실시간 대시보드, 관측성 데이터 저장, 시계열 집계.
- 피할 때(대안): 행 단위 수정·트랜잭션이 많은 OLTP → [PostgreSQL](/develop-wiki/backend/database/postgresql/), 단일 머신 로컬 분석 → [DuckDB](/develop-wiki/backend/database/duckdb/), 텍스트 관련도 검색 → [Elasticsearch](/develop-wiki/backend/database/elasticsearch/).

## 공식 문서
- [문서](https://clickhouse.com/docs) · [설치](https://clickhouse.com/docs/install) · [Docker](https://clickhouse.com/docs/get-started/setup/self-managed/docker) · [MergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree) · [Python 클라이언트](https://clickhouse.com/docs/integrations/python) · [GitHub 릴리스](https://github.com/ClickHouse/ClickHouse/releases)

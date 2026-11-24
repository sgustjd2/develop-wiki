---
name: Apache Cassandra
url: https://cassandra.apache.org
docs: https://cassandra.apache.org/doc/latest/
repo: https://github.com/apache/cassandra
stars: 10156
domain: backend
category: database
description: 마스터 없는 분산 wide-column DB(Apache-2.0). 여러 데이터센터에 걸친 대량 쓰기와 고가용성이 필요할 때 쓴다.
pricing: oss
tags: [nosql, wide-column, distributed, cql]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
분산 wide-column 데이터베이스. 모든 노드가 동등한(masterless) 링 구조로, 파티션 키 해시에 따라 데이터를 노드에 나누고 여러 복제본에 저장한다. LSM 트리 기반이라 쓰기가 빠르고, 노드를 추가해 선형으로 확장하며, 데이터센터 단위 장애에도 서비스를 이어 간다. 질의 언어는 SQL 과 비슷한 CQL 이지만 조인·임의 조건 검색은 없다. 2026-11 기준 최신 GA 는 5.0.9(4.1.x, 4.0.x 도 유지보수 중).

호환 대안인 ScyllaDB(C++ 재구현)는 현재 ScyllaDB Source Available License 로 배포되어 오픈소스 라이선스가 아니다.

## 설치·실행
```bash
docker run --name cassandra -p 9042:9042 -d cassandra:5.0
docker exec -it cassandra cqlsh            # 기동에 수십 초 걸린다
```

| cqlsh 명령 | 뜻 |
| --- | --- |
| `DESCRIBE KEYSPACES` | 키스페이스 목록 |
| `DESCRIBE TABLE app.events` | 테이블 DDL |
| `TRACING ON` | 쿼리 추적 |
| `CONSISTENCY QUORUM` | 세션 일관성 수준 |

## 데이터 모델
키스페이스(복제 설정 단위) → 테이블 → 파티션 → 행. **기본 키 = 파티션 키 + 클러스터링 키**.
- 파티션 키: 어느 노드에 저장할지 결정. 한 파티션은 한 번에 읽힌다.
- 클러스터링 키: 파티션 안의 정렬 순서.
- 설계 원칙은 **쿼리마다 테이블을 하나씩**(query-first). 같은 데이터를 다른 키로 중복 저장(비정규화)하는 것이 정상이다.

주요 자료형: `text`, `int`, `bigint`, `uuid`, `timeuuid`, `timestamp`, `boolean`, 컬렉션 `list`/`set`/`map`, `vector<float, n>`(5.0).

## 기본 사용법 (CRUD)
```sql
CREATE KEYSPACE app WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
USE app;
CREATE TABLE events_by_user (
  user_id uuid,
  ts      timestamp,
  event   text,
  PRIMARY KEY ((user_id), ts)
) WITH CLUSTERING ORDER BY (ts DESC);

INSERT INTO events_by_user (user_id, ts, event)
VALUES (5b6962dd-3f90-4c93-8f61-eabfa4a803e2, toTimestamp(now()), 'login') USING TTL 86400;
SELECT * FROM events_by_user WHERE user_id = 5b6962dd-3f90-4c93-8f61-eabfa4a803e2 LIMIT 20;
UPDATE events_by_user SET event = 'logout'
  WHERE user_id = 5b6962dd-3f90-4c93-8f61-eabfa4a803e2 AND ts = '2026-11-18 00:00:00+0000';
DELETE FROM events_by_user WHERE user_id = 5b6962dd-3f90-4c93-8f61-eabfa4a803e2;
```
`INSERT` 와 `UPDATE` 는 모두 upsert 로 동작한다. 운영 환경 키스페이스는 `NetworkTopologyStrategy` 를 쓴다.

## 인덱스·쿼리 성능
- `WHERE` 는 기본적으로 파티션 키 전체 + 클러스터링 키 앞부분만 쓸 수 있다. 그 밖의 조건은 별도 테이블로 해결한다.
- 보조 인덱스는 5.0 의 SAI(Storage-Attached Index, `CREATE INDEX ... USING 'sai'`)가 권장되며 벡터 검색에도 쓰인다.
- `ALLOW FILTERING` 은 전체 스캔이 될 수 있어 운영 쿼리에서 피한다.
- 파티션 하나가 너무 커지지 않게(시간 버킷을 파티션 키에 포함 등) 설계한다. 진단은 `TRACING ON`, `nodetool tablestats`.

## 트랜잭션·일관성
- **조정 가능한 일관성(tunable consistency)**: 요청마다 `ONE`, `QUORUM`, `LOCAL_QUORUM`, `ALL` 등을 고른다. 읽기 + 쓰기 복제본 수가 복제 계수보다 크면(R + W > RF) 최신 값을 읽는다.
- 같은 파티션에 대한 쓰기는 원자적·격리적이다. 조건부 쓰기(`IF NOT EXISTS`, `IF col = ...`)는 Paxos 기반 경량 트랜잭션(LWT)으로 처리되며 느리다.
- 여러 테이블에 함께 쓰는 `BATCH` 는 원자성 보장용이지 성능 최적화용이 아니다.
- 충돌은 타임스탬프 기준 마지막 쓰기 우선(last-write-wins).

## 애플리케이션 연동
| 언어 | 드라이버 |
| --- | --- |
| Java | Apache Cassandra Java Driver / Spring Data Cassandra |
| Python | `cassandra-driver` (apache/cassandra-python-driver) |
| Go | `github.com/apache/cassandra-gocql-driver/v2` |
| TypeScript | `cassandra-driver` |

```python
# pip install cassandra-driver
import uuid
from datetime import datetime, timezone
from cassandra.cluster import Cluster

cluster = Cluster(["127.0.0.1"])
session = cluster.connect("app")
insert = session.prepare("INSERT INTO events_by_user (user_id, ts, event) VALUES (?, ?, ?)")
uid = uuid.uuid4()
session.execute(insert, (uid, datetime.now(timezone.utc), "login"))
for row in session.execute("SELECT ts, event FROM events_by_user WHERE user_id = %s", (uid,)):
    print(row.ts, row.event)
cluster.shutdown()
```

## 운영 팁
- 백업: `nodetool snapshot`(노드별 SSTable 하드 링크) + 증분 백업. 복구는 노드별로 해야 하므로 절차를 미리 연습한다.
- 정기 `nodetool repair` 로 복제본 불일치를 맞춘다. 삭제는 tombstone 으로 남으므로 대량 삭제·큐 형태 사용을 피한다.
- 지표: 읽기·쓰기 지연(p99), pending compactions, tombstone 경고, 힙/GC, 노드 상태(`nodetool status`).

## 언제 쓰나 / 피할 때
- 쓸 때: 시계열·이벤트·메시지처럼 쓰기가 매우 많고 접근 패턴이 정해진 데이터, 멀티 리전 무중단이 필요한 서비스.
- 피할 때(대안): 조인·애드혹 쿼리·강한 트랜잭션 → [PostgreSQL](/develop-wiki/backend/database/postgresql/), 분석 집계 → [ClickHouse](/develop-wiki/backend/database/clickhouse/), 데이터가 단일 서버에 들어가는 규모라면 운영 비용이 과하다.

## 공식 문서
- [문서(latest)](https://cassandra.apache.org/doc/latest/) · [다운로드·지원 버전](https://cassandra.apache.org/_/download.html) · [Quickstart](https://cassandra.apache.org/_/quickstart.html) · [CQL 레퍼런스](https://cassandra.apache.org/doc/latest/cassandra/developing/cql/index.html) · [데이터 모델링](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/index.html)

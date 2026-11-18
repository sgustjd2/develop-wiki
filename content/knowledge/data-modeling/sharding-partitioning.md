---
title: 샤딩과 파티셔닝
aka: [Sharding, Partitioning, Horizontal Partitioning, Shard Key, Partition Key, 수평 분할]
category: data-modeling
level: advanced
summary: 큰 테이블을 한 DB 안에서 나누는 파티셔닝과, 데이터를 여러 DB 서버로 나누는 샤딩의 차이, 키 선택법, 그리고 되돌리기 어려운 비용.
tags: [rdbms, scalability, sharding, partitioning, postgresql, consistent-hashing]
related: [data-modeling/primary-key-design, data-modeling/normalization, data-modeling/index-design, distributed-systems/saga, architecture/cqrs]
sources:
  - https://www.postgresql.org/docs/current/ddl-partitioning.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding
updatedAt: 2026-11-18
---

## 문제

데이터가 커지면 한 테이블의 인덱스가 메모리에 안 들어가고, 오래된 데이터를 지우는 대량 `DELETE` 가 서비스를 흔든다. 더 커지면 서버 한 대의 디스크·CPU·쓰기 처리량 자체가 한계에 닿는다.

## 해법

| | 파티셔닝 | 샤딩 |
| --- | --- | --- |
| 나누는 단위 | 한 DB 안의 테이블 | 여러 DB 인스턴스(노드) |
| 라우팅 | DB 가 자동 (파티션 프루닝) | 애플리케이션·프록시·분산 DB 가 담당 |
| 트랜잭션·조인 | 그대로 됨 | 샤드를 넘으면 어렵거나 불가 |
| 해결하는 것 | 인덱스 지역성, 오래된 데이터 정리, 스캔 범위 | 단일 서버 용량·쓰기 처리량·지역 규제 |
| 복잡도 | 낮음~중간 | 높고, 시스템 수명 내내 계속됨 |

### 파티셔닝 (PostgreSQL 선언적 파티셔닝)

| 방식 | 예 | 맞는 곳 |
| --- | --- | --- |
| Range | 월별 `created_at` | 시계열, 기간 단위 보관·삭제 |
| List | 국가 코드, 테넌트 등급 | 값 집합이 정해진 경우 |
| Hash | `hash(customer_id) % 8` | 고르게 퍼뜨리기 |

```sql
CREATE TABLE event (id bigint, created_at timestamptz NOT NULL, payload jsonb)
  PARTITION BY RANGE (created_at);
CREATE TABLE event_2026_11 PARTITION OF event
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

-- 오래된 달 정리: 대량 DELETE 대신 분리 후 삭제
ALTER TABLE event DETACH PARTITION event_2026_01 CONCURRENTLY;
DROP TABLE event_2026_01;
```

PostgreSQL 문서의 경험칙: 테이블이 **서버 물리 메모리보다 클 때**쯤 이득이 분명해진다.

### 샤딩 전략

| 전략 | 방식 | 장점 | 단점 |
| --- | --- | --- | --- |
| 룩업(디렉터리) | 키 → 샤드 매핑 테이블 | 테넌트 단위 이동이 자유로움, 가상 샤드로 재배치 쉬움 | 매핑 조회 비용, 매핑 저장소 관리 |
| 범위 | 키 구간별 샤드 | 범위 조회가 한 샤드에서 끝남 | 최근 키에 부하 쏠림(핫스팟) |
| 해시 | `hash(key)` 로 샤드 결정 | 고른 분산, 매핑 불필요 | `mod N` 이면 샤드 추가 시 대부분 키 이동 → 일관 해싱 필요 |
| 지역 | 사용자 지역별 샤드 | 데이터 거주 규제, 지연 감소 | 지역 간 불균형, 전역 집계가 느림 |

```ts
// 가상 샤드: 논리 샤드 수는 고정, 물리 노드 매핑만 바꾼다
const LOGICAL_SHARDS = 1024;
const logical = (tenantId: string) => murmur32(tenantId) % LOGICAL_SHARDS;
const shardMap: Record<number, string> = await loadShardMap(); // 0..1023 → 'db-a' | 'db-b' ...
const dbFor = (tenantId: string) => pools[shardMap[logical(tenantId)]];
```

### 샤드 키 고르기

- **불변**이어야 한다. 바뀌면 행이 샤드를 옮겨야 한다.
- **카디널리티가 높고** 부하가 고르게 퍼져야 한다. 자동 증가 값·시각을 그대로 쓰면 최신 샤드에 쓰기가 몰린다.
- **주요 쿼리가 한 샤드에서 끝나도록**. 멀티테넌트라면 대개 `tenant_id`.
- 샤드 키가 아닌 속성으로 찾아야 하면 별도 인덱스 테이블(Index Table 패턴)이나 검색 엔진을 둔다.

## 언제 쓰나

- **파티셔닝**: 시계열·로그처럼 기간 단위로 쌓이고 지워지는 큰 테이블.
- **샤딩**: 수직 확장·읽기 복제본·캐시·파티셔닝을 다 해 봐도 **쓰기**나 저장 용량이 한 서버를 넘을 때, 또는 데이터 거주 규제가 있을 때.

## 주의 (비용)

- Azure 아키텍처 센터도 샤딩이 **시스템 수명 내내 남는 복잡도**를 들인다고 강조한다. 읽기가 병목이면 복제본과 캐시로 먼저 해결한다.
- 샤드 간 조인·집계는 팬아웃 쿼리가 되고, 가장 느린 샤드가 전체 지연을 정한다.
- 샤드를 넘는 트랜잭션은 2PC 나 [사가](/develop-wiki/knowledge/distributed-systems/saga/)가 필요하다. 대부분 결과적 일관성을 받아들인다.
- 샤드마다 자동 증가 ID 를 쓰면 충돌한다 → [키 설계](/develop-wiki/knowledge/data-modeling/primary-key-design/).
- 백업·복구·스키마 변경·모니터링을 샤드 수만큼 조율해야 한다. 한 샤드만 특정 시점으로 복구하면 다른 샤드와 어긋난다.
- PostgreSQL 파티션 테이블의 유니크·기본 키는 **파티션 키 칼럼을 포함**해야 한다. 전역 유일성이 필요하면 키 설계를 다시 본다.
- 파티션이 너무 많으면 계획 시간과 세션 메모리가 늘어난다. 조회 조건에 파티션 키가 없으면 프루닝이 안 돼 오히려 느려진다.

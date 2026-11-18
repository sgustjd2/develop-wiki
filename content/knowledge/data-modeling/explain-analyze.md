---
title: 실행 계획 읽기 (EXPLAIN / EXPLAIN ANALYZE)
aka: [EXPLAIN, EXPLAIN ANALYZE, Query Plan, Execution Plan, Seq Scan, Index Scan, Nested Loop, Hash Join, Row Estimate]
category: data-modeling
level: intermediate
summary: 느린 쿼리의 원인을 추측하지 않고 확인하는 법. PostgreSQL 실행 계획의 트리 구조, cost·rows·loops 읽기, 추정과 실제의 차이를 찾는 순서와 함정.
tags: [rdbms, postgresql, query-plan, performance, index, sql]
related: [data-modeling/index-design, data-modeling/n-plus-one, data-modeling/transaction-isolation, data-modeling/sharding-partitioning, performance/profiling]
sources:
  - https://www.postgresql.org/docs/current/using-explain.html
  - https://www.postgresql.org/docs/release/18.0/
  - https://dev.mysql.com/doc/refman/8.4/en/explain.html
updatedAt: 2026-11-18
---

> 예시는 PostgreSQL(18 기준) 문법이다. MySQL(8.4)도 `EXPLAIN FORMAT=TREE` 와 `EXPLAIN ANALYZE`(항상 TREE 형식)로 비슷한 트리를 보여 준다.

## 문제

"인덱스를 걸었는데 왜 느리지?", "어제까지 빨랐는데?" — SQL 은 **무엇을** 원하는지만 쓰고, **어떻게** 가져올지는 플래너가 통계를 보고 정한다. 그 결정을 보지 않고 인덱스를 추가하거나 쿼리를 바꾸는 것은 추측이다.

## 해법: 계획을 보고, 실제와 비교한다

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.total
FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE c.country = 'KR' AND o.created_at >= now() - interval '7 days'
ORDER BY o.created_at DESC LIMIT 20;
```

| 형태 | 하는 일 |
| --- | --- |
| `EXPLAIN` | 계획과 **추정치**만. 실행하지 않음 |
| `EXPLAIN ANALYZE` | **실제로 실행**하고 실제 행 수·시간을 함께 보여 줌 |
| `BUFFERS` | 노드별로 공유 버퍼 hit(메모리)/read(디스크) 페이지 수. PG 18 부터 `ANALYZE` 에 자동 포함 |

### 출력 한 줄 읽기

```
Index Scan using orders_created_at_idx on orders o
  (cost=0.43..812.50 rows=1450 width=16)
  (actual time=0.031..4.210 rows=12873.00 loops=1)
  Filter: (status <> 'cancelled')
  Rows Removed by Filter: 210
  Buffers: shared hit=9120 read=388
```

| 항목 | 의미 |
| --- | --- |
| `cost=0.43..812.50` | 시작 비용..전체 비용. 단위는 임의(순차 페이지 1개 읽기 = 1.0 기준). 시간이 아니다 |
| `rows=1450` | 이 노드가 **내보낼** 것으로 추정한 행 수 (스캔한 행 수가 아님) |
| `width` | 평균 행 크기(바이트) 추정 |
| `actual time=0.031..4.210` | 첫 행까지..마지막 행까지 ms, **루프 1회 평균** |
| `rows=12873.00` | 실제 행 수 (루프 평균, PG 18 부터 소수 표시) |
| `loops` | 이 노드가 실행된 횟수. 노드 총 시간 ≈ actual time × loops |
| `Rows Removed by Filter` | 읽었지만 버린 행. 크면 인덱스가 조건을 못 거르고 있다 |

계획은 **트리**다. 들여쓰기가 깊은 노드가 먼저(안쪽) 실행되고, 결과를 위로 올린다.

### 노드 종류 한눈에

| 노드 | 언제 고르나 | 의심 신호 |
| --- | --- | --- |
| Seq Scan | 테이블 대부분을 읽거나 테이블이 작을 때 | 큰 테이블에서 소수 행을 찾는데 Seq Scan |
| Index Scan | 선택도가 높은 조건, 인덱스 순서와 맞는 `ORDER BY` | 많은 행을 랜덤 I/O 로 읽음 |
| Index Only Scan | 필요한 칼럼이 모두 인덱스에 있음 | `Heap Fetches` 가 크면 VACUUM(가시성 맵) 부족 |
| Bitmap Index + Bitmap Heap Scan | 중간 선택도. 위치를 모아 물리 순서로 읽음 | `Recheck` 로 버려지는 행이 많음, `lossy` |
| Nested Loop | 바깥 행이 적고 안쪽에 인덱스가 있음 | 바깥 추정이 작았는데 실제는 수만 → 안쪽이 수만 번 실행 |
| Hash Join | 큰 두 입력, 정렬 안 됨 | `Batches` > 1 이면 `work_mem` 부족으로 디스크 사용 |
| Merge Join | 양쪽이 조인 키로 정렬됨(인덱스·Sort) | 큰 Sort 가 앞에 붙음 |
| Sort | `ORDER BY`, Merge Join 준비 | `Sort Method: external merge Disk` |

## 읽는 순서

1. **가장 시간이 큰 노드**를 찾는다(actual time × loops). 거기만 본다.
2. 그 노드의 **추정 rows vs 실제 rows** 를 비교한다. 10배 이상 차이면 플래너가 잘못된 전제로 계획을 짰다는 뜻이다. 대개 이것이 진짜 원인이다.
   - 통계가 오래됨 → `ANALYZE 테이블`
   - 상관된 칼럼(도시와 국가처럼) → `CREATE STATISTICS` 로 확장 통계
   - 함수·형 변환이 걸린 조건(`WHERE date(created_at) = …`) → 추정 불가, 인덱스도 못 탐
3. `Rows Removed by Filter` 가 크면 → 인덱스가 조건을 덮지 못한다. 복합 인덱스 순서나 부분 인덱스를 검토. [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/) 참고.
4. `Buffers: read` 가 크면 → 디스크에서 읽는다. 캐시가 데워진 뒤 다시 재서 비교한다.
5. 같은 쿼리가 수천 번 실행되는 형태(loops 가 크거나, 앱 로그에 같은 쿼리 반복)면 → 쿼리 하나가 아니라 [N+1](/develop-wiki/knowledge/data-modeling/n-plus-one/) 문제다.

## 언제 쓰나

- 느린 쿼리 로그(`log_min_duration_statement`), `pg_stat_statements` 로 상위 쿼리를 고른 뒤.
- 인덱스를 추가·삭제하기 전후 비교. 마이그레이션 PR 에 계획을 첨부한다.
- 운영에서 간헐적으로만 느린 쿼리는 `auto_explain` 확장으로 느린 실행의 계획을 자동 기록한다.

## 주의

- **`EXPLAIN ANALYZE` 는 진짜로 실행한다.** `UPDATE`/`DELETE` 는 트랜잭션으로 감싸고 되돌린다.

  ```sql
  BEGIN;
  EXPLAIN ANALYZE UPDATE orders SET status = 'x' WHERE id < 100;
  ROLLBACK;
  ```
- 작은 개발 DB 의 계획은 운영과 다르다. 플래너 비용은 데이터 크기에 비선형이라, 한 페이지짜리 테이블은 거의 항상 Seq Scan 이 된다. 운영과 비슷한 데이터 분포로 본다.
- 시간 측정 자체에 오버헤드가 있다. 절대 시간보다 노드 간 비율로 본다. 네트워크 전송·결과 직렬화 시간은 포함되지 않는다(`SERIALIZE` 옵션 별도).
- 바인드 변수 쿼리는 값에 따라 계획이 다르다. 실제 앱이 보내는 값으로 확인하고, 일반 계획(generic plan)으로 바뀌어 느려지는 경우도 있다.
- `LIMIT` 아래 노드는 일찍 멈춰 실제 rows 가 추정보다 작게 나온다. 이건 오류가 아니다.
- `enable_seqscan = off` 같은 설정으로 계획을 강제하는 것은 진단용이다. 운영에 남기지 않는다. 근본 원인(통계, 인덱스, 쿼리 형태)을 고친다.

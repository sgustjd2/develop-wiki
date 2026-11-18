---
title: PostgreSQL 어드바이저리 락
aka: [Advisory Lock, pg_advisory_lock, pg_try_advisory_xact_lock, Application-level Lock, 자문 잠금, Session-level Lock, Transaction-level Lock]
category: data-modeling
level: intermediate
summary: 테이블·행이 아니라 애플리케이션이 정한 숫자 키에 거는 PostgreSQL 잠금. 단일 작업자 보장, 키 단위 직렬화에 쓰며 세션/트랜잭션 수준, try 변형, 커넥션 풀 주의점이 핵심이다.
tags: [postgresql, advisory-lock, locking, concurrency, singleton, pgbouncer, pg-locks]
related: [data-modeling/optimistic-pessimistic-locking, data-modeling/db-job-queue, data-modeling/transaction-isolation, data-modeling/mvcc-vacuum, distributed-systems/distributed-lock-fencing-token, performance/connection-pool, cs-fundamentals/race-condition-lock-deadlock]
sources:
  - https://www.postgresql.org/docs/current/explicit-locking.html
  - https://www.postgresql.org/docs/current/functions-admin.html
  - https://www.pgbouncer.org/features.html
updatedAt: 2026-11-19
---

## 문제

"같은 사용자에 대한 정산 작업은 동시에 하나만", "마이그레이션은 한 인스턴스만 실행", "스케줄러가 여러 대여도 이 크론 잡은 하나만"처럼 **행으로 표현하기 애매한 자원**에 상호 배제가 필요하다. 흔한 방법은 이렇다.

- 잠금용 플래그 칼럼·테이블을 만든다: 갱신할 때마다 [MVCC 로 죽은 행이 쌓이고](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/) 비정상 종료 시 플래그가 남아 수동으로 풀어야 한다.
- Redis 등 외부 락을 쓴다: 의존성이 늘고 정합성 논쟁이 따라온다 → [분산 락과 펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/).
- `SELECT ... FOR UPDATE` 로 행을 잠근다: 잠글 행이 있어야 한다 → [낙관적·비관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/).

이미 PostgreSQL 을 쓰고 있다면 **어드바이저리 락(advisory lock)** 이 간단한 대안이다.

## 해법

공식 문서의 정의는 "애플리케이션이 의미를 정하는 잠금"이다. 서버가 잠금을 저장하고 충돌을 강제하지만, **그 잠금이 무엇을 뜻하는지는 서버가 모른다.** 키는 `bigint` 하나 또는 `int` 둘이며 서로 다른 키 공간이다(둘이 같은 숫자여도 충돌하지 않는다).

| 함수 | 범위 | 동작 |
| --- | --- | --- |
| `pg_advisory_lock(key)` | 세션 | 배타. 얻을 때까지 **대기** |
| `pg_try_advisory_lock(key)` | 세션 | 배타. 못 얻으면 **즉시 false** |
| `pg_advisory_xact_lock(key)` | 트랜잭션 | 배타. 대기. 트랜잭션 끝에 **자동 해제**(수동 해제 없음) |
| `pg_try_advisory_xact_lock(key)` | 트랜잭션 | 배타. 즉시 true/false |
| `..._shared` 변형 | 위와 같음 | 공유 락. 공유끼리는 충돌하지 않고 배타와만 충돌 |
| `pg_advisory_unlock(key)` | 세션 | 해제. 안 가진 락이면 false + 경고 |
| `pg_advisory_unlock_all()` | 세션 | 세션의 모든 락 해제(세션 종료 시 암묵적으로 호출) |

### 가장 흔한 패턴: 트랜잭션 수준 try 락

```sql
BEGIN;
SELECT pg_try_advisory_xact_lock(42) AS got;   -- false 면 다른 인스턴스가 실행 중 → 그냥 종료
-- got 가 true 일 때만 작업 수행 (같은 트랜잭션 안에서)
COMMIT;                                         -- 커밋·롤백 시 락 자동 해제
```

세션 수준과 달리 **트랜잭션이 끝나면 반드시 풀리므로** 잊어 버려서 락이 남는 사고가 없다. 문서도 짧은 용도에는 트랜잭션 수준이 보통 더 편하다고 한다.

### 직접 확인한 동작 (PostgreSQL 16)

두 세션(A, B)으로 실험했다.

- A 가 `BEGIN; SELECT pg_advisory_lock(42); ROLLBACK;` 했는데 **락이 롤백 후에도 유지**됐다. B 의 `pg_try_advisory_lock(42)` 은 `false`. 세션 수준 락은 트랜잭션 경계를 무시한다는 문서 서술과 같다.
- A 가 트랜잭션 수준 락(`pg_advisory_xact_lock(7)`)을 COMMIT 하자 B 가 즉시 `pg_try_advisory_lock(7)` 에 성공했다.
- A 가 같은 키 42 를 **두 번** 잡고 한 번 `pg_advisory_unlock(42)` 했을 때 B 는 여전히 못 잡았다. 두 번 풀어야 해제된다(스택 방식). 세 번째 unlock 은 `false` 와 경고 `you don't own a lock of type ExclusiveLock` 를 냈다.
- `pg_try_advisory_lock(0, 42)`(두 `int` 키)는 `bigint` 42 와 **충돌하지 않았다.** `pg_locks` 에서 `bigint` 키는 `objsubid = 1`, 두 `int` 키는 `objsubid = 2` 로 구분됐다.
- 잠금은 `pg_locks` 에서 `locktype = 'advisory'` 로 볼 수 있다. A 의 연결이 끊기면 세션 락은 자동으로 풀린다.

## 언제 쓰나

- **스케줄러·크론 잡을 여러 인스턴스에서 돌리되 하나만 실행**하게 할 때: 잡 이름에 정한 숫자 키로 `try` 락. 못 얻으면 건너뛴다.
- **스키마 마이그레이션 동시 실행 방지**.
- **키 단위 직렬화**: 같은 사용자·계좌의 처리만 순서대로 하고 다른 키는 병렬. 키는 보통 도메인 ID(bigint)를 그대로 쓴다.
- 행 잠금을 걸 대상이 아직 없는 "존재하면 안 되는 것" 검사(없을 때만 삽입)를 직렬화할 때(대안은 유니크 제약).
- 큐 소비는 `FOR UPDATE SKIP LOCKED` 가 더 맞다 → [DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/).

## 주의 (비용)

- **커넥션 풀과 충돌한다.** 세션 수준 락은 "그 DB 세션"에 묶인다. PgBouncer 의 트랜잭션 풀링 모드에서는 세션 수준 어드바이저리 락이 **지원되지 않는다**(PgBouncer 기능표 "Never"). 서버 연결이 요청마다 바뀌어 잠근 세션과 푸는 세션이 달라지기 때문이다. 풀러를 쓰면 **트랜잭션 수준 락**을 쓰거나 세션 풀링으로 둔다. 애플리케이션 쪽 커넥션 풀을 쓸 때도, 연결을 반납하기 전에 세션 락을 풀지 않으면 다음 요청이 그 락을 쥔 연결을 받는다 → [커넥션 풀](/develop-wiki/knowledge/performance/connection-pool/).
- **락이 세션에 묶이므로 클라이언트 생존과 다르다.** 연결이 끊기면 락은 풀리지만 클라이언트 프로세스가 DB 밖에서 이미 한 일(외부 API 호출)은 되돌려지지 않는다. DB 안에서 일이 끝나는 작업에서 가장 안전하다. 자원이 DB 밖이면 펜싱 토큰이 필요하다는 앞 노트의 논의가 그대로 적용된다(락의 소유가 곧 처리 중임을 뜻하지 않는다는 점에서).
- **락 개수에 한계가 있다.** 어드바이저리 락도 일반 락과 같은 공유 메모리 풀(`max_locks_per_transaction`, `max_connections` 로 크기가 정해짐)을 쓴다. 문서에 따르면 현실적 상한은 설정에 따라 수만~수십만 개이며, 풀이 차면 어떤 락도 못 준다. 행마다 잠그는 식으로 대량의 키를 잡지 않는다.
- **키 충돌**: 숫자 키 공간이 하나라 서로 다른 기능이 같은 숫자를 쓰면 의도치 않게 서로 막는다. 기능별로 키 범위를 정해 두거나 두 `int` 키(기능 ID, 객체 ID)를 쓴다.
- **쿼리에서 잠금 함수를 직접 호출할 때의 평가 순서**: 공식 문서는 `WHERE` 와 `LIMIT` 를 같이 쓴 쿼리에서 `LIMIT` 가 락 함수 호출보다 먼저 적용된다는 보장이 없다고 경고한다. 예상보다 많은 행을 잠그고 그 락이 세션이 끝날 때까지 남을 수 있다. 서브쿼리로 먼저 고른 뒤 잠그라고 한다.
  ```sql
  SELECT pg_advisory_lock(q.id) FROM (SELECT id FROM foo ORDER BY val LIMIT 5) q;
  ```
  이 노트는 PostgreSQL 16 에서 `ORDER BY ... LIMIT` 형태로 재현을 시도했으나 잠금이 5개만 잡혀 문제를 재현하지 못했다. 플래너와 버전에 따라 달라질 수 있으니 서브쿼리 형태를 습관으로 한다.
- **서버 한 대(프라이머리)의 메모리 상태**다. 장애 전환이 일어나면 새 프라이머리에는 이 락이 없다(일반론). 장애 전환 중에도 엄격한 배타가 필요한 일에 단독으로 쓰지 않는다.
- 교착 상태가 가능하다. 여러 키를 잡을 때는 항상 같은 순서로 잡는다 → [레이스·락·데드락](/develop-wiki/knowledge/cs-fundamentals/race-condition-lock-deadlock/).

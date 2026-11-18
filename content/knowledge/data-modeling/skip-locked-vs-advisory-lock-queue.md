---
title: 작업 큐 잠금 방식 비교 — SKIP LOCKED vs 어드바이저리 락
aka: [FOR UPDATE SKIP LOCKED, pg_try_advisory_xact_lock, Queue Claim, Row Lock vs Advisory Lock, 작업 가져가기 경합]
category: data-modeling
level: advanced
summary: 여러 워커가 같은 작업을 집지 않게 하는 세 방법(순진한 SELECT 후 UPDATE, 행 잠금 SKIP LOCKED, 어드바이저리 락)을 실제로 돌려 비교하고, 어드바이저리 락을 WHERE 에 넣을 때의 LIMIT 함정을 보인다.
tags: [postgresql, queue, skip-locked, advisory-lock, concurrency, locking, job-queue]
related: [data-modeling/db-job-queue, data-modeling/advisory-locks, data-modeling/optimistic-pessimistic-locking, data-modeling/transaction-isolation, data-modeling/autovacuum-tuning, data-modeling/mvcc-vacuum, distributed-systems/idempotency, distributed-systems/distributed-lock-fencing-token]
sources:
  - https://www.postgresql.org/docs/current/sql-select.html
  - https://www.postgresql.org/docs/current/explicit-locking.html
updatedAt: 2026-11-19
---

## 문제

[DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/)는 `FOR UPDATE SKIP LOCKED` 의 패턴과 운영 비용을 다뤘고, [어드바이저리 락](/develop-wiki/knowledge/data-modeling/advisory-locks/)은 락 자체를 다뤘다. 이 노트는 한 가지 질문에 답한다. **"작업 하나를 한 워커만 가져가게" 만드는 방법 사이에서 무엇이 다르고, 어디서 틀리나?** 세 후보를 직접 돌렸다.

## 방법 1: 순진한 "골라서 갱신" (틀림)

```sql
WITH c AS (SELECT id FROM jobs WHERE status='ready' ORDER BY id LIMIT 1),
u AS (UPDATE jobs SET status='done' WHERE id = (SELECT id FROM c) RETURNING id)
INSERT INTO claims SELECT id, :client_id FROM u;
```

READ COMMITTED 에서 여러 워커가 같은 `c` 를 보고 같은 행을 고른다. UPDATE 의 `WHERE id = ...` 는 행을 얻으면 통과하므로(`status` 를 다시 확인하지 않는다) 모두 성공한다.

## 방법 2: 행 잠금 + SKIP LOCKED

```sql
WITH c AS (SELECT id FROM jobs WHERE status='ready' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED),
u AS (UPDATE jobs SET status='done' FROM c WHERE jobs.id = c.id RETURNING jobs.id)
INSERT INTO claims SELECT id, :client_id FROM u;
```

공식 문서: 잠글 수 없는 행은 건너뛰고, 큐 같은 테이블에서 여러 소비자의 경합을 피하는 용도다. 대신 일관된 뷰를 주지 않아 범용 조회에는 부적합하다. `LIMIT` 이 있으면 필요한 개수를 채운 시점에 잠금이 멈춘다.

### 실행으로 확인 (PostgreSQL 16.15, 임시 컨테이너, pgbench)

작업 2,000건, 워커 8개(`pgbench -c 8 -t 250`), 각 트랜잭션이 하나를 가져가며 `claims` 에 기록한 뒤 같은 job 이 몇 번 기록됐는지 센다.

| 방법 | 기록된 claim | 서로 다른 job | 중복 |
| --- | --- | --- | --- |
| 1. 순진한 방식 | 2,000 | 546 | **1,454** |
| 2. SKIP LOCKED | 2,000 | **2,000** | **0** |

순진한 방식에서는 같은 작업이 평균 3~4번 처리된다. (처리량(tps)도 쟀지만 단일 노트북 컨테이너 수치라 비교 근거로 쓰지 않는다.)

### 대기 vs 건너뜀

워커 A 가 첫 행을 `FOR UPDATE` 로 잠근 채 3초 보유하는 동안 워커 B 가 같은 `LIMIT 1` 쿼리를 실행했다.

| B 의 절 | 결과 | 걸린 시간 |
| --- | --- | --- |
| `FOR UPDATE` | A 가 끝난 뒤 같은 행(id=1) | 약 2.06초(A 의 남은 시간) |
| `FOR UPDATE SKIP LOCKED` | 다음 행(id=2) | 약 0.09초 |

일반 `FOR UPDATE` 는 줄을 서므로 워커를 늘려도 처리량이 늘지 않는다.

## 방법 3: 어드바이저리 락으로 "행 하나를 점유"

```sql
-- 순서 없이 아무 행이나 쓰는 흔한 시도
SELECT id FROM jobs WHERE status='ready' AND pg_try_advisory_xact_lock(id) ORDER BY run_at LIMIT 1;
```

어드바이저리 락은 `jobs` 행과 무관하게 숫자 키에 걸리는 애플리케이션 락이다. 이 쿼리의 함정은 공식 문서가 직접 경고한다. **락 함수가 `LIMIT` 보다 먼저 평가될 수 있다.**

실행으로 확인했다(1,000개 ready 행, 정렬이 필요한 `ORDER BY run_at`):

| 쿼리 형태 | 쿼리 후 이 세션이 쥔 어드바이저리 락 수 |
| --- | --- |
| WHERE 절에 `pg_try_advisory_xact_lock(id)`, 뒤에 `ORDER BY run_at LIMIT 1` | **1,000** |
| 서브쿼리로 먼저 `ORDER BY run_at LIMIT 1` 한 뒤 바깥 WHERE 에서 락 | **1** |

반환은 1행인데 **1,000개 키를 잠갔다.** 다른 워커는 그 작업들을 전부 못 집는다(트랜잭션 수준 락은 트랜잭션이 끝나야 풀린다). 세션 수준 락이면 세션이 끝날 때까지 남는 "떠다니는 락"이 된다. 문서가 제시하는 안전한 형태가 위 두 번째 서브쿼리 패턴이다. 다만 서브쿼리 패턴은 첫 후보가 이미 다른 워커의 락이면 **0행**을 돌려준다(건너뛰고 다음을 고르지 않음). SKIP LOCKED 처럼 "다음 후보로 넘어가기"를 하려면 후보 N개를 뽑아 그 안에서 락을 시도하는 루프가 필요하다(일반 설계).

그 밖에 어드바이저리 락은 `max_locks_per_transaction` 등과 공유하는 락 메모리를 쓰므로 한꺼번에 많은 키를 잡으면 서버 전체의 락 획득이 막힐 수 있다고 문서가 경고한다.

## 비교

| | 순진한 방식 | `FOR UPDATE SKIP LOCKED` | 어드바이저리 락 |
| --- | --- | --- | --- |
| 중복 방지 | 안 됨(실측 중복 1,454) | 됨 | 올바르게 쓰면 됨 |
| 잠그는 것 | 없음 | 행 | 숫자 키(행과 무관) |
| 락과 상태 변경의 연결 | 없음 | 행 잠금 = 행 갱신 대상(MVCC 와 일관) | 없음. 락을 쥐고 있어도 `jobs` 행 상태는 별개 |
| 건너뛰기 | - | 내장 | 직접 구현(`try` 계열 + 후보 순회) |
| 흔한 실수 | 읽기-갱신 사이 경합 | `ORDER BY` 누락(비결정), 순서 보장 기대 | WHERE 에 락 + LIMIT, 세션 락 누수, PgBouncer 트랜잭션 풀링 |
| 알맞은 곳 | 쓰지 않는다 | 작업 테이블에서 행 단위 점유 | 행이 없는 대상의 직렬화(키별 싱글턴, 크론 리더) |

## 언제 쓰나

- **작업 가져가기는 `SKIP LOCKED`**. 락 대상이 곧 갱신할 행이고, 건너뛰기가 내장이며, 트랜잭션이 끝나면 자동으로 풀린다.
- **어드바이저리 락은 락 대상이 DB 행이 아닐 때**: 외부 리소스, 키(고객 ID) 단위 직렬 처리, "마이그레이션은 하나만" 같은 싱글턴 보장. 이때 `pg_try_advisory_xact_lock` 을 단독 호출한다(쿼리 WHERE 에 섞지 않는다).
- 키 단위 순서 보장이 필요하면 두 방식을 합친다: SKIP LOCKED 로 작업을 집되 같은 키의 앞선 작업이 실행 중이면 건너뛴다(설계가 필요하다).

## 주의 (비용)

- **at-least-once.** 어떤 방법이든 워커가 처리 중 죽으면 작업이 다시 돈다. 핸들러는 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)하게 만든다. 락 하나로 "정확히 한 번"이 되지 않는다 → [펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/).
- **`ORDER BY` 를 명시한다.** 없으면 어떤 행이 잡힐지 비결정적이다. 또 SKIP LOCKED 는 엄격한 FIFO 를 보장하지 않는다.
- **트랜잭션을 길게 열어 두지 않는다.** 잠금 유지 시간이 작업 시간이 되고 오래 열린 트랜잭션은 vacuum 을 막는다 → [autovacuum 튜닝](/develop-wiki/knowledge/data-modeling/autovacuum-tuning/).
- 어드바이저리 락은 **PgBouncer 트랜잭션 풀링**에서 세션 수준 락이 엉뚱한 커넥션에 남을 수 있다. 트랜잭션 수준 락을 쓰거나 [어드바이저리 락](/develop-wiki/knowledge/data-modeling/advisory-locks/)의 주의를 따른다.
- 이 실험은 단일 인스턴스, READ COMMITTED(기본 격리 수준) 기준이다. REPEATABLE READ 이상에서의 동작은 직접 확인하지 않았다 → [트랜잭션 격리](/develop-wiki/knowledge/data-modeling/transaction-isolation/).

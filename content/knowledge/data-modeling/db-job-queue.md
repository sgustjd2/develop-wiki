---
title: DB 기반 작업 큐 (SKIP LOCKED)
aka: [Database Job Queue, Postgres Queue, SELECT FOR UPDATE SKIP LOCKED, Transactional Queue, Polling Worker, Lease, Visibility Timeout]
category: data-modeling
level: intermediate
summary: 별도 메시지 브로커 없이 RDB 테이블을 작업 큐로 쓰는 방법. FOR UPDATE SKIP LOCKED 로 워커들이 겹치지 않게 작업을 가져가는 패턴과 재시도·락 유지 시간·테이블 팽창 문제.
tags: [postgresql, queue, concurrency, skip-locked, background-job, outbox, rdbms]
related: [data-modeling/optimistic-pessimistic-locking, data-modeling/mvcc-vacuum, data-modeling/transaction-isolation, data-modeling/index-design, distributed-systems/idempotency, distributed-systems/transactional-outbox, performance/backpressure-load-shedding, performance/timeout-retry-circuit-breaker]
sources:
  - https://www.postgresql.org/docs/current/sql-select.html
  - https://www.postgresql.org/docs/current/explicit-locking.html
  - https://github.com/timgit/pg-boss
  - https://github.com/rails/solid_queue
updatedAt: 2026-11-19
---

## 문제

백그라운드 작업(메일 발송, 썸네일, 웹훅 재전송)을 처리하려고 Redis·Kafka·RabbitMQ 를 새로 들이면 운영 대상이 늘고, 가장 큰 구멍이 남는다. **"DB 에 커밋"과 "큐에 넣기"가 서로 다른 시스템**이라 한쪽만 성공할 수 있다(→ [트랜잭션 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)).

작업을 같은 DB 의 테이블에 넣으면 비즈니스 변경과 작업 등록이 **한 트랜잭션**이 된다. 남는 문제는 워커 여러 개가 같은 작업을 집어가지 않게 하는 것이다.

## 해법

단순 `SELECT … FOR UPDATE` 는 두 번째 워커가 첫 워커의 행 잠금이 풀릴 때까지 **줄 서서 기다린다.** 워커를 늘려도 처리량이 안 는다. `SKIP LOCKED` 는 이미 잠긴 행을 **건너뛰고** 다음 행을 잡는다. 공식 문서도 이것이 일관된 뷰를 주지 않아 범용 조회엔 부적합하지만, 큐 같은 테이블에서 여러 소비자의 잠금 경합을 피하는 용도라고 밝힌다.

```sql
CREATE TABLE jobs (
  id          bigserial PRIMARY KEY,
  queue       text        NOT NULL,
  payload     jsonb       NOT NULL,
  status      text        NOT NULL DEFAULT 'ready',   -- ready | running | done | failed
  attempts    int         NOT NULL DEFAULT 0,
  run_at      timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
CREATE INDEX jobs_ready_idx ON jobs (queue, run_at, id) WHERE status = 'ready';  -- 부분 인덱스

-- 방식 A: 가져오며 상태를 running 으로 바꾸고(리스) 즉시 커밋 → 잠금은 짧다
WITH next AS (
  SELECT id FROM jobs
  WHERE queue = $1 AND status = 'ready' AND run_at <= now()
  ORDER BY run_at, id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs SET status = 'running', attempts = attempts + 1, locked_until = now() + interval '5 minutes'
FROM next WHERE jobs.id = next.id
RETURNING jobs.*;
```

```ts
// 워커 루프 (요점)
for (;;) {
  const job = await claim('email');                 // 위 쿼리, 자체 커밋
  if (!job) { await sleep(500 + Math.random() * 500); continue; }   // 비었으면 폴링 간격
  try { await handle(job.payload); await db.query(`UPDATE jobs SET status='done' WHERE id=$1`, [job.id]); }
  catch { await db.query(
    `UPDATE jobs SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'ready' END,
                     run_at = now() + (interval '10 seconds' * power(2, attempts)) WHERE id=$1`, [job.id]); }
}
// 별도 리퍼: status='running' AND locked_until < now() 인 행을 'ready' 로 되돌려 죽은 워커의 작업을 회수
```

- `LIMIT` 이 있으면 필요한 개수를 채우는 순간 잠금이 멈춘다(문서). 여러 건을 가져가려면 `LIMIT n`.
- `ORDER BY` 를 명시한다. 없으면 어떤 행을 잡을지 비결정적이다.
- 방식 B: **트랜잭션을 열어 둔 채 처리하고 끝에 커밋**하면 잠금 = 작업 시간이다. 워커가 죽으면 트랜잭션이 롤백되어 작업이 자동 복귀하는 장점이 있지만, 오래 걸리는 작업은 MVCC 청소를 막고 커넥션을 점유한다. 짧은 작업에만 쓴다.
- 이 패턴을 라이브러리로 만든 것들이 있다. 예: pg-boss(README 에서 Postgres 의 SKIP LOCKED 에 의존한다고 밝힘), Rails 의 Solid Queue(MySQL 8+, PostgreSQL, SQLite 지원; `FOR UPDATE SKIP LOCKED` 가 가능하면 사용). 직접 만들기 전에 이런 구현을 먼저 검토한다.

## 언제 쓰나

- 이미 RDB 가 있고 작업량이 초당 수십~수백 건 수준일 때. 트랜잭션 일관성(주문 저장과 작업 등록 원자성)이 가치가 클 때.
- 작업 상태를 SQL 로 조회·재처리·통계 내고 싶을 때.
- 별도 브로커를 운영할 인력이 없는 소규모 팀.

## 주의 (비용)

- **at-least-once 전달.** 워커가 처리 후 완료 표시 전에 죽으면 같은 작업이 다시 돈다. 핸들러는 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)해야 한다.
- **죽은 튜플이 쌓인다.** 작업은 삽입→갱신(running)→갱신(done)→삭제로 행을 많이 바꾼다. [MVCC 와 VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/) 부담이 크다. 완료 작업은 빨리 삭제하거나 파티션 단위로 버리고, 큐 테이블 autovacuum 을 공격적으로 설정하며, 오래 열린 트랜잭션을 피한다. 부분 인덱스(`WHERE status='ready'`)로 인덱스 크기를 억제한다.
- **폴링 지연.** 새 작업을 즉시 알려면 `LISTEN/NOTIFY` 로 깨우는 방법이 있으나, 알림은 유실될 수 있으므로 폴링과 병행한다(이 노트의 출처로는 검증하지 않음).
- **SKIP LOCKED 는 엄격한 순서를 보장하지 않는다.** 잠긴 행을 건너뛰므로 FIFO 가 깨진다. 그룹별 순서가 필요하면 그룹 키 단위로 하나만 실행되게 별도 설계(예: 같은 키 작업은 한 워커/큐로)가 필요하다.
- **처리량 한계와 DB 부하.** 큐 트래픽이 본 업무 DB 의 커넥션·I/O 를 나눠 쓴다. 초당 수천 건 이상이거나 팬아웃·재생(replay)·긴 보존이 필요하면 전용 브로커가 맞다. 큐 전용 DB/스키마로 나누는 중간 선택도 있다.
- 실패가 영구적인 작업(독이 든 메시지)을 무한 재시도하지 않는다. `attempts` 상한과 `failed` 상태, 알림을 둔다 → [타임아웃·재시도](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/).
- 큐가 깊어지는 것을 모니터링한다(대기 건수, 가장 오래된 `run_at`). 생산 속도가 소비를 넘으면 [백프레셔](/develop-wiki/knowledge/performance/backpressure-load-shedding/)를 건다.
- 행 잠금 모드와 `NOWAIT` 비교는 [낙관적·비관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/) 참고.

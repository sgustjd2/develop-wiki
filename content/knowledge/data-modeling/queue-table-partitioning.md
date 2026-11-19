---
title: 큐 테이블 파티셔닝 (완료 작업 파티션 DROP)
aka: [Queue Table Partitioning, Partition Drop, Time-based Partitioning, DETACH PARTITION CONCURRENTLY, pg_partman, 완료 작업 정리]
category: data-modeling
level: advanced
summary: DB 작업 큐의 완료 행을 DELETE 하는 대신 시간 범위 파티션을 통째로 DROP 해 죽은 튜플·WAL·vacuum 부담을 없애는 방법과, 파티션 키가 PK 에 들어가야 하는 제약.
tags: [postgresql, partitioning, queue, retention, drop-partition, vacuum, skip-locked, operations]
related: [data-modeling/db-job-queue, data-modeling/skip-locked-vs-advisory-lock-queue, data-modeling/mvcc-vacuum, data-modeling/autovacuum-tuning, data-modeling/table-bloat-postgresql, data-modeling/sharding-partitioning, data-modeling/xid-wraparound-vacuum-freeze, data-modeling/primary-key-design]
sources:
  - https://www.postgresql.org/docs/current/ddl-partitioning.html
  - https://www.postgresql.org/docs/current/sql-altertable.html
updatedAt: 2026-11-19
---

## 문제

[DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/)는 행이 "삽입 → 갱신 → 완료"를 거치고 결국 지워진다. 완료 행을 `DELETE` 하면 죽은 튜플이 대량으로 생기고, [vacuum](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/)이 이를 치우는 동안 I/O 와 WAL 을 쓰며, 치운 공간은 파일에 남아 [팽창](/develop-wiki/knowledge/data-modeling/table-bloat-postgresql/)한다. 큐처럼 쓰기 비율이 높은 테이블에서는 청소가 쓰기를 못 따라가는 순간 폭주한다.

## 해법: 시간 범위 파티션을 통째로 버린다

작업을 생성 시각으로 **범위 파티션**(예: 하루 단위)에 넣고, 보존 기간이 지나고 완료된 파티션은 `DROP TABLE`(또는 `DETACH` 후 보관·삭제)한다. 공식 문서는 오래된 데이터를 지울 때 파티션을 통째로 `DROP` 하면 행 단위 `DELETE` 와 그에 딸린 vacuum 부담을 피해 훨씬 빠르다고 설명한다.

```sql
CREATE TABLE jobs (
  id         bigint GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL DEFAULT now(),
  status     text NOT NULL DEFAULT 'ready',
  payload    jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (id, created_at)                 -- 파티션 키가 PK 에 들어가야 한다
) PARTITION BY RANGE (created_at);
CREATE TABLE jobs_20261103 PARTITION OF jobs FOR VALUES FROM ('2026-11-03') TO ('2026-11-04');
CREATE INDEX jobs_ready_idx ON jobs (created_at, id) WHERE status = 'ready';   -- 부분 인덱스는 파티션마다 생긴다
```

가져오는 쿼리는 [SKIP LOCKED](/develop-wiki/knowledge/data-modeling/skip-locked-vs-advisory-lock-queue/) 그대로 쓴다. 행을 식별할 때 `(id, created_at)` 를 같이 쓴다.

```sql
WITH next AS (
  SELECT id, created_at FROM jobs WHERE status = 'ready'
  ORDER BY created_at, id LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE jobs j SET status = 'running' FROM next WHERE j.id = next.id AND j.created_at = next.created_at
RETURNING j.*;
```

### 직접 실험 (PostgreSQL 16.15, 임시 컨테이너)

하루 단위 파티션 3개에 완료 작업 30만 행씩(파티션당 31 MB), 총 90만 행을 넣었다.

| 방식 | 시간 | WAL | 결과 |
| --- | --- | --- | --- |
| 한 파티션 범위를 `DELETE`(30만 행) | 약 124 ms | 약 16 MB | 죽은 튜플 30만, 크기 31 MB 그대로. vacuum 후 약 9.3 MB(인덱스 잔존) |
| 다른 파티션 `DROP TABLE` | 약 3 ms | 약 7 KB | 즉시 공간 반환, 죽은 튜플 없음 |

- 이 크기에서는 시간 차이가 작다. 차이가 크게 나는 것은 **WAL 량, 죽은 튜플, 이후 vacuum 작업**이다. 수억 행이면 DELETE 는 지연과 복제 지연으로 번진다.
- 큐 조회(SKIP LOCKED + `ORDER BY created_at, id`)는 파티션에 걸쳐 정상 동작했고, 계획은 각 파티션의 부분 인덱스를 `Append` 로 합치는 형태였다.

### 파티션 관리 자동화

미리 만들고(내일·모레), 보존 기간이 지난 것만 지운다. **미완료 작업이 남은 파티션은 지우지 않는다.**

```sql
CREATE OR REPLACE PROCEDURE rotate_q(today date, keep_days int) LANGUAGE plpgsql AS $$
DECLARE d date; r record; pending bool;
BEGIN
  FOR d IN SELECT generate_series(today, today + 2, '1 day')::date LOOP          -- 앞으로 3일치를 미리 만든다
    EXECUTE format('create table if not exists %I partition of q for values from (%L) to (%L)', 'q_' || to_char(d, 'YYYYMMDD'), d, d + 1);
  END LOOP;
  FOR r IN SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
           WHERE i.inhparent = 'q'::regclass AND c.relname < 'q_' || to_char(today - keep_days, 'YYYYMMDD') LOOP
    EXECUTE format('select exists (select 1 from %I where status <> ''done'')', r.relname) INTO pending;
    IF pending THEN RAISE NOTICE 'skip % (미완료 작업)', r.relname;
    ELSE EXECUTE format('drop table %I', r.relname); END IF;
  END LOOP;
END $$;
```

직접 실행해 다음을 확인했다. 파티션이 없으면 만든다(재실행해도 안전). 완료만 있는 오래된 파티션은 지운다. `ready` 행이 남은 오래된 파티션은 건너뛰고 알린다. 이 프로시저는 스케줄러(cron, pg_cron 등)가 주기적으로 호출해야 한다. 파티션 관리 확장(`pg_partman` 등)이 있지만 이 노트에서 읽어 검증하지 않았다.

## 제약

- **파티션 키는 PK·유니크 제약에 포함되어야 한다.** `PRIMARY KEY (id)` 만 주면 "unique constraint on partitioned table must include all partitioning columns" 오류가 난다(실행 확인). 문서도 같은 규칙을 둔다.
- 그 결과 `id` **단독 유일성은 DB 가 보장하지 않는다.** 실험에서 같은 `id` 를 서로 다른 파티션에 넣으니 둘 다 들어갔다. 시퀀스/identity 로 발급할 때만 유일하고, `id` 로 외래 키를 걸거나 `id` 만으로 갱신하면 안 된다. 갱신 조건에 `created_at` 을 포함한다.
- 파티션이 너무 많으면 계획 시간과 메모리가 늘어난다. 문서는 가지치기(pruning)로 소수만 남는다면 수천 개까지 무난하다고 한다. 일 단위 보존 30일은 문제 없는 규모다.
- `status` 같은 갱신 조건으로만 조회하면 가지치기가 안 되어 모든 파티션을 훑는다. 실험 계획도 모든 파티션을 `Append` 했다. 조회에 `created_at` 하한(보존 기간 기준)을 주면 플래너가 오래된 파티션을 가지치기로 건너뛸 수 있다(문서의 pruning 원리. 이 쿼리로는 직접 측정하지 않았다).

## DROP 의 락과 DETACH CONCURRENTLY

- `DROP TABLE <파티션>` 과 일반 `DETACH PARTITION` 은 부모 테이블에 **ACCESS EXCLUSIVE** 락을 요구한다(문서). 큐 워커가 쉴 새 없이 부모를 조회하면 락 대기 중에 뒤따르는 쿼리가 줄줄이 막힐 수 있다. `lock_timeout` 을 짧게 걸고 재시도한다.
- `DETACH PARTITION ... CONCURRENTLY` 는 부모에 걸리는 락을 SHARE UPDATE EXCLUSIVE 로 낮춘다. 제약: **트랜잭션 블록 안에서 못 쓴다**(실행해 오류 확인), DEFAULT 파티션이 있으면 지원되지 않는다(참조 문서 기준). 떼어낸 테이블은 따로 백업·집계한 뒤 `DROP` 한다.
- DEFAULT 파티션이 있을 때 새 파티션을 붙이면 DEFAULT 를 스캔하며 락을 건다. 큐 테이블에는 DEFAULT 파티션을 두지 않고 파티션을 **미리** 만드는 편이 낫다. 미리 안 만들면 범위 밖 삽입이 오류가 된다. 관리 작업이 멈추면 서비스가 멈춘다.

## 언제 쓰나

- 완료 작업이 수백만 건 이상 쌓이고, **보존 기간이 시간 기준**(예: 7일)이며 삭제가 주기적일 때.
- DELETE 때문에 vacuum/복제 지연이 문제가 될 때, 감사용으로 오래된 파티션을 따로 보관해야 할 때.
- XID 소모가 큰 큐 테이블에서 오래된 데이터를 빨리 없애 동결 부담을 줄이고 싶을 때 → [XID 랩어라운드](/develop-wiki/knowledge/data-modeling/xid-wraparound-vacuum-freeze/).

## 주의 (비용)

- **작업량이 적으면 과설계다.** 초당 수십 건이면 완료 행을 자주 DELETE 하고 [autovacuum 을 공격적으로](/develop-wiki/knowledge/data-modeling/autovacuum-tuning/) 두는 쪽이 단순하다.
- **파티션 수명이 작업 수명보다 짧아야** 한다. 재시도 대기 중인 작업이 오래 살면 그 파티션을 못 버린다. 위 프로시저가 미완료 파티션을 건너뛰는 이유이고, 건너뛴 파티션이 쌓이지 않게 알람을 건다.
- 활성 파티션의 행 갱신(running/done)이 만드는 죽은 튜플은 여전히 있다. 파티셔닝은 **삭제** 비용을 없애지, 상태 갱신으로 인한 팽창을 없애지 않는다 → 활성 파티션은 autovacuum 설정과 `fillfactor` 로 관리.
- 파티션마다 인덱스가 따로 있어 인덱스 총 수가 늘고, 전역 유니크 인덱스가 없다(위 제약).
- 쓰기 경로가 파티션 라우팅을 거친다. 이 노트는 오버헤드를 측정하지 않았다.

## 비교

| 방식 | 삭제 비용 | 복잡도 | 비고 |
| --- | --- | --- | --- |
| 행 `DELETE` + autovacuum | 큼(WAL·죽은 튜플) | 낮음 | 소규모에 적합 |
| 파티션 `DROP` | 거의 없음 | 중간(키·관리 작업) | 시간 기반 보존에 적합 |
| 파티션 `DETACH CONCURRENTLY` 후 보관 | 거의 없음, 락 약함 | 중간 | 아카이브 필요 시 |
| 전용 브로커로 이전 | 해당 없음 | 높음 | 처리량·보존·팬아웃 요구가 클 때 |

## 검증 범위

PostgreSQL 공식 문서(ddl-partitioning)를 읽고, PG 16.15 임시 컨테이너에서 실행해 확인했다. `pg_partman` 은 읽지 않았다. 성능 수치는 개발 노트북의 단일 실행 값이다.

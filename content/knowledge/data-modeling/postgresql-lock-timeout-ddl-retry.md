---
title: PostgreSQL lock_timeout 과 DDL 재시도 (락 대기열 연쇄 차단)
aka: [lock_timeout, lock queue, 락 대기열, DDL retry, 55P03, lock_not_available, ACCESS EXCLUSIVE, statement_timeout, transaction_timeout, idle_in_transaction_session_timeout, pg_blocking_pids]
category: data-modeling
level: advanced
summary: 짧게 끝날 DDL 도 강한 락을 "기다리는 동안" 뒤에 온 SELECT·UPDATE 를 모두 세운다. lock_timeout 으로 대기 시간을 자르고, 실패하면 트랜잭션 전체를 지터 있는 백오프로 재시도하는 패턴을 직접 실행해 정리한다.
tags: [postgresql, lock-timeout, ddl, migration, locking, retry, backoff, access-exclusive, statement-timeout]
related: [data-modeling/postgresql-not-valid-validate-constraint, data-modeling/zero-downtime-migration, data-modeling/postgresql-18-not-enforced-not-null-not-valid, data-modeling/optimistic-pessimistic-locking, data-modeling/advisory-locks, performance/timeout-retry-circuit-breaker, performance/metastable-failures-retry-storm]
sources:
  - https://www.postgresql.org/docs/18/runtime-config-client.html
  - https://www.postgresql.org/docs/18/explicit-locking.html
  - https://www.postgresql.org/docs/18/sql-altertable.html
updatedAt: 2026-11-19
---

## 문제

`ALTER TABLE t ADD COLUMN memo text` 는 메타데이터만 바꾸므로 순식간에 끝난다. 그런데 운영 중에 이 명령이 수 초짜리 장애를 만든다.

1. 누군가 `t` 를 읽는 긴 트랜잭션을 열어 두었다(`ACCESS SHARE` 보유).
2. DDL 은 `ACCESS EXCLUSIVE` 가 필요하다. 문서상 이 락은 모든 락 모드와 충돌하므로 1 이 끝날 때까지 기다린다.
3. 그 뒤에 온 평범한 SELECT·UPDATE 는 1 과는 충돌하지 않지만, **먼저 기다리고 있는 DDL 과 충돌**해서 DDL 뒤에 줄을 선다.
4. 결과: 긴 트랜잭션 하나 + 순식간에 끝날 DDL 하나 = 그 테이블 전체 정지. 커넥션 풀이 차오르면 앱 전체로 번진다.

문서(Explicit Locking)는 교착이 아니면 락 요청이 **무기한** 기다린다고만 적고, 대기열 순서는 설명하지 않는다. 아래 실행에서 3 번 동작을 확인했다.

## 해법

### 1) lock_timeout 으로 대기 시간을 자른다

문서(18, Client Connection Defaults) 기준.

- `lock_timeout` 은 테이블·인덱스·행 등 객체의 **락을 기다리는 시간**만 제한한다. 명시적 락(`LOCK TABLE`, `NOWAIT` 없는 `FOR UPDATE`)과 암묵적 락 모두 해당한다.
- **락 획득 시도마다 따로** 적용된다. 한 문장이 락 세 개를 차례로 기다리면 최대 3 배까지 걸릴 수 있다.
- 기본값 0(끔). `statement_timeout` 이 같거나 작으면 `lock_timeout` 은 의미가 없다(문장 타임아웃이 먼저 터진다).
- `postgresql.conf` 에 전역으로 거는 것은 권장하지 않는다. 마이그레이션 세션·롤에만 건다.

### 2) 실패하면 트랜잭션 전체를 재시도한다

- 타임아웃 오류는 SQLSTATE `55P03`(`lock_not_available`)이다.
- 명시적 트랜잭션 안에서 터지면 트랜잭션이 중단된다(`25P02`). 앞서 성공한 DDL 도 롤백되므로 **문장이 아니라 트랜잭션 단위로** 다시 실행한다.
- 재시도 사이에는 지수 백오프 + 지터를 둔다. 긴 트랜잭션이 끝날 시간을 주고, 여러 배포 작업이 같은 박자로 부딪히지 않게 한다 → [타임아웃·재시도](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/).

```ts
import { Client } from "pg";

async function runDdlWithRetry(db: Client, statements: string[], maxAttempts = 20) {
  for (let attempt = 1; ; attempt++) {
    try {
      await db.query("BEGIN");
      await db.query("SET LOCAL lock_timeout = '2s'");
      await db.query("SET LOCAL statement_timeout = '30s'");
      for (const sql of statements) await db.query(sql);
      await db.query("COMMIT");
      return attempt;
    } catch (e: any) {
      await db.query("ROLLBACK");
      if (e.code !== "55P03" || attempt >= maxAttempts) throw e;
      const base = Math.min(200 * 2 ** (attempt - 1), 10_000);
      await new Promise((r) => setTimeout(r, base * (0.5 + Math.random() / 2)));
    }
  }
}
```

DB 안에서만 처리하려면 PL/pgSQL 의 `EXCEPTION WHEN lock_not_available` 블록(서브트랜잭션)으로 같은 루프를 만들 수 있다. 아래 3) 에서 확인했다.

## 직접 실행 (PostgreSQL 18.7)

임시 `postgres:18` 컨테이너(18.7, tmpfs). 테이블 `acct` 1,000 행. 세션 A 는 `BEGIN; SELECT count(*) FROM acct; SELECT pg_sleep(...)` 로 `ACCESS SHARE` 를 쥔다. 시간은 A 시작 기준 초.

### 1) lock_timeout 없음

| 세션 | 시작 | 끝 | 상태(3 초 시점) |
| --- | --- | --- | --- |
| A: SELECT 후 6 초 유지 | 0 | 6.1 | `AccessShareLock` 보유 |
| B: `ALTER TABLE acct ADD COLUMN memo text` | 1 | 6.1 | `AccessExclusiveLock` 대기, `pg_blocking_pids` = {A} |
| C: `SELECT count(*) FROM acct` | 2 | 6.1 | `AccessShareLock` 대기, `pg_blocking_pids` = **{B}** |
| D: `UPDATE acct ... WHERE id = 1` | 2 | 6.1 | `RowExclusiveLock` 대기, `pg_blocking_pids` = **{B}** |

C 의 `ACCESS SHARE` 는 A 와 충돌하지 않는데도 B 뒤에서 4 초를 기다렸다. 대기 원인을 볼 때는 `pg_blocking_pids(pid)` 가 A 가 아니라 B 를 가리킨다는 점을 기억한다.

### 2) B 에 `lock_timeout = '1s'`

| 세션 | 시작 | 끝 |
| --- | --- | --- |
| B | 1 | 2.1, `55P03: canceling statement due to lock timeout` |
| C: SELECT | 1.5 | 2.1 |
| A | 0 | 6.1 |

C 는 B 가 포기할 때까지만 기다렸다. **`lock_timeout` 은 뒤에 선 쿼리의 최대 추가 지연이기도 하다.** 2 초로 잡으면 트래픽이 많은 테이블은 매 시도마다 최대 2 초씩 멈춘다. 짧게 잡고 여러 번 시도하는 편이 낫다.

### 3) 여러 DDL 을 한 트랜잭션에 묶을 때

| 상황 | 결과 |
| --- | --- |
| B: `BEGIN; ALTER TABLE other ...; ALTER TABLE acct ...;`(타임아웃 없음), A 는 `acct` 를 5 초 보유 | B 가 `other` 의 `ACCESS EXCLUSIVE` 를 쥔 채 `acct` 를 기다림. **`other` 를 읽는 SELECT 도 5.1 초까지 멈춤** |
| 같은 트랜잭션에 `SET LOCAL lock_timeout = '500ms'` | 두 번째 ALTER 에서 `55P03`, 이후 `25P02 current transaction is aborted`. `other` 변경도 롤백됨 |
| `DO` 블록에서 `lock_timeout = '300ms'`, `EXCEPTION WHEN lock_not_available` 로 지수 백오프 재시도 | 1~4 번째 시도 타임아웃, A 가 끝난 직후 5 번째 성공. 재시도 사이 대기 중 `pg_locks` 를 5 번 샘플링했을 때 1 번은 대기 중인 `AccessExclusiveLock`(granted = false), 4 번은 **B 의 락이 없음** |

- 첫 줄이 "DDL 을 한 트랜잭션에 묶으면 안전하다"는 생각의 함정이다. 먼저 잡은 테이블의 강한 락을 다음 락을 기다리는 내내 쥔다. 트랜잭션에는 꼭 필요한 DDL 만 묶고, 테이블마다 나누는 편이 낫다.
- `DO` 블록 방식은 실패한 서브트랜잭션이 잡았던 락을 풀어 주므로 재시도 사이에 대기열을 만들지 않았다. 단 블록 **바깥** 트랜잭션이 이미 잡은 락은 그대로 남는다.

## 언제 쓰나

- 운영 중인 테이블에 `ACCESS EXCLUSIVE`·`SHARE ROW EXCLUSIVE` 를 잡는 모든 DDL: 열 추가·삭제, 기본값 변경, 제약 추가(NOT VALID 단계 포함), 인덱스 삭제, 트리거 생성, 파티션 분리.
- 테이블 크기와 무관하다. "금방 끝나는 DDL" 일수록 대기열 문제를 잊기 쉽다.
- 마이그레이션 도구가 트랜잭션을 자동으로 감싸는지 확인하고, 그 단위로 재시도한다.

## 주의 (비용)

- **lock_timeout 은 원인을 없애지 않는다.** 긴 트랜잭션이 계속 있으면 재시도가 모두 실패한다. 실패 시 `pg_stat_activity` 에서 `xact_start` 가 오래된 세션과 `pg_blocking_pids` 를 기록해 원인을 찾는다.
- **유휴 트랜잭션 제한**: 문서는 `idle_in_transaction_session_timeout` 이 유휴 세션이 락을 오래 쥐는 것을 막는 용도라고 설명한다. `transaction_timeout`(PostgreSQL 17 에서 추가)은 트랜잭션 시간이 한도를 넘으면 세션을 종료한다. 앱 롤에 걸어 DDL 이 기다릴 원인을 줄인다. 커넥션 풀 뒤에서 세션이 끊기는 영향은 확인한다.
- **재시도 횟수·총 시간 상한**을 둔다. 무한 재시도는 배포를 무기한 멈춘다. 상한에 닿으면 사람이 원인을 보고 다시 실행한다.
- **강한 락 아래의 긴 작업은 lock_timeout 으로 해결되지 않는다.** 락을 얻은 뒤 테이블 재작성·전체 검사가 길면 그동안 전부 막힌다. `NOT VALID`→`VALIDATE`, `CREATE INDEX CONCURRENTLY` 처럼 작업 자체를 약한 락으로 옮긴다 → [NOT VALID 와 VALIDATE](/develop-wiki/knowledge/data-modeling/postgresql-not-valid-validate-constraint/), [PostgreSQL 18 NOT NULL NOT VALID](/develop-wiki/knowledge/data-modeling/postgresql-18-not-enforced-not-null-not-valid/).
- **lock_timeout 과 statement_timeout 을 같게 두지 않는다.** 문서대로 문장 타임아웃이 먼저 터지면 락 대기와 실제 실행 지연을 구분할 수 없다.
- 행 락도 대상이다. 앱의 `SELECT ... FOR UPDATE` 에 lock_timeout 을 걸면 경합 시 오류가 늘어난다. 앱 쪽 재시도 정책과 같이 정한다 → [낙관적·비관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/).

## 비교

| 방법 | 기다리는 시간 | 뒤 쿼리 영향 | 비고 |
| --- | --- | --- | --- |
| 타임아웃 없음 | 무기한 | 막는 트랜잭션이 끝날 때까지 정지 | 1) |
| `lock_timeout` + 재시도 | 시도당 상한 | 시도당 최대 lock_timeout 만큼 정지 | 2), 3) |
| `NOWAIT` | 0 | 거의 없음 | 일부 명령만 지원(`LOCK TABLE`, `FOR UPDATE`, `ALTER TABLE ALL IN TABLESPACE`). 재시도가 더 자주 필요 |
| `statement_timeout` 만 | 문장 전체 상한 | 상한까지 정지 | 실행 시간과 락 대기를 구분 못함 |

## 검증 범위

PostgreSQL 18 문서의 Client Connection Defaults(`lock_timeout`, `statement_timeout`, `transaction_timeout`, `idle_in_transaction_session_timeout`), Explicit Locking(락 충돌, 무기한 대기 문장), `ALTER TABLE`(락 수준)을 2026-11-19 에 읽었다. 1)~3) 의 표는 임시 `postgres:18`(18.7) 컨테이너에서 직접 실행했다(`--rm`, tmpfs, 1,000 행). 시간은 셸에서 잰 벽시계 값으로 0.1 초 단위의 오차가 있다. TypeScript 예시 코드는 실행하지 않았다. 대기열 순서 자체는 문서에서 확인하지 못했고 실행 결과로만 말한다.

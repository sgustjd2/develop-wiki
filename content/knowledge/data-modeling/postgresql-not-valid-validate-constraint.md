---
title: PostgreSQL ADD CONSTRAINT ... NOT VALID 와 VALIDATE CONSTRAINT 의 락과 비용
aka: [NOT VALID, VALIDATE CONSTRAINT, convalidated, SHARE ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, 온라인 제약 추가, lock_timeout, lock queue]
category: data-modeling
level: advanced
summary: 기존 대형 테이블에 FK·CHECK 를 추가할 때 "새 행부터 강제(NOT VALID)"와 "기존 행 검사(VALIDATE)"를 나눠 쓰기 차단 시간을 줄이는 방법. 각 단계의 락 이름과 무엇을 막는지, 남는 비용을 직접 실행해 정리한다.
tags: [postgresql, migration, alter-table, not-valid, validate-constraint, locking, foreign-key, check-constraint, lock-timeout]
related: [data-modeling/zero-downtime-migration, data-modeling/postgresql-18-not-enforced-not-null-not-valid, data-modeling/postgresql-lock-timeout-ddl-retry, data-modeling/postgresql-foreign-key-deferrable-on-delete-cascade, data-modeling/postgresql-multitenant-composite-foreign-key, data-modeling/postgresql-for-no-key-update-foreign-key-design, data-modeling/mvcc-vacuum, data-modeling/autovacuum-tuning, data-modeling/optimistic-pessimistic-locking]
sources:
  - https://www.postgresql.org/docs/16/sql-altertable.html
  - https://www.postgresql.org/docs/16/explicit-locking.html
  - https://www.postgresql.org/docs/release/18.0/
updatedAt: 2026-11-19
---

## 문제

운영 중인 큰 테이블에 FK 나 CHECK 를 바로 추가하면 PostgreSQL 은 **기존 행 전부를 검사**한다. 그 검사가 끝나 커밋될 때까지 강한 락을 쥐고 있어서, 문서 표현대로 다른 갱신이 그동안 막힌다.

- FK 추가는 자식과 부모 테이블 모두에 `SHARE ROW EXCLUSIVE` 를 잡는다. 이 락은 `ROW EXCLUSIVE`(INSERT·UPDATE·DELETE)와 충돌한다. 검사 시간 = 쓰기 중단 시간이다.
- CHECK 추가는 대부분의 `ADD` 형태와 같이 `ACCESS EXCLUSIVE` 다. 검사하는 동안 SELECT 까지 막힌다.

## 해법

두 단계로 나눈다(PostgreSQL 16 `ALTER TABLE` 문서 기준).

```sql
-- 1단계: 제약을 만들되 기존 행은 검사하지 않음. 이후 INSERT/UPDATE 는 바로 검사됨
SET lock_timeout = '3s';
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk
  FOREIGN KEY (customer_id) REFERENCES customers NOT VALID;

-- (필요하면) 기존 위반 행 정리

-- 2단계: 기존 행 검사. 쓰기를 막지 않는 락
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
```

- `NOT VALID` 는 **FK 와 CHECK 에만** 쓸 수 있다. 테이블 검사를 건너뛰지만 이후 삽입·갱신에는 제약이 적용된다. DB 는 `VALIDATE` 전까지 기존 행이 제약을 만족한다고 가정하지 않는다.
- `VALIDATE CONSTRAINT` 는 테이블을 훑어 위반 행이 없는지 확인한다. 변경 대상 테이블에 `SHARE UPDATE EXCLUSIVE`, FK 라면 참조 테이블에 `ROW SHARE` 를 잡는다.
- 문서가 드는 이유: 다른 트랜잭션이 이미 자기가 쓰는 행에 제약을 적용하고 있으므로 검증은 기존 행만 보면 되고, 동시 갱신을 막을 필요가 없다.
- 위반 행이 있다는 걸 알 때도 유용하다. 일단 새 위반을 막아 두고 기존 위반을 고친 뒤 검증한다.
- 상태는 `pg_constraint.convalidated` 로 본다.

### 락 충돌 (문서의 표 기준, 관련 부분만)

| 락 | 잡는 명령(이 노트 관련) | 충돌하는 락 |
| --- | --- | --- |
| `ROW SHARE` | `SELECT ... FOR UPDATE/SHARE` 류, FK `VALIDATE` 의 참조 테이블 | `EXCLUSIVE`, `ACCESS EXCLUSIVE` |
| `ROW EXCLUSIVE` | INSERT, UPDATE, DELETE, MERGE | `SHARE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, `ACCESS EXCLUSIVE` |
| `SHARE UPDATE EXCLUSIVE` | `VALIDATE CONSTRAINT`, VACUUM(FULL 제외), ANALYZE, `CREATE INDEX CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE`, `SHARE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, `ACCESS EXCLUSIVE` |
| `SHARE ROW EXCLUSIVE` | FK 추가(양쪽 테이블) | `ROW EXCLUSIVE`, `SHARE UPDATE EXCLUSIVE`, `SHARE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, `ACCESS EXCLUSIVE` |
| `ACCESS EXCLUSIVE` | 대부분의 `ALTER TABLE ADD`(CHECK 포함) | 전부 |

## 직접 실행

PostgreSQL 16.15 임시 컨테이너(`postgres:16`, tmpfs, `fsync=off`). 부모 `p` 1,000 행, 자식 `c` 500 만 행(인덱스 포함 352 MB, `p_id` 인덱스 있음).

### 1) 각 명령이 실제로 잡는 락

트랜잭션 안에서 명령을 실행한 뒤 같은 세션의 `pg_locks` 를 조회하고 롤백했다.

| 명령 | 자식 `c` | 부모 `p` |
| --- | --- | --- |
| `ADD FOREIGN KEY`(즉시 검증) | `ShareRowExclusiveLock`, `AccessShareLock` | `ShareRowExclusiveLock`, `RowShareLock`, `AccessShareLock` |
| `ADD FOREIGN KEY ... NOT VALID` | `ShareRowExclusiveLock`, `AccessShareLock` | `ShareRowExclusiveLock`, `AccessShareLock` |
| `VALIDATE CONSTRAINT`(FK) | `ShareUpdateExclusiveLock`, `AccessShareLock` | `RowShareLock`, `AccessShareLock` |
| `ADD CHECK ... NOT VALID` | **`AccessExclusiveLock`** | — |
| `VALIDATE CONSTRAINT`(CHECK) | `ShareUpdateExclusiveLock` | — |

- **NOT VALID 도 락 자체는 같다.** FK 는 여전히 `SHARE ROW EXCLUSIVE`, CHECK 는 `ACCESS EXCLUSIVE` 다. 달라지는 것은 그 락을 쥐는 **시간**(검사 없이 즉시 커밋)이다.

### 2) 시간 (3 회)

| 작업 | FK | CHECK `qty >= 0` |
| --- | --- | --- |
| 즉시 추가(검사 포함) | 195~221 ms | 90~98 ms |
| `NOT VALID` 추가 | 0.1~0.3 ms | 0.1~0.2 ms |
| `VALIDATE CONSTRAINT` | 192~212 ms | 91~99 ms |

검사 비용은 사라지지 않는다. 같은 일을 **쓰기를 막지 않는 락** 아래로 옮긴다. 이 규모에서는 둘 다 짧지만, 강한 락 아래의 시간이 테이블 크기에 비례하느냐 아니냐가 차이다.

### 3) 동시 세션

| 상황 | 결과 |
| --- | --- |
| 세션 A 가 `c` 에 INSERT 후 커밋하지 않음. 세션 B 가 `lock_timeout = '2s'` 로 `ADD FK ... NOT VALID` | 2.0 초 후 `canceling statement due to lock timeout` |
| 같은 상황, B 에 `lock_timeout` 없음. 그 뒤 세션 C 가 `c` 에 INSERT, 세션 D 가 `c` 를 SELECT | B 는 A 가 끝날 때까지 약 5.0 초 대기. **C 의 INSERT 도 B 뒤에서 약 4.0 초 대기**(`wait_event = relation`). D 의 SELECT 는 0.7 ms |
| B 가 `VALIDATE CONSTRAINT`(FK)를 실행하고 트랜잭션을 6 초 열어 둠. 다른 세션이 `lock_timeout = '1s'` 로 실행 | 자식 INSERT 1.2 ms, 자식 UPDATE 0.2 ms, 부모 INSERT·DELETE(참조 없는 행)·비키 열 UPDATE 각 0.1~0.2 ms. **`VACUUM c` 와 `CREATE INDEX CONCURRENTLY` 는 1 초 후 lock timeout** |

- **락 대기열**: NOT VALID 의 락은 짧지만, 그 락을 얻으려고 **기다리는 동안** 뒤에 온 쓰기가 줄줄이 막힌다. 긴 트랜잭션 하나가 있으면 "즉시 끝나는 DDL"이 장애가 된다. 그래서 `lock_timeout` 을 걸고 실패하면 재시도한다.
- **VALIDATE 는 쓰기를 막지 않지만** 같은 테이블의 VACUUM, ANALYZE, `CREATE INDEX CONCURRENTLY`, 다른 VALIDATE 와는 서로 막는다(`SHARE UPDATE EXCLUSIVE` 는 자기 자신과 충돌). 큰 테이블에서 검증이 오래 걸리면 그동안 VACUUM 이 못 돈다 → [MVCC·VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/).

### 4) 의미

| 상황 | 결과 |
| --- | --- |
| NOT VALID FK 에 없는 부모를 참조하는 새 행 INSERT | `violates foreign key constraint` (바로 강제) |
| NOT VALID CHECK 에 위반하는 새 행 INSERT | `violates check constraint` |
| 기존 위반 행이 있는 상태로 VALIDATE(CHECK) | `check constraint "c_qty_ck" of relation "c" is violated by some row`, 위반 행을 고친 뒤 성공 |
| 기존 위반 행(qty = −5)에 **무관한 열**만 UPDATE | `new row ... violates check constraint` — 행 전체가 다시 검사된다 |
| 파티션 테이블에 `ADD FOREIGN KEY ... NOT VALID`(16) | `cannot add NOT VALID foreign key on partitioned table` |

- 넷째 줄이 함정이다. NOT VALID CHECK 를 건 뒤에는 **기존 위반 행을 고치지 않으면 그 행의 어떤 UPDATE 도 실패**한다. 위반 행 정리를 NOT VALID 직후에 바로 한다.

## 버전별

- PostgreSQL 16 문서: 파티션 테이블의 FK 는 아직 `NOT VALID` 로 선언할 수 없다(위 실험과 일치).
- PostgreSQL 18 릴리스 노트: 파티션 테이블에 `NOT VALID` FK 를 허용하고, `ALTER TABLE` 로 `NOT NULL` 제약에 `NOT VALID` 를 설정할 수 있게 됐다. CHECK·FK 를 `NOT ENFORCED` 로 선언하는 기능도 추가됐다. 이 노트의 표는 16 기준이고, 18.7 에서 직접 실행한 NOT NULL NOT VALID·NOT ENFORCED 의 락과 함정은 [PostgreSQL 18 의 NOT ENFORCED 와 NOT NULL NOT VALID](/develop-wiki/knowledge/data-modeling/postgresql-18-not-enforced-not-null-not-valid/)에 정리했다.
- 16 에서 `NOT NULL` 을 무중단으로 추가하는 우회(`CHECK (col IS NOT NULL) NOT VALID` → VALIDATE → `SET NOT NULL` 이 유효한 CHECK 를 보고 스캔 생략)는 [무중단 마이그레이션](/develop-wiki/knowledge/data-modeling/zero-downtime-migration/)에 정리돼 있다. 문서는 유효한 CHECK 가 NULL 이 없음을 증명하면 스캔을 건너뛴다고 설명한다.

## 언제 쓰나

- 쓰기가 계속 들어오는 큰 테이블에 FK·CHECK 를 새로 걸 때.
- 기존 데이터에 위반이 섞여 있을지 모를 때. 새 위반부터 막고 기존 위반은 따로 정리한다.
- 마이그레이션 도구가 한 트랜잭션에 묶어 실행하는 경우, NOT VALID 와 VALIDATE 를 **다른 트랜잭션(다른 마이그레이션)**으로 나눌 수 있을 때. 같은 트랜잭션이면 강한 락을 VALIDATE 끝까지 쥐게 되어 의미가 없다.
- 작은 테이블은 그냥 추가해도 된다. 위 500 만 행에서도 즉시 추가가 0.2 초였다. 락 대기열 문제는 크기와 무관하므로 `lock_timeout` 은 여전히 건다.

## 주의 (비용)

- **NOT VALID 단계도 강한 락을 잡는다.** CHECK 는 `ACCESS EXCLUSIVE`, FK 는 양쪽 테이블에 `SHARE ROW EXCLUSIVE`. 긴 트랜잭션·긴 쿼리가 있으면 락을 기다리며 대기열을 만든다(3 번). `lock_timeout` 과 재시도가 사실상 필수다.
- **FK 는 부모 테이블도 잠근다.** 부모가 쓰기가 많은 테이블이면 부모 쪽 대기열도 생긴다.
- **VALIDATE 는 공짜가 아니다.** 전체 스캔(FK 는 참조 조인)과 I/O 를 쓴다. 그동안 같은 테이블의 VACUUM·ANALYZE·CIC 가 막힌다. 자동 VACUUM 이 밀리는 시간대를 피한다.
- **검증 전 상태를 믿으면 안 된다.** `convalidated = false` 인 제약은 기존 행을 보장하지 않는다. 검증을 잊은 NOT VALID 제약이 남지 않게 `convalidated` 를 점검한다.
- **기존 위반 행의 UPDATE 실패**(4 번 표). 앱이 그 행을 건드리는 순간 오류가 난다.
- **같은 트랜잭션 금지**: `BEGIN; ADD ... NOT VALID; VALIDATE ...; COMMIT;` 은 첫 명령의 강한 락을 끝까지 쥔다.
- 여러 하위 명령을 한 `ALTER TABLE` 에 묶으면 가장 강한 락을 잡는다(문서). FK 추가에 다른 변경을 붙이면 `ACCESS EXCLUSIVE` 가 될 수 있다.
- 파티션 테이블 FK 는 16 이하에서 NOT VALID 불가. 파티션별로 나누거나 18 을 검토한다.

## 비교

| 방식 | 강한 락 보유 시간 | 쓰기 차단 | 기존 행 보장 |
| --- | --- | --- | --- |
| `ADD CONSTRAINT`(즉시) | 전체 검사 시간 | 검사 내내 | 커밋 시 보장 |
| `NOT VALID` → `VALIDATE` | 잠깐(+ 락 대기) | 락 대기 동안만 | VALIDATE 후 보장 |
| 트리거·앱 검사 | 없음 | 없음 | 보장 없음, 경쟁 조건 |

## 검증 범위

PostgreSQL 16 문서의 `ALTER TABLE`(NOT VALID, VALIDATE CONSTRAINT, 락 수준, Notes)과 Explicit Locking(테이블 락 충돌표), PostgreSQL 18 릴리스 노트의 제약 관련 항목을 읽었다. 1~4 번 표는 임시 `postgres:16`(16.15) 컨테이너에서 직접 실행했다(`--rm`, tmpfs, `fsync=off`, 단일 머신). 시간은 소규모·캐시 상태라 참고용이다. 17·18 버전 실행, 레플리카에서의 영향(WAL·복제 지연), 매우 큰 테이블(수억 행)에서의 VALIDATE 시간, 유효하지 않은 제약을 플래너가 쓰는지는 확인하지 않았다.

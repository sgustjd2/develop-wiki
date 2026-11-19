---
title: PostgreSQL 18 의 NOT ENFORCED 제약과 NOT NULL ... NOT VALID
aka: [NOT ENFORCED, ENFORCED, conenforced, NOT NULL NOT VALID, ALTER CONSTRAINT ENFORCED, informational constraint, 비강제 제약, pg_constraint NOT NULL]
category: data-modeling
level: advanced
summary: PostgreSQL 18 에서 추가된 두 기능. 검사하지 않는 문서용 FK·CHECK(NOT ENFORCED)와, 기존 행 검사 없이 NOT NULL 을 거는 NOT VALID. 실제 동작·락·함정을 18.7 에서 직접 실행해 정리한다.
tags: [postgresql, postgresql-18, not-enforced, not-null, not-valid, constraints, migration, locking, foreign-key, check-constraint]
related: [data-modeling/postgresql-not-valid-validate-constraint, data-modeling/zero-downtime-migration, data-modeling/postgresql-lock-timeout-ddl-retry, data-modeling/postgresql-foreign-key-deferrable-on-delete-cascade, data-modeling/normalization]
sources:
  - https://www.postgresql.org/docs/release/18.0/
  - https://www.postgresql.org/docs/18/sql-createtable.html
  - https://www.postgresql.org/docs/18/sql-altertable.html
updatedAt: 2026-11-19
---

## 문제

- **문서용 제약**: 분석 DB·적재 테이블에서는 FK·CHECK 검사 비용이 부담이지만, 관계를 스키마에 남겨 두고 싶다(도구가 ER 다이어그램을 그리거나 사람이 읽도록). 지금까지는 제약을 아예 빼거나 주석으로만 남겼다.
- **NOT NULL 추가**: 큰 테이블에 `SET NOT NULL` 을 걸면 `ACCESS EXCLUSIVE` 아래에서 전체를 스캔한다. 17 까지의 우회는 `CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE` → `SET NOT NULL`(유효한 CHECK 가 있으면 스캔 생략) → CHECK 삭제였다 → [무중단 마이그레이션](/develop-wiki/knowledge/data-modeling/zero-downtime-migration/).

## PostgreSQL 18 에서 바뀐 것 (릴리스 노트)

- CHECK 와 외래 키를 `NOT ENFORCED` 로 선언할 수 있다. `pg_constraint.conenforced` 열이 추가됐다.
- 열의 NOT NULL 이 `pg_constraint` 에 저장된다. 이름을 붙일 수 있다.
- `ALTER TABLE` 로 NOT NULL 제약에 `NOT VALID` 를 설정할 수 있다.
- 파티션 테이블에 `NOT VALID` 외래 키를 허용한다.

문서(CREATE TABLE): `NOT ENFORCED` 면 시스템이 제약을 검사하지 않고 만족 여부는 앱 책임이다. 결과의 정확성에 영향이 없는 범위에서는 최적화에 데이터가 제약을 만족한다고 가정할 수도 있다고 적혀 있다. 현재 FK 와 CHECK 만 지원한다.

## 직접 실행 (PostgreSQL 18.7)

임시 `postgres:18` 컨테이너(18.7, tmpfs). `cust`(2 행), `ord`(200,000 행, `note` 열 200 행이 NULL).

### 1) NOT ENFORCED

```sql
ALTER TABLE ord ADD CONSTRAINT ord_cust_fk FOREIGN KEY (cust_id) REFERENCES cust NOT ENFORCED;
ALTER TABLE ord ADD CONSTRAINT ord_amt_ck CHECK (amount >= 0) NOT ENFORCED;
```

| 확인 | 결과 |
| --- | --- |
| `pg_constraint` | 두 제약 모두 `conenforced = f`, `convalidated = f` |
| 없는 고객 99, 금액 −5 INSERT | 들어감 |
| 부모 `cust` 행 삭제 | 성공. 고아 행 100,000 개가 남음 |
| FK 의 내부 트리거(`pg_trigger`) | **0 개**. 검사·연쇄 동작 비용이 없다 |
| 부모에 UNIQUE 없는 열을 NOT ENFORCED FK 로 참조 | `there is no unique constraint matching given keys` — 선언 요건은 그대로 |
| `VALIDATE CONSTRAINT` | `cannot validate NOT ENFORCED constraint` |
| `UNIQUE (a) NOT ENFORCED` | `UNIQUE constraints cannot be marked NOT ENFORCED` |
| `NOT NULL NOT ENFORCED` | `misplaced NOT ENFORCED clause` |
| `CHECK ... NOT ENFORCED NOT VALID` | 허용, `conenforced = f, convalidated = f` |
| `\d`, `pg_dump -s` | `... NOT ENFORCED` 로 표시·덤프됨 |

**강제로 전환**:

| 명령 | 결과 |
| --- | --- |
| `ALTER CONSTRAINT ord_cust_fk ENFORCED`(위반 행 있음) | `violates foreign key constraint` — 전환 시 기존 행을 검사한다 |
| 같은 명령(위반 없음), 트랜잭션 안에서 `pg_locks` | `ord`: **`AccessExclusiveLock`** + `ShareRowExclusiveLock`, `cust`: `ShareRowExclusiveLock` + `RowShareLock`(검사 쿼리의 `AccessShareLock` 은 생략). 결과 `conenforced = t, convalidated = t` |
| `ALTER CONSTRAINT ... ENFORCED NOT VALID` | `constraints cannot be altered to be NOT VALID` |
| `ALTER CONSTRAINT ord_cust_fk NOT ENFORCED` | 양쪽 테이블에 `AccessExclusiveLock` |
| `ALTER CONSTRAINT ord_amt_ck ENFORCED`(CHECK) | `cannot alter enforceability of constraint "ord_amt_ck"` — 18.7 에서 CHECK 는 전환 불가 |

- 일반 `ADD FOREIGN KEY ... NOT VALID` 는 자식에 `ShareRowExclusiveLock` 까지만 잡는다(같은 실행에서 비교). **NOT ENFORCED → ENFORCED 전환은 그보다 강한 락 아래에서 전체 검사**를 한다. 큰 테이블이면 전환 대신 "NOT ENFORCED 제약 삭제 → `ADD ... NOT VALID` → `VALIDATE`" 순서가 쓰기를 덜 막는다 → [NOT VALID 와 VALIDATE](/develop-wiki/knowledge/data-modeling/postgresql-not-valid-validate-constraint/).

**옵티마이저**: `constraint_exclusion = on` 에서 `CHECK (a > 0)` 이 강제 제약이면 `WHERE a < 0` 이 `One-Time Filter: false`(스캔 생략)로 계획됐다. 같은 CHECK 가 NOT ENFORCED 면 Seq Scan 을 했고, 실제로 들어 있던 `a = −1` 행이 반환됐다. 비강제 CHECK 를 근거로 행을 잘라내지는 않았다. 다른 최적화(조인 제거 등)에서의 쓰임은 확인하지 않았다.

### 2) NOT NULL ... NOT VALID

```sql
ALTER TABLE ord ADD CONSTRAINT ord_note_nn NOT NULL note NOT VALID;  -- 테이블 제약 형식
ALTER TABLE ord VALIDATE CONSTRAINT ord_note_nn;
```

| 확인 | 결과 |
| --- | --- |
| `ADD ... NOT NULL note NOT VALID` 의 락 | `AccessExclusiveLock`(스캔 없이 즉시 끝남) |
| 직후 `pg_constraint` | `contype = n`, `convalidated = f` |
| 직후 `pg_attribute.attnotnull`, `\d ord` | **`t`, "not null" 로 표시** — NULL 이 200 행 남아 있는데도 |
| 새 NULL INSERT | `violates not-null constraint` |
| 기존 NULL 행의 **다른 열** UPDATE | 같은 오류. 행 전체가 다시 검사된다 |
| `WHERE note IS NULL` 계획·결과 | 검증 전: Seq Scan, 200 행. 검증 후: `One-Time Filter: false` |
| NULL 이 남은 상태로 VALIDATE | `column "note" of relation "ord" contains null values` |
| NULL 정리 후 VALIDATE 의 락 | `ShareUpdateExclusiveLock`(쓰기를 막지 않음) |
| 무효 NOT NULL 이 있는 열에 `SET NOT NULL` | 성공하고 검증됨. 단 `AccessExclusiveLock` 아래 |
| `ALTER COLUMN amount SET NOT NULL NOT VALID` | 문법 오류. 열 형식에는 NOT VALID 가 없다 |
| 무효 상태로 `pg_dump -s` | `ADD CONSTRAINT d_b_nn NOT NULL b NOT VALID;` 로 덤프됨 |

- 순서: `ADD CONSTRAINT ... NOT NULL col NOT VALID`(짧은 강한 락) → NULL 정리 → `VALIDATE CONSTRAINT`(약한 락). 17 까지의 CHECK 우회보다 한 단계 적고 정리할 CHECK 가 남지 않는다.
- 마지막 단계를 `SET NOT NULL` 로 하면 강한 락 아래서 검증하므로 의미가 없다. `VALIDATE` 를 쓴다.

## 언제 쓰나

- **NOT ENFORCED**: 적재가 끝난 분석 테이블, 외부 시스템이 무결성을 책임지는 복제본에서 관계를 스키마에 남기고 싶을 때. 나중에 강제할 계획이 있으면 처음부터 `NOT VALID` 가 낫다(검사는 새 행부터 바로 시작).
- **NOT NULL NOT VALID**: 18 이상에서 쓰기가 많은 큰 테이블에 NOT NULL 을 추가할 때.

## 주의 (비용)

- **NOT ENFORCED 는 무결성을 보장하지 않는다.** 고아 행·음수 금액이 그대로 들어간다. 읽는 사람이 `\d` 의 FK 를 보고 보장된다고 오해할 수 있다. `NOT ENFORCED` 표시를 확인한다.
- **전환 비용**: NOT ENFORCED → ENFORCED 는 자식 테이블에 `ACCESS EXCLUSIVE` 를 잡고 검사한다(18.7 실측). 단계적 강제(NOT VALID → VALIDATE)로 가려면 제약을 다시 만들어야 한다.
- **CHECK 는 18.7 에서 강제 여부를 바꿀 수 없다.** 다시 만들어야 한다. `ALTER TABLE` 문서도 ALTER CONSTRAINT 로는 현재 FK 만 변경할 수 있다고 적는다.
- **무효 NOT NULL 의 착시**: `attnotnull` 과 `\d` 가 "not null" 이라고 보여 주지만 기존 NULL 이 남아 있을 수 있다. `pg_attribute.attnotnull` 만 보는 도구·ORM 은 열을 NOT NULL 로 믿는다. 판단은 `pg_constraint.convalidated` 로 한다.
- **기존 NULL 행의 UPDATE 실패**: NOT VALID 직후부터 NULL 행을 건드리는 모든 UPDATE 가 실패한다. 정리 작업을 바로 이어서 한다.
- `ADD ... NOT VALID` 자체는 `ACCESS EXCLUSIVE` 다. 긴 트랜잭션이 있으면 락 대기열을 만든다. `lock_timeout` 과 재시도 → [lock_timeout 과 DDL 재시도](/develop-wiki/knowledge/data-modeling/postgresql-lock-timeout-ddl-retry/).
- **버전 의존**: 덤프에 `NOT ENFORCED`, `NOT NULL ... NOT VALID` 가 들어가면 17 이하 서버로는 복원되지 않는다(17 이하에서는 실행하지 않았다).
- `ALTER TABLE` 문서의 ALTER CONSTRAINT 설명은 "FK 만 변경 가능"과 "NOT NULL 만(INHERIT)" 문장이 함께 있어 범위가 헷갈린다. 실제 동작은 위 표로 확인했다.

## 비교

| 방법 | 기존 행 | 새 행 | 강한 락 아래 스캔 | 버전 |
| --- | --- | --- | --- | --- |
| `ADD CONSTRAINT`(즉시) | 검사 | 검사 | 있음 | 전부 |
| `ADD ... NOT VALID` → `VALIDATE` | VALIDATE 때 검사 | 검사 | 없음 | FK·CHECK: 오래전부터, NOT NULL: 18+ |
| `NOT ENFORCED` | 검사 안 함 | 검사 안 함 | 없음 | FK·CHECK: 18+ |
| NOT ENFORCED → `ALTER CONSTRAINT ENFORCED` | 전환 때 검사 | 검사 | **있음**(18.7) | FK: 18+ |

## 검증 범위

PostgreSQL 18.0 릴리스 노트(제약 항목), 18 문서의 `CREATE TABLE`(ENFORCED/NOT ENFORCED)과 `ALTER TABLE`(NOT VALID, VALIDATE CONSTRAINT, ALTER CONSTRAINT, SET NOT NULL)을 2026-11-19 에 읽었다. 표의 결과는 모두 임시 `postgres:18`(18.7) 컨테이너에서 직접 실행했다(`--rm`, tmpfs). 큰 테이블(수백만 행 이상)에서의 시간, 파티션·상속 테이블의 NOT NULL NOT VALID, 17 이하 복원은 실행하지 않았다.

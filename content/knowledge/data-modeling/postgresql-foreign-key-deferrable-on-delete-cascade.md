---
title: PostgreSQL 외래 키 DEFERRABLE 과 ON DELETE CASCADE 의 비용
aka: [DEFERRABLE INITIALLY DEFERRED, SET CONSTRAINTS, ON DELETE CASCADE, 지연 제약, 연쇄 삭제, 참조 동작, referential actions, 순환 외래 키]
category: data-modeling
level: advanced
summary: 외래 키 검사를 트랜잭션 끝으로 미루는 DEFERRABLE 과 부모 삭제 시 자식을 같이 지우는 ON DELETE CASCADE 가 무엇을 바꾸고 무엇을 바꾸지 못하는지, 인덱스·메모리·커밋 지연·삭제 범위 비용을 직접 실행해 정리한다.
tags: [postgresql, foreign-key, deferrable, on-delete-cascade, set-constraints, referential-integrity, index, transaction, schema-design]
related: [data-modeling/postgresql-for-no-key-update-foreign-key-design, data-modeling/postgresql-multixact-wraparound-row-locks, data-modeling/index-design, data-modeling/mvcc-vacuum, data-modeling/table-bloat-postgresql, data-modeling/transaction-isolation, data-modeling/zero-downtime-migration, data-modeling/explain-analyze, data-modeling/optimistic-pessimistic-locking, data-modeling/postgresql-multitenant-composite-foreign-key, data-modeling/postgresql-not-valid-validate-constraint]
sources:
  - https://www.postgresql.org/docs/16/ddl-constraints.html
  - https://www.postgresql.org/docs/16/sql-createtable.html
  - https://www.postgresql.org/docs/16/sql-set-constraints.html
updatedAt: 2026-11-19
---

## 문제

외래 키(FK)를 쓰면 두 가지 불편이 곧 나온다.

- **삽입 순서**: 기본 FK 는 문장이 끝날 때마다 검사한다. 부모와 자식을 한 트랜잭션에 넣을 때 순서를 지켜야 하고, 서로를 참조하는(순환) 테이블은 순서만으로 넣을 수 없다.
- **삭제 연쇄**: 부모를 지울 때 자식을 어떻게 할지 정해야 한다. 앱이 직접 지우자니 코드가 번지고, DB 에 맡기자니(`ON DELETE CASCADE`) 어디까지 지워지는지 보이지 않는다.

PostgreSQL 은 앞쪽에 **DEFERRABLE**, 뒤쪽에 **참조 동작**(`NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`)을 둔다. 둘 다 "공짜 편의"가 아니라 검사 시점·잠금·실행 비용을 바꾼다.

## 해법

### DEFERRABLE (공식 문서 기준)

- FK, `UNIQUE`, `PRIMARY KEY`, `EXCLUDE` 제약에 쓸 수 있다. `NOT NULL` 과 `CHECK` 는 불가.
- 세 가지 상태: `NOT DEFERRABLE`(기본, 항상 즉시), `DEFERRABLE INITIALLY IMMEDIATE`(문장 끝 검사, 필요하면 미룸), `DEFERRABLE INITIALLY DEFERRED`(트랜잭션 끝 검사).
- `SET CONSTRAINTS { ALL | 이름… } { DEFERRED | IMMEDIATE }` 는 **현재 트랜잭션**에서만 바꾼다. DEFERRED → IMMEDIATE 로 바꾸면 쌓인 위반이 그 순간 검사된다(소급).
- 참조 동작 중 `NO ACTION` 만 미룰 수 있다. 문서가 "다른 참조 동작은 DEFERRABLE 이어도 미룰 수 없다"고 한다.
- 지연 가능한 UNIQUE 는 `ON CONFLICT` 의 중재자(arbiter)가 될 수 없다. FK 가 참조하는 대상 키는 지연 불가여야 한다.

### ON DELETE 동작 (공식 문서 기준)

| 동작 | 부모 삭제 시 | 지연 |
| --- | --- | --- |
| `NO ACTION`(기본) | 참조하는 자식이 남아 있으면 오류 | 가능(검사 시점에 판정) |
| `RESTRICT` | 위와 같되 즉시 | 불가 |
| `CASCADE` | 참조하는 자식 행을 같이 삭제 | 불가 |
| `SET NULL [(열…)]` | 자식의 FK 열을 NULL (열 지정은 ON DELETE 에서만) | 불가 |
| `SET DEFAULT [(열…)]` | 자식의 FK 열을 기본값으로(그 값의 부모가 있어야 함) | 불가 |

문서의 선택 지침: 자식이 부모의 **구성 요소**(주문과 주문 항목)이면 `CASCADE` 가 적절할 수 있고, **독립된 객체**(상품과 주문)면 `RESTRICT`/`NO ACTION` 으로 두어 앱이 둘을 명시적으로 지우게 하는 편이 낫다.

## 직접 실행: DEFERRABLE 동작

PostgreSQL 16.15 임시 컨테이너(`postgres:16`, 데이터 디렉터리 tmpfs, `fsync=off`). 한 세션에서 순서대로 실행한 결과다.

| # | 상황 | 결과 |
| --- | --- | --- |
| 1 | 기본 FK, 자식을 부모보다 먼저 INSERT | 문장 직후 `violates foreign key constraint` |
| 2 | `DEFERRABLE INITIALLY IMMEDIATE`, 기본 모드 | 1 번과 같음(미루려면 `SET CONSTRAINTS`) |
| 3 | `SET CONSTRAINTS … DEFERRED` 후 자식 → 부모 순 INSERT, COMMIT | 성공 |
| 4 | DEFERRED 인데 부모 없이 자식만 INSERT 후 COMMIT | INSERT 는 성공, **COMMIT 에서** 오류, 행은 롤백 |
| 5 | DEFERRED 로 위반을 쌓은 뒤 `SET CONSTRAINTS … IMMEDIATE` | 그 명령에서 즉시 오류(소급 검사) |
| 6 | `NOT DEFERRABLE` 제약에 `SET CONSTRAINTS … DEFERRED` | `constraint "…" is not deferrable` |
| 7 | 서로를 참조하는 두 테이블(`a.b_id → b`, `b.a_id → a`), 둘 다 INITIALLY DEFERRED | 한 트랜잭션에서 (1,1) 쌍 삽입 성공 |
| 8 | `ON DELETE CASCADE` + `DEFERRABLE INITIALLY DEFERRED`, 부모 삭제 직후 자식 수 조회 | **0**: 연쇄 삭제는 미뤄지지 않고 바로 일어남 |
| 9 | `ON DELETE RESTRICT` + DEFERRABLE INITIALLY DEFERRED, 자식이 있는 부모 삭제 | 삭제 문장에서 **즉시** 오류 |
| 9b | `NO ACTION` + INITIALLY DEFERRED, 부모를 지우고 자식도 같은 트랜잭션에서 삭제 | 성공 |
| 10 | `DEFERRABLE` UNIQUE 를 `ON CONFLICT (k)` 또는 `ON CONSTRAINT` 로 지정 | `ON CONFLICT does not support deferrable unique constraints/exclusion constraints as arbiters` |
| 11 | `UPDATE t SET k = k + 1`(k UNIQUE): 지연 불가 vs `DEFERRABLE INITIALLY IMMEDIATE` | 지연 불가는 `duplicate key` 오류, DEFERRABLE 은 성공 |
| 12 | 지연 가능한 UNIQUE 를 참조하는 FK 생성 | `cannot use a deferrable unique constraint for referenced table` |
| 13 | `CHECK … DEFERRABLE` | `CHECK constraints cannot be marked DEFERRABLE` |
| 14 | 기존 FK 에 `ALTER TABLE … ALTER CONSTRAINT … DEFERRABLE INITIALLY DEFERRED` | 성공(`pg_constraint.condeferrable`, `condeferred` 가 모두 `t`) |

표의 8, 9, 10, 12, 13 은 공식 문서의 서술을 그대로 확인한 것이다. 14 는 문서(`ALTER TABLE`)를 읽지 않고 관측만 했다.

### 비용: 검사를 미루면 생기는 것

한 트랜잭션에서 1,000 문장 × 1,000 행 = 자식 100 만 행을 삽입했다(부모 1,000 행). 같은 조건을 3 회 교차 실행했다. 시간은 밀리초이고 `AfterTriggerEvents` 는 COMMIT 직전 세션의 `pg_backend_memory_contexts` 값이다.

| FK 설정 | 삽입 구간 | COMMIT | 합계 | AfterTriggerEvents |
| --- | --- | --- | --- | --- |
| FK 없음 | 808~875 | 0~39 | 약 0.8~0.9 초 | 0 |
| 즉시 검사 | 1,656~2,035 | 0~38 | 약 1.7~2.0 초 | 0.0 MB |
| `INITIALLY DEFERRED` | 824~1,135 | 1,222~1,254 | 약 2.0~2.4 초 | 12.0 MB |

- 총 시간은 즉시 검사와 크게 다르지 않았다. 지연이 **빠르지는 않다.** 검사 비용이 사라지는 것이 아니라 **COMMIT 으로 옮겨 간다**(여기서는 약 1.2 초가 COMMIT 한 번에 몰렸다).
- 지연 검사는 변경된 행마다 이벤트를 큐에 쌓는다. 100 만 행에서 12 MB 였고, 커지는 트랜잭션일수록 비례해서 늘어난다(더 큰 규모는 측정하지 않았다).
- COMMIT 시점의 오류(4 번)는 어느 문장이 원인인지 알려 주지 않는다. 앱의 오류 처리와 재시도 계층이 COMMIT 에서 나는 제약 위반을 받을 수 있어야 한다.
- 이 harness 는 단일 컨테이너, `fsync=off`, 행당 단순 삽입이다. 절대 시간은 의미가 작고 비교용이다.

## 직접 실행: ON DELETE CASCADE 의 비용

부모 `pa` 10,000 행, 자식 `ch` 500,000 행(`pa_id` FK, 부모당 약 50), 손자 `gc` 1,000,000 행(`ch_id` FK). 두 FK 모두 `ON DELETE CASCADE`. 삭제는 `EXPLAIN (ANALYZE)` 후 롤백.

| 상황 | 결과 |
| --- | --- |
| 부모 100 행 삭제(자식 5,000 · 손자 10,000), 두 FK 열에 **인덱스 있음** | 실행 9.5 ms. FK 트리거 호출 100 회와 5,000 회 |
| 위 삭제를 명시적 집합 삭제(`gc`, `ch`, `pa` 순)로 대체 | 합계 약 43 ms (36 + 6 + 1, 이 경우는 플랜을 확인하지 않음) |
| 부모 5,000 행 삭제(자식 250,000 · 손자 500,000) CASCADE | 약 597 ms. 트리거 호출 5,000 회와 250,000 회 |
| 같은 범위를 명시적 집합 삭제 | 약 267 + 391 + 43 = 701 ms (첫 삭제는 `gc` 를 전체 스캔하는 해시 조인, 2·3 번째 삭제에서도 FK 트리거가 각각 250,000, 5,000 회 호출) |
| 손자 `ch_id` 인덱스 **제거**, 부모 5 행 삭제(자식 250 · 손자 500) | **약 4,819 ms**, 손자 쪽 트리거 250 회 호출 |
| 자식 `pa_id` 인덱스도 제거, 부모 1 행 삭제(자식 50) | 약 974 ms (자식 쪽 트리거 1 회에 9 ms, 손자 쪽 50 회에 965 ms) |
| 부모 1 행에 자식 200,030 · 손자 400,060 | 삭제 문장 하나, 약 317 ms, WAL 28 MB |
| 자식 테이블의 행 단위 `AFTER DELETE` 트리거 | 연쇄로 지워진 3 행에서 3 번 발동 |

- **FK 트리거는 삭제된 부모 행마다** 한 번씩 돈다. 자식이 하나도 없어도 호출된다(명시적 삭제 경로에서도 호출 수가 같았다). `CASCADE` 자체가 명시적 집합 삭제보다 눈에 띄게 비싸지는 않았다. 인덱스가 있을 때 이 규모에서는 비슷하거나 약간 빨랐다. 차이는 한 번 측정한 값이라 방향성만 본다.
- 비용이 폭발하는 곳은 **자식 FK 열에 인덱스가 없을 때**다. 연쇄 단계마다 자식 테이블을 훑는다. 문서도 참조 열에 인덱스를 두라고 권한다(FK 선언이 인덱스를 자동으로 만들지 않는다). 앞선 노트의 인덱스 유무 실험과 같은 결론이다 → [FOR NO KEY UPDATE 와 FK 설계](/develop-wiki/knowledge/data-modeling/postgresql-for-no-key-update-foreign-key-design/).
- **한 문장, 한 트랜잭션**으로 60 만 행이 지워졌다. 잠금, WAL, 복제 지연, 사후 `VACUUM` 부담이 모두 그 한 번에 몰린다. 테이블이 클수록 부모 한 행의 삭제가 장시간 트랜잭션이 될 수 있다 → [MVCC·VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/), [테이블 팽창](/develop-wiki/knowledge/data-modeling/table-bloat-postgresql/).
- 연쇄로 지워지는 자식 행에도 자식 테이블의 트리거가 발동하므로, 감사 로그·이벤트 발행 트리거가 있으면 삭제 폭풍이 그대로 전파된다.

## 언제 쓰나

**DEFERRABLE**
- **순환 FK**(상호 참조, 자기 참조 트리에서 부모와 자식을 함께 삽입)를 한 트랜잭션에서 넣어야 할 때.
- 부모·자식을 임의 순서로 만드는 **배치·임포트·시드**. 가능하면 `SET CONSTRAINTS` 로 필요한 트랜잭션에서만 지연시키고, 제약 자체는 `INITIALLY IMMEDIATE` 로 둔다.
- UNIQUE 가 걸린 값을 한 `UPDATE` 로 밀거나 교환할 때(위 11 번). 문서가 이 방식을 표준 호환 동작으로 권하되, 지연 가능한 UNIQUE 검사는 **상당히 느릴 수 있다**고 경고한다. 이 노트에서 UNIQUE 의 속도는 측정하지 않았다.

**ON DELETE CASCADE**
- 자식이 부모의 **일부**로만 존재하는 경우(주문과 주문 항목, 문서와 첨부 메타데이터).
- 테넌트 삭제 같은 **전체 폐기** 흐름이며, 삭제 범위를 이미 알고 있고 인덱스가 갖춰져 있을 때.

## 주의 (비용)

**DEFERRABLE**
- **잘못된 상태가 트랜잭션 안에서 보인다.** 지연 중에는 부모 없는 자식이 같은 트랜잭션의 쿼리에 나타난다. 앱 로직이 "FK 가 항상 참"이라고 가정하고 조인하면 어긋난다.
- **실패 시점이 COMMIT 으로 간다.** 원인 문장을 특정하기 어렵고, 락을 오래 쥔 채 마지막에 롤백될 수 있다. 위 표처럼 검사 비용이 커밋 지연으로 몰린다.
- 쌓이는 큐 메모리가 트랜잭션 크기에 비례한다.
- `INITIALLY DEFERRED` 를 **기본값으로 모든 FK 에** 붙이는 습관은 피한다. 위반이 뒤늦게 터지고 ORM·마이그레이션 도구가 가정하는 문장 단위 오류가 사라진다. 이 항목은 이 노트의 의견이다.
- 참조 동작은 `NO ACTION` 만 미뤄지고 `CASCADE`, `SET NULL` 은 미뤄지지 않는다(8, 9 번). "미루면 삭제도 미뤄진다"고 오해하기 쉽다.
- 지연 가능 UNIQUE 는 `ON CONFLICT` 와 같이 못 쓰므로(10 번) 업서트 설계와 충돌한다. FK 의 참조 대상으로도 못 쓴다(12 번).

**ON DELETE CASCADE**
- **폭발 반경이 보이지 않는다.** 스키마에 FK 가 추가될 때마다 부모 삭제가 더 많은 것을 지운다. 자식 테이블 담당 팀이 알지 못한 채 데이터가 사라질 수 있다. 문서의 지침대로 독립 객체 사이에는 `RESTRICT`/`NO ACTION` 이 안전하다.
- **인덱스 없는 자식 FK** 는 연쇄 단계마다 테이블 전체 탐색을 만든다(위 4.8 초). 새 FK 마다 자식 열 인덱스를 확인한다 → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).
- **큰 단일 트랜잭션**: 60 만 행 삭제가 한 문장이다. 운영 중 큰 부모를 지울 때는 자식을 배치로 먼저 지우고(작은 트랜잭션 여러 개) 마지막에 부모를 지우는 편이 락 시간과 복제 지연 면에서 낫다고 판단한다(이 비교는 실험하지 않았다).
- **소프트 삭제와 충돌**: 부모를 `deleted_at` 으로만 표시하는 설계에서는 CASCADE 가 발동하지 않으므로 자식 정리는 앱·배치가 맡는다.
- **감사·이벤트 트리거**가 자식 테이블에 있으면 연쇄 삭제마다 전부 발동한다.
- 삭제 동작(`ON DELETE`)은 마이그레이션에서 `ALTER TABLE` 로 바꾸기 어렵다(제약 재생성이 필요). 락과 검증 비용은 [무중단 마이그레이션](/develop-wiki/knowledge/data-modeling/zero-downtime-migration/)을 따른다. 이 부분은 이 노트에서 실행하지 않았다.
- **부모 쪽 잠금** 문제(자식 INSERT 가 부모에 `FOR KEY SHARE` 를 거는 것)는 DEFERRABLE 과 별개이며 [FOR NO KEY UPDATE 노트](/develop-wiki/knowledge/data-modeling/postgresql-for-no-key-update-foreign-key-design/)에서 다룬다. 이 노트에서 지연 검사가 그 잠금 시점을 어떻게 바꾸는지는 실험하지 않았다.

## 비교

| 필요 | 선택 | 대가 |
| --- | --- | --- |
| 순환 FK 삽입 | `DEFERRABLE INITIALLY DEFERRED` 또는 트랜잭션별 `SET CONSTRAINTS` | COMMIT 시점 실패, 큐 메모리 |
| 문장 내 UNIQUE 교환 | `DEFERRABLE INITIALLY IMMEDIATE` UNIQUE | 업서트 불가, 느릴 수 있음 |
| 부모 삭제 시 자식 자동 정리 | `ON DELETE CASCADE` | 폭발 반경, 큰 트랜잭션, 인덱스 필수 |
| 자식이 있으면 삭제 거부 | `RESTRICT`(즉시) / `NO ACTION`(지연 가능) | 앱이 정리 순서를 책임 |
| 자식은 남기고 연결만 끊기 | `SET NULL`(열 지정 가능, 15+) | FK 열이 NULL 허용이어야 함. 복합 키는 [멀티테넌트 복합 FK](/develop-wiki/knowledge/data-modeling/postgresql-multitenant-composite-foreign-key/) |
| 대량 삭제를 통제하고 싶음 | 자식 먼저 배치 삭제, 부모는 `RESTRICT` | 앱 코드가 늘어남 |

## 검증 범위

PostgreSQL 16 문서의 Constraints(5.4.5 외래 키), `CREATE TABLE`(FK, DEFERRABLE, INITIALLY), `SET CONSTRAINTS` 를 읽었다. 위 표 전부와 트리거·메모리·시간 수치는 임시 `postgres:16`(16.15) 컨테이너에서 직접 실행했다(컨테이너는 `--rm`, tmpfs 라 종료와 함께 삭제됐고 기존 컨테이너는 건드리지 않았다). `fsync=off`, 단일 연결, 소규모 데이터라 절대값은 참고용이다. 다른 메이저 버전, 동시 실행 시 잠금 동작, REPEATABLE READ 이상의 격리 수준, 복제·논리 디코딩에서의 연쇄 삭제, `ALTER TABLE` 문서의 `ALTER CONSTRAINT` 설명은 확인하지 않았다.

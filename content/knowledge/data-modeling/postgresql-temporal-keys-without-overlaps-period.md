---
title: PostgreSQL 18 시간 범위 키 — WITHOUT OVERLAPS 기본 키와 PERIOD 외래 키
aka: [Temporal Primary Key, Temporal Foreign Key, WITHOUT OVERLAPS, PERIOD, application-time period, 시간 범위 외래 키, 유효 기간 테이블, btree_gist, exclusion constraint, daterange]
category: data-modeling
level: advanced
summary: 같은 id 라도 유효 기간이 겹치지 않으면 여러 행을 허용하는 기본 키와, 자식의 기간 전체를 부모 행들이 빈틈없이 덮어야 하는 외래 키. PostgreSQL 18 에서 추가됐고 18.7 에서 동작·제약을 직접 실행해 정리한다.
tags: [postgresql, postgresql-18, temporal, without-overlaps, period, foreign-key, primary-key, range-types, gist, exclusion-constraint, btree-gist]
related: [data-modeling/primary-key-design, data-modeling/postgresql-foreign-key-deferrable-on-delete-cascade, data-modeling/index-design, data-modeling/normalization, data-modeling/postgresql-18-not-enforced-not-null-not-valid, data-modeling/postgresql-multitenant-composite-foreign-key]
sources:
  - https://www.postgresql.org/docs/release/18.0/
  - https://www.postgresql.org/docs/18/sql-createtable.html
updatedAt: 2026-11-19
---

## 문제

가격표, 요금제, 직원 소속, 객실 요금처럼 **"언제부터 언제까지 유효했는가"** 를 기록하는 테이블이 있다.

- 키는 `(room_id, valid_at)` 이지만, 일반 UNIQUE 는 기간이 **겹치는** 두 행을 막지 못한다(구간 값이 다르면 서로 다른 키다).
- 예약 `(room_id, stay)` 이 "그 기간 동안 존재한 객실 요금"을 참조해야 하는데, 일반 FK 는 값이 정확히 같은 행만 찾는다. 부모가 기간별로 쪼개져 있으면 표현할 수 없다.
- 그래서 지금까지는 `EXCLUDE USING gist (id WITH =, valid_at WITH &&)` 와 트리거로 직접 만들었다.

## 해법

PostgreSQL 18 릴리스 노트: PRIMARY KEY·UNIQUE 에 `WITHOUT OVERLAPS`, 외래 키에 `PERIOD` 를 지정할 수 있고, 둘 다 **마지막 열**에 적용된다.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- int 같은 스칼라 열을 GiST 에서 = 로 비교하려면 필요

CREATE TABLE room (
  room_id  int,
  valid_at daterange,
  price    int NOT NULL,
  PRIMARY KEY (room_id, valid_at WITHOUT OVERLAPS)
);

CREATE TABLE booking (
  booking_id int PRIMARY KEY,
  room_id    int,
  stay       daterange,
  FOREIGN KEY (room_id, PERIOD stay) REFERENCES room (room_id, PERIOD valid_at)
);
```

문서(CREATE TABLE) 규칙.

- `WITHOUT OVERLAPS` 열은 범위(range) 또는 다중 범위(multirange) 형이어야 하고, 빈 범위는 허용되지 않는다.
- 나머지 키 열은 GiST 에서 등호 비교가 가능해야 한다. 스칼라 형은 `btree_gist` 확장이 "예상되는 사용 방식"이다.
- 이 제약은 UNIQUE 가 아니라 **배제(EXCLUDE) 제약처럼** 동작한다. `UNIQUE (id, valid_at WITHOUT OVERLAPS)` 는 `EXCLUDE USING GIST (id WITH =, valid_at WITH &&)` 와 같다고 문서가 설명한다. 인덱스는 GiST 다.
- `PERIOD` 외래 키는 PERIOD 가 아닌 열이 하나 이상 있어야 하고, 참조 대상은 `WITHOUT OVERLAPS` 로 선언된 PK·UNIQUE 여야 한다.
- 만족 조건: 등호 열이 같은 부모 행들의 기간을 **합쳐서** 자식 기간을 완전히 덮어야 한다. 한 행일 필요는 없다.
- 시간 FK 에는 `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT` 를 쓸 수 없다.

## 직접 실행 (PostgreSQL 18.7)

임시 `postgres:18` 컨테이너(18.7, tmpfs). 객실 1 의 요금 행 `[2026-01-01, 2026-07-01)`, `[2026-07-01, 2027-01-01)`.

### 기본 키

| 시도 | 결과 |
| --- | --- |
| `btree_gist` 없이 `PRIMARY KEY (id int, valid_at WITHOUT OVERLAPS)` | `data type integer has no default operator class for access method "gist"` |
| 생성 후 인덱스 | `room_pkey`, `CREATE UNIQUE INDEX ... USING gist (room_id, valid_at)` |
| 겹치는 `[2026-06-01, 2026-08-01)` 삽입 | `conflicting key value violates exclusion constraint "room_pkey"` |
| `'empty'` 범위 | `empty WITHOUT OVERLAPS value found in column "valid_at"` |
| NULL 범위 | PK 라서 `valid_at` 에 NOT NULL 제약이 자동 생성되어 거부 |
| 상한 없는 `[2026-01-01,)` | 허용 |
| `UNIQUE (id, r WITHOUT OVERLAPS)` 에 `(1, NULL)` 두 번 | **둘 다 들어감**. UNIQUE 는 NULL 범위를 막지 않는다 |
| 다중 범위 `{[1/1,2/1),[3/1,4/1)}` 와 `{[2/1,3/1)}` | 허용(겹치지 않음). `{[3/15,3/20)}` 는 거부 |
| `room_id = 150 AND valid_at @> date '2026-05-01'` (2 만 행) | `Index Scan using room_pkey` |

### 외래 키

| 시도 | 결과 |
| --- | --- |
| 예약 `[2026-06-20, 2026-07-10)` — 두 요금 행에 걸침 | 허용(합쳐서 덮음) |
| 예약 `[2026-12-20, 2027-01-05)` — 2027 년 요금 없음 | `violates foreign key constraint`, `Key (room_id, stay)=(...) is not present in table "room"` |
| 자식 `stay` 가 NULL | 허용(검사 안 함) |
| 부모 요금 행의 기간을 `[1/1, 6/30)` 로 줄임(예약이 6/30 을 포함) | `is still referenced from table "booking"` |
| 부모의 비키 열(`price`) UPDATE | 허용 |
| 부모 행 하나를 지우고 같은 기간을 두 행으로 나눠 다시 넣기(즉시 검사 FK, 한 트랜잭션) | **DELETE 시점에 바로 실패** |
| 같은 작업, FK 를 `DEFERRABLE` 로 만들고 `SET CONSTRAINTS ... DEFERRED` | 커밋 시 검사, 성공 |
| `ON DELETE CASCADE`, `ON DELETE RESTRICT`, `ON DELETE SET NULL`, `ON UPDATE CASCADE` | 모두 `unsupported ... action for foreign key constraint using PERIOD` |
| 시간 PK 를 PERIOD 없이 참조 | `foreign key must use PERIOD when referencing a primary key using WITHOUT OVERLAPS` |
| `ADD ... PERIOD ... NOT VALID` 후 VALIDATE(덮이지 않는 기존 행 있음) | 추가는 성공, VALIDATE 에서 FK 위반 |
| 자식 쪽 인덱스 | 자동 생성 없음(`booking_pkey` 만) |
| `UPDATE room FOR PORTION OF valid_at FROM ... TO ...` | 문법 오류. 18.7 에는 기간 일부만 갱신하는 문법이 없다 |

## 언제 쓰나

- 기간별 이력(요금, 계약, 소속, 권한 부여 기간)을 한 테이블에 두고 **겹침을 DB 가 막게** 하고 싶을 때.
- 자식이 "그 시점에 유효했던 부모"를 참조해야 하고, 부모가 기간별로 여러 행으로 쪼개질 때.
- 지금 `EXCLUDE USING gist` + 트리거로 같은 일을 하고 있다면, 18 로 올린 뒤 선언형으로 바꿀 후보다.

## 주의 (비용)

- **연쇄 동작이 없다.** 부모 기간을 줄이거나 나누는 작업은 자식을 먼저 정리하거나, FK 를 `DEFERRABLE` 로 만들고 한 트랜잭션에서 처리해야 한다. 기간 분할이 잦으면 DEFERRABLE 이 사실상 필요하다 → [DEFERRABLE·ON DELETE CASCADE](/develop-wiki/knowledge/data-modeling/postgresql-foreign-key-deferrable-on-delete-cascade/).
- **기간 일부 갱신 문법이 없다.** "8 월만 가격 변경"은 앱이 행을 잘라 UPDATE + INSERT 로 만들어야 한다. 이때 PK 의 겹침 검사는 지연할 수 없어서 순서가 중요하다(한 문장 CTE 로 줄이고 넣기는 겹침 오류가 났다). 먼저 줄이고, 그 다음 넣는다.
- **GiST 인덱스 비용.** PK 가 B-tree 가 아니라 GiST 다. 쓰기 비용과 크기는 이 노트에서 재지 않았다. 등호 조회만 많은 테이블이면 별도 B-tree 인덱스가 필요한지 계획을 확인한다.
- **자식 인덱스는 직접 만든다.** 부모 변경 시 자식을 찾는 검사에 쓰인다. 자식에 `(room_id, stay)` GiST 인덱스를 두는 것이 자연스럽지만, 어떤 인덱스가 실제로 쓰이는지는 확인하지 않았다.
- **NULL**: UNIQUE `WITHOUT OVERLAPS` 는 NULL 범위를 여러 개 허용하고, 자식 FK 도 NULL 기간은 검사하지 않는다. 필요하면 NOT NULL 을 건다.
- **범위 경계 관례**: `daterange` 는 `[시작, 끝)` 반개구간이 기본이다. 닫힌 구간으로 넣으면 정규화되지만, 앱 쪽 표현이 섞이면 "하루 겹침" 오류가 난다. 경계 관례를 하나로 정한다.
- **버전 의존**: 18 이상 전용. 덤프를 17 이하로 옮길 수 없다(실행하지 않았다). 다른 DB 의 SQL:2011 시스템 버전·애플리케이션 기간 문법과 똑같지 않으니 이식성을 기대하지 않는다.
- PK 가 넓어지고 "현재 행" 조회에 항상 `valid_at @> now()` 조건이 붙는다. 현재 상태만 자주 읽으면 현재 테이블과 이력 테이블을 나누는 설계가 더 단순할 수 있다.

## 비교

| 방식 | 겹침 방지 | 기간 덮음 FK | 연쇄 동작 | 비고 |
| --- | --- | --- | --- | --- |
| 일반 UNIQUE `(id, valid_from)` | 못함 | 못함 | 일반 FK 와 같음 | 트리거로 보완 |
| `EXCLUDE USING gist` + 트리거 | 함 | 트리거로 구현 | 트리거로 구현 | 17 이하 방법 |
| `WITHOUT OVERLAPS` + `PERIOD`(18+) | 함 | 함(여러 부모 행 합산) | **NO ACTION 만** | 선언형, GiST |
| 현재 테이블 + 이력 테이블 | 현재 테이블은 일반 PK | 현재 기준만 | 일반 FK | 과거 시점 참조는 앱 책임 |

## 검증 범위

PostgreSQL 18.0 릴리스 노트(시간 제약 항목, Paul A. Jungwirth)와 18 문서 `CREATE TABLE`(WITHOUT OVERLAPS, PERIOD, 참조 동작 제한)을 2026-11-19 에 읽었다. 표의 결과는 모두 임시 `postgres:18`(18.7) 컨테이너에서 직접 실행했다(`--rm`, tmpfs, 최대 2 만 행). GiST 쓰기 비용, 자식 인덱스 효과, 대용량에서의 FK 검사 시간은 재지 않았다.

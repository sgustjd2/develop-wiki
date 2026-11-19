---
title: PostgreSQL 멀티테넌트 복합 외래 키와 ON DELETE SET NULL (열 목록)
aka: [Composite Foreign Key, tenant_id 복합 FK, ON DELETE SET NULL (column_list), ON DELETE SET DEFAULT (column_list), MATCH SIMPLE, MATCH FULL, 테넌트 간 참조 방지, multi-tenant schema]
category: data-modeling
level: advanced
summary: 테넌트 테이블의 외래 키에 tenant_id 를 포함한 복합 키를 써서 다른 테넌트 행을 참조하지 못하게 하고, PostgreSQL 15+ 의 ON DELETE SET NULL (열) 로 tenant_id 는 남기고 참조 열만 비우는 설계.
tags: [postgresql, foreign-key, multi-tenant, composite-key, on-delete-set-null, match-full, schema-design, referential-integrity]
related: [data-modeling/postgresql-foreign-key-deferrable-on-delete-cascade, data-modeling/primary-key-design, data-modeling/index-design, data-modeling/sharding-partitioning, data-modeling/postgresql-not-valid-validate-constraint, data-modeling/zero-downtime-migration, security/access-control-design]
sources:
  - https://www.postgresql.org/docs/16/ddl-constraints.html
  - https://www.postgresql.org/docs/16/sql-createtable.html
  - https://www.postgresql.org/docs/release/15.0/
updatedAt: 2026-11-19
---

## 문제

공유 스키마 멀티테넌트(모든 테넌트가 같은 테이블, `tenant_id` 열로 구분)에서 흔한 실수 두 가지.

- **테넌트 간 참조**: `posts.author_id REFERENCES users(user_id)` 처럼 FK 가 `user_id` 하나만 보면, 테넌트 1 의 글이 테넌트 2 의 사용자를 작성자로 가질 수 있다. DB 는 막지 않는다. 앱 코드의 테넌트 필터 하나가 빠지면 데이터가 섞인다.
- **복합 FK 의 SET NULL**: 이를 막으려고 FK 를 `(tenant_id, author_id)` 로 바꾸면, PostgreSQL 14 까지 `ON DELETE SET NULL` 은 FK 의 **모든 열**을 NULL 로 만든다. `tenant_id` 는 보통 `NOT NULL` 이고 기본 키의 일부라서 사용자 삭제가 실패한다.

## 해법

### 1) tenant_id 를 포함한 복합 FK

- 부모 쪽에 `(tenant_id, id)` 에 대한 **기본 키나 UNIQUE 제약**이 있어야 한다. 문서 기준으로 참조 대상은 지연 불가 UNIQUE·PK 제약의 열이거나 부분(partial)이 아닌 UNIQUE 인덱스의 열이다.
- 자식은 `FOREIGN KEY (tenant_id, author_id) REFERENCES users (tenant_id, user_id)` 로 건다. 같은 테넌트의 행만 참조할 수 있다.

### 2) ON DELETE SET NULL (열 목록) — PostgreSQL 15+

PostgreSQL 15 릴리스 노트: 외래 키의 `ON DELETE SET` 동작이 지정한 열만 바꿀 수 있게 됐다(이전에는 FK 의 모든 열이 바뀜).

```sql
CREATE TABLE tenants (tenant_id int PRIMARY KEY);

CREATE TABLE users (
  tenant_id int NOT NULL REFERENCES tenants ON DELETE CASCADE,
  user_id   int NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE posts (
  tenant_id int NOT NULL REFERENCES tenants ON DELETE CASCADE, -- 테넌트 소속은 따로 보장
  post_id   int NOT NULL,
  author_id int,                                              -- 작성자는 선택
  PRIMARY KEY (tenant_id, post_id),
  FOREIGN KEY (tenant_id, author_id) REFERENCES users ON DELETE SET NULL (author_id)
);
CREATE INDEX ON posts (tenant_id, author_id); -- 참조하는 쪽 인덱스는 자동으로 생기지 않는다
```

공식 문서 5.4.5 의 예도 같은 구조(tenants, users, posts)로, 열 목록이 없으면 `tenant_id` 까지 NULL 로 만들려 해서 실패한다고 설명한다.

문서 규칙(CREATE TABLE):
- 열 목록은 `ON DELETE` 에서만 쓸 수 있다. `ON UPDATE SET NULL/SET DEFAULT` 는 열 목록을 받지 않는다.
- `SET DEFAULT` 는 기본값이 NULL 이 아니면 **그 기본값에 맞는 부모 행이 있어야** 한다. 없으면 동작이 실패한다.
- 기본 `MATCH SIMPLE` 은 FK 열 중 하나라도 NULL 이면 매칭을 요구하지 않는다. `MATCH FULL` 은 모두 NULL 일 때만 NULL 을 허용하고, 일부만 NULL 인 상태를 거부한다.

## 직접 실행

PostgreSQL 16.15 임시 컨테이너(`postgres:16`, tmpfs, `fsync=off`). 위 스키마와 변형을 한 세션에서 실행했다. 삭제는 트랜잭션 안에서 하고 롤백했다.

| # | 상황 | 결과 |
| --- | --- | --- |
| 1 | 복합 FK + `ON DELETE SET NULL`(열 목록 없음), 사용자 삭제 | `null value in column "tenant_id" ... violates not-null constraint`. 내부 문장이 `SET "tenant_id" = NULL, "author_id" = NULL` |
| 2 | 같은 FK + `SET NULL (author_id)` | 성공. 글은 `(1, 1, NULL)` 로 남음 |
| 3 | 복합 FK 에 다른 테넌트 사용자 `(1, 20)` 참조 | `Key (tenant_id, author_id)=(1, 20) is not present in table "users"` |
| 3b | `user_id` 단독 PK 를 참조하는 단일 열 FK | 테넌트 1 의 글이 테넌트 2 의 사용자를 참조하는 행이 **들어감** |
| 3c | 3b 의 부모에 `(tenant_id, user_id)` UNIQUE 없이 복합 FK 생성 | `there is no unique constraint matching given keys for referenced table`. UNIQUE 추가 후 생성되고 교차 참조는 거부됨 |
| 4 | `ON UPDATE SET NULL (author_id)` | `a column list with SET NULL is only supported for ON DELETE actions` |
| 5 | FK 에 없는 열을 목록에 지정 | `column "x" referenced in ON DELETE SET action must be part of foreign key` |
| 6 | `MATCH FULL` + `SET NULL (author_id)`: `(1, 2, NULL)` 삽입, 그리고 사용자 삭제 | 둘 다 `MATCH FULL does not allow mixing of null and nonnull key values` |
| 7 | `MATCH SIMPLE` 에서 `author_id` NULL, `tenant_id` 가 없는 테넌트 99 | 삽입 **성공**(FK 검사 생략) |
| 8 | `SET DEFAULT (author_id)`, 기본값 0, `(1, 0)` 사용자 없음 | 사용자 삭제 시 `Key (tenant_id, author_id)=(1, 0) is not present`. 테넌트별 "탈퇴 사용자" 행 `(1, 0)` 을 만든 뒤에는 성공 |
| 9 | posts 의 `tenant_id` 에 tenants FK 를 **안 건** 변형에서 테넌트 삭제 | users 는 연쇄 삭제, posts 는 `author_id` 만 NULL 이 되어 **사라진 테넌트의 글로 남음** |

- 6 번: `MATCH FULL` 과 열 지정 `SET NULL` 은 함께 쓸 수 없는 조합이다. 일부 열만 NULL 로 만드는 것 자체가 MATCH FULL 위반이다.
- 7·9 번: 복합 FK 는 "같은 테넌트의 사용자"만 보장한다. **글이 실제 테넌트에 속한다는 것**은 별도의 `tenant_id → tenants` FK 가 보장한다. 위 예제 스키마가 posts 에도 tenants FK 를 두는 이유다.
- `pg_get_constraintdef` 는 `... ON DELETE SET NULL (author_id)` 로 열 목록을 보존해 출력했다. 덤프·마이그레이션 도구가 15 미만 서버로 스키마를 옮기면 이 구문이 문법 오류가 된다(15 미만 실행은 확인하지 않았다).

## 언제 쓰나

- 공유 스키마 멀티테넌트에서 테넌트 경계를 **DB 제약으로** 강제하고 싶을 때. 행 수준 보안(RLS)이나 앱 필터가 놓친 버그를 쓰기 시점에 막는다.
- 자식이 부모를 **선택적으로** 참조하고(작성자, 담당자, 마지막 수정자), 부모가 지워져도 자식은 남아야 할 때 → `SET NULL (참조 열)`.
- "삭제된 사용자"를 NULL 대신 테넌트별 대체 행으로 표시하고 싶을 때 → `SET DEFAULT (참조 열)` + 테넌트마다 대체 행.
- 나중에 테넌트 단위로 샤딩할 계획이 있을 때. 모든 키가 `tenant_id` 로 시작하면 테넌트를 통째로 옮기기 쉽다 → [샤딩과 파티셔닝](/develop-wiki/knowledge/data-modeling/sharding-partitioning/). 이 부분은 이 노트에서 실험하지 않았다.

## 주의 (비용)

- **키와 인덱스가 넓어진다.** 모든 PK·FK·인덱스에 `tenant_id` 가 붙는다. 부모에 `(tenant_id, id)` UNIQUE 를 추가로 두면(이미 `id` 단독 PK 가 있을 때) 인덱스가 하나 더 생기고 쓰기 비용이 는다 → [기본 키 설계](/develop-wiki/knowledge/data-modeling/primary-key-design/).
- **참조하는 쪽 인덱스는 직접 만든다.** 문서가 명시하듯 FK 선언은 참조하는 쪽(자식) 열의 인덱스를 자동으로 만들지 않는다. 없으면 부모 삭제마다 자식 테이블을 훑는다. 연쇄 동작의 인덱스 비용은 [DEFERRABLE·ON DELETE CASCADE 노트](/develop-wiki/knowledge/data-modeling/postgresql-foreign-key-deferrable-on-delete-cascade/)에서 측정했다.
- **MATCH SIMPLE 의 구멍**: 참조 열이 NULL 이면 `tenant_id` 값은 아무것도 검사되지 않는다(7 번). 테넌트 소속 FK 를 따로 두거나 `tenant_id` 를 PK 에 포함해 tenants 를 참조하게 한다.
- **버전 의존**: 열 목록은 PostgreSQL 15 부터다. 14 이하를 지원해야 하면 트리거로 같은 동작을 만들거나 `NO ACTION` 으로 두고 앱이 정리해야 한다.
- **SET DEFAULT 의 대체 행**: 테넌트가 생길 때마다 대체 사용자 행을 같이 만들어야 하고, 그 행은 지워지면 안 된다. 통계·목록 쿼리에서 그 행을 걸러야 한다.
- **ON UPDATE 는 열 목록이 없다.** 부모 키가 바뀌는 설계(테넌트 이동 등)에서 `ON UPDATE SET NULL` 을 쓰면 `tenant_id` 까지 NULL 이 된다. 키는 바꾸지 않는 편이 낫다.
- 기존 대형 테이블에 복합 FK 를 추가할 때는 락과 전체 검사 비용이 있다. `NOT VALID` → `VALIDATE CONSTRAINT` 로 나눈다 → [NOT VALID 와 VALIDATE CONSTRAINT](/develop-wiki/knowledge/data-modeling/postgresql-not-valid-validate-constraint/).

## 비교

| 설계 | 테넌트 간 참조 | 부모 삭제 시 자식 | 비용 |
| --- | --- | --- | --- |
| 단일 열 FK `author_id → users(user_id)` | **막지 못함**(3b) | 동작에 따라 | 키가 좁음 |
| 복합 FK + `SET NULL`(열 목록 없음) | 막음 | `tenant_id` 가 NOT NULL 이면 삭제 실패(1) | — |
| 복합 FK + `SET NULL (author_id)` (15+) | 막음 | 참조만 끊김, 테넌트 유지(2) | 넓은 키, 15+ 필요 |
| 복합 FK + `SET DEFAULT (author_id)` (15+) | 막음 | 대체 행으로 연결(8) | 테넌트별 대체 행 관리 |
| 복합 FK + `MATCH FULL` | 막음 | 열 지정 SET NULL 과 함께 못 씀(6) | 부분 NULL 금지 |
| 복합 FK + `CASCADE` | 막음 | 자식도 삭제 | 폭발 반경 |

## 검증 범위

PostgreSQL 16 문서의 Constraints(5.4.5 외래 키, tenants/users/posts 예), `CREATE TABLE`(REFERENCES, MATCH, 참조 동작)과 PostgreSQL 15 릴리스 노트(E.21.3.3, Paul Martinez)를 읽었다. 표의 모든 결과는 임시 `postgres:16`(16.15) 컨테이너에서 직접 실행했다(`--rm`, tmpfs 라 종료와 함께 삭제). 15·17·18 버전에서 동작을 실행해 보지는 않았다. 행 수준 보안(RLS)과의 조합, 파티션 테이블에서의 복합 FK, 성능 수치는 측정하지 않았다.

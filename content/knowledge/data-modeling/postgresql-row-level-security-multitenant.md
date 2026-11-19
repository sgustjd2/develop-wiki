---
title: PostgreSQL 행 수준 보안(RLS)으로 멀티테넌트 격리
aka: [Row Level Security, RLS, CREATE POLICY, FORCE ROW LEVEL SECURITY, BYPASSRLS, current_setting, set_config, SET LOCAL, LEAKPROOF, tenant isolation, 공유 스키마 멀티테넌트]
category: data-modeling
level: advanced
summary: 공유 스키마 멀티테넌트에서 테이블에 정책(CREATE POLICY)을 걸어 DB 가 테넌트 행만 보여 주게 하는 방법. 소유자·BYPASSRLS 예외, 세션 변수와 커넥션 풀의 함정, 무결성 검사로 새는 정보를 직접 실행해 정리한다.
tags: [postgresql, row-level-security, rls, multi-tenant, create-policy, connection-pool, leakproof, access-control]
related: [data-modeling/postgresql-multitenant-composite-foreign-key, security/access-control-design, performance/connection-pool, data-modeling/sharding-partitioning, data-modeling/index-design, security/sql-injection]
sources:
  - https://www.postgresql.org/docs/18/ddl-rowsecurity.html
  - https://www.postgresql.org/docs/18/sql-createpolicy.html
  - https://www.postgresql.org/docs/release/18.0/
updatedAt: 2026-11-19
---

## 문제

모든 테넌트가 같은 테이블을 쓰고 `tenant_id` 로 구분하는 구조에서는, 쿼리 하나에 `WHERE tenant_id = ?` 가 빠지면 다른 테넌트 데이터가 그대로 나간다. ORM 전역 필터나 리뷰로 막아도 원시 SQL, 리포트 쿼리, 새로 들어온 개발자의 코드에서 구멍이 생긴다.

RLS 는 이 필터를 **DB 가 모든 쿼리에 강제로 붙이게** 한다.

## 해법

```sql
ALTER TABLE app.note ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON app.note
  USING      (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::int)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::int);

-- 요청마다(트랜잭션 안에서)
BEGIN;
SELECT set_config('app.tenant_id', '42', true);  -- true = SET LOCAL, 트랜잭션 끝에 원복
-- ... 쿼리 ...
COMMIT;
```

PostgreSQL 18 문서 기준 규칙.

- RLS 를 켰는데 적용되는 정책이 없으면 **기본 거부**다. 행이 하나도 보이지 않고 수정도 안 된다.
- `USING` 은 기존 행 중 보이는(UPDATE·DELETE 대상이 되는) 행을 거른다. 거짓·NULL 인 행은 **조용히 빠진다**.
- `WITH CHECK` 은 INSERT·UPDATE 로 **새로 쓰는 행**을 검사하고, 거짓·NULL 이면 **오류**를 낸다. 생략하면 `USING` 식이 검사에도 쓰인다(ALL·UPDATE 정책).
- 기본은 PERMISSIVE(정책끼리 OR). `AS RESTRICTIVE` 정책은 AND 로 붙는다. PERMISSIVE 가 하나도 없으면 RESTRICTIVE 만으로는 아무 행도 안 보인다.
- UPDATE 는 보통 행을 읽어야 하므로 SELECT(또는 ALL) 정책도 통과해야 한다.
- 슈퍼유저와 `BYPASSRLS` 롤은 **항상** 정책을 무시한다. 테이블 소유자도 기본으로는 무시하고, `ALTER TABLE ... FORCE ROW LEVEL SECURITY` 를 걸어야 소유자에게도 적용된다.
- 정책 식은 사용자 쿼리 조건보다 **먼저** 평가된다. 예외는 `LEAKPROOF` 로 표시된 함수·연산자뿐이다.
- 기본 키·UNIQUE·외래 키 검사는 RLS 를 **우회**한다(무결성 유지 목적). 문서는 이 검사로 정보가 새는 "은닉 채널"을 설계에서 피하라고 경고한다.
- `row_security = off` 는 RLS 를 끄지 않는다. 결과가 정책으로 걸러질 상황이면 오류를 낸다(백업에서 행이 조용히 빠지는 것을 막는 용도).

## 직접 실행 (PostgreSQL 18.7)

임시 `postgres:18` 컨테이너(18.7, tmpfs). `app_owner` 가 테이블을 소유하고, 앱은 `app_user`, 운영 롤 `ops` 는 `BYPASSRLS`. 30,000 행, 테넌트 3 개(각 10,000 행).

| # | 상황 | 결과 |
| --- | --- | --- |
| 1 | 소유자 `app_owner` 로 조회(FORCE 없음) | 30,000 행. 정책 무시 |
| 2 | `app_user`, 설정 없이 `current_setting('app.tenant_id')` 정책 | `unrecognized configuration parameter "app.tenant_id"` 오류 |
| 3 | `app_user`, 테넌트 2 설정 | 10,000 행, 모두 tenant 2 |
| 4 | 다른 테넌트로 INSERT | `new row violates row-level security policy` |
| 5 | 자기 행의 `tenant_id` 를 3 으로 UPDATE | 같은 오류(WITH CHECK) |
| 6 | 다른 테넌트 행 DELETE | 오류 없이 0 행 |
| 7 | 소유자가 만든 뷰를 `app_user` 가 조회 | **30,000 행**. 뷰는 소유자 권한으로 테이블을 읽는다 |
| 8 | `FORCE ROW LEVEL SECURITY` 후 7 번 다시 | 10,000 행 |
| 9 | `BYPASSRLS` 롤, 슈퍼유저 | 둘 다 30,000 행 |
| 10 | `app_user` 가 `SET row_security = off` | `query would be affected by row-level security policy` |
| 11 | 설정값이 빈 문자열 `''` | `invalid input syntax for type integer: ""` |
| 12 | 한 번 설정한 뒤 `DISCARD ALL` 또는 `RESET app.tenant_id` | `current_setting('app.tenant_id', true)` 가 NULL 이 아니라 **`''`** |
| 13 | 정책을 `NULLIF(current_setting(..., true), '')::int` 로 바꾸고 설정 해제 | 0 행(닫힌 실패) |
| 14 | `app_user` 가 스스로 `SET app.tenant_id = '3'` | 테넌트 3 의 10,000 행이 보임 |
| 15 | 세션 수준 `set_config(..., false)` 후 트랜잭션에서 `SET LOCAL` | 트랜잭션 안은 새 값, 커밋 후 **세션 값으로 복귀** |
| 16 | 테넌트 1 이 `a@x.com` 을 가진 상태에서 테넌트 2 가 같은 이메일 INSERT (`email` 전역 UNIQUE) | 테넌트 2 의 SELECT 는 0 행인데 INSERT 는 `duplicate key value violates unique constraint` |
| 17 | 소유자(비슈퍼유저)가 `LEAKPROOF` 함수 생성 | `only superuser can define a leakproof function` |
| 18 | `RAISE NOTICE` 하는 비-LEAKPROOF 함수를 WHERE 에 넣음 | 실행 계획에서 정책 조건이 인덱스 조건, 함수는 그 뒤 Filter. NOTICE 는 보이는 행만 출력 |
| 19 | `WHERE id = 300` 조회 계획 | `Index Cond: ((tenant_id = (current_setting(...))::integer) AND (id = 300))` — `(tenant_id, id)` PK 사용 |

- `int4eq`, `texteq` 는 `proleakproof = true`, `textlike`(LIKE)는 false 였다. LIKE 같은 비-LEAKPROOF 조건은 정책 조건보다 먼저 인덱스로 밀어 넣을 수 없다. 이 노트에서 성능 차이는 재지 않았다.

## 커넥션 풀과 세션 변수

- 14 번이 핵심이다. **사용자 정의 설정(`app.*`)은 아무 롤이나 바꿀 수 있다.** 앱이 임의 SQL 을 실행할 수 있는 경로(SQL 인젝션, 리포트 기능)가 있으면 RLS 가 테넌트 경계를 지켜 주지 못한다. 세션 변수 방식은 "앱이 실수로 필터를 빠뜨리는 것"을 막는 장치이지, 악의적인 SQL 을 막는 장치가 아니다.
- 트랜잭션 풀링(PgBouncer transaction 모드 등)에서는 같은 서버 커넥션을 여러 클라이언트가 번갈아 쓴다. 세션 수준 `SET` 은 다음 사용자에게 **남는다**(15 번). 항상 트랜잭션 안에서 `set_config(..., true)` / `SET LOCAL` 을 쓴다.
- 반대로 값을 설정하지 않고 쿼리를 보내는 코드 경로를 대비해 정책이 **닫힌 쪽으로 실패**하게 만든다. `current_setting(name)` 은 미정의면 오류(2 번), 한 번 정의된 뒤 리셋되면 `''`(12 번)라 형 변환 오류(11 번)가 난다. `NULLIF(..., '')` 로 NULL 을 만들면 비교가 NULL 이 되어 0 행이다(13 번).
- 테넌트마다 DB 롤을 따로 두고 `current_user` 로 비교하는 방식도 있다. 롤 전환(`SET ROLE`)도 결국 세션 상태라 풀링 주의점은 같다. 대규모 테넌트 수에서의 롤 관리 비용은 이 노트에서 다루지 않는다.

## 언제 쓰나

- 공유 스키마 멀티테넌트에서 앱 코드의 테넌트 필터 누락을 **DB 에서 한 번 더** 막고 싶을 때.
- 여러 서비스·리포트 도구가 같은 테이블을 읽어서 필터를 한 곳에서 강제하기 어려울 때.
- 테넌트 간 참조를 막는 [복합 외래 키](/develop-wiki/knowledge/data-modeling/postgresql-multitenant-composite-foreign-key/)와 함께 쓴다. RLS 는 읽기·쓰기 범위를, 복합 FK 는 참조 관계를 지킨다.

## 주의 (비용)

- **소유자로 접속하면 무의미하다.** 마이그레이션 롤(소유자)과 앱 롤을 분리하고, 앱 롤은 소유자·슈퍼유저·`BYPASSRLS` 가 아니어야 한다. 소유자로 접속해야 한다면 `FORCE ROW LEVEL SECURITY`.
- **뷰는 기본으로 소유자 권한이다**(7 번). 뷰를 거치면 FORCE 없이는 정책이 적용되지 않는다. `security_invoker` 뷰를 쓰거나 FORCE 를 건다.
- **무결성 검사는 정책을 우회해 존재를 드러낸다**(16 번). 전역 UNIQUE(이메일, 슬러그)는 다른 테넌트 값의 존재를 알려 준다. 테넌트 내 유일성이면 `UNIQUE (tenant_id, email)` 로 바꾼다. 전역 유일성이 필요하면 그 노출을 받아들일지 결정한다.
- **인덱스 설계**: 정책 조건이 모든 쿼리에 붙으므로 인덱스 앞쪽에 `tenant_id` 를 둔다(19 번) → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).
- **서브쿼리 정책과 동시성**: 문서는 다른 행을 조회하는 정책이 READ COMMITTED 에서 오래된 스냅샷을 볼 수 있다고 경고한다. 테넌트 ID 비교처럼 행 자체만 보는 정책이 단순하다.
- **디버깅이 어렵다.** 행이 "없는" 것인지 "가려진" 것인지 구분이 안 된다. 6 번처럼 DELETE 가 0 행이어도 오류가 없다.
- **덤프·이관**: PostgreSQL 18 에서 pg_dump·pg_dumpall·pg_restore 에 정책 처리를 끄는 `--no-policies` 옵션이 추가됐다(릴리스 노트). 실행해 보지는 않았다.
- 슈퍼유저·`BYPASSRLS` 롤의 접근(운영 작업, 백업)은 RLS 로 제한되지 않는다. 그 롤의 사용은 별도로 통제한다 → [접근 제어 설계](/develop-wiki/knowledge/security/access-control-design/).

## 비교

| 격리 방식 | 누락 시 노출 | 운영 비용 | 비고 |
| --- | --- | --- | --- |
| 앱 필터만 | 쿼리 하나 빠지면 노출 | 낮음 | ORM 전역 필터로 보완 |
| RLS + 세션 변수 | 설정 누락은 0 행(닫힌 정책일 때) | 중간: 롤 분리, 풀링 규칙 | 임의 SQL 실행에는 무력(14 번) |
| 테넌트별 스키마 | 스키마 지정 누락 시 노출 가능 | 스키마 수만큼 마이그레이션 | 이 노트에서 실행하지 않음 |
| 테넌트별 DB | 연결 대상 실수 외에는 격리 | 높음 | 이 노트에서 실행하지 않음 |

## 검증 범위

PostgreSQL 18 문서의 Row Security Policies(5.9), `CREATE POLICY`(명령별 정책 적용 표, LEAKPROOF·뷰 관련 노트), PostgreSQL 18.0 릴리스 노트의 `--no-policies` 항목을 2026-11-19 에 읽었다. 1~19 번은 임시 `postgres:18`(18.7) 컨테이너에서 직접 실행했다(`--rm`, tmpfs). PgBouncer 등 실제 풀러와의 조합, 테넌트별 스키마·DB 방식, RLS 의 쿼리 성능 오버헤드는 실행하지 않았다.

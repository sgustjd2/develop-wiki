---
title: PgBouncer 트랜잭션 풀링과 세션 상태 충돌
aka: [PgBouncer transaction pooling, pool_mode, session state, server_reset_query, max_prepared_statements, track_extra_parameters, 트랜잭션 풀링 세션 상태]
category: performance
level: advanced
summary: PgBouncer 트랜잭션 풀링은 트랜잭션마다 서버 연결을 바꿔 끼우므로 SET·LISTEN·세션 어드바이저리 락·PREPARE·임시 테이블 같은 세션 상태가 새거나 사라진다. 기능별 호환표와 대응책, 서버 쪽 동작을 직접 실행으로 확인한다.
tags: [pgbouncer, postgresql, connection-pool, pool-mode, session-state, prepared-statements, advisory-lock, set-local]
related: [performance/connection-pool, data-modeling/postgresql-row-level-security-multitenant, data-modeling/advisory-locks, data-modeling/skip-locked-vs-advisory-lock-queue, data-modeling/transaction-isolation]
sources:
  - https://www.pgbouncer.org/features.html
  - https://www.pgbouncer.org/config.html
  - https://www.pgbouncer.org/faq.html
  - https://www.postgresql.org/docs/18/explicit-locking.html
  - https://www.postgresql.org/docs/18/sql-set.html
  - https://www.postgresql.org/docs/18/sql-discard.html
updatedAt: 2026-11-23
---

## 문제

PostgreSQL 은 연결 하나가 프로세스 하나이고, 연결마다 `max_connections` 슬롯과 메모리를 쓴다. 인스턴스가 늘면 풀러가 필요하다([커넥션 풀 노트](/develop-wiki/knowledge/performance/connection-pool/)에 풀 크기 논의가 있다). PgBouncer 에서 서버 연결을 가장 아껴 쓰는 `transaction` 모드는 **클라이언트에게 서버 연결을 트랜잭션 동안만 빌려 준다.** 앱 입장에서는 "내 세션"이 트랜잭션마다 다른 PostgreSQL 세션으로 바뀔 수 있다는 뜻이다. 세션에 붙은 상태는 다음 사용자에게 새거나(`SET`) 엉뚱한 연결에서 사라진다(`PREPARE`, `LISTEN`). 이 노트는 어떤 기능이 어떤 모드에서 어떻게 깨지는지, 설정으로 무엇을 막을 수 있는지를 정리한다.

## 풀 모드 (config `pool_mode`)

| 모드 | 서버 연결이 풀로 돌아가는 때 | 문서의 평가 |
| --- | --- | --- |
| session (기본값) | 클라이언트가 접속을 끊을 때 | PostgreSQL 기능 전부 지원 |
| transaction | 트랜잭션이 끝날 때 | 몇몇 세션 기능이 "설계상" 깨짐. 앱이 협조해야만 쓸 수 있음 |
| statement | 쿼리 하나가 끝날 때 | 트랜잭션 모드의 변형이며 여러 문장 트랜잭션 금지(autocommit 강제). 문서는 주로 PL/Proxy 용이라고 적음 |

`pool_mode` 는 전역 설정이면서 데이터베이스별·사용자별로도 지정할 수 있다(`[databases]` 와 `[users]` 절).

## 기능 호환표 (features 페이지의 "SQL feature map")

| 기능 | session | transaction |
| --- | --- | --- |
| 시작 파라미터(`client_encoding`, `DateStyle`, `IntervalStyle`, `Timezone`, `standard_conforming_strings`, `application_name`) | 됨 | 됨 |
| `SET`/`RESET` | 됨 | **안 됨(Never)** |
| `LISTEN` | 됨 | **안 됨** |
| `NOTIFY` | 됨 | 됨 |
| `WITHOUT HOLD` 커서 | 됨 | 됨 |
| `WITH HOLD` 커서 | 됨 | **안 됨** |
| 프로토콜 수준 prepared plan | 됨 | 됨 (`max_prepared_statements` 가 0 이 아니어야 함. 1.21.0 에서 도입, 1.24.0 부터 기본값 200 — NEWS) |
| SQL `PREPARE`/`DEALLOCATE` | 됨 | **안 됨** |
| `ON COMMIT DROP` 임시 테이블 | 됨 | 됨 |
| `PRESERVE ROWS`/`DELETE ROWS` 임시 테이블 | 됨 | **안 됨** |
| 캐시 플랜 리셋 | 됨 | 됨 |
| `LOAD` | 됨 | **안 됨** |
| 세션 수준 어드바이저리 락 | 됨 | **안 됨** |

시작 파라미터는 PgBouncer 가 변경을 감지해 클라이언트별로 일관되게 유지해 준다. 표의 "안 됨"은 "에러가 난다"가 아니라 **동작을 보장하지 않는다**는 뜻이다. 한 연결을 재사용하는 동안에는 우연히 되는 것처럼 보이다가 다른 연결로 바뀌면 깨지므로 비결정적이다. 문서도 `server_reset_query_always` 를 설명하며 "비결정적 깨짐을 결정적 깨짐으로 바꾼다"고 쓴다.

## 상태별 동작과 대응

### SET 이 새는 문제

`SET x = ...` 는 트랜잭션이 커밋되어도 세션이 끝날 때까지 남는다(PostgreSQL 문서 SET). `SET LOCAL` 은 트랜잭션 끝에서 사라진다. 풀러 뒤에서는 이 차이가 곧 **데이터 누출 여부**가 된다. 앱이 `SET app.tenant = ...` 를 쓰고 이를 [RLS 정책](/develop-wiki/knowledge/data-modeling/postgresql-row-level-security-multitenant/)에서 읽는다면 다음 클라이언트가 이전 테넌트의 값으로 읽을 수 있다.

- 대응: 트랜잭션 안에서 `SET LOCAL` 또는 `set_config(name, value, true)` 를 쓴다(필자 권고, 기존 RLS 노트와 같은 결론).
- PgBouncer 가 자동 추적하는 파라미터는 `application_name`, `client_encoding`, `DateStyle`, `default_transaction_read_only`, `IntervalStyle`, `scram_iterations`(PG 16+), `search_path`(PG 18+), `session_authorization`, `standard_conforming_strings`, `TimeZone` 이다(config `track_extra_parameters`). 이 중 `search_path`·`default_transaction_read_only` 의 기본 추적은 1.26.0 부터이며(NEWS), 1.26.1 NEWS 는 search_path 추적 관련 버그가 보고됐다고 적는다. 그 이전 버전에서는 이 둘의 `SET` 이 새므로 버전을 확인하라. 추적은 PostgreSQL 이 클라이언트에 보고(ParameterStatus)하는 파라미터에 한한다. 보고하지 않는 파라미터(예: PG 17 이하의 `search_path`)는 시작 패킷에서 준 값만 알고, 접속 후 `SET` 한 값은 **다른 클라이언트에게 샌다**(`server_reset_query_always` 를 쓰지 않는 한). 임의 확장 파라미터를 `track_extra_parameters` 에 넣어도 "대부분의 파라미터는 완전히 추적되지 않는다"고 문서가 경고한다.
- 시작 패킷에 허용되지 않은 파라미터를 보내면 오류가 나므로, 알고 있는 것만 `ignore_startup_parameters`(예: `options`, `extra_float_digits`)로 무시시킬 수 있다.

### prepared statement

- 프로토콜 수준(드라이버의 Parse/Bind)은 `max_prepared_statements` 가 0 이 아니면 transaction·statement 모드에서도 추적된다. PgBouncer 가 쿼리 문자열마다 내부 이름 `PGBOUNCER_{id}` 를 붙이고, 클라이언트가 쓰는 연결에 아직 없으면 실행 직전에 투명하게 준비한다(FAQ: 1.21.0 부터).
- **SQL 수준 `PREPARE`/`EXECUTE`/`DEALLOCATE` 는 추적하지 않고 그대로 서버로 전달한다.** 예외는 `DEALLOCATE ALL` 과 `DISCARD ALL` 이다.
- 비용: 값은 한 서버 연결에 LRU 로 유지할 개수이며 클수록 PostgreSQL 쪽 메모리, PgBouncer 쪽 메모리와 쿼리 검사·재작성 CPU 가 늘어난다. 문서 예시는 쿼리 200개(평균 5kB)·클라이언트 1000개·`pkt_buf` 4096 일 때 최대 약 17MB 로 계산한다.
- 같은 문자열을 다른 인자·결과 타입으로 쓰는 클라이언트가 섞이거나 DDL 로 컬럼이 바뀌면 "cached plan must not change result type" 오류가 날 수 있고, 문서는 PgBouncer 관리 콘솔의 `RECONNECT` 를 안내한다.
- 추적을 끄는 쪽의 FAQ 안내: JDBC 는 `prepareThreshold=0`, PHP/PDO 는 `ATTR_EMULATE_PREPARES`.

### 어드바이저리 락·LISTEN·임시 테이블

- 세션 수준 어드바이저리 락은 트랜잭션 의미론을 따르지 않고 명시적으로 풀거나 세션이 끝날 때까지 남는다(PostgreSQL 13.3.5). 풀러 뒤에서는 락을 건 클라이언트와 락을 가진 서버 연결이 분리되므로, 락이 다음 클라이언트가 쓰는 연결에 남거나 `unlock` 이 다른 연결로 가서 소용없어진다(필자 추론, 위 직접 실행의 세션 락 항목에서 락이 COMMIT 후에도 연결에 남는 것은 확인). 트랜잭션 수준(`pg_advisory_xact_lock`)은 트랜잭션 끝에 자동으로 풀려 풀링과 맞는다. 더 자세한 락 사용법은 [어드바이저리 락](/develop-wiki/knowledge/data-modeling/advisory-locks/)과 [SKIP LOCKED 대 어드바이저리 락 큐](/develop-wiki/knowledge/data-modeling/skip-locked-vs-advisory-lock-queue/) 노트.
- `LISTEN` 은 알림을 받는 세션이 곧 그 서버 연결이므로 트랜잭션 모드에서 안 맞는다. 리스너는 풀러를 거치지 않는 직접 연결이나 session 모드 전용 풀을 쓴다(필자 정리). `NOTIFY` 는 보내기만 하므로 문제없다.
- 임시 테이블은 `ON COMMIT DROP` 만 안전하다. 그 외는 다음 트랜잭션이 같은 연결에서 이어진다는 보장이 없다.

### 연결 초기화: server_reset_query

- session 모드에서만 연결을 풀에 돌려줄 때 `server_reset_query` 를 실행한다. 기본값 `DISCARD ALL`. `DEALLOCATE ALL` 처럼 가볍게 할 수도 있다.
- transaction 모드에서는 쓰지 않는다. 클라이언트가 세션 기능을 안 쓴다는 전제여서다. 세션 기능을 쓰는 앱이 transaction 모드에 얹혀 있는 상황을 수습하는 용도로 `server_reset_query_always` 가 있다.
- `DISCARD ALL` 은 `CLOSE ALL`, `SET SESSION AUTHORIZATION DEFAULT`, `RESET ALL`, `DEALLOCATE ALL`, `UNLISTEN *`, `pg_advisory_unlock_all()`, `DISCARD PLANS/TEMP/SEQUENCES` 와 같고 트랜잭션 블록 안에서는 못 쓴다(PostgreSQL 문서).

## 직접 실행 (PostgreSQL 쪽 의미론만)

`postgres:18` 임시 컨테이너(`--rm`, tmpfs, 18.7)에서 psql 로 확인했다. **PgBouncer 는 설치하지 않았고 실행하지 않았다**(이 환경에 이미지·바이너리가 없고 네트워크로 받지 않았다). 따라서 아래는 "풀러가 서버 세션을 다음 클라이언트에 넘길 때 PostgreSQL 쪽에서 무엇이 남는가"이고, PgBouncer 의 실제 라우팅·추적은 위 문서 인용이다. 하나의 psql 세션 안에서 클라이언트 A, B 가 번갈아 쓰는 상황을 흉내 냈다.

| 실험 | 결과 |
| --- | --- |
| A: `BEGIN; SET app.tenant='A'; COMMIT;` 후 B: 같은 세션에서 `current_setting('app.tenant', true)` | B 가 `A` 를 본다 (누출) |
| `SET LOCAL app.tenant='A2'` 를 트랜잭션에서 쓴 뒤 COMMIT | 트랜잭션 안에서는 `A2`, 커밋 후에는 이전 값 `A` 로 복귀 |
| 다른 연결(새 세션)에서 같은 설정 조회 | `NULL` (세션이 다르면 값이 안 보임) |
| `pg_advisory_lock(100)` 후 `BEGIN; ... COMMIT;` | COMMIT 후에도 락 유지, 다른 연결의 `pg_try_advisory_lock(100)` 은 `false` |
| 세션 락 42 와 `pg_advisory_xact_lock(43)` 을 각각 자동 커밋으로 실행 후 `pg_locks` | 42 만 남음 (xact 락은 트랜잭션 끝에 해제) |
| 세션 A 에서 `PREPARE q`, 다른 연결에서 `pg_prepared_statements` | 다른 연결은 0 개 |
| `ON COMMIT PRESERVE ROWS` 임시 테이블 vs `ON COMMIT DROP` 후 | `keep` 만 남음 |
| 세션 A 에서 `LISTEN ch`, 다른 연결에서 `NOTIFY ch` | `LISTEN` 한 세션만 알림을 받음 |
| `SET`+`PREPARE`+세션 락 뒤 `DISCARD ALL` | 준비된 문장 0, 어드바이저리 락 0. `current_setting('app.tenant', true)` 는 `NULL` 이 아니라 **빈 문자열** 이었다 |

마지막 줄의 관찰은 RLS 정책을 짤 때 의미가 있다. 값이 없다고 `NULL` 만 방어하면, 리셋된 세션의 빈 문자열이 비교 대상이 될 수 있다(필자 관찰, PostgreSQL 18.7 한 버전에서만 확인).

## 언제 쓰나 (transaction 모드)

- 짧은 트랜잭션이 많은 웹 API 에서 앱 인스턴스 수가 많고 서버 연결을 아끼고 싶을 때.
- 앱이 트랜잭션 안에서만 상태를 쓰도록(`SET LOCAL`, xact 락, 프로토콜 수준 prepared) 통제할 수 있을 때.

session 모드나 직접 연결이 맞는 경우: `LISTEN`/`NOTIFY` 수신자, 세션 어드바이저리 락을 쓰는 리더 선출·잡 워커, `WITH HOLD` 커서, 장기 세션 설정을 쓰는 마이그레이션·배치.

## 주의·비용

- 깨짐이 비결정적이다. 부하가 낮은 개발 환경에서는 한 서버 연결이 재사용되어 멀쩡해 보이다가 운영에서만 증상이 나온다(필자 정리, 문서의 "비결정적 깨짐" 문구와 같은 취지).
- ORM·드라이버가 기본으로 서버 측 prepared statement 를 쓰는지 확인하라. `max_prepared_statements` 를 켜면 메모리·CPU 비용과 plan 오류 가능성(DDL 시)을 감수한다.
- 풀 크기는 `default_pool_size`(기본 20, 사용자·DB 쌍마다), `max_client_conn`(기본 100)과 `min_pool_size` 등으로 정하고, 파일 디스크립터 한도를 함께 올려야 한다.
- `server_reset_query_always` 는 증상을 가리는 응급책이다. 클라이언트가 트랜잭션마다 상태를 잃는 쪽으로 깨짐이 결정적이 될 뿐 앱 수정이 정답이다.
- 이 표는 문서 현재판 기준이다. 홈페이지 뉴스에는 1.26.1 이 가장 최신으로 보였으나, 위 표와 기본값이 각 버전에서 같은지는 확인하지 않았다.

## 검증 범위

PgBouncer features, config(`pool_mode`, `track_extra_parameters`, `ignore_startup_parameters`, `max_prepared_statements`, `server_reset_query(_always)`, `default_pool_size`, `max_client_conn`), FAQ 의 prepared statement 항목을 읽었다. PostgreSQL 18 문서에서는 13.3.5 어드바이저리 락, `SET`, `DISCARD` 를 읽었다. PgBouncer 자체는 실행하지 않았고 위 실험은 PostgreSQL 단독이다. `max_prepared_statements` 기본값과 도입 버전은 NEWS 에서 확인했으나 그 밖의 버전별 변경 이력, `LISTEN` 대체 설계, PgBouncer 이외 풀러(RDS Proxy, Odyssey, pgcat 등)는 조사하지 않았다.

---
title: PostgreSQL XID 랩어라운드와 vacuum freeze 운영
aka: [XID Wraparound, Transaction ID Wraparound, vacuum_freeze_min_age, autovacuum_freeze_max_age, relfrozenxid, datfrozenxid, Aggressive Vacuum, Anti-wraparound Autovacuum, Multixact]
category: data-modeling
level: advanced
summary: 32비트 트랜잭션 ID 가 순환하기 전에 오래된 행을 동결(freeze)해야 하는 이유, 나이(age) 모니터링, freeze 를 막는 요인(오래된 트랜잭션·슬롯)과 파라미터를 PG 16 실험으로 정리한다.
tags: [postgresql, xid, wraparound, vacuum, freeze, autovacuum, relfrozenxid, operations, monitoring]
related: [data-modeling/mvcc-vacuum, data-modeling/autovacuum-tuning, data-modeling/table-bloat-postgresql, data-modeling/transaction-isolation, data-modeling/db-job-queue, data-modeling/queue-table-partitioning, data-modeling/sharding-partitioning]
sources:
  - https://www.postgresql.org/docs/current/routine-vacuuming.html
updatedAt: 2026-11-19
---

## 문제

PostgreSQL 은 쓰기 트랜잭션마다 32비트 XID 를 받고, 행은 "어느 XID 가 만들었나"를 들고 있다. 비교는 모듈로 2^32 산술이라, 한 XID 를 기준으로 **과거 20억 개와 미래 20억 개**로 나뉜다. 20억 트랜잭션이 지나도 행을 그대로 두면 **과거 행이 갑자기 미래로 보여 사라진다.** 이를 막으려고 모든 테이블이 **20억 트랜잭션마다 최소 한 번은 vacuum** 되어야 한다(공식 문서).

[MVCC 노트](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/)가 개념을 다룬다면 이 노트는 **운영**이다. 어떻게 나이를 보고, 무엇이 동결을 막고, 위험 단계에서 서버가 어떻게 행동하는가.

## 동결(freeze)과 나이

- **동결**: 충분히 오래된 행을 "모든 트랜잭션보다 과거"로 표시해 XID 비교에서 빼는 것. 동결된 행은 순환의 영향을 받지 않는다.
- `pg_class.relfrozenxid`: 이 테이블에 **동결되지 않고 남은 가장 오래된 XID**. vacuum 이 이를 앞으로 옮긴다.
- `pg_database.datfrozenxid`: DB 안 모든 테이블의 `relfrozenxid` 중 최솟값(시스템 카탈로그 포함).
- `age(x)`: 현재 XID 와 x 사이의 트랜잭션 수. 모니터링 대상은 이 나이다.

```sql
-- 테이블별 (TOAST 포함) 나이, 큰 순
SELECT c.oid::regclass AS tbl, greatest(age(c.relfrozenxid), age(t.relfrozenxid)) AS age
FROM pg_class c LEFT JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relkind IN ('r', 'm') ORDER BY 2 DESC LIMIT 10;
SELECT datname, age(datfrozenxid) FROM pg_database;
```

## 파라미터

| 파라미터 | 의미 | 값 |
| --- | --- | --- |
| `vacuum_freeze_min_age` | 행의 XID 가 이만큼 오래돼야 vacuum 이 동결 | PG 16 에서 `SHOW` 로 확인한 기본 5천만 |
| `vacuum_freeze_table_age` | 테이블 나이가 이 값을 넘으면 vacuum 이 **공격적(aggressive)** 모드로 전체를 훑음 | PG 16 기본 1억 5천만(문서상 실효 최대는 `autovacuum_freeze_max_age` 의 0.95배) |
| `autovacuum_freeze_max_age` | 테이블 나이가 이를 넘으면 autovacuum 이 꺼져 있어도 **강제 실행** | 기본 2억, 최대 20억 |

- 일반 vacuum 은 죽은 튜플이 없는 페이지를 건너뛰어 모든 오래된 행을 동결하지 못할 수 있다. 공격적 vacuum 이 동결 가능한 모든 XID(와 multixact ID)를 처리해 `relfrozenxid` 를 전진시킨다.
- `autovacuum_freeze_max_age` 를 20억으로 올리면 `pg_xact` 가 약 0.5 GB, `pg_commit_ts` 가 약 20 GB 까지 커진다고 문서가 경고한다.
- 최신 문서에는 일반 vacuum 이 미리 일부 all-visible 페이지를 동결해 나중의 공격적 vacuum 부담을 줄이는 eager scanning(`vacuum_max_eager_freeze_failure_rate`)이 있다. 아래 실험은 PG 16 이라 해당 기능은 직접 확인하지 못했다.

## 서버의 단계적 행동 (공식 문서)

1. 나이가 `autovacuum_freeze_max_age` 를 넘으면 anti-wraparound autovacuum 이 돈다.
2. 랩어라운드까지 **4천만 트랜잭션 이하**가 되면 경고를 로그에 낸다(`must be vacuumed within N transactions`).
3. **300만 이하**가 되면 새 XID 발급을 거부한다. 읽기 전용 트랜잭션만 시작되고 쓰기는 실패하며, VACUUM 은 실행할 수 있다.

복구에 단일 사용자 모드로 내리지 않는다. 문서는 불필요하고 더 위험하다고 쓴다. 순서는 (1) 오래된 prepared 트랜잭션 처리, (2) 긴 트랜잭션 종료, (3) 낡은 복제 슬롯 삭제, (4) 슈퍼유저로 대상 DB 에서 `VACUUM`(이 상황에서 `VACUUM FULL`·`VACUUM FREEZE` 는 피하라고 한다), (5) autovacuum 설정 점검이다.

## 실험으로 확인 (PostgreSQL 16.15, 임시 컨테이너)

`pgbench` 로 `SELECT pg_current_xact_id()` 를 별도 트랜잭션 수만큼 돌려 XID 를 소모했다.

**1. 꺼 둔 autovacuum 도 강제로 돈다.** 테이블에 `autovacuum_enabled=false`, `autovacuum_freeze_max_age=100000` 을 주고 약 16만 XID 를 소모했다. 나이가 임계를 넘자 autovacuum 이 1분 간격으로 계속 실행됐다(`autovacuum_count` 증가).

**2. 그런데 `relfrozenxid` 는 그대로였다.** 나이 16만 인데도 값이 전진하지 않았다. `vacuum_freeze_min_age`(5천만)보다 젊은 행은 동결 대상이 아니기 때문이다. 이것이 "autovacuum 이 계속 도는데 나이가 안 줄어든다"의 한 원인이다. 테이블에 `autovacuum_freeze_min_age=1000` 을 주고 나서야 다음 실행에서 `relfrozenxid` 가 전진해 나이가 0 이 됐다. 이때 `datfrozenxid` 의 나이는 다른 테이블(카탈로그)이 붙들어 그대로였다. **DB 나이는 가장 뒤처진 테이블이 정한다.**

**3. 열린 트랜잭션이 동결 한계를 붙든다.** 다른 세션에서 XID 를 받은 트랜잭션을 60초 열어 둔 채 4만 XID 를 더 소모하고 `VACUUM (FREEZE)` 를 실행했다. `relfrozenxid` 는 그 트랜잭션의 XID(320746)에서 멈췄고 나이는 4만이었다. 트랜잭션을 끝낸 뒤 같은 명령으로 나이가 0 이 됐다. 문서가 든 3대 원인(오래된 prepared 트랜잭션, 긴 트랜잭션, 낡은 복제 슬롯)이 같은 방식으로 작용한다.

```sql
-- 막는 요인 점검
SELECT gid, age(transaction) FROM pg_prepared_xacts;
SELECT pid, age(backend_xid) xid_age, age(backend_xmin) xmin_age FROM pg_stat_activity WHERE backend_xid IS NOT NULL OR backend_xmin IS NOT NULL;
SELECT slot_name, age(xmin) xmin_age, age(catalog_xmin) cat_age FROM pg_replication_slots;
```

## 운영 체크리스트

- `age(datfrozenxid)` 와 테이블별 나이를 수집해 `autovacuum_freeze_max_age`(기본 2억) 대비 비율로 알람을 건다. 경고가 서버 로그에 뜨는 4천만 이하까지 기다리면 늦다.
- 큰 테이블은 anti-wraparound vacuum 이 길고 I/O 가 크다. **예상 가능한 시간대에 직접 `VACUUM (FREEZE)`** 로 미리 동결하면 성수기에 강제 vacuum 이 겹치는 일을 피한다.
- autovacuum 의 비용 한도·워커 수가 큰 테이블 동결을 못 따라가는지 확인한다 → [autovacuum 튜닝](/develop-wiki/knowledge/data-modeling/autovacuum-tuning/).
- 긴 트랜잭션·prepared 트랜잭션·복제 슬롯 나이를 함께 감시한다. 이것들은 팽창([테이블 팽창](/develop-wiki/knowledge/data-modeling/table-bloat-postgresql/))과 랩어라운드 두 문제의 공통 원인이다.
- 쓰기가 많은 큐 테이블은 XID 를 빠르게 소모한다. 파티션 단위로 오래된 부분을 버리면 동결 대상이 줄어든다 → [큐 테이블 파티셔닝](/develop-wiki/knowledge/data-modeling/queue-table-partitioning/).

## 언제 문제가 되나

- 쓰기 트랜잭션이 많은 시스템: 초당 1,000 개면 20억 XID 는 약 23일(2×10^9 ÷ 1000 ÷ 86400, 단순 계산), 초당 1만 개면 약 2.3일이다.
- vacuum 이 꺼졌거나 막힌 상태가 오래 이어진 DB. 장기간 방치된 복제 슬롯이 가장 흔한 숨은 원인이다.
- 대형 테이블이 많아 anti-wraparound vacuum 이 겹치는 DB.

## 주의 (비용)

- **임계에 닿기 전엔 증상이 없다.** 대부분 "갑자기" 쓰기가 막힌 것으로 경험된다. 지표 수집이 유일한 방어다.
- `vacuum_freeze_min_age` 를 낮추면 곧 다시 수정될 행도 일찍 동결해 I/O 를 낭비할 수 있고, 높이면 vacuum 이 더 자주 전체를 훑어야 한다. 문서가 밝힌 상충 관계다.
- `autovacuum_freeze_max_age` 를 올리는 것은 시간을 사는 것일 뿐 비용이 늘어난다(`pg_xact`·`pg_commit_ts` 크기).
- **multixact** 도 별도로 순환한다(행 잠금 공유 시 사용). `relminmxid`/`autovacuum_multixact_freeze_max_age` 로 비슷하게 감시하고, 멤버 저장소가 약 10 GB 를 넘으면 공격적 vacuum 이 돈다.
- 이 노트는 PostgreSQL 16 실험이다. 최신 버전의 eager freezing 등 동작 변화는 공식 문서(current)만 읽었고 실행하지 않았다.

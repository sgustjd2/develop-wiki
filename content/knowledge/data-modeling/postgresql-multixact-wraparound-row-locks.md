---
title: PostgreSQL multixact 와 행 잠금 운영 (wraparound 포함)
aka: [Multixact, MultiXact ID, MXID, relminmxid, FOR KEY SHARE, Foreign Key Lock, pg_multixact, multixact wraparound, 멀티 트랜잭션 ID]
category: data-modeling
level: advanced
summary: 한 행을 여러 트랜잭션이 동시에 잠글 때 PostgreSQL 이 xmax 대신 쓰는 multixact ID 가 어떤 상황에서 폭증하는지, 왜 별도 wraparound 감시가 필요한지, FK 핫 로우로 직접 재현한 수치와 대응을 정리한다.
tags: [postgresql, multixact, row-lock, foreign-key, vacuum, wraparound, operations, monitoring, pgrowlocks]
related: [data-modeling/xid-wraparound-vacuum-freeze, data-modeling/autovacuum-tuning, data-modeling/mvcc-vacuum, data-modeling/optimistic-pessimistic-locking, data-modeling/transaction-isolation, data-modeling/table-bloat-postgresql, data-modeling/primary-key-design, data-modeling/db-job-queue]
sources:
  - https://www.postgresql.org/docs/current/routine-vacuuming.html
  - https://www.postgresql.org/docs/current/explicit-locking.html
  - https://www.postgresql.org/docs/current/runtime-config-vacuum.html
  - https://www.postgresql.org/docs/current/pgrowlocks.html
updatedAt: 2026-11-19
---

## 문제

PostgreSQL 은 행 잠금 정보를 별도 잠금 테이블이 아니라 **튜플 헤더의 `xmax`** 에 둔다. 잠그는 트랜잭션이 하나면 그 XID 를 넣으면 된다. 둘 이상이 같은 행을 동시에 잠그면 한 칸에 다 못 담으므로 **multixact ID(MXID)** 라는 별도 번호를 만들어 `xmax` 에 넣고, 실제 멤버 목록은 `pg_multixact` 디렉터리에 저장한다.

문제는 MXID 도 **32비트 카운터**이고 멤버 저장소도 별도의 32비트 카운터라는 점이다. [XID 처럼](/develop-wiki/knowledge/data-modeling/xid-wraparound-vacuum-freeze/) 오래된 값을 정리(동결)하지 못하면 순환 위험이 생기고, 임계에 닿으면 새 MXID 를 못 만들어 **잠금이 필요한 쓰기가 막힌다.** 평소에는 보이지 않다가 특정 워크로드(FK 가 걸린 핫 로우)에서 갑자기 커진다.

## 언제 multixact 가 생기나

공식 문서의 잠금 모드: 외래 키가 있으면 자식 행 삽입·갱신 시 부모 행에 `FOR KEY SHARE` 가 걸린다(문서의 내용은 잠금 모드 정의이고, FK 가 이 모드를 쓴다는 설명은 아래 실험으로 확인했다). `FOR KEY SHARE`/`FOR SHARE` 는 **서로 호환**되므로 여러 트랜잭션이 같은 행을 동시에 잡을 수 있다. 이때 MXID 가 필요하다.

직접 실행으로 확인한 상황(PostgreSQL 16.15, 임시 컨테이너):

1. **FK 부모의 핫 로우**: 두 세션이 같은 부모를 참조하는 자식을 삽입하자 `pgrowlocks` 에 `multi = t`, 멤버 두 XID 가 모두 `Key Share` 로 나왔다.
2. **같은 트랜잭션 안의 세이브포인트**: `SELECT ... FOR SHARE` 후 `SAVEPOINT` 하고 같은 행을 `UPDATE` 하니 MXID 가 2 개 소비됐다. 세이브포인트 없이 같은 두 문장은 0 개였다. 서브트랜잭션이 별도 XID 라 한 행에 "잠금 보유자 둘"이 되기 때문이라고 이해한다(문서의 "서브트랜잭션이어도 한 행에 충돌 잠금을 보유할 수 있다" 서술과 일치).

## 직접 실행: 얼마나 빨리, 얼마나 크게 늘어나나

부모 1 행을 참조하는 자식 삽입 트랜잭션(커밋 전 `pg_sleep` 으로 잠금 유지)을 pgbench 로 8 초씩 실행하고, 체크포인트 후 `next_multixact_id`·`next_multi_offset`(멤버 카운터) 변화를 비교했다.

| 잠금 유지 | 동시 클라이언트 | 소비 MXID | 소비 멤버 수 | 멤버/MXID |
| --- | --- | --- | --- | --- |
| 10 ms | 4 | 2,522 | 9,390 | 3.7 |
| 10 ms | 16 | 10,024 | 102,327 | 10.2 |
| 10 ms | 32 | 19,792 | 461,348 | 23.3 |
| 50 ms | 4 | 575 | 2,045 | 3.6 |
| 50 ms | 16 | 2,376 | 22,733 | 9.6 |
| 50 ms | 32 | 4,763 | 100,753 | 21.2 |

- 핫 로우에서는 **트랜잭션 하나당 거의 MXID 하나**가 소비된다(15 초 실행에서 삽입 약 19,000 건에 MXID 19,266 개). 부모 행을 1,000 개로 흩뿌리면 같은 15 초에 170 개였다.
- **멤버 소비는 동시성에 대해 초선형**이다. 새 MXID 를 만들 때 기존 멤버를 모두 복사해 새 목록을 만들기 때문으로 보이며, 동시 32 에서 MXID 하나가 평균 20 개 이상의 멤버를 가졌다. 멤버 카운터가 먼저 임계에 닿을 수 있다(문서: 멤버 저장소가 약 10 GB 를 넘으면 공격적 vacuum 이 잦아지고 약 20 GB 에서 순환).
- 이 모사에서 TPS 는 거의 변하지 않았다(`pg_sleep` 이 지배). 즉 **처리량에는 안 보이고 카운터에만 쌓이는** 문제다. 실제 지연 영향은 측정하지 않았다.
- 모든 수치는 한 대의 컨테이너, 단순 삽입 모사에서 얻었다.

### vacuum 으로 정리

핫 로우 실험 직후 `pg_class.relminmxid`: 부모 테이블 1(나이 19,437), 자식 테이블 19,438(나이 0). 부모 행의 `xmax` 는 MXID 19267 이었다. `VACUUM (FREEZE) parent` 후 부모의 `relminmxid` 가 19438(나이 0)로 올랐고 해당 행의 `xmax` 는 0 이 됐다. 문서 설명대로 vacuum 이 오래된 MXID 를 0·단일 XID·새 MXID 로 치환하고 `relminmxid` 를 전진시킨다.

## 운영: 감시와 파라미터

```sql
-- 테이블별 MXID 나이 (큰 순)
SELECT oid::regclass AS rel, mxid_age(relminmxid) AS mxid_age
FROM pg_class WHERE relkind IN ('r','m','t') ORDER BY 2 DESC LIMIT 10;
-- 데이터베이스별
SELECT datname, mxid_age(datminmxid) FROM pg_database ORDER BY 2 DESC;
-- 현재 잠금·멤버 확인 (pgrowlocks 확장, 테이블 전체를 읽으므로 큰 테이블엔 무거움)
SELECT locked_row, multi, xids, modes FROM pgrowlocks('parent');
```

| 파라미터 (PG 16 기본값, 직접 조회) | 의미 |
| --- | --- |
| `vacuum_multixact_freeze_min_age` (5백만) | vacuum 이 이 나이보다 오래된 MXID 를 치환 |
| `vacuum_multixact_freeze_table_age` (1.5억) | `relminmxid` 가 이 나이면 공격적 vacuum |
| `autovacuum_multixact_freeze_max_age` (4억) | 이 나이면 autovacuum 이 꺼져 있어도 강제 vacuum |
| `vacuum_multixact_failsafe_age` (16억) | 최후 수단 모드(문서: 보통 XID 방지 autovacuum 이 한동안 돈 뒤 발동) |

문서가 밝힌 안전장치: MXID 가 순환점 4천만 전에 도달하면 경고를 내고, 300만 이하로 남으면 **새 MXID 생성을 거부**한다. 복구는 XID 와 같은 절차를 따르되, XID 와 달리 복제 슬롯은 MXID 정리를 직접 막지 않아 슬롯 삭제는 보통 해법이 아니라고 문서가 적는다. MXID 는 `pg_stat_activity` 같은 뷰에 직접 안 보이므로 오래된 XID 를 가진 트랜잭션을 찾아야 한다.

## 줄이는 방법

1. **핫 로우 분산**: 모든 요청이 같은 부모 행을 FK 로 참조하는 구조(예: 단일 설정·테넌트·집계 행)를 피한다. 행이 갈라지면 위 실험처럼 MXID 소비가 100 배 가까이 줄었다.
2. **트랜잭션을 짧게**: 잠금 유지 시간이 길수록 겹치는 보유자가 늘어 MXID 당 멤버 목록이 커진다. 위 표에서 같은 클라이언트 수일 때 멤버/MXID 는 유지 시간과 거의 무관했고(동시성이 결정), 유지 시간이 길면 총 소비량이 줄었던 것은 단지 완료 트랜잭션 수가 줄어서다. 그러므로 짧게 하는 효과는 이 실험으로 입증하지 못했고, 오래 열린 트랜잭션이 vacuum 을 막는 문제(앞 노트)가 주된 이유다.
3. **불필요한 서브트랜잭션 제거**: 잠근 행을 건드리는 `SAVEPOINT`, PL/pgSQL 의 `EXCEPTION` 블록, ORM 의 중첩 트랜잭션이 위 실험처럼 MXID 를 만든다.
4. **적절한 잠금 모드**: 키를 안 바꾸는 갱신이면 `FOR NO KEY UPDATE`, 읽고 막을 뿐이면 `FOR KEY SHARE` 처럼 필요한 만큼만 강하게. 불필요한 `FOR SHARE` 는 호환 잠금을 늘려 MXID 를 만든다(이 해석은 의견).
5. **FK 제거는 최후**: 극단적 핫 로우에서만 FK 를 앱·배치 검증으로 대체한다. 정합성을 DB 가 보장하는 이점을 잃는다.
6. **vacuum 이 따라가게**: 핫 테이블의 `autovacuum_multixact_freeze_max_age` 와 vacuum 주기를 감시하고, 오래 열린 트랜잭션을 없앤다 → [autovacuum 튜닝](/develop-wiki/knowledge/data-modeling/autovacuum-tuning/).

## 언제 쓰나 (이 노트의 관점)

- FK·`FOR SHARE`·`FOR KEY SHARE` 를 많이 쓰는 OLTP 에서, 특정 부모 행이 매우 자주 참조될 때 사전 점검한다.
- XID wraparound 알람은 있는데 MXID 알람은 없는 모니터링을 보완할 때.
- 작업 큐에서 `SKIP LOCKED` 로 행을 잡는 구조 → 잠금은 보통 독점(`FOR UPDATE`)이라 MXID 문제가 적다 → [DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/).

## 주의 (비용)

- 위 수치는 PostgreSQL 16.15, 단일 컨테이너, 삽입만 있는 모사다. 버전·하드웨어·실제 쿼리 혼합에 따라 달라진다. 최신 버전의 변경(예: 멤버 저장소 처리 개선 여부)은 확인하지 않았다.
- `pgrowlocks` 는 테이블을 한 행씩 읽는 느린 도구이고 일관된 스냅샷도 아니다. 운영에서 상시 쿼리하지 않는다.
- `VACUUM FREEZE` 는 테이블 전체를 읽는 I/O 비용이 있다. 임계 직전에 급히 돌리기보다 나이를 감시해 일찍 돌린다.
- 행 잠금은 디스크 쓰기를 유발할 수 있다(문서). 잠금 자체의 비용도 있다.
- 낙관적 잠금으로 바꾸면 잠금은 줄지만 충돌 재시도 비용이 생긴다 → [낙관/비관 락](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/).

## 검증 범위

PostgreSQL 공식 문서(Routine Vacuuming 의 Multixacts 절, Explicit Locking 의 행 잠금, vacuum 설정, pgrowlocks)를 읽었다. 위 실험은 임시 `postgres:16` 컨테이너에서 실행했고 종료 후 컨테이너와 볼륨을 삭제했다. 임계 부근(경고·생성 거부·failsafe)은 재현하지 않았고 문서 서술만 옮겼다.

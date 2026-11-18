---
title: PostgreSQL autovacuum 튜닝 (테이블별 파라미터)
aka: [Autovacuum Tuning, autovacuum_vacuum_scale_factor, autovacuum_vacuum_threshold, vacuum cost delay, pg_stat_user_tables, autovacuum 설정]
category: data-modeling
level: advanced
summary: autovacuum 이 언제 시작하고(임계 공식), 얼마나 빨리 끝내며(비용 기반 지연), 무엇이 청소를 막는지(오래 열린 트랜잭션)를 이해하고 테이블별 파라미터로 조정하는 방법.
tags: [postgresql, autovacuum, vacuum, storage-parameters, operations, pg-stat, bloat]
related: [data-modeling/mvcc-vacuum, data-modeling/table-bloat-postgresql, data-modeling/db-job-queue, data-modeling/skip-locked-vs-advisory-lock-queue, data-modeling/transaction-isolation, data-modeling/index-design, data-modeling/zero-downtime-migration]
sources:
  - https://www.postgresql.org/docs/current/routine-vacuuming.html
  - https://www.postgresql.org/docs/current/runtime-config-vacuum.html
updatedAt: 2026-11-19
---

## 문제

[MVCC 와 VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/)에서 본 것처럼 UPDATE·DELETE 는 죽은 튜플을 남기고, 청소는 autovacuum 이 맡는다. 기본 설정은 작은~중간 테이블에 맞춰져 있다. 문제는 세 곳에서 생긴다.

- **시작이 늦다**: 임계가 테이블 크기에 비례해 큰 테이블일수록 청소 시점이 멀다.
- **끝이 느리다**: I/O 를 아끼려는 비용 기반 지연 때문에 큰 테이블 청소가 오래 걸린다.
- **청소가 돌아도 못 지운다**: 오래 열린 트랜잭션이 죽은 튜플을 아직 필요한 것으로 만든다.

## 시작 조건 (공식 문서의 공식)

테이블마다 autovacuum 이 다음을 본다(`reltuples` = 추정 행 수).

| 종류 | 트리거 조건 |
| --- | --- |
| 죽은 튜플 vacuum | 마지막 vacuum 이후 죽은 튜플 > `min(vacuum_max_threshold, vacuum_threshold + vacuum_scale_factor × reltuples)` |
| 삽입 vacuum | 삽입 수 > `insert_threshold + insert_scale_factor × reltuples × (1 − relallfrozen/relpages)` (동결·가시성 맵 갱신용, 추가 전용 테이블) |
| analyze | 삽입·갱신·삭제 수 > `analyze_threshold + analyze_scale_factor × reltuples` |
| 랩어라운드 방지 | `relfrozenxid` 나이 > `autovacuum_freeze_max_age` 이면 autovacuum 이 꺼져 있어도 항상 |

기본값(PostgreSQL 18 문서 기준): `autovacuum_vacuum_threshold = 50`, `autovacuum_vacuum_scale_factor = 0.2`, `autovacuum_vacuum_max_threshold = 1억`(18 에서 추가, 이전 버전에는 없음), `autovacuum_vacuum_insert_threshold = 1000`, `autovacuum_analyze_threshold = 50`, `autovacuum_analyze_scale_factor = 0.1`, `autovacuum_naptime = 1min`, `autovacuum_max_workers = 3`.

10만 행 테이블의 기본 임계는 50 + 0.2 × 100,000 = **20,050** 이다. 1억 행이면 2천만이다(18 은 상한 1억).

### 실행으로 확인 (PostgreSQL 16.15, 임시 컨테이너)

`autovacuum_naptime = 5s` 로 켜고, 10만 행 테이블에서 `pg_stat_user_tables` 를 3초 간격으로 봤다(삽입 vacuum 은 결과가 섞이지 않게 테이블 파라미터로 끔).

```sql
CREATE TABLE ev3 (id int PRIMARY KEY, v int NOT NULL DEFAULT 0)
  WITH (autovacuum_vacuum_insert_threshold = -1);
SELECT n_dead_tup, autovacuum_count FROM pg_stat_user_tables WHERE relname = 'ev3';
```

| 단계 | n_dead_tup | autovacuum_count |
| --- | --- | --- |
| 1.5만 행 UPDATE (임계 20,050 미만) | 15,000 | 0 (18초 관찰 동안 유지) |
| 1만 행 추가 UPDATE (누적 25,000) | 25,000 → **0** | 0 → **1** (약 9초 안에) |
| 테이블별 `scale_factor=0.01`, `threshold=1000` (임계 2,000) 후 3,000행 UPDATE | 3,000 → 0 | 1 → 2 |

기본값에서는 임계에 못 미치면 죽은 튜플이 그대로 남았고, 테이블별로 낮추자 훨씬 일찍 돌았다. 한 가지 주의: 처음 실험에서 삽입 직후 autovacuum 이 예상 밖으로 한 번 돌아 카운터가 섞였다. 대량 INSERT 직후에는 삽입 vacuum·analyze 가 먼저 돌 수 있다.

## 테이블별 조정

```sql
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,    -- 1% 변경이면 시작
  autovacuum_vacuum_threshold    = 1000,
  autovacuum_analyze_scale_factor = 0.02
);
-- 확인
SELECT relname, reloptions FROM pg_class WHERE relname = 'orders';
```

- 갱신이 잦은 **큰 테이블**과 **큐 테이블**([DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/))에만 낮춘다. 전역 값을 낮추면 작은 테이블 수천 개에 워커가 자주 돈다.
- 큰 테이블의 scale_factor 를 낮추는 대신 `autovacuum_vacuum_threshold` 를 고정값으로 키우는 방식(scale 0, threshold 5만 등)도 쓴다. 변경량이 행 수와 무관하게 일정할 때 맞다(일반 운영 패턴).
- 설정 후에는 **실제로 도는지** 본다: `last_autovacuum`, `autovacuum_count`, `n_dead_tup`, 서버 파라미터 `log_autovacuum_min_duration` 로그.

## 속도: 비용 기반 지연

autovacuum 은 I/O 를 쓰는 만큼 비용을 쌓고 한도에 닿으면 쉰다.

- 페이지 비용: 버퍼 적중 1(`vacuum_cost_page_hit`), 디스크 읽기 2(`page_miss`), 깨끗한 페이지를 더럽힘 20(`page_dirty`).
- 한도 `vacuum_cost_limit` = 200(autovacuum 은 `autovacuum_vacuum_cost_limit = -1` 로 이 값을 따름), 한도에 닿으면 `autovacuum_vacuum_cost_delay`(기본 2ms)만큼 쉰다. 수동 VACUUM 은 기본 지연이 0 이다.
- 예: 기본 한도 200 은 문서 설명으로 페이지 약 10개를 더럽히거나 디스크에서 100페이지를 읽으면 도달하므로 큰 테이블에서는 느리다. 한도가 **워커들 사이에서 나뉘어**(자체 비용 파라미터를 가진 테이블 제외) 워커를 늘려도 총 I/O 는 같다. 즉 `autovacuum_max_workers` 만 늘리는 것으로는 빨라지지 않고 `autovacuum_vacuum_cost_limit` 도 올려야 한다.
- 특정 테이블만 빨리 끝내려면 그 테이블에 `autovacuum_vacuum_cost_limit`/`cost_delay` 를 직접 준다. 디스크 여유와 쓰기 부하를 보며 올린다.

## 청소를 막는 것

같은 실험에서, 다른 세션이 `REPEATABLE READ` 트랜잭션을 연 채 40초 동안 쥐고 있게 하고 3,000행을 UPDATE 했다.

| 상태 | n_dead_tup | autovacuum_count |
| --- | --- | --- |
| 긴 트랜잭션이 열려 있는 24초 동안 | **3,000 그대로** | 2 → 7 (계속 돌지만 못 지움) |
| 트랜잭션 종료 후 약 6초 | **0** | 11 |

autovacuum 은 **돌고 있다.** 그런데 가장 오래된 스냅샷이 아직 볼 수 있는 튜플은 지울 수 없어서 `n_dead_tup` 이 줄지 않고, 워커만 반복해서 I/O 를 쓴다. 공식 문서가 꼽는 요인은 오래 열린 트랜잭션, 오래된 prepared transaction, 지연된 복제 슬롯이다. 찾는 곳: `pg_stat_activity.backend_xmin`, `pg_prepared_xacts`, `pg_replication_slots`.

그 밖: autovacuum 은 `SHARE UPDATE EXCLUSIVE` 락을 쥐므로 충돌하는 락 요청이 오면 중단된다(랩어라운드 방지 vacuum 은 제외). 이런 명령을 상시 돌리면 끝나지 못한다. 임시 테이블은 autovacuum 대상이 아니고, 파티션 부모 테이블은 autoanalyze 가 안 된다.

## 언제 쓰나

- 갱신·삭제가 잦은 테이블에서 `n_dead_tup` 이 임계 근처까지 쌓이거나, 팽창이 반복될 때. 팽창이 이미 크면 해소 절차는 [팽창 진단과 해소](/develop-wiki/knowledge/data-modeling/table-bloat-postgresql/).
- 큰 테이블의 통계가 오래돼 계획이 틀어질 때(analyze 임계 조정).
- 큐·세션·카운터처럼 같은 행을 반복 갱신하는 테이블.

## 주의 (비용)

- **autovacuum 을 끄지 않는다.** 랩어라운드 방지 vacuum 은 어차피 돌고, 그때는 중단되지 않아 가장 나쁜 시점에 돈다.
- **너무 공격적이면** 작은 테이블에 워커가 계속 붙고 I/O·캐시를 쓴다. 비용 한도를 올리면 전면 쓰기 I/O 가 늘어 사용자 쿼리 지연에 영향을 준다. 지표를 보며 단계적으로 조정한다.
- **설정만 바꾸고 원인을 두면 소용없다.** 긴 트랜잭션·미사용 복제 슬롯을 먼저 찾는다. 애플리케이션이 트랜잭션을 열어 둔 채 외부 호출을 하는지 확인한다.
- **버전 차이.** 이 노트의 기본값은 PostgreSQL 18 문서이고 실험은 16.15 에서 했다. `autovacuum_vacuum_max_threshold` 는 18 에서 도입돼 16 에서는 없다. 사용 중인 버전의 문서를 확인한다.
- 테이블 파라미터 변경은 `SHARE UPDATE EXCLUSIVE` 락을 잡는다고 알려져 있으나(이 노트에서 직접 확인하지 않음) 운영 중 적용 전 영향을 확인한다.
- 이 노트의 대기 시간은 `autovacuum_naptime = 5s` 로 줄인 환경에서 얻은 것이다. 기본(1min)에서는 시작이 더 늦을 수 있다.

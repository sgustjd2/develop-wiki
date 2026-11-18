---
title: PostgreSQL 테이블·인덱스 팽창 진단과 해소
aka: [Table Bloat, Index Bloat, pgstattuple, pg_repack, VACUUM FULL, REINDEX CONCURRENTLY, fillfactor, HOT, 팽창]
category: data-modeling
level: advanced
summary: 죽은 행이 만든 빈 공간이 파일 크기로 남는 PostgreSQL 팽창을 pgstattuple 로 측정하고, VACUUM·REINDEX CONCURRENTLY·VACUUM FULL·pg_repack 중 무엇으로 줄일지 고르는 절차.
tags: [postgresql, bloat, vacuum, pgstattuple, pg-repack, reindex, fillfactor, operations]
related: [data-modeling/mvcc-vacuum, data-modeling/index-design, data-modeling/explain-analyze, data-modeling/zero-downtime-migration, data-modeling/db-job-queue, data-modeling/optimistic-pessimistic-locking]
sources:
  - https://www.postgresql.org/docs/current/routine-vacuuming.html
  - https://www.postgresql.org/docs/current/pgstattuple.html
  - https://www.postgresql.org/docs/current/sql-reindex.html
  - https://www.postgresql.org/docs/current/storage-hot.html
  - https://reorg.github.io/pg_repack/
updatedAt: 2026-11-19
---

## 문제

[MVCC 와 VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/) 노트가 설명하듯 PostgreSQL 은 UPDATE·DELETE 가 이전 행 버전을 바로 지우지 않는다. 표준 `VACUUM` 은 죽은 버전을 지워 그 공간을 **재사용 가능**으로 표시할 뿐, 테이블 끝의 완전히 빈 페이지를 제외하면 운영체제에 **파일을 돌려주지 않는다**(공식 문서). 그래서 한때 대량 삭제·갱신이 있었던 테이블은 데이터가 줄어도 파일 크기가 그대로이고 이것이 **팽창(bloat)** 이다.

팽창의 대가:
- 디스크와 백업·복제 용량 낭비.
- 같은 데이터를 읽으려고 더 많은 페이지를 읽어 순차 스캔과 캐시 효율이 나빠진다.
- 인덱스도 따로 부풀어 인덱스 스캔이 느려진다.

이 노트는 "왜 생기나"가 아니라 **재고 측정하고 줄이는 순서**를 다룬다. 원인(오래 열린 트랜잭션, 복제 슬롯 등)은 mvcc-vacuum 노트에 있다.

## 1. 측정: 얼마나 부풀었나

`pgstattuple` 확장은 테이블을 직접 읽어 죽은 튜플과 빈 공간 비율을 알려 준다(슈퍼유저 또는 `pg_stat_scan_tables` 롤 필요).

```sql
CREATE EXTENSION pgstattuple;
SELECT table_len, dead_tuple_percent, free_percent FROM pgstattuple('t');       -- 정확, 전체 스캔
SELECT scanned_percent, approx_free_percent FROM pgstattuple_approx('t');        -- 근사, visibility map 으로 건너뜀
SELECT avg_leaf_density, leaf_fragmentation, leaf_pages FROM pgstatindex('t_pkey'); -- B-tree 인덱스
```

- `pgstattuple` 은 **전체 테이블을 읽는다.** 읽기 잠금만 걸어 쓰기를 막지는 않지만 I/O 부담이 있고 결과가 한 순간의 스냅숏은 아니다.
- `pgstattuple_approx` 는 visibility map 비트가 선 페이지를 건너뛴다(그 페이지는 죽은 튜플이 없다고 가정). 큰 테이블에서 훨씬 싸다. 죽은 튜플 수는 정확하고 나머지(살아 있는 튜플·빈 공간)는 추정이다.
- `pgstatindex` 의 `avg_leaf_density`(잎 페이지 평균 밀도)가 낮으면 인덱스가 성글다는 뜻이다.

### 직접 실험 (PostgreSQL 16, 도커 컨테이너)

10만 행(정수 + 100자 문자열) 테이블, 자동 VACUUM 끔, 절반을 `DELETE`:

| 단계 | 결과 |
| --- | --- |
| 적재 직후 | 13 MB |
| `DELETE` 5만 행 후 | 죽은 튜플 45.6%, 빈 공간 0.6% |
| 표준 `VACUUM` 후 | **파일 13 MB 그대로**. 죽은 튜플 0%, **빈 공간 48.8%**. `pgstattuple_approx` 는 스캔 0% 로 빈 공간 48.5% 추정 |
| 기본키 인덱스 | 잎 밀도 45.06%, 잎 페이지 274개 |
| `REINDEX INDEX CONCURRENTLY` 후 | 잎 밀도 89.83%, 잎 페이지 137개(절반) |
| `VACUUM FULL` 후 | 6,904 kB (약 절반) |

표준 VACUUM 은 공간을 비웠지만 파일은 줄이지 못했다. 앞으로 들어올 행이 그 빈 공간을 채운다면 문제가 아니다. **다시 늘어날 일이 없는 테이블**일 때만 반환이 의미 있다.

## 2. 해소 사다리: 가벼운 것부터

| 방법 | 효과 | 잠금 | 추가 공간 | 쓸 때 |
| --- | --- | --- | --- | --- |
| 표준 `VACUUM`(autovacuum) | 죽은 버전 제거, 공간 **재사용** | 일반 쓰기와 공존 | 없음 | 상시 |
| `REINDEX INDEX CONCURRENTLY` | 인덱스를 새로 짓고 교체 | `SHARE UPDATE EXCLUSIVE`. 쓰기 계속 가능 | 인덱스 하나만큼 | 인덱스만 부풀었을 때 |
| `VACUUM FULL` / `CLUSTER` | 테이블을 새 파일로 다시 씀. 크기 최소화 | **`ACCESS EXCLUSIVE`**. 읽기·쓰기 모두 막힘 | 테이블 크기만큼 | 점검 시간이 있을 때 |
| `pg_repack`(확장) | 온라인으로 새 테이블 구성 후 교체 | 시작·교체 때만 짧은 `ACCESS EXCLUSIVE` | 테이블+인덱스의 약 2배 | 서비스 중 테이블을 줄여야 할 때 |

- 공식 문서는 정기적인 표준 VACUUM 으로 `VACUUM FULL` 이 필요 없게 하는 것이 목표이고, 갑작스러운 갱신 폭증으로 심하게 부풀었을 때만 FULL 이 필요하다고 안내한다. FULL·CLUSTER·테이블을 다시 쓰는 `ALTER TABLE` 변형은 모두 **새 사본을 만들어 인덱스를 다시 짓고** 완료 전까지 추가 디스크를 약 테이블 크기만큼 쓴다.
- `REINDEX ... CONCURRENTLY` 는 트랜잭션 블록 안에서 못 쓰고, 테이블을 두 번 스캔하며 더 오래 걸린다. 실패하면 `INVALID` 인덱스(`_ccnew`)가 남아 쓰기 비용만 늘리므로 지우고 다시 한다. 배제 제약 인덱스는 동시 재생성이 안 된다(공식 문서).
- **pg_repack** 은 로그 테이블과 트리거로 원본의 변경을 기록하고, 새 테이블에 행을 복사해 인덱스를 만들고, 로그를 적용한 뒤 시스템 카탈로그에서 테이블을 **교체**한다. 요구 사항: 대상 테이블에 기본키(또는 NOT NULL 컬럼의 고유 인덱스)가 있어야 하고, 작업 중 그 테이블에 DDL 을 못 한다. 임시 테이블은 못 다룬다.

## 3. 예방: 부풀기 전에

- **autovacuum 이 제때 돌게 한다.** 공식 문서에 따르면 임계값은 `autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × 튜플 수` 이고(`autovacuum_vacuum_max_threshold` 로 상한), 큰 테이블일수록 기본 비율로는 청소 시점이 늦다. 갱신이 잦은 큰 테이블만 테이블별로 비율을 낮춘다.
- **HOT 업데이트**를 노린다. 인덱스된 컬럼을 바꾸지 않고 같은 페이지에 새 버전을 넣을 공간이 있으면 인덱스 항목을 만들지 않고 페이지 안에서 정리된다(공식 문서). 갱신이 잦은 테이블은 `fillfactor` 를 낮춰 페이지에 여유를 남긴다.

```sql
CREATE TABLE h2 (id int PRIMARY KEY, n int, pad text) WITH (fillfactor = 70);
-- 확인: SELECT n_tup_upd, n_tup_hot_upd FROM pg_stat_all_tables WHERE relname = 'h2';
```

  실험(행 2만 개, 전체를 한 번 `UPDATE`): `fillfactor` 기본값 테이블은 HOT 갱신 **0건**, `fillfactor = 70` 테이블은 **8,398건**(약 42%). 테이블 크기는 3,640 kB 대 4,080 kB 로 여유 공간만큼 커졌다. 한 번에 전체를 바꾸는 최악의 경우라 이 정도지만, 행마다 갱신이 분산되면 비율이 더 높아질 수 있다. 값은 워크로드에 맞춰 측정한다.
- **오래 열린 트랜잭션·복제 슬롯**이 청소를 막지 않게 한다 → [MVCC 와 VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/).
- 큐처럼 행이 생겼다 바로 지워지는 테이블은 팽창하기 쉽다 → [DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/). 파티션으로 나눠 옛 파티션을 통째로 `DROP` 하면 VACUUM 이 필요 없다(일반 기법).

## 언제 쓰나

- 대량 삭제·아카이빙 후 디스크가 줄지 않을 때, 인덱스 스캔이 점점 느려질 때.
- 이상 징후(쿼리 느려짐, 디스크 경보)를 보고 **원인이 팽창인지 확인**하는 첫 단계로 pgstattuple 을 쓴다 → [EXPLAIN ANALYZE](/develop-wiki/knowledge/data-modeling/explain-analyze/).

## 주의 (비용)

- **"팽창 퍼센트"의 정의가 도구마다 다르다.** 통계만으로 팽창을 추정하는 쿼리는 오차가 있을 수 있다(일반론). 정확한 값은 pgstattuple 로 본다. 이 노트의 수치는 직접 만든 합성 데이터이고 운영 환경은 다르다.
- **파일 크기가 줄어드는 것이 목표인지** 먼저 묻는다. 재사용 가능한 빈 공간은 성능 문제가 아니며, 대규모 재작성(FULL, repack)은 더 큰 위험(락, 디스크, 복제 지연)을 낳을 수 있다.
- `VACUUM FULL` 은 **서비스 중 쓰지 않는다.** 테이블 전체에 `ACCESS EXCLUSIVE` 를 잡고 새 사본이 완료될 때까지 디스크를 두 배로 쓴다.
- **pg_repack 은 디스크가 넉넉해야 한다**(테이블+인덱스의 약 2배)와 교체 직전 짧은 배타 잠금을 감수해야 한다. 중간에 실패하면 임시 객체(트리거 등)가 남을 수 있다는 진단 메시지가 문서에 있다.
- 테이블을 줄여도 **원인을 그대로 두면 다시 부푼다.** autovacuum 설정, 긴 트랜잭션, 갱신 패턴을 같이 고친다.
- `fillfactor` 를 낮추면 처음부터 테이블이 커지고 순차 스캔이 늘어난다. 읽기 위주 테이블에는 손해다.

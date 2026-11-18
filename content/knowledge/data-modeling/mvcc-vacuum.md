---
title: MVCC와 VACUUM
aka: [MVCC, Multi-Version Concurrency Control, VACUUM, Autovacuum, Dead Tuple, Table Bloat, HOT Update, XID Wraparound, InnoDB Undo Log, Purge]
category: data-modeling
level: advanced
summary: 읽기와 쓰기가 서로 막지 않도록 행의 여러 버전을 유지하는 MVCC 가 PostgreSQL 에서 만드는 죽은 튜플·팽창과 VACUUM 의 역할, InnoDB 의 undo 로그 방식과의 차이.
tags: [rdbms, mvcc, postgresql, mysql, vacuum, bloat, transaction, operations]
related: [data-modeling/transaction-isolation, data-modeling/optimistic-pessimistic-locking, data-modeling/explain-analyze, data-modeling/index-design, data-modeling/db-job-queue]
sources:
  - https://www.postgresql.org/docs/current/mvcc-intro.html
  - https://www.postgresql.org/docs/current/routine-vacuuming.html
  - https://www.postgresql.org/docs/current/runtime-config-vacuum.html
  - https://www.postgresql.org/docs/current/storage-hot.html
  - https://www.postgresql.org/docs/current/ddl-system-columns.html
  - https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html
updatedAt: 2026-11-19
---

## 문제

잠금만으로 일관성을 지키면 읽는 쪽이 쓰는 쪽을, 쓰는 쪽이 읽는 쪽을 기다린다. 긴 리포트 쿼리 하나가 주문 입력을 멈춘다.

MVCC 는 행을 덮어쓰지 않고 **버전을 쌓아** 이를 푼다. 각 트랜잭션은 시작 시점의 스냅숏을 보고, PostgreSQL 문서의 표현대로 읽기는 쓰기를 막지 않고 쓰기는 읽기를 막지 않는다. 대가로 **낡은 버전의 청소**라는 일이 생긴다. 이 청소를 모르면 "테이블이 계속 커진다", "갑자기 쓰기가 멈춘다" 같은 장애를 만난다.

## 해법: PostgreSQL 의 방식

- 행마다 `xmin`(이 버전을 만든 트랜잭션 ID), `xmax`(지운 트랜잭션 ID, 없으면 0)가 있다. 스냅숏은 이 값들로 "내게 보이는 버전"을 판단한다.
- `UPDATE` = 새 버전 삽입 + 옛 버전에 `xmax` 표시. `DELETE` = `xmax` 만 표시. 옛 버전(**죽은 튜플**)은 **같은 힙 파일 안에 그대로 남는다.**
- 아무도 그 버전을 볼 수 없게 되면 **VACUUM** 이 치우고 공간을 재사용 가능으로 표시한다.

```sql
SELECT xmin, xmax, ctid, * FROM orders WHERE id = 42;   -- 버전 정보 관찰
UPDATE orders SET status = 'paid' WHERE id = 42;
SELECT xmin, xmax, ctid, * FROM orders WHERE id = 42;   -- xmin·ctid 가 바뀜(새 버전)
```

### VACUUM 이 하는 일 (공식 문서의 4가지 이유)

1. 죽은 튜플 공간을 재사용 가능하게 만든다(보통 OS 에 반환하지는 않는다).
2. 플래너 통계 갱신(`ANALYZE`).
3. **가시성 맵** 갱신 → 인덱스 온리 스캔이 힙을 건너뛴다.
4. **트랜잭션 ID 랩어라운드 방지**: XID 는 32비트라 약 20억 뒤에는 과거 행이 "미래"로 보인다. 오래된 행을 **동결(freeze)** 해 둬야 한다.

| | `VACUUM` | `VACUUM FULL` |
| --- | --- | --- |
| 잠금 | 일반 읽기·쓰기와 동시 실행 | `ACCESS EXCLUSIVE` (테이블 사용 불가) |
| 공간 | 테이블 내 재사용, 끝쪽 빈 페이지만 반환 | 새 파일로 재작성, OS 에 반환. 임시로 테이블 크기만큼 추가 디스크 필요 |
| 용도 | 상시 | 심한 팽창을 정말 줄여야 할 때만 |

### Autovacuum

기본 켜져 있고 끄지 않는다. 테이블별로 `threshold + scale_factor × 행 수` 만큼 변경이 쌓이면 돈다. 기본값(PostgreSQL 18 문서): `autovacuum_vacuum_threshold = 50`, `autovacuum_vacuum_scale_factor = 0.2`(행의 20%), `autovacuum_naptime = 1min`, `autovacuum_max_workers = 3`, `autovacuum_freeze_max_age = 2억`.

1억 행 테이블은 2000만 행이 죽어야 시작한다. 큰 테이블은 테이블 단위로 낮춘다.

```sql
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_threshold = 1000);
```

### 청소를 막는 것들 (운영에서 진짜 원인)

- **오래 열린 트랜잭션**(특히 `idle in transaction`): 그 시점 이전 버전을 못 치운다. `pg_stat_activity` 로 찾고 `idle_in_transaction_session_timeout`, 애플리케이션 쪽 짧은 트랜잭션으로 막는다.
- 오래된 **준비된 트랜잭션**(`pg_prepared_xacts`), 방치된 **복제 슬롯**(`pg_replication_slots`).
- `SHARE UPDATE EXCLUSIVE` 와 충돌하는 명령을 상시 돌려 autovacuum 이 끝나지 못하는 경우.

### HOT 업데이트

인덱스된 칼럼을 안 바꾸고, 같은 페이지에 새 버전 들어갈 공간이 있으면 **인덱스 항목을 추가하지 않고** 힙 안에서 버전을 잇는다. 중간 버전은 VACUUM 없이 정리된다. 갱신이 잦은 테이블은 `fillfactor` 를 낮춰(예: 70) 페이지에 여유를 둔다. `pg_stat_all_tables` 의 `n_tup_hot_upd / n_tup_upd` 로 비율을 본다. 갱신 칼럼에 불필요한 인덱스를 달면 HOT 가 깨진다 → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).

## 비교: MySQL InnoDB

| | PostgreSQL | InnoDB |
| --- | --- | --- |
| 옛 버전 위치 | 힙(본 테이블) 안 | 별도 **undo 로그** (롤백 세그먼트) |
| 현재 행 | 새 버전이 새 위치에 삽입됨 | 클러스터드 인덱스에서 **제자리 갱신**, 롤 포인터(`DB_ROLL_PTR`)로 옛 버전 재구성 |
| 삭제 | `xmax` 표시 | 삭제 표시 후 **purge** 스레드가 제거 |
| 청소 주체 | VACUUM / autovacuum | purge (백그라운드) |
| 오래 열린 트랜잭션의 대가 | 테이블·인덱스 **팽창** | undo 보존 → 롤백 세그먼트/언두 테이블스페이스 증가, 조회 시 옛 버전 재구성 비용 |
| 보조 인덱스 | 새 버전마다 인덱스 항목(HOT 제외) | 제자리 갱신 안 함: 삭제 표시 + 새 항목 삽입, 이후 purge |
| 별도 운영 과제 | XID 랩어라운드 동결 | 해당 없음(구조가 다름) |

공통 교훈은 같다. MySQL 문서도 **읽기만 하는 트랜잭션도 주기적으로 커밋**하라고 한다. 안 그러면 undo 를 버리지 못한다.

## 언제 신경 쓰나

- 갱신·삭제가 잦은 테이블(세션, 큐, 카운터, 상태 칼럼)이 시간이 갈수록 느려지거나 커질 때.
- 인덱스 온리 스캔의 `Heap Fetches` 가 큰데 VACUUM 이 안 돌 때 → [EXPLAIN](/develop-wiki/knowledge/data-modeling/explain-analyze/).
- 대량 삭제·대량 갱신 배치를 설계할 때(한 번에 수억 행 갱신 = 수억 개의 죽은 튜플).
- 큐처럼 짧게 사는 행이 많은 패턴 → [DB 작업 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/).

## 주의

- **`VACUUM FULL` 을 습관처럼 쓰지 않는다.** 서비스 중 테이블이 잠긴다. 공식 문서는 일반 VACUUM 을 권한다. 정말 줄여야 하면 별도 도구(`pg_repack` 류)를 검토하되 도구 요건과 잠금은 직접 확인한다(이 노트의 출처 범위 밖).
- 일반 VACUUM 은 공간을 **재사용 가능**하게 할 뿐 파일을 줄이지 않는다. "VACUUM 했는데 디스크가 안 줄어요"는 정상이다.
- 랩어라운드가 임박하면(약 300만 트랜잭션 전) 새 XID 발급을 거부해 쓰기가 멈춘다. `age(datfrozenxid)` 를 모니터링한다. 복구는 슈퍼유저로 일반 `VACUUM`.
- autovacuum 설정을 올려 "느리게" 두는 것은 죽은 튜플을 쌓는 선택이다. 비용 제한(`cost_delay`)과 I/O 영향을 보며 조정한다.
- 스냅숏 격리·직렬화 이상 현상은 MVCC 의 결과이므로 [트랜잭션 격리](/develop-wiki/knowledge/data-modeling/transaction-isolation/)와 함께 이해한다.

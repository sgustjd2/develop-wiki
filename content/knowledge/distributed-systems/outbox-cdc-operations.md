---
title: 아웃박스 + CDC 운영 (슬롯 모니터링·하트비트)
aka: [Outbox CDC Operations, Debezium Outbox Event Router, Replication Slot Monitoring, WAL Retention, Heartbeat, 슬롯 모니터링]
category: distributed-systems
level: advanced
summary: 트랜잭셔널 아웃박스를 CDC(Debezium+PostgreSQL)로 릴레이할 때의 운영 쟁점. 복제 슬롯이 붙잡는 WAL 감시, 저트래픽 DB 하트비트, 슬롯 1개당 소비자 1개, 장애 조치, 아웃박스 정리, 중복 처리.
tags: [outbox, cdc, debezium, postgresql, replication-slot, wal, heartbeat, operations]
related: [distributed-systems/transactional-outbox, distributed-systems/change-data-capture, distributed-systems/idempotency, architecture/event-driven, data-modeling/mvcc-vacuum, data-modeling/table-bloat-postgresql, performance/backpressure-load-shedding, distributed-systems/saga]
sources:
  - https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html
  - https://debezium.io/documentation/reference/stable/connectors/postgresql.html
  - https://www.postgresql.org/docs/current/view-pg-replication-slots.html
  - https://www.postgresql.org/docs/current/logicaldecoding-explanation.html
updatedAt: 2026-11-19
---

## 문제

[트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)와 [CDC](/develop-wiki/knowledge/distributed-systems/change-data-capture/) 노트는 구조와 기본 함정을 다뤘다. 이 조합을 실제로 돌리면 **코드가 아니라 슬롯과 WAL 이 장애를 낸다.** 이 노트는 운영 체크리스트에 집중한다.

## 구성

1. 앱이 업무 테이블과 `outbox` 테이블에 **같은 트랜잭션**으로 쓴다.
2. Debezium 이 PostgreSQL 복제 슬롯으로 WAL 을 읽는다.
3. Outbox Event Router(SMT)가 아웃박스 행을 이벤트로 바꿔 브로커 토픽에 보낸다.

Debezium 문서의 기본값을 정리하면 다음과 같다.

| 항목 | 기본 동작 |
| --- | --- |
| 테이블 컬럼 | `id`, `aggregatetype`, `aggregateid`, `type`, `payload` (이름은 설정으로 바꿈) |
| 토픽 | `aggregatetype` 값으로 정해짐. 기본은 `outbox.event.<값>` |
| 메시지 키 | `aggregateid`. 같은 집합체의 이벤트가 한 파티션에 모여 **순서가 유지**됨 |
| `id` | 이벤트 헤더로 전달. 소비자의 중복 제거에 쓰도록 의도됨 |
| 갱신(UPDATE) | 아웃박스는 큐로 보고 삽입만 기대. UPDATE 는 `table.op.invalid.behavior`(기본 경고)로 처리 |
| 삭제(DELETE) | SMT 가 자동으로 걸러 이벤트로 내보내지 않음 |

커넥터는 아웃박스 테이블만 캡처하게 하고, SMT 를 그 이벤트에만 적용한다(문서 권고).

## 1. 슬롯이 붙잡는 WAL 을 감시한다

복제 슬롯은 소비자가 아직 받지 않은 WAL 을 서버가 지우지 못하게 한다. 커넥터가 멈추거나 느리면 **DB 디스크가 찬다.** `pg_replication_slots` 에서 볼 열은 다음과 같다(PostgreSQL 문서).

| 열 | 의미 |
| --- | --- |
| `active` | 지금 스트리밍 중인지 |
| `restart_lsn` | 소비자가 필요로 할 수 있는 가장 오래된 WAL 위치. 여기부터 보존됨 |
| `confirmed_flush_lsn` | (논리 슬롯) 소비자가 받았다고 확인한 위치. 이전 트랜잭션은 다시 못 받음 |
| `wal_status` | `reserved`(`max_wal_size` 안) → `extended`(초과했지만 슬롯 등으로 보존 중) → `unreserved`(다음 체크포인트에서 지워질 수 있음) → `lost`(사용 불가) |
| `safe_wal_size` | 슬롯이 `lost` 되기 전까지 더 쓸 수 있는 WAL 바이트. `max_slot_wal_keep_size` 가 -1(무제한)이면 비어 있음 |

경보 쿼리의 뼈대는 이렇다.

```sql
SELECT slot_name, active, wal_status, safe_wal_size,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
-- 경보: active = false 가 일정 시간 이상, wal_status IN ('unreserved','lost'),
--       retained 가 디스크 여유의 일정 비율 이상
```

- `max_slot_wal_keep_size` 로 상한을 두면 디스크는 지키지만 상한을 넘은 슬롯은 `lost` 가 돼 **소비자가 이어 읽을 수 없다.** 이때는 스냅숏부터 다시 해야 한다. 디스크 보호와 이벤트 유실 위험의 맞교환이므로 값과 경보 임계를 함께 정한다.
- `inactive_since`, `invalidation_reason`, `failover` 같은 열이 있다는 것은 문서 페이지로 확인했지만, 어느 PostgreSQL 버전에서 추가됐는지는 해당 페이지에 적혀 있지 않았다. 쓰는 버전의 문서에서 확인한다.
- Debezium 문서는 `confirmed_flush_lsn` 이 계속 전진하는데 `restart_lsn` 이 늦으면 DB 가 WAL 을 묶음 단위로 회수하는 것이므로 정상이라고 설명한다.

## 2. 이벤트가 드문 DB 에는 하트비트를 준다

슬롯은 **DB 하나 단위**인데 WAL 은 **서버 전체**가 공유한다. 같은 서버의 다른 DB 가 시끄럽고 아웃박스를 가진 DB 는 조용하면, 커넥터는 확인(ack)할 LSN 을 갱신할 기회가 없어 WAL 이 계속 쌓인다. Debezium 문서가 설명하는 시나리오다.

- `heartbeat.interval.ms`(기본 0 = 꺼짐)를 양수로 두면 주기적으로 하트비트를 내보내 LSN 을 확인한다.
- `heartbeat.action.query` 로 하트비트 때마다 저트래픽 DB 안의 작은 테이블에 행을 쓰게 하면 그 DB 에서 실제 변경이 생겨 LSN 이 전진한다. 그 테이블은 퍼블리케이션에 포함돼야 한다(`ALTER PUBLICATION ... ADD TABLE`).
- 문서는 AWS RDS 에서 아무도 안 쓰는데도 시스템 테이블 쓰기가 약 5분마다 생겨 비슷한 상황이 생길 수 있다고 덧붙인다.

보존 WAL 의 규모를 어림하는 산술 모델은 간단하다. 슬롯이 전진하지 못하는 시간 × 같은 서버의 WAL 생성 속도다. 다른 DB 가 시간당 2000MB 를 쓴다고 가정하면 다음과 같다. 측정값이 아니라 **산술**이다.

| 설정 | 슬롯이 전진하는 간격(최악) | 보존 WAL 어림 |
| --- | --- | --- |
| 하트비트 없음, 아웃박스 이벤트 하루 1건 | 약 24시간 | 약 48GB (24시간 × 2000MB) |
| 하트비트 없음, 시간당 10건 | 약 6분 | 약 200MB |
| `heartbeat.interval.ms` = 60초 | 60초 | 약 33MB |
| `heartbeat.interval.ms` = 10초 | 10초 | 약 6MB |

## 3. 슬롯 하나에 소비자는 하나

슬롯은 위치 포인터를 하나만 가진다. 문서는 여러 커넥터가 같은 슬롯을 공유하면 각 변경이 한 소비자에게만 전달돼 **다른 커넥터는 이벤트를 영영 못 받고, PostgreSQL 은 경고도 주지 않는다**고 경고한다. 커넥터마다 고유한 슬롯 이름과 퍼블리케이션을 둔다.

## 4. 슬롯 수명과 장애 조치

- 커넥터가 정상 종료될 때 슬롯을 지우는 `slot.drop.on.stop` 은 기본 꺼짐이고 **테스트 전용**이다. 슬롯을 지우면 DB 가 WAL 을 버려서 그 사이의 변경을 놓친다.
- DB 를 `pg_upgrade` 등으로 올리는 절차에서는 커넥터를 먼저 멈춰 남은 이벤트를 모두 브로커로 보낸 뒤 슬롯을 DBA 가 직접 지우고, 업그레이드 후 새 슬롯을 만들게 하는 절차가 문서에 있다.
- **프라이머리 장애 조치**에서 슬롯은 복제본에 자동으로 따라가지 않는다. PostgreSQL 17 이상은 슬롯을 `failover` 로 표시해 스탠바이에 동기화할 수 있고, Debezium 은 `slot.failover = true` 와 서버의 `synchronized_standby_slots` 설정으로 이를 지원한다. 그 미만 버전이나 설정이 없는 환경은 장애 조치 뒤 슬롯과 저장된 오프셋의 정합성을 직접 점검해야 한다. Debezium 은 이를 위한 오프셋 검증 전략(`trust_offset` 등)을 제공하고, 슬롯이 장애 조치에서 살아남는다는 보장이 있어야 쓸 수 있는 전략을 따로 표시한다.

## 5. 아웃박스 테이블 정리

아웃박스는 계속 쌓인다. 라우터가 DELETE 를 무시하므로 **캡처가 끝난 행을 지워도 이벤트는 다시 나가지 않는다.** 정리 방식은 몇 가지다.

- 주기 삭제 작업: 단순하지만 대량 DELETE 는 죽은 튜플과 [테이블 팽창](/develop-wiki/knowledge/data-modeling/table-bloat-postgresql/)을 만든다 → [MVCC 와 VACUUM](/develop-wiki/knowledge/data-modeling/mvcc-vacuum/).
- 날짜 기준 파티션 후 오래된 파티션을 통째로 분리·삭제하는 방식. 이 노트가 제안하는 설계 후보이며 Debezium 문서에서 확인한 내용은 아니다. 파티션 테이블의 CDC 캡처 동작은 쓰는 버전 문서에서 확인한다.
- 삭제 전에 **슬롯이 그 행을 이미 읽었는지** 행 단위로 확인하기는 쉽지 않다. 이 노트의 제안은 최대 예상 슬롯 지연보다 충분히 오래된 행만 지우는 보수적인 보존 기간(예: 수 시간~수 일)을 두는 것이다.

## 6. 소비자: 중복과 순서

CDC 전달은 최소 한 번이다. 커넥터가 재시작하면 마지막으로 저장된 오프셋부터 다시 내보내 같은 이벤트가 다시 온다. 소비자는 이벤트 `id` 로 중복을 걸러야 한다 → [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/).

```ts
// 처리 기록(이벤트 id)과 업무 변경을 같은 트랜잭션에 묶는다
await db.transaction(async (tx) => {
  const inserted = await tx.processedEvents.insertIgnore({ id: event.headers.id });
  if (!inserted) return;               // 이미 처리한 이벤트
  await applyBusinessChange(tx, event);
});
```

릴레이가 배치 50건마다 오프셋을 저장하고 일정 확률로 중간에 죽도록 한 모의 실험(1000개 이벤트, 크래시 6회)에서는 전달 1160건 중 중복이 160건이었고, `id` 로 걸러내자 1000건이 정확히 한 번씩 적용됐다. 같은 집합체 안의 순서 역전은 0 건이었다(키를 집합체 id 로 두고 한 파티션을 한 소비자가 순서대로 처리하는 모델). 이 수치는 모델의 결과이지 Debezium 의 측정값이 아니다.

## 언제 쓰나

- 이벤트 유실이 곤란하고 폴링 방식의 DB 부하·지연을 피하고 싶은 서비스, 이미 Kafka Connect 를 운영하는 조직.
- 규모가 작고 이벤트가 드물면 [폴링 퍼블리셔](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)가 운영 부담이 적을 수 있다.

## 주의 (비용)

- **CDC 파이프라인은 DB 의 가용성 위험이 된다.** 슬롯이 DB 디스크와 카탈로그 정리(VACUUM)에 영향을 주므로, 장애 등급은 앱이 아니라 DB 와 같게 취급한다.
- 모든 문제는 **소비자가 멈춘 상태가 오래 가는 것**에서 시작한다. 커넥터 장애 알림에 슬롯 지연 경보를 같이 건다. 더 큰 시스템에서는 [배압](/develop-wiki/knowledge/performance/backpressure-load-shedding/)처럼 어느 단계가 막혔는지 구분해서 본다.
- 순서 보장은 **집합체 단위**까지다. 서로 다른 집합체 사이 순서를 기대하면 안 된다.
- 페이로드를 바꾸는 버전 전략(스키마 버전 필드, 구버전 소비자 호환)은 Debezium 설정(`table.field.event.schema.version`)이 있는 정도만 확인했다. 계약 관리는 별도 설계가 필요하다.
- 이 노트는 PostgreSQL + Debezium 기준이다. MySQL·MongoDB 는 슬롯 개념과 SMT 가 다르다(Debezium 문서에 따르면 MongoDB 는 전용 아웃박스 SMT 가 있다). 각 문서를 따로 확인한다.

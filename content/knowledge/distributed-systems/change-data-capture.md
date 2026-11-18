---
title: 변경 데이터 캡처 (CDC)
aka: [Change Data Capture, CDC, Log-based CDC, Logical Decoding, Debezium, Replication Slot, WAL]
category: distributed-systems
level: intermediate
summary: 애플리케이션이 두 곳에 쓰는 대신, DB 의 트랜잭션 로그에서 커밋된 변경을 읽어 이벤트 스트림으로 내보내 다른 저장소·서비스를 동기화하는 기법과 그 운영 함정.
tags: [cdc, debezium, wal, logical-decoding, replication-slot, kafka, postgresql, dual-write]
related: [distributed-systems/transactional-outbox, distributed-systems/idempotency, distributed-systems/consistency-models, architecture/event-driven, architecture/event-sourcing, data-modeling/mvcc-vacuum, data-modeling/zero-downtime-migration]
sources:
  - https://martin.kleppmann.com/2015/05/27/logs-for-data-infrastructure.html
  - https://debezium.io/documentation/reference/stable/connectors/postgresql.html
  - https://www.postgresql.org/docs/current/logicaldecoding-explanation.html
  - https://www.postgresql.org/docs/current/runtime-config-replication.html
updatedAt: 2026-11-19
---

## 문제

주문을 DB 에 저장하면서 검색 인덱스, 캐시, 분석 DB 도 갱신해야 한다. 애플리케이션이 각 저장소에 따로 쓰면(**이중 쓰기, dual write**):

- 한쪽만 성공하고 다른 쪽이 실패하면 저장소들이 어긋난다.
- 같은 키를 두 클라이언트가 동시에 고치면 저장소마다 **적용 순서가 달라져** 오류 없이 영구히 불일치한다.

분산 트랜잭션으로 묶기에는 비용이 크고 저장소가 지원하지 않는 경우가 많다.

## 해법: DB 의 변경 로그를 원천으로 삼는다

애플리케이션은 **DB 한 곳에만** 쓴다. DB 는 이미 변경을 순서대로 트랜잭션 로그(WAL 등)에 남기므로, 이 로그를 읽어 이벤트 스트림으로 내보내고 다른 저장소가 구독한다. Kleppmann 은 이를 "로그를 통합 지점으로 쓴다"고 설명한다. 순서가 하나로 정해져 이중 쓰기의 경쟁 조건이 사라지고, 소비자마다 읽은 위치를 기억해 장애 후 이어 받는다. 새 뷰는 로그를 처음부터 재생해 만들 수 있다.

### PostgreSQL + Debezium 의 구조

- PostgreSQL **논리 디코딩**(logical decoding)이 WAL 의 변경을 소비자가 이해하는 형식으로 바꾼다. 변경 스트림은 **복제 슬롯**(replication slot)으로 관리하며, 슬롯은 연결과 무관하게 남고 자기 위치를 가진다.
- Debezium PostgreSQL 커넥터는 슬롯을 통해 읽고, 플러그인은 PostgreSQL 10+ 내장인 `pgoutput` 또는 `decoderbufs` 를 쓴다.
- 처음 시작하면 **일관된 스냅숏**으로 기존 행을 `READ` 이벤트로 내보낸 뒤, 스냅숏 시작 시점의 WAL 위치부터 스트리밍으로 이어 간다. 스냅숏 도중 멈추면 재시작 시 스냅숏을 다시 한다.
- 이벤트는 키(기본키)와 값(`before`, `after`, `source`, `op`)으로 구성된다. `op` 은 `c`(생성)·`r`(스냅숏 읽기) 등이고 `source` 에 LSN 이 있다. LSN 이 커넥터의 오프셋이다.

## 소비자 쪽 규칙

PostgreSQL 문서에 따르면 슬롯의 위치는 체크포인트 때 영속화되므로, **장애 후 슬롯이 이전 LSN 으로 돌아가 같은 변경을 다시 보낼 수 있다.** 소비자는 중복을 견뎌야 한다. 마지막으로 처리한 LSN 을 기록하고 그 이하는 버리면 된다.

```ts
type Change = { lsn: number; op: 'c' | 'u' | 'd'; key: string; after?: string };

// 소비자: 같은 이벤트가 다시 와도(at-least-once) 결과가 같도록 마지막 LSN 이하를 버린다
class Replica {
  rows = new Map<string, string>(); lastLsn = 0;
  apply(e: Change) {
    if (e.lsn <= this.lastLsn) return;               // 중복·재전송 무시
    if (e.op === 'd') this.rows.delete(e.key); else this.rows.set(e.key, e.after!);
    this.lastLsn = e.lsn;                            // 실제 시스템에서는 적용과 같은 트랜잭션에 저장
  }
}
const log: Change[] = [
  { lsn: 10, op: 'c', key: 'u1', after: 'Kim' }, { lsn: 11, op: 'u', key: 'u1', after: 'Kim2' },
  { lsn: 12, op: 'c', key: 'u2', after: 'Lee' }, { lsn: 13, op: 'd', key: 'u1' },
];
const r = new Replica();
[...log, ...log.slice(1)].forEach((e) => r.apply(e));   // 11번부터 재전송된 상황
console.log([...r.rows], r.lastLsn);                      // [ [ 'u2', 'Lee' ] ] 13
```

실행하면 재전송이 있어도 `u2` 만 남고 `lastLsn` 은 13 이다. 멱등성 일반론은 [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) 참고.

## CDC 와 아웃박스

| | 테이블 직접 CDC | 트랜잭셔널 아웃박스 + CDC |
| --- | --- | --- |
| 이벤트 모양 | 테이블 행 변경(내부 스키마 노출) | 업무 의미로 설계한 이벤트 |
| 결합 | 소비자가 테이블 구조에 의존 | 이벤트 계약으로 분리 |
| 작업량 | 앱 변경 없음 | 앱이 아웃박스 행을 같은 트랜잭션에 기록 |

외부로 내보낼 이벤트의 계약을 따로 관리하고 싶으면 [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/) 테이블을 만들고 그 테이블을 CDC 로 읽는다.

## 언제 쓰나

- 검색 인덱스·캐시·데이터 웨어하우스를 원본 DB 와 거의 실시간으로 맞출 때(이중 쓰기 대체).
- 레거시 앱을 고치지 않고 변경 이벤트를 얻고 싶을 때.
- 마이그레이션에서 구 DB 와 신 DB 를 동기화할 때 → [무중단 마이그레이션](/develop-wiki/knowledge/data-modeling/zero-downtime-migration/).

## 주의 (비용)

- **멈춘 슬롯이 DB 를 죽인다.** PostgreSQL 문서는 슬롯이 필요한 WAL 과 시스템 카탈로그 행의 삭제를 막는다고 경고한다. 소비자가 멈추면 WAL 이 디스크에 쌓이고, VACUUM 이 카탈로그 행을 못 지우며, 극단적으로는 트랜잭션 ID 랩어라운드를 막으려고 DB 가 멈출 수 있다. 쓰지 않는 슬롯은 지운다.
  - `max_slot_wal_keep_size`(기본 -1 = 무제한)로 보존량 상한을 둘 수 있다. 상한을 넘으면 그 슬롯의 소비자는 이어서 읽지 못한다. 디스크 보호와 데이터 유실의 맞교환이다.
  - 슬롯별로 `pg_replication_slots` 에서 `restart_lsn` 대비 보유 WAL 크기를 모니터링한다.
- **스키마 변경(DDL)은 변경 이벤트로 나오지 않는다**(논리 디코딩 한계). 스키마 변경 절차를 따로 운영해야 한다.
- **UPDATE·DELETE 의 이전 값**은 `REPLICA IDENTITY` 에 달려 있다. 기본값은 기본키 값만 주고, 전체 이전 값이 필요하면 `FULL` 로 바꿔야 한다. 기본키가 없는 테이블은 변경 이벤트가 제한된다(Debezium 문서).
- 소비는 **비동기**다. 소비자는 약간 뒤처지며 읽기-쓰기 일관성이 자동으로 생기지 않는다. 원본 DB 만이 유일한 쓰기 경로여야 한다. 다른 저장소에 직접 쓰는 순간 이중 쓰기가 돌아온다.
- 전달 보장은 사실상 **최소 한 번**이므로 소비자 멱등성이 필수다. Debezium 문서는 블로킹 스냅숏 때 이미 스냅숏으로 잡은 행과 중복되는 이벤트가 나올 수 있다고 경고한다.

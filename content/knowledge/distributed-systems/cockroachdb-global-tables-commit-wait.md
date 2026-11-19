---
title: CockroachDB GLOBAL 테이블의 미래 타임스탬프 쓰기와 커밋 대기 (non-blocking transactions)
aka: [Non-Blocking Transactions, Non-Blocking Ranges, GLOBAL Table, Global Reads, Commit Wait, maybeCommitWait, Future-time Writes, Synthetic Timestamps, txn.commit_waits, 커밋 대기, 미래 쓰기]
category: distributed-systems
level: advanced
summary: GLOBAL 테이블에 쓰는 트랜잭션은 미래로 닫힌 타임스탬프 위로 밀려 "현재보다 앞선 시각"에 커밋되고, 응답 전에 그 시각까지 기다린다(커밋 대기). 이 대기가 쓰기 지연의 정체이며 읽기를 막지 않는 대가라는 점을 RFC 와 소스로 정리한다.
tags: [cockroachdb, global-tables, non-blocking-transactions, commit-wait, closed-timestamp, hlc, uncertainty-interval, multi-region]
related: [distributed-systems/cockroachdb-closed-timestamps, distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/cockroachdb-timestamp-cache-txn-records, distributed-systems/spanner-truetime, distributed-systems/hybrid-logical-clock, distributed-systems/consistency-models, distributed-systems/calvin-deterministic-transactions]
sources:
  - https://github.com/cockroachdb/cockroach/blob/master/docs/RFCS/20200811_non_blocking_txns.md
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvclient/kvcoord/txn_coord_sender.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_write.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_tscache.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvclient/kvcoord/txn_metrics.go
  - https://www.cockroachlabs.com/docs/stable/table-localities
  - https://www.cockroachlabs.com/docs/stable/cockroach-start
updatedAt: 2026-11-19
---

[닫힌 타임스탬프](/develop-wiki/knowledge/distributed-systems/cockroachdb-closed-timestamps/) 노트는 GLOBAL 테이블 범위가 현재보다 약 800ms 앞선 시각을 닫아 모든 복제본이 현재 시각 읽기를 처리한다는 것까지 다뤘고, "그래서 쓰기가 기다린다"는 부분은 추론으로 남겼다. 이 노트는 그 대기를 RFC(Non-Blocking Transactions, 2020-08-11)와 현재 소스로 확인한다.

## 문제

- 지역 간 RTT 가 100ms 를 넘는 클러스터에서, 거의 바뀌지 않는 참조 데이터(통화 코드, 상품 카탈로그, 외래 키 대상)를 모든 리전에서 로컬로 **일관되게** 읽고 싶다.
- 팔로워 읽기는 과거 시점만 가능하다. 현재 시점은 리스홀더만 안다.
- 쓰기가 드물어도 문제다. 읽기가 아직 커밋 안 된 쓰기의 잠금(intent)을 만나면, 그 트랜잭션 레코드가 있는 먼 리전까지 물어봐야 하므로 1~3ms 가 120~240ms 이상으로 느려진다(RFC "Problem 1: Read Latency under Contention").

## 해법: 쓰기를 미래로 예약하고, 커밋 후 그 시각까지 기다린다

RFC 의 요약을 순서대로 옮기면 이렇다.

1. 범위가 미래 시각을 닫는다(정책 `LEAD_FOR_GLOBAL_READS`). 리드 폭은 대략 "WAN RTT/2 + 최대 시계 오차 + 여유"다.
2. 이 범위에 쓰는 트랜잭션은 닫힌 타임스탬프 **위로** 쓰기 타임스탬프가 밀린다. 사용자에게 별도 "non-blocking 트랜잭션" API 는 없다. 범위 설정만으로 그렇게 된다.
3. 커밋 타임스탬프가 현재보다 앞서 있으므로, 응답 전에 **게이트웨이 시계가 커밋 타임스탬프를 넘을 때까지 잔다(커밋 대기)**.
4. 커밋 시각이 "현재 + 시계 오차" 안으로 들어오기 전에 잠금이 이미 풀려 있으므로, 읽기는 잠금을 만나지 않고 커밋된 값만 본다.
5. 읽기가 미래 값을 **불확실성 구간** 안에서 만나면 타임스탬프를 올리고, 최대 `max_offset` 만큼 기다린다.

### 쓰기가 미래로 밀리는 지점 (소스)

- `replica_write.go` 의 `executeWriteBatch` 는 쓰기를 평가하기 전에 proposal 버퍼에 등록하며 범위의 닫힌 타임스탬프를 받고, 이를 `applyTimestampCache(ctx, ba, minTS)` 의 하한으로 넘긴다.
- `replica_tscache.go` 의 `applyTimestampCache` 는 타임스탬프 캐시 값과 이 하한 중 큰 값의 다음 시각으로 쓰기 타임스탬프를 올린다. 하한 때문에 올랐다면 `kv.closed_timestamp.txns_pushed` 텔레메트리를 올리고 "bumped write timestamp due to closed ts" 를 남긴다.
- GLOBAL 범위의 닫힌 타임스탬프는 미래이므로, 여기서 쓰기는 미래 시각이 된다.

### 커밋 대기 (소스)

`txn_coord_sender.go` 의 `maybeCommitWait` 주석과 코드를 정리하면:

- 대기 목표 = 커밋 타임스탬프(쓰기 타임스탬프). `linearizable` 모드이고 쓰기가 있으면 여기에 `max_offset` 을 더한다.
- 목표가 현재 HLC 이하면 바로 반환한다. 대부분 트랜잭션은 HLC 에서 뽑은 타임스탬프로 커밋하므로 이 빠른 경로를 탄다.
- 기다려야 하는 경우로 주석은 **global_read 범위에 써서 닫힌 타임스탬프에 밀린 트랜잭션**, 그리고 미래 값과 충돌(쓰기-읽기, 쓰기-쓰기)한 트랜잭션을 든다.
- 읽기 전용 트랜잭션도 불확실성 재시작으로 미래 타임스탬프가 됐다면 기다린다. 주석은 이것이 오래된 읽기 방지가 아니라 **단조 읽기(monotonic reads)** 를 위한 것이라고 구분한다.
- 잠을 자기 전 뮤텍스를 푼다. 잠금(intent)은 이미 풀린 뒤다. 그래서 Spanner 와 달리 CockroachDB 는 커밋 대기 중 다른 읽기를 막지 않고, 대신 불확실성 구간이 여전히 필요하다고 주석은 설명한다.
- 대기가 일어날 때마다 지표 `txn.commit_waits` 가 오른다(도움말: "주로 global 범위에 쓰는 트랜잭션에서 발생").
- `DeferCommitWait` 로 호출자가 대기를 미뤄 직접 처리할 수도 있다.

## 왜 읽기 쪽도 기다려야 하나: RFC 예시 재현

RFC 는 시계 오차 10, 미래 쓰기 150, 노드 A 시계가 B 보다 5 빠른 상황을 든다. 직접 실행한 모형(`commit-wait.mjs`) 결과:

| 읽기 트랜잭션 txn2 의 대기 | txn2 (A, ts=140) | txn2 응답 직후 B 에서 시작한 txn3 | 단조 읽기 |
| --- | --- | --- | --- |
| 없음 | 불확실성 상한 150 에서 값@150 을 보고 반환 | ts=135, 상한 145 → 값을 못 봄 | **위반** |
| 있음(커밋 대기) | 값을 본 뒤 A 시계가 150 이 될 때까지 대기 | ts=145, 상한 155 → 값을 봄 | 유지 |

같은 모형으로 쓰기 쪽을 보면, 쓰기 타임스탬프가 "지금 + 리드 L" 로 밀릴 때 클라이언트 체감 지연은 대략 max(L, 쓰기~커밋 시간)이다. RFC 도 커밋 대기가 마지막 합의 라운드와 겹치므로 "지연이 더해지기보다 나머지 지연을 가린다"고 설명한다. 리드 800ms 이면 쓰기 지연이 대략 800ms 수준이 된다는 것이 이 노트의 계산이다(실측 아님).

## 언제 쓰나

- 모든 리전에서 읽고, 쓰기는 드물며, 쓰기 지연 수백 ms~1초를 감수할 수 있는 테이블(참조 데이터, 설정, 거의 안 바뀌는 프로필).
- 외래 키 검사가 원격 리전 리스홀더로 가는 비용을 없애고 싶을 때. RFC 는 기존 "리전마다 복제 인덱스를 두는" 패턴의 대안으로 이것을 제안했다.

## 주의 (비용)

- **쓰기 지연 = 리드 폭.** 공식 문서는 GLOBAL 쓰기가 "미래 타임스탬프를 쓰는 non-blocking 프로토콜"을 쓰며 관측 지연이 `--max-offset` 에 달려 있다고 적고, 멀티 리전 신규 클러스터에 `--max-offset` 을 250ms 로 낮추라고 권한다(기본 500ms). 리드 폭 계산에 `max_offset` 이 들어가기 때문으로 보인다(이 노트의 해석).
- **전염.** RFC 의 상호작용 표에 따르면 GLOBAL 트랜잭션이 일반 범위의 키를 읽거나 쓰면, 그 키에 나중에 쓰는 일반 트랜잭션도 미래로 밀려 커밋 대기를 하게 된다. 쓰기가 잦은 일반 테이블과 GLOBAL 테이블을 한 트랜잭션에 섞으면 지연이 퍼진다.
- **읽기도 가끔 기다린다.** 미래 값이 불확실성 구간 안이면 최대 `max_offset` 대기 또는 재시작이 생긴다. "읽기는 절대 안 막힌다"가 아니라 "잠금 때문에 원격 홉을 하지는 않는다"이다.
- **리드가 부족하면 성능만 나빠진다.** 쓰기·복제가 리드 폭보다 오래 걸리면 팔로워가 현재 시각을 처리하지 못하고 리스홀더로 넘긴다. [닫힌 타임스탬프](/develop-wiki/knowledge/distributed-systems/cockroachdb-closed-timestamps/) 노트의 소스 주석대로 이는 정합성 문제가 아니라 성능 문제다.
- **RFC 와 현재 구현은 다르다.** RFC(상태 in-progress)는 타임스탬프에 "synthetic" 비트를 두자고 제안했지만, 현재 master 의 `hlc/timestamp.go` 에는 synthetic 표시가 없다. 언제 어떻게 바뀌었는지는 확인하지 않았다. 또 RFC 는 읽기 쪽 해법으로 재시도 전에 불확실성을 기다리는 방식을 택하고, 커밋 대기는 "읽기 전용 커밋은 no-op" 성질을 깨므로 피한다고 적었지만, 현재 소스는 읽기 전용 트랜잭션도 커밋 대기를 한다. 동작 설명은 RFC 가 아니라 위의 소스 주석을 기준으로 삼는다.
- Spanner 의 커밋 대기는 모든 읽기-쓰기 트랜잭션에 TrueTime 오차 폭만큼 걸리고 대기 중 잠금을 쥔다([Spanner TrueTime](/develop-wiki/knowledge/distributed-systems/spanner-truetime/)). CockroachDB 는 기본적으로 미래에 커밋한 트랜잭션에만 걸고 잠금은 먼저 푼다.

> 검증 범위: RFC `20200811_non_blocking_txns.md` 의 요약·가정·상세 설계(미래 쓰기, synthetic 타임스탬프, 커밋 대기, 불확실성 예시, 미래 닫힌 타임스탬프, 상호작용 표, 튜닝)를 읽었다. master 소스(2026-11-19 조회)의 `txn_coord_sender.go` `maybeCommitWait` 전체, `replica_write.go` 의 닫힌 타임스탬프 하한 전달부, `replica_tscache.go` `applyTimestampCache`, `txn_metrics.go` 의 `txn.commit_waits` 정의, `hlc/timestamp.go` 에 synthetic 문자열이 없는 것을 확인했다. 공식 문서는 Table Localities 의 GLOBAL 권고와 `cockroach start` 의 `--max-offset` 기본값을 읽었다. RFC 예시와 지연 계산은 Node 모형으로 직접 실행했다(스크래치 `dist/commit-wait.mjs`). 미확인: 읽기 쪽 불확실성 대기의 현재 구현 위치, synthetic 비트 제거 시점, 실제 멀티 리전 클러스터의 쓰기 지연, GLOBAL 의 라이선스·에디션 조건.

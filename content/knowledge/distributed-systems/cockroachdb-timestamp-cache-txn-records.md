---
title: CockroachDB 타임스탬프 캐시와 트랜잭션 레코드·복구
aka: [CockroachDB Timestamp Cache, tscache, Low-Water Mark, Tombstone Marker, Push Marker, QueryIntent Prevent, Indeterminate Commit Recovery, 타임스탬프 캐시]
category: distributed-systems
level: advanced
summary: 읽은 구간의 최대 타임스탬프를 메모리에 기록해 "읽은 값 아래로 쓰기"를 막는 캐시가 트랜잭션 레코드 생성 금지·타임스탬프 밀기·미결 커밋 복구에서도 같은 도구로 쓰이는 방식.
tags: [cockroachdb, timestamp-cache, mvcc, transaction-record, parallel-commits, recovery, snapshot-isolation]
related: [distributed-systems/cockroachdb-parallel-commits, distributed-systems/tikv-vs-cockroachdb-transactions, distributed-systems/hybrid-logical-clock, distributed-systems/percolator-transactions, distributed-systems/spanner-truetime, distributed-systems/leader-lease-clock-assumptions, data-modeling/transaction-isolation]
sources:
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/tscache/cache.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_tscache.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/txnrecovery/manager.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/batcheval/cmd_query_intent.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/batcheval/cmd_recover_txn.go
  - https://github.com/cockroachdb/cockroach/blob/master/docs/RFCS/20180324_parallel_commit.md
updatedAt: 2026-11-19
---

[병렬 커밋](/develop-wiki/knowledge/distributed-systems/cockroachdb-parallel-commits/) 노트는 복구 규칙(없는 쓰기는 **차단**하고 중단 판정)을 요약만 했다. 이 노트는 그 "차단"이 실제로 무엇인지, 곧 **타임스탬프 캐시**와 이를 재활용하는 트랜잭션 레코드 규칙을 소스 주석 수준에서 풀어 쓴다.

## 문제

MVCC 위의 트랜잭션은 세 가지 틈을 막아야 한다.

1. **읽은 값 아래에 쓰기가 끼어드는 것.** 타임스탬프 10 에서 키 x 를 읽은 트랜잭션의 결과를 보존하려면, 이후 x 에 타임스탬프 10 이하로 쓰는 쓰기가 성공하면 안 된다. 읽기는 아무 흔적(락)도 남기지 않을 수 있다.
2. **트랜잭션 레코드가 이미 정리된 뒤에 되살아나는 것.** 다른 트랜잭션이 충돌 때문에 이쪽을 중단시켰는데, 지연됐던 코디네이터 요청이나 재전송이 뒤늦게 레코드를 새로 만들면 안 된다.
3. **복구자가 "없다"고 본 쓰기가 나중에 도착하는 것.** 병렬 커밋 복구자가 약속된 쓰기가 없어서 트랜잭션을 중단 판정했는데, 그 쓰기가 늦게 성공하면 코디네이터는 커밋을 응답한 셈이 된다.

## 해법

### 1. 타임스탬프 캐시: 읽은 곳의 최대 타임스탬프

소스 주석이 설명하는 `tscache` 는 키 범위마다 **읽기·쓰기가 닿은 최대 타임스탬프**를 기록하는 유한 크기의 메모리 구조다. 스냅숏 격리를 지키려고 읽기-쓰기 충돌에서도 읽기 결과를 보존하는, Yabandeh 의 "status oracle" 에 해당한다고 설명한다.

- 읽기(Get/Scan)가 끝나면 그 읽기가 의존한 키 구간과 타임스탬프를 `Add` 한다. 쓰기는 평가 전에 `GetMax` 로 조회해, 자기 타임스탬프가 기록된 값 이하면 `기록값.Next()` 로 **밀어 올린다.** 트랜잭션이 직접 읽은 기록(같은 트랜잭션 ID)은 자기 쓰기를 밀지 않는다.
- 크기가 제한돼서 오래된 항목을 쫓아낼 때는 **low-water mark** 를 올린다. 이 값은 캐시에 남은 구간 중 가장 이른 타임스탬프로 단조 증가하고, 캐시에 없는 키에 쓸 때 대신 조회된다. 초기값은 현재 시각에 최대 시계 오차를 더한 값이다.
- 같은 타임스탬프에 서로 다른 트랜잭션이 기록하면 트랜잭션 ID 를 지워 "누구 소유도 아님"으로 만든다. 그러면 둘 다 서로를 밀게 된다.
- 최소 보존 기간(`MinRetentionWindow`)이 10 초다. 그보다 뒤처진 타임스탬프로 쓰는 트랜잭션은 반드시 커밋 타임스탬프를 올려야 한다.

직접 만든 모형으로 확인했다(키 단위, 가장 이른 항목부터 쫓아냄).

```ts
add(k, ts)  { m.set(k, Math.max(m.get(k) ?? 0, ts)); while (m.size > cap) { /* 최소 ts 항목 제거 */ low = Math.max(low, evictedTs); } }
getMax(k)   { return Math.max(m.get(k) ?? 0, low); }
write(k, ts) { return Math.max(ts, getMax(k) + 1); }   // 읽은 값 위로 밀림
```

- 키 x 를 타임스탬프 10 에서 읽은 뒤 5 로 쓰면 11 로 밀리고, 읽은 적 없는 다른 키는 5 그대로다.
- 용량이 작을 때의 부작용: 읽기 흐름(틱당 평균 0.5건, 매번 다른 키)과 50틱 뒤처진 쓰기 1만 건을 흘렸더니, 읽은 적 없는 키 쓰기가 밀리는 비율이 용량 10 에서 100%, 20 에서 89.5%, 30 에서 5.9%, 50 이상에서 0.2% 였다(0.2% 는 초기 구간). 쓰기 지연 구간의 읽기 수보다 용량이 작으면 low-water mark 때문에 무관한 키까지 밀린다는 뜻이다. 실제 구현은 최소 10초 보존 규칙이 있어 이 모형 그대로의 수치가 아니다.

### 2. 같은 캐시에 "마커 키"를 넣어 트랜잭션 레코드를 지킨다

캐시 키 공간에 트랜잭션 레코드 키 + 접미사(`tmbs`, `push`)로 만든 가상 키를 둔다. 실제 레코드를 쓰지 않고도 사실을 기록하는 방법이다.

| 사건 | 캐시에 남기는 것 | 효과 |
| --- | --- | --- |
| `EndTxn`, 레코드 최초 기록 `HeartbeatTxn`, 확정된 `RecoverTxn` | tombstone 마커 = 해당 요청 타임스탬프 | 재전송·지연 요청이 레코드를 다시 못 만든다 |
| `PushTxn(ABORT)` 성공 | tombstone 마커 = 피푸시 트랜잭션의 최소 타임스탬프, 소유자는 푸시한 트랜잭션 | 피푸시 쪽은 아직 레코드를 안 썼어도 이후 레코드 생성 거절. 푸시한 쪽이 **중단된 레코드를 대신 써 줄 필요가 없다** |
| `PushTxn(TIMESTAMP)` 성공 | push 마커 = 푸시 타임스탬프 | 레코드를 만드는 쪽이 커밋 타임스탬프를 그 이상으로 올린다(`MinTxnCommitTS`) |

레코드 생성 지점은 `CanCreateTxnRecord` 로 막는다. 해당 트랜잭션의 최소 타임스탬프가 tombstone 이하이면 거절하고 이유를 구분한다.

- tombstone 이 자기 트랜잭션 ID: 이미 레코드를 쓴 적이 있다(재전송 가능성).
- 다른 트랜잭션 ID: 다른 트랜잭션이 이쪽을 이미 중단시켰다.
- ID 없음: 캐시의 low-water 에 걸렸다. 그 값이 현재 리스 시작이면 "새 리스가 막았다" 이유다.

소스 주석은 이 구조 덕에 중단된 레코드를 디스크에 남길 이유가 약해졌고(동시 행위자가 캐시를 올리는 것으로 같은 효과), 단순화 방향도 적어 두었다. 쓰기-읽기 충돌은 `PushTxn(TIMESTAMP)`+push 마커로, 쓰기-쓰기 충돌은 `PushTxn(ABORT)`+tombstone 으로 푸시 대상이 아직 레코드가 없어도 푸시할 수 있다.

직접 만든 규칙 모형에서 `PushTxn(ABORT)` 이후 `minTs=12` 의 레코드 생성은 거절, 푸시된 적 없는 다른 트랜잭션은 허용, push 마커 30 이 있으면 커밋 하한이 30 으로 올라갔다(단순 맵으로 옮긴 모형).

### 3. 미결 커밋 복구에서 "차단"은 캐시 갱신이다

병렬 커밋 코디네이터가 죽으면 레코드가 `STAGING` 에 남는다. 다른 트랜잭션이 이를 만나 복구를 맡는다. 복구 관리자의 동작을 소스로 확인한 대로 정리한다.

1. **같은 트랜잭션 복구는 하나로 합친다**(singleflight). 동시에 최대 1024 개, 쓰기 확인은 128 개씩 묶는다.
2. **조사 단계**: 레코드 조회(`QueryTxn`)와 약속된 쓰기마다 `QueryIntent` 를 한 배치로 보낸다. 레코드가 확정됐거나 에포크·쓰기 타임스탬프가 달라졌으면 트랜잭션이 아직 살아 있다는 뜻이라 복구하지 않고 그 상태를 돌려준다.
3. `QueryIntent` 는 의도(intent)가 **같은 트랜잭션·에포크·시퀀스 이상으로 존재하고, 타임스탬프가 밀리지 않았을 때만**(`FoundUnpushedIntent`) "있다"고 본다. 없으면 응답이 "없음"이고, 평가 직후 호출 쪽 캐시 갱신 단계에서 **그 키에 트랜잭션의 쓰기 타임스탬프를 기록**한다. 소유자 ID 는 비워서 같은 트랜잭션 자신의 쓰기도 막는다. 이후 그 의도는 더 높은 타임스탬프로만 쓸 수 있으니 "밀리지 않은 의도"가 될 수 없다.
4. **판정 단계**: 하나라도 막혔으면 `ImplicitlyCommitted=false` 로 `RecoverTxn` 을 보내 `ABORTED` 로, 모두 있으면 `COMMITTED` 로 레코드를 쓴다. `RecoverTxn` 은 레코드가 이미 지워졌으면 `ABORTED` 로 합성해 돌려주고(이미 정리된 커밋은 의도를 모두 해소한 뒤라 안전하다는 주석), 상태가 이미 달라졌으면 아무것도 쓰지 않는다.
5. `RecoverTxn` 이 레코드를 `COMMITTED` 또는 `ABORTED` 로 확정하면 tombstone 마커도 캐시에 기록돼 이후 재생성이 막힌다.

코드 주석이 밝힌 알려진 모호함: 이미 해소돼 사라진 의도를 `QueryIntent` 가 "없음"으로 오해해 복구자가 **막았다고 믿는데** 레코드는 이미 `COMMITTED` 인 경우가 있다. 커밋은 그대로 유효해서 해가 없지만 단언을 느슨하게 만들었다고 한다.

### 4. 메모리 구조의 한계: 리스 이전

캐시는 리스홀더 메모리에만 있다. 리스가 다른 노드로 넘어가면 새 리스홀더의 캐시는 비어 있어, 보수적으로 low-water 를 올려야 이전 리스홀더가 허락한 읽기를 보호한다. 코드 주석에 따르면 24.1 이후 버전은 리스 이전 때 **읽기 요약(read summary)** 을 넘겨 올리는 범위를 줄이고(`kv.lease_transfer_read_summary.*_budget` 설정이 이를 제한), 이 때문에 "새 리스가 레코드 생성을 막은" 경우가 줄었다. 캐시 갱신은 리스 만료 시각보다 작은 타임스탬프로만 해야 한다는 불변식도 테스트 빌드에서 확인한다. 이는 [리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)에서 본 "시간으로 권한을 지킨다"는 구조와 같은 계열이다.

## 언제 쓰나

- CockroachDB 에서 이유 모를 트랜잭션 **재시도·중단**(타임스탬프가 밀려 읽기 갱신 실패, `ABORT_REASON_*`)을 진단할 때, 어느 마커 경로로 거절됐는지의 사전 지식.
- MVCC 저장소를 직접 설계할 때 "읽기를 락 없이 보호"하는 대안의 참고. 락(읽기 잠금)을 두는 설계와 비교한다.
- 복구 규칙의 "차단"이 정확히 무엇인지 이해해야 하는 병렬 커밋 심화 학습.

## 주의

- 캐시는 **가끔 틀려도 안전한 방향**(더 높은 타임스탬프를 돌려줌)으로만 틀린다. 그 대가는 불필요한 타임스탬프 밀기와 재시도다. 느린 트랜잭션이나 오래 열린 트랜잭션일수록 밀릴 확률이 커진다.
- 메모리 구조라 노드 재시작·리스 이전마다 보수화가 필요하다. 이를 위해 읽기 요약 같은 별도 전달 경로가 필요하다.
- 단순화된 모형의 수치(용량 대비 밀림 비율)는 구현의 10초 보존 규칙과 구조가 달라서 CockroachDB 의 실제 성능이 아니다.
- 소스 주석은 변한다. 위 내용은 master 브랜치(내가 읽은 시점의 마지막 커밋 d30c905, 2026-09-23)를 기준으로 하며, 릴리스 버전별 차이는 확인하지 않았다.
- [TiKV 와의 비교](/develop-wiki/knowledge/distributed-systems/tikv-vs-cockroachdb-transactions/)에서 보듯 "시간과 읽기 보호를 누가 주는가"는 시스템 설계의 큰 갈림길이다.

> 출처 확인 범위: CockroachDB 저장소(master, 커밋 d30c905)의 `tscache/cache.go` 전체, `replica_tscache.go` 의 `updateTimestampCache`·`applyTimestampCache`·`CanCreateTxnRecord`·`MinTxnCommitTS` 와 상태 기계 주석, `txnrecovery/manager.go`, `cmd_query_intent.go`, `cmd_recover_txn.go` 를 직접 읽었다. 설계 RFC 는 이전 노트 때 읽은 범위를 따랐다. 캐시 모형과 마커 규칙 모형은 직접 작성해 실행했다. 미확인: 캐시 구현(skiplist 페이지 교체)의 세부, 릴리스 버전별 동작, 읽기 요약의 직렬화 구조, 실제 클러스터에서의 재시도율.

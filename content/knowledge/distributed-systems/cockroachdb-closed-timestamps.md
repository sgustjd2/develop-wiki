---
title: CockroachDB 닫힌 타임스탬프와 팔로워 읽기 (closed timestamp)
aka: [Closed Timestamp, Follower Reads, Side Transport, follower_read_timestamp, Bounded Staleness Read, Exact Staleness Read, LEAD_FOR_GLOBAL_READS, Global Tables, 닫힌 타임스탬프, 팔로워 읽기]
category: distributed-systems
level: advanced
summary: 리스홀더가 "이 시각 이하로는 더 쓰지 않는다"고 약속한 타임스탬프를 팔로워에게 퍼뜨려, 그 시각 이하의 읽기를 리스홀더가 아닌 복제본에서 처리하게 하는 장치. 과거 시점 읽기와 GLOBAL 테이블의 현재 시점 읽기가 여기에 기댄다.
tags: [cockroachdb, closed-timestamp, follower-reads, side-transport, stale-reads, multi-region, mvcc, raft]
related: [distributed-systems/cockroachdb-lease-types, distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/cockroachdb-timestamp-cache-txn-records, distributed-systems/cockroachdb-range-merge-subsume, distributed-systems/raft-read-index, distributed-systems/consistency-models, distributed-systems/spanner-truetime, distributed-systems/hybrid-logical-clock]
sources:
  - https://docs.cockroachlabs.com/docs/stable/follower-reads
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/closedts/setting.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/closedts/policy.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/closedts/sidetransport/sender.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_closedts.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_follower_read.go
updatedAt: 2026-11-19
---

## 문제

Raft 팔로워는 로그를 받아 적용하지만, 자기 상태가 **어느 시각까지 완전한지** 모른다. 리스홀더가 방금 t=100 에 쓴 값이 아직 팔로워에 안 왔을 수 있다. 그래서 강한 일관성 읽기는 리스홀더로 가야 하고, 멀리 떨어진 리전의 클라이언트는 읽기마다 리전 간 왕복을 낸다. [ReadIndex](/develop-wiki/knowledge/distributed-systems/raft-read-index/)는 리더 확인 왕복을 줄일 뿐 팔로워가 스스로 답하게 해 주지는 않는다.

## 해법: 시각 단위의 "완료 선언"

**닫힌 타임스탬프(closed timestamp)** 는 범위마다 리스홀더가 내놓는 약속이다. "타임스탬프 T 이하로는 새 쓰기를 받지 않는다." 팔로워가 이 T 와 함께, T 를 닫을 때 리스홀더가 지정한 로그 위치(LAI, lease applied index)까지 적용했다면, T 이하 MVCC 읽기의 결과는 더 이상 바뀌지 않는다. 그 팔로워는 T 이하 읽기를 혼자 처리할 수 있다.

1. **쓰기 쪽 강제.** 공식 문서 기준, 닫힌 타임스탬프 이하로 오는 쓰기는 더 높은 타임스탬프로 밀려나고 트랜잭션 재시도 오류로 이어질 수 있다.
2. **목표 지연.** 기본 정책(`LAG_BY_CLUSTER_SETTING`)은 현재 시각에서 `kv.closed_timestamp.target_duration`(기본 3초)만큼 뒤를 닫는다.
3. **두 전달 경로.**
   - Raft 제안에 닫힌 타임스탬프를 실어 보낸다.
   - 쓰기가 없는 범위를 위해 **사이드 트랜스포트**가 노드 단위로 주기적으로(`kv.closed_timestamp.side_transport_interval`, 기본 200ms) 리스를 가진 범위들의 닫힌 타임스탬프를 올려 다른 노드에 보낸다. 소스 주석은 Raft 제안이 없으면 이 경로가 닫힌 타임스탬프를 올리는 유일한 방법이라고 적는다. 송신 측은 어느 노드가 어느 범위에 관심 있는지 추적하지 않고 같은 메시지를 모두에게 보내며, 수신 측이 게으르게 처리한다.
4. **사이드 트랜스포트가 올리지 않는 경우**(`BumpSideTransportClosed`): 리스를 갖고 있지 않을 때, 범위가 **병합 중**일 때, 아직 적용되지 않은 Raft 제안이 진행 중일 때. 마지막 조건은 진행 중 제안이 실제로 적용될지 모르는 상태에서는 LAI 를 정확히 붙일 수 없어서다.
5. **팔로워 판정**(`canServeFollowerRead`): 리스를 얻지 못한 복제본에서, 잠금을 잡지 않는 읽기 전용 트랜잭션 배치만, 그 타임스탬프가 현재 닫힌 타임스탬프 이하일 때 처리한다. 아니면 리스홀더로 돌려보낸다.

## SQL 에서 보이는 형태 (공식 문서 v26.4)

| 읽기 종류 | 지정 방법 | 성질 |
| --- | --- | --- |
| 정확 지연(exact staleness) | `AS OF SYSTEM TIME follower_read_timestamp()` 또는 고정 시각 | 다중 문장 읽기 전용 트랜잭션 가능. 시각이 충분히 과거가 아니면 리스홀더로 감. 문서는 최소 4.2초 이전 데이터를 감수하라고 안내 |
| 범위 지연(bounded staleness) | `with_max_staleness(INTERVAL)`, `with_min_timestamp(...)`, 선택 인자 `nearest_only` | 시스템이 로컬에서 막힘 없이 읽을 수 있는 가장 최신 시각을 고름. 분할 중에도 더 오래된 값으로 로컬 응답 가능. 단일 문장·단일 행 등 제약 |
| 강한 팔로워 읽기 | `GLOBAL` 테이블 | 현재 시각 읽기를 모든 리전에서 로컬로. 대가는 쓰기 지연 증가 |

- 팔로워 읽기는 읽기 전용이다. 읽기-쓰기 트랜잭션에는 못 쓴다.
- 오래 걸리는 쓰기 트랜잭션의 의도(intent)를 만나면 정확 지연 읽기도 기다릴 수 있다. 문서는 `HIGH` 우선순위 트랜잭션으로 줄이라고 안내한다.
- 확인 방법: 리스홀더가 아닌 노드에서 `EXPLAIN ANALYZE` 에 `used follower read` 가 보이는지, 지표 `follower_reads.success_count`.
- 현재 지연은 `SELECT now() - follower_read_timestamp();` 로 볼 수 있다.

## GLOBAL 테이블: 미래를 닫는다

`LEAD_FOR_GLOBAL_READS` 정책은 반대로 **현재보다 앞선 시각**을 닫는다. `closedts/policy.go` 의 계산 주석을 정리하면 이렇다.

- 팔로워에서 현재 시각 트랜잭션을 처리하려면 그 트랜잭션의 불확실성 상한(`now + max_offset`)까지 닫혀 있어야 한다.
- 송신 측은 여기에 전달 시간을 더해 닫는다. 전달 시간은 Raft 경로(`RTT × 1.5 + 20ms`)와 사이드 트랜스포트 경로(`RTT × 0.5 + 전송 주기 + 페이싱 간격`) 중 큰 값, 그리고 여유 25ms.
- 주석은 기본 설정에서 이 목표가 송신 노드 시계보다 약 800ms 앞선다고 적는다. RTT 는 지연 정보가 없으면 150ms 를 쓰고, 지연 기반 정책에서는 20ms 폭 구간의 중간값을 쓴다.
- 공식 문서는 쓰기 지연을 모든 리전 복제 탓으로 설명한다. 미래 시각을 닫는 구조도 커밋 대기를 낳을 수 있지만, 이는 이 노트의 추론이다(대기 코드 미확인).
- 소스 주석은 계산이 리더보다 시계가 빠른 팔로워를 고려하지 않는다고 밝히며, 틀리면 팔로워 읽기를 놓치는 **성능 문제이지 오래된 읽기(정합성) 문제는 아니라고** 적는다.

## 언제 쓰나

- 몇 초 지난 데이터로 충분한 대시보드·리포트·검색 색인 같은 읽기를 가까운 복제본에서 처리하고 싶을 때(정확·범위 지연 읽기).
- 거의 바뀌지 않고 모든 리전에서 빠르게 읽어야 하는 참조 데이터(GLOBAL 테이블).
- 리스홀더 노드의 읽기 부하를 덜어야 할 때.
- 변경 데이터 캡처(rangefeed)처럼 "어디까지 완료됐나"를 알아야 하는 기능의 기반 개념으로. 소스 설정 주석도 rangefeed 클라이언트가 이 설정을 읽는다고 적는다.

## 주의 (비용)

- **오래된 값을 읽는다.** 정확 지연 읽기는 몇 초 전 스냅숏이다. 자기 쓰기를 바로 읽어야 하는 흐름에는 맞지 않는다.
- **쓰기에 영향을 준다.** 닫힌 시각 이하의 쓰기는 밀려나 재시도가 날 수 있다. `target_duration` 을 줄이면 팔로워 읽기는 더 최신이 되지만 긴 트랜잭션이 더 자주 밀린다.
- **GLOBAL 테이블은 쓰기가 비싸다.** 미래 시각을 닫는 구조라서다. 쓰기가 잦은 테이블에는 맞지 않는다.
- 범위 병합, 리스 이전, 진행 중 제안에서 닫힌 타임스탬프 진행이 멈추거나 돌아갈 수 있다. 병합에서는 오른쪽 범위의 닫힌 타임스탬프가 사라지므로 타임스탬프 캐시로 보정한다 → [범위 병합과 읽기 보호](/develop-wiki/knowledge/distributed-systems/cockroachdb-range-merge-subsume/).
- 기본값(3초, 200ms 등)은 master 소스 시점 기준이다. 버전별로 다를 수 있다.

> 출처 확인 범위: 공식 문서 Follower Reads(v26.4)를 읽었다. 이 페이지는 클러스터 설정 이름·기본값을 다루지 않아 설정은 master 소스 `closedts/setting.go` 에서 확인했다. `closedts/policy.go`(정책별 목표 계산, 리드 타임 공식과 주석), `sidetransport/sender.go`(송신 측 주석), `replica_closedts.go`(사이드 트랜스포트 진행 조건), `replica_follower_read.go`(팔로워 처리 조건 주석)를 읽었다(2026-11-19 조회). 미확인: 닫힌 타임스탬프 설계 RFC 원문, GLOBAL 테이블 쓰기의 커밋 대기 코드, 라이선스 요구 여부, 지연 기반 정책 자동 조정(기본 꺼짐)의 실제 동작, `follower_read_timestamp()` 의 계산식. 실제 클러스터에서 실행하지 않았다.

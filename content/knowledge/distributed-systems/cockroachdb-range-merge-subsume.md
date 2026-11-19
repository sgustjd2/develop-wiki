---
title: CockroachDB 범위 병합과 읽기 보호 (Subsume · FreezeStart · 읽기 요약)
aka: [CockroachDB Range Merge, Subsume, SubsumeRequest, FreezeStart, Merge Trigger, Store.MergeRange, Right-hand Read Summary, 범위 병합, 서브숨]
category: distributed-systems
level: advanced
summary: 이웃한 두 범위를 합칠 때 오른쪽 범위를 얼려(Subsume) 더 이상 명령을 처리하지 않게 하고, 그 범위가 서빙한 읽기를 읽기 요약·동결 시각·닫힌 타임스탬프로 왼쪽 범위의 타임스탬프 캐시에 옮겨 "앞선 읽기 아래로 쓰기"를 막는 절차.
tags: [cockroachdb, range-merge, subsume, read-summary, timestamp-cache, closed-timestamp, hlc, linearizability]
related: [distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/cockroachdb-timestamp-cache-txn-records, distributed-systems/cockroachdb-closed-timestamps, distributed-systems/cockroachdb-lease-types, distributed-systems/hybrid-logical-clock, distributed-systems/two-phase-commit-vs-saga, distributed-systems/raft-consensus]
sources:
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/batcheval/cmd_subsume.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/store_merge.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/util/hlc/doc.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_closedts.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/readsummary/rspb/summary.go
updatedAt: 2026-11-19
---

[불확실성 구간과 읽기 요약](/develop-wiki/knowledge/distributed-systems/cockroachdb-uncertainty-interval-read-summary/) 노트는 **리스 이전** 때 읽기 보호 정보를 넘기는 읽기 요약을 다뤘고, 범위 병합 경로는 확인하지 못한 채 남겨 뒀다. 이 노트가 그 병합 경로다. 핵심은 같다. 이전 주인이 서빙한 읽기를 새 주인이 모르면, 그 읽기보다 낮은 타임스탬프의 쓰기가 끼어들어 이미 반환된 읽기 결과가 틀린 것이 된다.

## 문제

범위 L(왼쪽)과 R(오른쪽)을 합치면 R 의 키 공간을 L 의 리스홀더가 맡는다.

1. R 의 리스홀더는 메모리의 [타임스탬프 캐시](/develop-wiki/knowledge/distributed-systems/cockroachdb-timestamp-cache-txn-records/)에 "어느 키를 몇 시에 읽었나"를 들고 있다. L 의 리스홀더가 다른 노드면 이 정보가 없다.
2. R 의 팔로워들도 [닫힌 타임스탬프](/develop-wiki/knowledge/distributed-systems/cockroachdb-closed-timestamps/) 이하의 읽기를 서빙했을 수 있다. 병합되면 R 의 닫힌 타임스탬프는 사라지고 L 의 것이 그 키를 덮는다. L 의 닫힌 타임스탬프가 더 낮으면 **뒤로 간다.**
3. 병합 도중 R 이 계속 명령을 처리하면 두 범위가 같은 키를 동시에 처리하는 순간이 생긴다.

## 해법: 얼리고, 요약하고, 끌어올린다

### 1) 병합 트랜잭션과 Subsume

`cmd_subsume.go` 의 주석이 정한 순서다.

- 병합 트랜잭션이 먼저 R 의 범위 서술자(로컬 사본과 meta2 사본)에 **삭제 의도(intent)** 를 놓는다. 이 시점부터 트랜잭션 완료까지를 병합의 **임계 단계(critical phase)** 라 부른다.
- 그다음 R 에 `SubsumeRequest` 를 보낸다. 이 요청은 R 의 모든 키에 대한 쓰기 래치를 선언해 다른 어떤 명령과도 동시에 돌지 않는다. R 의 리스홀더는 다음을 보장한다.
  1. 실행 시점에 자신이 리스홀더다.
  2. 응답할 때 `FreezeStart` 보다 큰 타임스탬프의 명령이 진행 중이지 않다.
  3. 응답의 MVCC 통계가 최신 쓰기를 반영한다.
  4. 자신과 이후 모든 리스홀더는 meta2 에서 서술자를 일관 읽기로 다시 읽기 전에는 명령을 처리하지 않는다.
  5. 서술자가 지워졌다면 스스로 파기한다.
- 4·5 를 위해 meta2 의 의도가 쓰인다. 리스홀더는 meta2 를 일관 읽기하며 병합 트랜잭션이 끝날 때까지 기다리고, 새 리스홀더는 리스를 얻은 뒤 로컬 서술자의 의도를 보고 병합 중임을 안다.
- 응답에는 `FreezeStart`, `ClosedTimestamp`, `ReadSummary`(R 리스홀더가 모은 읽기 요약), MVCC 통계, LAI 가 실린다. 병합 트랜잭션은 R 의 모든 복제본이 그 LAI 까지 적용하기를 기다린 뒤 **병합 트리거**와 함께 커밋한다.

### 2) 얼린 뒤 닫힌 타임스탬프를 올리지 않는다

Subsume 응답의 닫힌 타임스탬프가 t1 인데 그 뒤 t2 로 올라가면, 팔로워들이 (t1, t2] 의 읽기를 받아들일 수 있다. 팔로워는 리스홀더처럼 얼어 있지 않기 때문이다. 이 읽기는 병합된 범위의 타임스탬프 캐시에 반영되지 않는다. 그래서 두 경로를 막는다.

- 사이드 트랜스포트: 병합 중인 범위는 닫힌 타임스탬프를 올리지 않는다(`BumpSideTransportClosed`).
- Raft 경로: 배치가 `SubsumeRequest` 하나뿐이면 제안에 실을 닫힌 타임스탬프를 올리지 않는다.

얼린 뒤 읽는 `GetCurrentReadSummary` 는 이 범위가 내놓은 최고 닫힌 타임스탬프를 반영한다고 주석이 설명한다.

### 3) 병합 적용 (`Store.MergeRange`)

L 의 리스홀더 노드에서 병합 명령이 적용될 때의 분기다.

| 상황 | 하는 일 |
| --- | --- |
| L 리스홀더가 이 노드, R 리스홀더는 다른 노드 | 먼저 HLC 를 `FreezeStart` 로 올린다. 병합 트리거에 R 읽기 요약이 있으면 그것을, 없으면 `FreezeStart` 하나로 만든 요약을 R 키 공간의 타임스탬프 캐시에 적용한다(비관적 가정: R 이 동결 시각까지 다 읽었다) |
| L 리스홀더가 이 노드(위 경우 포함) | R 의 **닫힌 타임스탬프**로 만든 요약을 R 키 공간에 추가 적용한다. 팔로워가 서빙했을 읽기까지 덮기 위해서다 |
| 관측 타임스탬프 하한 | 두 리스홀더가 같은 노드였으면 둘 중 큰 `minValidObservedTimestamp` 를, 아니면 `FreezeStart` 로 끌어올린다 |

읽기 요약을 적용하는 동작은 래칫이라 타임스탬프 캐시 값을 올리기만 한다. 같은 키 공간에 요약을 두 번 적용해도 큰 값이 남는다.

### 왜 HLC 를 `FreezeStart` 로 올리나

`hlc/doc.go` 는 병합을 HLC 신호가 전달되는 경로 중 하나로 꼽는다. R 리스홀더의 시계 읽기(동결 시각)가 병합 트랜잭션을 거쳐 L 리스홀더까지 전달되고, L 은 병합을 적용하면서 HLC 를 그 값으로 전진시킨다. 이유는 [불확실성 구간](/develop-wiki/knowledge/distributed-systems/cockroachdb-uncertainty-interval-read-summary/)의 불변식이다. 리스홀더의 시계는 자기 키 공간에 있는 모든 값의 로컬 타임스탬프 이상이어야 하는데, 병합 후에는 R 에서 쓰인 값도 L 의 키 공간이 되기 때문이다.

## 언제 쓰나

- 범위 병합 직후 쓰기 재시도·지연이 튀는 원인을 볼 때. 요약이 없거나 압축됐으면 R 키 공간 전체의 타임스탬프 캐시가 동결 시각 또는 닫힌 타임스탬프까지 올라가 그 아래 쓰기가 밀린다.
- 자체 Multi-Raft 저장소에 범위 병합을 넣을 때의 점검표. 동결 보장(진행 중 명령 없음, 이후 리스홀더도 대기), 읽기 보호 이전, 팔로워 읽기 경로의 진행 정지, 시계 전진 네 가지가 짝을 이룬다.

## 주의 (비용)

- **병합 중 R 은 멈춘다.** Subsume 이후 병합 트랜잭션이 끝날 때까지 R 의 키는 처리되지 않는다. 병합이 잦으면 꼬리 지연이 생긴다.
- **보수적 가정은 쓰기를 민다.** 요약이 없으면 `FreezeStart` 로, 그리고 언제나 R 의 닫힌 타임스탬프로 캐시를 올린다. 정확한 정보 대신 상한을 쓰는 대가가 쓰기 밀림이다.
- 관측 타임스탬프 하한이 올라가므로 병합 직후 트랜잭션은 불확실성 재시작이 늘 수 있다.
- 병합 트랜잭션이 중단돼도 되돌려지지 않는 쓰기(Subsume 의 흐름 제어용 로컬 키 기록)가 있다. 소스 주석은 그 키가 범위 로컬 키라 안전하다고 설명한다. 구현을 따라 할 때 이런 비대칭을 놓치기 쉽다.

> 출처 확인 범위: CockroachDB master 소스(2026-11-19 조회)의 `batcheval/cmd_subsume.go`(보장 5가지, 임계 단계, 닫힌 타임스탬프 비전진 이유와 두 경로), `store_merge.go`(`MergeRange` 의 시계 전진·요약 적용·닫힌 타임스탬프 보정·관측 타임스탬프 하한), `hlc/doc.go`(Range merges 항목), `replica_closedts.go`(병합 중 사이드 트랜스포트 정지)를 읽었다. `Replica.AdminMerge` 의 전체 트랜잭션 순서는 Subsume 주석에 적힌 범위만 확인했고 `replica_command.go` 를 직접 읽지는 않았다. 병합 결정(병합 큐 기준·크기 임계)과 버전별 차이, 테스트 `TestStoreRangeMergeTimestampCacheCausality` 는 읽지 않았다. 실행 실험은 하지 않았다.

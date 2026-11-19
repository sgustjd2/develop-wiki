---
title: CockroachDB 범위 분할과 타임스탬프 캐시 (리스 복사로 읽기 보호)
aka: [CockroachDB Range Split, Split Trigger, splitTriggerHelper, splitPostApply, RHS Lease Copy, Timestamp Cache on Split, 범위 분할, 분할 트리거]
category: distributed-systems
level: advanced
summary: 범위를 둘로 나눌 때 오른쪽 범위가 이전에 서빙된 읽기를 잊지 않도록, CockroachDB 는 캐시를 복사하지 않고 왼쪽 리스를 같은 저장소의 오른쪽 복제본에 그대로 복사한다. 저장소 단위 캐시라서 가능한 방식과, 리더 리스·관측 타임스탬프 처리 같은 세부를 소스로 정리한다.
tags: [cockroachdb, range-split, timestamp-cache, lease, leader-lease, mvcc, raft]
related: [distributed-systems/cockroachdb-timestamp-cache-txn-records, distributed-systems/cockroachdb-range-merge-subsume, distributed-systems/cockroachdb-lease-types, distributed-systems/cockroachdb-leader-leases-liveness-fabric, distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/raft-consensus]
sources:
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/batcheval/cmd_end_transaction.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/store_split.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_proposal.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/store.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/util/hlc/doc.go
updatedAt: 2026-11-19
---

[범위 병합](/develop-wiki/knowledge/distributed-systems/cockroachdb-range-merge-subsume/) 노트는 두 범위를 합칠 때 오른쪽이 서빙한 읽기를 **읽기 요약**으로 왼쪽 리스홀더의 캐시에 옮기는 과정을 다뤘다. 분할은 반대 방향인데, 소스를 보면 훨씬 단순하다. 읽기 기록을 옮기지 않아도 되도록 **리스를 옮기지 않는다.**

## 문제

- [타임스탬프 캐시](/develop-wiki/knowledge/distributed-systems/cockroachdb-timestamp-cache-txn-records/)는 "키 k 를 ts 에 읽었다"를 기억해, 그 아래로 쓰기를 못 하게 한다. 이 캐시는 디스크가 아니라 **리스홀더 메모리**에만 있다.
- 범위 [a,e) 를 c 에서 나누면 [c,e) 라는 새 범위(RHS)가 생긴다. 분할 전에 리스홀더가 키 d 를 ts=50 에 읽었다면, RHS 의 새 리스홀더도 그 사실을 알아야 d 에 ts=40 쓰기를 거절할 수 있다.
- 모든 복제본이 분할 트리거를 적용하지만, 읽기 기록은 원래 리스홀더 노드에만 있다.

## 해법: RHS 리스 = LHS 리스 (같은 저장소)

### 1. 분할 트리거 평가 (`batcheval/cmd_end_transaction.go`, `splitTriggerHelper`)

- 주석이 직접 옛 회귀(이슈 #7899)를 적어 두었다. 예전에는 RHS 가 **리스 없이** 시작했다. 그러자 노드 2 가 RHS 리스를 새로 잡았을 때, 노드 2 의 캐시에는 노드 1 에서 일어난 d 읽기가 없어서 그 아래로 쓰기를 제안할 수 있었다.
- 지금은 LHS 에 리스가 없으면 치명 오류로 멈추고, **LHS 리스를 복사해 RHS 초기 상태에 기록한다.** 리스홀더 복제본은 RHS 디스크립터에서 **같은 저장소 ID** 의 복제본으로 다시 묶는다. 그 저장소의 RHS 복제본이 없으면 오류다.
- 리스가 **리더 리스**면 만료 기반 리스로 바꾼다(만료 = 지금 + 범위 리스 기간, term 과 최소 만료를 비움). 리더 리스는 특정 Raft 그룹의 특정 term 에 묶여 있는데, RHS 는 새 Raft 그룹이라 LHS 의 term 이 의미가 없기 때문이다. RHS 가 리더를 뽑고 리스와 리더가 같은 곳에 모이면 다시 리더 리스로 올린다.

### 2. 분할 적용 후 (`store_split.go`, `prepareRightReplicaForSplit`)

- LHS 의 `minLeaseProposedTS` 를 RHS 에 복사한다. LHS 가 재시작이나 리스 이전 때문에 현재 리스를 쓰지 못하는 상태였다면 RHS 도 쓰지 못하게 하려는 것이다.
- LHS 의 `minValidObservedTimestamp` 도 복사한다. 관측 타임스탬프로 줄인 불확실성 구간의 경계를 유지하기 위해서다([불확실성 구간](/develop-wiki/knowledge/distributed-systems/cockroachdb-uncertainty-interval-read-summary/)).
- `leasePostApplyLocked` 를 이전 리스 = 새 리스(같은 리스)로 부른다. 리스가 "손을 바꾸지" 않았으므로 캐시 하한을 올리는 코드는 타지 않고, 리스홀더 쪽 초기화(트랜잭션 대기 큐 활성화 등)만 한다.

### 3. 왜 캐시를 복사하지 않아도 되나

- 타임스탬프 캐시는 범위마다가 아니라 **저장소(Store)마다 하나**다(`store.go`: `s.tsCache = tscache.New(...)`). 키 구간으로 조회하므로 범위 경계가 바뀌어도 같은 저장소 안에서는 기록이 그대로 보인다.
- 따라서 RHS 리스가 같은 저장소에 남는 한, d 의 읽기 기록은 자동으로 RHS 쓰기에 적용된다.

### 4. RHS 리스가 나중에 다른 노드로 가면

리스 이전·재획득은 분할과 무관한 일반 경로다. `replica_proposal.go` 의 `leasePostApplyLocked` 는 리스가 손을 바꾸고 내가 새 리스홀더면:

- 노드 HLC 를 새 리스 시작 시각까지 당기고(`hlc/doc.go` 의 협조적 리스 이전 항목과 같은 이유),
- `minValidObservedTimestamp` 를 리스 시작으로 올리고,
- 이전 리스홀더가 보낸 **읽기 요약**이 있으면 그것으로, 없으면 "이전 리스홀더가 새 리스 시작까지 읽었다"고 비관적으로 가정해 캐시 하한을 올린다.

직접 실행한 모형(`split-tscache.mjs`, 저장소별 캐시 맵 두 개):

| 경우 | d 에 ts=40 쓰기 |
| --- | --- |
| 옛 방식: RHS 리스 없이 시작, 노드 2 가 보정 없이 획득 | 허용 → 읽은 값(50) 아래 쓰기, 위반 |
| 현재: 리스 복사, 노드 1 저장소 그대로 | ts 51 로 밀림 |
| 이후 노드 2 로 리스 이전(하한 = 리스 시작 60) | ts 61 로 밀림 |

## 병합과 비교

| | 분할 | 병합 |
| --- | --- | --- |
| 읽기 기록의 위치 | 이미 같은 저장소 캐시에 있음 | 오른쪽 리스홀더 캐시에 있음, 왼쪽 리스홀더는 다른 노드일 수 있음 |
| 넘기는 것 | 리스 자체(복사) | 읽기 요약 + 동결 시각 |
| 시계 처리 | 리스 손 바뀜 없음 → 당기지 않음 | 왼쪽 리스홀더 HLC 를 동결 시각까지 당김 |
| 리스 종류 | 리더 리스면 만료 리스로 강등 | 왼쪽 리스 유지 |

## 언제 쓰나

- 범위 분할 직후 지연 급증·재시도·리스 이동을 분석할 때. 분할 직후 RHS 는 만료 리스이므로, 리더 리스 클러스터에서도 잠깐 다른 리스 종류가 섞인다.
- 직접 샤딩되는 MVCC 저장소를 설계할 때, "읽기 기록을 데이터와 함께 옮길 것인가, 권한(리스)을 옮기지 않을 것인가"의 선택지로. 캐시를 저장소 단위로 두면 분할은 공짜에 가깝고, 대가는 리스가 움직일 때마다 하한을 보수적으로 올리는 것이다.

## 주의 (비용)

- **리스 복사는 "분할 직후"만 보호한다.** 이후 RHS 리스가 옮겨 가면 읽기 요약 또는 리스 시작 기반 하한에 기댄다. 하한을 리스 시작으로 올리면 그 아래의 정당한 쓰기도 밀려 재시도가 늘 수 있다.
- **리더 리스의 일시 강등.** RHS 는 새 Raft 그룹이 리더를 뽑고 강화될 때까지 만료 리스를 쓴다. 만료 리스는 범위별 갱신 비용이 있다([리스 3종](/develop-wiki/knowledge/distributed-systems/cockroachdb-lease-types/)). 분할이 대량으로 일어나면 이 비용이 겹친다.
- **팔로워 쪽 RHS 는 늦게 생길 수 있다.** `splitPostApply` 주석대로 스냅숏으로 분할 지점을 건너뛴 복제본은 RHS 를 Raft 메시지를 받을 때까지 만들지 않는다. 그래서 RHS Raft 그룹을 명시적으로 깨운다(quiesce 해제).
- 이 노트는 master 소스 기준이다. 리더 리스 강등 코드는 리더 리스 도입 이후에만 있다.

> 검증 범위: CockroachDB master 소스(2026-11-19 조회)에서 `batcheval/cmd_end_transaction.go` 의 분할 트리거 설명 주석과 `splitTriggerHelper` 의 RHS 리스 복사·리더 리스 강등 블록, `store_split.go` 의 `splitPostApply`·`prepareRightReplicaForSplit`, `replica_proposal.go` 의 `leasePostApplyLocked`(리스 손 바뀜 시 HLC·관측 타임스탬프·읽기 요약 처리), `store.go` 의 저장소 단위 `tsCache` 생성, `hlc/doc.go` 의 리스 이전·병합 항목을 읽었다. 이슈 #7899 는 소스 주석의 설명만 읽었고 이슈 본문은 열지 않았다. 표의 모형은 Node 로 직접 실행했다(스크래치 `dist/split-tscache.mjs`). 미확인: 분할 결정(크기·부하 기준)과 분할 트랜잭션 전체 순서, 버전별 차이, `TestStoreRangeSplit*` 계열 테스트.

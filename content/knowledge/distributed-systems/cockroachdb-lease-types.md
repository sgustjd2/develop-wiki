---
title: CockroachDB 리스 3종 (만료 기반 · 에포크 기반 · 리더 리스)
aka: [CockroachDB Range Lease, Expiration-based Lease, Epoch-based Lease, Leader Lease, Store Liveness, Raft Leader Fortification, Node Liveness, Lease Stasis, 범위 리스, 리더 리스, 에포크 리스]
category: distributed-systems
level: advanced
summary: CockroachDB 범위 리스가 "무엇으로 유효 기간을 증명하는가"에 따라 갈리는 세 방식(리스마다 갱신하는 만료 기반, 노드 생존 레코드에 묶는 에포크 기반, Raft 리더 지지에 묶는 리더 리스)을 소스와 공식 문서로 비교한다.
tags: [cockroachdb, range-lease, leader-lease, epoch-lease, expiration-lease, store-liveness, node-liveness, raft]
related: [distributed-systems/cockroachdb-leader-leases-liveness-fabric, distributed-systems/leader-lease-clock-assumptions, distributed-systems/raft-lease-read-monotonic-clock, distributed-systems/raft-prevote-checkquorum-lease-interplay, distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/cockroachdb-timestamp-cache-txn-records, distributed-systems/cockroachdb-closed-timestamps, distributed-systems/raft-consensus, distributed-systems/gossip-failure-detection]
sources:
  - https://docs.cockroachlabs.com/docs/stable/architecture/replication-layer
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_range_lease.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/leases/status.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/leases/build.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/base/config.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_store_liveness.go
  - https://www.cockroachlabs.com/blog/distributed-database-leader-leases/
  - https://www.cockroachlabs.com/blog/cockroachdb-25-1-enhanced-resilience-and-performance/
  - https://github.com/cockroachdb/cockroach/blob/release-25.2/pkg/kv/kvserver/replica_store_liveness.go
  - https://www.cockroachlabs.com/docs/releases/v25.1
updatedAt: 2026-11-19
---

[리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/) 노트는 Raft 리더가 "일정 시간 다른 리더가 없다"는 약속으로 로컬 읽기를 하는 일반 기법을 다뤘다. CockroachDB 는 이 약속을 Raft 리더가 아니라 **범위(range)마다 따로 두는 리스**로 구현했고, 그 리스의 유효 기간을 증명하는 방법을 세 번 바꿨다. 이 노트는 그 셋을 나란히 놓는다.

## 문제

- 범위 하나는 Raft 그룹 하나다. 리스홀더만 강한 일관성 읽기를 Raft 를 거치지 않고 처리하고, 쓰기를 평가한다. 리스홀더는 [타임스탬프 캐시](/develop-wiki/knowledge/distributed-systems/cockroachdb-timestamp-cache-txn-records/)도 가진다.
- 리스가 "언제까지 유효한가"를 증명해야 한다. 증명을 범위마다 따로 하면 범위가 수십만 개일 때 갱신 비용이 커진다. 한곳에 모으면 그곳이 단일 장애점이 된다.
- 리스홀더와 Raft 리더가 다른 노드에 있으면 쓰기가 한 번 더 건너뛰고, 부분 네트워크 분할에서 둘이 엇갈리며 범위가 멈출 수 있다.

## 세 방식

| | 만료 기반 (`LeaseExpiration`) | 에포크 기반 (`LeaseEpoch`) | 리더 리스 (`LeaseLeader`) |
| --- | --- | --- | --- |
| 유효 기간의 근거 | 리스 자체에 적힌 만료 타임스탬프 | 리스홀더 노드의 **노드 생존(node liveness) 레코드**의 에포크와 만료 | 리스의 Raft term 에 대한 **리더 지지(leader support)**. 저장소 생존(store liveness)으로 과반이 지지 |
| 갱신 | 범위마다 Raft 쓰기로 연장 | 노드가 생존 레코드 하나만 하트비트(범위별 갱신 없음) | 저장소 간 하트비트. 범위별 Raft 쓰기 없음 |
| 남의 리스를 뺏는 법 | 만료를 기다린다 | 이전 리스홀더의 에포크를 **증가**시킨 뒤 획득 | 새 Raft 리더가 뽑히면 이전 term 의 지지가 끝났음을 안다 |
| 약점 | 범위 수에 비례하는 갱신 비용 | 생존 범위(liveness range)가 느리거나 죽으면 모든 에포크 리스가 영향 | 저장소 생존이라는 별도 프로토콜, 리더 강화(fortification) 필요 |
| 현재 쓰임(소스 master 기준) | 노드 생존 범위까지의 시스템 범위, 리스 이전 중 일시, 설정으로 강제 시 | 리더 강화가 꺼진 범위의 대체 | 기본 |

### 만료 기반

- 소스 주석(`pendingLeaseRequest`)은 만료 기반 리스를 "벽시계가 만료 − 최대 시계 오차보다 작으면 유효"라고 정의한다. 시계 오차를 리스 끝에서 빼는 구간이 **stasis** 다(아래).
- 노드 생존 레코드가 들어 있는 범위까지는 반드시 만료 기반이다. 에포크 리스가 생존 레코드에 기대는데 생존 범위 자신이 에포크 리스를 쓰면 순환 의존이 되기 때문이다(`requiresExpirationLease`: 시작 키가 `NodeLivenessKeyMax` 보다 작은 범위).
- `kv.lease.expiration_leases_only.enabled`(기본 false, 설명에 실험적이며 성능에 영향이라고 적힘)를 켜면 모든 범위가 만료 기반을 쓴다. `kv.lease.expiration_max_replicas_per_node`(기본 0=끔)를 정하면 노드 복제본 수가 그 값을 넘을 때 해제된다.

### 에포크 기반

- 리스는 만료 시각 대신 **에포크 번호**를 들고 있다. 리스홀더 노드의 생존 레코드 에포크가 같고 그 레코드가 만료되지 않았으면 유효하다(`leases/status.go`).
- 다른 노드가 리스를 가져가려면 이전 리스홀더의 생존 레코드가 만료된 뒤 그 **에포크를 올리는 쓰기**를 먼저 성공해야 한다. 그래야 이전 리스홀더가 같은 에포크로 리스를 계속 쓸 수 없다.
- 비용은 노드당 하트비트 하나로 줄지만, 공식 문서는 노드 생존 범위를 단일 장애점(SPOF)이라 부른다.

### 리더 리스

- 공식 문서(v26.4)는 리더 리스에서 리스홀더가 리스 이전 중 잠깐을 빼면 **항상 Raft 리더**라고 설명한다. 저장소들은 저장소 생존(store liveness) 판단에 따라 후보를 **강화(fortify)** 하고, 강화된 복제본만 리더가 될 수 있다. 리더는 과반 저장소의 지지가 이어지는 동안 리더십을 유지한다.
- 소스에서 리더 리스의 유효성은 Raft 리더 지지로 판정한다. 리스를 로컬에서 들고 있지 않은 복제본은 **더 높은 term 의 리더를 알기 전에는** 이전 리스가 끝났다고 단정할 수 없다. 더 높은 term 의 리더가 있다는 것은 이전 term 의 지지가 이미 끝났다는 증거이기 때문이다(`leases/status.go` 주석).
- 리스 이전 중에는 만료 기반 리스를 잠깐 쓰고, 새 리더가 강화되면 리더 리스로 바뀐다(공식 문서).
- 켜고 끄는 설정은 `kv.raft.leader_fortification.fraction_enabled`(0.0~1.0, 기본 1.0, 일부 범위만 점진 적용 가능)다. 리더 강화를 켠 채 리더 리스만 끄는 비공개 설정 `kv.leases.leader_leases.enabled`(기본 true)도 있다. 리스 종류 선택은 `desiredLeaseType` 이 만료 기반 필요 여부 → 강화 여부 순으로 정한다.

## 장애 시 리스 획득 시간: 소스 주석의 표

`pkg/base/config.go` 의 `defaultRangeLeaseDuration` 주석에는 기본 설정에서 리스홀더가 죽은 뒤 새 리스가 잡히기까지의 구간이 단계별로 적혀 있다(주석은 `TestDefaultRaftConfig` 가 생성한다고 밝힘, RTT 10~400ms 가정).

| 방식 | 구성 (기본값) | 합계 |
| --- | --- | --- |
| 만료 기반 | 리스 만료 6초 + 하트비트 오프셋 + 1 RTT | 3.01~6.40초 |
| 에포크 기반 | 하트비트 오프셋(−3~0초) + 생존 레코드 만료 6초 + 에포크 증가 2 RTT + 획득 1 RTT | 3.03~7.20초 |
| 리더 리스 (선거 포함) | 저장소 생존 하트비트 오프셋(−1~0초) + 저장소 생존 만료 3초 + 지지 철회 ≤0.1초 + 선거 지터 0~2초 + 선거 3 RTT + 획득 1 RTT | 2.04~6.70초 |

- 관련 기본값: 범위 리스 6초(`COCKROACH_RANGE_LEASE_DURATION`), Raft 틱 500ms, 선거 타임아웃 4틱(+지터), 저장소 생존 하트비트 1초·지지 기간 3초, 리더 리스 최소 유효 기간(`FortificationGracePeriod`) 3초.
- 공식 문서와 25.1 출시 블로그는 리더 리스에서 생존 실패로 인한 중단이 1초 미만, 네트워크 분할이 20초 미만에 회복된다고 적는다. 이 수치는 제품 측 주장이며 재현하지 않았다.

## 공통: stasis 구간

`leases/status.go` 는 리스 만료 시각을 최대 시계 오차만큼 당긴 뒤, 요청 타임스탬프가 그 끝 구간(stasis)에 들어가면 리스를 `UNUSABLE` 로 본다. 주석이 드는 이유는 비트랜잭션 요청이다. 새 리스홀더에서 쓴 값을, 시계가 느린 코디네이터가 옛 리스 구간의 타임스탬프로 읽으러 가서 아직 리스 변경을 모르는 옛 리스홀더가 답하면 자기 쓰기를 못 본다. 트랜잭션 요청은 [불확실성 구간](/develop-wiki/knowledge/distributed-systems/cockroachdb-uncertainty-interval-read-summary/)이 이 구실을 하지만 모든 요청이 그것을 갖지는 않으므로, stasis 가 "모든 요청에 대한 기본 불확실성 구간" 노릇을 한다. 시계 가정이 어느 방식에서나 안전 조건에 남는 이유다.

## 언제 쓰나

- CockroachDB 장애 분석에서 "리스홀더가 바뀌는 데 왜 몇 초 걸렸나"를 단계로 나눠 볼 때(어떤 리스 종류였는지부터 확인).
- 범위가 매우 많은 클러스터에서 리스 유지 CPU·생존 범위 의존을 따질 때.
- 자체 Multi-Raft 저장소를 설계할 때 "리스를 그룹마다 갱신할 것인가, 노드 단위 생존에 묶을 것인가, Raft 리더십 자체를 리스로 만들 것인가"의 선택지 목록으로. TiKV 의 방식은 [Raft 리스 읽기와 단조 시계](/develop-wiki/knowledge/distributed-systems/raft-lease-read-monotonic-clock/)에 있다.

## 주의 (비용)

- **리스 종류와 무관하게 시계 오차 상한은 안전 가정이다.** stasis 와 불확실성 구간이 그 가정 위에 있다.
- 에포크 기반은 생존 범위에 대한 의존이 크다. 리더 리스는 이 의존을 줄이지만 공식 문서에 따르면 노드 하트비트는 여전히 클러스터 멤버십·사망 판정·복제본 배치에 쓰인다. 생존 시스템이 사라진 것은 아니다.
- 리더 리스는 Raft 리더 강화와 저장소 생존이라는 새 프로토콜에 기대므로 구버전과 섞인 클러스터, 점진 적용 중(`fraction_enabled` 가 0 과 1 사이)에는 범위마다 리스 종류가 다를 수 있다.
- 리스가 길수록 장애 후 복구가 늦고 짧을수록 갱신·오탐이 는다. 위 표의 최악 구간이 기본값의 균형점이다(이 노트의 해석).
- 리더 리스 논문(SIGMOD 2026, "Scalable Leader Leases For Multi Consensus Groups in CockroachDB")은 [별도 노트](/develop-wiki/knowledge/distributed-systems/cockroachdb-leader-leases-liveness-fabric/)에 정리했다. 논문 실험에서 리더 리스는 부분 분할·디스크 정지에 강하지만, 단순 노드 장애 복구는 만료·에포크 리스보다 1~2초 느렸다(리스 만료 후 선거가 순서대로 진행되기 때문).
- 기본 활성 버전: `kv.raft.leader_fortification.fraction_enabled` 기본값이 `release-25.1` 소스에서 0.0, `release-25.2` 소스에서 1.0 이다. 25.2 부터 기본으로 켜진 것으로 보인다(릴리스 노트 문장으로는 미확인).

> 출처 확인 범위: CockroachDB master 소스에서 `replica_range_lease.go`(설정 3개 정의·기본값, `requiresExpirationLease`·`shouldUseExpirationLease`·`desiredLeaseType`, 만료·에포크 리스 정의 주석), `leases/status.go`(리스 종류별 유효성 판정, stasis 주석), `leases/build.go`(설정 필드), `base/config.go`(기본 지속 시간과 획득 시간 표 주석), `replica_store_liveness.go`(`fraction_enabled` 설정)를 읽었다(2026-11-19 조회). 공식 문서는 v26.4 Replication Layer 페이지를 읽었다. 리더 리스 도입 시점은 25.1 출시 블로그·릴리스 노트의 "Preview" 표현으로 확인했다. 기본값 전환은 25.1~25.4 릴리스 노트에서 해당 문장을 찾지 못해, `replica_store_liveness.go` 의 release-24.3/25.1/25.2/25.3 브랜치 기본값(0.0, 0.0, 1.0, 1.0)으로 판단했다(2026-11-19 추가 확인). SIGMOD 논문 본문은 별도 노트에서 읽었다. TLA+ 모델 내용은 읽지 않았다. 실제 클러스터에서 장애 시간을 재지 않았다.

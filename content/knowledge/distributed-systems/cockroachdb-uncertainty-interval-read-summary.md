---
title: CockroachDB 불확실성 구간과 읽기 요약 (uncertainty interval · read summary)
aka: [CockroachDB Uncertainty Interval, Observed Timestamp, Global Uncertainty Limit, ReadWithinUncertaintyIntervalError, Read Summary, Lease Transfer Read Summary, 불확실성 구간, 읽기 요약]
category: distributed-systems
level: advanced
summary: 느슨하지만 상한이 있는 시계로 단일 키 선형화를 지키는 "불확실성 구간"과, 리스가 넘어갈 때 읽기 보호 정보를 크기 예산 안에서 압축해 새 리스홀더에 전하는 "읽기 요약"을 소스 주석 수준에서 푼다.
tags: [cockroachdb, uncertainty-interval, observed-timestamp, read-summary, hlc, lease-transfer, linearizability, mvcc]
related: [distributed-systems/cockroachdb-timestamp-cache-txn-records, distributed-systems/hybrid-logical-clock, distributed-systems/spanner-truetime, distributed-systems/leader-lease-clock-assumptions, distributed-systems/consistency-models, distributed-systems/tikv-vs-cockroachdb-transactions, distributed-systems/raft-lease-read-monotonic-clock, data-modeling/transaction-isolation]
sources:
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/uncertainty/doc.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/uncertainty/compute.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/uncertainty/interval.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/readsummary/rspb/summary.proto
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/readsummary/rspb/summary.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_tscache.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvserver/replica_proposal.go
updatedAt: 2026-11-19
---

[타임스탬프 캐시 노트](/develop-wiki/knowledge/distributed-systems/cockroachdb-timestamp-cache-txn-records/)는 "읽은 값 아래로는 쓰지 못하게" 하는 메모리 구조를 다뤘다. 이 노트는 그 옆의 두 장치다. 하나는 **시계가 어긋나도 오래된 값을 읽지 않게** 하는 불확실성 구간, 다른 하나는 **리스가 다른 노드로 넘어가도 읽기 보호가 끊기지 않게** 하는 읽기 요약이다. 둘은 "리스 시작 시각"에서 만난다.

## 문제

1. **시계 오차.** 노드마다 HLC 시계가 조금씩 다르다. 쓰기 A 가 노드 1 에서 커밋돼 클라이언트에 응답이 나간 뒤, 다른 노드 2 가 시작한 읽기가 있다. 노드 2 의 시계가 느리면 읽기 타임스탬프가 A 의 커밋 타임스탬프보다 **작을 수 있다.** 그대로 두면 이미 응답된 쓰기를 못 보는 오래된 읽기(stale read)가 된다. 인과적으로 앞선 쓰기와 진짜 동시 쓰기를 타임스탬프만으로는 구분할 수 없다.
2. **리스 이전.** 읽기 보호 정보(어디를 몇 시에 읽었는가)는 리스홀더 메모리에만 있다. 리스가 넘어가면 새 리스홀더는 그 정보를 모른다. 비워 둔 채 쓰기를 받으면 앞선 읽기 아래로 쓰기가 끼어든다.

## 해법 1: 불확실성 구간

소스 문서(`uncertainty/doc.go`)가 정의한 개념을 정리한다.

- 트랜잭션은 시작할 때 **전역 한계(global limit) = 시작 타임스탬프 + 클러스터의 최대 시계 오차**를 정한다. 오차 상한이 지켜지는 한 이 값은 "이 트랜잭션보다 인과적으로 먼저 커밋된 어떤 트랜잭션의 타임스탬프도 넘지 못하는 상한"이다.
- 읽는 중 키의 값을 만나면 결과는 셋 중 하나다. (1) 읽기 타임스탬프 이하라 **보인다.** (2) 읽기 타임스탬프보다 크지만 "분명히 동시에 쓰였다"고 판정돼 **무시한다.** (3) "읽기 전에 쓰였을 수 있다"고 판정돼 **불확실** 처리한다.
- (3)이면 `ReadWithinUncertaintyIntervalError` 가 나고 트랜잭션은 읽기 타임스탬프를 올려(refresh 또는 재시도) 그 값을 보게 된다. 단일 키 선형화를 "느슨하지만 상한 있는 시계"에서 지키려는 대가가 이 재시작이다.
- 비트랜잭션 요청도 리스홀더가 시계에서 타임스탬프를 배정할 때 구간을 가진다. 문서는 "단일 범위에서 타임스탬프를 받았으니 큰 값은 다 동시 아닌가"라는 직관이 틀린 이유 두 가지를 예시로 든다. 타임스탬프를 받은 뒤 리스가 옮겨 올 수 있다는 점, 원격에서 커밋된 트랜잭션의 의도(intent)가 나중에 더 높은 타임스탬프로 해소될 수 있다는 점이다. 이 요청의 재시도는 서버 안에서 처리돼 클라이언트에는 오류가 나가지 않는다.

### 관측 타임스탬프로 구간을 줄인다

전역 한계만 쓰면 너무 많은 값이 불확실로 분류된다. 트랜잭션은 노드를 처음 방문할 때 **그 노드 시계의 값(관측 타임스탬프)** 을 기록한다. HLC 는 한 노드에서 단조 증가하므로, 이후 그 노드의 리스홀더가 로컬 시계로 새로 매긴 쓰기는 관측값 이상이다. 그래서 같은 노드에서 이 트랜잭션이 시작한 뒤에 쓰인 값은 인과적으로 앞설 수 없고 무시해도 된다.

- 구간은 **전역 한계**와 선택적인 **로컬 한계**(관측 타임스탬프)로 이뤄진다. 값은 `로컬 타임스탬프(쓴 리스홀더 시계 값) > 로컬 한계` 이면 불확실이 아니고, 그렇지 않으면 `값 타임스탬프 ≤ 전역 한계` 일 때 불확실이다(`Interval.IsUncertain`).
- 로컬 타임스탬프는 값의 **버전 타임스탬프와 별도로** 저장된다. 트랜잭션이 커밋 타임스탬프를 밀어 올려도 "리더가 그 값을 처음 받았을 때의 시계 값"은 남아 관측 비교가 성립한다. 문서는 두 불변식을 든다. 리스홀더 시계는 자기가 서빙한 모든 쓰기의 로컬 타임스탬프 이상이어야 하고, 새 리스홀더의 시계는 이전 리스홀더가 서빙한 쓰기 이상이어야 한다. 후자는 리스 이전에서는 협조적으로, 리스 획득에서는 만료 전 stasis 구간으로 보장한다고 적혀 있다.

### 리스가 바뀌면 관측값을 못 믿는다

관측 타임스탬프는 노드 단위이지만 의미는 "그 노드가 **리스홀더였던** 범위"에 한정된다. `ComputeInterval` 은 그래서 로컬 한계를 **현재 리스 시작 시각(`MinValidObservedTimestamp`)으로 앞으로 끌어올린다.** 주석의 시나리오는 이렇다. 노드 1 이 키 k 를 t=1.0 에 쓰고, 트랜잭션이 노드 2 의 다른 키를 읽으며 관측값 0.99 를 얻는다. 이후 k 의 리스가 노드 2 로 t=1.1 에 넘어간다. 관측값 0.99 를 그대로 쓰면 k 의 쓰기를 무시해 버린다. 리스 시작(1.1)까지 올려야 불확실로 잡힌다. 범위 병합도 같은 이유로 병합 시점까지 올린다. 리스가 유효하지 않은 팔로워 읽기에서는 가장 보수적인 구간(전역 한계만)을 쓴다.

## 해법 2: 읽기 요약

리스가 넘어가거나 범위가 합쳐질 때 새 리스홀더는 타임스탬프 캐시를 이어받아야 한다. 그대로 보내면 크기가 무한하므로 **크기 예산 안에서 해상도를 잃는 요약**을 보낸다(`readsummary/rspb`).

- `ReadSummary` 는 키 공간 조각 두 개(`local`: 범위 로컬 키, `global`: 사용자 키)를 가진다. 각 `Segment` 는 `low_water` 타임스탬프와, 정렬·비중첩된 `ReadSpan` 목록(시작·끝 키, 타임스탬프, 선택적 트랜잭션 ID)이다. 트랜잭션 ID 는 자기 읽기가 자기 쓰기와 충돌로 취급되지 않게 하는 용도다.
- **압축 규칙은 래칫이다.** 해상도를 잃을 수는 있지만 어떤 키의 타임스탬프도 **작아지면 안 된다**(커지기만). 구현(`Segment.Compress`)은 span 을 타임스탬프 내림차순으로 정렬해 예산이 허용하는 만큼 **최신 것부터** 남기고, 잘려 나가는 것 중 가장 큰 타임스탬프로 `low_water` 를 올린다. 잘린 키는 low-water 로 덮이므로 값이 오르기만 한다.
- `Merge` 는 교환·멱등 연산이다(low-water 를 올리고 그 아래 span 을 버린 뒤 span 을 병합).
- 새 리스홀더는 리스를 적용할 때 Raft 항목에 **이전 읽기 요약이 있으면 그것을** 타임스탬프 캐시에 적용하고, 없으면 "이전 리스홀더가 새 리스 시작까지 읽었다고" 비관적으로 가정해 low-water 를 리스 시작으로 올린다. 이때 같은 곳에서 리스홀더 시계도 새 리스 시작으로 갱신하고 `minValidObservedTimestamp` 도 올린다.
- 예산은 클러스터 설정으로 둔다. 소스에서 확인한 기본값은 로컬 4MiB(`kv.lease_transfer_read_summary.local_budget`), 전역 0(`…global_budget`)이다. **전역 예산 0 이면** 직렬화 없이 범위 전체의 최대 타임스탬프 하나로 압축한다(소스 주석: 0 바이트로 압축한 것과 같은 결과를 더 싸게 얻는다). 요약은 범위의 닫힌 타임스탬프로도 올린다. 어느 복제본이든 그 아래를 서빙했을 수 있기 때문이다.

타임스탬프 캐시 노트에서 본 "새 리스가 레코드 생성을 막음"(`ABORT_REASON_NEW_LEASE_PREVENTS_TXN`)은 이 요약이 없을 때 low-water 가 리스 시작으로 올라가서 생기는 경우다. 소스 주석은 24.1 이후 요약을 넘기므로 이 경우가 대부분 사라진다고 적는다.

## 직접 돌려 본 것 (단순화 모형)

**불확실성 구간** — 최대 오차 M=500ms. 리스홀더 A 와 게이트웨이 G 의 시계 오프셋을 무작위로 뽑고, A 에 쓰기 하나가 커밋된 뒤(인과적으로 앞섬, 응답 후 읽기 시작) 또는 읽기와 동시에 읽기가 오는 경우 40만 건씩.

| 조건 | 인과적으로 앞선 쓰기를 놓침 | 동시 쓰기에서 불필요한 재시작 |
| --- | --- | --- |
| 두 시계 차이 ≤ 500ms, 전역 한계만 | 0 | 59.4% |
| 같은 조건, 관측 타임스탬프 사용 | 0 | 4.6% |
| 차이 ≤ 1000ms(상한 위반), 전역 한계만 | 인과 쓰기의 10.1% | 39.9% |
| 같은 위반, 관측 타임스탬프 사용 | 10.1% | 3.4% |

- 오차 상한이 지켜지면 stale read 가 없고, 관측 타임스탬프는 **안전성은 그대로 두고 재시작만** 줄인다.
- 상한이 깨지면(차이 > M) 구간이 모자라 오래된 읽기가 나온다. 관측값은 이를 구해 주지 못한다. 시계 오차 상한은 운영(시계 동기화 모니터링)이 책임지는 가정이다.
- 재시작 비율은 쓰기·읽기 시각 분포를 내가 정한 모형의 값이다(동시 쓰기를 읽기 시작 직후 100ms 안에 균등 배치). 실제 비율이 아니다.

**읽기 요약 압축** — 키 1,000개, 읽기 3,000건. 예산을 span 개수로 단순화해 최신 span 만 남기고 low-water 를 올렸다. 모든 설정에서 어떤 키의 타임스탬프도 퇴보하지 않았다(래칫 성질). 예산 1000/500/100/10/0 에서 읽기 이력의 50% 지점의 쓰기는 정확한 캐시라면 76.8% 가 밀리는데, 500 이하에서는 거기에 23.2%p 가 추가로 밀렸다. 95% 지점의 쓰기는 정확 시 13.4% 가 밀리는데 예산이 500 이하면 추가로 86.6%p 가 더 밀렸다. 압축은 **안전하지만 최근 읽기와 무관한 키까지 쓰기를 밀어 올려** 재시도·지연을 늘린다. 예산을 어떻게 잡느냐가 곧 그 비용이다.

## 언제 쓰나

- `ReadWithinUncertaintyIntervalError`(불확실성 재시작)가 늘었을 때: 시계 오차, 긴 트랜잭션, 노드를 많이 건드리는 트랜잭션 중 무엇이 원인인지 가늠하는 기준.
- 리스 이전·범위 병합 직후 쓰기 중단율이 튈 때(요약 압축에 따른 low-water 상승 가능성).
- 자체 MVCC·분산 저장소를 설계할 때 "시계를 TrueTime 으로 사서 기다릴 것인가(commit-wait), 오차 상한을 가정하고 읽기에서 재시작할 것인가"의 선택 근거. [Spanner](/develop-wiki/knowledge/distributed-systems/spanner-truetime/)와 비교한다.

## 주의 (비용)

- **가정이 곧 안전 조건이다.** 최대 오차 상한을 넘는 노드는 시계 감시로 격리하는 것이 전제다(위 모형의 10.1% 가 그 위반의 크기가 아니라 위반이 안전성을 깨는 방식의 예시다).
- 재시작 비용이 구간 폭(최대 오차)에 비례한다. 오차 상한을 크게 잡을수록 안전 여유는 늘지만 불확실 구간이 넓어진다.
- 관측 타임스탬프는 리스홀더 노드 기준이라 리스 이전·병합·팔로워 읽기에서 효과가 줄거나 사라진다.
- 읽기 요약은 정밀도를 돈으로 바꾼다. 예산이 작으면 이전 직후 쓰기가 밀리고, 크면 이전 메시지와 메모리가 커진다. 위 기본값은 master 소스 시점의 값이며 버전·설정으로 다를 수 있다.
- [리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)에서 보듯 "시간으로 권한을 지키는" 구조라서 시계 점프·정지 같은 운영 위험이 그대로 따라온다. 그 읽기 쪽 시계 선택은 [Raft 리스 읽기와 단조 시계](/develop-wiki/knowledge/distributed-systems/raft-lease-read-monotonic-clock/)에서 본다.

> 출처 확인 범위: CockroachDB 저장소 master(커밋 d30c905, 2026-09-23 기준)의 `uncertainty/doc.go`·`compute.go`·`interval.go`, `readsummary/rspb/summary.proto`·`summary.go`(Merge·Compress 포함), `replica_tscache.go` 의 읽기 요약 수집·적용·예산 설정과 `replica_proposal.go` 의 리스 적용 부분을 직접 읽었다. 실험 두 개는 위 규칙을 옮긴 단순 모형(구간 판정은 `IsUncertain` 규칙, 압축은 span 개수 예산)이며 실제 클러스터를 돌리지 않았다. 미확인: 공식 문서 페이지의 설명, 버전별 차이, 최대 시계 오차 기본값, 요약의 바이트 단위 크기 계산, 범위 병합 경로의 코드, 팔로워 읽기·닫힌 타임스탬프와의 상호작용 전반.

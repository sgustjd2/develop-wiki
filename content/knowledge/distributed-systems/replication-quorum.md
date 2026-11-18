---
title: 복제와 쿼럼 (N/R/W, 리더 기반 vs 리더리스)
aka: [Replication, Quorum, N R W, Leader-based Replication, Leaderless Replication, Sloppy Quorum, Hinted Handoff, Read Repair, Anti-entropy, Dynamo-style]
category: distributed-systems
level: advanced
summary: 데이터를 N 개 복제본에 두고 쓰기 W 개, 읽기 R 개의 응답을 요구하는 쿼럼 방식과, 리더 하나가 순서를 정하는 방식의 차이. R+W>N 이 보장하는 것과 못 하는 것.
tags: [distributed-systems, replication, quorum, dynamo, cassandra, leaderless, consistency]
related: [distributed-systems/raft-consensus, distributed-systems/consistency-models, distributed-systems/cap-pacelc, distributed-systems/logical-clocks, distributed-systems/crdt, distributed-systems/gossip-failure-detection, algorithms/consistent-hashing, data-modeling/sharding-partitioning]
sources:
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
  - https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html
  - https://raft.github.io/raft.pdf
updatedAt: 2026-11-19
---

## 문제

복제본이 여러 개면 장애를 견디고 읽기를 분산한다. 대신 쓰기를 **어느 복제본에 어떻게 퍼뜨리고**, 읽을 때 **어느 복제본을 믿을지** 정해야 한다. 모두에게 확인받으면 안전하지만 한 대만 느려져도 멈추고, 한 대에만 쓰면 빠르지만 읽기가 낡을 수 있다.

## 해법 1: 리더 기반 복제

쓰기는 리더가 받아 로그 순서를 정하고 팔로워에 전달한다.

- 동기 복제: 팔로워 확인 후 응답. 안전하지만 느리고 팔로워 하나가 막히면 쓰기가 막힌다.
- 비동기 복제: 리더만 쓰고 응답. 빠르지만 리더 장애 시 **마지막 쓰기를 잃을 수 있고** 팔로워 읽기가 낡는다.
- 합의 기반(Raft 등): 과반 복제 후 커밋. 리더 교체도 안전하다. [Raft](/develop-wiki/knowledge/distributed-systems/raft-consensus/)

장점: 쓰기 순서가 하나라 충돌이 없다. 단점: 쓰기 처리량·가용성이 리더에 묶이고, 리더 전환 중 짧은 중단이 있다.

## 해법 2: 리더리스 + 쿼럼 (Dynamo 계열)

특별한 리더가 없다. 클라이언트(또는 코디네이터)가 키를 맡은 **N 개 복제본**에 쓴다.

- **W**: 쓰기가 성공으로 간주되려면 응답해야 하는 복제본 수
- **R**: 읽기가 응답하려면 모아야 하는 복제본 수
- **R + W > N** 이면 읽기 집합과 쓰기 집합이 **최소 하나 겹쳐서**, 읽기가 최신 쓰기를 적어도 하나는 만난다.

Dynamo 논문은 흔한 설정으로 (N,R,W) = (3,2,2) 를 든다. R, W 를 N 보다 작게 두는 이유는 지연이 느린 복제본이 아니라 R(W)번째로 빠른 응답에 좌우되기 때문이다.

| 설정(N=3) | 성질 |
| --- | --- |
| W=3, R=1 | 읽기 빠름, 쓰기는 한 대만 죽어도 실패 |
| W=2, R=2 | 균형, 한 대 장애 허용 |
| W=1, R=1 | 가장 빠르고 가용, **R+W ≤ N 이라 낡은 읽기 가능** |
| W=1, R=3 | 쓰기 빠름, 읽기가 한 대 장애에 취약 |

Cassandra 문서는 같은 규칙을 `W + R > RF` 로 쓰고, 일관성 수준으로 `ONE`, `QUORUM`(과반), `ALL`, `LOCAL_QUORUM`(로컬 데이터센터 과반) 등을 요청마다 고르게 한다. 쓰기는 항상 모든 복제본에 보내고, 수준은 **몇 개의 응답을 기다릴지**만 정한다.

```go
// 코디네이터: 모든 복제본에 보내고 W 개 응답이 오면 성공
func write(replicas []Replica, key string, v Value, w int) error {
	acks := make(chan error, len(replicas))
	for _, r := range replicas {
		go func(r Replica) { acks <- r.Put(key, v) }(r)
	}
	ok := 0
	for range replicas {
		if <-acks == nil { ok++ }
		if ok >= w { return nil }   // 나머지는 백그라운드에서 계속 진행
	}
	return errors.New("quorum not reached")
}
```

### 수렴을 돕는 보조 장치

- **읽기 복구(read repair)**: 읽을 때 복제본 값이 다르면 최신 값을 낡은 복제본에 써준다.
- **hinted handoff**: 목표 복제본이 죽었으면 다른 노드가 "힌트"와 함께 임시 보관했다가 복구되면 전달한다.
- **sloppy quorum**: 선호 복제본이 아니어도 건강한 이웃 N 개로 쿼럼을 채워 쓰기 가용성을 높인다(Dynamo). 이때 R+W>N 의 겹침 보장은 **깨진다**.
- **anti-entropy**: 백그라운드에서 복제본끼리 Merkle 트리 해시를 비교해 다른 범위만 동기화한다. Cassandra 문서는 앞의 장치들이 best-effort 이고 anti-entropy repair 가 최종 일관성을 보장한다고 정리한다.
- 충돌 판단: 벡터 클록으로 동시 버전을 감지해 앱이 병합하거나(Dynamo), 타임스탬프 LWW 로 하나를 고른다. [논리 시계](/develop-wiki/knowledge/distributed-systems/logical-clocks/), [CRDT](/develop-wiki/knowledge/distributed-systems/crdt/)

## R+W>N 이 보장하지 않는 것

`R+W>N` 은 **선형화를 보장하지 않는다.**

- 쓰기가 일부 복제본에만 닿고 실패해도, 그 값을 본 읽기와 못 본 읽기가 갈린다(부분 실패 쓰기의 가시성).
- 동시 쓰기의 승자가 시계(LWW)로 결정되면 순서가 어긋난다.
- sloppy quorum, 복제본 교체 중에는 겹침이 무너진다.
- 읽기 복구가 있어도 읽기-읽기 단조성은 설정에 따라 깨질 수 있다.

[CAP·PACELC](/develop-wiki/knowledge/distributed-systems/cap-pacelc/)와 [일관성 모델](/develop-wiki/knowledge/distributed-systems/consistency-models/) 참고. 선형화가 필요하면 합의 기반(리더 + 과반 확인, 읽기 경로 확인)을 쓴다.

## 비교

| | 리더 기반 (비동기) | 리더 기반 + 합의 | 리더리스 쿼럼 |
| --- | --- | --- | --- |
| 쓰기 경로 | 리더 1대 | 리더 + 과반 | 아무 코디네이터 + W |
| 리더 장애 | 유실 위험·전환 지연 | 짧은 선거 후 안전 | 해당 없음 |
| 충돌 | 없음 | 없음 | **있음**(병합 필요) |
| 일관성 | 팔로워 읽기는 낡음 | 선형화 가능 | 설정에 따라 최종 일관 |
| 분할 시 | 리더 쪽만 쓰기 | 과반 쪽만 | 양쪽 모두 쓰기 가능(sloppy) |

## 언제 쓰나

- 순서·불변식이 중요(결제, 재고, 유일성): 리더 + 합의, 또는 이를 내장한 DB.
- 항상 쓸 수 있어야 하고 약한 일관성을 받아들임(장바구니, 세션, 타임라인): 리더리스 쿼럼.
- 읽기 중심 서비스: 리더 기반 + 읽기 복제본, 읽기 후 자기 쓰기가 보여야 하면 리더로 라우팅.

## 주의

- **복제 지연**은 사용자에게 "방금 쓴 게 안 보임"으로 드러난다. read-your-writes 가 필요하면 세션을 리더/최신 복제본에 고정한다.
- 쿼럼이 클수록 지연의 꼬리(가장 느린 복제본)가 커진다.
- 데이터센터 간 복제는 `LOCAL_QUORUM` 처럼 지역 쿼럼으로 지연과 일관성을 거래한다.
- 복제본 구성(멤버십) 변경 중에는 쿼럼 계산이 흔들린다. [gossip](/develop-wiki/knowledge/distributed-systems/gossip-failure-detection/)·링 변경은 천천히 하나씩.

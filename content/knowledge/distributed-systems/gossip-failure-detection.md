---
title: Gossip 멤버십과 장애 감지 (SWIM·Phi Accrual)
aka: [Gossip Protocol, Epidemic Protocol, SWIM, Failure Detector, Phi Accrual, Membership, Heartbeat, Suspicion]
category: distributed-systems
level: advanced
summary: 노드들이 무작위 이웃과 상태를 주고받아 전체 멤버 목록을 퍼뜨리고, 핑·간접 핑·의심 단계로 죽은 노드를 찾는 방식. 중앙 서버 없이 노드 수가 늘어도 노드당 부하가 일정하다.
tags: [distributed-systems, gossip, swim, failure-detection, membership, cassandra, dynamo]
related: [distributed-systems/replication-quorum, distributed-systems/raft-consensus, distributed-systems/crdt, algorithms/consistent-hashing, engineering-practice/observability-basics]
sources:
  - https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
  - https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html
updatedAt: 2026-11-19
---

## 문제

수백 대 클러스터에서 "지금 누가 살아 있고 어떤 키를 누가 맡나"를 모두가 알아야 한다. 중앙 목록 서버는 그 자체가 장애점이고, 모든 노드가 서로 하트비트를 보내는 방식은 메시지가 노드 수의 제곱으로 늘어난다(SWIM 논문이 지적하는 전통 프로토콜의 확장성 한계). 또 "응답이 없다"가 곧 "죽었다"는 아니다.

## 해법 1: Gossip(소문 퍼뜨리기)

주기마다 각 노드가 **무작위 상대 하나**와 아는 정보를 교환한다. 감염병 확산처럼 정보가 퍼진다.

```ts
// 매 주기: 무작위 피어와 멤버십 상태를 병합 (버전이 큰 쪽이 이김)
type Member = { addr: string; heartbeat: number; status: 'alive' | 'suspect' | 'dead' };
function merge(mine: Map<string, Member>, theirs: Map<string, Member>) {
  for (const [id, t] of theirs) {
    const m = mine.get(id);
    if (!m || t.heartbeat > m.heartbeat) mine.set(id, t);
  }
}
setInterval(() => merge(members, rpcExchange(pickRandomPeer(members), members)), 1000);
```

- 정보가 전체에 퍼지는 시간은 노드 수의 **로그**에 비례해 느리게 늘어난다(SWIM 논문).
- 병합이 교환·결합·멱등이면 순서·중복에 안전하다. [CRDT](/develop-wiki/knowledge/distributed-systems/crdt/)와 같은 원리.
- Dynamo 는 멤버십 변경 이력을 매초 무작위 피어와 대조하는 gossip 으로 일관된 뷰를 만들고, 토큰 범위 정보도 같은 경로로 퍼뜨려 각 노드가 키의 담당 노드를 직접 안다. 새 노드 합류 같은 변경은 관리자가 명시적으로 시작한다.
- Cassandra 는 매초 하트비트를 올리고 무작위 피어 1대(+ 도달 불가 노드를 확률적으로, + 필요시 시드)와 교환한다. **시드 노드**는 부트스트랩 때 합류 지점이 되며 gossip 핫스팟이 될 수 있다.

## 해법 2: SWIM 장애 감지

Das 외(2002). 감지와 전파를 분리하고, 둘 다 노드당 부하를 일정하게 둔다.

1. 프로토콜 주기마다 무작위 멤버 M 에게 `ping`.
2. 시간 안에 `ack` 가 없으면 무작위 k 개 멤버에게 `ping-req(M)` 를 보내 **대신 찔러 보게** 한다. 내 쪽 네트워크 경로 문제와 M 의 문제를 구분하려는 것이다.
3. 그래도 응답이 없으면 곧바로 죽음이 아니라 **suspect(의심)** 로 표시하고 소문으로 퍼뜨린다.
4. 의심 기간 안에 M 이 살아 있다고 알리면(자기 반박) 의심이 풀린다. 시간이 지나면 faulty 로 선언·전파.
5. 갱신 소문(suspect/alive/failed)은 별도 메시지 없이 **ping·ack 에 얹어(piggyback)** 퍼뜨린다.

SWIM 논문은 기대 감지 시간, 오탐 확률, 노드당 메시지 부하가 **그룹 크기와 무관**하다고 분석한다(전체 heartbeat 방식은 그중 하나가 크기에 비례해 나빠진다). 같은 멤버에 대한 suspect/alive 메시지의 순서를 구분하려고 번호(incarnation)를 붙인다.

## 해법 3: Phi Accrual 감지기

"죽었다/살았다" 이분법 대신 하트비트 도착 간격의 분포로 **의심 정도 φ** 를 연속 값으로 계산하고, 임계값을 넘으면 죽은 것으로 취급한다. Cassandra 문서는 각 노드가 phi accrual 변형으로 **이웃이 살았는지 독립적으로 판단**하며, 판단 결과(UP/DOWN)는 gossip 으로 전파하지 않는 로컬 상태라고 설명한다. 임계값은 설정 항목이다(기본값은 해당 버전 문서 확인).

## 비교

| | 전체 heartbeat | 중앙 모니터 | SWIM | Phi Accrual |
| --- | --- | --- | --- | --- |
| 노드당 부하 | N 에 비례 | 모니터에 집중 | 일정 | 하트비트 수신량에 의존 |
| 단일 장애점 | 없음 | 있음 | 없음 | 없음 |
| 오탐 완화 | 임계값 | 모니터 판단 | 간접 핑 + suspect | 적응형 임계값 |

## 언제 쓰나

- 리더 없는 클러스터의 멤버십·토큰/샤드 소유권 전파(Cassandra, Dynamo 계열, 서비스 메시·클러스터 라이브러리 일부가 SWIM 계열).
- 수백~수천 노드의 느슨한 상태(부하, 버전, 설정) 전파.
- **강한 일관성이 필요한 멤버십**(리더 선출, 락)에는 gossip 이 아니라 [합의](/develop-wiki/knowledge/distributed-systems/raft-consensus/)를 쓴다. gossip 의 뷰는 최종 일관일 뿐이다.

## 주의 (비용)

- **일시적으로 뷰가 다르다.** 어떤 노드는 아직 죽은 노드를 살아 있다고 믿는다. 요청 경로에 재시도·타임아웃이 필요하다([타임아웃·재시도](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/)).
- **완벽한 장애 감지는 불가능하다.** 느린 노드(GC 정지, 과부하)는 죽은 노드와 구분되지 않는다. 오탐 → 불필요한 데이터 재배치 → 부하 증가의 악순환을 조심한다. suspect 단계와 임계값 조정이 그 완충이다.
- 네트워크 분할 시 양쪽이 서로를 죽었다고 선언한다. gossip 만으로 스플릿 브레인을 막을 수 없다.
- 보안: 기본 gossip 은 참여자를 믿는다. 인증·암호화 없이 외부에 열지 않는다.
- 주기·팬아웃·의심 시간은 감지 속도와 트래픽·오탐의 거래다. 값은 환경에서 측정해 정한다.

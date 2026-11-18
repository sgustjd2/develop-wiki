---
title: CRDT (충돌 없는 복제 데이터 타입)
aka: [CRDT, Conflict-free Replicated Data Type, Strong Eventual Consistency, G-Counter, PN-Counter, OR-Set, LWW-Register, State-based CRDT, Op-based CRDT]
category: distributed-systems
level: advanced
summary: 조율 없이 각 복제본이 독립적으로 수정해도, 같은 갱신을 모두 받으면 항상 같은 상태로 수렴하도록 설계한 데이터 구조. 오프라인 편집·협업·리더리스 복제의 바탕.
tags: [distributed-systems, crdt, eventual-consistency, replication, collaboration, offline-first]
related: [distributed-systems/logical-clocks, distributed-systems/consistency-models, distributed-systems/replication-quorum, distributed-systems/cap-pacelc, distributed-systems/gossip-failure-detection]
sources:
  - https://arxiv.org/abs/1805.06358
  - https://crdt.tech/
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
updatedAt: 2026-11-19
---

## 문제

두 복제본이 네트워크 단절 중에 같은 데이터를 고쳤다. 다시 연결되면 합쳐야 한다. LWW 는 한쪽을 버리고, 수동 병합은 코드가 복잡하며, 락·합의는 오프라인에서 못 쓴다. **병합이 언제나 자동으로, 순서와 중복에 상관없이 같은 결과를 내는** 자료구조가 있다면?

## 해법: 수렴을 구조로 보장

CRDT 는 복제본이 같은 갱신 집합을 받았다면 **같은 상태**가 된다는 성질(강한 최종 일관성, SEC)을 자료형 정의에 내장한다. 두 가지 방식이 있다(Preguiça 외 서베이 기준).

| | 상태 기반 (CvRDT) | 연산 기반 (CmRDT) |
| --- | --- | --- |
| 보내는 것 | 전체(또는 델타) 상태 | 연산(effector) |
| 조건 | 상태가 join-semilattice, 갱신은 상태를 키우기만 함(inflationary), 병합 = 최소 상한(LUB) | 동시 연산이 교환 가능. 대부분 **신뢰성 있는 인과 순서 전달** 필요 |
| 전달 요구 | 중복·유실·순서 뒤바뀜 모두 허용 (병합이 교환·결합·멱등) | 중복 없이 한 번씩, 인과 순서로 |
| 비용 | 상태가 크면 전송 비쌈 → **델타 상태** CRDT 가 변경분만 전송 | 메시지 작음, 전달 계층이 까다로움 |

핵심은 병합 함수의 세 성질: **교환법칙, 결합법칙, 멱등성**. 그러면 gossip 으로 아무렇게나 섞여도 수렴한다.

### 대표 타입

```ts
// G-Counter: 노드별 카운터, 병합은 성분별 max
type G = Record<string, number>;
const inc = (s: G, node: string): G => ({ ...s, [node]: (s[node] ?? 0) + 1 });
const merge = (a: G, b: G): G => {
  const r: G = { ...a };
  for (const [k, v] of Object.entries(b)) r[k] = Math.max(r[k] ?? 0, v);
  return r;
};
const value = (s: G) => Object.values(s).reduce((x, y) => x + y, 0);
```

| 타입 | 아이디어 | 동시 충돌 시 |
| --- | --- | --- |
| G-Counter | 노드별 증가 전용 카운터, 합이 값 | 항상 수렴 |
| PN-Counter | G-Counter 두 개(증가/감소) | 항상 수렴. 하한(0 미만 금지)은 못 지킴 |
| G-Set / 2P-Set | 추가 전용 / 삭제 후 재추가 불가 | 2P-Set 은 한 번 지운 원소를 다시 못 넣음 |
| OR-Set (add-wins) | 추가마다 고유 태그, 삭제는 **관측한 태그만** 제거 | 동시 add/remove 면 add 가 이김 |
| LWW-Register | 타임스탬프 큰 값 | 시계 오차로 유실 가능([논리 시계](/develop-wiki/knowledge/distributed-systems/logical-clocks/)) |
| MV-Register | 동시 값을 모두 보관 | 앱이 형제 값을 해소 |
| 시퀀스(RGA, Logoot 등) | 원소마다 고유 위치 식별자 | 협업 텍스트 편집에 사용 |

## 언제 쓰나

- **오프라인 우선·협업 편집**: 문서·화이트보드·메모 앱(Automerge, Yjs 같은 라이브러리가 시퀀스 CRDT 를 제공).
- **리더리스 DB 의 충돌 없는 타입**: 서베이는 Riak, Redis(엔터프라이즈 Active-Active), Akka Distributed Data 가 CRDT 를 쓴다고 정리한다.
- 좋아요 수·집계 카운터·태그 집합처럼 **교환 가능한 갱신**이 주인 데이터.
- 조율 비용(지연, 가용성)을 아끼고 [최종 일관성](/develop-wiki/knowledge/distributed-systems/consistency-models/)을 받아들일 수 있을 때.

## 주의 (비용)

- **불변식은 못 지킨다.** "재고 ≥ 0", "중복 닉네임 금지", "좌석 하나에 한 명" 은 동시 갱신 후에 깨질 수 있다. 서베이는 이런 불변식에 escrow(자원을 복제본에 미리 분배) 같은 기법이나 필요한 곳만 조율하는 혼합 방식을 언급한다. 근본적으로 [합의](/develop-wiki/knowledge/distributed-systems/raft-consensus/)가 필요한 문제를 CRDT 로 풀려 하지 않는다.
- **메타데이터가 불어난다.** OR-Set 태그, 삭제 표식(tombstone), 시퀀스 식별자는 쌓인다. 가비지 컬렉션에는 "모두가 이 갱신을 봤다"는 합의 비슷한 정보가 필요하다.
- **의미가 직관과 다를 수 있다.** add-wins 면 지운 항목이 부활한 것처럼 보인다. 동시성 의미(add-wins/remove-wins/LWW)를 제품 요구에 맞게 고른다.
- 직접 설계하지 말고 검증된 라이브러리를 쓴다. 병합 법칙 위반은 재현하기 어려운 영구 불일치를 만든다. [속성 기반 테스트](/develop-wiki/knowledge/testing-practice/property-based-testing/)로 교환·결합·멱등성을 검증하기 좋다.

## 비교

| | CRDT | LWW | 벡터 클록 + 앱 병합 | 합의(Raft) |
| --- | --- | --- | --- | --- |
| 병합 | 자동, 결정적 | 자동, 유실 | 수동(앱 코드) | 병합 대신 순서 단일화 |
| 오프라인 쓰기 | 가능 | 가능 | 가능 | 불가 |
| 불변식 | 약함 | 약함 | 앱이 책임 | 강함 |

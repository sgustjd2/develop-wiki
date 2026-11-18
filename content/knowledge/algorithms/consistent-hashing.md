---
title: 일관된 해싱
aka: [Consistent Hashing, Hash Ring, 해시 링, Virtual Nodes, vnode, Jump Consistent Hash, Rendezvous Hashing]
category: algorithms
group: algorithm
level: intermediate
summary: 키와 서버를 같은 원형 해시 공간에 놓고 키를 시계 방향 첫 서버에 배정하는 분산 기법. 서버가 늘거나 줄 때 전체 키의 약 1/n 만 옮겨져, 캐시·분산 DB 의 샤딩에 쓴다.
tags: [consistent-hashing, hash, distributed-systems, sharding, caching, load-balancing]
related: [algorithms/hash-table, algorithms/binary-search, data-modeling/sharding-partitioning, performance/load-balancing, performance/caching-strategies, algorithms/lsm-tree]
sources:
  - https://en.wikipedia.org/wiki/Consistent_hashing
  - https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html
  - https://arxiv.org/abs/1406.2294
  - https://research.google/blog/consistent-hashing-with-bounded-loads/
  - https://arxiv.org/abs/1608.01350
updatedAt: 2026-11-18
---

## 문제

캐시 서버 4대에 키를 나누는 가장 쉬운 방법은 `hash(key) % 4` 다. 그런데 서버를 5대로 늘리면 `% 5` 가 되면서 **거의 모든 키의 담당 서버가 바뀐다**. 아래 실험에서 약 80%가 이동했다. 캐시라면 순간적으로 대부분이 미스가 나서 DB 로 요청이 몰리고(cache stampede), 저장소라면 데이터 대부분을 옮겨야 한다. 서버 한 대가 죽어도 마찬가지다.

## 해법

David Karger 등 MIT 연구진이 1997년 웹 분산 캐싱 논문에서 제안했다. 논문 공저자들이 세운 Akamai 가 CDN 에서 이 기법을 썼다.

- 해시 출력 공간(예: 0 ~ 2³²−1)을 **원(링)**으로 본다.
- 서버도 해시해서 링 위의 점에 놓는다.
- 키를 해시해 링 위에 놓고, **시계 방향으로 처음 만나는 서버**가 담당한다.
- 서버를 추가하면 새 서버와 반시계 방향 이웃 사이 구간의 키만 새 서버로 옮긴다. 서버를 제거하면 그 서버의 키만 다음 서버로 넘어간다. 나머지는 그대로다.
- 서버 위치를 정렬 배열로 두면 조회는 [이분 탐색](/develop-wiki/knowledge/algorithms/binary-search/) O(log N)이다.

### 가상 노드

서버를 링에 한 점씩만 놓으면 구간 길이가 제각각이라 부하가 크게 치우친다. 서버 하나를 **여러 점(가상 노드, vnode)**으로 놓으면 구간이 잘게 섞여 평균에 가까워진다. 서버가 빠질 때도 그 부하가 이웃 하나가 아니라 여러 서버로 흩어진다. 성능이 좋은 서버에 점을 더 주면 가중치가 된다.

아래 코드와 같은 해시로 서버 5대, 키 10만 개를 직접 재 보면(평균 대비 최대·최소 부하):

| 서버당 가상 노드 | 가장 바쁜 서버 | 가장 한가한 서버 |
| --- | --- | --- |
| 1 | 2.13배 | 0.18배 |
| 10 | 1.62배 | 0.60배 |
| 100 | 1.05배 | 0.93배 |
| 500 | 1.05배 | 0.93배 |

### 구현

```ts
// FNV-1a + murmur3 마무리 섞기. 설명용 32비트 해시
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

class HashRing {
  private ring: { point: number; node: string }[] = []; // point 오름차순
  constructor(private vnodes = 160) {}

  add(node: string) {
    for (let i = 0; i < this.vnodes; i++) this.ring.push({ point: hash32(`${node}#${i}`), node });
    this.ring.sort((a, b) => a.point - b.point);
  }
  remove(node: string) { this.ring = this.ring.filter((e) => e.node !== node); }

  // key 의 해시 이상인 첫 지점 (이분 탐색). 끝을 넘으면 0번으로 감아 돈다
  private firstIndex(key: string): number {
    const h = hash32(key);
    let lo = 0, hi = this.ring.length;
    while (lo < hi) { const m = (lo + hi) >>> 1; if (this.ring[m].point < h) lo = m + 1; else hi = m; }
    return lo % this.ring.length;
  }

  lookup(key: string): string {
    if (this.ring.length === 0) throw new Error('empty ring');
    return this.ring[this.firstIndex(key)].node;
  }

  // 복제본 n 개: 시계 방향으로 걸으며 "서로 다른 물리 노드" n 개 (Dynamo·Cassandra 방식)
  replicas(key: string, n: number): string[] {
    const out: string[] = [];
    for (let i = this.firstIndex(key), seen = 0; out.length < n && seen < this.ring.length; i = (i + 1) % this.ring.length, seen++) {
      const node = this.ring[i].node;
      if (!out.includes(node)) out.push(node);
    }
    return out;
  }
}

const keys = Array.from({ length: 100_000 }, (_, i) => `user:${i}`);
const ring = new HashRing();
for (const n of ['a', 'b', 'c', 'd']) ring.add(n);
const before = keys.map((k) => ring.lookup(k));
ring.add('e');
const moved = keys.filter((k, i) => ring.lookup(k) !== before[i]).length;
const modMoved = keys.filter((k) => hash32(k) % 4 !== hash32(k) % 5).length;
console.log((moved / keys.length).toFixed(3), (modMoved / keys.length).toFixed(3)); // 0.196 0.799
```

4대 → 5대에서 링은 19.6%(이론값 1/5)만 옮겼고, `% N` 은 79.9%를 옮겼다.

## 복잡도 (K = 키 수, N = 서버 수, V = 서버당 가상 노드)

| 항목 | 링 | `hash % N` |
| --- | --- | --- |
| 조회 | O(log(N·V)) | O(1) |
| 서버 추가·제거 시 이동 키 | 평균 K/N | 거의 K 전부 |
| 메모리 | O(N·V) | O(1) |

## 변형과 대안

| | 해시 링 + vnode | 랑데부(HRW) 해싱 | Jump consistent hash | 경계 부하(bounded loads) |
| --- | --- | --- | --- | --- |
| 아이디어 | 링에서 시계 방향 첫 서버 | 키마다 모든 서버에 점수 `hash(key, server)` 를 매겨 최댓값 선택 | 키와 버킷 수만으로 0..n−1 버킷 번호 계산 | 링 + 서버별 용량 상한(평균의 1+ε 배) |
| 조회 비용 | O(log N·V) | O(N) | O(log n), 메모리 0 | 링과 비슷 + 넘침 처리 |
| 서버 제거 | 아무 서버나 | 아무 서버나 | **끝 번호만** (버킷이 연속 번호여야 함) | 아무 서버나 |
| 부하 균형 | vnode 수에 따라 | 좋음 | 매우 좋음 | 최대 부하를 보장 |
| 맞는 곳 | 분산 DB·캐시 일반 | 서버 수가 적은 경우, 가중치 | 샤드 번호가 고정된 저장소 | 핫스팟이 문제인 로드 밸런서 |

- **랑데부 해싱**(Highest Random Weight, 1996)은 Wikipedia 에 따르면 더 단순하고 일반적이며, 일관된 해싱을 그 특수한 경우로 볼 수 있다.
- **Jump consistent hash**(Lamping & Veach, Google, 2014)는 논문 초록에 따르면 저장 공간 없이 다섯 줄 정도의 코드로 기존 방식보다 빠르고 고르게 분배한다. 대신 버킷이 순서대로 번호가 매겨져야 해서, 저자들도 웹 캐시보다 **데이터 저장소 샤딩**에 맞다고 말한다. TypeScript 로 옮기면 64비트 연산 때문에 `bigint` 가 필요하다.

```ts
function jumpHash(key: bigint, buckets: number): number {
  let b = -1n, j = 0n;
  const n = BigInt(buckets);
  while (j < n) {
    b = j;
    key = (key * 2862933555777941757n + 1n) & 0xffffffffffffffffn;
    j = BigInt(Math.floor(Number(b + 1n) * (2 ** 31 / Number((key >> 33n) + 1n))));
  }
  return Number(b);
}
// 같은 10만 키로 4 → 5 버킷: 20.2% 이동, 버킷별 19,707~20,184 개로 고르게 분포
```

- **경계 부하 일관된 해싱**(Mirrokni, Thorup, Zadimoghaddam, SODA 2018)은 서버마다 용량을 평균 부하의 (1+ε)배로 제한하고, 꽉 찬 서버는 건너뛰어 시계 방향 다음 서버로 보낸다. Google 연구 블로그에 따르면 Google Cloud Pub/Sub 에 적용됐고, Vimeo 의 엔지니어가 HAProxy 에 구현해 캐시 대역폭을 거의 8분의 1로 줄였다.

## 언제 쓰나

- 분산 캐시 클라이언트가 키를 서버에 나눌 때 — 서버 증감 시 캐시 적중률 붕괴를 막는다.
- 분산 DB·객체 저장소의 파티셔닝과 복제본 배치(링을 따라 다음 N 개 노드).
- 로드 밸런서의 세션 고정(sticky) — 같은 사용자를 같은 백엔드로, 백엔드가 바뀌어도 대부분 유지 → [로드 밸런싱](/develop-wiki/knowledge/performance/load-balancing/).
- 샤드 수가 자주 바뀌는 시스템. 샤드 수가 고정이면 단순한 `% N` 이나 범위 파티셔닝으로 충분하다 → [샤딩과 파티셔닝](/develop-wiki/knowledge/data-modeling/sharding-partitioning/).

## 주의

- **핫 키는 해결하지 못한다.** 링은 키 **개수**를 고르게 나눌 뿐, 특정 키 하나에 몰리는 요청은 그대로 한 서버로 간다. 복제 읽기, 키 분할, 로컬 캐시, 경계 부하 변형을 함께 쓴다.
- **범위 질의가 불가능하다.** 해시가 순서를 지운다. 범위 스캔이 중요하면 범위 파티셔닝을 쓴다.
- 모든 클라이언트가 **같은 링 상태**를 봐야 한다. 멤버십이 어긋나면 같은 키를 다른 서버에서 찾는다. 멤버십 전파(gossip, 코디네이터) 설계가 따로 필요하다.
- **가상 노드가 많으면 운영 비용이 생긴다.** Cassandra 문서에 따르면 토큰마다 링 이웃이 최대 2·(RF−1) 개 늘어 일부 범위가 사용 불가가 되는 장애 조합이 많아지고, 토큰 수만큼 repair 작업이 잘게 쪼개진다. Cassandra 2.x 는 무작위 토큰 할당 때문에 노드당 256 토큰이 기본이었고, 3.x 부터는 결정적 토큰 할당기로 훨씬 적은 토큰으로 균형을 맞춘다.
- 해시 함수의 분포가 나쁘면 이론이 무너진다. 설명용 FNV 대신 MurmurHash·xxHash 같은 해시를 쓴다. 노드 이름 규칙(`node#i`)이 바뀌면 링 전체가 바뀌니 고정해야 한다.

## 실무에서

- **Amazon Dynamo 계열**: Wikipedia 는 Amazon Dynamo, Apache Cassandra, Riak, ScyllaDB, Voldemort, Couchbase, OpenStack Swift, Akamai CDN, Discord 등을 사용 예로 든다.
- **Cassandra**: 문서에 따르면 노드마다 링 위 토큰을 하나 이상 갖고, 키는 시계 방향으로 처음 만나는 노드(들)에 저장된다. 복제 계수(RF)가 3 이면 링을 따라 **서로 다른 물리 노드** 3 개에 복제하며, 같은 물리 노드의 다른 vnode 는 건너뛴다. 가상 노드는 Dynamo 논문이 불균형 해결책으로 제안한 것이다. 운영 환경에서는 랙·데이터센터를 고려하는 `NetworkTopologyStrategy` 를 권장한다.
- 링 위 복제본 배치와 쓰기 경로가 결합된 구조는 [LSM 트리](/develop-wiki/knowledge/algorithms/lsm-tree/) 저장 엔진과 함께 Dynamo 스타일 DB 의 두 축을 이룬다.

> 원 논문: D. Karger et al., "Consistent Hashing and Random Trees: Distributed Caching Protocols for Relieving Hot Spots on the World Wide Web", STOC 1997.

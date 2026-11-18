---
title: 스킵 리스트
aka: [Skip List, Skiplist, 확률적 균형 리스트]
category: algorithms
group: data-structure
level: intermediate
summary: 정렬된 연결 리스트 위에 듬성듬성한 "급행 차선" 층을 확률적으로 쌓아 탐색·삽입·삭제를 기대 O(log n)에 하는 자료구조. 회전 없이 구현이 단순하고 동시성 처리에 유리하다.
tags: [skip-list, linked-list, probabilistic, ordered-map, concurrency]
related: [algorithms/linked-list, algorithms/bst-balanced-tree, algorithms/binary-search, algorithms/lsm-tree, algorithms/hash-table, algorithms/b-tree]
sources:
  - https://en.wikipedia.org/wiki/Skip_list
  - https://github.com/facebook/rocksdb/wiki/RocksDB-Overview
  - https://redis.io/docs/latest/develop/data-types/sorted-sets/
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentSkipListMap.html
updatedAt: 2026-11-18
---

## 문제

정렬된 연결 리스트는 삽입·삭제가 포인터 몇 개 바꾸기로 끝나지만, 위치를 **찾는** 데 O(n)이 걸린다. 배열처럼 가운데로 점프할 수 없어서 이분 탐색이 안 된다. 균형 이진 탐색 트리(레드-블랙, AVL)는 O(log n)을 보장하지만 회전 로직이 복잡하고, 여러 스레드가 동시에 고치려면 트리 전체의 재균형 때문에 잠금 범위가 넓어진다.

## 해법

William Pugh 가 1989~1990년에 제안했다(CACM 1990, "Skip lists: a probabilistic alternative to balanced trees").

- 맨 아래 0층은 모든 원소를 담은 **정렬된 연결 리스트**.
- 원소를 넣을 때 동전을 던져, 확률 p(보통 1/2 또는 1/4)로 한 층 위에도 올린다. 실패할 때까지 반복한다.
- 위층일수록 원소가 듬성듬성해져 **급행 차선** 역할을 한다. 층 i 에는 평균 n·pⁱ 개.
- **탐색**: 맨 위층에서 오른쪽으로 가다가, 다음 키가 찾는 키보다 커지면 한 층 내려간다. 0층까지 반복.
- **삽입**: 탐색하면서 각 층에서 "마지막으로 멈춘 노드"(선행 노드)를 기억하고, 새 노드의 층 수만큼 그 뒤에 끼운다. 회전·재균형이 없다.

```text
3층: H ─────────────────────────→ 50
2층: H ──────────→ 20 ──────────→ 50
1층: H ────→ 10 ─→ 20 ────→ 40 ─→ 50
0층: H → 5 → 10 → 20 → 30 → 40 → 50
     30 찾기: 3층 50>30 ↓, 2층 20 → 50>30 ↓, 1층 → 40>30 ↓, 0층 → 30
```

```ts
class SkipNode<V> {
  next: (SkipNode<V> | null)[];
  constructor(readonly key: number, public value: V | undefined, level: number) {
    this.next = new Array(level).fill(null);
  }
}

class SkipList<V> {
  private static readonly MAX_LEVEL = 32;
  private head = new SkipNode<V>(-Infinity, undefined, SkipList.MAX_LEVEL);
  private level = 1; // 현재 쓰이는 최고 층 수

  constructor(private p = 0.5, private rand: () => number = Math.random) {}

  private randomLevel(): number {
    let l = 1;
    while (l < SkipList.MAX_LEVEL && this.rand() < this.p) l++; // 동전 던지기로 층 수 결정
    return l;
  }

  // 각 층에서 key 보다 작은 마지막 노드를 찾는다 (위층 → 아래층)
  private findPredecessors(key: number): SkipNode<V>[] {
    const update: SkipNode<V>[] = new Array(SkipList.MAX_LEVEL).fill(this.head);
    let x = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      for (let n = x.next[i]; n && n.key < key; n = x.next[i]) x = n;
      update[i] = x;
    }
    return update;
  }

  get(key: number): V | undefined {
    const c = this.findPredecessors(key)[0].next[0];
    return c && c.key === key ? c.value : undefined;
  }

  set(key: number, value: V): void {
    const update = this.findPredecessors(key);
    const c = update[0].next[0];
    if (c && c.key === key) { c.value = value; return; }
    const lvl = this.randomLevel();
    this.level = Math.max(this.level, lvl); // 새 층의 선행 노드는 head (fill 로 채워 둠)
    const node = new SkipNode(key, value, lvl);
    for (let i = 0; i < lvl; i++) {
      node.next[i] = update[i].next[i];
      update[i].next[i] = node;
    }
  }

  // 범위 스캔: 시작점을 O(log n) 에 찾고 맨 아래층을 따라 걷는다
  *range(from: number, to: number): Generator<[number, V]> {
    for (let n = this.findPredecessors(from)[0].next[0]; n && n.key <= to; n = n.next[0]) {
      yield [n.key, n.value as V];
    }
  }
}

const sl = new SkipList<string>();
for (const k of [30, 10, 50, 20, 40]) sl.set(k, `v${k}`);
console.log(sl.get(20), sl.get(25));  // v20 undefined
console.log([...sl.range(15, 40)]);   // [[20,'v20'],[30,'v30'],[40,'v40']]
```

삭제는 같은 방식으로 선행 노드를 찾아 각 층에서 포인터를 건너뛰게 바꾸면 된다.

## 복잡도

| 연산 | 기대(평균) | 최악 |
| --- | --- | --- |
| 탐색·삽입·삭제 | O(log n) | O(n) |
| 범위 스캔(k 개) | O(log n + k) | O(n) |
| 공간 | O(n) — p = 1/2 이면 노드당 평균 포인터 2개, p = 1/4 이면 약 1.33개 | O(n log n) |

- 최악은 동전이 계속 나쁘게 나오는 경우라 확률이 극히 낮다. 입력 순서와 무관하다(정렬된 입력에도 무너지지 않는다). 단, **난수를 공격자가 예측할 수 있으면** 최악을 유도할 수 있다.
- p 를 줄이면 포인터(메모리)가 줄고 탐색 단계는 늘어난다. Wikipedia 는 평균 탐색 시간만 보면 p = 1/e 가 최적이고, 구현 편의로 1/2 를 흔히 쓴다고 설명한다.
- 각 링크가 아래층 몇 칸을 건너뛰는지(폭)를 함께 저장하면 **k 번째 원소 찾기·순위 계산**도 O(log n)이 된다(indexable skip list).

## 언제 쓰나

- 정렬 순서가 필요한 맵/셋(범위 질의, 최소·최대, 순위)이 필요한데 균형 트리 구현이 부담스러울 때.
- **동시성**: 삽입이 국소적이라(선행 노드 몇 개만 수정) 세밀한 잠금이나 CAS 기반 무잠금(lock-free) 구현이 균형 트리보다 쉽다.
- 쓰기가 많고 정렬된 순서로 한꺼번에 내보내야 하는 메모리 버퍼(아래 LSM 의 memtable).

## 주의

- **캐시 지역성이 나쁘다.** 노드가 힙 곳곳에 흩어져 포인터 추적마다 캐시 미스가 날 수 있다. 단일 스레드 메모리 맵이라면 B-트리 계열이나 정렬 배열이 더 빠른 경우가 많다.
- 최악 O(n) 이 이론적으로 가능하다. 실시간 시스템처럼 **최악 보장**이 필요하면 균형 트리를 쓴다.
- 노드마다 층 수가 달라 메모리 할당이 들쭉날쭉하다. 실제 구현은 노드와 포인터 배열을 한 덩어리로 할당하는 등 최적화한다.
- 역방향 순회가 필요하면 0층에 역방향 포인터를 추가해야 한다. Java `ConcurrentSkipListMap` 문서도 오름차순 뷰가 내림차순 뷰보다 빠르다고 적는다.

## 비교

| | 스킵 리스트 | 균형 BST (레드-블랙 등) | B-트리 | 해시 테이블 |
| --- | --- | --- | --- | --- |
| 탐색 | 기대 O(log n) | 최악 O(log n) | O(log n), 페이지 단위 | 평균 O(1) |
| 정렬·범위 질의 | 예 | 예 | 예 | 아니오 |
| 구현 난이도 | 쉬움 | 어려움(회전) | 어려움(분할·병합) | 쉬움 |
| 동시성 | 국소 수정이라 유리 | 재균형이 넓게 퍼짐 | 래치 커플링 필요 | 버킷 단위 잠금 |
| 캐시 효율 | 낮음 | 낮음 | 높음 | 높음(개방 주소법) |

자세한 내용: [연결 리스트](/develop-wiki/knowledge/algorithms/linked-list/), [균형 이진 탐색 트리](/develop-wiki/knowledge/algorithms/bst-balanced-tree/), [B-트리](/develop-wiki/knowledge/algorithms/b-tree/).

## 실무에서

- **Redis** 정렬 집합(Sorted Set): 공식 문서에 따르면 스킵 리스트와 해시 테이블을 함께 쓰는 구조다. 해시 테이블로 멤버의 점수를 O(1)에 찾고, 스킵 리스트로 점수 순서·범위(`ZRANGE`, `ZRANK`)를 처리한다. `ZADD` 는 O(log N).
- **RocksDB**: 위키에 따르면 memtable 의 기본 구현이 스킵 리스트다. 쓰기는 정렬된 메모리 구조에 들어가고, 가득 차면 정렬된 순서 그대로 SST 파일로 내보낸다 → [LSM 트리](/develop-wiki/knowledge/algorithms/lsm-tree/).
- **Java** `ConcurrentSkipListMap`/`ConcurrentSkipListSet`: 문서에 따르면 `get`·`put`·`remove` 가 기대 평균 log(n)이고 여러 스레드가 동시에 안전하게 삽입·삭제할 수 있다. null 키·값은 허용하지 않는다.
- Wikipedia 는 이 밖에 MemSQL(현 SingleStore)의 무잠금 인덱스, Qt 4 까지의 `QMap` 등을 사용 예로 든다.

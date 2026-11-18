---
title: 힙과 우선순위 큐
aka: [Binary Heap, Priority Queue, Min-Heap, Max-Heap, 이진 힙, 우선순위 큐]
category: algorithms
group: data-structure
level: intermediate
summary: 가장 작은(또는 큰) 원소를 O(1)에 보고 O(log n)에 꺼내는 완전 이진 트리. 배열 하나로 구현하며 우선순위 큐, 다익스트라, Top-K, 타이머에 쓴다.
tags: [heap, priority-queue, top-k, scheduling]
related: [algorithms/array-dynamic-array, algorithms/shortest-path, algorithms/sorting-comparison, algorithms/greedy, algorithms/bst-balanced-tree, algorithms/minimum-spanning-tree]
sources:
  - https://docs.python.org/3/library/heapq.html
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html
  - https://en.wikipedia.org/wiki/Binary_heap
  - https://pkg.go.dev/container/heap
updatedAt: 2026-11-18
---

## 개념

**힙 속성**(최소 힙): 모든 부모 ≤ 자식. 그래서 루트가 최솟값이다. 형제끼리는 순서가 없다(정렬된 상태가 아니다).

**완전 이진 트리**라서 배열에 빈칸 없이 담긴다. 0 기반 인덱스로 `i` 의 자식은 `2i+1`, `2i+2`, 부모는 `⌊(i−1)/2⌋`. 포인터가 필요 없다.

## 연산 복잡도

| 연산 | 복잡도 | 방법 |
| --- | --- | --- |
| 최솟값 보기 (peek) | O(1) | `a[0]` |
| 삽입 (push) | O(log n) | 끝에 넣고 부모와 비교하며 위로(sift-up) |
| 최솟값 꺼내기 (pop) | O(log n) | 마지막 원소를 루트로 옮기고 아래로(sift-down) |
| 배열 → 힙 (heapify) | **O(n)** | 아래 층부터 sift-down. n 번 push(O(n log n))보다 빠르다 |
| 임의 원소 탐색·삭제 | O(n) | 위치를 모름. 인덱스 맵을 두면 O(log n) |
| 우선순위 변경 | O(log n) | 위치를 알 때만 |

## 구현

```ts
class MinHeap<T> {
  private a: T[] = [];
  constructor(private readonly less: (x: T, y: T) => boolean) {}

  get size(): number { return this.a.length; }
  peek(): T | undefined { return this.a[0]; }

  push(x: T): void {
    this.a.push(x);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(this.a[i], this.a[p])) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }

  pop(): T | undefined {
    if (this.a.length === 0) return undefined;
    const top = this.a[0];
    const last = this.a.pop()!;
    if (this.a.length > 0) {
      this.a[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private siftDown(i: number): void {
    const n = this.a.length;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < n && this.less(this.a[l], this.a[m])) m = l;
      if (r < n && this.less(this.a[r], this.a[m])) m = r;
      if (m === i) return;
      [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
      i = m;
    }
  }
}

// Top-K: 크기 k 최소 힙을 유지하면 O(n log k), 메모리 O(k)
function topK(xs: Iterable<number>, k: number): number[] {
  const h = new MinHeap<number>((x, y) => x < y);
  for (const x of xs) {
    if (h.size < k) h.push(x);
    else if (x > h.peek()!) { h.pop(); h.push(x); }
  }
  const out: number[] = [];
  while (h.size) out.push(h.pop()!);
  return out.reverse();
}
console.log(topK([5, 1, 9, 3, 7, 8], 3)); // [9, 8, 7]
```

## 언제 쓰나

- "지금 가장 급한/작은 것"을 반복해서 꺼내야 할 때: 작업 스케줄러, 타이머, 이벤트 시뮬레이션.
- [다익스트라](/develop-wiki/knowledge/algorithms/shortest-path/), Prim, A* 의 후보 관리.
- 스트림에서 Top-K, 여러 정렬된 목록 병합(k-way merge, 외부 정렬), 중앙값 유지(최대 힙 + 최소 힙).
- 힙 정렬: 제자리 O(n log n) 최악 보장 → [정렬 비교](/develop-wiki/knowledge/algorithms/sorting-comparison/).

## 주의

- **안정적이지 않다.** 우선순위가 같은 원소의 꺼내는 순서가 보장되지 않는다. 순서가 필요하면 `(priority, 일련번호, 값)` 으로 비교한다(Python 문서가 같은 방법을 권한다).
- 우선순위 변경·삭제를 자주 해야 하면: 위치 인덱스 맵을 유지하거나, Python 문서 방식처럼 옛 항목에 "삭제됨" 표시 후 새 항목을 넣고 꺼낼 때 건너뛴다(lazy deletion).
- 힙은 정렬된 순회를 주지 않는다. Java `PriorityQueue` 의 이터레이터도 특정 순서를 보장하지 않는다고 문서에 나와 있다. 정렬된 순회·범위 질의가 필요하면 [균형 트리](/develop-wiki/knowledge/algorithms/bst-balanced-tree/).
- 언어마다 기본이 다르다: Python `heapq`·Java `PriorityQueue` 는 최소 힙, C++ `priority_queue` 는 최대 힙.

## 실무에서

- Java `PriorityQueue` 문서: `offer`/`poll` O(log n), `remove(Object)`/`contains` 선형, `peek`/`size` 상수.
- Python `heapq` 는 리스트 위의 최소 힙이며 `heapify` 가 선형 시간이다. 3.14 에서 `heappush_max` 등 최대 힙 함수가 추가됐다.
- Go `container/heap` 은 `heap.Interface` 를 구현한 아무 컬렉션에 힙 연산을 제공한다.
- OS·런타임의 타이머 관리, Kubernetes 스케줄링 큐, 로그 병합(k-way merge)에 쓰인다.

> 참고: CLRS 4판 6장 "Heapsort" (힙, heapify 의 O(n) 증명, 우선순위 큐).

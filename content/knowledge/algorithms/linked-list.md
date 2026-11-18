---
title: 연결 리스트
aka: [Linked List, Singly Linked List, Doubly Linked List, 단일 연결 리스트, 이중 연결 리스트]
category: algorithms
group: data-structure
level: beginner
summary: 각 노드가 다음(과 이전) 노드를 가리키는 포인터로 이어진 목록. 위치를 알고 있으면 삽입·삭제가 O(1)이지만 인덱스 접근은 O(n)이다.
tags: [linked-list, pointer, lru-cache]
related: [algorithms/array-dynamic-array, algorithms/stack-queue-deque, algorithms/hash-table, algorithms/two-pointers-sliding-window, algorithms/skip-list]
sources:
  - https://en.wikipedia.org/wiki/Linked_list
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html
  - https://docs.kernel.org/core-api/list.html
updatedAt: 2026-11-18
---

## 개념

노드 = 값 + 다음 노드 포인터(단일), 여기에 이전 노드 포인터를 더하면 이중 연결 리스트다. 노드는 메모리 아무 곳에나 흩어져 있어도 된다.

## 연산 복잡도

| 연산 | 단일 | 이중 | 배열과 비교 |
| --- | --- | --- | --- |
| 앞에 삽입/삭제 | O(1) | O(1) | 배열 O(n) |
| 끝에 삽입 | O(1) (tail 유지 시) | O(1) | 배열 상각 O(1) |
| 끝에서 삭제 | O(n) | O(1) | 배열 O(1) |
| 노드를 알 때 그 노드 삭제 | O(n) (이전 노드 필요) | **O(1)** | 배열 O(n) |
| i 번째 접근 | O(n) | O(n) | 배열 O(1) |
| 탐색 | O(n) | O(n) | 배열 O(n) |
| 원소당 추가 메모리 | 포인터 1개 | 포인터 2개 | 없음 |

## 해법: 이중 연결 리스트 + 해시맵 = LRU 캐시

연결 리스트가 실무에서 가장 빛나는 곳은 "**노드 위치를 해시맵이 이미 알고 있는**" 경우다. 탐색 O(n) 약점이 사라지고 O(1) 이동·삭제만 남는다.

```ts
class Node<K, V> {
  prev: Node<K, V> | null = null;
  next: Node<K, V> | null = null;
  constructor(public key: K, public value: V) {}
}

class LruCache<K, V> {
  private map = new Map<K, Node<K, V>>();
  private head: Node<K, V> | null = null; // 가장 최근
  private tail: Node<K, V> | null = null; // 가장 오래됨
  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    const n = this.map.get(key);
    if (!n) return undefined;
    this.unlink(n);
    this.pushFront(n);
    return n.value;
  }

  set(key: K, value: V): void {
    const old = this.map.get(key);
    if (old) this.unlink(old);
    const n = old ?? new Node(key, value);
    n.value = value;
    this.pushFront(n);
    this.map.set(key, n);
    if (this.map.size > this.capacity && this.tail) {
      const victim = this.tail;
      this.unlink(victim);
      this.map.delete(victim.key);
    }
  }

  private unlink(n: Node<K, V>): void {
    if (n.prev) n.prev.next = n.next; else this.head = n.next;
    if (n.next) n.next.prev = n.prev; else this.tail = n.prev;
    n.prev = n.next = null;
  }

  private pushFront(n: Node<K, V>): void {
    n.next = this.head;
    if (this.head) this.head.prev = n;
    this.head = n;
    if (!this.tail) this.tail = n;
  }
}
```

JS 의 `Map` 은 삽입 순서를 보존하므로 "delete 후 다시 set" 으로 더 짧게 LRU 를 만들 수도 있다. 위 코드는 구조를 보이기 위한 것이다.

## 자주 쓰는 기법

- **더미(sentinel) 노드**: head/tail 앞뒤에 빈 노드를 두면 `null` 분기가 사라져 버그가 준다.
- **빠른/느린 포인터**: 한 칸·두 칸씩 가는 포인터 두 개로 중간 노드 찾기, 사이클 탐지(Floyd) → [투 포인터](/develop-wiki/knowledge/algorithms/two-pointers-sliding-window/).
- **침입형(intrusive) 리스트**: 노드 포인터를 객체 안에 직접 넣어 별도 노드 할당을 없앤다. Linux 커널 `list_head` 가 대표적이다.

## 언제 쓰나

- 노드 참조를 이미 들고 있고, 그 자리에서 삽입·삭제·이동이 잦을 때 (LRU, 작업 대기열, 메모리 할당기의 free list)
- 원소를 옮기지 않아야 할 때: 노드 주소가 바뀌지 않으므로 외부 참조가 유효하게 유지된다.
- 락 없는(lock-free) 큐·스택 같은 동시성 구조의 기반.

## 주의

- **캐시 지역성이 나쁘다.** 노드가 흩어져 있어 순회마다 캐시 미스가 난다. "중간 삽입이 O(1)이라 빠르다"는 직관은 그 위치를 찾는 O(n) 순회 비용 때문에 대부분 틀린다. 일반 목록은 [동적 배열](/develop-wiki/knowledge/algorithms/array-dynamic-array/)이 기본값이다.
- 노드마다 할당과 포인터 오버헤드가 붙는다(GC 언어에서는 객체 수 증가 = GC 부담).
- 포인터 조작 실수(끊긴 링크, 순환)가 디버깅하기 어렵다.

## 실무에서

- Java `LinkedHashMap` 은 모든 엔트리를 관통하는 이중 연결 리스트를 유지하고, `accessOrder = true` + `removeEldestEntry` 오버라이드로 LRU 캐시를 만들 수 있다고 문서에 나와 있다.
- Linux 커널은 `include/linux/list.h` 의 순환 이중 연결 리스트를 프로세스 목록, 대기 큐 등 곳곳에 쓴다.
- Redis 의 리스트 타입, 각종 LRU 캐시 라이브러리(npm `lru-cache` 등)도 이 조합을 쓴다.

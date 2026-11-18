---
title: 이진 탐색 트리와 균형 트리 (레드블랙·AVL)
aka: [Binary Search Tree, BST, Self-balancing BST, Red-Black Tree, AVL Tree, 레드블랙 트리, AVL 트리]
category: algorithms
group: data-structure
level: intermediate
summary: 왼쪽 < 노드 < 오른쪽 규칙으로 정렬 순서를 유지하는 트리. 회전으로 높이를 O(log n)으로 묶어 두는 레드블랙·AVL 트리가 정렬 맵·범위 질의의 표준이다.
tags: [bst, red-black-tree, avl, sorted-map, ordered-set]
related: [algorithms/b-tree, algorithms/hash-table, algorithms/heap-priority-queue, algorithms/binary-search, algorithms/trie, algorithms/skip-list, algorithms/segment-tree-fenwick-tree]
sources:
  - https://docs.kernel.org/core-api/rbtree.html
  - https://en.wikipedia.org/wiki/Red%E2%80%93black_tree
  - https://en.wikipedia.org/wiki/AVL_tree
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html
updatedAt: 2026-11-18
---

## 개념

**이진 탐색 트리(BST)**: 모든 노드에서 왼쪽 서브트리 키 < 노드 키 < 오른쪽 서브트리 키. 중위 순회하면 정렬 순서가 나온다.

문제는 **높이**다. 이미 정렬된 데이터를 순서대로 넣으면 한쪽으로만 자라 연결 리스트가 되고 모든 연산이 O(n)이 된다. **균형 트리**는 삽입·삭제 때 회전(rotation)으로 높이를 O(log n)으로 유지한다.

## 두 대표 균형 트리

| | AVL 트리 | 레드블랙 트리 |
| --- | --- | --- |
| 불변식 | 모든 노드에서 좌우 높이 차 ≤ 1 | 색 규칙: 빨강 노드 연속 금지, 루트→리프 경로의 검정 노드 수 동일 |
| 높이 상한 | 약 1.44 log₂ n | 2 log₂(n+1) |
| 조회 | 더 빠름(더 낮음) | 약간 느림 |
| 삽입/삭제 회전 | 삭제 시 O(log n)번까지 | 삽입 최대 2회, 삭제 최대 3회 |
| 어울리는 곳 | 조회가 압도적으로 많을 때 | 삽입·삭제가 잦은 범용 정렬 맵 |

두 트리 모두 조회·삽입·삭제 O(log n) 최악 보장이다. 그 밖에 트립(무작위 우선순위), 스플레이(상각 O(log n)), 스킵 리스트(트리는 아니지만 같은 용도) 등이 있다.

## 연산 복잡도 (균형 트리 기준)

| 연산 | 복잡도 | 해시 테이블과 비교 |
| --- | --- | --- |
| 조회·삽입·삭제 | O(log n) 최악 | 해시는 평균 O(1), 최악 O(n) |
| 최솟값·최댓값 | O(log n) | 해시는 O(n) |
| 다음 큰 키(successor), floor/ceiling | O(log n) | 해시는 불가 |
| 범위 질의 [a, b] | O(log n + k) | 해시는 O(n) |
| 정렬 순회 | O(n) | 해시는 정렬 필요 O(n log n) |

## 해법: 기본 BST 와 회전

균형 트리 구현 전체는 길다. 핵심은 BST 탐색 + 회전 두 동작이다.

```ts
interface TreeNode<K> { key: K; left: TreeNode<K> | null; right: TreeNode<K> | null }

function insert<K>(root: TreeNode<K> | null, key: K, cmp: (a: K, b: K) => number): TreeNode<K> {
  if (!root) return { key, left: null, right: null };
  const c = cmp(key, root.key);
  if (c < 0) root.left = insert(root.left, key, cmp);
  else if (c > 0) root.right = insert(root.right, key, cmp);
  return root; // 균형 트리는 여기서 높이/색을 고치며 회전한다
}

// x 보다 크거나 같은 가장 작은 키 (ceiling) — 해시 테이블로는 못 하는 질의
function ceiling<K>(root: TreeNode<K> | null, x: K, cmp: (a: K, b: K) => number): K | undefined {
  let best: K | undefined;
  for (let n = root; n; ) {
    const c = cmp(x, n.key);
    if (c === 0) return n.key;
    if (c < 0) { best = n.key; n = n.left; } else n = n.right;
  }
  return best;
}

//     y            x
//    / \          / \
//   x   C  -->   A   y      오른쪽 회전: 중위 순서(A x B y C)는 그대로
//  / \              / \
// A   B            B   C
function rotateRight<K>(y: TreeNode<K>): TreeNode<K> {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  return x;
}

const num = (a: number, b: number) => a - b;
let root: TreeNode<number> | null = null;
for (const k of [50, 30, 70, 60, 80]) root = insert(root, k, num);
console.log(ceiling(root, 65, num)); // 70
```

회전은 중위 순서를 바꾸지 않으면서 한쪽 높이를 1 줄이고 다른 쪽을 1 늘린다. AVL 은 높이 차, 레드블랙은 색 규칙이 깨진 곳에서 회전·색 바꾸기를 조합한다(CLRS 13장).

## 언제 쓰나

- 키 순서가 의미 있을 때: "이 시각 이후 첫 이벤트", 순위·구간 집계, 정렬된 리더보드.
- 최악 지연 보장이 필요할 때(해시의 O(n) 최악·리사이즈 스파이크를 피하고 싶을 때).
- 메모리 내 자료구조. 디스크·SSD 기반 대용량이면 [B-트리](/develop-wiki/knowledge/algorithms/b-tree/)가 맞다.

## 주의

- 직접 구현하지 않는다. 삭제 케이스가 특히 까다로워 버그가 잦다. 표준 라이브러리(Java `TreeMap`, C++ `std::map`, Rust `BTreeMap`)를 쓴다.
- 노드마다 포인터 2~3개 + 균형 정보가 붙어 메모리 오버헤드가 크고 캐시 지역성이 나쁘다. 그래서 Rust 표준 라이브러리는 정렬 맵을 이진 트리가 아니라 B-트리로 구현했다.
- 정확한 일치 조회만 필요하면 해시 테이블이 더 빠르고 단순하다.
- JS 에는 내장 정렬 맵이 없다. 필요하면 검증된 라이브러리를 쓰거나, 데이터가 거의 안 바뀌면 정렬 배열 + [이분 탐색](/develop-wiki/knowledge/algorithms/binary-search/)으로 충분하다.

## 실무에서

- Java `TreeMap` 은 레드블랙 트리 기반이며 `containsKey`/`get`/`put`/`remove` 에 log(n) 시간을 보장한다고 문서에 적혀 있다.
- Linux 커널 문서는 rbtree 사용처로 I/O 스케줄러의 요청 추적, 고해상도 타이머, 가상 메모리 영역(VMA), epoll 파일 디스크립터 등을 든다. 같은 문서가 AVL 과 비교해 삽입·삭제의 최악 성능이 더 예측 가능하다고 설명한다.
- 메모리 DB·스토리지 엔진의 memtable 은 정렬 순서가 필요해 균형 트리나 스킵 리스트를 쓴다(LevelDB/RocksDB 기본 memtable 은 스킵 리스트).

> 참고: CLRS 4판 12장 "Binary Search Trees", 13장 "Red-Black Trees".

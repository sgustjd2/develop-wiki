---
title: B-트리와 B+트리
aka: [B-tree, B+ tree, B+트리, Balanced Multiway Tree, 다진 균형 트리]
category: algorithms
group: data-structure
level: intermediate
summary: 노드 하나에 키를 수백 개 담아 트리를 아주 낮게 유지하는 균형 다진 트리. 디스크·SSD 블록 단위 읽기에 맞춰져 있어 관계형 DB 인덱스와 파일 시스템의 표준 구조다.
tags: [b-tree, b-plus-tree, database, index, storage]
related: [algorithms/bst-balanced-tree, algorithms/binary-search, algorithms/hash-table, data-modeling/index-design, data-modeling/primary-key-design, algorithms/lsm-tree, algorithms/skip-list]
sources:
  - https://en.wikipedia.org/wiki/B-tree
  - https://www.postgresql.org/docs/current/btree.html
  - https://www.sqlite.org/fileformat2.html
  - https://doc.rust-lang.org/std/collections/struct.BTreeMap.html
updatedAt: 2026-11-18
---

## 문제

디스크나 SSD 는 바이트 하나를 읽으나 블록(페이지, 보통 4~16KB) 하나를 읽으나 비용이 비슷하다. 이진 트리는 노드 하나에 키 하나라서 원소 10억 개면 높이가 30 안팎이고, 그만큼 페이지를 읽어야 한다. **한 번 읽을 때 최대한 많이 갈라지게** 해야 한다.

## 해법

Bayer 와 McCreight 가 1970년 Boeing 연구소에서 고안했다(1972년 Acta Informatica 게재).

- 노드 하나 = 페이지 하나. 정렬된 키 배열과 자식 포인터를 수백 개 담는다(분기 수 m).
- 루트가 아닌 노드는 최소 절반 이상 채운다(⌈m/2⌉ 자식). 그래서 높이가 `log_m n` 으로 매우 낮다.
- **삽입**: 리프에 넣고, 넘치면 반으로 쪼개 가운데 키를 부모로 올린다. 루트가 쪼개질 때만 높이가 1 늘어난다 → 모든 리프의 깊이가 항상 같다.
- **삭제**: 너무 비면 형제에게서 빌리거나 형제와 합친다.

분기 수 500 이면 높이 3 으로 1억 2천만 개 이상을 담는다. 상위 두 층은 메모리 캐시에 상주하므로 조회 한 번에 실제 디스크 읽기는 1~2회다.

### B+트리

DB 인덱스 대부분이 쓰는 변형이다.

| | B-트리 | B+트리 |
| --- | --- | --- |
| 값(또는 행 포인터) 위치 | 모든 노드 | **리프에만** |
| 내부 노드 | 키 + 값 + 자식 | 키(구분자) + 자식만 → 더 많은 분기 |
| 리프 연결 | 없음 | 형제 리프끼리 연결 리스트 |
| 범위 스캔 | 트리 순회 | 시작 리프를 찾고 옆으로 쭉 읽기 |

## 연산 복잡도

| 연산 | 복잡도 (페이지 읽기 기준) |
| --- | --- |
| 조회 | O(log_m n) 페이지, 페이지 안에서는 이분 탐색 |
| 삽입·삭제 | O(log_m n), 분할·병합은 경로상에서만 |
| 범위 스캔 (B+) | O(log_m n + k/m) |
| 공간 | O(n), 노드 채움률 50~100% |

## 구현 스케치: 노드 안 탐색과 하강

```ts
interface BNode {
  keys: number[];          // 정렬됨
  children: BNode[];       // 리프면 빈 배열, 아니면 keys.length + 1 개
}

// keys 에서 x 이상인 첫 위치 (페이지 내부 이분 탐색)
function lowerBound(keys: readonly number[], x: number): number {
  let lo = 0, hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (keys[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// 페이지를 몇 번 읽었는지 함께 반환
function search(root: BNode, x: number): { found: boolean; pageReads: number } {
  let node = root, reads = 1;
  for (;;) {
    const i = lowerBound(node.keys, x);
    if (i < node.keys.length && node.keys[i] === x) return { found: true, pageReads: reads };
    if (node.children.length === 0) return { found: false, pageReads: reads };
    node = node.children[i];
    reads++;
  }
}

const leaf = (keys: number[]): BNode => ({ keys, children: [] });
const root: BNode = { keys: [20, 40], children: [leaf([5, 10]), leaf([25, 30]), leaf([45, 50])] };
console.log(search(root, 30)); // { found: true, pageReads: 2 }
```

분할·병합까지 포함한 전체 구현은 CLRS 18장을 본다. 실무 엔진은 여기에 동시성 제어(래치), WAL, 페이지 압축이 더해진다.

## 언제 쓰나

- 데이터가 메모리보다 크고 블록 장치에 저장될 때: DB 인덱스, 파일 시스템 메타데이터, 키-값 저장소.
- 정렬 순서·범위 질의·접두어 검색이 필요한 영속 인덱스.
- 메모리 안에서도 캐시 라인 활용 때문에 이진 트리보다 빠를 수 있다(Rust `BTreeMap`).

## 주의

- **쓰기 증폭**: 키 하나를 바꿔도 페이지 전체를 다시 쓴다. 쓰기가 압도적인 워크로드에는 LSM 트리(RocksDB, Cassandra)가 더 맞는 경우가 많다. 대신 LSM 은 읽기·공간 증폭이 있다.
- **무작위 키 삽입은 페이지 분할을 흩뿌린다.** UUIDv4 같은 무작위 기본 키는 인덱스 곳곳의 페이지를 쪼개 캐시 효율과 채움률을 떨어뜨린다 → [키 설계](/develop-wiki/knowledge/data-modeling/primary-key-design/).
- 해시 인덱스보다 등호 조회 한 번은 느릴 수 있다. 그러나 범위·정렬을 지원하므로 기본값으로 B-트리를 쓴다.
- "B-tree 인덱스가 있다 = 쿼리가 빠르다"가 아니다. 칼럼 순서·선택도에 따라 못 쓰는 경우가 많다 → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).

## 실무에서

- PostgreSQL 의 기본 인덱스는 B-tree 이며 `<`, `<=`, `=`, `>=`, `>` 를 지원하고, 리프에서 중복 키를 posting list 로 합치는 중복 제거를 기본으로 켠다.
- 파일 시스템 NTFS, HFS+, APFS, Btrfs, ext4 등이 B-트리 계열을 쓴다.
- SQLite 파일 포맷 문서에 따르면 데이터베이스 파일은 B-tree 페이지로 이뤄진다. 테이블 b-tree 는 64비트 정수 키(rowid)를 쓰고 데이터를 리프에 두며, 인덱스 b-tree 는 임의 키를 저장한다.

> 참고: CLRS 4판 18장 "B-Trees". Bayer & McCreight, "Organization and Maintenance of Large Ordered Indexes", Acta Informatica 1(3), 1972.

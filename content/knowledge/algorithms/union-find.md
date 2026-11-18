---
title: 유니온 파인드 (서로소 집합)
aka: [Union-Find, Disjoint Set Union, DSU, Disjoint-set Forest, 서로소 집합, 분리 집합]
category: algorithms
group: data-structure
level: intermediate
summary: 원소들을 겹치지 않는 그룹으로 나누고 "두 원소가 같은 그룹인가"와 "두 그룹 합치기"를 거의 상수 시간에 처리하는 자료구조. 연결 요소, 크루스칼 MST, 중복 묶기에 쓴다.
tags: [union-find, dsu, connectivity, kruskal, amortized]
related: [algorithms/graph-representation, algorithms/greedy, algorithms/amortized-analysis, algorithms/bfs-dfs, algorithms/minimum-spanning-tree, algorithms/articulation-points-bridges]
sources:
  - https://cp-algorithms.com/data_structures/disjoint_set_union.html
  - https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html
  - https://en.wikipedia.org/wiki/Disjoint-set_data_structure
updatedAt: 2026-11-18
---

## 문제

간선이 하나씩 추가되는 그래프에서 "지금 a 와 b 가 연결돼 있나?"를 계속 물어야 한다. 매번 BFS 를 돌리면 질의마다 O(V + E)다. 연결 관계가 **합쳐지기만 하고 끊어지지 않는다면** 훨씬 빠르게 답할 수 있다.

## 해법

각 그룹을 트리로, 루트를 그룹 대표로 둔다. `parent[x]` 배열 하나면 된다.

- `find(x)`: 부모를 따라 루트까지 올라간다.
- `union(a, b)`: 두 루트 중 하나를 다른 쪽 밑에 붙인다.

두 가지 최적화를 함께 써야 빠르다.

1. **경로 압축**: `find` 하며 지나간 노드를 모두 루트에 직접 붙인다.
2. **크기(또는 랭크) 기준 합치기**: 작은 트리를 큰 트리 밑에 붙여 높이가 커지지 않게 한다.

```ts
class DSU {
  private parent: Int32Array;
  private size: Int32Array;
  groups: number;

  constructor(n: number) {
    this.parent = new Int32Array(n).map((_, i) => i);
    this.size = new Int32Array(n).fill(1);
    this.groups = n;
  }

  find(x: number): number {
    let r = x;
    while (this.parent[r] !== r) r = this.parent[r];
    while (this.parent[x] !== r) { // 경로 압축 (반복문 버전: 재귀 깊이 문제 없음)
      const next = this.parent[x];
      this.parent[x] = r;
      x = next;
    }
    return r;
  }

  union(a: number, b: number): boolean {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false; // 이미 같은 그룹 → 사이클을 만드는 간선
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    this.groups--;
    return true;
  }

  same(a: number, b: number): boolean { return this.find(a) === this.find(b); }
}

// 크루스칼 MST: 간선을 가중치 순으로 보며 사이클이 안 생기면 채택
function kruskal(n: number, edges: Array<[number, number, number]>): number {
  const dsu = new DSU(n);
  let total = 0;
  for (const [u, v, w] of [...edges].sort((a, b) => a[2] - b[2])) {
    if (dsu.union(u, v)) total += w;
  }
  return total;
}
console.log(kruskal(4, [[0, 1, 1], [1, 2, 2], [0, 2, 3], [2, 3, 4]])); // 7
```

## 복잡도

| 구현 | find/union 1회 |
| --- | --- |
| 최적화 없음 | 최악 O(n) |
| 크기·랭크 기준 합치기만 | O(log n) |
| 경로 압축만 | 평균 O(log n) |
| **둘 다** | 상각 O(α(n)) |

α 는 역 아커만 함수로, 현실적인 모든 n 에서 4 이하다. Tarjan(1975)이 이 상한을 증명했고, Fredman·Saks(1989)가 어떤 알고리즘도 이보다 나을 수 없음을 보였다. 공간은 O(n).

## 언제 쓰나

- 간선이 추가만 되는 동적 연결성 질의.
- [크루스칼](/develop-wiki/knowledge/algorithms/greedy/) 최소 신장 트리, 무방향 그래프 사이클 검출.
- 이미지의 연결 영역 라벨링, 격자 퍼콜레이션.
- "A=B, B=C 이면 A=C" 식의 동치 관계 병합: 계정 병합(같은 이메일·전화번호), 중복 레코드 클러스터링, 타입 추론의 단일화(unification).

## 주의

- **분리(split)·삭제는 지원하지 않는다.** 간선 삭제가 있으면 오프라인 기법(시간 역순 처리)이나 다른 구조가 필요하다.
- 그룹 원소 목록이 필요하면 따로 관리해야 한다(루트별 리스트를 작은 쪽→큰 쪽으로 합치기).
- 원소가 문자열이면 정수 ID 매핑(`Map<string, number>`)을 먼저 만든다.
- 재귀 `find` 는 압축 전 긴 사슬에서 스택 오버플로가 날 수 있다. 위처럼 반복문으로 쓴다.
- 일회성 연결 요소 계산이면 BFS/DFS 한 번이 더 단순하다 → [BFS·DFS](/develop-wiki/knowledge/algorithms/bfs-dfs/).

## 실무에서

- 엔터티 해석(entity resolution): 같은 사람으로 보이는 레코드 쌍을 찾은 뒤 유니온 파인드로 클러스터를 만든다.
- 네트워크 설계·클러스터링에서 MST 계산(크루스칼).
- 컴파일러의 타입 추론(Hindley-Milner 단일화)과 레지스터 할당의 변수 병합(coalescing)에 같은 구조가 쓰인다.

> 참고: CLRS 4판 19장 "Data Structures for Disjoint Sets". R. E. Tarjan, "Efficiency of a Good But Not Linear Set Union Algorithm", JACM 1975.

---
title: 그래프 표현 (인접 리스트·인접 행렬·간선 리스트)
aka: [Graph Representation, Adjacency List, Adjacency Matrix, Edge List, CSR, 인접 리스트, 인접 행렬]
category: algorithms
group: data-structure
level: beginner
summary: 정점과 간선을 메모리에 담는 세 가지 방법. 희소 그래프는 인접 리스트, 조밀하거나 간선 존재 확인이 잦으면 인접 행렬, 간선 단위 처리는 간선 리스트가 맞다.
tags: [graph, adjacency-list, adjacency-matrix, csr]
related: [algorithms/bfs-dfs, algorithms/shortest-path, algorithms/topological-sort, algorithms/union-find, algorithms/array-dynamic-array, algorithms/minimum-spanning-tree, algorithms/strongly-connected-components]
sources:
  - https://en.wikipedia.org/wiki/Adjacency_list
  - https://en.wikipedia.org/wiki/Adjacency_matrix
  - https://en.wikipedia.org/wiki/Sparse_matrix
  - https://cp-algorithms.com/graph/breadth-first-search.html
updatedAt: 2026-11-18
---

## 개념

그래프 G = (V, E). 방향/무방향, 가중치 유무, 자기 루프·중복 간선 허용 여부를 먼저 정한다. 같은 그래프라도 **어떤 질의를 자주 하느냐**에 따라 저장 방식이 달라진다.

## 비교 (V = 정점 수, E = 간선 수, deg(u) = u 의 차수)

| | 인접 리스트 | 인접 행렬 | 간선 리스트 |
| --- | --- | --- | --- |
| 공간 | O(V + E) | O(V²) | O(E) |
| 간선 (u,v) 존재 확인 | O(deg(u)) | **O(1)** | O(E) |
| u 의 이웃 순회 | **O(deg(u))** | O(V) | O(E) |
| 간선 추가 | O(1) | O(1) | O(1) |
| 전체 순회(BFS/DFS) | **O(V + E)** | O(V²) | 부적합 |
| 어울리는 곳 | 희소 그래프(대부분의 실제 그래프) | 조밀 그래프, V ≤ 수천, 플로이드-워셜 | 크루스칼, 벨만-포드, 입출력 포맷 |

실세계 그래프(소셜, 도로, 의존성, 웹 링크)는 대부분 E ≪ V² 인 **희소 그래프**라 인접 리스트가 기본이다. V = 10⁶ 이면 인접 행렬은 10¹² 칸이라 불가능하다.

## 구현

```ts
type Edge = { from: number; to: number; w: number };

// 간선 리스트 → 인접 리스트
function toAdjList(n: number, edges: readonly Edge[], directed = true): Array<Array<[number, number]>> {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  for (const { from, to, w } of edges) {
    adj[from].push([to, w]);
    if (!directed) adj[to].push([from, w]);
  }
  return adj;
}

// 인접 행렬: 가중치 없음 → Infinity
function toMatrix(n: number, edges: readonly Edge[]): number[][] {
  const m = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const { from, to, w } of edges) m[from][to] = Math.min(m[from][to], w);
  return m;
}

// CSR(Compressed Sparse Row): 이웃을 하나의 연속 배열에. 정적 그래프에 메모리·캐시 효율 최고
function toCsr(n: number, edges: readonly Edge[]): { offset: Int32Array; target: Int32Array } {
  const offset = new Int32Array(n + 1);
  for (const e of edges) offset[e.from + 1]++;
  for (let i = 0; i < n; i++) offset[i + 1] += offset[i];
  const target = new Int32Array(edges.length);
  const cursor = offset.slice(0, n);
  for (const e of edges) target[cursor[e.from]++] = e.to;
  return { offset, target }; // u 의 이웃 = target[offset[u] .. offset[u+1])
}

const edges: Edge[] = [{ from: 0, to: 1, w: 4 }, { from: 0, to: 2, w: 1 }, { from: 2, to: 1, w: 2 }];
console.log(toAdjList(3, edges)[0], toCsr(3, edges).offset); // [[1,4],[2,1]] Int32Array [0,2,2,3]
```

정점이 문자열(사용자 ID, 패키지 이름)이면 `Map<string, string[]>` 로 바로 쓰거나, 정수 인덱스로 매핑한 뒤 배열을 쓰는 편이 빠르다.

## 언제 쓰나

- 인접 리스트: 기본값. BFS/DFS, 다익스트라, 위상 정렬.
- 인접 행렬: V 가 작고 조밀하거나, "u 와 v 가 연결됐나"를 대량으로 물을 때, 행렬 연산(전이 폐포, 플로이드-워셜)을 쓸 때.
- 간선 리스트: 간선을 가중치 순으로 정렬해 처리(크루스칼), 모든 간선을 반복 완화(벨만-포드), 파일 저장.
- CSR: 그래프가 거의 안 바뀌고 매우 클 때(그래프 분석, 추천 시스템).

## 주의

- 무방향 그래프를 인접 리스트로 담으면 간선이 양쪽에 두 번 들어간다. 간선 삭제 시 양쪽 모두 지워야 한다.
- 인접 리스트의 간선 존재 확인은 O(deg). 자주 필요하면 이웃을 `Set` 으로 두거나 정렬해 이분 탐색한다.
- 정점 ID 가 희소하거나 커다란 정수면 배열 인덱스로 바로 쓰지 말고 압축(좌표 압축)한다.
- 그래프가 메모리에 안 들어가면 그래프 DB(Neo4j)나 분산 그래프 처리(Pregel 계열)를 검토한다. 관계형 DB 에서는 간선 테이블 + 재귀 CTE 로 다룬다.

## 실무에서

- 빌드 도구·패키지 매니저의 의존성 그래프는 인접 리스트(맵)로 담고 [위상 정렬](/develop-wiki/knowledge/algorithms/topological-sort/)한다.
- 희소 행렬 포맷 CSR 은 SciPy `csr_matrix` 등 과학 계산 라이브러리와 그래프 분석 엔진의 표준 표현이다.
- 지도·내비게이션은 도로망을 가중치 인접 리스트로 담고 [최단 경로](/develop-wiki/knowledge/algorithms/shortest-path/)를 계산한다.

> 참고: CLRS 4판 20.1절 "Representations of graphs".

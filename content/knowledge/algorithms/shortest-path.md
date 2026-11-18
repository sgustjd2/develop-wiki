---
title: 최단 경로 (다익스트라·벨만-포드)
aka: [Shortest Path, Dijkstra's Algorithm, Bellman-Ford Algorithm, Floyd-Warshall, A*, 다익스트라, 벨만-포드]
category: algorithms
group: algorithm
level: intermediate
summary: 가중치 그래프에서 한 출발점으로부터 모든 정점까지의 최단 거리를 구하는 대표 알고리즘. 음수 간선이 없으면 다익스트라, 음수 간선이나 음수 사이클 검출이 필요하면 벨만-포드를 쓴다.
tags: [graph, shortest-path, dijkstra, bellman-ford, routing]
related: [algorithms/bfs-dfs, algorithms/heap-priority-queue, algorithms/graph-representation, algorithms/greedy, algorithms/dynamic-programming]
sources:
  - https://cp-algorithms.com/graph/dijkstra.html
  - https://cp-algorithms.com/graph/dijkstra_sparse.html
  - https://cp-algorithms.com/graph/bellman_ford.html
  - https://www.rfc-editor.org/rfc/rfc2453
  - https://www.rfc-editor.org/rfc/rfc2328
updatedAt: 2026-11-18
---

## 공통 개념: 완화(relaxation)

`dist[v] > dist[u] + w(u,v)` 이면 `dist[v]` 를 줄인다. 모든 최단 경로 알고리즘은 **어떤 순서로 완화하느냐**의 차이다.

## 비교

| 알고리즘 | 문제 | 음수 간선 | 시간 | 핵심 아이디어 |
| --- | --- | --- | --- | --- |
| BFS | 단일 출발, 무가중치 | - | O(V + E) | 층별 확장 |
| 다익스트라(배열) | 단일 출발 | **불가** | O(V² + E) | 확정 안 된 정점 중 최소를 매번 선형 탐색 |
| 다익스트라(이진 힙) | 단일 출발 | **불가** | O((V + E) log V) | 최소를 힙으로 (그리디) |
| 벨만-포드 | 단일 출발 | 가능, 음수 사이클 검출 | O(V·E) | 모든 간선 완화를 V−1 번 반복 (DP) |
| 플로이드-워셜 | 모든 쌍 | 가능 (음수 사이클 X) | O(V³) | 경유 정점을 하나씩 늘리는 DP |
| A* | 단일 출발 → 단일 도착 | 불가 | 휴리스틱에 따라 | 다익스트라 + 남은 거리 추정치 |

조밀 그래프(E ≈ V²)에서는 배열 다익스트라 O(V²)가 힙 버전보다 낫다(cp-algorithms).

## 다익스트라

음수가 없으면 **현재 가장 가까운 미확정 정점의 거리는 더 줄어들 수 없다.** 그래서 그 정점을 확정하고 이웃을 완화하는 그리디가 성립한다.

```ts
type WGraph = Array<Array<[to: number, w: number]>>;

// 힙 없이 쓰기 위해 간단한 이진 힙을 내장 (지연 삭제 방식)
function dijkstra(g: WGraph, src: number): number[] {
  const dist = new Array<number>(g.length).fill(Infinity);
  dist[src] = 0;
  const heap: Array<[number, number]> = [[0, src]]; // [거리, 정점]
  const push = (x: [number, number]) => {
    heap.push(x);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue; // 이미 더 짧은 거리로 확정됨 → 낡은 항목 건너뛰기
    for (const [v, w] of g[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        push([dist[v], v]);
      }
    }
  }
  return dist;
}

const g: WGraph = [[[1, 4], [2, 1]], [[3, 1]], [[1, 2], [3, 5]], []];
console.log(dijkstra(g, 0)); // [0, 3, 1, 4]
```

## 벨만-포드

최단 경로는 간선을 최대 V−1 개 쓴다. 모든 간선을 V−1 번 완화하면 충분하고, **V 번째에도 완화가 일어나면 음수 사이클**이 있다.

```ts
type E = [from: number, to: number, w: number];

function bellmanFord(n: number, edges: readonly E[], src: number): number[] | "negative-cycle" {
  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;
  for (let round = 0; round < n - 1; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; changed = true; }
    }
    if (!changed) break; // 조기 종료
  }
  for (const [u, v, w] of edges) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) return "negative-cycle";
  }
  return dist;
}
console.log(bellmanFord(3, [[0, 1, 4], [0, 2, 5], [2, 1, -3]], 0)); // [0, 2, 5]
```

## 언제 쓰나

- 다익스트라: 도로망·네트워크 지연·비용처럼 가중치가 0 이상인 대부분의 경우.
- 벨만-포드: 음수 가중치가 의미 있을 때(환율 차익 = 로그 환율의 음수 사이클 탐지), 분산 환경에서 이웃 정보만으로 계산할 때.
- A*: 지도·게임 길찾기처럼 목적지가 하나이고 좋은 추정치(직선 거리)가 있을 때.
- 플로이드-워셜: V 가 수백 이하이고 모든 쌍 거리가 필요할 때.

## 주의

- **다익스트라에 음수 간선을 넣으면 틀린 답을 조용히 낸다.** 예외가 나지 않으니 입력을 검증한다.
- 무한대 + 음수 같은 연산 오류를 막으려고 `dist[u] !== Infinity` 를 확인한다. 정수 언어에서는 `INF` 덧셈 오버플로도 주의한다.
- 힙에 같은 정점이 여러 번 들어간다(지연 삭제). `d > dist[u]` 확인을 빼면 느려진다.
- 실제 대규모 지도 서비스는 순수 다익스트라가 아니라 전처리 기반 기법(Contraction Hierarchies 등)을 쓴다. 그래프가 크면 라이브러리·엔진(OSRM, pgRouting)을 검토한다.

## 실무에서

- RIP(RFC 2453)는 벨만-포드(거리 벡터) 기반 라우팅 프로토콜이다. 홉 수 16 을 무한대로 두고, 오래된 경로가 서로를 광고하며 값이 천천히 오르는 count-to-infinity 문제를 split horizon 등으로 완화한다.
- OSPF(RFC 2328)는 링크 상태 프로토콜로, 각 라우터가 전체 토폴로지에서 자신을 루트로 한 최단 경로 트리를 계산한다(다익스트라 계열 SPF 계산).
- 내비게이션, 물류 배차, 네트워크 지연 기반 라우팅, 게임 AI 길찾기.

> 참고: CLRS 4판 22장 "Single-Source Shortest Paths", 23장 "All-Pairs Shortest Paths".

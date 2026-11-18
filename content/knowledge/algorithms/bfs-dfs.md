---
title: 너비 우선 탐색(BFS)과 깊이 우선 탐색(DFS)
aka: [Breadth-First Search, Depth-First Search, BFS, DFS, Graph Traversal, 그래프 순회]
category: algorithms
group: algorithm
level: beginner
summary: 그래프의 모든 도달 가능한 정점을 O(V+E)에 방문하는 두 기본 순회. BFS 는 가까운 순서로 퍼져 무가중치 최단 경로를 주고, DFS 는 끝까지 파고들어 사이클·위상 순서·연결 구조를 드러낸다.
tags: [graph, bfs, dfs, traversal, shortest-path]
related: [algorithms/graph-representation, algorithms/stack-queue-deque, algorithms/shortest-path, algorithms/topological-sort, algorithms/backtracking, algorithms/union-find]
sources:
  - https://cp-algorithms.com/graph/breadth-first-search.html
  - https://cp-algorithms.com/graph/depth-first-search.html
  - https://en.wikipedia.org/wiki/Breadth-first_search
  - https://en.wikipedia.org/wiki/Depth-first_search
updatedAt: 2026-11-18
---

## 개념

둘 다 "방문 표시 + 다음에 볼 정점 목록"으로 이뤄진다. 차이는 그 목록이 **큐냐 스택이냐**다.

| | BFS | DFS |
| --- | --- | --- |
| 목록 | 큐 (FIFO) | 스택 (LIFO) 또는 재귀 |
| 방문 순서 | 시작점에서 거리 0, 1, 2… 층별로 | 한 경로를 끝까지 간 뒤 되돌아옴 |
| 시간 | O(V + E) | O(V + E) |
| 공간 | O(V), 넓은 그래프에서 한 층이 클 수 있음 | O(V), 깊은 그래프에서 스택이 깊어짐 |
| 대표 용도 | 무가중치 최단 경로, 최소 단계 수, 레벨 순회 | 사이클 검출, 위상 정렬, 강한 연결 요소, 단절점·다리, 미로 생성 |

(인접 리스트 기준. 인접 행렬이면 O(V²) → [그래프 표현](/develop-wiki/knowledge/algorithms/graph-representation/))

## 구현

```ts
type Graph = number[][]; // 인접 리스트

// BFS: 시작점에서 각 정점까지의 최소 간선 수와 경로 복원용 부모
function bfs(g: Graph, src: number): { dist: number[]; parent: number[] } {
  const dist = new Array<number>(g.length).fill(-1);
  const parent = new Array<number>(g.length).fill(-1);
  const queue = [src];
  dist[src] = 0;
  for (let head = 0; head < queue.length; head++) { // shift() 대신 인덱스로 O(1) dequeue
    const u = queue[head];
    for (const v of g[u]) {
      if (dist[v] !== -1) continue;
      dist[v] = dist[u] + 1; // 큐에 넣을 때 방문 표시 → 중복 삽입 방지
      parent[v] = u;
      queue.push(v);
    }
  }
  return { dist, parent };
}

function pathTo(parent: readonly number[], target: number): number[] {
  const path: number[] = [];
  for (let v = target; v !== -1; v = parent[v]) path.push(v);
  return path.reverse();
}

// DFS (반복문): 방향 그래프 사이클 검출. 0=미방문 1=진행 중 2=완료
function hasCycle(g: Graph): boolean {
  const state = new Uint8Array(g.length);
  for (let s = 0; s < g.length; s++) {
    if (state[s]) continue;
    const stack: Array<[number, number]> = [[s, 0]]; // [정점, 다음에 볼 이웃 인덱스]
    state[s] = 1;
    while (stack.length) {
      const top = stack[stack.length - 1];
      const [u, i] = top;
      if (i < g[u].length) {
        top[1]++;
        const v = g[u][i];
        if (state[v] === 1) return true; // 진행 중인 정점으로 되돌아감 = 뒤 간선
        if (state[v] === 0) { state[v] = 1; stack.push([v, 0]); }
      } else {
        state[u] = 2;
        stack.pop();
      }
    }
  }
  return false;
}

const g: Graph = [[1, 2], [3], [3], []];
console.log(bfs(g, 0).dist, pathTo(bfs(g, 0).parent, 3), hasCycle(g)); // [0,1,1,2] [0,1,3] false
```

격자(2차원 맵)는 정점을 `(r, c)`, 간선을 상하좌우 이동으로 보면 같은 코드가 된다.

## 변형

- **0-1 BFS**: 가중치가 0 또는 1 이면 덱을 써서 0 간선은 앞에, 1 간선은 뒤에 넣는다. 다익스트라 없이 O(V + E).
- **다중 시작점 BFS**: 여러 출발점을 처음에 모두 큐에 넣으면 "가장 가까운 출발점까지 거리"가 한 번에 나온다(가장 가까운 매장, 불 번짐).
- **양방향 BFS**: 출발·도착 양쪽에서 동시에 넓혀 만나는 지점을 찾는다. 분기가 큰 그래프에서 탐색량이 크게 준다.
- **반복 깊이 심화(IDDFS)**: 깊이 제한을 늘려 가며 DFS. BFS 의 최단성 + DFS 의 적은 메모리.

## 언제 쓰나

- BFS: "최소 몇 번 만에", 무가중치 최단 경로, 소셜 그래프의 n촌 관계, 연결 요소.
- DFS: 모든 경로·조합 탐색([백트래킹](/develop-wiki/knowledge/algorithms/backtracking/)), 의존성 사이클 검출, [위상 정렬](/develop-wiki/knowledge/algorithms/topological-sort/), 트리 순회(전위·중위·후위).

## 주의

- **방문 표시를 빠뜨리면** 사이클이 있는 그래프에서 무한 루프가 된다. BFS 는 "꺼낼 때"가 아니라 "넣을 때" 표시해야 같은 정점이 큐에 여러 번 들어가지 않는다.
- **재귀 DFS 의 스택 오버플로**: 정점이 수만 개 이상 일렬로 이어지면 JS·Python 기본 스택을 넘는다. 위처럼 명시적 스택으로 쓴다.
- JS `array.shift()` 를 큐로 쓰면 O(n)이 될 수 있다. 인덱스 포인터나 [덱](/develop-wiki/knowledge/algorithms/stack-queue-deque/)을 쓴다.
- 가중치가 있으면 BFS 거리는 최단 거리가 아니다 → [최단 경로](/develop-wiki/knowledge/algorithms/shortest-path/).
- 무방향 그래프 사이클 검출에서는 "바로 직전 부모로 가는 간선"을 사이클로 오인하지 않게 한다(또는 [유니온 파인드](/develop-wiki/knowledge/algorithms/union-find/)).

## 실무에서

- 웹 크롤러는 BFS 로 링크를 따라가며 방문 URL 집합(대규모면 [블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/))을 유지한다.
- 추적형 가비지 컬렉터의 마킹 단계는 루트에서 도달 가능한 객체 그래프를 순회한다(구현에 따라 BFS/DFS 혼합).
- 패키지 매니저·빌드 도구는 DFS 로 의존성 사이클을 찾아 오류를 낸다. 소셜 서비스의 "알 수도 있는 사람"은 2~3단계 BFS 이웃을 후보로 쓴다.

> 참고: CLRS 4판 20.2절 BFS, 20.3절 DFS.

---
title: 단절점과 다리
aka: [Articulation Points, Cut Vertex, Bridges, Cut Edge, Biconnected Components, 2-Edge-Connected, Low-Link, Block-Cut Tree]
category: algorithms
group: algorithm
level: advanced
summary: 무향 그래프에서 없애면 연결이 끊기는 정점(단절점)과 간선(다리)을 DFS 한 번과 low 값으로 O(V+E)에 찾는 알고리즘. 네트워크의 단일 장애점 진단에 쓴다.
tags: [graph, dfs, articulation-point, bridge, low-link, biconnected, connectivity]
related: [algorithms/bfs-dfs, algorithms/graph-representation, algorithms/strongly-connected-components, algorithms/union-find, algorithms/minimum-spanning-tree, algorithms/stack-queue-deque]
sources:
  - https://cp-algorithms.com/graph/bridge-searching.html
  - https://cp-algorithms.com/graph/cutpoints.html
  - https://en.wikipedia.org/wiki/Biconnected_component
  - https://en.wikipedia.org/wiki/Bridge_(graph_theory)
updatedAt: 2026-11-19
---

## 문제

서버와 링크로 이뤄진 네트워크에서 "이 장비 하나(또는 링크 하나)가 죽으면 망이 둘로 쪼개지는가"를 알고 싶다.

- **단절점(articulation point, cut vertex)**: 제거하면 연결 요소 수가 늘어나는 정점.
- **다리(bridge, cut edge)**: 제거하면 연결 요소 수가 늘어나는 간선. 같은 말로 "어떤 사이클에도 속하지 않는 간선"이다(Wikipedia).

각 후보를 하나씩 빼고 연결성을 검사하면 O(V·(V+E)) 다. DFS 한 번이면 선형으로 끝난다. 이는 [강한 연결 요소](/develop-wiki/knowledge/algorithms/strongly-connected-components/)의 Tarjan 과 같은 계열의 low-link 기법이지만 **무향 그래프용**이라 조건이 다르다.

## 해법: tin 과 low

DFS 로 그래프를 훑으며 각 정점에 두 값을 기록한다.

- `tin[v]`: DFS 가 v 에 처음 들어간 시각.
- `low[v]`: v 의 DFS 서브트리에서, **되돌아가는 간선(back edge) 한 개**를 써서 닿을 수 있는 가장 작은 `tin`. 즉 `min(tin[v], 되돌아가는 간선 대상의 tin, 자식들의 low)`.

DFS 트리의 간선 `(v, to)` 에 대해:

| 판정 | 조건 | 뜻 |
| --- | --- | --- |
| **다리** | `low[to] > tin[v]` | `to` 서브트리가 v 이하로 못 올라간다 → 이 간선이 유일한 연결 |
| **단절점** (루트 아님) | `low[to] >= tin[v]` 인 자식이 하나라도 있음 | `to` 서브트리가 v 를 거치지 않고는 위로 못 간다 |
| **단절점** (루트) | DFS 자식이 **2개 이상** | 루트를 빼면 자식 서브트리들이 서로 끊긴다 |

다리는 `>` 이고 단절점은 `>=` 인 것이 핵심 차이다. 다리는 "v 에도 못 닿음", 단절점은 "v 에는 닿지만 v 위로는 못 감"까지 포함한다.

```ts
type Edge = [number, number];

function findBridgesAndCutVertices(n: number, edges: Edge[]): { bridges: Edge[]; cutVertices: number[] } {
  const adj: { to: number; id: number }[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push({ to: v, id }); adj[v].push({ to: u, id }); });
  const tin = new Array<number>(n).fill(-1), low = new Array<number>(n).fill(0);
  const bridges: Edge[] = []; const isCut = new Array<boolean>(n).fill(false);
  let timer = 0;

  function dfs(v: number, parentEdge: number): void {
    tin[v] = low[v] = timer++;
    let children = 0;
    for (const { to, id } of adj[v]) {
      if (id === parentEdge) continue;            // 부모로 돌아가는 "그 간선"만 건너뛴다
      if (tin[to] !== -1) { low[v] = Math.min(low[v], tin[to]); continue; } // 되돌아가는 간선
      dfs(to, id);
      low[v] = Math.min(low[v], low[to]);
      if (low[to] > tin[v]) bridges.push(edges[id]);                 // 다리
      if (low[to] >= tin[v] && parentEdge !== -1) isCut[v] = true;   // 단절점(루트 아님)
      children++;
    }
    if (parentEdge === -1 && children > 1) isCut[v] = true;           // 루트
  }
  for (let v = 0; v < n; v++) if (tin[v] === -1) dfs(v, -1);
  return { bridges, cutVertices: isCut.flatMap((c, v) => (c ? [v] : [])) };
}
```

실행 결과(`tsc --strict` 컴파일 후):

| 입력 | 결과 |
| --- | --- |
| 삼각형 0-1-2, 간선 2-3, 삼각형 3-4-5, 간선 3-6 | 다리 `[3,6]`, `[2,3]` / 단절점 2, 3 |
| 평행 간선 0=1 (두 줄) + 1-2 | 다리 `[1,2]` 만 / 단절점 1 |

다리의 끝점은 차수가 2 이상이면 단절점이다(그 정점을 빼면 다리 반대편이 떨어져 나간다). 끝점의 차수가 1 이면(잎) 단절점이 아니다(위 예에서 정점 6). 반대로 단절점이 다리 없이도 존재할 수 있다(사이클 두 개가 한 정점을 공유하는 경우).

## 이중 연결 요소와 블록-컷 트리

- **이중 연결 요소(biconnected component, block)**: 정점 하나를 빼도 연결이 유지되는 최대 부분 그래프. 블록은 **간선을 분할**하지만 정점은 공유할 수 있고, 공유되는 정점이 단절점이다(Wikipedia).
- **2-간선 연결 요소**: 다리를 모두 지웠을 때 남는 연결 요소. 다리를 한 번 찾은 뒤 union-find 나 BFS 로 묶는다.
- 블록과 단절점을 노드로 하는 **블록-컷 트리**를 만들면 "두 정점 사이 모든 경로가 거치는 정점"이 트리 위 경로 질의가 된다.
- Hopcroft–Tarjan(1973)이 선형 시간 이중 연결 알고리즘을, Tarjan(1974)이 선형 다리 탐색을 제시했다(Wikipedia). 사슬 분해(Schmidt) 같은 DFS 외 방법도 있다.

## 복잡도

시간 O(V+E), 공간 O(V+E). 정점·간선 수에 비례하는 한 번의 순회다.

## 언제 쓰나

- **네트워크·인프라 신뢰성**: 단일 장애점(SPOF) 장비·링크 찾기, 중복 경로 추가 우선순위 결정.
- **도로·배관·전력망**의 취약 지점 분석.
- **의존성 그래프**에서 "이 모듈을 빼면 서브시스템이 분리되는가".
- 그래프 문제 전처리: 이중 연결 요소 단위로 쪼개 풀기, 2-간선 연결 요소로 압축한 뒤 트리 문제로 바꾸기.

## 주의

- **평행 간선(다중 간선)**: 부모로 가는 간선을 "정점 번호"로 건너뛰면 평행 간선이 있을 때 다리를 잘못 판정한다. 위 코드처럼 **간선 id** 로 건너뛴다. cp-algorithms 도 이 점을 구현 주의로 짚는다.
- **재귀 깊이**: 100,000 정점짜리 경로 그래프에서 위 재귀 구현은 Node 기본 스택에서 `RangeError` 로 실패했다. 큰 입력에는 명시적 스택으로 바꾼 반복형 DFS 를 쓴다(예: `{정점, 간선 반복자 위치}` 를 스택에 둔다).
- **방향 그래프에 쓰지 않는다.** 방향 그래프의 연결성은 [SCC](/develop-wiki/knowledge/algorithms/strongly-connected-components/) 와 지배자 트리(dominator tree) 영역이다.
- **연결되지 않은 그래프**는 모든 정점에서 DFS 를 시작해 각 요소를 따로 처리한다(위 코드 `for` 루프).
- `low` 갱신에 자식의 `low` 를 쓰는지 이웃의 `tin` 을 쓰는지가 용도마다 다르다. 위 판정식은 되돌아가는 간선에는 `tin`, 트리 간선에는 `low` 를 쓰는 표준형이다.
- **동적 그래프**(간선이 계속 추가)에서는 매번 다시 계산하지 않고 온라인 다리 유지 알고리즘을 쓴다(cp-algorithms 에 별도 문서가 있다).

## 실무에서

- 그래프 라이브러리가 기본 제공한다(NetworkX 의 `articulation_points`, `bridges`, Boost Graph Library 의 `biconnected_components` 등).
- 네트워크 토폴로지 점검, 인프라 의존성 위험 분석, 지도 데이터 검증 도구에서 "끊기면 안 되는 지점"을 자동으로 찾는 용도로 쓴다.

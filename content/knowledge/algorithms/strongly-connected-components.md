---
title: 강한 연결 요소 (Tarjan·Kosaraju)
aka: [Strongly Connected Components, SCC, 강연결 요소, Tarjan's Algorithm, Kosaraju's Algorithm, Condensation Graph, 응축 그래프]
category: algorithms
group: algorithm
level: advanced
summary: 방향 그래프에서 서로가 서로에게 도달 가능한 정점들의 최대 묶음. DFS 한 번의 Tarjan, DFS 두 번의 Kosaraju 로 선형 시간에 찾고, 묶음을 점 하나로 줄이면 사이클 없는 DAG 가 된다.
tags: [graph, scc, dfs, tarjan, kosaraju, dag, cycle-detection]
related: [algorithms/bfs-dfs, algorithms/topological-sort, algorithms/graph-representation, algorithms/union-find, algorithms/stack-queue-deque, algorithms/dynamic-programming]
sources:
  - https://en.wikipedia.org/wiki/Strongly_connected_component
  - https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
  - https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
updatedAt: 2026-11-18
---

## 문제

- 모듈 의존성 그래프에 순환 import 가 있다. **어떤 모듈들이 한 덩어리로 얽혀 있는지** 알아야 쪼갤 수 있다.
- 빌드 순서를 정하려고 [위상 정렬](/develop-wiki/knowledge/algorithms/topological-sort/)을 하고 싶은데, 그래프에 사이클이 있으면 위상 정렬이 정의되지 않는다.
- 웹 페이지 링크, SNS 팔로우 관계에서 "서로 오갈 수 있는 무리"를 찾고 싶다.

무향 그래프라면 [BFS/DFS](/develop-wiki/knowledge/algorithms/bfs-dfs/)나 [유니온 파인드](/develop-wiki/knowledge/algorithms/union-find/)로 연결 요소를 바로 구한다. 방향 그래프에서는 "u 에서 v 로 갈 수 있다"와 "v 에서 u 로 갈 수 있다"가 다르므로 둘 다 성립하는 묶음을 찾아야 한다.

## 정의

- 방향 그래프의 **강한 연결 요소(SCC)**: 안의 모든 정점 쌍 (u, v)에 대해 u → v, v → u 경로가 모두 있는 **최대** 정점 집합.
- 모든 정점은 정확히 하나의 SCC 에 속한다. 자기 루프 없는 단독 정점도 크기 1짜리 SCC 다.
- 각 SCC 를 정점 하나로 줄인 그래프를 **응축 그래프(condensation)**라고 하며, 항상 **DAG** 다. 그래서 "SCC 로 줄이고 → 위상 정렬 → DAG 위에서 DP" 가 방향 그래프 문제의 표준 흐름이다.
- 방향 그래프가 사이클이 없다는 것은 크기 2 이상인 SCC 가 없다는 것과 같다.

## Tarjan 알고리즘 (DFS 1회)

Robert Tarjan 이 1972년에 발표했다.

- DFS 로 방문한 순서대로 정점에 번호 `index` 를 매긴다.
- `low[v]`: v 의 DFS 서브트리에서 출발해 닿을 수 있는, **아직 스택에 남아 있는** 정점의 가장 작은 `index`.
- 방문한 정점을 별도 스택에 쌓고, DFS 가 끝나도 바로 빼지 않는다.
- v 의 처리가 끝났을 때 `low[v] === index[v]` 이면 v 가 SCC 의 **뿌리**다. 스택에서 v 가 나올 때까지 꺼낸 정점들이 하나의 SCC 다.
- 이미 다른 SCC 로 확정돼 스택에서 빠진 정점으로 가는 간선은 무시한다(`onStack` 검사). 그 정점은 v 로 돌아올 수 없기 때문이다.
- SCC 는 **역위상 순서**로 나온다. 어떤 SCC 가 출력될 때 그 SCC 에서 갈 수 있는 SCC 는 이미 모두 출력돼 있다.

## Kosaraju 알고리즘 (DFS 2회)

S. Rao Kosaraju 가 1978년에 제안했고(미출판) Micha Sharir 가 1981년에 발표했다.

1. 원래 그래프에서 DFS 를 돌며 정점을 **종료 순서**(후위 순서)로 기록한다.
2. 모든 간선을 뒤집은 **전치 그래프**를 만든다.
3. 종료 순서의 **역순**으로 정점을 꺼내, 아직 배정 안 된 정점이면 전치 그래프에서 DFS 한다. 이번에 닿는 정점들이 정확히 하나의 SCC 다.

직관: 가장 늦게 끝난 정점은 응축 DAG 의 "원천" SCC 에 있다. 간선을 뒤집으면 그 SCC 에서는 밖으로 나갈 수 없으므로 DFS 가 자기 SCC 안에 갇힌다.

```ts
// Tarjan: DFS 한 번. low[v] = v 에서 닿을 수 있는, 아직 스택에 있는 정점의 최소 index
function tarjan(adj: readonly number[][]): number[][] {
  const n = adj.length;
  const index = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(0);
  const onStack = new Array<boolean>(n).fill(false);
  const stack: number[] = [];
  const out: number[][] = [];
  let counter = 0;

  const dfs = (v: number): void => {
    index[v] = low[v] = counter++;
    stack.push(v);
    onStack[v] = true;
    for (const w of adj[v]) {
      if (index[w] === -1) { dfs(w); low[v] = Math.min(low[v], low[w]); }
      else if (onStack[w]) low[v] = Math.min(low[v], index[w]); // 뒤로 가는 간선
    }
    if (low[v] === index[v]) { // v 가 SCC 의 뿌리 → 스택에서 v 까지 꺼낸다
      const comp: number[] = [];
      let w: number;
      do { w = stack.pop()!; onStack[w] = false; comp.push(w); } while (w !== v);
      out.push(comp);
    }
  };
  for (let v = 0; v < n; v++) if (index[v] === -1) dfs(v);
  return out; // 응축 DAG 의 역위상 순서
}

// Kosaraju: 정방향 DFS 로 종료 순서를 얻고, 전치 그래프에서 그 역순으로 DFS
function kosaraju(adj: readonly number[][]): number[][] {
  const n = adj.length;
  const radj: number[][] = Array.from({ length: n }, () => []);
  adj.forEach((ws, v) => ws.forEach((w) => radj[w].push(v)));

  const seen = new Array<boolean>(n).fill(false);
  const order: number[] = [];
  const dfs1 = (v: number): void => {
    seen[v] = true;
    for (const w of adj[v]) if (!seen[w]) dfs1(w);
    order.push(v); // 후위(종료) 순서
  };
  for (let v = 0; v < n; v++) if (!seen[v]) dfs1(v);

  const assigned = new Array<boolean>(n).fill(false);
  const out: number[][] = [];
  const dfs2 = (v: number, comp: number[]): void => {
    assigned[v] = true;
    comp.push(v);
    for (const w of radj[v]) if (!assigned[w]) dfs2(w, comp);
  };
  for (let i = n - 1; i >= 0; i--) {
    const v = order[i];
    if (!assigned[v]) { const comp: number[] = []; dfs2(v, comp); out.push(comp); }
  }
  return out; // 응축 DAG 의 위상 순서
}

// 0→1→2→0 순환, 2→3, 3→4→3 순환, 5 는 혼자
const g = [[1], [2], [0, 3], [4], [3], [4]];
console.log(tarjan(g));   // [[4,3],[2,1,0],[5]]
console.log(kosaraju(g)); // [[5],[0,2,1],[3,4]]
```

두 결과는 같은 SCC 들({0,1,2}, {3,4}, {5})을 반대 순서로 낸다.

## 비교

| | Tarjan | Kosaraju | 경로 기반(Dijkstra 1976 등) |
| --- | --- | --- | --- |
| DFS 횟수 | 1 | 2 (정방향 + 전치) | 1 |
| 추가 메모리 | index·low·onStack 배열 + 스택 | **전치 그래프** + 종료 순서 배열 | 스택 2개 + 번호 배열 |
| 출력 순서 | 역위상 순서 | 위상 순서 | 역위상 순서 |
| 이해하기 | low 값 개념이 까다로움 | 가장 직관적 | 중간 |
| 실무 속도 | 대개 더 빠름 | 그래프를 두 번 훑어 느린 편 | Tarjan 과 비슷 |

- 세 방법 모두 인접 리스트에서 **Θ(V + E)** 다. 인접 행렬이면 O(V²).
- Wikipedia 는 Kosaraju 를 가장 단순한 효율적 알고리즘으로 소개하면서, 실제로는 Tarjan 보다 덜 효율적이라고 설명한다.
- 응축 DAG 를 위상 순서로 처리할 일이 있으면 Kosaraju 출력, 역순으로 처리할 일(의존 대상을 먼저)이면 Tarjan 출력을 그대로 쓰면 된다.

## 언제 쓰나

- **순환 의존성 탐지**: 모듈·패키지·마이크로서비스 호출 그래프에서 크기 2 이상인 SCC 가 곧 순환 덩어리다. 빌드 도구·번들러·린터가 순환 import 를 보고할 때 같은 분석을 한다.
- **방향 그래프를 DAG 로 바꾸기**: SCC 응축 후 위상 정렬, DAG 위의 [동적 계획법](/develop-wiki/knowledge/algorithms/dynamic-programming/)(최장 경로, 도달 가능성 개수).
- **2-SAT**: 각 변수 x 와 ¬x 를 정점으로 하는 함의 그래프를 만들고, 어떤 변수와 그 부정이 **같은 SCC** 에 있으면 만족 불가능하다(Aspvall·Plass·Tarjan, 1979). 아니면 선형 시간에 해도 구할 수 있다.
- 데드락 분석(자원 대기 그래프의 사이클), 상태 기계에서 빠져나올 수 없는 상태 묶음 찾기, 웹 그래프 구조 분석.

## 주의

- **재귀 깊이**: 두 알고리즘 모두 재귀 DFS 로 쓰면, 긴 체인 그래프(정점 수십만 개)에서 JavaScript 호출 스택이 넘친다. 큰 입력에서는 명시적 스택으로 바꾼 반복문 버전을 쓴다. Tarjan 의 반복문 버전은 "다음에 볼 이웃 인덱스"를 정점마다 저장해야 해서 조금 번거롭다.
- Tarjan 에서 `onStack` 검사를 빠뜨리면, 이미 끝난 SCC 의 정점이 `low` 를 끌어내려 SCC 가 잘못 합쳐진다. 가장 흔한 버그다.
- `low` 갱신에 이웃의 `index` 를 쓸지 `low` 를 쓸지 구현마다 다르다. Wikipedia 에 따르면 뿌리 판정은 두 방식 모두 올바르게 되지만, `low` 의 의미가 달라지므로 다른 용도(단절점·다리 찾기)로 재사용할 때는 주의한다.
- Kosaraju 는 전치 그래프 때문에 간선 메모리가 두 배다. 그래프가 메모리 한계에 가깝다면 Tarjan 이 낫다.
- 무향 그래프에는 쓸 필요가 없다. 무향 그래프의 "2-연결 요소·단절점·다리"는 비슷한 low-link 기법을 쓰지만 다른 알고리즘이다.

> 참고: R. Tarjan, "Depth-first search and linear graph algorithms", SIAM Journal on Computing 1(2), 1972. M. Sharir, "A strong-connectivity algorithm and its applications in data flow analysis", 1981. CLRS 4판 20.5절.

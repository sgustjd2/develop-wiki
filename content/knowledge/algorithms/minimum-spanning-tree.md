---
title: 최소 신장 트리 (Prim vs Kruskal)
aka: [Minimum Spanning Tree, MST, 최소 스패닝 트리, Prim's Algorithm, Kruskal's Algorithm, Borůvka]
category: algorithms
group: algorithm
level: intermediate
summary: 가중치 무향 그래프의 모든 정점을 사이클 없이 최소 총비용으로 잇는 트리. 간선을 정렬해 고르는 Kruskal 과 트리를 한 정점씩 키우는 Prim 이 대표 해법이며 둘 다 탐욕법이다.
tags: [graph, mst, greedy, union-find, priority-queue]
related: [algorithms/greedy, algorithms/union-find, algorithms/heap-priority-queue, algorithms/graph-representation, algorithms/shortest-path, algorithms/sorting-comparison, algorithms/p-np-approximation]
sources:
  - https://en.wikipedia.org/wiki/Minimum_spanning_tree
  - https://en.wikipedia.org/wiki/Kruskal%27s_algorithm
  - https://en.wikipedia.org/wiki/Prim%27s_algorithm
updatedAt: 2026-11-18
---

## 문제

도시 n 곳을 광케이블로 모두 연결해야 한다. 도시 쌍마다 공사비가 다르다. 모든 도시가 (직접이든 경유든) 연결되기만 하면 되고, 사이클은 돈 낭비다. **총공사비가 최소인 연결망**은? 이것이 최소 신장 트리(MST)다. 정점 n 개면 간선은 정확히 n−1 개다.

[최단 경로](/develop-wiki/knowledge/algorithms/shortest-path/)와 헷갈리기 쉽다. MST 는 **전체 연결 비용**을 최소화하고, 최단 경로는 **두 점 사이 거리**를 최소화한다. MST 위의 두 점 사이 경로가 최단 경로라는 보장은 없다.

## 왜 탐욕법이 통하나: 두 가지 성질

- **컷 성질**: 정점을 두 무리로 나눴을 때, 두 무리를 잇는 간선 중 **가장 가벼운** 것(유일하다면)은 반드시 어떤 MST 에 들어간다.
- **사이클 성질**: 어떤 사이클에서 **가장 무거운** 간선(유일하다면)은 어떤 MST 에도 들어가지 않는다.

모든 간선 가중치가 서로 다르면 MST 는 유일하다. Kruskal 과 Prim 은 컷 성질을 서로 다른 방식으로 반복 적용할 뿐이다 → [탐욕 알고리즘](/develop-wiki/knowledge/algorithms/greedy/).

## Kruskal: 간선 중심

1956년 Joseph Kruskal 이 발표했다.

1. 간선을 가중치 오름차순으로 정렬한다.
2. 가벼운 간선부터 보며, 두 끝점이 **이미 같은 트리에 있으면 건너뛰고**(넣으면 사이클), 아니면 채택해 두 트리를 합친다.
3. 간선 n−1 개를 채택하면 끝.

"같은 트리인가?"를 빠르게 답하는 것이 [유니온 파인드](/develop-wiki/knowledge/algorithms/union-find/)다.

## Prim: 정점 중심

1930년 Vojtěch Jarník 이 먼저 발견했고 1957년 Robert Prim, 1959년 Edsger Dijkstra 가 다시 발견했다(그래서 Jarník 알고리즘, DJP 알고리즘이라고도 부른다).

1. 아무 정점 하나로 트리를 시작한다.
2. 트리 안 정점과 트리 밖 정점을 잇는 간선 중 **가장 가벼운 것**으로 정점 하나를 붙인다.
3. 모든 정점이 들어올 때까지 반복.

모양이 [Dijkstra](/develop-wiki/knowledge/algorithms/shortest-path/)와 거의 같다. 차이는 우선순위 키다. Dijkstra 는 "시작점부터의 누적 거리", Prim 은 "트리까지의 간선 하나의 가중치"다.

```ts
type Edge = [u: number, v: number, w: number];

// Kruskal: 가벼운 간선부터, 사이클이 안 생기면 채택 (유니온 파인드로 판정)
function kruskal(n: number, edges: readonly Edge[]): Edge[] {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const tree: Edge[] = [];
  for (const e of [...edges].sort((a, b) => a[2] - b[2])) {
    const ru = find(e[0]), rv = find(e[1]);
    if (ru === rv) continue; // 이미 같은 트리 → 넣으면 사이클
    parent[ru] = rv;
    tree.push(e);
    if (tree.length === n - 1) break;
  }
  return tree; // 길이 < n-1 이면 그래프가 끊겨 있다(최소 신장 숲)
}

// Prim (인접 행렬, O(V²)): 트리에서 가장 싸게 닿는 정점을 하나씩 붙인다
function prim(w: readonly number[][]): number {
  const n = w.length;
  const inTree = new Array<boolean>(n).fill(false);
  const best = new Array<number>(n).fill(Infinity); // 트리까지의 최소 간선 가중치
  best[0] = 0;
  let total = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inTree[v] && (u === -1 || best[v] < best[u])) u = v;
    if (best[u] === Infinity) throw new Error('그래프가 연결돼 있지 않음');
    inTree[u] = true;
    total += best[u];
    for (let v = 0; v < n; v++) if (!inTree[v] && w[u][v] < best[v]) best[v] = w[u][v];
  }
  return total;
}

const edges: Edge[] = [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]];
const W = Array.from({ length: 5 }, () => new Array<number>(5).fill(Infinity));
for (const [u, v, w] of edges) { W[u][v] = w; W[v][u] = w; }

const t = kruskal(5, edges);
console.log(t, t.reduce((s, e) => s + e[2], 0)); // [[0,2,1],[1,2,2],[3,4,3],[1,3,5]] 11
console.log(prim(W));                              // 11
```

위 Prim 은 일부러 **인접 행렬 + 선형 탐색** 버전이다. 간선이 V² 에 가까운 조밀 그래프에서는 힙이 오히려 손해라 이 O(V²) 버전이 가장 빠르다. 희소 그래프에서는 인접 리스트 + [이진 힙](/develop-wiki/knowledge/algorithms/heap-priority-queue/)으로 바꾼다.

## 비교

| | Kruskal | Prim (이진 힙) | Prim (인접 행렬) | Borůvka |
| --- | --- | --- | --- | --- |
| 시간 | O(E log E) = O(E log V) | O(E log V) | O(V²) | O(E log V) |
| 지배 비용 | 간선 정렬 | 힙 연산 | 정점 선택 선형 탐색 | 단계마다 전체 간선 훑기 |
| 핵심 자료구조 | 유니온 파인드 | 우선순위 큐 | 배열 | 유니온 파인드 |
| 입력 형태 | **간선 리스트** | 인접 리스트 | 인접 행렬 | 간선 리스트 |
| 끊긴 그래프 | 최소 신장 **숲**을 자연히 만듦 | 연결 요소마다 따로 실행 필요 | 같음 | 숲을 만듦 |
| 잘 맞는 그래프 | 희소, 간선이 이미 정렬됨 | 희소~보통 | **조밀** | 병렬 처리 |
| 중간 결과 | 여러 조각(숲)이 점점 합쳐짐 | 항상 연결된 트리 하나 | 같음 | 숲 |

- 간선이 이미 정렬돼 있거나 정수 가중치라 선형 시간 정렬이 가능하면, Kruskal 은 유니온 파인드 비용인 O(E·α(V))만 남는다(α 는 역 아커만 함수, 사실상 상수).
- Fibonacci 힙을 쓴 Prim 은 O(E + V log V)로 조밀한 쪽에서 점근적으로 유리하지만, 상수가 커서 실무에서는 이진 힙이나 행렬 버전을 쓴다.
- Wikipedia 에 따르면 Kruskal 은 본질적으로 순차적이라 병렬화가 어렵다. 단계마다 모든 컴포넌트가 동시에 최소 간선을 고르는 **Borůvka**(1926)가 병렬·분산 환경에 맞고, 각 단계에서 컴포넌트 수가 최소 절반으로 준다.
- 이론적으로는 Karger–Klein–Tarjan 의 무작위 기대 선형 시간 알고리즘(1995), Chazelle 의 O(E·α(E,V)) 결정적 알고리즘이 있다. 실무 구현에서는 거의 쓰지 않는다.

## 언제 쓰나

- **네트워크 설계**: 통신망·전력망·배관·도로처럼 모든 지점을 최소 비용으로 연결하는 문제의 첫 근사.
- **군집화**: MST 를 만든 뒤 가장 무거운 간선 k−1 개를 끊으면 k 개 군집이 된다. 단일 연결(single-linkage) 계층적 군집화와 같은 결과다.
- **근사 알고리즘의 부품**: 메트릭 TSP 의 2-근사(MST 를 두 번 돌기), Christofides 1.5-근사의 첫 단계 → [P·NP 와 근사 알고리즘](/develop-wiki/knowledge/algorithms/p-np-approximation/).
- 이미지 분할, 상관관계 네트워크 요약 같은 응용도 Wikipedia 에 소개돼 있다.

## 주의

- **무향 그래프 전용**이다. 방향 그래프에서 같은 문제(최소 비용 신장 수형도)는 Chu–Liu/Edmonds 알고리즘이 따로 있다.
- 그래프가 끊겨 있으면 신장 트리가 없다. Kruskal 결과 간선 수가 n−1 보다 적은지, Prim 이 `Infinity` 를 만나는지 확인한다.
- 음수 가중치는 문제없다(Dijkstra 와 다르다). 비교만 하기 때문이다.
- "최대 신장 트리"는 가중치 부호를 뒤집거나 정렬을 내림차순으로 바꾸면 된다.
- 동점 가중치가 있으면 MST 가 여러 개일 수 있다. 결과를 테스트로 비교할 때는 간선 집합이 아니라 **총가중치**를 비교한다.
- 재귀 `find` 는 경로 압축이 적용되기 전 깊은 체인에서 스택이 깊어질 수 있다. 큰 입력에서는 반복문 버전이나 랭크 합치기를 함께 쓴다.

> 참고: CLRS 4판 21장 "Minimum Spanning Trees". J. B. Kruskal, "On the shortest spanning subtree of a graph and the traveling salesman problem", Proc. AMS, 1956. R. C. Prim, "Shortest connection networks and some generalizations", Bell System Technical Journal, 1957.

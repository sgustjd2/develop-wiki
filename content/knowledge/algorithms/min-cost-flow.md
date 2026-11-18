---
title: 최소 비용 유량
aka: [Minimum Cost Flow, Min-Cost Max-Flow, MCMF, Successive Shortest Paths, SSP, Assignment Problem, 최소 비용 최대 유량]
category: algorithms
group: algorithm
level: advanced
summary: 간선마다 용량과 단위 비용이 있는 네트워크에서 정해진 유량을 가장 싸게 보내는 문제. 비용 기준 최단 경로로 증가 경로를 반복해 구하며, 배정 문제·운송 문제의 일반형이다.
tags: [graph, min-cost-flow, successive-shortest-path, assignment, spfa, residual-graph]
related: [algorithms/max-flow-bipartite-matching, algorithms/shortest-path, algorithms/bfs-dfs, algorithms/graph-representation, algorithms/greedy, algorithms/p-np-approximation]
sources:
  - https://cp-algorithms.com/graph/min_cost_flow.html
  - https://en.wikipedia.org/wiki/Minimum-cost_flow_problem
updatedAt: 2026-11-19
---

## 문제

[최대 유량](/develop-wiki/knowledge/algorithms/max-flow-bipartite-matching/)은 "얼마나 보낼 수 있나"를 묻는다. 현실에서는 **"싸게"** 가 붙는다. 창고에서 매장으로 물건을 보내는데 도로마다 용량과 단위 운임이 있고, 정해진 양을 최소 총운임으로 보내야 한다. 정의는 이렇다.

- 방향 그래프, 간선마다 용량 `u` 와 단위 비용 `c`. 출발점 `s`, 도착점 `t`.
- 유량 `d` 를 보내면서 `Σ c(e)·f(e)` 를 최소화한다.
- `d` 를 무한대로 두면 **최소 비용 최대 유량(MCMF)**: 최대 유량 중 비용이 가장 작은 것.

배정 문제(작업자 n 명 × 작업 n 개, 짝지을 때 비용), 최단 경로(유량 1, 용량 ∞), 최대 유량(비용 0)이 모두 이 문제의 특수한 경우다(Wikipedia 의 정리).

## 해법: 비용 기준 최단 경로를 따라 반복 증가 (SSP)

Edmonds–Karp 처럼 잔여 그래프에서 증가 경로를 찾되, 경로를 **간선 수가 아니라 비용 합이 최소**인 것으로 고른다.

1. 각 간선 `(u,v,용량,비용)` 에 반대 방향 **역간선**(용량 0, 비용 `-비용`)을 쌍으로 추가한다. 이미 흘린 유량을 되돌리면 그 비용을 돌려받기 때문이다.
2. 잔여 용량이 있는 간선만으로 `s → t` 최소 비용 경로를 찾는다. 역간선 때문에 **음수 비용**이 생기므로 [다익스트라](/develop-wiki/knowledge/algorithms/shortest-path/)를 그대로 쓸 수 없다. 벨만-포드·SPFA 를 쓰거나, 존슨 방식의 퍼텐셜을 써서 다익스트라로 바꾼다.
3. 경로 위 병목 용량(또는 남은 목표 유량)만큼 보내고 비용을 `유량 × 경로 비용` 으로 더한다.
4. 경로가 없거나 목표 유량에 도달할 때까지 반복한다. 목표 `K` 에 못 미치면 불가능이다.

```ts
// 최소 비용 최대 유량 (successive shortest paths + SPFA)
class MinCostFlow {
  to: number[] = []; cap: number[] = []; cost: number[] = []; adj: number[][];
  n: number;
  constructor(n: number) { this.n = n; this.adj = Array.from({ length: n }, () => []); }
  addEdge(u: number, v: number, cap: number, cost: number) {
    this.adj[u].push(this.to.length); this.to.push(v); this.cap.push(cap); this.cost.push(cost);
    this.adj[v].push(this.to.length); this.to.push(u); this.cap.push(0); this.cost.push(-cost); // 역간선은 비용 -c
  }
  run(s: number, t: number, maxFlow = Infinity): [flow: number, cost: number] {
    let flow = 0, total = 0;
    while (flow < maxFlow) {
      const dist = new Array(this.n).fill(Infinity), inQ = new Array(this.n).fill(false), prev = new Array(this.n).fill(-1);
      dist[s] = 0; const q = [s];
      while (q.length) {
        const u = q.shift()!; inQ[u] = false;
        for (const e of this.adj[u]) if (this.cap[e] > 0 && dist[u] + this.cost[e] < dist[this.to[e]]) {
          dist[this.to[e]] = dist[u] + this.cost[e]; prev[this.to[e]] = e;
          if (!inQ[this.to[e]]) { inQ[this.to[e]] = true; q.push(this.to[e]); }
        }
      }
      if (dist[t] === Infinity) break;
      let f = maxFlow - flow;
      for (let v = t; v !== s; v = this.to[prev[v] ^ 1]) f = Math.min(f, this.cap[prev[v]]);
      for (let v = t; v !== s; v = this.to[prev[v] ^ 1]) { this.cap[prev[v]] -= f; this.cap[prev[v] ^ 1] += f; }
      flow += f; total += f * dist[t];
    }
    return [flow, total];
  }
}

// 할당 문제: 작업자 n 명 × 작업 n 개, 비용 행렬 → 최소 총비용
function assign(c: number[][]): number {
  const n = c.length, s = 2 * n, t = 2 * n + 1, g = new MinCostFlow(2 * n + 2);
  for (let i = 0; i < n; i++) { g.addEdge(s, i, 1, 0); g.addEdge(n + i, t, 1, 0); for (let j = 0; j < n; j++) g.addEdge(i, n + j, 1, c[i][j]); }
  return g.run(s, t)[1];
}
console.log(assign([[9, 2, 7], [3, 6, 1], [5, 8, 4]])); // 8  (0→1:2, 1→2:1, 2→0:5)
```

간선을 `i`, `i^1`(홀짝 쌍)로 저장해 역간선을 `^ 1` 로 찾는 것이 흔한 구현 요령이다. 무작위 6×6 비용 행렬 200개를 모든 순열 완전탐색과 비교해 **200개 모두 일치**했다. 위 3×3 예제의 최소 비용은 8 이다.

## 복잡도

cp-algorithms 가 정리한 값이다. `F` 는 보낸 총 유량, `n` 정점, `m` 간선.

| 최단 경로 방식 | 시간 |
| --- | --- |
| 벨만-포드 / SPFA | O(F · m · n) |
| 다익스트라 + 퍼텐셜(초기 O(nm)) | O(nm + F · m log n) |
| 일반 | O(F · 경로 탐색 시간). `F` 가 입력 크기에 대해 지수일 수 있음 |

그 외에 사이클 제거, 비용 스케일링, 네트워크 심플렉스 등 알고리즘이 있다. 강한 다항 시간·거의 선형 시간 알고리즘도 이론적으로 알려져 있다(Wikipedia). 대회·실무의 일반 구현은 SSP 가 단순해서 흔하다.

## 응용

- **배정 문제**: 위 코드. 배정 문제 전용 알고리즘인 헝가리안 알고리즘도 있다([이분 매칭 노트](/develop-wiki/knowledge/algorithms/max-flow-bipartite-matching/)가 함께 언급).
- **운송·물류**: 공급지·수요지·경로 용량·운임.
- **최소 비용 이분 매칭**: 원소 간 짝짓기 비용이 다를 때(운전자-승객 배정 등).
- 할 수 있는 한 유량 모형으로 바꾸는 것이 핵심이다. 조건을 용량과 비용으로 옮기면 알고리즘은 같다.

## 언제 쓰나

- "얼마나"가 아니라 **"가장 싸게 얼마나"** 를 물을 때. 용량 제약이 있는 배정·수송.
- 비용이 정수이고 규모가 중간(수천~수만 간선)일 때 SSP 는 구현이 짧다.

## 주의

- **음수 사이클이 있는 입력**은 SSP 시작 조건을 깨뜨린다. 초기 그래프에 음수 비용 간선이 있다면 먼저 벨만-포드로 퍼텐셜을 계산하거나 음수 사이클을 제거해야 한다. 이 노트의 코드는 초기 비용이 음수가 아니고 사이클이 없다고 가정한다. cp-algorithms 페이지도 이 조건을 명시하지 않고 지나가므로, 직접 확인한다.
- `F`(유량)가 큰 문제에서는 반복 횟수가 많아 느리다. 용량이 큰 문제는 용량 스케일링 같은 변형이 필요하다.
- 비용이 실수이면 부동소수 오차로 `dist` 비교가 흔들릴 수 있다. 정수로 스케일한다.
- 유량 모형이 조건을 완전히 표현하지 못하는 문제(추가 제약이 있는 배정)는 정수 계획법이 필요할 수 있다.

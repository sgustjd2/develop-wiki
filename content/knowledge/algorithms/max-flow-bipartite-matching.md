---
title: 최대 유량과 이분 매칭
aka: [Maximum Flow, Max-Flow Min-Cut, Ford-Fulkerson, Edmonds-Karp, Dinic, Bipartite Matching, Hopcroft-Karp, 네트워크 플로]
category: algorithms
group: algorithm
level: advanced
summary: 용량 있는 간선 그래프에서 출발점에서 도착점으로 보낼 수 있는 최대량을 구하는 문제와 그 응용. 최대 유량은 최소 컷과 같고, 이분 매칭은 용량이 모두 1 인 유량 문제로 바뀐다.
tags: [graph, max-flow, min-cut, matching, dinic, augmenting-path, bipartite]
related: [algorithms/bfs-dfs, algorithms/graph-representation, algorithms/shortest-path, algorithms/greedy, algorithms/dynamic-programming, algorithms/p-np-approximation, algorithms/union-find, algorithms/topological-sort]
sources:
  - https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem
  - https://en.wikipedia.org/wiki/Edmonds%E2%80%93Karp_algorithm
  - https://cp-algorithms.com/graph/dinic.html
  - https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm
updatedAt: 2026-11-19
---

## 문제

- **유량**: 배수관 망에서 수원(s)에서 도시(t)로 시간당 물을 최대 얼마나 보낼 수 있나? 간선마다 용량이 있고, 중간 정점으로 들어온 양은 나가는 양과 같아야 한다.
- **매칭**: 개발자 4명과 작업 4개가 있고 "누가 어떤 작업을 할 수 있는지"가 주어졌다. 한 사람에 한 작업씩, 최대 몇 쌍을 짝지을 수 있나?

둘은 같은 문제의 다른 얼굴이다. 매칭 문제를 유량 문제로 바꿔 풀 수 있다.

## 최대 유량 · 최소 컷 정리

- **s-t 컷**: 정점을 s 쪽 집합과 t 쪽 집합으로 가르고, s 쪽에서 t 쪽으로 넘어가는 간선 용량의 합이 컷의 용량이다.
- **정리**: s→t **최대 유량의 값 = 최소 컷의 용량**. 병목을 정확히 짚어 준다는 뜻이다. 1956년 Ford·Fulkerson 의 논문과, 같은 해 Elias·Feinstein·Shannon 의 노트가 증명한 것으로 Wikipedia 가 정리한다.

## 알고리즘

핵심은 **잔여 그래프(residual graph)** 와 **증가 경로(augmenting path)** 다.

- 간선 u→v 에 f 만큼 흘리면, 남은 용량은 `cap − f`, 그리고 v→u 에 f 만큼의 **되돌리기 간선**이 생긴다. 이미 보낸 흐름을 취소할 수 있게 해 준다.
- s 에서 t 로 가는 경로를 잔여 그래프에서 찾아 그 경로의 최소 잔여 용량만큼 흘리기를 더 이상 경로가 없을 때까지 반복한다(Ford–Fulkerson 방식).

| 알고리즘 | 경로 선택 | 시간 복잡도 |
| --- | --- | --- |
| Ford–Fulkerson | 아무 경로(DFS 등) | 용량이 정수일 때 유량 값에 비례, 선택에 따라 매우 느릴 수 있음 |
| Edmonds–Karp | **BFS 최단 경로**(간선 수 기준) | O(V·E²) |
| Dinic | 레벨 그래프 + 차단 유량 | O(V²·E), 단위 용량 네트워크는 O(E·√V) |

- Edmonds–Karp 는 Dinitz 가 1970년, Edmonds 와 Karp 가 1972년에 독립적으로 발표했고, 경로를 최단으로만 고르기 때문에 최단 경로 길이가 줄지 않는다는 성질로 복잡도를 보장한다(Wikipedia).
- **Dinic**(Yefim Dinitz, 1970)은 매 단계에서 잔여 그래프에 BFS 로 정점의 레벨을 매기고, `레벨 +1` 로 가는 간선만 남긴 **레벨 그래프** 위에서 DFS 로 더 이상 못 늘릴 때까지(차단 유량) 흘린다. 단계마다 s–t 최단 거리가 늘어나므로 단계 수는 V 미만이다(cp-algorithms).
- 구현 시 정점별 포인터(`it[u]`)로 이미 막힌 간선을 건너뛰어야 단계당 복잡도가 보장된다.

```ts
class Dinic {
  private to: number[] = []; private cap: number[] = [];
  private adj: number[][];
  private level: number[] = []; private it: number[] = [];
  constructor(private readonly n: number) { this.adj = Array.from({ length: n }, () => []); }
  addEdge(u: number, v: number, c: number): number {
    const id = this.to.length;
    this.to.push(v, u); this.cap.push(c, 0); // 정방향 + 역방향(잔여) 간선은 짝수/홀수 쌍
    this.adj[u].push(id); this.adj[v].push(id + 1);
    return id;
  }
  private bfs(s: number, t: number): boolean {
    this.level = new Array(this.n).fill(-1); this.level[s] = 0;
    const q = [s];
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      for (const e of this.adj[u]) if (this.cap[e] > 0 && this.level[this.to[e]] < 0) { this.level[this.to[e]] = this.level[u] + 1; q.push(this.to[e]); }
    }
    return this.level[t] >= 0;
  }
  private dfs(u: number, t: number, f: number): number {
    if (u === t) return f;
    for (; this.it[u] < this.adj[u].length; this.it[u]++) {
      const e = this.adj[u][this.it[u]], v = this.to[e];
      if (this.cap[e] > 0 && this.level[v] === this.level[u] + 1) {
        const d = this.dfs(v, t, Math.min(f, this.cap[e]));
        if (d > 0) { this.cap[e] -= d; this.cap[e ^ 1] += d; return d; }
      }
    }
    return 0;
  }
  maxFlow(s: number, t: number): number {
    let flow = 0;
    while (this.bfs(s, t)) {
      this.it = new Array(this.n).fill(0);
      for (let f = this.dfs(s, t, Infinity); f > 0; f = this.dfs(s, t, Infinity)) flow += f;
    }
    return flow;
  }
  flowOn(edgeId: number): number { return this.cap[edgeId ^ 1]; }
}
```

간선 10개짜리 교과서 예제 그래프(정점 6개)에서 최대 유량은 23 이었고, 최대 유량 후 s 에서 잔여 그래프로 닿는 정점 집합 기준으로 센 최소 컷 용량도 23 으로 일치했다. **최소 컷은 잔여 그래프에서 s 에서 닿는 쪽 / 못 닿는 쪽으로 나누면 얻는다.**

## 이분 매칭으로 바꾸기

왼쪽 집합 L(개발자), 오른쪽 집합 R(작업)에 대해:

1. 가상의 S 에서 L 의 모든 정점으로 용량 1 간선, R 의 모든 정점에서 가상의 T 로 용량 1 간선.
2. "할 수 있다" 쌍마다 L→R 용량 1 간선.
3. S→T 최대 유량 = **최대 매칭의 크기**. 유량이 1 인 L→R 간선이 매칭 쌍이다.

```ts
function bipartiteMatching(nl: number, nr: number, pairs: [number, number][]): { size: number; match: [number, number][] } {
  const S = nl + nr, T = S + 1;
  const g = new Dinic(nl + nr + 2);
  for (let i = 0; i < nl; i++) g.addEdge(S, i, 1);
  for (let j = 0; j < nr; j++) g.addEdge(nl + j, T, 1);
  const ids = pairs.map(([l, r]) => g.addEdge(l, nl + r, 1));
  const size = g.maxFlow(S, T);
  return { size, match: pairs.filter((_, k) => g.flowOn(ids[k]) === 1) };
}
// 개발자 4명 / 작업 4개, 가능 쌍 [[0,0],[0,1],[1,0],[2,1],[2,2],[3,2]] → 크기 3 ([0,0],[2,1],[3,2])
```

작업 3번을 할 수 있는 사람이 없으므로 3이 최대다. 위 코드는 `tsc --strict` 로 컴파일해 실행했다.

- 이런 단위 용량 네트워크에서 Dinic 은 **O(E√V)** 로 줄어든다(cp-algorithms). **Hopcroft–Karp**(1973, Karzanov 도 독립 발견)는 바로 이분 매칭 전용으로 같은 아이디어(최단 증가 경로를 한 번에 여러 개)를 쓰는 알고리즘이며, Wikipedia 는 Dinic 의 특수한 경우로 볼 수 있다고 설명한다.
- 가중치가 있는 이분 매칭(최소 비용 배정)은 **헝가리안 알고리즘**이나 최소 비용 유량으로 푼다.
- **König 정리**: 이분 그래프에서 최대 매칭 크기 = 최소 정점 덮개 크기. 최대 유량-최소 컷 정리에서 유도할 수 있다(Wikipedia).

## 응용

최대 유량-최소 컷은 매칭 외에도 다음에 쓰인다(Wikipedia 가 예로 든 것 포함).

- **프로젝트 선택**: 수익이 있는 프로젝트와 비용이 드는 장비 사이의 의존 관계에서 이익을 최대로 → 최소 컷으로 변환.
- **이미지 분할**: 픽셀을 전경/배경으로 나눌 때 이웃 불일치 비용을 최소화 → 최소 컷.
- **간선 독립 경로 수**(Menger 정리): 서로 간선을 공유하지 않는 s–t 경로의 최대 개수 = 최소 컷의 간선 수. 네트워크 신뢰성 분석.
- **작업 할당·스케줄링·팀 배정, 좌석 배치, 대회 대진표 가능성 판정**.

## 언제 쓰나

- "자원을 제한 용량 안에서 최대한 나른다", "겹치지 않게 최대한 짝짓는다", "가장 약한 연결을 찾는다" 중 하나로 문제가 환원될 때.
- 매칭 문제는 위 변환이 안 보일 때도 많다. **용량 1 짜리 이분 그래프**가 보이면 유량부터 의심한다.

## 주의

- **정점 용량**(정점을 지나는 총량 제한)은 정점을 in/out 둘로 쪼개 그 사이에 용량 간선을 두어 표현한다.
- **무방향 그래프**는 양방향 간선 두 개로 바꾼다. 간선 쌍의 짝수/홀수 인덱스 트릭이 깨지지 않게 주의한다.
- 용량이 무리수이거나 실수이면 Ford–Fulkerson 계열이 종료되지 않거나 오차가 쌓일 수 있다. 정수로 스케일링한다. 최단 경로 선택(Edmonds–Karp)은 이 문제가 없다.
- **일반 그래프(이분 아님) 매칭**은 유량으로 안 된다. Edmonds 의 blossom 알고리즘을 쓴다.
- 정점 수가 매우 크면 추가 메모리(역간선 포함 2E)와 재귀 DFS 깊이가 문제다. 반복형으로 바꾸거나 라이브러리를 쓴다.
- 최소 비용 유량처럼 비용이 붙으면 별도 알고리즘(SSP 등)이 필요하다. 이 노트의 Dinic 은 비용을 모른다.

## 실무에서

- 문제 환원이 어렵지 직접 구현은 드물다. 최적화 라이브러리의 네트워크 플로 모듈(Boost Graph Library, NetworkX, OR-Tools 등)을 먼저 쓴다.
- 매칭 형태의 서비스 로직(운전자-승객 배정, 면접 일정 배정)은 규모와 제약에 따라 이분 매칭·배정 문제·정수 계획법으로 푼다. 일반 최단·최소 비용과 달리 "제약 충족 여부"를 먼저 판정하고 싶을 때 유량이 간결하다.

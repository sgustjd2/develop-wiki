---
title: 헝가리안 알고리즘 (배정 문제)
aka: [Hungarian Algorithm, Kuhn-Munkres, Munkres, Assignment Problem, Linear Assignment, 최소 비용 완전 매칭, 배정 문제]
category: algorithms
group: algorithm
level: advanced
summary: n×m 비용 행렬에서 행마다 서로 다른 열을 하나씩 골라 합을 최소로 하는 배정 문제를, 행·열 퍼텐셜을 조정하며 O(n²m) 에 푸는 알고리즘. 최소 비용 유량의 특수한 경우다.
tags: [assignment, hungarian, kuhn-munkres, potentials, bipartite, matching, optimization]
related: [algorithms/min-cost-flow, algorithms/max-flow-bipartite-matching, algorithms/greedy, algorithms/shortest-path, algorithms/p-np-approximation, algorithms/bfs-dfs]
sources:
  - https://cp-algorithms.com/graph/hungarian-algorithm.html
updatedAt: 2026-11-19
---

## 문제

작업자 n 명과 작업 m 개가 있고, 작업자 i 가 작업 j 를 하는 비용이 `A[i][j]` 다. 한 작업자에 작업 하나, 한 작업에 작업자 하나씩 짝지을 때 **총비용이 최소**인 짝짓기를 찾는 것이 배정 문제(assignment problem)다. 후보는 n! 개 순열이라 완전탐색은 n = 12 만 돼도 4.8억 가지다.

[이분 매칭](/develop-wiki/knowledge/algorithms/max-flow-bipartite-matching/)은 "짝지을 수 있는가/몇 쌍인가"만 묻고, 이 문제는 거기에 **가중치**를 붙인 것이다. 욕심쟁이로 가장 싼 칸부터 고르면 틀린다.

```
      작업0 작업1
 사람0   1     2
 사람1   2    100      욕심: (0,0)=1 먼저 고르면 (1,1)=100 → 101
                       최적: (0,1)+(1,0) = 2+2 = 4
```

## 해법: 퍼텐셜로 하한을 올려 가며 등식 간선만 쓴다

행마다 값 `u[i]`, 열마다 값 `v[j]` 를 둔다(퍼텐셜). 모든 칸에 대해 `u[i] + v[j] ≤ A[i][j]` 를 유지하면 `Σu + Σv` 는 **어떤 배정의 비용보다도 작거나 같다**(하한). 어떤 배정이 선택한 칸마다 등호가 성립하면 그 배정의 비용이 곧 하한이므로 최적이다.

1. 등호가 성립하는 칸(`u[i] + v[j] = A[i][j]`)만 간선으로 본다. 이 간선들로 이분 그래프에서 **증가 경로**를 찾아 매칭을 키운다.
2. 현재 행에서 시작한 탐색이 빈 열에 닿지 못하면, 탐색이 닿은 행들과 닿지 못한 열들 사이의 **최소 여유(slack)** Δ 를 구한다. 닿은 행의 `u` 를 Δ 만큼 올리고 닿은 열의 `v` 를 Δ 만큼 내리면 제약은 유지되고 새 등호 간선이 하나 이상 생긴다. 닿는 범위가 반드시 커지므로 한 행에서 갱신은 많아야 m 번이다.
3. 빈 열에 닿으면 경로를 따라 매칭을 뒤집는다. 다음 행으로 간다.

최소 여유를 열마다 `minv[j]` 로 유지해 갱신 한 번을 O(m) 에 처리하면 행 하나가 O(nm), 전체가 **O(n²m)**(정방형이면 O(n³))다. 원래의 Kuhn 구현은 O(n⁴) 였고 Edmonds–Karp, Tomizawa 의 개선으로 O(n³) 이 됐다(cp-algorithms).

```ts
// 최소 비용 배정. a 는 n×m (n ≤ m). 반환: 최소 비용과 행별 열 번호. 1-인덱스 + 가짜 행/열 0 사용
function hungarian(a: number[][]): { cost: number; col: number[] } {
  const n = a.length, m = a[0].length;
  const u = Array(n + 1).fill(0), v = Array(m + 1).fill(0), p = Array(m + 1).fill(0), way = Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0;
    const minv = Array(m + 1).fill(Infinity), used = Array(m + 1).fill(false);
    do {
      used[j0] = true; const i0 = p[j0]; let delta = Infinity, j1 = 0;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = a[i0 - 1][j - 1] - u[i0] - v[j];          // 이 칸의 여유(slack)
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);                                     // 빈 열에 닿을 때까지
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0); // 경로를 따라 매칭 뒤집기
  }
  const col = Array(n).fill(-1); for (let j = 1; j <= m; j++) if (p[j]) col[p[j] - 1] = j - 1;
  return { cost: -v[0], col };
}
```

- **n > m 이면** 행렬을 전치한다. 행이 열보다 적은 형태(`n ≤ m`)만 처리하도록 짜여 있다.
- **최대화**는 모든 값의 부호를 뒤집는다. `[[7,5,9],[3,8,2],[6,4,10]]` 의 최대 배정은 7+8+10 = 25 로 나온다.
- **연결이 없는 쌍**은 아주 큰 값으로 두고, 결과에서 그 칸이 뽑혔으면 불가능한 배정이었다고 해석한다. 값이 너무 크면 부동소수 오차에 주의한다.
- 총비용은 배정 칸의 합 대신 `-v[0]` 에서 읽을 수 있다(퍼텐셜 쌍대 값과 같음).

### 직접 돌려 본 결과

- n = 1~6, m = n~n+2 인 무작위 행렬 2000개(값 −10~30, 음수 포함)를 완전탐색과 비교해 **2000개 모두 최적값이 일치**했다. 반환된 배정의 합이 `cost` 와 같고 열 중복이 없다는 것도 2000개 모두 만족했다. 처음 짠 완전탐색에 `best` 갱신 버그가 있어 일치율이 낮게 나왔는데, 완전탐색을 고치자 해결됐다. 비교 기준 코드부터 의심해 볼 가치가 있다는 사례다.
- 시간(Node 24, 단일 실행): 무작위 정수 행렬은 n = 800 에서 약 41ms 로 매우 빨랐다. 반면 `A[i][j] = i·j` 처럼 구조가 있는 행렬은 n = 800 에서 약 650ms, n = 1600 에서 약 5.2초로 크기를 두 배 하면 8배 안팎이 되어 **O(n³) 에 가까운 최악 거동**이 보였다. 무작위 입력의 실행 시간으로 최악을 판단하면 안 된다. 단일 실행의 대략적 수치라 환경에 따라 다르다.

## 비교

| | 헝가리안 | 최소 비용 유량(SSP) | 욕심 |
| --- | --- | --- | --- |
| 입력 | 비용 행렬 하나 | 용량·비용이 있는 일반 그래프 | 아무 입력 |
| 최적성 | 보장 | 보장 | 보장 없음 |
| 복잡도 | O(n²m) | 간선·유량 크기에 의존 | 정렬 비용 |
| 맞는 곳 | 1:1 배정이 정확히 이 문제일 때 | 용량 > 1, 중간 노드, 다대다 | 근사로 충분할 때 |

배정 문제는 용량 1 의 최소 비용 유량으로 표현할 수 있어 [최소 비용 유량](/develop-wiki/knowledge/algorithms/min-cost-flow/)의 특수한 경우이고, 그 특수성을 이용해 더 빠르고 간단하게 푼 것이 헝가리안이다.

## 언제 쓰나

- 작업자-작업, 차량-승객, 서버-요청처럼 **1:1 최소 비용(최대 이득) 배정**이 필요할 때.
- 객체 추적에서 이전 프레임과 현재 프레임의 검출 박스를 거리로 짝지을 때(대표적 응용으로 알려져 있으나 이 노트는 해당 문헌을 확인하지 않았다).
- 라이브러리가 있으면 직접 구현보다 먼저 쓴다.

## 주의 (비용)

- **행렬 전체를 메모리에 둔다.** O(nm) 이므로 n, m 이 수만 이상이면 부담이다. 희소 그래프라면 간선 기반 알고리즘이 낫다.
- **정수 비용**이 안전하다. 실수는 `delta` 비교와 `minv` 갱신에서 오차가 누적돼 등호 판정이 어긋날 수 있다. 정수로 스케일링한다.
- 한 작업에 여러 사람, 사람마다 최대 k 개 같은 **용량이 있는 배정**은 이 형태가 아니다. 열을 복제하거나 유량으로 푼다.
- 배정이 서로 의존(둘이 짝일 때만 이득)하면 이차 배정 문제가 되어 NP-난해다. 헝가리안이 풀지 못한다 → [P, NP 와 근사](/develop-wiki/knowledge/algorithms/p-np-approximation/).
- 위 코드는 최소화 전용이고 입력 검증(빈 행렬, `n > m`)을 하지 않는다.

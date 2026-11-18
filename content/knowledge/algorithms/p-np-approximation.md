---
title: P·NP·NP-완전과 근사 알고리즘
aka: [P vs NP, NP-complete, NP-hard, NP-완전, NP-난해, Polynomial-time Reduction, 다항 시간 환원, Approximation Algorithm, 근사 알고리즘, PTAS, FPTAS]
category: algorithms
group: complexity
level: advanced
summary: 다항 시간에 풀 수 있는 문제(P), 답을 다항 시간에 검증할 수 있는 문제(NP), 그중 가장 어려운 문제(NP-완전)의 구분. 실무에서 NP-난해 문제를 만나면 근사·제한·휴리스틱으로 우회한다.
tags: [complexity, np-complete, reduction, approximation, heuristics, optimization]
related: [algorithms/big-o-complexity, algorithms/greedy, algorithms/dynamic-programming, algorithms/backtracking, algorithms/minimum-spanning-tree, algorithms/strongly-connected-components]
sources:
  - https://en.wikipedia.org/wiki/NP-completeness
  - https://en.wikipedia.org/wiki/Approximation_algorithm
  - https://en.wikipedia.org/wiki/Set_cover_problem
  - https://en.wikipedia.org/wiki/Knapsack_problem
  - https://en.wikipedia.org/wiki/Travelling_salesman_problem
updatedAt: 2026-11-18
---

## 문제

배송 경로 최적화, 시험 시간표 짜기, 클라우드 VM 배치, 테스트 케이스 최소화를 맡았다. 작은 입력에서는 잘 돌던 정확한 알고리즘이, 입력이 50개를 넘자 끝나지 않는다. 더 똑똑한 알고리즘을 찾아야 할까, 아니면 **애초에 빠른 정확해가 없을 가능성이 높은 문제**일까? 이 판단을 내리게 해 주는 것이 P·NP 이론이다. 판단이 서면 "완벽한 답"이 아니라 "충분히 좋은 답을 빠르게"로 목표를 바꾼다.

## 정의 (결정 문제 기준)

이론은 "예/아니오" 결정 문제로 정의한다. "가장 짧은 경로는?"(최적화) 대신 "길이 k 이하인 경로가 있나?"(결정)로 바꿔 묻는다. 결정판을 풀면 k 를 이분 탐색해 최적화판도 풀 수 있어서 난이도가 같은 수준이다.

| 클래스 | 뜻 | 예 |
| --- | --- | --- |
| **P** | 다항 시간 O(nᶜ)에 **풀 수** 있음 | 정렬, 최단 경로, [MST](/develop-wiki/knowledge/algorithms/minimum-spanning-tree/), [SCC](/develop-wiki/knowledge/algorithms/strongly-connected-components/), 2-SAT |
| **NP** | 답(증명서)이 주어지면 다항 시간에 **검증할** 수 있음 | P 의 모든 문제 + SAT, 해밀턴 경로, 정점 덮개 |
| **NP-난해(NP-hard)** | NP 의 **모든** 문제를 다항 시간에 이 문제로 환원할 수 있음. NP 안에 있을 필요는 없음 | TSP 최적화판, 정지 문제 |
| **NP-완전(NP-complete)** | NP 이면서 NP-난해. NP 에서 가장 어려운 문제들 | SAT, 3-SAT, 클리크, 정점 덮개, 그래프 색칠, 부분집합 합, 배낭 문제(결정판) |

- NP 는 "Not Polynomial" 이 아니라 **Nondeterministic Polynomial** 이다.
- P ⊆ NP 는 자명하다(풀 수 있으면 검증도 된다). **P = NP 인지는 아직 아무도 모른다.** 대부분의 연구자는 P ≠ NP 라고 믿는다.
- NP-완전 문제 **하나라도** 다항 시간 알고리즘이 나오면 NP 전체가 P 가 된다. 그래서 "이 문제는 NP-완전이다"는 "빠른 정확해를 찾으려는 시도는 수십 년간 모두 실패한 문제들과 같은 급이다"라는 실용적 경고다.

### 역사

- 1971년 **Cook–Levin 정리**: SAT(불리언 식 만족 가능성)가 NP-완전임을 증명했다. 첫 NP-완전 문제다.
- 1972년 Richard Karp 가 SAT 에서 출발해 21개 조합 문제(클리크, 정점 덮개, 집합 덮개, 해밀턴 순환 등)가 NP-완전임을 보였다. 이후 수천 개 문제가 같은 방법으로 분류됐다.

## 환원: 난이도를 증명하는 도구

문제 A 를 문제 B 로 **다항 시간에 환원**한다는 것은, A 의 입력을 B 의 입력으로 바꿔서 B 의 답으로 A 의 답을 얻는 다항 시간 변환이 있다는 뜻이다. "B 를 풀 수 있으면 A 도 풀 수 있다" → B 는 A 이상으로 어렵다.

새 문제 X 가 NP-완전임을 보이는 절차:

1. X 가 NP 에 속함을 보인다(증명서를 다항 시간에 검증).
2. **이미 알려진** NP-완전 문제를 X 로 환원한다. 방향이 중요하다. X 를 알려진 문제로 환원하면 아무것도 증명되지 않는다.

실무 감각: 내 문제가 "그래프 색칠", "배낭", "집합 덮개", "TSP", "빈 패킹", "스케줄링"의 옷만 갈아입은 것은 아닌지 먼저 의심한다. 시간표 짜기는 그래프 색칠, VM 배치는 빈 패킹, 최소 테스트 집합은 집합 덮개의 변형인 경우가 많다.

## 코드로 보는 "검증은 쉽고 풀기는 어렵다"

```ts
type Edge = [number, number];

// NP 의 핵심: 답(증명서)이 주어지면 다항 시간에 검증할 수 있다
function isVertexCover(edges: readonly Edge[], cover: ReadonlySet<number>): boolean {
  return edges.every(([u, v]) => cover.has(u) || cover.has(v));
}

// 정확한 최소 정점 덮개: 부분집합 2^n 개를 전부 본다 (n = 40 이면 약 1조 개)
function minVertexCoverExact(n: number, edges: readonly Edge[]): Set<number> {
  let best = new Set<number>(Array.from({ length: n }, (_, i) => i));
  for (let mask = 0; mask < 1 << n; mask++) {
    const s = new Set<number>();
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s.add(i);
    if (s.size < best.size && isVertexCover(edges, s)) best = s;
  }
  return best;
}

// 2-근사: 아직 안 덮인 간선을 만나면 양 끝을 모두 넣는다. O(E)
// 고른 간선들은 끝점을 공유하지 않으므로, 최적해도 그 간선마다 최소 1개는 가져야 한다 → |결과| ≤ 2·OPT
function vertexCover2Approx(edges: readonly Edge[]): Set<number> {
  const cover = new Set<number>();
  for (const [u, v] of edges) if (!cover.has(u) && !cover.has(v)) { cover.add(u); cover.add(v); }
  return cover;
}

// 별 모양 그래프: 중심 0 하나만 고르면 된다
const star: Edge[] = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]];
console.log(minVertexCoverExact(6, star).size, vertexCover2Approx(star).size); // 1 2
```

정점 덮개: 모든 간선이 적어도 한쪽 끝점을 덮개에 갖도록 하는 최소 정점 집합. 검증은 O(E), 정확한 풀이는 이 방식으로 O(2ⁿ·E)다. 근사는 O(E)에 최적의 2배 이내를 보장한다. 별 그래프에서는 실제로 2배가 나왔다.

## NP-난해 문제를 만났을 때의 선택지

| 전략 | 아이디어 | 보장 | 예 |
| --- | --- | --- | --- |
| **근사 알고리즘** | 다항 시간 + 최적의 ρ배 이내 보장 | 증명된 비율 | 정점 덮개 2배, 메트릭 TSP 1.5배 |
| **입력 제한** | 실제 입력이 특수한 구조라면 그 구조에서 다항 시간 | 정확 | 트리·평면 그래프, 2-SAT(3-SAT 은 NP-완전) |
| **매개변수화(FPT)** | 지수 폭발을 작은 매개변수 k 에만 몰기: O(f(k)·nᶜ) | 정확 | 덮개 크기 k 가 작을 때의 정점 덮개 |
| **의사 다항 DP** | 수치 크기 W 에 비례하는 [DP](/develop-wiki/knowledge/algorithms/dynamic-programming/) | 정확 | 배낭 O(nW) |
| **똑똑한 완전 탐색** | [백트래킹](/develop-wiki/knowledge/algorithms/backtracking/)·분기 한정·가지치기 | 정확(시간 보장 없음) | 작은 n, 스도쿠 |
| **범용 솔버** | SAT/SMT·정수 계획(ILP)·제약 프로그래밍 솔버에 맡기기 | 정확 또는 갭 보고 | 스케줄링, 배치, 경로 |
| **휴리스틱·메타휴리스틱** | [탐욕](/develop-wiki/knowledge/algorithms/greedy/), 지역 탐색, 담금질, 유전 알고리즘 | 없음(경험적으로 좋음) | 대규모 경로·배치 |

### 근사 비율의 지형

| 문제 | 근사 결과 | 한계 (P ≠ NP 가정) |
| --- | --- | --- |
| 정점 덮개 | 2 (위 알고리즘) | Unique Games 추측 아래 2 가 최선 |
| 메트릭 TSP (삼각 부등식 성립) | MST 두 번 돌기 2, Christofides 1.5 | 123/122 미만은 불가 |
| 일반 TSP | 어떤 상수 비율도 불가 (CLRS 35.2) | — |
| 집합 덮개 | 탐욕 H(n) ≈ ln n | (1−o(1))·ln n 미만은 불가 (Dinur & Steurer) |
| 배낭 | FPTAS: 임의의 ε 에 대해 (1−ε) 배, n 과 1/ε 에 다항 | — |
| 최대 클리크 | — | 어떤 상수·다항 비율로도 근사 불가 |

- **PTAS**: 고정된 ε 마다 (1+ε) 근사를 다항 시간에. 단 1/ε 에 대해서는 지수일 수 있다. **FPTAS** 는 n 과 1/ε 모두에 다항이다.
- 같은 NP-완전이라도 **근사 난이도는 천차만별**이다. 배낭은 거의 최적까지 갈 수 있고, 클리크는 거의 아무 보장도 못 한다. "NP-완전이니 포기"가 아니라 "어떤 종류의 NP-완전인가"를 확인한다.
- 메트릭 TSP 의 1.5 는 2020년대에 아주 작은 폭으로 개선됐다(Karlin, Klein, Oveis Gharan).

## 언제 이 지식을 쓰나

- 요구사항이 "항상 최적"을 요구할 때, 그것이 현실적으로 가능한지 판단하고 **기대치를 조정**할 근거로.
- 정확 알고리즘이 작은 입력에서만 돌 때, 더 최적화할지 전략을 바꿀지 결정할 때.
- 면접·설계 리뷰에서 "이건 사실상 배낭/집합 덮개다"라고 문제를 알려진 틀에 맞출 때. 이미 연구된 근사·휴리스틱을 가져다 쓸 수 있다.

## 주의 (흔한 오해)

Wikipedia NP-completeness 문서가 정리한 오해들을 포함한다.

- **"NP-완전 = 모든 입력이 느리다"가 아니다.** 실제 입력 대부분은 빨리 풀리는 경우가 많다. SAT 솔버·정수 계획 솔버는 산업 규모 문제를 실용적인 시간에 푸는 경우가 많다. TSP 솔버 Concorde 는 2006년 85,900개 도시 인스턴스를 정확히 풀었다. 최악의 경우 이론과 실전 성능은 다르다.
- **"NP-완전 = 반드시 지수 시간"도 아니다.** 일부는 준지수 알고리즘이 있다(예: 평면 그래프의 독립 집합).
- **NP-완전이 가장 어려운 문제는 아니다.** 더 어려운 문제(지수 시간이 필요함이 증명된 문제, 결정 불가능한 정지 문제)도 있다.
- **"P = NP 면 모든 암호가 깨진다"는 과장이다.** 다항 시간이어도 차수가 커서 쓸모없을 수 있고, 일부 보안은 정보 이론에 기반한다.
- **양자 컴퓨터가 NP-완전 문제를 효율적으로 푼다고 믿어지지 않는다.**
- 근사 비율은 **최악 보장**이다. 실제 결과는 대개 훨씬 좋다. 반대로 휴리스틱은 평소 좋아도 특정 입력에서 크게 나쁠 수 있다. 둘을 함께 쓰고(근사로 상한·하한, 휴리스틱으로 개선) 최적해와의 갭을 측정한다.
- 의사 다항(O(nW)) 알고리즘을 "다항"이라고 착각하지 않는다. W 가 2⁶⁴ 이면 쓸 수 없다. 입력 길이는 W 의 자릿수(log W)에 비례하기 때문이다.

> 참고: CLRS 4판 34장 "NP-Completeness", 35장 "Approximation Algorithms". S. Cook, "The complexity of theorem-proving procedures", STOC 1971. R. Karp, "Reducibility Among Combinatorial Problems", 1972. Garey & Johnson, *Computers and Intractability*, 1979.

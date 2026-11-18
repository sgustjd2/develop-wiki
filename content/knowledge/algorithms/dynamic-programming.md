---
title: 동적 계획법
aka: [Dynamic Programming, DP, Memoization, Tabulation, 메모이제이션, 동적 프로그래밍]
category: algorithms
group: algorithm
level: intermediate
summary: 겹치는 부분 문제의 답을 저장해 재사용함으로써 지수 시간 재귀를 다항 시간으로 바꾸는 설계 기법. 최적 부분 구조와 중복 부분 문제가 있을 때 쓴다.
tags: [dynamic-programming, memoization, optimization, edit-distance, lcs]
related: [algorithms/greedy, algorithms/backtracking, algorithms/space-time-tradeoff, algorithms/shortest-path, algorithms/topological-sort]
sources:
  - https://en.wikipedia.org/wiki/Dynamic_programming
  - https://cp-algorithms.com/dynamic_programming/intro-to-dp.html
  - https://en.wikipedia.org/wiki/Levenshtein_distance
  - https://git-scm.com/docs/git-diff
updatedAt: 2026-11-18
---

## 문제

피보나치를 정의대로 재귀하면 `fib(n-2)` 를 `fib(n)` 과 `fib(n-1)` 이 각각 다시 계산한다. 같은 부분 문제가 기하급수적으로 반복돼 O(φⁿ) 이 된다.

## 해법

Richard Bellman 이 1950년대에 다단계 의사결정 문제를 위해 이름 붙인 방법이다. 두 조건이 있을 때 쓴다.

1. **최적 부분 구조**: 전체 최적해가 부분 문제의 최적해로 구성된다.
2. **중복 부분 문제**: 같은 부분 문제가 여러 번 등장한다.

설계 순서:
1. **상태**를 정의한다: `dp[i][j]` 가 무엇을 뜻하는지 한 문장으로.
2. **점화식**: 상태를 더 작은 상태로 표현.
3. **기저 조건**과 **계산 순서**(작은 것부터).
4. 답이 어느 상태인지, 필요하면 **역추적**으로 실제 해를 복원.

| 방식 | 하향식(메모이제이션) | 상향식(타뷸레이션) |
| --- | --- | --- |
| 형태 | 재귀 + 캐시 | 반복문 + 표 |
| 장점 | 점화식 그대로, 필요한 상태만 계산 | 재귀 오버헤드·스택 한계 없음, 공간 최적화 쉬움 |
| 단점 | 깊은 재귀 스택, 캐시 오버헤드 | 계산 순서를 직접 정해야 함, 불필요 상태도 계산 |

## 예 1: 편집 거리 (레벤슈타인)

`dp[i][j]` = `a` 의 앞 i 글자를 `b` 의 앞 j 글자로 바꾸는 최소 편집(삽입·삭제·치환) 수.

```ts
function editDistance(a: string, b: string): number {
  // 직전 행만 유지 → 공간 O(min) 으로 줄일 수 있음. 여기선 O(|b|)
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const sub = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      cur[j] = Math.min(sub, prev[j] + 1 /* 삭제 */, cur[j - 1] + 1 /* 삽입 */);
    }
    prev = cur;
  }
  return prev[b.length];
}
console.log(editDistance("kitten", "sitting")); // 3
```

## 예 2: 0/1 배낭

`dp[w]` = 용량 w 로 얻는 최대 가치. 각 물건을 한 번만 쓰도록 **w 를 큰 쪽에서 작은 쪽으로** 돈다.

```ts
function knapsack(items: ReadonlyArray<{ weight: number; value: number }>, cap: number): number {
  const dp = new Array<number>(cap + 1).fill(0);
  for (const { weight, value } of items) {
    for (let w = cap; w >= weight; w--) dp[w] = Math.max(dp[w], dp[w - weight] + value);
  }
  return dp[cap];
}
console.log(knapsack([{ weight: 1, value: 1 }, { weight: 3, value: 4 }, { weight: 4, value: 5 }, { weight: 5, value: 7 }], 7)); // 9
```

## 복잡도

**시간 = 상태 수 × 상태당 전이 비용**, 공간 = 저장하는 상태 수.

| 문제 | 상태 | 시간 | 공간(최적화 후) |
| --- | --- | --- | --- |
| 피보나치 | n | O(n) | O(1) |
| 편집 거리 / LCS | n × m | O(nm) | O(min(n, m)) |
| 0/1 배낭 | n × W | O(nW) (의사 다항) | O(W) |
| 최장 증가 부분 수열 | n | O(n²), 이분 탐색으로 O(n log n) | O(n) |
| 행렬 체인 곱셈 | n² | O(n³) | O(n²) |
| 외판원(비트마스크) | 2ⁿ × n | O(2ⁿ n²) | O(2ⁿ n) |

배낭의 O(nW) 는 W 의 **값**에 비례하므로 W 가 크면(10⁹) 쓸 수 없다. 이런 것을 의사 다항 시간이라 한다.

## 언제 쓰나

- 최적화(최소 비용·최대 가치)나 경우의 수 세기에서, 선택이 이후 선택에 영향을 주고 [그리디](/develop-wiki/knowledge/algorithms/greedy/)가 반례를 가질 때.
- [백트래킹](/develop-wiki/knowledge/algorithms/backtracking/) 탐색 중 같은 상태를 반복 방문할 때 → 메모이제이션을 붙이면 DP 가 된다.
- 문자열 비교(편집 거리, LCS), 구간 분할, DAG 위 경로 문제.

## 주의

- **상태 정의가 전부다.** 상태가 과거 결정을 충분히 요약하지 못하면 틀리고, 너무 많이 담으면 상태 수가 폭발한다.
- 상태 수가 지수적이면(2ⁿ) DP 여도 n ≤ 20 정도가 한계다.
- 하향식 재귀는 깊이가 크면 스택 오버플로. 상향식으로 바꾸거나 반복문으로 쓴다.
- 메모이제이션 키를 문자열 연결(`${i},${j}`)로 만들면 상수가 크다. 가능하면 숫자 인덱스 배열을 쓴다.
- 공간 최적화(행 하나만 유지)를 하면 역추적으로 실제 해를 복원할 수 없게 된다. 해 자체가 필요하면 표를 유지하거나 Hirschberg 같은 분할 정복 기법을 쓴다.

## 실무에서

- `diff`·`git diff` 의 기본 알고리즘인 Myers 알고리즘은 두 파일의 최단 편집 스크립트(LCS 와 쌍대 문제)를 구한다. git 은 `--diff-algorithm` 으로 myers(기본)·minimal·patience·histogram 을 고를 수 있다.
- 맞춤법 검사·퍼지 검색의 편집 거리(Elasticsearch fuzzy 질의 등), 생물정보학의 서열 정렬(Needleman–Wunsch, Smith–Waterman).
- 음성 인식·형태소 분석의 비터비 알고리즘, 텍스트 줄바꿈(TeX 의 문단 나누기), 쿼리 최적화기의 조인 순서 선택(System R 방식 DP).

> 참고: CLRS 4판 14장 "Dynamic Programming".

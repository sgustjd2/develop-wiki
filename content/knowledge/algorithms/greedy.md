---
title: 그리디 알고리즘
aka: [Greedy Algorithm, 탐욕 알고리즘, 탐욕법, Exchange Argument, Matroid]
category: algorithms
group: algorithm
level: intermediate
summary: 매 단계에서 지금 가장 좋아 보이는 선택을 하고 되돌리지 않는 설계 기법. 빠르고 단순하지만, 그 선택이 전체 최적을 보장한다는 증명이 있을 때만 정답이다.
tags: [greedy, optimization, mst, huffman, scheduling]
related: [algorithms/dynamic-programming, algorithms/union-find, algorithms/shortest-path, algorithms/heap-priority-queue, algorithms/sorting-comparison, algorithms/minimum-spanning-tree, algorithms/p-np-approximation]
sources:
  - https://en.wikipedia.org/wiki/Greedy_algorithm
  - https://en.wikipedia.org/wiki/Huffman_coding
  - https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html
  - https://www.rfc-editor.org/rfc/rfc1951
updatedAt: 2026-11-18
---

## 개념

각 단계에서 **지역적으로 최선인 선택을 확정**하고 다음 부분 문제로 넘어간다. 과거 선택을 다시 보지 않으므로 보통 정렬 + 한 번 훑기, O(n log n) 으로 끝난다.

정답이 되려면 두 성질이 필요하다(CLRS 15장).
1. **그리디 선택 속성**: 지금의 탐욕적 선택을 포함하는 최적해가 존재한다.
2. **최적 부분 구조**: 그 선택 후 남은 문제의 최적해와 합치면 전체 최적해다.

증명은 보통 **교환 논증**으로 한다: 최적해가 그리디와 다른 선택을 했다면, 그 선택을 그리디 선택으로 바꿔도 손해가 없음을 보이고 귀납한다. 이론적으로는 문제가 **매트로이드** 구조면 가중치 그리디가 최적이다(Edmonds).

## 예 1: 회의실 배정 (활동 선택)

겹치지 않게 최대한 많은 회의를 넣는다. **끝나는 시각이 빠른 순**으로 고르면 최적이다(일찍 끝날수록 남은 시간이 많다는 교환 논증).

```ts
function maxMeetings(meetings: ReadonlyArray<[start: number, end: number]>): number {
  let count = 0, lastEnd = -Infinity;
  for (const [s, e] of [...meetings].sort((a, b) => a[1] - b[1])) {
    if (s >= lastEnd) { count++; lastEnd = e; }
  }
  return count;
}
console.log(maxMeetings([[1, 4], [3, 5], [0, 6], [5, 7], [8, 9], [5, 9]])); // 3
```

"시작이 빠른 순"이나 "짧은 순"은 반례가 있다. **어떤 기준으로 정렬하느냐**가 그리디의 전부다.

## 예 2: 그리디가 틀리는 경우 — 동전 거스름돈

```ts
function greedyCoins(coins: readonly number[], amount: number): number {
  let n = 0;
  for (const c of [...coins].sort((a, b) => b - a)) { n += Math.floor(amount / c); amount %= c; }
  return amount === 0 ? n : -1;
}
function dpCoins(coins: readonly number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}
console.log(greedyCoins([1, 3, 4], 6), dpCoins([1, 3, 4], 6)); // 3 (4+1+1) vs 2 (3+3)
```

한국·미국 화폐 단위처럼 그리디가 통하는 "정규" 동전 체계도 있지만, 임의의 단위에서는 [동적 계획법](/develop-wiki/knowledge/algorithms/dynamic-programming/)이 필요하다.

## 대표 그리디 알고리즘

| 문제 | 그리디 기준 | 시간 |
| --- | --- | --- |
| 활동 선택 | 끝나는 시각 오름차순 | O(n log n) |
| 크루스칼 MST | 가벼운 간선부터, 사이클 안 만들면 채택 | O(E log E) |
| 프림 MST | 트리에 붙은 가장 가벼운 간선 | O(E log V) |
| 다익스트라 | 가장 가까운 미확정 정점 확정 | O((V+E) log V) |
| 허프만 부호 | 가장 빈도 낮은 두 노드 병합 | O(n log n) |
| 분할 가능 배낭 | 무게당 가치 내림차순 | O(n log n) |
| 마감 기한 스케줄링(최대 지연 최소화) | 마감 빠른 순(EDF) | O(n log n) |

## 언제 쓰나

- 위 표처럼 정당성이 증명된 문제.
- 정확한 최적이 필요 없고 빠른 근사가 필요할 때: 집합 덮개(로그 근사), 빈 패킹(First Fit Decreasing), 작업 배치. NP-난해 문제의 실무 해법 대부분이 그리디 + 국소 개선이다.
- 온라인 결정(미래를 모름): 캐시 교체, 로드 밸런서의 최소 연결 선택.

## 주의

- **"그럴듯해 보이면 맞다"가 아니다.** 증명이나 반례 탐색 없이 쓰면 틀린 답을 낸다. 작은 입력에서 완전 탐색·DP 결과와 비교하는 테스트(속성 기반 테스트)가 효과적이다.
- 같은 문제라도 제약이 바뀌면 깨진다: 분할 가능 배낭은 그리디, 0/1 배낭은 DP.
- 근사 그리디는 최적과의 차이(근사 비율)를 알고 써야 한다.
- 지역 최적에 갇히는 문제(언덕 오르기)는 무작위 재시작·담금질 기법 같은 보완이 필요하다.

## 실무에서

- DEFLATE(RFC 1951, gzip·zlib·PNG)는 허프만 부호를 쓴다. 허프만 트리 구성은 빈도가 가장 낮은 두 노드를 반복해서 합치는 그리디다.
- 네트워크 설계·클러스터링의 MST(크루스칼 + [유니온 파인드](/develop-wiki/knowledge/algorithms/union-find/)), 라우팅의 다익스트라.
- OS·런타임 스케줄러의 EDF(마감 우선), 메모리 할당기의 first-fit/best-fit, 쿠버네티스 스케줄러의 노드 점수화 후 최고점 선택.

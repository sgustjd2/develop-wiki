---
title: 투 포인터와 슬라이딩 윈도우
aka: [Two Pointers, Sliding Window, Monotonic Deque, Fast and Slow Pointers, 투 포인터, 슬라이딩 윈도우]
category: algorithms
group: algorithm
level: beginner
summary: 두 인덱스를 한 방향으로만 움직여 이중 루프 O(n²) 탐색을 O(n)으로 줄이는 기법. 연속 구간(윈도우)의 합·개수·최댓값을 다루는 문제에 쓴다.
tags: [two-pointers, sliding-window, monotonic-deque, subarray]
related: [algorithms/stack-queue-deque, algorithms/binary-search, algorithms/sorting-comparison, algorithms/linked-list, algorithms/space-time-tradeoff]
sources:
  - https://cp-algorithms.com/data_structures/stack_queue_modification.html
  - https://en.wikipedia.org/wiki/Cycle_detection
  - https://en.wikipedia.org/wiki/Moving_average
updatedAt: 2026-11-18
---

## 문제

"합이 S 이상인 가장 짧은 연속 구간", "중복 없는 가장 긴 부분 문자열" 같은 문제를 모든 (시작, 끝) 쌍으로 풀면 O(n²) 이다. 그런데 이런 문제는 **구간을 넓히면 조건이 단조롭게 변한다**는 구조가 있다.

## 해법

### 1. 같은 방향 투 포인터 = 슬라이딩 윈도우

`right` 를 늘려 원소를 넣고, 조건이 깨지거나 충족되면 `left` 를 늘려 뺀다. 두 포인터 모두 **뒤로 가지 않으므로** 전체 이동 횟수는 최대 2n.

```ts
// 합이 target 이상인 가장 짧은 연속 구간의 길이 (원소는 양수)
function minWindowSum(xs: readonly number[], target: number): number {
  let best = Infinity, sum = 0, left = 0;
  for (let right = 0; right < xs.length; right++) {
    sum += xs[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= xs[left++];
    }
  }
  return best === Infinity ? 0 : best;
}

// 같은 문자가 없는 가장 긴 부분 문자열 길이
function longestUnique(s: string): number {
  const last = new Map<string, number>();
  let best = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    const prev = last.get(s[right]);
    if (prev !== undefined && prev >= left) left = prev + 1;
    last.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(minWindowSum([2, 3, 1, 2, 4, 3], 7), longestUnique("abcabcbb")); // 2 3
```

### 2. 양끝에서 좁혀 오는 투 포인터

정렬된 배열에서 "합이 target 인 두 수": 합이 작으면 왼쪽을, 크면 오른쪽을 움직인다. O(n), 추가 메모리 O(1).

```ts
function pairWithSum(sorted: readonly number[], target: number): [number, number] | null {
  let i = 0, j = sorted.length - 1;
  while (i < j) {
    const s = sorted[i] + sorted[j];
    if (s === target) return [i, j];
    if (s < target) i++; else j--;
  }
  return null;
}
```

### 3. 단조 덱: 윈도우 최댓값

크기 k 윈도우의 최댓값을 매번 다시 구하면 O(nk). 덱에 **값이 감소하는 순서의 인덱스**만 유지하면 각 원소가 한 번 들어가고 한 번 나가 O(n) 이다.

```ts
function windowMax(xs: readonly number[], k: number): number[] {
  const dq: number[] = []; // 인덱스. 앞에서 빼는 일이 잦다면 진짜 덱을 쓴다
  let head = 0;
  const out: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    while (dq.length > head && xs[dq[dq.length - 1]] <= xs[i]) dq.pop();
    dq.push(i);
    if (dq[head] <= i - k) head++; // 윈도우 밖으로 나감
    if (i >= k - 1) out.push(xs[dq[head]]);
  }
  return out;
}
console.log(windowMax([1, 3, -1, -3, 5, 3, 6, 7], 3)); // [3, 3, 5, 5, 6, 7]
```

### 4. 빠른/느린 포인터

연결 리스트에서 한 칸·두 칸씩 이동하는 포인터가 만나면 사이클이 있다(Floyd 의 토끼와 거북이). 중간 노드 찾기에도 쓴다.

## 복잡도

| 패턴 | 순진한 방법 | 투 포인터 |
| --- | --- | --- |
| 조건 만족 최단/최장 구간 | O(n²) | O(n) |
| 정렬 배열 두 수의 합 | O(n²) | O(n) (+정렬 O(n log n)) |
| 크기 k 윈도우 최댓값 | O(nk) | O(n), 덱 O(k) 공간 |
| 사이클 검출 | O(n) 공간(방문 집합) | O(1) 공간 |

## 언제 쓰나

- **연속** 구간에 대한 질의이고, 구간을 넓히면 조건이 한 방향으로만 변할 때(단조성).
- 정렬된 두 배열 병합·교집합, 정렬된 배열의 쌍 찾기.
- 스트림 처리: 최근 N 개·최근 T 초 집계(이동 평균, 이동 최댓값).

## 주의

- **단조성이 없으면 안 된다.** 음수가 섞인 배열에서 "합이 S 이상인 최단 구간"은 위 방법이 틀린다(누적 합 + 단조 덱 등 다른 방법 필요).
- 연속이 아닌 부분 수열 문제는 투 포인터가 아니라 [DP](/develop-wiki/knowledge/algorithms/dynamic-programming/) 대상인 경우가 많다.
- `left` 를 이동할 때 상태(합, 빈도 맵)를 정확히 되돌리는 것을 잊기 쉽다. 빈도 맵에서 0 이 된 키를 지우지 않으면 "서로 다른 문자 수" 계산이 틀린다.

## 실무에서

- 레이트 리미터의 슬라이딩 윈도우 로그/카운터: 최근 T 초 안의 요청 타임스탬프를 큐로 유지하고 오래된 것을 앞에서 버린다.
- 모니터링 시스템의 이동 평균·이동 최댓값(최근 5분 p99 등), 이상 탐지의 롤링 통계.
- 정렬 병합 조인(sort-merge join)은 정렬된 두 입력을 투 포인터로 훑는다.

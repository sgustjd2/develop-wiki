---
title: 이분 탐색
aka: [Binary Search, Bisection, Lower Bound, Upper Bound, Parametric Search, 이진 탐색, 매개 변수 탐색]
category: algorithms
group: algorithm
level: beginner
summary: 정렬된 범위나 단조로운 조건에서 탐색 구간을 매번 절반으로 줄여 O(log n)에 답을 찾는 기법. 경계(lower/upper bound) 찾기와 "답을 이분 탐색"하는 응용이 핵심이다.
tags: [binary-search, bisect, lower-bound, monotonic]
related: [algorithms/sorting-comparison, algorithms/b-tree, algorithms/two-pointers-sliding-window, algorithms/big-o-complexity]
sources:
  - https://cp-algorithms.com/num_methods/binary_search.html
  - https://research.google/blog/extra-extra-read-all-about-it-nearly-all-binary-searches-and-mergesorts-are-broken/
  - https://docs.python.org/3/library/bisect.html
  - https://git-scm.com/docs/git-bisect
updatedAt: 2026-11-18
---

## 문제

정렬된 100만 개 중 하나를 찾는데 처음부터 훑으면 최대 100만 번 비교한다. 정렬돼 있다는 정보를 쓰면 20번이면 된다.

## 해법: "참/거짓이 한 번만 바뀌는 조건"의 경계 찾기

값을 찾는 것보다 **경계를 찾는 형태**로 외우는 편이 버그가 적다. 조건 `ok(i)` 가 `F F F … F T T … T` 처럼 단조일 때, 처음으로 T 가 되는 위치를 찾는다.

```ts
// [lo, hi) 에서 pred 가 처음으로 true 가 되는 인덱스. 없으면 hi.
// 불변식: lo 왼쪽은 모두 false, hi 이상은 모두 true
function firstTrue(lo: number, hi: number, pred: (i: number) => boolean): number {
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1); // (lo + hi) / 2 의 오버플로 방지 습관
    if (pred(mid)) hi = mid; else lo = mid + 1;
  }
  return lo;
}

// x 이상인 첫 위치 (C++ lower_bound, Python bisect_left)
const lowerBound = (a: readonly number[], x: number) => firstTrue(0, a.length, (i) => a[i] >= x);
// x 초과인 첫 위치 (upper_bound, bisect_right)
const upperBound = (a: readonly number[], x: number) => firstTrue(0, a.length, (i) => a[i] > x);

const a = [1, 3, 3, 3, 7, 9];
console.log(lowerBound(a, 3), upperBound(a, 3)); // 1 4 → 3 은 3개 (4 - 1)
console.log(lowerBound(a, 4));                  // 4 → 없으면 삽입 위치
```

### 응용: 답을 이분 탐색 (매개 변수 탐색)

"조건을 만족하는 최소 x"를 직접 구하기 어렵지만, **x 가 주어졌을 때 가능한지 판정**은 쉬운 문제가 많다. 판정이 x 에 대해 단조면 x 를 이분 탐색한다.

```ts
// 작업들을 순서대로 k 대 서버에 연속 구간으로 나눌 때, 서버당 최대 부하의 최솟값
function minMaxLoad(jobs: readonly number[], k: number): number {
  const canFit = (cap: number): boolean => {
    let servers = 1, cur = 0;
    for (const j of jobs) {
      if (j > cap) return false;
      if (cur + j > cap) { servers++; cur = 0; }
      cur += j;
    }
    return servers <= k;
  };
  const total = jobs.reduce((s, j) => s + j, 0);
  return firstTrue(0, total + 1, canFit); // cap 이 커질수록 canFit 은 F…F T…T
}
console.log(minMaxLoad([7, 2, 5, 10, 8], 2)); // 18
```

실수 범위에서는 반복 횟수를 고정(예: 100회)하거나 오차 기준으로 멈춘다.

## 복잡도

| 항목 | 값 |
| --- | --- |
| 시간 | O(log n) 비교 (n = 구간 크기) |
| 답 이분 탐색 | O(log(답 범위) × 판정 비용) |
| 공간 | O(1) (반복문) |
| 전제 | 정렬 또는 단조성. 정렬 비용 O(n log n) 은 별도 |

## 언제 쓰나

- 정렬된 정적 배열에서 조회·범위 개수 세기(lower/upper bound 차이).
- 시간순 로그·타임스탬프 배열에서 특정 시각 구간 찾기.
- "최소 용량", "최대 최솟값"류 최적화 → 판정 함수 + 이분 탐색.
- 원인 커밋 찾기, 설정 값 튜닝처럼 **단조로운 실험**을 반으로 줄여 가기.

## 주의

- **경계 버그가 가장 흔하다.** `lo <= hi` vs `lo < hi`, `hi = mid` vs `hi = mid - 1` 을 섞으면 무한 루프나 한 칸 오차가 난다. 위처럼 반열린 구간 + 불변식 하나로 통일한다.
- **중간값 오버플로**: `(low + high) / 2` 는 고정 폭 정수 언어에서 넘칠 수 있다. Joshua Bloch 가 2006년 JDK `Arrays.binarySearch` 와 *Programming Pearls* 의 구현에서 이 버그를 보고했다. `low + (high - low) / 2` 또는 Java `(low + high) >>> 1`. JS 숫자는 2⁵³ 까지 안전하지만 `|0`, `>>` 를 쓰면 32비트로 잘린다.
- 단조성이 없으면 틀린 답을 조용히 낸다. 판정 함수의 단조성을 먼저 확인한다.
- 데이터가 자주 바뀌면 정렬 유지 비용(O(n) 삽입)이 커진다 → [균형 트리](/develop-wiki/knowledge/algorithms/bst-balanced-tree/)나 [B-트리](/develop-wiki/knowledge/algorithms/b-tree/).
- 작은 배열(수십 개)은 선형 탐색이 분기 예측·캐시 덕에 더 빠를 수 있다.

## 실무에서

- Python `bisect` 모듈은 `bisect_left`/`bisect_right`/`insort` 로 정렬 리스트를 유지한다. Java `Arrays.binarySearch` 는 못 찾으면 `-(삽입 위치) - 1` 을 반환한다.
- `git bisect` 는 good/bad 커밋 사이를 이분 탐색해 회귀를 일으킨 커밋을 찾는다. `git bisect run <script>` 로 자동화된다.
- B-트리 인덱스는 페이지 안의 정렬된 키를 이분 탐색한다 → [B-트리](/develop-wiki/knowledge/algorithms/b-tree/).
- 레이트 리미터·재시도 백오프 튜닝, 부하 테스트에서 "SLO 를 지키는 최대 RPS" 찾기도 같은 사고방식이다.

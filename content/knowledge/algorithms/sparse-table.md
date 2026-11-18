---
title: 희소 테이블 (Sparse Table)
aka: [Sparse Table, Range Minimum Query, RMQ, Static RMQ, Idempotent Range Query, Disjoint Sparse Table]
category: algorithms
group: data-structure
level: intermediate
summary: 길이가 2의 거듭제곱인 모든 구간의 답을 미리 저장해 두고, 겹치는 두 구간으로 min·max·gcd 같은 구간 질의를 O(1)에 답하는 정적 배열용 자료구조. 전처리와 메모리는 O(n log n).
tags: [sparse-table, rmq, range-query, preprocessing, static-array, idempotent]
related: [algorithms/segment-tree-fenwick-tree, algorithms/space-time-tradeoff, algorithms/dynamic-programming, algorithms/binary-search, algorithms/two-pointers-sliding-window, algorithms/union-find]
sources:
  - https://cp-algorithms.com/data_structures/sparse-table.html
updatedAt: 2026-11-19
---

## 문제

배열이 **바뀌지 않고** 질의만 아주 많다. "구간 [l, r] 의 최솟값은?" 같은 질의가 10⁶ 번이다. 질의마다 구간을 훑으면 O(n), [세그먼트 트리](/develop-wiki/knowledge/algorithms/segment-tree-fenwick-tree/)는 O(log n) 이다. 갱신이 필요 없다면 더 줄일 수 있다.

## 해법: 2의 거듭제곱 길이의 답을 전부 저장

`st[k][i]` = 구간 `[i, i + 2^k − 1]` 의 답.

- `st[0][i] = a[i]`
- `st[k][i] = f(st[k-1][i], st[k-1][i + 2^(k-1)])` — 절반 길이 두 구간을 합친다.
- 레벨은 `⌊log₂ n⌋` 까지이므로 시간·메모리 모두 **O(n log n)**.

질의 `[l, r]` 은 `k = ⌊log₂(r − l + 1)⌋` 를 구해 **겹치는 두 구간**으로 덮는다.

```
[l ................ r]
[l .... l+2^k-1]
      [r-2^k+1 .... r]      ← 가운데가 겹침
답 = f(st[k][l], st[k][r - 2^k + 1])
```

겹친 부분이 두 번 계산되어도 결과가 변하지 않으려면 `f(x, x) = x`, 곧 **멱등(idempotent)** 이어야 한다. min, max, gcd, bitwise AND/OR 가 해당한다.

```ts
class SparseTable {
  private st: number[][];
  private lg: number[];
  private f: (x: number, y: number) => number;
  constructor(a: number[], f: (x: number, y: number) => number) {
    this.f = f;
    const n = a.length;
    this.lg = new Array(n + 1).fill(0);
    for (let i = 2; i <= n; i++) this.lg[i] = this.lg[i >> 1] + 1;
    this.st = [a.slice()];
    for (let k = 1; 1 << k <= n; k++) {
      const prev = this.st[k - 1], cur: number[] = [];
      for (let i = 0; i + (1 << k) <= n; i++) cur.push(f(prev[i], prev[i + (1 << (k - 1))]));
      this.st.push(cur);
    }
  }
  // [l, r] 닫힌 구간. f 가 멱등(f(x,x)=x)일 때만 맞다: min, max, gcd
  query(l: number, r: number): number {
    const k = this.lg[r - l + 1];
    return this.f(this.st[k][l], this.st[k][r - (1 << k) + 1]);
  }
}
```

`lg` 배열로 로그를 미리 계산해 질의 중 부동소수 연산을 피한다. 길이 1000 배열에서 무작위 질의 5000개로 완전탐색과 비교하면 **min 은 5000/5000 일치**, 같은 방식으로 합(`+`)을 쓰면 **0/5000** 이다. 겹친 구간을 두 번 더하기 때문이다.

### 멱등이 아닌 질의: 합

합처럼 멱등이 아닌 함수는 겹치지 않는 구간으로 쪼개 답해야 한다. 가장 큰 2의 거듭제곱부터 하나씩 떼어 더하는 방식이며 질의가 **O(log n)** 이다. 합은 [누적합](/develop-wiki/knowledge/algorithms/segment-tree-fenwick-tree/)이 O(1) 로 더 낫다. 임의의 결합 법칙 함수를 O(1) 로 답하는 자료구조로는 **Disjoint Sparse Table** 과 **Sqrt Tree** 가 있다(cp-algorithms 가 언급).

## 비교

| | 희소 테이블 | 세그먼트 트리 | 누적합 |
| --- | --- | --- | --- |
| 갱신 | 불가(전체 재구성) | O(log n) | 불가 |
| 질의 | min·max·gcd O(1) | O(log n) | 합 O(1) |
| 메모리 | O(n log n) | O(n) | O(n) |
| 지원 연산 | 멱등(O(1)) 또는 O(log n) | 결합 법칙을 만족하는 모든 연산 | 합·XOR·곱 등 역원이 있는 연산 |

## 언제 쓰나

- 정적 배열에서 **min/max/gcd 구간 질의가 압도적으로 많을 때**.
- 최소 공통 조상(LCA)을 오일러 투어 + RMQ 로 푸는 곳이나, 접미사 배열의 LCP 질의처럼 RMQ 가 내부 부품일 때(이 두 가지 응용은 널리 알려진 사용처이며, 이 노트는 원전을 열람하지 않았다).
- 이분 탐색·슬라이딩 윈도 등과 조합해 각 후보를 O(1) 로 판정해야 할 때.

## 주의 (비용)

- **O(n log n) 메모리**다. n = 10⁷ 이면 레벨이 약 24개라 32비트 정수 기준 대략 1GB 다(cp-algorithms 는 10⁷ 이하 배열에 K=25 를 권한다). 메모리가 빠듯하면 세그먼트 트리나 블록 분할이 낫다.
- **갱신이 없는 경우에만** 쓴다. 값이 한 칸이라도 바뀌면 전체를 다시 만든다.
- 멱등이 아닌 함수에 O(1) 질의 코드를 그대로 쓰면 **조용히 틀린 답**이 나온다. 위 합 실험이 그 예다.
- 구현에서는 질의 구간이 `l ≤ r` 이고 범위 안에 있는지 호출하는 쪽이 보장해야 한다(위 코드는 검사하지 않는다).

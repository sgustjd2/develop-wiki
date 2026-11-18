---
title: 디스조인트 희소 테이블 (Disjoint Sparse Table)
aka: [Disjoint Sparse Table, DST, O(1) Range Query, Non-idempotent Range Query, 서로소 희소 테이블]
category: algorithms
group: data-structure
level: advanced
summary: 구간 질의의 답을 "블록 중간점에서 양쪽으로 뻗은 누적값"으로 저장해, 합·곱·행렬 곱처럼 멱등이 아닌 결합 연산도 정적 배열에서 O(1) 로 답하는 구조. 전처리·메모리 O(n log n).
tags: [sparse-table, range-query, static-array, associative, prefix-suffix, bit-trick]
related: [algorithms/sparse-table, algorithms/segment-tree-fenwick-tree, algorithms/space-time-tradeoff, algorithms/binary-search, algorithms/dynamic-programming]
sources:
  - https://cp-algorithms.com/data_structures/sparse-table.html
  - https://discuss.codechef.com/t/tutorial-disjoint-sparse-table/17404
updatedAt: 2026-11-19
---

## 문제

[희소 테이블](/develop-wiki/knowledge/algorithms/sparse-table/)은 정적 배열에서 min·max·gcd 질의를 O(1) 에 답하지만, **겹치는 두 구간**으로 덮기 때문에 멱등인 연산(`f(x,x)=x`)에만 맞다. 합이나 곱에 쓰면 겹친 부분이 두 번 반영돼 조용히 틀린다. 갱신이 없는 배열에서 "구간 곱 mod p", "구간 행렬 곱", "구간 문자열 이어붙이기"를 수없이 질의해야 한다면, 세그먼트 트리의 O(log n) 보다 나은 방법이 필요하다. 합은 누적합이 있지만 곱 mod 소수가 아닌 합성수이거나 역원이 없는 연산에는 쓸 수 없다.

## 해법: 겹치지 않는 두 조각의 답을 미리 저장

배열 길이를 2의 거듭제곱 `N` 으로 패딩하고 이진 분할 트리를 생각한다. 각 레벨에서 배열은 길이 `2^(h+1)` 의 블록으로 나뉘고 블록은 중간점 `mid` 를 가진다.

- 블록의 **왼쪽 절반**의 각 위치 `i` 에는 `[i, mid-1]` 의 결과(중간점 방향 접미 누적)를 저장한다.
- **오른쪽 절반**의 각 위치 `i` 에는 `[mid, i]` 의 결과(접두 누적)를 저장한다.

질의 `[l, r]`(`l < r`)에서 핵심은 **두 끝점이 같은 블록 안에서 서로 다른 절반에 놓이는 가장 낮은 레벨**을 찾는 것이다. `l` 과 `r` 이 갈라지는 최상위 비트가 그 레벨이다. `h = (l XOR r)` 의 최상위 비트 위치이고, 이는 하드웨어의 `clz` 명령 한 번이다. 그러면 `l` 은 그 레벨 블록의 왼쪽 절반, `r` 은 오른쪽 절반에 있어 이렇게 답한다.

```
답 = f( table[h][l] , table[h][r] )      // [l, mid-1] 와 [mid, r] — 겹치지 않는다
```

`l = r` 이면 두 값이 갈라지는 비트가 없으므로 `a[l]` 을 그대로 돌려준다.

```ts
class DisjointSparseTable<T> {
  private t: T[][] = []; private a: T[]; private f: (x: T, y: T) => T;
  constructor(a: T[], f: (x: T, y: T) => T) {
    this.a = a.slice(); this.f = f;
    let size = 1; while (size < a.length) size <<= 1;
    for (let h = 0; h < Math.max(1, Math.log2(size)); h++) {
      const row: T[] = new Array(size), half = 1 << h;
      for (let mid = half; mid < size + half; mid += 2 * half) {
        if (mid - 1 >= a.length) continue;                       // 패딩 영역만 덮는 블록은 질의될 일이 없다
        row[mid - 1] = a[mid - 1];
        for (let i = mid - 2; i >= mid - half; i--) row[i] = f(a[i], row[i + 1]);          // 중간점 방향 접미
        for (let i = mid; i < mid + half && i < a.length; i++) row[i] = i === mid ? a[i] : f(row[i - 1], a[i]); // 접두
      }
      this.t.push(row);
    }
  }
  query(l: number, r: number): T {                               // 닫힌 구간
    if (l === r) return this.a[l];
    const h = 31 - Math.clz32(l ^ r);                            // 두 끝점이 갈라지는 최상위 비트 = 레벨
    return this.f(this.t[h][l], this.t[h][r]);                   // 순서 그대로 결합 → 비가환 연산도 맞다
  }
}
```

### 직접 돌려 본 결과

n = 1000(패딩 1024), 무작위 질의 5000개를 선형 계산과 비교했다.

| 연산 | 일치 |
| --- | --- |
| 합 | 5000 / 5000 |
| 곱 mod 10⁹+7 | 5000 / 5000 |
| 2×2 행렬 곱 mod 10⁹+7 (**비가환**) | 5000 / 5000 |
| 문자열 이어붙이기 (**비가환**) | 5000 / 5000 |
| min | 5000 / 5000 |

- 저장 칸 수는 `10 × 1024 = 10240`(레벨 10개), n = 2²⁰ 에서는 20 × n = 20,971,520 칸이었다. 모두 `n log n` 이다.
- 위 구현은 `f(왼쪽, 오른쪽)` 순서를 그대로 지키므로 교환법칙이 필요 없다. 구현에 따라 교환법칙을 암묵적으로 가정하기 쉬운 곳이라 비가환 연산으로 따로 검증했다.

## 비교

| | 희소 테이블 | 디스조인트 희소 테이블 | 세그먼트 트리 | 누적합 |
| --- | --- | --- | --- | --- |
| 질의 | O(1) | O(1) | O(log n) | O(1) |
| 연산 조건 | **멱등** 필요 | 결합 법칙이면 충분 | 결합 법칙 | **역원** 필요(합·XOR) |
| 갱신 | 불가 | 불가 | O(log n) | 불가 |
| 메모리 | O(n log n) | O(n log n) | O(n) | O(n) |

## 언제 쓰나

- 배열이 **고정**이고 질의가 아주 많으며, 연산이 멱등이 아니고 역원도 없을 때(합성수 modulo 곱, 행렬 곱, 함수 합성, 문자열 해시 연결).
- 시간 제한이 빡빡해 O(log n) 이 부담될 때. 참고 자료도 이런 문제가 드물다고 인정한다.

## 주의 (비용)

- **메모리가 n log n** 이고 패딩으로 최대 2배까지 늘 수 있다. n = 10⁷ 이면 레벨이 24~25 개라 희소 테이블과 같은 부담이다.
- **갱신이 없는 경우에만** 쓴다. 한 칸이라도 바뀌면 영향받는 모든 레벨의 누적값이 틀려져 전체를 다시 만든다.
- 연산이 멱등이면 일반 희소 테이블이 더 단순하고 덜 든다. 역원이 있는 연산(합, XOR)이면 누적합이 O(n) 메모리로 같은 O(1) 이다.
- 질의 구간이 `l ≤ r` 이고 범위 안이어야 한다(코드는 검사하지 않는다). `l = r` 특수 처리를 빼먹으면 `clz(0)` 때문에 틀린다.
- 이 구조의 원전 논문은 확인하지 못했고, 위 두 튜토리얼과 cp-algorithms 의 언급을 근거로 썼다. cp-algorithms 가 Sqrt Tree 라는 다른 O(1) 질의 구조도 언급하지만 이 노트는 다루지 않는다.

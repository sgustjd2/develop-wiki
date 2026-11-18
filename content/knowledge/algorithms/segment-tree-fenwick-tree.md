---
title: 세그먼트 트리와 펜윅 트리
aka: [Segment Tree, Fenwick Tree, Binary Indexed Tree, BIT, Range Query, Lazy Propagation, 구간 질의]
category: algorithms
group: data-structure
level: advanced
summary: 배열의 구간 합·최솟값 질의와 값 갱신을 둘 다 O(log n)에 하는 트리 두 가지. 펜윅 트리는 코드가 짧고 합계류에 맞고, 세그먼트 트리는 min·max·구간 갱신까지 일반적으로 다룬다.
tags: [range-query, segment-tree, fenwick-tree, bit, lazy-propagation, prefix-sum]
related: [algorithms/array-dynamic-array, algorithms/big-o-complexity, algorithms/bst-balanced-tree, algorithms/heap-priority-queue, algorithms/space-time-tradeoff, algorithms/union-find, algorithms/binary-search]
sources:
  - https://en.wikipedia.org/wiki/Fenwick_tree
  - https://cp-algorithms.com/data_structures/fenwick.html
  - https://cp-algorithms.com/data_structures/segment_tree.html
  - https://en.wikipedia.org/wiki/Segment_tree
updatedAt: 2026-11-19
---

## 문제

길이 n 배열에서 "구간 [l, r] 의 합(또는 최솟값)"과 "i 번째 값 변경"이 번갈아 수백만 번 온다.

| 방법 | 구간 질의 | 값 갱신 |
| --- | --- | --- |
| 그냥 배열 | O(n) | O(1) |
| 누적합 배열 | O(1) | O(n) (뒤쪽 전부 다시 계산) |
| 펜윅 / 세그먼트 트리 | **O(log n)** | **O(log n)** |

한쪽만 많다면 위 두 방법으로 충분하다. 둘 다 잦을 때 이 트리들이 들어온다. 실시간 순위표(내 앞에 점수 높은 사람 수), 시계열 구간 통계, 재고 구간 조회가 전형이다.

## 펜윅 트리 (Binary Indexed Tree)

Boris Ryabko 가 1989년에 제안했고, Peter Fenwick 이 1994년 적응형 산술 부호화에서 누적 빈도를 구하려고 발표해 그 이름이 붙었다(Wikipedia).

- 1-indexed 배열 `t` 하나만 쓴다(공간 n). `t[i]` 는 `i` 에서 끝나는 길이 `lowbit(i)` 짜리 구간의 합이다.
- `lowbit(i) = i & -i`, 즉 가장 낮은 켜진 비트. 이것으로 "다음 담당 칸"을 건너뛴다.
- **갱신**은 `i += lowbit(i)` 로 올라가며 더하고, **접두사 합**은 `i -= lowbit(i)` 로 내려가며 더한다. 구간 합은 접두사 둘의 차다.
- 선형 시간 구축도 가능하다(원소마다 add 하면 O(n log n)).

```ts
class Fenwick {
  private t: number[];
  constructor(private readonly n: number) { this.t = new Array(n + 1).fill(0); } // 1-indexed
  add(i: number, delta: number): void { for (i++; i <= this.n; i += i & -i) this.t[i] += delta; }
  prefix(i: number): number { let s = 0; for (i++; i > 0; i -= i & -i) s += this.t[i]; return s; } // [0..i]
  range(l: number, r: number): number { return this.prefix(r) - (l > 0 ? this.prefix(l - 1) : 0); }
}
```

변형(cp-algorithms):

- **구간 갱신 + 점 질의**: `add(l, +x)`, `add(r+1, −x)` 로 차분을 저장하고 점 값은 접두사 합.
- **구간 갱신 + 구간 질의**: 트리 두 개를 쓴다.
- 2차원 확장으로 2D 접두사 합도 된다.
- **한계**: 구간 질의는 연산에 **역원**이 있어야 한다(합·XOR 은 되고 min·max 는 안 된다). min/max 는 접두사 질의와 값 감소 갱신 정도만 된다.

## 세그먼트 트리

구간을 반씩 쪼갠 이진 트리. 각 노드가 자기 구간의 집계값(합, min, max, gcd, 행렬 곱 …)을 가진다. 필요한 조건은 **결합 법칙이 되는 합성 함수**뿐이다(역원은 필요 없다).

- 일반 구현은 배열 크기 `4n` 을 잡는다. cp-algorithms 는 노드를 오일러 투어 순으로 번호 매기면 `2n` 으로 줄일 수 있다고 소개한다.
- 구축 O(n), 질의·점 갱신 O(log n).
- **지연 전파(lazy propagation)**: "구간 [l, r] 전체에 +v" 같은 구간 갱신을 O(log n) 에 하려고, 노드에 "자식에게 아직 안 내려준 작업"을 적어 두고 필요할 때만 `push` 한다.

```ts
// 구간 최솟값 + 구간 덧셈(지연 전파)
class SegTree {
  private mn: number[]; private lz: number[];
  constructor(private readonly n: number, init: number[]) {
    this.mn = new Array(4 * n).fill(0); this.lz = new Array(4 * n).fill(0);
    this.build(1, 0, n - 1, init);
  }
  private build(x: number, l: number, r: number, a: number[]): void {
    if (l === r) { this.mn[x] = a[l]; return; }
    const m = (l + r) >> 1;
    this.build(2 * x, l, m, a); this.build(2 * x + 1, m + 1, r, a);
    this.mn[x] = Math.min(this.mn[2 * x], this.mn[2 * x + 1]);
  }
  private apply(x: number, v: number): void { this.mn[x] += v; this.lz[x] += v; }
  private push(x: number): void {
    if (this.lz[x] !== 0) { this.apply(2 * x, this.lz[x]); this.apply(2 * x + 1, this.lz[x]); this.lz[x] = 0; }
  }
  addRange(ql: number, qr: number, v: number, x = 1, l = 0, r = this.n - 1): void {
    if (qr < l || r < ql) return;
    if (ql <= l && r <= qr) { this.apply(x, v); return; }
    this.push(x);
    const m = (l + r) >> 1;
    this.addRange(ql, qr, v, 2 * x, l, m); this.addRange(ql, qr, v, 2 * x + 1, m + 1, r);
    this.mn[x] = Math.min(this.mn[2 * x], this.mn[2 * x + 1]);
  }
  minRange(ql: number, qr: number, x = 1, l = 0, r = this.n - 1): number {
    if (qr < l || r < ql) return Infinity;
    if (ql <= l && r <= qr) return this.mn[x];
    this.push(x);
    const m = (l + r) >> 1;
    return Math.min(this.minRange(ql, qr, 2 * x, l, m), this.minRange(ql, qr, 2 * x + 1, m + 1, r));
  }
}
```

위 두 클래스를 `tsc --strict` 로 컴파일해, 무작위 연산 수천 번을 브루트포스(`slice().reduce`, `Math.min(...)`)와 비교했을 때 불일치는 0이었다.

- **영속(persistent) 세그먼트 트리**: 포인터 기반으로 만들고 갱신 때마다 O(log n) 개 노드만 새로 만들면 과거 버전에도 질의할 수 있다(cp-algorithms).
- 좌표가 너무 크면 **동적 생성(희소) 세그먼트 트리**나 좌표 압축을 쓴다.

## 비교

| | 펜윅 | 세그먼트 트리 |
| --- | --- | --- |
| 공간 | n | 2n ~ 4n |
| 코드 | 매우 짧다 | 길다 |
| 연산 조건 | 역원 필요(합, XOR) | 결합 법칙이면 됨(min, max, gcd …) |
| 구간 갱신 | 합계에 한해 트릭 가능 | 지연 전파로 일반 지원 |
| 상수 | 작다 | 크다 |
| 확장 | k번째 원소 찾기(이진 올리기) | 트리 위 이분 탐색, 영속, 2D |

경쟁 프로그래밍에서 "segment tree"는 위의 구간 질의 트리를 가리키지만, Wikipedia 의 Segment tree 문서는 Bentley(1977)가 만든 다른 구조를 다룬다. **구간(interval) 집합에서 점을 포함하는 구간을 모두 찾는 "stabbing query"용** 트리로, 질의 O(log n + k), 저장 O(n log n)이다. 이름이 같아도 용도가 다르니 자료를 찾을 때 구분한다.

## 언제 쓰나

- 갱신과 구간 질의가 모두 잦은 배열: 순위·백분위, 구간 합 통계, 구간 최대 가격.
- 접두사 개수 세기: "나보다 앞선 값 중 나보다 작은 것의 개수"(역순서쌍 세기)를 펜윅으로 푼다.
- 구간 일괄 갱신 + 질의(세그먼트 트리 + 지연 전파).

## 주의

- 질의가 갱신보다 압도적으로 많고 데이터가 거의 안 변하면 누적합이나 희소 표(sparse table, min/max 질의 O(1))가 더 빠르다.
- 데이터가 디스크에 있다면 이진 트리 대신 [B 트리](/develop-wiki/knowledge/algorithms/b-tree/)나 [LSM 트리](/develop-wiki/knowledge/algorithms/lsm-tree/)와 보조 집계를 고려한다.
- 인덱스 변환 실수가 가장 흔한 버그다(0/1 기반, 닫힌/열린 구간). 브루트포스와 무작위 비교 테스트를 반드시 둔다.
- 지연 전파는 `push` 순서와 "집계값 재계산" 누락이 단골 실수다. 갱신 후 부모를 다시 합성하는 줄을 빠뜨리지 않는다.
- 재귀 구현은 깊이가 log n 이라 안전하지만 상수가 크다. 느리면 아래서 위로 가는 반복형을 쓴다.
- 부동소수점 합은 갱신을 반복하면 오차가 누적된다. 정수(고정 소수)로 다룬다.

## 실무에서

- 펜윅 트리의 원래 용도는 산술 부호화·적응형 압축기에서 심볼 누적 빈도를 갱신하며 조회하는 것이다(Wikipedia).
- 알고리즘 대회와 코딩 테스트에서 구간 질의 문제의 표준 도구다.
- 서비스 코드에서는 직접 구현하기보다 DB 의 윈도 함수·집계 인덱스, 또는 순위 기능을 가진 저장소(예: 정렬된 집합 자료구조)를 먼저 검토한다. 메모리 안에서 갱신과 구간 집계가 모두 핫패스일 때만 이 트리를 직접 쓴다.

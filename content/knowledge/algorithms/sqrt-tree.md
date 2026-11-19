---
title: 제곱근 트리 (Sqrt Tree)
aka: [Sqrt Tree, O(1) Range Query, Non-idempotent Range Query, 제곱근 분할 트리]
category: algorithms
group: data-structure
level: advanced
summary: 배열을 √n 크기 블록으로 재귀 분할하고 블록별 접두·접미 누적과 블록 구간표를 저장해, 결합 법칙만 성립하는 연산의 구간 질의를 O(1) 에 답하는 구조. 전처리·메모리는 O(n log log n).
tags: [sqrt-tree, range-query, static-array, associative, sqrt-decomposition, bit-trick]
related: [algorithms/disjoint-sparse-table, algorithms/sparse-table, algorithms/segment-tree-fenwick-tree, algorithms/space-time-tradeoff, algorithms/binary-search, cs-fundamentals/cpu-cache-locality]
sources:
  - https://cp-algorithms.com/data_structures/sqrt-tree.html
updatedAt: 2026-11-19
---

## 문제

배열 `a` 와 결합 법칙을 만족하는 연산 `∘`(합, 곱, xor, gcd, 행렬 곱 …)이 있고 구간 질의 `a[l] ∘ … ∘ a[r]` 을 많이 받는다. [희소 테이블](/develop-wiki/knowledge/algorithms/sparse-table/)은 질의 O(1) 이지만 겹치는 두 구간을 쓰므로 min·max·gcd 처럼 **멱등**일 때만 된다. [디스조인트 희소 테이블](/develop-wiki/knowledge/algorithms/disjoint-sparse-table/)은 멱등이 아니어도 O(1) 이지만 메모리가 `O(n log n)` 이다. 제곱근 트리는 질의 O(1) 을 지키면서 메모리를 `O(n log log n)` 으로 줄이려는 구조다. 이 절의 구조 설명은 cp-algorithms 의 서술을 따른다.

## 해법

### 한 층: 접두·접미·블록 구간표

배열을 크기 √n 블록 √n 개로 나누고 각 블록에 대해 다음을 계산한다.

- `prefixOp`: 블록 시작부터 각 위치까지의 누적
- `suffixOp`: 각 위치부터 블록 끝까지의 누적
- `between[i][j]`: 블록 `i` 시작부터 블록 `j` 끝까지의 답(`i ≤ j`). 블록이 √n 개라 크기 O(n)

`{1,…,9}`, 연산 합으로 블록 `{1,2,3} {4,5,6} {7,8,9}` 를 만들면 `between` 은 `[[6,21,45],[·,15,39],[·,·,24]]` 다. 질의가 서로 다른 블록에 걸치면 (왼쪽 블록의 접미) ∘ (사이 블록들의 `between`) ∘ (오른쪽 블록의 접두) 로 답한다. 한 블록 안에 들어가는 질의는 이 세 배열로 못 답한다.

### 재귀: 블록 안에 같은 구조를 또 만든다

각 블록에도 같은 구조를 만든다. 크기 `k` 마디가 √k 개의 자식을 갖고, 길이 1~2 가 되면 멈춘다. 층마다 크기가 제곱근으로 줄어 높이는 `O(log log n)`, 각 원소가 층마다 한 마디에만 들어 있어 시간·메모리는 `O(n log log n)` 이다. 이 상태에서 질의는 내려가며 찾아 `O(log log n)`, 이분 탐색으로 층을 고르면 `O(log log log n)` 이다.

### O(1) 로: 층을 비트 연산으로 고른다

크기를 2의 거듭제곱으로 맞추고(0 원소로 패딩) 각 층의 블록 크기도 2의 거듭제곱, 층 안의 블록은 모두 같은 크기로 둔다. 그러면 두 인덱스 `l`, `r` 이 같은 크기 `2^k` 블록에 있는지는 `l xor r` 이 `2^k − 1` 을 넘지 않는지로 안다. 예를 들어 `l = 39 = 100111₂`, `r = 46 = 101110₂` 이면 `l xor r = 001001₂` 라 최상위 켜진 비트는 3 이고, 크기 16 블록 안에 둘 다 있다. 최상위 비트 위치를 미리 계산한 표로 구해 **답할 층을 상수 시간에** 고르면 질의가 O(1) 이다.

```ts
// 질의 (정적 구조; 층 j 의 블록 크기 2^bl, 마디 크기 2^k)
function query(l: number, r: number): number {
  if (l === r) return a[l];
  const h = 31 - Math.clz32(l ^ r);          // 두 인덱스가 갈라지는 최상위 비트
  const j = layerOfBit[h], k = ks[j];        // 그 비트를 블록 경계로 가진 층
  const bl = k === 1 ? 0 : Math.ceil(k / 2);
  const start = (l >> k) << k, cnt = 1 << (k - bl);
  const bi = (l - start) >> bl, bj = (r - start) >> bl;
  let res = suf[j][l];                        // 왼쪽 블록의 접미
  if (bj - bi > 1) res = op(res, between[j][start][(bi + 1) * cnt + (bj - 1)]); // 사이 블록
  return op(res, pre[j][r]);                  // 오른쪽 블록의 접두
}
```

### 갱신

cp-algorithms 는 단일 원소 갱신을 `O(√n)` 에 한다고 설명한다. 루트의 `between` 표 대신 블록 단위의 또 다른 제곱근 트리 `index` 를 두는 방식이다(`between` 전체를 다시 계산하는 `O(n)` 이 병목이기 때문). 구간 갱신도 지원한다고 한다. 이 노트는 **갱신을 구현하지 않았고 검증하지 않았다.**

## 직접 구현해 확인한 것

정적 구조(갱신 없음)를 TypeScript 로 구현해 실행했다.

- **정확성**: 길이 1~5000 배열에서 합·최솟값 구간 질의 36,000건을 브루트포스와 비교해 불일치 0.
- **메모리(저장 셀 수 / n)**: 층마다 접두·접미로 원소당 2칸이 들고 루트 `between` 이 더해진다.

| n | 층 수 | 제곱근 트리 셀/n | 디스조인트 희소 테이블 셀/n |
| --- | --- | --- | --- |
| 2^10 | 5 | 15.00 | 10 |
| 2^16 | 5 | 16.00 | 16 |
| 2^20 | 6 | 18.00 | 20 |
| 2^30 | 6 | 18.50 | 30 |
| 2^60 | 7 | 21.50 | 60 |

점근적으로는 `log log n` 이 이기지만 **층당 상수 2 때문에 n 이 대략 2^16~2^20 이 넘어야** 메모리가 줄기 시작한다. 2^30 이하에서 얻는 이득은 최대 40% 안팎이다(위 표는 이 구현의 셀 수이며 실제 바이트가 아니다). 2^30 이상 행은 구조식으로 계산한 값이다.

## 비교

| | 희소 테이블 | 디스조인트 희소 테이블 | 제곱근 트리 | 세그먼트 트리 |
| --- | --- | --- | --- | --- |
| 질의 | O(1) | O(1) | O(1) | O(log n) |
| 연산 조건 | 멱등 | 결합 법칙 | 결합 법칙 | 결합 법칙 |
| 전처리·메모리 | n log n | n log n | n log log n | n |
| 갱신 | 불가 | 불가 | 원소 `O(√n)` | `O(log n)` |

## 언제 쓰나

- 배열이 거의 바뀌지 않고 질의가 매우 많으며, 연산이 멱등이 아니고, n 이 커서 `n log n` 메모리가 부담일 때.
- 알고리즘 대회나 오프라인 처리에서 질의 상수 시간이 필요할 때.

## 주의 (비용)

- **구현이 복잡**하다. 층별 블록 크기, 패딩, 비트 연산, 마디별 표를 다뤄야 해서 희소 테이블·DST 보다 버그가 많다. 위 정확성 검증도 자체 구현에 대한 것이다.
- 메모리 이득은 **n 이 매우 클 때만** 의미가 있다. 보통 크기에서는 단순한 DST 나 [세그먼트 트리](/develop-wiki/knowledge/algorithms/segment-tree-fenwick-tree/)가 낫다.
- 2의 거듭제곱 패딩으로 최대 약 2배까지 늘 수 있다.
- 접근 패턴이 흩어져 [캐시 지역성](/develop-wiki/knowledge/cs-fundamentals/cpu-cache-locality/)이 DST 보다 나쁠 수 있다. 이 노트는 실행 시간을 측정하지 않았다.
- 출처는 cp-algorithms 한 곳이다. 원 제안(Codeforces 블로그)과 논문은 확인하지 못했다.

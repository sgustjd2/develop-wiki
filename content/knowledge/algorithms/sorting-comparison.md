---
title: 정렬 알고리즘 비교 (퀵·병합·힙·팀소트)
aka: [Sorting Algorithms, Quicksort, Merge Sort, Heapsort, Timsort, Powersort, Introsort, 퀵 정렬, 병합 정렬, 힙 정렬]
category: algorithms
group: algorithm
level: intermediate
summary: 대표 비교 정렬 네 가지의 시간·공간·안정성·실제 성능을 비교하고, 언어 표준 라이브러리가 왜 그 알고리즘을 골랐는지 정리한다.
tags: [sorting, quicksort, mergesort, heapsort, timsort, stability]
related: [algorithms/big-o-complexity, algorithms/heap-priority-queue, algorithms/binary-search, algorithms/two-pointers-sliding-window, algorithms/array-dynamic-array, algorithms/external-sort]
sources:
  - https://v8.dev/blog/array-sort
  - https://github.com/python/cpython/blob/main/Objects/listsort.txt
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html
  - https://tc39.es/ecma262/#sec-array.prototype.sort
  - https://en.wikipedia.org/wiki/Timsort
  - https://go.dev/doc/go1.19
  - https://github.com/torvalds/linux/blob/master/lib/sort.c
updatedAt: 2026-11-18
---

## 한눈 비교

| 알고리즘 | 평균 | 최악 | 최선 | 추가 공간 | 안정 | 특징 |
| --- | --- | --- | --- | --- | --- | --- |
| 퀵 정렬 | O(n log n) | O(n²) | O(n log n) | O(log n) 스택 | 아니오 | 캐시 친화, 상수 작음. 피벗이 나쁘면 이차 |
| 병합 정렬 | O(n log n) | O(n log n) | O(n log n) | O(n) | **예** | 연결 리스트·외부 정렬에 적합 |
| 힙 정렬 | O(n log n) | O(n log n) | O(n log n) | **O(1)** | 아니오 | 최악 보장 + 제자리. 캐시 지역성 나쁨 |
| 팀소트 | O(n log n) | O(n log n) | **O(n)** | O(n) | **예** | 이미 정렬된 구간(run)을 활용. 실데이터에 강함 |
| 삽입 정렬 | O(n²) | O(n²) | O(n) | O(1) | 예 | n ≤ 수십이면 가장 빠름 → 다른 정렬의 기저 |

**비교 정렬의 하한**: 원소 비교만으로 정렬하는 알고리즘은 최악 Ω(n log n) 비교가 필요하다(결정 트리 논증, CLRS 8.1). 키가 작은 정수면 계수·기수 정렬로 O(n + k) 가 가능하다.

**안정성**: 같은 키를 가진 원소의 원래 순서가 유지되는가. "이름순 정렬 후 부서순으로 다시 정렬하면 부서 안에서 이름순이 유지된다"가 안정 정렬에서만 성립한다.

## 각 알고리즘의 핵심

```ts
// 퀵 정렬 (Lomuto 분할 + 무작위 피벗). 정렬된 입력에서도 기대 O(n log n)
function quickSort(a: number[], lo = 0, hi = a.length - 1): void {
  while (lo < hi) {
    const r = lo + Math.floor(Math.random() * (hi - lo + 1));
    [a[r], a[hi]] = [a[hi], a[r]];
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
    [a[i], a[hi]] = [a[hi], a[i]];
    // 작은 쪽만 재귀, 큰 쪽은 반복 → 스택 깊이 O(log n)
    if (i - lo < hi - i) { quickSort(a, lo, i - 1); lo = i + 1; }
    else { quickSort(a, i + 1, hi); hi = i - 1; }
  }
}

// 병합 정렬 (안정). 같으면 왼쪽을 먼저 → 안정성
function mergeSort<T>(a: readonly T[], cmp: (x: T, y: T) => number): T[] {
  if (a.length <= 1) return [...a];
  const mid = a.length >> 1;
  const l = mergeSort(a.slice(0, mid), cmp), r = mergeSort(a.slice(mid), cmp);
  const out: T[] = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length) out.push(cmp(l[i], r[j]) <= 0 ? l[i++] : r[j++]);
  return out.concat(l.slice(i), r.slice(j));
}

// 힙 정렬: 최대 힙을 만든 뒤 루트를 끝으로 보내기를 반복 (제자리)
function heapSort(a: number[]): void {
  const down = (i: number, n: number): void => {
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < n && a[l] > a[m]) m = l;
      if (r < n && a[r] > a[m]) m = r;
      if (m === i) return;
      [a[i], a[m]] = [a[m], a[i]];
      i = m;
    }
  };
  for (let i = (a.length >> 1) - 1; i >= 0; i--) down(i, a.length);
  for (let end = a.length - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    down(0, end);
  }
}

const xs = [5, 2, 9, 1, 5, 6];
quickSort(xs);
console.log(xs, mergeSort([3, 1, 2], (a, b) => a - b));
```

**팀소트**는 Tim Peters 가 2002년 Python 용으로 만든 하이브리드다.
1. 배열을 훑어 이미 오름차순(또는 엄격한 내림차순을 뒤집은) 구간 **run** 을 찾는다.
2. 너무 짧은 run 은 삽입 정렬로 최소 길이(32~64)까지 늘린다.
3. run 들을 스택에 쌓으며 크기 규칙에 따라 병합한다. 병합 중 한쪽이 연속으로 이기면 **갤로핑**(지수 탐색)으로 한 번에 건너뛴다.

실제 데이터는 부분적으로 정렬된 경우가 많아(로그는 시간순, 기존 정렬 + 몇 개 추가) 비교 횟수가 n log n 보다 훨씬 적게 든다.

## 언어별 표준 정렬

| 언어·API | 알고리즘 | 안정 |
| --- | --- | --- |
| JS `Array.prototype.sort` (V8 7.0+) | 팀소트 | 예 (ES2019 부터 명세가 안정성 요구) |
| Python `list.sort`/`sorted` | 팀소트 계열(병합 정책은 powersort 로 교체) | 예 |
| Java `Arrays.sort(Object[])`, `Collections.sort` | 팀소트 | 예 |
| Java `Arrays.sort(int[])` 등 기본형 | 이중 피벗 퀵 정렬 | 기본형이라 무관 |
| C++ `std::sort` | 대개 인트로소트(퀵 + 힙 + 삽입) | 아니오 (`std::stable_sort` 별도) |
| Go `sort.Slice`/`slices.Sort` | pdqsort (Go 1.19+) | 아니오 (`SliceStable` 별도) |

## 언제 무엇을

- **그냥 표준 라이브러리를 쓴다.** 직접 구현할 이유는 거의 없다.
- 안정성이 필요하면(다단 정렬, UI 표 정렬) 안정 정렬 API 를 확인한다.
- 메모리가 빠듯하고 최악 보장이 필요하면 힙 정렬(임베디드, 커널). Linux 커널의 `sort()` 도 힙 정렬이다.
- 메모리에 안 들어가는 데이터: 청크별 정렬 후 k-way 병합(외부 병합 정렬). DB 의 `ORDER BY` 가 work_mem 을 넘으면 이렇게 한다.
- 상위 k 개만 필요하면 전체 정렬 대신 힙(O(n log k)) 또는 퀵셀렉트(평균 O(n)).
- 정수 키·고정 길이 문자열 대량 정렬: 기수 정렬.

## 주의

- **JS `sort()` 의 기본 비교는 문자열 비교다.** `[10, 9, 1].sort()` → `[1, 10, 9]`. 숫자는 `(a, b) => a - b` 를 넘긴다.
- 비교 함수가 일관되지 않으면(전이성 위반, NaN 포함, 무작위 반환) 결과가 정의되지 않는다. Java 팀소트는 이 경우 `IllegalArgumentException("Comparison method violates its general contract")` 를 던질 수 있다.
- "셔플"을 `sort(() => Math.random() - 0.5)` 로 하면 편향된다. Fisher–Yates 를 쓴다.
- 결정적 피벗(첫 원소)을 쓰는 퀵 정렬은 정렬된 입력·악의적 입력에 O(n²)으로 무너진다. 그래서 실무 구현은 무작위·중앙값 피벗과 힙 정렬 폴백(인트로소트)을 쓴다.
- 객체 정렬은 비교 비용이 지배한다. 키 계산이 비싸면 키를 한 번만 계산해 두고 정렬한다(decorate-sort-undecorate, Python `key=`).

## 실무에서

- V8 블로그에 따르면 V8 은 7.0(Chrome 70)부터 퀵 정렬 대신 안정적인 팀소트를 쓴다.
- CPython `listsort.txt` 는 병합 순서 결정에 Munro·Wild 의 powersort 정책을 쓴다고 설명한다.
- Java 문서는 기본형 배열에 Yaroslavskiy·Bentley·Bloch 의 이중 피벗 퀵 정렬, 객체 배열에 팀소트를 쓴다고 밝힌다. 객체는 안정성이 필요하고 기본형은 같은 값을 구분할 수 없어 안정성이 무의미하기 때문이다.

> 참고: CLRS 4판 2장(삽입·병합), 6장(힙 정렬), 7장(퀵 정렬), 8장(선형 시간 정렬과 하한).

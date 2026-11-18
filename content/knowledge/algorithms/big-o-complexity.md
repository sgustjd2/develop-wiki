---
title: 빅오 표기와 복잡도 분석
aka: [Big O Notation, Asymptotic Analysis, 점근 표기, Time Complexity, 시간 복잡도]
category: algorithms
group: complexity
level: beginner
summary: 입력 크기 n 이 커질 때 실행 시간·메모리가 어떤 속도로 늘어나는지를 상수와 작은 항을 버리고 비교하는 표기법과, 코드에서 그 값을 읽어 내는 방법.
tags: [complexity, big-o, analysis, fundamentals]
related: [algorithms/amortized-analysis, algorithms/space-time-tradeoff, algorithms/sorting-comparison, algorithms/hash-table, algorithms/p-np-approximation]
sources:
  - https://en.wikipedia.org/wiki/Big_O_notation
  - https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
  - https://en.wikipedia.org/wiki/Introduction_to_Algorithms
updatedAt: 2026-11-18
---

## 문제

"이 함수가 빠른가?"는 기계·언어·입력에 따라 답이 바뀐다. 데이터가 10배, 1000배로 늘었을 때 **얼마나 나빠지는지**를 기계와 무관하게 말할 공통 언어가 필요하다.

## 정의

- `f(n) = O(g(n))`: 충분히 큰 n 에서 어떤 상수 c 에 대해 `f(n) ≤ c·g(n)`. **상한**이다.
- `f(n) = Ω(g(n))`: 같은 식으로 **하한**. (Knuth 의 정의: `g = O(f)` 와 같은 뜻)
- `f(n) = Θ(g(n))`: 상한과 하한이 같은 차수. "정확히 이 속도로 자란다".
- `f(n) = o(g(n))`: `f/g → 0`. g 가 f 보다 **확실히** 빨리 자란다.

O 기호는 Bachmann(1894)이 도입했고 Landau 가 확장했으며, Knuth 가 1976년 무렵 컴퓨터 과학에서 Ω·Θ 와 함께 쓰도록 정리했다. 실무에서 "O(n log n)"이라고 말할 때는 대개 Θ 를 뜻한다.

`=` 는 등호가 아니라 관례적 표기다. `n = O(n²)` 은 참이지만 `n² = O(n)` 은 거짓이다.

## 자주 만나는 차수

| 차수 | 이름 | n=10⁶ 일 때 대략 연산 수 | 예 |
| --- | --- | --- | --- |
| O(1) | 상수 | 1 | 배열 인덱스, 해시 조회(평균) |
| O(log n) | 로그 | 20 | 이분 탐색, 균형 트리 조회 |
| O(n) | 선형 | 10⁶ | 배열 한 번 훑기 |
| O(n log n) | 선형 로그 | 2×10⁷ | 비교 정렬의 하한 |
| O(n²) | 이차 | 10¹² | 이중 루프 전체 쌍 비교 |
| O(2ⁿ) | 지수 | 사실상 불가 | 부분집합 전수 조사 |
| O(n!) | 팩토리얼 | 사실상 불가 | 순열 전수 조사 |

경험칙: 단순 연산 기준 초당 10⁸ 회 정도라고 보면, n=10⁶ 에서 O(n log n) 은 즉시, O(n²) 은 수 시간이다.

## 코드에서 읽는 법

1. **순차 실행은 더한다**, 그리고 큰 항만 남긴다: `O(n) + O(n²) = O(n²)`.
2. **중첩 루프는 곱한다**: 바깥 n 번 × 안쪽 m 번 = `O(n·m)`.
3. **매번 절반으로 줄면 log**: `while (n > 1) n = n / 2` 은 `O(log n)`.
4. **재귀는 점화식**으로 쓴다: 병합 정렬 `T(n) = 2T(n/2) + O(n)` → `O(n log n)` (CLRS 의 마스터 정리).
5. **숨은 비용을 센다**: 루프 안의 `array.includes`, `indexOf`, `slice`, 문자열 `+=` 는 각각 O(n) 일 수 있다.

```ts
// O(n²): 루프 안의 includes 가 매번 O(n)
function hasDuplicateSlow(xs: number[]): boolean {
  for (let i = 0; i < xs.length; i++) {
    if (xs.slice(i + 1).includes(xs[i])) return true;
  }
  return false;
}

// O(n) 평균: Set 조회가 평균 O(1)
function hasDuplicate(xs: number[]): boolean {
  const seen = new Set<number>();
  for (const x of xs) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
```

## 최악·평균·상각은 다른 질문이다

| 구분 | 질문 | 예 |
| --- | --- | --- |
| 최악 | 가장 나쁜 입력에서? | 퀵 정렬 O(n²) |
| 평균(기대) | 입력·난수 분포에 대한 기댓값은? | 퀵 정렬 O(n log n), 해시 조회 O(1) |
| 상각 | 연산을 **연달아** 했을 때 1회당 평균은? | 동적 배열 push O(1) → [상각 분석](/develop-wiki/knowledge/algorithms/amortized-analysis/) |

"해시 테이블은 O(1)"은 평균 이야기이고 최악은 O(n)이다. 어떤 의미의 O 인지 같이 말해야 오해가 없다.

## 언제 쓰나

- 자료구조·알고리즘을 고를 때 1차 필터로: 데이터 규모를 보고 "이 차수면 감당되나"를 먼저 따진다.
- 코드 리뷰에서 루프 안 숨은 선형 연산(N+1 쿼리 포함)을 찾을 때.
- 공간 복잡도도 같은 표기로 따진다(재귀 깊이, 보조 배열).

## 주의

- **상수는 실제로 중요하다.** n 이 작으면 O(n²) 삽입 정렬이 O(n log n) 보다 빠르다(그래서 팀소트·퀵 정렬 구현이 작은 구간에 삽입 정렬을 쓴다). 캐시 지역성 차이는 같은 O 안에서 수 배 차이를 만든다.
- **n 이 무엇인지 밝힌다.** 그래프는 `O(V + E)`, 문자열 검색은 `O(n + m)` 처럼 변수가 여럿이다.
- 빅오는 "규모가 커질 때의 경향"이지 벤치마크가 아니다. 최종 판단은 실제 데이터로 잰다.
- 점근적으로 더 좋은 알고리즘이 실용 규모에선 상수가 너무 커서 쓰이지 않는 경우도 있다.

## 실무에서

- DB 실행 계획의 Seq Scan(O(n)) vs Index Scan(O(log n) + 결과 수) 선택이 바로 이 비교다 → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).
- ORM 의 N+1 문제는 "루프 안 O(1) 처럼 보이는 호출이 실제로는 네트워크 왕복"인 숨은 비용 사례다 → [N+1](/develop-wiki/knowledge/data-modeling/n-plus-one/).
- 언어 표준 라이브러리 문서는 연산별 복잡도를 명시하는 경우가 많다(예: Java `ArrayList`, Python `collections.deque`). 문서에 적힌 보장을 먼저 확인한다.

> 참고: CLRS(Cormen·Leiserson·Rivest·Stein, *Introduction to Algorithms*, 4판, MIT Press 2022) 3장 "Characterizing Running Times", 4장 분할 정복과 마스터 정리. MIT 6.006(2020 봄) 강의.

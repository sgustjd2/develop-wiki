---
title: 배열과 동적 배열
aka: [Array, Dynamic Array, Resizable Array, ArrayList, Vector, 가변 배열]
category: algorithms
group: data-structure
level: beginner
summary: 원소를 메모리에 연속으로 놓아 인덱스로 O(1) 접근하는 기본 자료구조와, 용량을 배수로 늘려 끝 추가를 상각 O(1)로 만드는 동적 배열.
tags: [array, dynamic-array, memory, cache-locality]
related: [algorithms/amortized-analysis, algorithms/linked-list, algorithms/stack-queue-deque, algorithms/binary-search, algorithms/heap-priority-queue]
sources:
  - https://en.wikipedia.org/wiki/Dynamic_array
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html
  - https://docs.python.org/3/library/collections.html#collections.deque
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
updatedAt: 2026-11-18
---

## 개념

- **배열**: 같은 크기의 칸이 메모리에 **연속**으로 놓인다. i 번째 주소 = 시작 주소 + i × 칸 크기 이므로 인덱스 접근이 O(1)이다.
- **동적 배열**: 내부에 고정 배열(capacity)을 두고, 꽉 차면 더 큰 배열(보통 1.5~2배)을 새로 잡아 복사한다. 길이(size)와 용량(capacity)이 따로 있다.

## 연산 복잡도

| 연산 | 복잡도 | 비고 |
| --- | --- | --- |
| 인덱스 읽기/쓰기 | O(1) | |
| 끝에 추가 (push) | 상각 O(1) | 확장 순간은 O(n) → [상각 분석](/develop-wiki/knowledge/algorithms/amortized-analysis/) |
| 끝에서 제거 (pop) | O(1) | |
| 앞·중간 삽입/삭제 | O(n) | 뒤 원소를 한 칸씩 민다 |
| 값으로 탐색 | O(n) | 정렬돼 있으면 [이분 탐색](/develop-wiki/knowledge/algorithms/binary-search/) O(log n) |
| 공간 | O(n) | 여유 용량만큼 낭비(최대 약 2배) |

## 구현 스케치

```ts
class Vec<T> {
  private buf: T[];
  private len = 0;
  constructor(capacity = 4) { this.buf = new Array<T>(capacity); }

  get length(): number { return this.len; }

  get(i: number): T {
    if (i < 0 || i >= this.len) throw new RangeError(`index ${i}`);
    return this.buf[i];
  }

  push(x: T): void {
    if (this.len === this.buf.length) this.grow();
    this.buf[this.len++] = x;
  }

  // 중간 삽입: i 이후를 한 칸씩 뒤로 → O(n)
  insert(i: number, x: T): void {
    if (i < 0 || i > this.len) throw new RangeError(`index ${i}`);
    if (this.len === this.buf.length) this.grow();
    for (let k = this.len; k > i; k--) this.buf[k] = this.buf[k - 1];
    this.buf[i] = x;
    this.len++;
  }

  private grow(): void {
    const next = new Array<T>(Math.max(4, this.buf.length * 2));
    for (let k = 0; k < this.len; k++) next[k] = this.buf[k];
    this.buf = next;
  }
}
```

순서가 중요하지 않다면 중간 삭제는 **마지막 원소를 그 자리로 옮기고 pop** 하면 O(1)이다(swap-remove).

## 왜 실무에서 강한가: 캐시 지역성

CPU 는 메모리를 캐시 라인 단위(보통 64바이트)로 읽는다. 연속 배열을 순회하면 한 번 읽은 라인에 다음 원소들이 같이 들어 있고, 하드웨어 프리페처도 잘 맞는다. 그래서 이론상 같은 O(n) 순회라도 배열이 [연결 리스트](/develop-wiki/knowledge/algorithms/linked-list/)보다 훨씬 빠른 경우가 많다. 중간 삽입이 O(n)이어도 원소가 수천 개 이하라면 배열 쪽이 더 빠른 일이 흔하다.

## 언제 쓰나

- 기본값. 순회·인덱스 접근·끝 추가가 대부분인 거의 모든 목록.
- 정렬된 상태로 유지하며 이분 탐색할 정적 데이터.
- 숫자 데이터를 대량으로 다룰 때는 타입 배열(`Float64Array` 등)로 박싱 없이 연속 저장.

## 주의

- 앞쪽 삽입·삭제가 잦으면 O(n)이 누적된다. 큐 용도로 `array.shift()` 를 반복하면 O(n²)이 될 수 있다 → [덱](/develop-wiki/knowledge/algorithms/stack-queue-deque/) 사용.
- 확장 순간의 지연 스파이크와 일시적 2배 메모리. 최종 크기를 알면 미리 용량을 잡는다(Java `new ArrayList<>(n)`, Rust `Vec::with_capacity`, Go `make([]T, 0, n)`).
- 동적 배열의 원소 참조(포인터·이터레이터)는 확장 후 무효가 될 수 있다(C++, Rust, Go slice 의 공유 배열 함정).
- JS 배열은 엔진이 상황에 따라 내부 표현을 바꾼다. 구멍(hole) 있는 배열이나 타입이 섞인 배열은 최적화가 풀릴 수 있다.

## 실무에서

- Java `ArrayList` 문서는 `get`/`set` 이 상수 시간, `add` 가 상각 상수 시간이라고 명시한다.
- Python 문서는 `list` 의 `pop(0)`·`insert(0, v)` 가 O(n) 메모리 이동을 일으키므로 양끝 작업에는 `collections.deque` 를 쓰라고 안내한다.
- 이진 힙, 해시 테이블의 버킷 배열, 그래프의 CSR 표현, 열 지향 DB 의 칼럼 저장 모두 배열 위에 지어진다.

> 참고: CLRS 4판 10장 "Elementary Data Structures", 16장 동적 테이블 분석.

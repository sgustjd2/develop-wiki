---
title: 상각 분석
aka: [Amortized Analysis, 분할 상환 분석, Aggregate Method, Accounting Method, Potential Method]
category: algorithms
group: complexity
level: intermediate
summary: 가끔 비싼 연산이 섞여 있어도 연산을 연속으로 수행했을 때 1회당 비용이 얼마인지를 최악 경우 기준으로 보장하는 분석 방법.
tags: [complexity, amortized, dynamic-array, analysis]
related: [algorithms/big-o-complexity, algorithms/array-dynamic-array, algorithms/hash-table, algorithms/union-find, algorithms/stack-queue-deque]
sources:
  - https://en.wikipedia.org/wiki/Amortized_analysis
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html
  - https://github.com/redis/redis/blob/unstable/src/dict.c
  - https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
updatedAt: 2026-11-18
---

## 문제

동적 배열의 `push` 는 대부분 O(1)이지만, 꽉 차면 전체를 복사하느라 O(n)이 든다. 최악만 보면 "push 는 O(n)"이라 말해야 하는데, 이건 실제 체감과 맞지 않는다. **연산 n 번 전체 비용**을 따져야 정확하다.

## 핵심 아이디어

상각 비용은 **확률이 아니다.** 어떤 입력 순서로 n 번 호출해도 전체 비용이 `n × (상각 비용)` 을 넘지 않는다는 **최악 경우 보장**이다. 평균 분석(입력 분포를 가정)과 다르다.

Tarjan 이 1985년 논문 "Amortized Computational Complexity" 로 정식화했다.

## 세 가지 방법

| 방법 | 어떻게 | 동적 배열(2배 확장)에 적용 |
| --- | --- | --- |
| 집계(aggregate) | n 번 연산의 총비용 T(n) 을 구해 n 으로 나눈다 | 복사 비용 1+2+4+…+n < 2n, 쓰기 n → 총 < 3n, 1회 O(1) |
| 회계(accounting) | 싼 연산에 실제보다 높은 요금을 매겨 적립, 비싼 연산이 적립금을 쓴다 | push 마다 3원: 1원은 쓰기, 2원은 적립 → 확장 때 복사비를 적립금으로 낸다 |
| 퍼텐셜(potential) | 자료구조 상태 함수 Φ 를 정의, 상각 비용 = 실제 비용 + ΔΦ | Φ = 2·size − capacity |

## 예: 2배씩 늘어나는 배열

```ts
class DynArray<T> {
  private buf: (T | undefined)[] = new Array(1);
  private size = 0;
  copies = 0; // 관찰용: 확장 때 복사한 원소 수

  push(x: T): void {
    if (this.size === this.buf.length) {
      const next = new Array<T | undefined>(this.buf.length * 2);
      for (let i = 0; i < this.size; i++) next[i] = this.buf[i];
      this.copies += this.size;
      this.buf = next;
    }
    this.buf[this.size++] = x;
  }
}

const a = new DynArray<number>();
for (let i = 0; i < 1_000_000; i++) a.push(i);
console.log(a.copies / 1_000_000); // 1 근처: push 1회당 복사 1회 꼴
```

확장 배수를 **상수만큼 더하기**(예: +10)로 바꾸면 복사 총량이 O(n²)이 되어 상각 O(1)이 깨진다. 핵심은 **기하급수적 성장**이다.

## 상각이 쓰이는 대표 사례

| 구조·연산 | 최악 1회 | 상각 |
| --- | --- | --- |
| 동적 배열 push | O(n) | O(1) |
| 해시 테이블 삽입(리사이즈 포함) | O(n) | O(1) 기대 |
| 두 스택으로 만든 큐 dequeue | O(n) | O(1) |
| 유니온 파인드(경로 압축 + 랭크) | O(log n) | O(α(n)) |
| 스플레이 트리 연산 | O(n) | O(log n) |
| 이진 카운터 increment | O(log n) | O(1) |

## 언제 쓰나

- 처리량(throughput)이 중요한 배치·백엔드 작업에서 자료구조를 고를 때: 총 시간이 선형이면 충분하다.
- "가끔 느린 연산"이 있는 구조의 비용을 설명할 때(리사이즈, 재해시, 압축, 컴팩션).

## 주의

- **지연(latency) 보장이 아니다.** 상각 O(1) 이어도 특정 호출 하나는 O(n)이 걸린다. 실시간 시스템, 게임 프레임, p99 지연이 중요한 API 에서는 이 스파이크가 문제다. 대안: 미리 용량 확보(`reserve`, 초기 capacity), 점진적 리사이즈(incremental rehash).
- 축소 정책도 조심한다. 절반 이하로 줄면 바로 줄이고 꽉 차면 바로 늘리면, 경계에서 push/pop 을 번갈아 할 때 매번 O(n)이 된다. 보통 1/4 이하일 때 절반으로 줄인다.
- 영속(불변) 자료구조에서 같은 "옛 버전"에 비싼 연산을 반복하면 상각 논증이 깨질 수 있다.

## 실무에서

- Java `ArrayList` 문서는 `add` 가 "amortized constant time"이라고 명시한다. JS 배열, Python `list`, Go slice `append`, Rust `Vec` 모두 같은 원리로 용량을 배수로 늘린다.
- Redis 는 딕셔너리 리사이즈를 한 번에 하지 않고 이후 연산들에 나눠 하는 점진적 rehash 를 써서 지연 스파이크를 줄인다(상각을 "시간적으로 펼친" 예).
- LSM 트리 DB(RocksDB, Cassandra)의 컴팩션도 쓰기 비용을 뒤로 미뤄 상각하는 설계다.

> 참고: CLRS 4판 16장(3판 17장) "Amortized Analysis".

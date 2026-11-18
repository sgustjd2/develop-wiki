---
title: 스택·큐·덱
aka: [Stack, Queue, Deque, Double-ended Queue, LIFO, FIFO, Ring Buffer, 원형 버퍼]
category: algorithms
group: data-structure
level: beginner
summary: 넣고 빼는 위치만 제한한 목록. 스택은 나중에 넣은 것부터(LIFO), 큐는 먼저 넣은 것부터(FIFO), 덱은 양끝 모두에서 O(1)로 넣고 뺀다.
tags: [stack, queue, deque, ring-buffer, monotonic-stack]
related: [algorithms/array-dynamic-array, algorithms/linked-list, algorithms/bfs-dfs, algorithms/two-pointers-sliding-window, algorithms/heap-priority-queue, algorithms/amortized-analysis]
sources:
  - https://docs.python.org/3/library/collections.html#collections.deque
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html
  - https://cp-algorithms.com/data_structures/stack_queue_modification.html
  - https://en.wikipedia.org/wiki/Circular_buffer
updatedAt: 2026-11-18
---

## 개념

| 구조 | 넣기 | 빼기 | 순서 | 대표 용도 |
| --- | --- | --- | --- | --- |
| 스택 | push(위) | pop(위) | LIFO | 호출 스택, 괄호 검사, DFS, 실행 취소 |
| 큐 | enqueue(뒤) | dequeue(앞) | FIFO | 작업 대기열, BFS, 버퍼 |
| 덱 | 앞/뒤 | 앞/뒤 | 둘 다 | 슬라이딩 윈도우 최댓값, 0-1 BFS, 작업 훔치기 |

모든 핵심 연산이 O(1)(배열 기반이면 상각 O(1))이어야 제대로 구현한 것이다.

## 구현 선택

- **스택**: 동적 배열의 끝을 쓰면 끝. JS 는 `push`/`pop`.
- **큐**: JS 배열의 `shift()` 는 앞을 당기느라 O(n)일 수 있다. 원소가 많으면 **원형 버퍼**(ring buffer)나 두 스택 큐를 쓴다.
- **덱**: 원형 버퍼가 표준이다. Java `ArrayDeque`, Python `collections.deque`(블록 연결 구조)가 양끝 O(1)을 보장한다.

```ts
// 원형 버퍼 덱: 용량이 차면 2배로 확장
class Deque<T> {
  private buf: (T | undefined)[] = new Array(8);
  private head = 0; // 첫 원소 위치
  private size = 0;

  get length(): number { return this.size; }

  pushBack(x: T): void {
    this.ensure();
    this.buf[(this.head + this.size) % this.buf.length] = x;
    this.size++;
  }

  pushFront(x: T): void {
    this.ensure();
    this.head = (this.head - 1 + this.buf.length) % this.buf.length;
    this.buf[this.head] = x;
    this.size++;
  }

  popFront(): T | undefined {
    if (this.size === 0) return undefined;
    const x = this.buf[this.head];
    this.buf[this.head] = undefined; // GC 가 회수하도록
    this.head = (this.head + 1) % this.buf.length;
    this.size--;
    return x;
  }

  popBack(): T | undefined {
    if (this.size === 0) return undefined;
    const i = (this.head + this.size - 1) % this.buf.length;
    const x = this.buf[i];
    this.buf[i] = undefined;
    this.size--;
    return x;
  }

  peekFront(): T | undefined { return this.size ? this.buf[this.head] : undefined; }
  peekBack(): T | undefined {
    return this.size ? this.buf[(this.head + this.size - 1) % this.buf.length] : undefined;
  }

  private ensure(): void {
    if (this.size < this.buf.length) return;
    const next = new Array<T | undefined>(this.buf.length * 2);
    for (let i = 0; i < this.size; i++) next[i] = this.buf[(this.head + i) % this.buf.length];
    this.buf = next;
    this.head = 0;
  }
}
```

## 응용: 단조 스택

"각 원소의 오른쪽에서 처음으로 더 큰 값"처럼 이웃 비교 문제를 O(n)에 푼다. 스택에 **아직 답을 못 찾은 인덱스**를 감소 순서로 쌓아 두고, 더 큰 값이 오면 꺼내며 답을 채운다. 각 인덱스는 한 번 들어가고 한 번 나오므로 전체 O(n)이다.

```ts
function nextGreater(xs: readonly number[]): number[] {
  const ans = new Array<number>(xs.length).fill(-1);
  const stack: number[] = []; // 인덱스, 값은 감소 순
  xs.forEach((x, i) => {
    while (stack.length && xs[stack[stack.length - 1]] < x) ans[stack.pop()!] = x;
    stack.push(i);
  });
  return ans;
}
console.log(nextGreater([2, 1, 5, 3, 4])); // [5, 5, -1, 4, -1]
```

단조 **덱**으로는 슬라이딩 윈도우 최댓값을 구한다 → [투 포인터·슬라이딩 윈도우](/develop-wiki/knowledge/algorithms/two-pointers-sliding-window/).

## 언제 쓰나

- 스택: 중첩 구조(괄호, HTML 태그, 수식 파싱), 되돌리기, 재귀를 반복문으로 바꿀 때.
- 큐: 도착 순서대로 처리, 생산자-소비자, 레벨 순 탐색([BFS](/develop-wiki/knowledge/algorithms/bfs-dfs/)).
- 덱: 양끝에서 넣고 빼는 윈도우, 최근 N개 보관(Python `deque(maxlen=N)`).

## 주의

- **무한 큐는 메모리 폭탄이다.** 생산이 소비보다 빠르면 큐가 끝없이 자란다. 실서비스 큐는 용량 상한과 백프레셔(거절·대기·드롭 정책)를 정한다.
- 재귀의 호출 스택은 크기가 제한돼 있다(깊은 DFS → stack overflow). 깊이가 수만 이상이면 명시적 스택으로 바꾼다.
- Java `Stack` 클래스는 동기화된 `Vector` 기반의 옛 API 다. 문서는 `Deque` 구현(`ArrayDeque`)을 권한다.
- 우선순위대로 꺼내야 하면 큐가 아니라 [힙](/develop-wiki/knowledge/algorithms/heap-priority-queue/)이다.

## 실무에서

- 메시지 브로커(RabbitMQ, SQS)와 작업 큐(BullMQ, Celery)는 분산 환경의 FIFO 큐다. 순서·중복 보장 수준은 제품마다 다르다.
- 고루틴·Fork/Join 스케줄러의 작업 훔치기(work stealing)는 스레드마다 덱을 두고, 자기는 한쪽 끝, 남은 다른 쪽 끝에서 가져가는 구조다.
- 네트워크 드라이버·오디오·로그 수집기의 고정 크기 원형 버퍼, 브라우저 뒤로가기·에디터 실행 취소의 스택.

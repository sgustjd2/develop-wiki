---
title: 세마포어와 조건 변수
aka: [Semaphore, Condition Variable, Monitor, Producer-Consumer, Bounded Buffer, Mesa Semantics, Spurious Wakeup, sync.Cond]
category: cs-fundamentals
group: concurrency
level: intermediate
summary: 락만으로는 표현할 수 없는 "조건이 될 때까지 기다리기"를 위한 두 동기화 도구. 조건 변수의 while 규칙, 세마포어 초깃값 정하는 법, 생산자-소비자 예제와 흔한 실수.
tags: [concurrency, semaphore, condition-variable, producer-consumer, go, os]
related: [cs-fundamentals/race-condition-lock-deadlock, cs-fundamentals/memory-model-atomics, cs-fundamentals/actor-csp, cs-fundamentals/process-thread, performance/connection-pool, performance/rate-limiting]
sources:
  - https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf
  - https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf
updatedAt: 2026-11-18
---

## 문제

[락](/develop-wiki/knowledge/cs-fundamentals/race-condition-lock-deadlock/)은 "한 번에 하나만"을 보장한다. 하지만 많은 동기화는 **"어떤 조건이 참이 될 때까지 기다려라"** 이다.

- 큐가 비었으면 소비자는 항목이 들어올 때까지 기다린다.
- 자식 스레드가 끝날 때까지 부모가 기다린다.
- 동시에 DB 연결을 10개까지만 쓴다.

락을 쥔 채 `while (queue.empty()) {}` 로 돌면 CPU 를 태우고, 락을 쥐고 있으니 생산자는 넣지도 못한다.

## 조건 변수

조건 변수는 **잠들어 기다리는 줄**이다. 항상 락과 짝을 이룬다.

| 연산 | 의미 |
| --- | --- |
| `wait(cv, mutex)` | **락을 원자적으로 풀고** 잠든다. 깨어나면 락을 다시 잡고 돌아온다 |
| `signal(cv)` | 기다리는 스레드 하나를 깨운다 |
| `broadcast(cv)` | 모두 깨운다 |

락을 풀고 잠드는 것이 원자적이어야 하는 이유: 조건을 확인한 직후·잠들기 직전에 다른 스레드가 조건을 바꾸고 signal 하면, 그 신호를 놓치고 영원히 잔다.

### 규칙: 조건은 `if` 가 아니라 `while` 로

거의 모든 실제 시스템은 **Mesa 의미론**을 쓴다. signal 은 "조건이 바뀌었을 수 있다"는 힌트일 뿐이고, 깨어난 스레드가 락을 다시 잡기 전에 다른 스레드가 먼저 들어와 조건을 소비할 수 있다. 일부 구현은 이유 없이 깨우기도 한다(spurious wakeup). 그래서 깨어나면 **반드시 다시 확인**한다.

```go
// Go: 용량 제한 큐 (생산자-소비자). 조건 변수 두 개 + while
type BoundedQueue struct {
	mu                 sync.Mutex
	notEmpty, notFull  *sync.Cond
	items              []int
	cap                int
}

func NewBoundedQueue(n int) *BoundedQueue {
	q := &BoundedQueue{cap: n}
	q.notEmpty, q.notFull = sync.NewCond(&q.mu), sync.NewCond(&q.mu)
	return q
}

func (q *BoundedQueue) Put(v int) {
	q.mu.Lock()
	for len(q.items) == q.cap { q.notFull.Wait() }   // if 가 아니라 for(while)
	q.items = append(q.items, v)
	q.notEmpty.Signal()                               // 소비자만 깨운다
	q.mu.Unlock()
}

func (q *BoundedQueue) Take() int {
	q.mu.Lock()
	for len(q.items) == 0 { q.notEmpty.Wait() }
	v := q.items[0]; q.items = q.items[1:]
	q.notFull.Signal()                                // 생산자만 깨운다
	q.mu.Unlock()
	return v
}
```

조건 변수를 **하나만** 쓰면, 소비자가 깨워야 할 생산자 대신 다른 소비자를 깨워 모두 잠드는 상황이 생긴다. 대기 이유별로 조건 변수를 나눈다. 누구를 깨워야 할지 모르면 `broadcast` 로 모두 깨워 각자 다시 확인하게 한다(정확하지만 비싸다).

## 세마포어

세마포어는 **정수 하나 + 대기열**이다(Dijkstra).

| 연산 | 의미 |
| --- | --- |
| `wait` (P, acquire) | 값을 1 줄이고, 결과가 음수면 잠든다 |
| `post` (V, release) | 값을 1 늘리고, 기다리는 스레드가 있으면 하나 깨운다 |

**초깃값 정하는 법** (OSTEP 이 소개하는 요령): "초기화 직후 바로 내줄 수 있는 자원이 몇 개인가?"

| 용도 | 초깃값 | 예 |
| --- | --- | --- |
| 락(이진 세마포어) | 1 | 임계 구역 하나 |
| 순서 맞추기 | 0 | 자식이 끝나면 post, 부모는 wait |
| 개수 제한(throttling) | N | 동시 연결 N 개, 메모리 많이 쓰는 작업 N 개 |

```ts
// TypeScript: 비동기 작업 동시 실행 수 제한 (카운팅 세마포어)
class Semaphore {
  private waiters: (() => void)[] = [];
  constructor(private permits: number) {}
  async acquire() {
    if (this.permits > 0) { this.permits--; return; }
    await new Promise<void>((r) => this.waiters.push(r)); // 허가를 직접 넘겨받음
  }
  release() {
    const next = this.waiters.shift();
    if (next) next(); else this.permits++;
  }
}

const sem = new Semaphore(5);
await Promise.all(urls.map(async (u) => {
  await sem.acquire();
  try { return await fetch(u); } finally { sem.release(); }
}));
```

### 세마포어로 생산자-소비자: 순서 함정

`empty`(초깃값 N), `full`(0), `mutex`(1) 세 개로 만든다. 이때 **mutex 를 먼저 잡고 `wait(empty)` 하면 데드락**이다. 소비자가 mutex 를 쥔 채 `full` 을 기다리면 생산자는 mutex 를 못 잡아 영원히 못 넣는다. 자원 세마포어를 먼저 기다리고, mutex 는 실제 버퍼를 만지는 구간만 감싼다.

## 비교

| | 뮤텍스 | 조건 변수 | 세마포어 |
| --- | --- | --- | --- |
| 표현하는 것 | 상호 배제 | 임의의 조건 대기 | 개수(자원) 대기 |
| 상태 | 잠김/풀림 | 없음 (신호를 기억 안 함) | 정수 (post 를 기억함) |
| 소유자 | 잡은 스레드가 풀어야 함 | — | 아무 스레드나 post 가능 |
| 맞는 곳 | 공유 데이터 보호 | 복잡한 조건 (큐 상태, 여러 변수 조합) | 동시 실행 수 제한, 단순 순서 |

조건 변수는 signal 할 때 기다리는 이가 없으면 신호가 **사라진다**. 세마포어는 값으로 남는다. 그래서 조건 변수는 항상 "공유 상태 + 락 + while" 세트로 쓴다.

## 언제 쓰나

- 라이브러리가 제공하는 고수준 도구가 먼저다: 블로킹 큐(Java `BlockingQueue`), Go 채널, `errgroup.SetLimit`, `p-limit`. 내부가 이 원리로 되어 있다.
- 직접 쓸 때: 커넥션 풀·워커 풀의 동시성 제한(세마포어), 여러 조건이 얽힌 대기(조건 변수).

## 주의

- `wait` 를 `if` 로 감싸는 것이 가장 흔한 버그다. 항상 `while`.
- signal 은 락을 쥔 채 보내는 것이 안전하다(OSTEP 권장). 조건을 바꾼 것과 신호가 어긋나지 않는다.
- 세마포어는 소유 개념이 없어 "누가 release 를 빼먹었나"를 추적하기 어렵다. `try/finally` 로 반드시 짝을 맞춘다.
- 읽기-쓰기 락을 세마포어로 단순하게 만들면 읽기가 계속 들어올 때 쓰기가 굶는다(starvation).
- Go 에서는 `sync.Cond` 보다 채널이 대부분 더 읽기 쉽다. [액터·CSP](/develop-wiki/knowledge/cs-fundamentals/actor-csp/) 참고.

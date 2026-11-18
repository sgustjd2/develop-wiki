---
title: 경쟁 조건·락·데드락
aka: [Race Condition, Data Race, Mutex, Lock, Deadlock, Atomicity Violation, Order Violation, Critical Section]
category: cs-fundamentals
group: concurrency
level: intermediate
summary: 여러 실행 흐름이 공유 상태를 동시에 다룰 때 결과가 실행 순서에 따라 달라지는 경쟁 조건과, 이를 막는 락, 락이 만드는 데드락의 조건과 예방법.
tags: [concurrency, race-condition, mutex, deadlock, go, nodejs]
related: [cs-fundamentals/memory-model-atomics, cs-fundamentals/process-thread, cs-fundamentals/actor-csp, cs-fundamentals/async-vs-threads, data-modeling/transaction-isolation]
sources:
  - https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
  - https://go.dev/ref/mem
updatedAt: 2026-11-18
---

## 문제: 읽고-계산하고-쓰기

`count++` 는 한 줄이지만 실제로는 "읽기 → 더하기 → 쓰기" 세 단계다.

```
스레드 A            스레드 B            count
read 41                                 41
                    read 41             41
write 42                                42
                    write 42            42   ← 두 번 더했는데 1만 증가
```

| 용어 | 뜻 |
| --- | --- |
| 경쟁 조건(race condition) | 결과가 실행 타이밍에 따라 달라지는 버그 일반 |
| 데이터 레이스(data race) | 동기화 없이 같은 메모리에 동시 접근하고 그중 하나가 쓰기 (Go 메모리 모델의 정의). 언어에 따라 결과가 정의되지 않음 |
| 임계 구역 | 한 번에 하나만 실행되어야 하는 코드 구간 |

OSTEP 이 인용한 Lu 등(2008)의 연구에서, 데드락이 아닌 동시성 버그의 대부분(97%)은 두 유형이었다.

- **원자성 위반**: 함께 실행돼야 할 단계 사이에 다른 스레드가 끼어듦 (`if (p) use(p)` 사이에 `p = null`).
- **순서 위반**: A 가 B 보다 먼저라는 가정이 보장되지 않음 (초기화 전에 사용).

## 해법: 락

```go
type Counter struct {
	mu sync.Mutex
	n  int
}

func (c *Counter) Inc() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.n++ // 임계 구역
}
```

- 락은 임계 구역을 **상호 배제**로 만든다. 같은 데이터는 **항상 같은 락**으로 보호해야 의미가 있다.
- 읽기가 대부분이면 RWMutex, 단순 카운터는 [원자 연산](/develop-wiki/knowledge/cs-fundamentals/memory-model-atomics/)이 더 싸다.
- 순서 위반은 락만으로 안 풀린다. 조건 변수, 채널, `WaitGroup`, Promise 처럼 "기다림"을 표현하는 도구를 쓴다.

## 단일 스레드 JS 에도 경쟁 조건이 있다

이벤트 루프는 데이터 레이스는 없지만 `await` 사이에 다른 작업이 끼어든다.

```ts
// 버그: 두 요청이 동시에 오면 둘 다 잔액 100 을 읽고 각자 차감
async function withdraw(id: string, amount: number) {
  const { balance } = await db.getAccount(id);   // ← 여기서 양보
  if (balance < amount) throw new Error('잔액 부족');
  await db.setBalance(id, balance - amount);     // 갱신 손실
}
// 해결: 조건부 원자적 UPDATE (… SET balance = balance - $1 WHERE id = $2 AND balance >= $1)
```

여러 프로세스·서버가 같은 데이터를 다루면 메모리 락은 소용없다. DB 의 원자적 갱신·행 잠금·낙관적 잠금을 쓴다. [트랜잭션 격리 수준](/develop-wiki/knowledge/data-modeling/transaction-isolation/) 참고.

## 데드락

### 네 가지 조건 (Coffman 등, 1971)

네 가지가 **모두** 성립해야 데드락이 생긴다. 하나만 깨면 예방된다.

| 조건 | 뜻 | 깨는 방법 |
| --- | --- | --- |
| 상호 배제 | 자원을 한 번에 하나만 가짐 | 락 없는(lock-free) 자료구조, 원자 연산 |
| 점유 대기(hold-and-wait) | 하나를 쥔 채 다른 것을 기다림 | 필요한 락을 한꺼번에 획득 |
| 비선점 | 남이 쥔 락을 뺏을 수 없음 | `tryLock` 실패 시 가진 락을 놓고 재시도 |
| 순환 대기 | A→B, B→A 처럼 원형으로 기다림 | **전역 락 순서**를 정함 (가장 실용적) |

```go
// 계좌 이체: 항상 ID 가 작은 계좌의 락부터 → 순환 대기 불가
func transfer(a, b *Account, amt int) {
	first, second := a, b
	if b.ID < a.ID {
		first, second = b, a
	}
	first.mu.Lock(); defer first.mu.Unlock()
	second.mu.Lock(); defer second.mu.Unlock()
	a.bal -= amt; b.bal += amt
}
```

OSTEP 은 큰 시스템에서는 모듈 경계 때문에 락 순서가 숨어 있어(캡슐화된 라이브러리 내부 락) 데드락이 자연스럽게 생긴다고 지적한다.

## 개발자에게 왜 중요한가

- 동시성 버그는 테스트에서 재현이 어렵고 부하가 걸릴 때만 나타난다. 도구로 잡는다: Go `go test -race`(ThreadSanitizer 기반), Java 스레드 덤프, DB 의 데드락 로그.
- 데드락은 DB 에서도 똑같이 생긴다. 여러 행을 갱신하는 트랜잭션은 **같은 순서**(예: PK 오름차순)로 접근한다.

## 주의 (비용)

- 락을 쥔 채 I/O·네트워크 호출·콜백 호출을 하지 않는다. 대기 시간이 길어지고 데드락 경로가 늘어난다.
- 락이 너무 굵으면 병렬성이 사라지고, 너무 잘면 순서 관리가 어려워진다. 먼저 굵게 맞추고 측정 후 쪼갠다.
- 라이브락(서로 양보만 반복)과 기아(starvation)도 같은 계열의 문제다. 재시도에는 무작위 지연을 섞는다.
- 공유 상태 자체를 없애는 설계([액터·CSP](/develop-wiki/knowledge/cs-fundamentals/actor-csp/))가 락보다 나은 경우가 많다.

---
title: 메모리 모델과 원자 연산
aka: [Memory Model, Happens-before, Atomic Operations, Memory Ordering, Acquire/Release, Sequential Consistency, CAS, DRF-SC]
category: cs-fundamentals
group: concurrency
level: advanced
summary: 한 스레드의 쓰기가 다른 스레드에 언제, 어떤 순서로 보이는지를 언어가 약속하는 규칙. 컴파일러·CPU 의 재배치 때문에 직관과 다른 결과가 나오며, 원자 연산과 동기화가 그 경계를 만든다.
tags: [concurrency, memory-model, atomics, go, cpp, javascript, lock-free]
related: [cs-fundamentals/race-condition-lock-deadlock, cs-fundamentals/actor-csp, cs-fundamentals/cpu-cache-locality, cs-fundamentals/process-thread]
sources:
  - https://go.dev/ref/mem
  - https://en.cppreference.com/w/cpp/atomic/memory_order
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics
updatedAt: 2026-11-18
---

## 문제: 코드 순서 ≠ 관찰 순서

```go
var data int
var ready bool

go func() { data = 42; ready = true }()   // 쓰기 순서: data → ready
for !ready {}                              // 다른 고루틴
fmt.Println(data)                          // 0 이 나올 수도, 루프가 안 끝날 수도
```

- 컴파일러는 한 스레드 안에서 결과가 같으면 명령을 재배치하거나, `ready` 를 레지스터에 올려 다시 읽지 않을 수 있다.
- CPU 는 쓰기 버퍼·캐시 때문에 다른 코어에 쓰기가 다른 순서로 보이게 할 수 있다. cppreference 는 x86 은 강한 순서(대부분 acquire/release 가 공짜), ARM·POWER 는 약한 순서(펜스 명령 필요)라고 설명한다.

**메모리 모델**은 이 혼란 속에서 언어가 보장하는 최소한을 정한다.

## 핵심 개념

| 개념 | 뜻 |
| --- | --- |
| happens-before | A 의 효과가 B 에서 반드시 보이는 관계. 같은 스레드의 프로그램 순서 + 동기화로 생김 |
| 데이터 레이스 | 동기화 없이 같은 위치에 동시 접근, 하나 이상이 쓰기 |
| DRF-SC | 데이터 레이스가 없는 프로그램은 순차적 일관성(한 코어에서 번갈아 실행한 것처럼)을 보장받음. Go 메모리 모델이 명시 |
| 원자 연산 | 중간 상태가 보이지 않는 읽기·쓰기·RMW(`add`, `compareAndSwap`) |

Go 문서의 조언은 짧다. 여러 고루틴이 수정하는 데이터는 채널·`sync`·`sync/atomic` 으로 직렬화하라, 그리고 "영리하게 굴지 말라". 레이스가 있는 프로그램은 구현이 레이스를 보고하고 멈출 수도 있고(`-race`), 여러 워드 크기 값(슬라이스, 인터페이스, 맵)의 레이스는 메모리 손상까지 갈 수 있다.

## 메모리 순서 (C++ 기준 용어)

| 순서 | 보장 | 쓰임 |
| --- | --- | --- |
| `relaxed` | 그 변수 자체의 원자성만. 주변 접근과 순서 관계 없음 | 통계 카운터 |
| `release` (쓰기) | 이 쓰기 **이전**의 모든 쓰기가, acquire 로 이 값을 읽은 스레드에 보임 | 데이터 게시 |
| `acquire` (읽기) | 이 읽기 **이후**의 접근이 앞으로 당겨지지 않음 | 게시된 데이터 소비 |
| `acq_rel` | RMW 에서 둘 다 | 락 구현 |
| `seq_cst` (기본) | 모든 seq_cst 연산이 하나의 전역 순서에 동의 | 기본값, 가장 비쌈 |

Go 의 `sync/atomic`, JavaScript 의 `Atomics` 는 순차적 일관(seq_cst)으로 동작한다고 보면 된다(Go 메모리 모델은 이를 명시한다).

```go
// 올바른 게시: atomic.Bool 이 happens-before 를 만든다
var data int
var ready atomic.Bool

go func() { data = 42; ready.Store(true) }()
for !ready.Load() { runtime.Gosched() }
fmt.Println(data) // 항상 42
```

## JavaScript 에서

메인 스레드와 워커는 기본적으로 메시지를 **복사**하므로 메모리 모델을 신경 쓸 일이 없다. `SharedArrayBuffer` 로 메모리를 공유하는 순간 같은 문제가 생기고, `Atomics` 로 해결한다.

```ts
// 워커 간 공유 카운터
const sab = new SharedArrayBuffer(4);
const counter = new Int32Array(sab);
Atomics.add(counter, 0, 1);            // 원자적 증가 (일반 counter[0]++ 는 레이스)
Atomics.wait(counter, 0, 0);           // 값이 0 인 동안 대기 (워커에서만, 메인 스레드는 대개 금지)
Atomics.notify(counter, 0, 1);         // 기다리는 쪽 하나 깨움
```

브라우저에서 `SharedArrayBuffer` 는 교차 출처 격리(COOP/COEP 헤더)가 필요하다.

## 개발자에게 왜 중요한가

- "그냥 bool 플래그 하나인데"라는 코드가 최적화 빌드나 ARM 서버(Graviton, Apple Silicon)에서만 깨진다.
- **이중 확인 잠금(double-checked locking)** 같은 영리한 패턴은 메모리 모델을 정확히 알아야 안전하다. 언어가 제공하는 `sync.Once`, `lazy`, 정적 초기화를 쓴다.
- 원자 연산은 락보다 싸지만 공짜가 아니다. 같은 캐시 라인을 여러 코어가 두드리면 캐시 일관성 트래픽으로 느려진다. [CPU 캐시](/develop-wiki/knowledge/cs-fundamentals/cpu-cache-locality/) 참고.

## 언제 쓰나

- 원자 연산: 카운터, 플래그, 한 번 게시하는 포인터, 락 없는 자료구조의 부품.
- 그 이상(여러 변수를 함께 일관되게 바꾸기)은 뮤텍스나 채널. 원자 변수 두 개는 원자적인 한 쌍이 아니다.

## 주의

- `relaxed`·acquire/release 를 고르는 최적화는 측정으로 이득이 확인되고, 정확성을 리뷰할 사람이 있을 때만 한다.
- Java `volatile`, C# `volatile`, C/C++ `volatile` 은 의미가 다르다. C/C++ `volatile` 은 스레드 동기화 도구가 아니다.
- 레이스 탐지기(Go `-race`, ThreadSanitizer)를 CI 테스트에 켠다. 실행된 경로만 잡으므로 동시성 테스트를 따로 둔다.
